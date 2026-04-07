import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteProduk, updateProduk } from "@/lib/services/core.service";
import { requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
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

  if ("nama_produk" in input) {
    const namaProduk = requireString(input, "nama_produk", { maxLen: 120 });
    if (!namaProduk.ok) return fail(ErrorCode.VALIDATION_ERROR, namaProduk.message, 400);
  }
  if ("kategori" in input) {
    const kategori = requireString(input, "kategori", { maxLen: 120, optional: true });
    if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama_produk === "string" ? { nama_produk: input.nama_produk.trim() } : {}),
    ...(typeof input.kategori === "string" ? { kategori: input.kategori.trim() || null } : {}),
  };

  const { data, error } = await updateProduk(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update produk.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Produk tidak ditemukan.", 404);
  return ok({ produk: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteProduk(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus produk.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Produk tidak ditemukan.", 404);
  return ok(null, "Produk berhasil dihapus.");
}
