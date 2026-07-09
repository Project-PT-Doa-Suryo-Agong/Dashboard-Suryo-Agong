import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

type BukuBesarMutasi = {
  tanggal: string;
  journal_number: string | null;
  no_bukti: string;
  keterangan: string | null;
  debit: number;
  kredit: number;
  saldo: number;
};

type BukuBesarItem = {
  coa_id: string;
  kode_akun: string;
  nama_akun: string;
  opening_balance: number;
  mutasi: BukuBesarMutasi[];
  closing_balance: number;
};

type BukuBesarResponse = {
  items: BukuBesarItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");
  const coaId = url.searchParams.get("coa_id") || undefined;
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 20, 1), 100);

  if (!startDate || !endDate) {
    return fail(ErrorCode.VALIDATION_ERROR, "Parameter start_date dan end_date wajib diisi.", 400);
  }

  try {
    const financeDb = (supabaseAdmin as any).schema("finance");

    let coaQuery = financeDb
      .from("m_coa")
      .select("id, kode_akun, nama_akun")
      .in("kategori", ["Aset", "Liabilitas", "Ekuitas"])
      .order("kode_akun", { ascending: true });

    if (coaId) {
      coaQuery = coaQuery.eq("id", coaId);
    }

    const { data: coaList, error: coaError, count: coaCount } = await coaQuery;

    if (coaError) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar akun.", 500, coaError.message);
    }

    const coas = (coaList ?? []) as any[];
    const from = (page - 1) * limit;
    const pagedCoas = coas.slice(from, from + limit);

    const items: BukuBesarItem[] = [];

    for (const coa of pagedCoas) {
      const [openingResult, periodeResult] = await Promise.all([
        financeDb
          .from("t_journal_item")
          .select("debit, kredit, t_journal!inner(tanggal)")
          .eq("coa_id", coa.id)
          .lt("t_journal.tanggal", startDate),
        financeDb
          .from("t_journal_item")
          .select(`
            debit, kredit,
            t_journal!inner(tanggal, journal_number, no_bukti, keterangan)
          `)
          .eq("coa_id", coa.id)
          .gte("t_journal.tanggal", startDate)
          .lte("t_journal.tanggal", endDate)
          .order("t_journal.tanggal", { ascending: true }),
      ]);

      const openingBalance = (openingResult.data ?? []).reduce(
        (s: number, r: any) => s + Number(r.debit ?? 0) - Number(r.kredit ?? 0),
        0,
      );

      const periodeRows = (periodeResult.data ?? []) as any[];
      let runningSaldo = openingBalance;
      const mutasi: BukuBesarMutasi[] = periodeRows.map((r: any) => {
        const j = r.t_journal;
        const net = Number(r.debit ?? 0) - Number(r.kredit ?? 0);
        runningSaldo += net;
        return {
          tanggal: j?.tanggal ?? "",
          journal_number: j?.journal_number ?? null,
          no_bukti: j?.no_bukti ?? "",
          keterangan: j?.keterangan ?? null,
          debit: Number(r.debit ?? 0),
          kredit: Number(r.kredit ?? 0),
          saldo: runningSaldo,
        };
      });

      const closingBalance = openingBalance + periodeRows.reduce(
        (s: number, r: any) => s + Number(r.debit ?? 0) - Number(r.kredit ?? 0),
        0,
      );

      items.push({
        coa_id: coa.id,
        kode_akun: coa.kode_akun,
        nama_akun: coa.nama_akun,
        opening_balance: openingBalance,
        mutasi,
        closing_balance: closingBalance,
      });
    }

    const response: BukuBesarResponse = {
      items,
      meta: {
        page,
        limit,
        total: coas.length,
      },
    };

    return ok(response);
  } catch (error: any) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data buku besar.", 500, error?.message);
  }
}
