import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateJurnal, deleteJurnal } from "@/lib/services/finance.service";
import { requireDate } from "@/lib/validation/body-validator";
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

  if ("tanggal" in input) {
    const tanggal = requireDate(input, "tanggal");
    if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);
    payload.tanggal = tanggal.data;
  }
  if ("no_bukti" in input) payload.no_bukti = String(input.no_bukti);
  if ("keterangan" in input) payload.keterangan = String(input.keterangan);
  if ("referensi_id" in input) payload.referensi_id = input.referensi_id ? String(input.referensi_id) : null;

  const { data, error } = await updateJurnal(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update jurnal.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data jurnal tidak ditemukan.", 404);
  return ok({ jurnal: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteJurnal(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus jurnal.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data jurnal tidak ditemukan.", 404);
  return ok(null, "Data jurnal berhasil dihapus.");
}
