import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateContentStatistic, deleteContentStatistic } from "@/lib/services/sales.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);

  if ("content_planner_id" in input) {
    const cp = requireUUID(input, "content_planner_id", { optional: true });
    if (!cp.ok) return fail(ErrorCode.VALIDATION_ERROR, cp.message, 400);
  }
  if ("link" in input) {
    const link = requireString(input, "link", { optional: true });
    if (!link.ok) return fail(ErrorCode.VALIDATION_ERROR, link.message, 400);
  }
  if ("jumlah_view" in input) {
    const jv = requireNumber(input, "jumlah_view", { min: 0 });
    if (!jv.ok) return fail(ErrorCode.VALIDATION_ERROR, jv.message, 400);
  }
  if ("monetasi" in input) {
    const mon = requireNumber(input, "monetasi", { min: 0 });
    if (!mon.ok) return fail(ErrorCode.VALIDATION_ERROR, mon.message, 400);
  }

  const { data, error } = await updateContentStatistic(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update content statistic.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Content statistic tidak ditemukan.", 404);
  return ok({ content_stat: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteContentStatistic(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus content statistic.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Content statistic tidak ditemukan.", 404);
  return ok(null, "Content statistic berhasil dihapus.");
}
