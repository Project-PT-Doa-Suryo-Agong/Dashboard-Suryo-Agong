import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteReturnOrder, updateReturnOrder } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
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
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("order_id" in input) {
    const orderId = requireUUID(input, "order_id", { optional: true });
    if (!orderId.ok) return fail(ErrorCode.VALIDATION_ERROR, orderId.message, 400);
  }
  if ("alasan" in input) {
    const alasan = requireString(input, "alasan", { maxLen: 255, optional: true });
    if (!alasan.ok) return fail(ErrorCode.VALIDATION_ERROR, alasan.message, 400);
  }
  const payload = {
    ...input,
    ...(typeof input.alasan === "string" ? { alasan: input.alasan.trim() || null } : {}),
  };

  const { data, error } = await updateReturnOrder(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update data retur.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data retur tidak ditemukan.", 404);
  return ok({ return: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteReturnOrder(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus data retur.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data retur tidak ditemukan.", 404);
  return ok(null, "Data retur berhasil dihapus.");
}
