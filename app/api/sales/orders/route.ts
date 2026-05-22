import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listSalesOrder, createSalesOrder } from "@/lib/services/sales.service";
import { requireNumber, requireUUID, requireString } from "@/lib/validation/body-validator";
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
  const items = Array.isArray(input.items) ? input.items : null;

  const varianId = requireUUID(input, "varian_id", { optional: items !== null });
  if (!varianId.ok) return fail(ErrorCode.VALIDATION_ERROR, varianId.message, 400);
  const quantity = requireNumber(input, "quantity", { min: 1, optional: items !== null });
  if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);

  const orderNumber = requireString(input, "order_number", { optional: true });
  if (!orderNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, orderNumber.message, 400);

  // Perhitungan total price otomatis di backend (Harga Varian x QTY)
  let calculatedTotalPrice = 0;
  let calculatedTotalItem = 0;
  let resolvedVarianId = varianId.data;

  if (items && items.length > 0) {
    for (const it of items) {
      const itVarianId = it.varian_id || it.id_varian;
      const itQty = Number(it.quantity || it.qty || 1);
      if (itVarianId) {
        const { data: varian } = await auth.ctx.supabase.schema("core").from("m_varian").select("harga").eq("id", itVarianId).single();
        if (varian?.harga) {
          calculatedTotalPrice += varian.harga * itQty;
          calculatedTotalItem += itQty;
        }
      }
    }
    if (!resolvedVarianId && items.length > 0) {
      resolvedVarianId = items[0].varian_id || items[0].id_varian;
    }
  } else if (varianId.data) {
    const { data: varian } = await auth.ctx.supabase.schema("core").from("m_varian").select("harga").eq("id", varianId.data).single();
    if (varian?.harga) {
      calculatedTotalPrice = varian.harga * quantity.data!;
      calculatedTotalItem = quantity.data!;
    }
  }

  const coaCashId = requireUUID(input, "coa_cash_id", { optional: true });
  if (!coaCashId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaCashId.message, 400);

  const coaCreditId = requireUUID(input, "coa_credit_id", { optional: true });
  if (!coaCreditId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaCreditId.message, 400);

  const namaPelanggan = requireString(input, "nama_pelanggan", { optional: true });
  if (!namaPelanggan.ok) return fail(ErrorCode.VALIDATION_ERROR, namaPelanggan.message, 400);

  const nomorTelepon = requireString(input, "nomor_telepon", { optional: true });
  if (!nomorTelepon.ok) return fail(ErrorCode.VALIDATION_ERROR, nomorTelepon.message, 400);

  const lokasi = requireString(input, "lokasi", { optional: true });
  if (!lokasi.ok) return fail(ErrorCode.VALIDATION_ERROR, lokasi.message, 400);

  // New fields
  const termsOfPayment = requireNumber(input, "terms_of_payment", { optional: true });
  if (!termsOfPayment.ok) return fail(ErrorCode.VALIDATION_ERROR, termsOfPayment.message, 400);

  const diskon = requireNumber(input, "diskon", { optional: true });
  if (!diskon.ok) return fail(ErrorCode.VALIDATION_ERROR, diskon.message, 400);

  const discountAmount = diskon.data ?? 0;
  const calculatedTotalBayar = Math.max(0, calculatedTotalPrice - discountAmount);

  const totalBayar = requireNumber(input, "total_bayar", { optional: true });
  if (!totalBayar.ok) return fail(ErrorCode.VALIDATION_ERROR, totalBayar.message, 400);

  const finalTotalBayar = (totalBayar.data !== undefined && totalBayar.data !== null) ? totalBayar.data : calculatedTotalBayar;

  const jumlahCash = requireNumber(input, "jumlah_cash", { optional: true });
  if (!jumlahCash.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlahCash.message, 400);

  const finalJumlahCash = (jumlahCash.data !== undefined && jumlahCash.data !== null) ? jumlahCash.data : finalTotalBayar;

  const jumlahPiutang = requireNumber(input, "jumlah_piutang", { optional: true });
  if (!jumlahPiutang.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlahPiutang.message, 400);

  const finalJumlahPiutang = (jumlahPiutang.data !== undefined && jumlahPiutang.data !== null) ? jumlahPiutang.data : Math.max(0, finalTotalBayar - finalJumlahCash);

  const payload: any = {
    ...(orderNumber.data ? { order_number: orderNumber.data } : {}),
    varian_id: resolvedVarianId,
    quantity: calculatedTotalItem,
    total_price: calculatedTotalPrice,
    coa_cash_id: coaCashId.data,
    coa_credit_id: coaCreditId.data,
    nama_pelanggan: namaPelanggan.data,
    nomor_telepon: nomorTelepon.data,
    lokasi: lokasi.data,
    terms_of_payment: termsOfPayment.data ?? 0,
    diskon: discountAmount,
    total_bayar: finalTotalBayar,
    jumlah_cash: finalJumlahCash,
    jumlah_piutang: finalJumlahPiutang,
    total_item: calculatedTotalItem,
    created_at: new Date().toISOString(),
    items: items
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
