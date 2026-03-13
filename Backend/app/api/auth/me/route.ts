import { fail, ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/services/profile.service";
import { buildAccessSummary } from "@/lib/access/policy";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return fail("UNAUTHORIZED", "Sesi tidak valid atau belum login.", 401, error.message);
  }

  if (!data.user) {
    return fail("UNAUTHORIZED", "User tidak ditemukan.", 401);
  }

  const { data: profile } = await getProfileById(supabase, data.user.id);
  const access = buildAccessSummary({
    role: profile?.role ?? null,
    division: null,
    fullName: profile?.nama ?? null,
    jobTitle: (data.user.user_metadata?.job_title as string | undefined) ?? null,
  });

  return ok({
    id: data.user.id,
    email: data.user.email,
    role: data.user.role,
    profileRole: profile?.role ?? null,
    division: null,
    accessLevel: access.level,
    jabatan: access.jabatan,
  });
}
