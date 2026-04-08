import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listSalesOrder, createSalesOrder } from "@/lib/services/sales.service";
import { requireNumber, requireUUID } from "@/lib/validation/body-validator";
import type { TSalesOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listSalesOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data sales order.", 500, error.message);
  return ok({ orders: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const varianId = requireUUID(input, "varian_id");
  if (!varianId.ok) return fail(ErrorCode.VALIDATION_ERROR, varianId.message, 400);
  const affiliatorId = requireUUID(input, "affiliator_id", { optional: true });
  if (!affiliatorId.ok) return fail(ErrorCode.VALIDATION_ERROR, affiliatorId.message, 400);
  const quantity = requireNumber(input, "quantity", { min: 1 });
  if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);

  // Perhitungan total price otomatis di backend (Harga Varian x QTY)
  let calculatedTotalPrice = 0;
  if (varianId.data) {
    const { data: varian } = await auth.ctx.supabase.schema("core").from("m_varian").select("harga").eq("id", varianId.data).single();
    if (varian?.harga) {
      calculatedTotalPrice = varian.harga * quantity.data!;
    }
  }

  const payload: TSalesOrderInsert = {
    ...input,
    varian_id: varianId.data,
    affiliator_id: affiliatorId.data,
    quantity: quantity.data!,
    total_price: calculatedTotalPrice,
  };

  const { data, error } = await createSalesOrder(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat sales order.", 500, error.message);
  return ok({ order: data }, "Sales order berhasil dibuat.", 201);
}
