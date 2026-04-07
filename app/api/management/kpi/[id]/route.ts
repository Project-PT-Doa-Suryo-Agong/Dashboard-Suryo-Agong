import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateKPIWeekly, deleteKPIWeekly } from "@/lib/services/management.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("minggu" in input) {
    const minggu = requireString(input, "minggu", { maxLen: 40 });
    if (!minggu.ok) return fail(ErrorCode.VALIDATION_ERROR, minggu.message, 400);
  }
  if ("divisi" in input) {
    const divisi = requireString(input, "divisi", { maxLen: 120, optional: true });
    if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
  }
  if ("target" in input) {
    const target = requireNumber(input, "target", { min: 0 });
    if (!target.ok) return fail(ErrorCode.VALIDATION_ERROR, target.message, 400);
  }
  if ("realisasi" in input) {
    const realisasi = requireNumber(input, "realisasi", { min: 0 });
    if (!realisasi.ok) return fail(ErrorCode.VALIDATION_ERROR, realisasi.message, 400);
  }

  const { data, error } = await updateKPIWeekly(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update KPI.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data KPI tidak ditemukan.", 404);
  return ok({ kpi: data }, "KPI berhasil diupdate.");
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteKPIWeekly(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus KPI.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data KPI tidak ditemukan.", 404);
  return ok(null, "KPI berhasil dihapus.");
}
