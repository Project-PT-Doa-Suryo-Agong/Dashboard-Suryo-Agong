import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateWarning, deleteWarning } from "@/lib/services/hr.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
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

  const payload: Record<string, unknown> = {};

  if ("employee_id" in input) {
    const employeeId = requireUUID(input, "employee_id");
    if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
    payload.employee_id = employeeId.data;
  }

  if ("level" in input) {
    const level = requireString(input, "level");
    if (!level.ok || !level.data) {
      return fail(ErrorCode.VALIDATION_ERROR, level.ok ? "level wajib diisi." : level.message, 400);
    }
    payload.level = level.data;
  }

  if ("alasan" in input) {
    const alasan = requireString(input, "alasan");
    if (!alasan.ok || !alasan.data) {
      return fail(ErrorCode.VALIDATION_ERROR, alasan.ok ? "alasan wajib diisi." : alasan.message, 400);
    }
    payload.alasan = alasan.data;
  }

  const { data, error } = await updateWarning(auth.ctx.supabase, id, payload);

  console.log("[HR ROUTE][warnings][PATCH] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][warnings][PATCH] role:", auth.ctx.role);
  console.log("[HR ROUTE][warnings][PATCH] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update warning.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data warning tidak ditemukan.", 404);
  return ok({ warning: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  const { error, deleted } = await deleteWarning(auth.ctx.supabase, id);

  console.log("[HR ROUTE][warnings][DELETE] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][warnings][DELETE] role:", auth.ctx.role);
  console.log("[HR ROUTE][warnings][DELETE] query result:", {
    deleted,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus warning.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data warning tidak ditemukan.", 404);
  return ok(null, "Data warning berhasil dihapus.");
}
