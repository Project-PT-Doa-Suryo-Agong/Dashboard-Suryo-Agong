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
  const financeDb = (supabaseAdmin as any).schema("finance");
  const managementDb = (supabaseAdmin as any).schema("management");

  // ── Pendapatan & Pengeluaran: dari LEDGER (t_journal_item ⋈ m_coa), periode ──
  const { data: items, error: itemsError } = await financeDb
    .from("t_journal_item")
    .select(`
      debit,
      kredit,
      m_coa!inner(kode_akun, kategori),
      t_journal!inner(tanggal)
    `)
    .gte("t_journal.tanggal", startDate)
    .lte("t_journal.tanggal", endDate);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  let totalPendapatan = 0;
  let totalPengeluaran = 0;
  for (const item of (items ?? []) as any[]) {
    const coa = item.m_coa;
    if (!coa || !coa.kategori) continue;
    if (coa.kategori.startsWith("Pendapatan")) {
      totalPendapatan += Number(item.kredit ?? 0) - Number(item.debit ?? 0);
    } else if (coa.kategori.startsWith("Beban")) {
      totalPengeluaran += Number(item.debit ?? 0) - Number(item.kredit ?? 0);
    }
  }

  // ── Budget approved (periode, via management.t_budget_request) ──
  const { data: budgetRows, error: budgetError } = await managementDb
    .from("t_budget_request")
    .select("amount, created_at")
    .eq("status", "approved");

  if (budgetError) {
    throw new Error(budgetError.message);
  }

  let totalBudget = 0;
  for (const b of (budgetRows ?? []) as any[]) {
    const tgl = String(b.created_at ?? "").slice(0, 10);
    if (tgl >= startDate && tgl <= endDate) {
      totalBudget += Number(b.amount ?? 0);
    }
  }

  // ── Saldo ledger per COA (kumulatif s.d. end_date) ──
  //    total_payroll : Beban Gaji (5101) periode
  //    total_aset    : Aset Tetap (1400) kumulatif
  //    total_piutang : Piutang Usaha (1201) kumulatif
  //    total_utang   : Utang Usaha (2101) kumulatif
  //    total_kasbon  : Piutang Karyawan (1202) kumulatif
  const { data: balanceRows, error: balanceError } = await financeDb
    .from("t_journal_item")
    .select(`
      debit,
      kredit,
      m_coa!inner(kode_akun),
      t_journal!inner(tanggal)
    `)
    .in("m_coa.kode_akun", ["5101", "1400", "1201", "2101", "1202"])
    .lte("t_journal.tanggal", endDate);

  if (balanceError) {
    throw new Error(balanceError.message);
  }

  let totalPayroll = 0;
  let totalAset = 0;
  let totalPiutang = 0;
  let totalUtang = 0;
  let totalKasbon = 0;
  for (const item of (balanceRows ?? []) as any[]) {
    const kode = item.m_coa?.kode_akun;
    if (!kode) continue;
    const jumlah =
      kode === "2101"
        ? Number(item.kredit ?? 0) - Number(item.debit ?? 0)
        : Number(item.debit ?? 0) - Number(item.kredit ?? 0);
    const tanggal = String(item.t_journal?.tanggal ?? "");
    if (kode === "5101" && tanggal >= startDate) totalPayroll += jumlah;
    else if (kode === "1400") totalAset += jumlah;
    else if (kode === "1201") totalPiutang += jumlah;
    else if (kode === "2101") totalUtang += jumlah;
    else if (kode === "1202") totalKasbon += jumlah;
  }

  const budgetTerserap = totalPengeluaran;
  const budgetPercentage = totalBudget > 0 ? Math.round((totalPengeluaran / totalBudget) * 10000) / 100 : 0;

  return {
    total_pendapatan: totalPendapatan,
    total_pengeluaran: totalPengeluaran,
    saldo_bersih: totalPendapatan - totalPengeluaran,
    total_budget: totalBudget,
    budget_terserap: budgetTerserap,
    budget_percentage: budgetPercentage,
    total_payroll: totalPayroll,
    total_aset: totalAset,
    total_piutang: totalPiutang,
    total_utang: totalUtang,
    total_kasbon: totalKasbon,
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
