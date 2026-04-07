import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createVarian, listVarian } from "@/lib/services/core.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { MVarianInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id") ?? undefined;

  const { data, error } = await listVarian(auth.ctx.supabase, productId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar varian.", 500, error.message);
  return ok({ varian: data });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const productId = requireUUID(input, "product_id", { optional: true });
  if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
  const namaVarian = requireString(input, "nama_varian", { maxLen: 120, optional: true });
  if (!namaVarian.ok) return fail(ErrorCode.VALIDATION_ERROR, namaVarian.message, 400);
  const sku = requireString(input, "sku", { maxLen: 64, optional: true });
  if (!sku.ok) return fail(ErrorCode.VALIDATION_ERROR, sku.message, 400);
  const harga = requireNumber(input, "harga", { min: 0, optional: true });
  if (!harga.ok) return fail(ErrorCode.VALIDATION_ERROR, harga.message, 400);

  const payload: MVarianInsert = {
    ...input,
    product_id: productId.data,
    nama_varian: namaVarian.data,
    sku: typeof sku.data === "string" ? sku.data.toUpperCase() : sku.data,
    harga: harga.data,
  };

  const { data, error } = await createVarian(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat varian.", 500, error.message);
  return ok({ varian: data }, "Varian berhasil dibuat.", 201);
}
