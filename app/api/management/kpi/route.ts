import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKPIWeekly, createKPIWeekly } from "@/lib/services/management.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import type { TKPIWeeklyInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

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

  const payload: TKPIWeeklyInsert = {
    ...input,
    minggu: minggu.data!,
    divisi: divisi.data,
    target: target.data!,
    realisasi: realisasi.data!,
  };

  const { data, error } = await createKPIWeekly(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menyimpan KPI.", 500, error.message);
  return ok({ kpi: data }, "KPI berhasil disimpan.", 201);
}
