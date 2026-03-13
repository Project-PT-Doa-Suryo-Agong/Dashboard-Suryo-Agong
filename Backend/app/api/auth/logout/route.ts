import { fail, ok } from "@/lib/http/response";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return fail("AUTH_ERROR", "Gagal logout.", 500, error.message);
  }

  return ok(null, "Logout berhasil.");
}
