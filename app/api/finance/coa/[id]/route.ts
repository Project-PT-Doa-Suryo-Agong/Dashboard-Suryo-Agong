import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateCoa, deleteCoa } from "@/lib/services/finance.service";
import { requireString } from "@/lib/validation/body-validator";
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
  const payload: Record<string, any> = {};

  if ("kode_akun" in input) {
    const kode = requireString(input, "kode_akun", { maxLen: 50 });
    if (!kode.ok) return fail(ErrorCode.VALIDATION_ERROR, kode.message, 400);
    payload.kode_akun = kode.data;
  }
  if ("nama_akun" in input) {
    const nama = requireString(input, "nama_akun", { maxLen: 255 });
    if (!nama.ok) return fail(ErrorCode.VALIDATION_ERROR, nama.message, 400);
    payload.nama_akun = nama.data;
  }
  if ("kategori" in input) {
    const kategori = requireString(input, "kategori");
    if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);
    payload.kategori = kategori.data;
  }
  if ("is_sub_account" in input) {
    payload.is_sub_account = Boolean(input.is_sub_account);
  }
  if ("parent_id" in input) {
    payload.parent_id = input.parent_id ? String(input.parent_id) : null;
  }

  const { data, error } = await updateCoa(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update COA.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data COA tidak ditemukan.", 404);
  return ok({ coa: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteCoa(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus COA.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data COA tidak ditemukan.", 404);
  return ok(null, "Data COA berhasil dihapus.");
}
