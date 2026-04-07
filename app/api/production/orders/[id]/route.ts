import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getProduksiOrderById, updateProduksiOrder, deleteProduksiOrder } from "@/lib/services/production.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data, error } = await getProduksiOrderById(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data produksi order.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Produksi order tidak ditemukan.", 404);
  return ok({ order: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("vendor_id" in input) {
    const vendorId = requireUUID(input, "vendor_id", { optional: true });
    if (!vendorId.ok) return fail(ErrorCode.VALIDATION_ERROR, vendorId.message, 400);
  }
  if ("product_id" in input) {
    const productId = requireUUID(input, "product_id", { optional: true });
    if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
  }
  if ("quantity" in input) {
    const quantity = requireNumber(input, "quantity", { min: 0, optional: true });
    if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);
  }
  if ("status" in input) {
    const status = requireString(input, "status", { optional: true });
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (status.data !== null && !["draft", "ongoing", "done"].includes(status.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus draft, ongoing, atau done.", 400);
    }
  }

  const { data, error } = await updateProduksiOrder(auth.ctx.supabase, id, input);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update produksi order.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Produksi order tidak ditemukan.", 404);
  return ok({ order: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteProduksiOrder(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus produksi order.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Produksi order tidak ditemukan.", 404);
  return ok(null, "Produksi order berhasil dihapus.");
}
