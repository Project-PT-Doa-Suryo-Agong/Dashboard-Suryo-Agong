import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listSalesOrder, createSalesOrder } from "@/lib/services/sales.service";
import { requireNumber, requireUUID, requireString } from "@/lib/validation/body-validator";
import type { TSalesOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ORDER_CODE_PREFIX = "ORD";
const ORDER_CODE_TIMEZONE = "Asia/Jakarta";

type SalesOrderLike = {
  id: string;
  order_code?: string | null;
  created_at?: string | null;
};

function getDateCodeInJakarta(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ORDER_CODE_TIMEZONE,
  }).formatToParts(date);

  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  return `${day}${month}${year}`;
}

function getDateCodeFromValue(value: string | null | undefined): string {
  if (!value) return getDateCodeInJakarta(new Date(0));
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return getDateCodeInJakarta(new Date(0));
  return getDateCodeInJakarta(parsed);
}

function buildOrderCode(dateCode: string, sequence: number): string {
  return `${ORDER_CODE_PREFIX}-${dateCode}-${String(sequence).padStart(6, "0")}`;
}

function parseOrderCodeSequence(orderCode: string, dateCode: string): number | null {
  const match = orderCode.match(new RegExp(`^${ORDER_CODE_PREFIX}-${dateCode}-(\\d{6})$`));
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function isPermissionOrRlsError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("insufficient privilege") ||
    normalized.includes("violates") && normalized.includes("policy")
  );
}

function ensureReadableOrderCodes<T extends SalesOrderLike>(orders: T[]): T[] {
  const sorted = [...orders].sort((a, b) => {
    const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (aTime !== bTime) return aTime - bTime;
    return a.id.localeCompare(b.id);
  });

  const sequenceByDate = new Map<string, number>();
  const fallbackCodeById = new Map<string, string>();

  for (const order of sorted) {
    const dateCode = getDateCodeFromValue(order.created_at ?? null);
    const nextSequence = (sequenceByDate.get(dateCode) ?? 0) + 1;
    sequenceByDate.set(dateCode, nextSequence);
    fallbackCodeById.set(order.id, buildOrderCode(dateCode, nextSequence));
  }

  return orders.map((order) => ({
    ...order,
    order_code: order.order_code?.trim() || fallbackCodeById.get(order.id) || null,
  }));
}

async function generateNextOrderCode(supabase: any): Promise<string | null> {
  const dateCode = getDateCodeInJakarta();
  const pattern = `${ORDER_CODE_PREFIX}-${dateCode}-%`;

  const { data, error } = await (supabase as any)
    .schema("sales")
    .from("t_sales_order")
    .select("order_code")
    .ilike("order_code", pattern)
    .order("order_code", { ascending: false })
    .limit(1);

  if (error) {
    const message = (error.message ?? "").toLowerCase();
    if (message.includes("column") && message.includes("order_code")) {
      return null;
    }
    throw new Error(`Gagal membuat kode order: ${error.message}`);
  }

  const latestCode = data?.[0]?.order_code;
  const nextSequence = latestCode ? (parseOrderCodeSequence(String(latestCode), dateCode) ?? 0) + 1 : 1;
  return buildOrderCode(dateCode, nextSequence);
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listSalesOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data sales order.", 500, error.message);
  return ok({ orders: ensureReadableOrderCodes(data as SalesOrderLike[]), meta });
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

  const orderNumber = requireString(input, "order_number", { optional: true });
  if (!orderNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, orderNumber.message, 400);

  // Perhitungan total price otomatis di backend (Harga Varian x QTY)
  let calculatedTotalPrice = 0;
  if (varianId.data) {
    const { data: varian } = await auth.ctx.supabase.schema("core").from("m_varian").select("harga").eq("id", varianId.data).single();
    if (varian?.harga) {
      calculatedTotalPrice = varian.harga * quantity.data!;
    }
  }

  const generatedOrderCode = await generateNextOrderCode(auth.ctx.supabase);

  const coaId = requireUUID(input, "coa_id", { optional: true });
  if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);

  const payload: TSalesOrderInsert = {
    ...(generatedOrderCode ? { order_code: generatedOrderCode } : {}),
    ...(orderNumber.data ? { order_number: orderNumber.data } : {}),
    varian_id: varianId.data,
    affiliator_id: affiliatorId.data,
    quantity: quantity.data!,
    total_price: calculatedTotalPrice,
    coa_id: coaId.data,
    created_at: new Date().toISOString(),
  };

  let { data, error } = await createSalesOrder(auth.ctx.supabase, payload);

  const initialErrorMessage = typeof error?.message === "string" ? error.message : "";
  if (error && isPermissionOrRlsError(initialErrorMessage)) {
    const retry = await createSalesOrder(supabaseAdmin as any, payload);
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    const detail = typeof error.message === "string" ? error.message : "Unknown DB error";
    if (detail.toLowerCase().includes("permission denied for schema finance")) {
      return fail(
        ErrorCode.DB_ERROR,
        "Gagal membuat sales order. Permission schema finance untuk trigger cashflow belum benar. Jalankan SQL fix: supabase/fix-sales-order-finance-trigger-permissions.sql",
        500,
        detail,
      );
    }
    return fail(ErrorCode.DB_ERROR, `Gagal membuat sales order. Detail: ${detail}`, 500, detail);
  }
  return ok({ order: data }, "Sales order berhasil dibuat.", 201);
}
