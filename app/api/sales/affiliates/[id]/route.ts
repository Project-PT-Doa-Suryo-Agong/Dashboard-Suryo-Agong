import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteAfiliator, updateAfiliator } from "@/lib/services/sales.service";
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
  if ("nama" in input) {
    const nama = requireString(input, "nama", { maxLen: 120 });
    if (!nama.ok) return fail(ErrorCode.VALIDATION_ERROR, nama.message, 400);
  }
  if ("platform" in input) {
    const platform = requireString(input, "platform", { maxLen: 120, optional: true });
    if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama === "string" ? { nama: input.nama.trim() } : {}),
    ...(typeof input.platform === "string" ? { platform: input.platform.trim() || null } : {}),
  };

  const { data, error } = await updateAfiliator(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update affiliator.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Affiliator tidak ditemukan.", 404);
  return ok({ afiliator: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteAfiliator(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus affiliator.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Affiliator tidak ditemukan.", 404);
  return ok(null, "Affiliator berhasil dihapus.");
}
