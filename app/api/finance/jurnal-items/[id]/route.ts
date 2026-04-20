import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateJurnalItem, deleteJurnalItem } from "@/lib/services/finance.service";
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
    payload.coa_id = coaId.data;
  }
  if ("kredit" in input) payload.kredit = Number(input.kredit);
  if ("debit" in input) payload.debit = Number(input.debit);

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
