import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count, error } = await supabaseAdmin
      .schema("sales")
      .from("m_affiliator")
      .select("id", { count: "exact", head: true })
      .gte("created_at", startOfMonth)
      .lt("created_at", startOfNextMonth);

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data hitungan affiliator.", 500, error.message);
    }

    return ok({ count: count ?? 0 });
  } catch (error: any) {
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan internal", 500, error.message);
  }
}
