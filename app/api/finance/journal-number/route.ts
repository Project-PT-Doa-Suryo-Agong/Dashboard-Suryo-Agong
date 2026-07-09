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

    const financeDb = (supabaseAdmin as any).schema("finance");

    const { data, error } = await financeDb
      .from("t_journal")
      .select("journal_number")
      .not("journal_number", "is", null)
      .gte("created_at", startOfMonth)
      .lt("created_at", startOfNextMonth)
      .order("journal_number", { ascending: false })
      .limit(1);

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data hitungan jurnal.", 500, error.message);
    }

    let lastSeq = 0;
    if (data && data.length > 0 && data[0].journal_number) {
      const parts = (data[0].journal_number as string).split("-");
      if (parts.length === 3) {
        lastSeq = parseInt(parts[2], 10) || 0;
      }
    }

    return ok({ count: lastSeq });
  } catch (error: any) {
    return fail(ErrorCode.INTERNAL_ERROR, "Terjadi kesalahan internal", 500, error.message);
  }
}
