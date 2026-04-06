import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createVarian, listVarian } from "@/lib/services/core.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id") ?? undefined;

  const { data, error } = await listVarian(auth.ctx.supabase, productId);
  if (error) return fail("DB_ERROR", "Gagal mengambil daftar varian.", 500, error.message);
  return ok({ varian: data });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (!input.product_id) {
    return fail("VALIDATION_ERROR", "product_id wajib diisi.", 400);
  }

  const payload = {
    ...input,
    nama_varian: typeof input.nama_varian === "string" ? input.nama_varian.trim() || null : null,
    sku: typeof input.sku === "string" ? input.sku.trim().toUpperCase() || null : null,
  };

  const { data, error } = await createVarian(auth.ctx.supabase, payload);
  if (error) return fail("DB_ERROR", "Gagal membuat varian.", 500, error.message);
  return ok({ varian: data }, "Varian berhasil dibuat.", 201);
}
