import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

type ArusKasDetail = {
  id: string;
  tanggal: string;
  tipe: string;
  tipe_kas: string;
  amount: number;
  keterangan: string;
};

type ArusKasGroup = {
  pemasukan: number;
  pengeluaran: number;
};

type ArusKasResponse = {
  total_pemasukan: number;
  total_pengeluaran: number;
  arus_kas_bersih: number;
  kas_besar: ArusKasGroup;
  kas_kecil: ArusKasGroup;
  detail: ArusKasDetail[];
};

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const startDate = url.searchParams.get("start_date");
  const endDate = url.searchParams.get("end_date");

  if (!startDate || !endDate) {
    return fail(ErrorCode.VALIDATION_ERROR, "Parameter start_date dan end_date wajib diisi.", 400);
  }

  try {
    const financeDb = (supabaseAdmin as any).schema("finance");

    const formatStart = new Date(`${startDate}T00:00:00+07:00`).toISOString();
    const formatEnd = new Date(`${endDate}T23:59:59.999+07:00`).toISOString();

    const { data, error } = await financeDb
      .from("t_cashflow")
      .select("id, tipe, tipe_kas, amount, keterangan, created_at")
      .gte("created_at", formatStart)
      .lte("created_at", formatEnd)
      .order("created_at", { ascending: false });

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data arus kas.", 500, error.message);
    }

    const rows = ((data ?? []) as any[]).filter((r) => Number(r.amount ?? 0) > 0);
    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    const kasBesar: ArusKasGroup = { pemasukan: 0, pengeluaran: 0 };
    const kasKecil: ArusKasGroup = { pemasukan: 0, pengeluaran: 0 };

    const detail: ArusKasDetail[] = rows.map((r: any) => {
      const amount = Number(r.amount ?? 0);
      const isIncome = r.tipe === "income";
      const tipeKas = r.tipe_kas as string | null;
      const isBesar = tipeKas === "besar" || (!tipeKas && (isIncome || amount > 1000000));

      if (isIncome) {
        totalPemasukan += amount;
        if (isBesar) kasBesar.pemasukan += amount;
        else kasKecil.pemasukan += amount;
      } else {
        totalPengeluaran += amount;
        if (isBesar) kasBesar.pengeluaran += amount;
        else kasKecil.pengeluaran += amount;
      }

      return {
        id: r.id,
        tanggal: r.created_at,
        tipe: r.tipe,
        tipe_kas: r.tipe_kas,
        amount,
        keterangan: r.keterangan ?? "",
      };
    });

    const response: ArusKasResponse = {
      total_pemasukan: totalPemasukan,
      total_pengeluaran: totalPengeluaran,
      arus_kas_bersih: totalPemasukan - totalPengeluaran,
      kas_besar: kasBesar,
      kas_kecil: kasKecil,
      detail,
    };

    return ok(response);
  } catch (error: any) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data arus kas.", 500, error?.message);
  }
}
