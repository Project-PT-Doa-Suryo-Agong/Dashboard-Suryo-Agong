import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateLivePerformance, deleteLivePerformance, getSalesOrderById } from "@/lib/services/sales.service";
import { requireString, requireNumber } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID tidak valid", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const platform = requireString(input, "platform", { maxLen: 120, optional: true });
  if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);

  const revenue = requireNumber(input, "revenue", { optional: true });
  if (!revenue.ok) return fail(ErrorCode.VALIDATION_ERROR, revenue.message, 400);

  const payload: Record<string, unknown> = {};
  if (platform.data !== undefined) payload.platform = platform.data;
  if (revenue.data !== undefined) payload.revenue = revenue.data;

  if (Object.keys(payload).length === 0) return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada data untuk diupdate", 400);

  const { data, error } = await updateLivePerformance(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update live performance.", 500, error.message);
  return ok({ live_performance: data }, "Live performance berhasil diupdate.");
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const id = params.id;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID tidak valid", 400);

  const { error, deleted } = await deleteLivePerformance(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus live performance.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Live performance tidak ditemukan.", 404);

  return ok(null, "Live performance berhasil dihapus.");
}
