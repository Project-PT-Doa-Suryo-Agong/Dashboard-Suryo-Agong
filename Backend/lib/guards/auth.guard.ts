import { fail } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/services/profile.service";
import { buildAccessSummary, canAccessCluster } from "@/lib/access/policy";
import type { AccessLevel } from "@/types/access";

export type AuthContext = {
  userId: string;
  role: string | null;
  division: string | null;
  jabatan: string;
  accessLevel: AccessLevel;
  supabase: ReturnType<typeof createSupabaseServerClient>;
};

/**
 * Verify auth session and return user context.
 */
export async function requireAuth(): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }
> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      response: fail("UNAUTHORIZED", "Sesi tidak valid atau belum login.", 401),
    };
  }

  const { data: profile } = await getProfileById(supabase, data.user.id);
  const access = buildAccessSummary({
    role: profile?.role ?? null,
    division: null,
    fullName: profile?.nama ?? null,
    jobTitle: (data.user.user_metadata?.job_title as string | undefined) ?? null,
  });

  return {
    ok: true,
    ctx: {
      userId: data.user.id,
      role: profile?.role ?? null,
      division: null,
      jabatan: access.jabatan,
      accessLevel: access.level,
      supabase,
    },
  };
}

/**
 * Verify auth + check that user has one of the allowed roles.
 */
export async function requireRole(...allowedRoles: string[]): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const { ctx } = auth;

  if (!ctx.role || !allowedRoles.includes(ctx.role)) {
    return {
      ok: false,
      response: fail(
        "FORBIDDEN",
        `Akses ditolak. Role yang dibutuhkan: ${allowedRoles.join(", ")}.`,
        403
      ),
    };
  }

  return { ok: true, ctx };
}

/**
 * Verify auth + check access level.
 */
export async function requireLevel(...allowedLevels: AccessLevel[]): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const { ctx } = auth;
  if (!allowedLevels.includes(ctx.accessLevel)) {
    return {
      ok: false,
      response: fail(
        "FORBIDDEN",
        `Akses ditolak. Level yang dibutuhkan: ${allowedLevels.join(", ")}.`,
        403
      ),
    };
  }

  return { ok: true, ctx };
}

/**
 * Verify auth + check whether user level can access a given menu cluster.
 */
export async function requireClusterAccess(clusterKey: string): Promise<
  | { ok: true; ctx: AuthContext }
  | { ok: false; response: Response }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const { ctx } = auth;
  if (!canAccessCluster(ctx.accessLevel, clusterKey)) {
    return {
      ok: false,
      response: fail(
        "FORBIDDEN",
        `Akses ditolak untuk cluster '${clusterKey}' pada level ${ctx.accessLevel}.`,
        403
      ),
    };
  }

  return { ok: true, ctx };
}
