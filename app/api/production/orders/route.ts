import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listProduksiOrder, createProduksiOrder } from "@/lib/services/production.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listProduksiOrder(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data produksi order.", 500, error.message);
  return ok({ orders: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.vendor_id || !input.product_id) {
    return fail("VALIDATION_ERROR", "vendor_id dan product_id wajib diisi.", 400);
  }
  if (input.quantity === undefined || typeof input.quantity !== "number") {
    return fail("VALIDATION_ERROR", "quantity wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createProduksiOrder(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal membuat produksi order.", 500, error.message);
  return ok({ order: data }, "Produksi order berhasil dibuat.", 201);
}
