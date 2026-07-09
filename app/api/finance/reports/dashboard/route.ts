import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

type DashboardMetrics = {
  total_pendapatan: number;
  total_pengeluaran: number;
  saldo_bersih: number;
  total_budget: number;
  budget_terserap: number;
  budget_percentage: number;
  total_payroll: number;
  total_aset: number;
  total_piutang: number;
  total_utang: number;
  total_kasbon: number;
};

async function getDashboardMetrics(startDate: string, endDate: string): Promise<DashboardMetrics> {
  const { data, error } = await supabaseAdmin.rpc("fn_dashboard_metrics", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    throw new Error(error.message);
  }

  const row = (data ?? [])[0] || {};

  return {
    total_pendapatan: Number(row.total_pendapatan ?? 0),
    total_pengeluaran: Number(row.total_pengeluaran ?? 0),
    saldo_bersih: Number(row.saldo_bersih ?? 0),
    total_budget: Number(row.total_budget ?? 0),
    budget_terserap: Number(row.budget_terserap ?? 0),
    budget_percentage: Number(row.budget_percentage ?? 0),
    total_payroll: Number(row.total_payroll ?? 0),
    total_aset: Number(row.total_aset ?? 0),
    total_piutang: Number(row.total_piutang ?? 0),
    total_utang: Number(row.total_utang ?? 0),
    total_kasbon: Number(row.total_kasbon ?? 0),
  };
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!startDate || !endDate) {
    return fail(ErrorCode.VALIDATION_ERROR, "Parameter start_date dan end_date wajib diisi.", 400);
  }

  try {
    const data = await getDashboardMetrics(startDate, endDate);
    return ok(data);
  } catch (error: any) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data dashboard.", 500, error?.message);
  }
}
