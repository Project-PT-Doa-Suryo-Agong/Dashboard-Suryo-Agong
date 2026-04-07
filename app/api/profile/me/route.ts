import { fail, ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileById, updateOwnProfile } from "@/lib/services/profile.service";
import { parseUpdateOwnProfileInput } from "@/lib/validation/profile";
import { ErrorCode } from "@/lib/http/error-codes";

async function getAuthenticatedUserId() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { ok: false as const, reason: "UNAUTHORIZED" as const };
  }

  return { ok: true as const, userId: data.user.id, supabase };
}

export async function GET() {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return fail(ErrorCode.UNAUTHORIZED, "Sesi tidak valid atau belum login.", 401);
  }

  const { data, error } = await getProfileById(auth.supabase, auth.userId);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data profil.", 500, error.message);
  }

  return ok({ profile: data });
}

export async function PUT(request: Request) {
  const auth = await getAuthenticatedUserId();
  if (!auth.ok) {
    return fail(ErrorCode.UNAUTHORIZED, "Sesi tidak valid atau belum login.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
  }

  const parsed = parseUpdateOwnProfileInput(body);
  if (!parsed.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
  }

  const { data, error } = await updateOwnProfile(auth.supabase, auth.userId, parsed.data);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal memperbarui profil.", 500, error.message);
  }

  return ok({ profile: data }, "Profil berhasil diperbarui.");
}
