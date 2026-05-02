import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKPIWeekly, createKPIWeekly } from "@/lib/services/management.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import type { TKPIWeeklyInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 500, 1), 500);
  const divisi = url.searchParams.get("divisi") ?? undefined;

  const { data, error, meta } = await listKPIWeekly(auth.ctx.supabase, page, limit, divisi);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data kpi.", 500, error.message);
  return ok({ kpi: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const minggu = requireString(input, "minggu", { maxLen: 40 });
  if (!minggu.ok) return fail(ErrorCode.VALIDATION_ERROR, minggu.message, 400);
  const divisi = requireString(input, "divisi", { maxLen: 120, optional: true });
  if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
  const target = requireNumber(input, "target", { min: 0 });
  if (!target.ok) return fail(ErrorCode.VALIDATION_ERROR, target.message, 400);
  const realisasi = requireNumber(input, "realisasi", { min: 0 });
  if (!realisasi.ok) return fail(ErrorCode.VALIDATION_ERROR, realisasi.message, 400);

  const kpiNumber = requireString(input, "kpi_number", { optional: true });
  if (!kpiNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, kpiNumber.message, 400);

  const generateKpiNumber = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data: countData, error: countError } = await supabaseAdmin.rpc("count_kpi_weekly_this_month", {
      start_of_month: startOfMonth,
      start_of_next_month: startOfNextMonth,
    });

    if (countError) {
      return { ok: false as const, error: countError };
    }

    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const seq = String(((countData as number) ?? 0) + 1).padStart(5, "0");
    return { ok: true as const, number: `KPI-${mm}${yy}-${seq}` };
  };

  let finalKpiNumber = kpiNumber.data ?? null;
  if (!finalKpiNumber) {
    const generated = await generateKpiNumber();
    if (!generated.ok) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat nomor KPI.", 500, generated.error.message);
    }
    finalKpiNumber = generated.number;
  }

  const payload: TKPIWeeklyInsert = {
    ...input,
    minggu: minggu.data!,
    divisi: divisi.data,
    target: target.data!,
    realisasi: realisasi.data!,
    kpi_number: finalKpiNumber,
  };

  const { data, error } = await createKPIWeekly(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menyimpan KPI.", 500, error.message);
  return ok({ kpi: data }, "KPI berhasil disimpan.", 201);
}
