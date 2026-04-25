import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateSalesOrder, deleteSalesOrder } from "@/lib/services/sales.service";
import { requireNumber, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

function errorMessageOf(error: unknown): string {
  if (!error || typeof error !== "object") return "Unknown DB error";
  const maybe = error as { message?: unknown };
  return typeof maybe.message === "string" ? maybe.message : "Unknown DB error";
}

async function cleanupSalesOrderDependencies(orderId: string) {
  const logistics = (supabaseAdmin as any).schema("logistics");

  const [{ error: returnError }, { error: packingError }, { error: manifestError }] = await Promise.all([
    logistics.from("t_return_order").delete().eq("order_id", orderId),
    logistics.from("t_packing").delete().eq("order_id", orderId),
    logistics.from("t_logistik_manifest").delete().eq("order_id", orderId),
  ]);

  const firstError = returnError || packingError || manifestError;
  return { error: firstError ?? null };
}

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
  if ("varian_id" in input) {
    const varianId = requireUUID(input, "varian_id", { optional: true });
    if (!varianId.ok) return fail(ErrorCode.VALIDATION_ERROR, varianId.message, 400);
  }
  if ("affiliator_id" in input) {
    const affiliatorId = requireUUID(input, "affiliator_id", { optional: true });
    if (!affiliatorId.ok) return fail(ErrorCode.VALIDATION_ERROR, affiliatorId.message, 400);
  }
  if ("quantity" in input) {
    const quantity = requireNumber(input, "quantity", { min: 1 });
    if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);
  }
  if ("total_price" in input) {
    const totalPrice = requireNumber(input, "total_price", { min: 0 });
    if (!totalPrice.ok) return fail(ErrorCode.VALIDATION_ERROR, totalPrice.message, 400);
  }
  if ("coa_id" in input) {
    const coaId = requireUUID(input, "coa_id", { optional: true });
    if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);
  }

  const { data, error } = await updateSalesOrder(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update sales order.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Sales order tidak ditemukan.", 404);
  return ok({ order: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let { error, deleted } = await deleteSalesOrder(auth.ctx.supabase, id);

  // RLS pada tabel sales order bisa mengembalikan deleted=false (tanpa error)
  // walau row sebenarnya ada. Retry dengan service-role untuk role app yang sudah lolos guard.
  if (error || !deleted) {
    const cleanup = await cleanupSalesOrderDependencies(id);
    if (cleanup.error) {
      const detail = errorMessageOf(cleanup.error);
      return fail(ErrorCode.DB_ERROR, `Gagal hapus relasi sales order di logistics. Detail: ${detail}`, 500, detail);
    }

    const retry = await deleteSalesOrder(supabaseAdmin as any, id);
    error = retry.error;
    deleted = retry.deleted;
  }

  if (error) {
    const detail = errorMessageOf(error);
    if (detail.toLowerCase().includes("permission denied for table t_sales_order")) {
      return fail(
        ErrorCode.DB_ERROR,
        "Gagal hapus sales order. Permission DELETE tabel sales.t_sales_order belum benar. Jalankan SQL fix: supabase/fix-sales-order-delete-permissions.sql",
        500,
        detail,
      );
    }
    return fail(ErrorCode.DB_ERROR, `Gagal hapus sales order. Detail: ${detail}`, 500, detail);
  }
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Sales order tidak ditemukan.", 404);
  return ok(null, "Sales order berhasil dihapus.");
}
