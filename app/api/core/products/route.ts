import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createProduk, listProduk } from "@/lib/services/core.service";
import { requireString } from "@/lib/validation/body-validator";
import type { MProdukInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listProduk(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar produk.", 500, error.message);
  return ok({ produk: data, meta });
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
  const namaProduk = requireString(input, "nama_produk", { maxLen: 120 });
  if (!namaProduk.ok) return fail(ErrorCode.VALIDATION_ERROR, namaProduk.message, 400);
  const kategori = requireString(input, "kategori", { maxLen: 120, optional: true });
  if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);

  const payload: MProdukInsert = {
    ...input,
    nama_produk: namaProduk.data!,
    kategori: kategori.data,
  };

  const { data, error } = await createProduk(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat produk.", 500, error.message);
  return ok({ produk: data }, "Produk berhasil dibuat.", 201);
}