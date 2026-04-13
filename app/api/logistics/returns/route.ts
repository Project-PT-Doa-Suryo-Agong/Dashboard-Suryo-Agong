import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createReturnOrder, listReturnOrder } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TReturnOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listReturnOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data retur.", 500, error.message);
  return ok({ returns: data, meta });
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
  const orderId = requireUUID(input, "order_id");
  if (!orderId.ok) return fail(ErrorCode.VALIDATION_ERROR, orderId.message, 400);
  if (!orderId.data) return fail(ErrorCode.VALIDATION_ERROR, "order_id wajib diisi.", 400);
  const alasan = requireString(input, "alasan", { maxLen: 255, optional: true });
  if (!alasan.ok) return fail(ErrorCode.VALIDATION_ERROR, alasan.message, 400);

  const payload: TReturnOrderInsert = {
    ...input,
    order_id: orderId.data,
    alasan: alasan.data,
  };

  const { data, error } = await createReturnOrder(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data retur.", 500, error.message);
  return ok({ return: data }, "Data retur berhasil dibuat.", 201);
}
