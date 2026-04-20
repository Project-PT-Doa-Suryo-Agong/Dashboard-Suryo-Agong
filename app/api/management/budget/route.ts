import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listBudgetRequest, createBudgetRequest } from "@/lib/services/management.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TBudgetRequestInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listBudgetRequest(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data budget request.", 500, error.message);
  return ok({ budget_requests: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const divisi = requireString(input, "divisi", { maxLen: 120 });
  if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
  const amount = requireNumber(input, "amount", { min: 0 });
  if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data !== null && !["pending", "approved", "rejected"].includes(status.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, approved, atau rejected.", 400);
  }

  const coaId = requireUUID(input, "coa_id", { optional: true });
  if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);

  const payload: TBudgetRequestInsert = {
    ...input,
    divisi: divisi.data!,
    amount: amount.data!,
    status: status.data as TBudgetRequestInsert["status"],
    coa_id: coaId.data,
  };

  const { data, error } = await createBudgetRequest(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengajukan budget request.", 500, error.message);
  return ok({ budget_request: data }, "Budget request berhasil diajukan.", 201);
}
