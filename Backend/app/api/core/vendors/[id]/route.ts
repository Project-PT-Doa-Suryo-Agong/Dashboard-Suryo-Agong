import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getVendorById, updateVendor, deleteVendor } from "@/lib/services/core.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { data, error } = await getVendorById(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal mengambil data vendor.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Vendor tidak ditemukan.", 404);
  return ok({ vendor: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const { data, error } = await updateVendor(auth.ctx.supabase, params.id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update vendor.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Vendor tidak ditemukan.", 404);
  return ok({ vendor: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { error, deleted } = await deleteVendor(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal hapus vendor.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Vendor tidak ditemukan.", 404);
  return ok(null, "Vendor berhasil dihapus.");
}
