import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data, error } = await supabaseAdmin.rpc("count_produksi_orders_this_month", {
      start_of_month: startOfMonth,
      start_of_next_month: startOfNextMonth,
    });

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data hitungan produksi order.", 500, error.message);
    }

    return ok({ count: (data as number) ?? 0 });
  } catch (error: any) {
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan internal", 500, error.message);
  }
}
