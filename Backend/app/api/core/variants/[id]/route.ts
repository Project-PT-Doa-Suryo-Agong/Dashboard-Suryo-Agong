import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getVarianById, updateVarian, deleteVarian } from "@/lib/services/core.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const { data, error } = await getVarianById(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal mengambil data varian.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Varian tidak ditemukan.", 404);
  return ok({ varian: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const { data, error } = await updateVarian(auth.ctx.supabase, params.id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update varian.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Varian tidak ditemukan.", 404);
  return ok({ varian: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { error, deleted } = await deleteVarian(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal hapus varian.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Varian tidak ditemukan.", 404);
  return ok(null, "Varian berhasil dihapus.");
}
