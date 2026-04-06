import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createVendor, listVendor } from "@/lib/services/core.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listVendor(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil daftar vendor.", 500, error.message);
  return ok({ vendor: data, meta });
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
  if (!input.nama_vendor || typeof input.nama_vendor !== "string" || !input.nama_vendor.trim()) {
    return fail("VALIDATION_ERROR", "nama_vendor wajib diisi.", 400);
  }

  const payload = {
    ...input,
    nama_vendor: (input.nama_vendor as string).trim(),
    kontak: typeof input.kontak === "string" ? input.kontak.trim() || null : null,
  };

  const { data, error } = await createVendor(auth.ctx.supabase, payload);
  if (error) return fail("DB_ERROR", "Gagal membuat vendor.", 500, error.message);
  return ok({ vendor: data }, "Vendor berhasil dibuat.", 201);
}