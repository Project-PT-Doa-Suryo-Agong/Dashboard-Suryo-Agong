import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getProdukById, updateProduk, deleteProduk } from "@/lib/services/core.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data, error } = await getProdukById(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal mengambil data produk.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Produk tidak ditemukan.", 404);
  return ok({ produk: data });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const { data, error } = await updateProduk(auth.ctx.supabase, id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update produk.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Produk tidak ditemukan.", 404);
  return ok({ produk: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteProduk(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus produk.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Produk tidak ditemukan.", 404);
  return ok(null, "Produk berhasil dihapus.");
}
