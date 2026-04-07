import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listPayroll, createPayroll } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TPayrollHistoryInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listPayroll(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data payroll.", 500, error.message);
  return ok({ payroll: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id", { optional: true });
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const bulan = requireString(input, "bulan", { maxLen: 20, optional: true });
  if (!bulan.ok) return fail(ErrorCode.VALIDATION_ERROR, bulan.message, 400);
  const total = requireNumber(input, "total", { min: 0, optional: true });
  if (!total.ok) return fail(ErrorCode.VALIDATION_ERROR, total.message, 400);

  if (!("employee_id" in input) && !("bulan" in input) && !("total" in input)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Minimal satu field payroll harus diisi.", 400);
  }

  const payload: TPayrollHistoryInsert = {
    ...input,
    employee_id: employeeId.data,
    bulan: bulan.data,
    total: total.data,
  };

  const { data, error } = await createPayroll(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data payroll.", 500, error.message);
  return ok({ payroll: data }, "Data payroll berhasil dibuat.", 201);
}
