import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { count, error } = await (auth.ctx.supabase as any).schema("hr")
      .from("m_karyawan")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth)
      .lt("created_at", startOfNextMonth);

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data hitungan karyawan.", 500, error.message);
    }

    return ok({ count: count ?? 0 });
  } catch (error: any) {
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan internal", 500, error.message);
  }
}
