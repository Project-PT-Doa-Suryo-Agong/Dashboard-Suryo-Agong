import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createPacking, listPacking } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TPackingInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listPacking(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data packing.", 500, error.message);
  return ok({ packing: data, meta });
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
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data !== null && !["pending", "packed", "shipped"].includes(status.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, packed, atau shipped.", 400);
  }

  const payload: TPackingInsert = {
    ...input,
    order_id: orderId.data,
    status: status.data as TPackingInsert["status"],
  };

  const { data, error } = await createPacking(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data packing.", 500, error.message);
  return ok({ packing: data }, "Data packing berhasil dibuat.", 201);
}
