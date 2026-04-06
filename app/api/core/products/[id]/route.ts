import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteProduk, updateProduk } from "@/lib/services/core.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (input.nama_produk !== undefined && (typeof input.nama_produk !== "string" || !input.nama_produk.trim())) {
    return fail("VALIDATION_ERROR", "nama_produk tidak boleh kosong.", 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama_produk === "string" ? { nama_produk: input.nama_produk.trim() } : {}),
    ...(typeof input.kategori === "string" ? { kategori: input.kategori.trim() || null } : {}),
  };

  const { data, error } = await updateProduk(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update produk.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Produk tidak ditemukan.", 404);
  return ok({ produk: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteProduk(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus produk.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Produk tidak ditemukan.", 404);
  return ok(null, "Produk berhasil dihapus.");
}
