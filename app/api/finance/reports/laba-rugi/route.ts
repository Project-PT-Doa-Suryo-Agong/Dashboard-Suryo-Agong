import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

type LabaRugiItem = {
  kode_akun: string;
  nama_akun: string;
  kategori: string;
  saldo: number;
};

type LabaRugiResponse = {
  pendapatan: LabaRugiItem[];
  beban: LabaRugiItem[];
  total_pendapatan: number;
  total_beban: number;
  laba_bersih: number;
};

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
    const financeDb = (supabaseAdmin as any).schema("finance");

    const result = await financeDb
      .from("t_journal_item")
      .select(`
        debit,
        kredit,
        m_coa!inner(kode_akun, nama_akun, kategori),
        t_journal!inner(tanggal)
      `)
      .gte("t_journal.tanggal", startDate)
      .lte("t_journal.tanggal", endDate);

    if (result.error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data laba rugi.", 500, result.error.message);
    }

    const items = (result.data ?? []) as any[];
    const grouped: Record<string, { kode_akun: string; nama_akun: string; kategori: string; saldo: number }> = {};

    for (const item of items) {
      const coa = item.m_coa;
      if (!coa || !coa.kategori) continue;
      if (!["Pendapatan", "Beban", "Beban Lain-lain"].includes(coa.kategori)) continue;

      const key = coa.kode_akun;
      if (!grouped[key]) {
        grouped[key] = {
          kode_akun: coa.kode_akun,
          nama_akun: coa.nama_akun,
          kategori: coa.kategori,
          saldo: 0,
        };
      }
      grouped[key].saldo += Number(item.kredit ?? 0) - Number(item.debit ?? 0);
    }

    const allItems = Object.values(grouped);
    const pendapatan = allItems.filter((i) => i.kategori === "Pendapatan");
    const beban = allItems.filter((i) => i.kategori === "Beban" || i.kategori === "Beban Lain-lain");

    const totalPendapatan = pendapatan.reduce((s, i) => s + i.saldo, 0);
    const totalBeban = beban.reduce((s, i) => s + i.saldo, 0);

    const response: LabaRugiResponse = {
      pendapatan,
      beban,
      total_pendapatan: totalPendapatan,
      total_beban: totalBeban,
      laba_bersih: totalPendapatan + totalBeban,
    };

    return ok(response);
  } catch (error: any) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data laba rugi.", 500, error?.message);
  }
}
