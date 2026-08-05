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

const BUKU_BESAR_CATEGORIES: string[] = [
  "Aset",
  "Liabilitas",
  "Ekuitas",
  "Pendapatan",
  "Pendapatan Lain-lain",
  "Beban",
  "Beban Lain-lain",
];

function getNormalBalance(kategori: string): "debit" | "kredit" {
  switch (kategori) {
    case "Liabilitas":
    case "Ekuitas":
    case "Pendapatan":
    case "Pendapatan Lain-lain":
      return "kredit";
    default:
      return "debit";
  }
}

function normalBalance(kategori: string, debit: number, kredit: number): number {
  return getNormalBalance(kategori) === "kredit" ? kredit - debit : debit - kredit;
}

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

    // 1. Ambil seluruh COA sekali (termasuk kategori) lalu indeks dengan Map
    //    agar kategori setiap journal item dapat ditentukan tanpa query tambahan.
    let coaQuery = financeDb
      .from("m_coa")
      .select("id, kode_akun, nama_akun, kategori")
      .in("kategori", BUKU_BESAR_CATEGORIES)
      .order("kode_akun", { ascending: true });

    if (coaId) {
      coaQuery = coaQuery.eq("id", coaId);
    }

    const { data: coaList, error: coaError } = await coaQuery;

    if (coaError) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar akun.", 500, coaError.message);
    }

    const coas = (coaList ?? []) as any[];
    const coaMap = new Map<string, { kode_akun: string; nama_akun: string; kategori: string }>();
    for (const coa of coas) {
      coaMap.set(coa.id, {
        kode_akun: coa.kode_akun,
        nama_akun: coa.nama_akun,
        kategori: coa.kategori,
      });
    }

    // 2. Ambil seluruh journal item dalam 2 query besar (opening + periode)
    //    lalu agregasi di memori, menghindari N+1 query per COA.
    const [openingResult, periodeResult] = await Promise.all([
      financeDb
        .from("t_journal_item")
        .select("coa_id, debit, kredit, t_journal!inner(tanggal)")
        .lt("t_journal.tanggal", startDate),
      financeDb
        .from("t_journal_item")
        .select(`
          coa_id, debit, kredit,
          t_journal!inner(tanggal, journal_number, no_bukti, keterangan)
        `)
        .gte("t_journal.tanggal", startDate)
        .lte("t_journal.tanggal", endDate)
        .order("t_journal.tanggal", { ascending: true }),
    ]);

    if (openingResult.error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data buku besar.", 500, openingResult.error.message);
    }
    if (periodeResult.error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data buku besar.", 500, periodeResult.error.message);
    }

    // Opening balance per COA, mengikuti arah normal balance akun.
    const openingByCoa = new Map<string, number>();
    for (const r of (openingResult.data ?? []) as any[]) {
      const meta = coaMap.get(r.coa_id);
      if (!meta) continue;
      const net = normalBalance(meta.kategori, Number(r.debit ?? 0), Number(r.kredit ?? 0));
      openingByCoa.set(r.coa_id, (openingByCoa.get(r.coa_id) ?? 0) + net);
    }

    // Kumpulkan mutasi per COA dalam satu scan.
    const mutasiByCoa = new Map<string, any[]>();
    for (const r of (periodeResult.data ?? []) as any[]) {
      if (!coaMap.has(r.coa_id)) continue;
      const rows = mutasiByCoa.get(r.coa_id) ?? [];
      rows.push(r);
      mutasiByCoa.set(r.coa_id, rows);
    }

    const from = (page - 1) * limit;
    const pagedCoas = coas.slice(from, from + limit);

    const items: BukuBesarItem[] = pagedCoas.map((coa) => {
      const meta = coaMap.get(coa.id)!;
      const openingBalance = openingByCoa.get(coa.id) ?? 0;
      const periodeRows = mutasiByCoa.get(coa.id) ?? [];

      let runningSaldo = openingBalance;
      const mutasi: BukuBesarMutasi[] = periodeRows.map((r: any) => {
        const j = r.t_journal;
        const net = normalBalance(meta.kategori, Number(r.debit ?? 0), Number(r.kredit ?? 0));
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

      return {
        coa_id: coa.id,
        kode_akun: meta.kode_akun,
        nama_akun: meta.nama_akun,
        opening_balance: openingBalance,
        mutasi,
        closing_balance: runningSaldo,
      };
    });

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
