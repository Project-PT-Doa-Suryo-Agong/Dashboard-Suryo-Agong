import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

type NeracaItem = {
  kode_akun: string;
  nama_akun: string;
  saldo: number;
  is_system?: boolean;
};

type NeracaResponse = {
  aset: NeracaItem[];
  liabilitas: NeracaItem[];
  ekuitas: NeracaItem[];
  total_aset: number;
  total_liabilitas: number;
  total_ekuitas: number;
  is_balanced: boolean;
  difference: number;
  labaBerjalan: number;
};

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const asOfDate = url.searchParams.get("as_of_date") || new Date().toISOString().slice(0, 10);

  try {
    const financeDb = (supabaseAdmin as any).schema("finance");

    const { data: items, error: itemsError } = await financeDb
      .from("t_journal_item")
      .select(`
        debit,
        kredit,
        m_coa!inner(kode_akun, nama_akun, kategori),
        t_journal!inner(tanggal)
      `)
      .lte("t_journal.tanggal", asOfDate);

    if (itemsError) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data neraca.", 500, itemsError.message);
    }

    const grouped: Record<string, { kode_akun: string; nama_akun: string; kategori: string; saldo: number }> = {};
    let totalPendapatan = 0;
    let totalBeban = 0;

    for (const item of (items ?? []) as any[]) {
      const coa = item.m_coa;
      if (!coa || !coa.kategori) continue;

      const key = coa.kode_akun;
      if (!grouped[key]) {
        grouped[key] = {
          kode_akun: coa.kode_akun,
          nama_akun: coa.nama_akun,
          kategori: coa.kategori,
          saldo: 0,
        };
      }

      if (coa.kategori === "Aset") {
        grouped[key].saldo += Number(item.debit ?? 0) - Number(item.kredit ?? 0);
      } else if (coa.kategori === "Liabilitas" || coa.kategori === "Ekuitas") {
        grouped[key].saldo += Number(item.kredit ?? 0) - Number(item.debit ?? 0);
      } else if (coa.kategori.startsWith("Pendapatan")) {
        totalPendapatan += Number(item.kredit ?? 0) - Number(item.debit ?? 0);
      } else if (coa.kategori.startsWith("Beban")) {
        totalBeban += Number(item.debit ?? 0) - Number(item.kredit ?? 0);
      }
    }

    const netIncome = totalPendapatan - totalBeban;

    const allItems = Object.values(grouped)
      .filter((i) => i.saldo !== 0)
      .sort((a, b) => a.kode_akun.localeCompare(b.kode_akun));
    const aset: NeracaItem[] = allItems.filter((i) => i.kategori === "Aset");
    const liabilitas: NeracaItem[] = allItems.filter((i) => i.kategori === "Liabilitas");
    const ekuitas: NeracaItem[] = allItems.filter((i) => i.kategori === "Ekuitas");

    const totalAset = aset.reduce((s, i) => s + i.saldo, 0);
    const totalLiabilitas = liabilitas.reduce((s, i) => s + i.saldo, 0);
    const totalEkuitas = ekuitas.reduce((s, i) => s + i.saldo, 0);

    // Laba/Rugi Berjalan hanya relevan sebelum periode dilakukan Closing.
    // Setelah Closing, saldo Pendapatan & Beban sudah dipindahkan ke
    // akun Ekuitas (misal: Laba Ditahan) sehingga netIncome = 0.
    if (Math.abs(netIncome) > 0) {
      ekuitas.push({
        kode_akun: "",
        nama_akun: netIncome >= 0 ? "Laba Berjalan" : "Rugi Berjalan",
        saldo: netIncome,
        is_system: true,
      });
    }

    const totalEkuitasFinal = totalEkuitas + netIncome;
    const difference = Math.round((totalAset - totalLiabilitas - totalEkuitasFinal) * 100) / 100;

    const response: NeracaResponse = {
      aset,
      liabilitas,
      ekuitas,
      total_aset: totalAset,
      total_liabilitas: totalLiabilitas,
      total_ekuitas: totalEkuitasFinal,
      is_balanced: Math.abs(difference) < 1,
      difference,
      labaBerjalan: netIncome,
    };

    return ok(response);
  } catch (error: any) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data neraca.", 500, error?.message);
  }
}
