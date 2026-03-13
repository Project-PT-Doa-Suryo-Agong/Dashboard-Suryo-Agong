import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listProduk, createProduk } from "@/lib/services/core.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listProduk(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data produk.", 500, error.message);
  return ok({ produk: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.nama_produk || typeof input.nama_produk !== "string") {
    return fail("VALIDATION_ERROR", "nama_produk wajib diisi.", 400);
  }
  if (!input.kategori || typeof input.kategori !== "string") {
    return fail("VALIDATION_ERROR", "kategori wajib diisi dan harus string.", 400);
  }

  const { data, error } = await createProduk(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal membuat produk.", 500, error.message);
  return ok({ produk: data }, "Produk berhasil dibuat.", 201);
}
