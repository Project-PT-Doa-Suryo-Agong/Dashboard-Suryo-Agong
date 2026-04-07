import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ErrorCode } from "@/lib/http/error-codes";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient, schema: string) => (client as unknown as SchemaClient).schema(schema);

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const supabase = auth.ctx.supabase;

    const [{ count: employeeCount }, { count: activeOrderCount }] = await Promise.all([
      db(supabase, "hr").from("m_karyawan").select("id", { count: "exact", head: true }),
      db(supabase, "production")
        .from("t_produksi_order")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "ongoing"]),
    ]);

    const { start, end } = getMonthBounds(new Date());
    const { data: liveRows } = await db(supabase, "sales")
      .from("t_live_performance")
      .select("revenue, created_at")
      .gte("created_at", start)
      .lt("created_at", end);

    const rows = (liveRows ?? []) as Array<{ revenue: number | null }>;
    const pendapatanBulanIni = rows.reduce((sum, row) => sum + (row.revenue ?? 0), 0);

    return ok({
      totalKaryawan: employeeCount ?? 0,
      pendapatanBulanIni,
      pesananAktif: activeOrderCount ?? 0,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan internal server.",
      500
    );
  }
}
