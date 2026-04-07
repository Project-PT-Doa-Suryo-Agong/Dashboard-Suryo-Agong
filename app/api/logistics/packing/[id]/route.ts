import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deletePacking, updatePacking } from "@/lib/services/logistics.service";
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
  if ("status" in input) {
    const status = requireString(input, "status", { optional: true });
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (status.data !== null && !["pending", "packed", "shipped"].includes(status.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, packed, atau shipped.", 400);
    }
  }

  const { data, error } = await updatePacking(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update packing.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data packing tidak ditemukan.", 404);
  return ok({ packing: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deletePacking(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus data packing.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data packing tidak ditemukan.", 404);
  return ok(null, "Data packing berhasil dihapus.");
}
