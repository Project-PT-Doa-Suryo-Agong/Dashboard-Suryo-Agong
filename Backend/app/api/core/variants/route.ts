import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listVarian, createVarian } from "@/lib/services/core.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const produkId = url.searchParams.get("produk_id") ?? undefined;

  const { data, error } = await listVarian(auth.ctx.supabase, produkId);
  if (error) return fail("DB_ERROR", "Gagal mengambil data varian.", 500, error.message);
  return ok({ varian: data });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.product_id || !input.nama_varian) {
    return fail("VALIDATION_ERROR", "product_id dan nama_varian wajib diisi.", 400);
  }

  const { data, error } = await createVarian(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal membuat varian.", 500, error.message);
  return ok({ varian: data }, "Varian berhasil dibuat.", 201);
}
