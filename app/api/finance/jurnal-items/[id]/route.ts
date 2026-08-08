import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateJurnalItem, deleteJurnalItem, coaExists } from "@/lib/services/finance.service";
import { requireUUID } from "@/lib/validation/body-validator";
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

  if ("coa_id" in input) {
    const coaId = requireUUID(input, "coa_id");
    if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, "Format coa_id tidak valid.", 400);
    const coaValue = coaId.data ?? "";
    const { exists: coaFound, error: coaError } = await coaExists(auth.ctx.supabase, coaValue);
    if (coaError) return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi COA.", 500, coaError.message);
    if (!coaFound) return fail(ErrorCode.NOT_FOUND, "COA tidak ditemukan.", 404);
    payload.coa_id = coaValue;
  }

  const hasDebit = "debit" in input;
  const hasKredit = "kredit" in input;
  const debit = hasDebit ? Number(input.debit) : 0;
  const kredit = hasKredit ? Number(input.kredit) : 0;

  if (hasDebit && (Number.isNaN(debit) || debit < 0)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Debit tidak boleh negatif.", 400);
  }
  if (hasKredit && (Number.isNaN(kredit) || kredit < 0)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Kredit tidak boleh negatif.", 400);
  }
  if (hasDebit && hasKredit && debit > 0 && kredit > 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Isi hanya salah satu dari debit atau kredit.", 400);
  }
  if (hasDebit && hasKredit && debit === 0 && kredit === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Debit atau kredit harus diisi.", 400);
  }

  if (hasKredit) payload.kredit = kredit;
  if (hasDebit) payload.debit = debit;

  const { data, error } = await updateJurnalItem(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update jurnal item.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data jurnal item tidak ditemukan.", 404);
  return ok({ item: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteJurnalItem(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus jurnal item.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data jurnal item tidak ditemukan.", 404);
  return ok(null, "Data jurnal item berhasil dihapus.");
}
