import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteVarian, updateVarian } from "@/lib/services/core.service";
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
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("product_id" in input) {
    const productId = requireUUID(input, "product_id", { optional: true });
    if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
  }
  if ("nama_varian" in input) {
    const namaVarian = requireString(input, "nama_varian", { maxLen: 120, optional: true });
    if (!namaVarian.ok) return fail(ErrorCode.VALIDATION_ERROR, namaVarian.message, 400);
  }
  if ("sku" in input) {
    const sku = requireString(input, "sku", { maxLen: 64, optional: true });
    if (!sku.ok) return fail(ErrorCode.VALIDATION_ERROR, sku.message, 400);
  }
  if ("harga" in input) {
    const harga = requireNumber(input, "harga", { min: 0, optional: true });
    if (!harga.ok) return fail(ErrorCode.VALIDATION_ERROR, harga.message, 400);
  }
  const payload = {
    ...input,
    ...(typeof input.nama_varian === "string" ? { nama_varian: input.nama_varian.trim() || null } : {}),
    ...(typeof input.sku === "string" ? { sku: input.sku.trim().toUpperCase() || null } : {}),
  };

  const { data, error } = await updateVarian(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update varian.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Varian tidak ditemukan.", 404);
  return ok({ varian: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteVarian(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus varian.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Varian tidak ditemukan.", 404);
  return ok(null, "Varian berhasil dihapus.");
}
