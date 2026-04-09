import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listProduksiOrder, createProduksiOrder } from "@/lib/services/production.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TProduksiOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listProduksiOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data produksi order.", 500, error.message);
  return ok({ orders: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const vendorId = requireUUID(input, "vendor_id", { optional: true });
  if (!vendorId.ok) return fail(ErrorCode.VALIDATION_ERROR, vendorId.message, 400);
  const productId = requireUUID(input, "product_id", { optional: true });
  if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
  const quantity = requireNumber(input, "quantity", { min: 0, optional: true });
  if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data && !["draft", "ongoing", "done"].includes(status.data as string)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus draft, ongoing, atau done.", 400);
  }

  // Setidaknya validasi ini memastikan payload bersih dari extraneous keys.
  const payload: TProduksiOrderInsert = {
    vendor_id: vendorId.data,
    product_id: productId.data,
    quantity: quantity.data,
    status: (status.data ?? "draft") as TProduksiOrderInsert["status"],
  };

  const { data, error } = await createProduksiOrder(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat produksi order.", 500, error.message);
  return ok({ order: data }, "Produksi order berhasil dibuat.", 201);
}
