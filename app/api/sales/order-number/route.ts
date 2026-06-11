import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  try {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = `ORD-${mm}${yy}-`;

    // Fetch the latest order number matching the prefix
    const { data, error } = await supabaseAdmin
      .schema("sales" as any)
      .from("t_sales_order")
      .select("order_number")
      .like("order_number", `${prefix}%`)
      .order("order_number", { ascending: false })
      .limit(1);

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data hitungan sales order.", 500, error.message);
    }

    let maxSeq = 0;
    if (data && data.length > 0 && data[0].order_number) {
      const parts = data[0].order_number.split('-');
      const seqStr = parts[parts.length - 1];
      const parsedSeq = parseInt(seqStr, 10);
      if (!isNaN(parsedSeq)) {
        maxSeq = parsedSeq;
      }
    }

    // Since frontend does count + 1, we return maxSeq as the count
    return ok({ count: maxSeq });
  } catch (error: any) {
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan internal", 500, error.message);
  }
}
