import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updatePayroll, deletePayroll } from "@/lib/services/finance.service";
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
  
  const payload: Record<string, any> = {};

  if ("employee_id" in input) {
    const employeeId = requireUUID(input, "employee_id");
    if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
    payload.employee_id = employeeId.data;
  }
  if ("bulan" in input) {
    const bulan = requireString(input, "bulan", { maxLen: 20 });
    if (!bulan.ok) return fail(ErrorCode.VALIDATION_ERROR, bulan.message, 400);
    payload.bulan = bulan.data;
  }
  if ("total" in input) {
    const total = requireNumber(input, "total", { min: 0 });
    if (!total.ok) return fail(ErrorCode.VALIDATION_ERROR, total.message, 400);
    payload.total = total.data;
  }

  const { data, error } = await updatePayroll(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update payroll.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data payroll tidak ditemukan.", 404);
  return ok({ payroll: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deletePayroll(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus payroll.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data payroll tidak ditemukan.", 404);
  return ok(null, "Data payroll berhasil dihapus.");
}
