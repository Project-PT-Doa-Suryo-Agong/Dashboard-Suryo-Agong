import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteVendor, updateVendor } from "@/lib/services/core.service";
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

  if ("nama_vendor" in input) {
    const namaVendor = requireString(input, "nama_vendor", { maxLen: 120 });
    if (!namaVendor.ok) return fail(ErrorCode.VALIDATION_ERROR, namaVendor.message, 400);
  }
  if ("kontak" in input) {
    const kontak = requireString(input, "kontak", { maxLen: 120, optional: true });
    if (!kontak.ok) return fail(ErrorCode.VALIDATION_ERROR, kontak.message, 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama_vendor === "string" ? { nama_vendor: input.nama_vendor.trim() } : {}),
    ...(typeof input.kontak === "string" ? { kontak: input.kontak.trim() || null } : {}),
  };

  const { data, error } = await updateVendor(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update vendor.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Vendor tidak ditemukan.", 404);
  return ok({ vendor: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteVendor(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus vendor.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Vendor tidak ditemukan.", 404);
  return ok(null, "Vendor berhasil dihapus.");
}
