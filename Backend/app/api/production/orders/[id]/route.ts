import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getProduksiOrderById, updateProduksiOrder, deleteProduksiOrder } from "@/lib/services/production.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { data, error } = await getProduksiOrderById(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal mengambil data produksi order.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Produksi order tidak ditemukan.", 404);
  return ok({ order: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const { data, error } = await updateProduksiOrder(auth.ctx.supabase, params.id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update produksi order.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Produksi order tidak ditemukan.", 404);
  return ok({ order: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { error, deleted } = await deleteProduksiOrder(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal hapus produksi order.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Produksi order tidak ditemukan.", 404);
  return ok(null, "Produksi order berhasil dihapus.");
}
