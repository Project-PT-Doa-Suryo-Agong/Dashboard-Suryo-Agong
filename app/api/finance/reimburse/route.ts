import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listReimbursement, createReimbursement } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TReimbursementInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listReimbursement(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data reimburse.", 500, error.message);
  return ok({ reimburse: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const amount = requireNumber(input, "amount", { min: 0 });
  if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
  
  const bukti = requireString(input, "bukti", { optional: true });
  if (!bukti.ok) return fail(ErrorCode.VALIDATION_ERROR, bukti.message, 400);
  const keterangan = requireString(input, "keterangan", { optional: true });
  if (!keterangan.ok) return fail(ErrorCode.VALIDATION_ERROR, keterangan.message, 400);

  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data && !["pending", "approved", "rejected"].includes(status.data as string)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, approved, atau rejected.", 400);
  }

  const payload: TReimbursementInsert = {
    employee_id: employeeId.data,
    amount: amount.data,
    bukti: bukti.data ?? null,
    keterangan: keterangan.data ?? null,
    status: (status.data ?? "pending") as TReimbursementInsert["status"],
  };

  const { data, error } = await createReimbursement(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengajukan reimburse.", 500, error.message);
  return ok({ reimburse: data }, "Reimburse berhasil diajukan.", 201);
}
