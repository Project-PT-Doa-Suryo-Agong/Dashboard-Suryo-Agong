import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateBudgetRequest, deleteBudgetRequest } from "@/lib/services/management.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
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
  if ("divisi" in input) {
    const divisi = requireString(input, "divisi", { maxLen: 120 });
    if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
  }
  if ("amount" in input) {
    const amount = requireNumber(input, "amount", { min: 0 });
    if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
  }
  if ("status" in input) {
    const status = requireString(input, "status", { optional: true });
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (status.data !== null && !["pending", "approved", "rejected"].includes(status.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, approved, atau rejected.", 400);
    }
  }

  const { data, error } = await updateBudgetRequest(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update budget request.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data budget request tidak ditemukan.", 404);
  return ok({ budget_request: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteBudgetRequest(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus budget request.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data budget request tidak ditemukan.", 404);
  return ok(null, "Budget request berhasil dihapus.");
}
