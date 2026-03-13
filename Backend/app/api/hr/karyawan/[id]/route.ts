import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { getKaryawanById, updateKaryawan, deleteKaryawan } from "@/lib/services/hr.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { data, error } = await getKaryawanById(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal mengambil data karyawan.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Karyawan tidak ditemukan.", 404);
  return ok({ karyawan: data });
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const { data, error } = await updateKaryawan(auth.ctx.supabase, params.id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update karyawan.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Karyawan tidak ditemukan.", 404);
  return ok({ karyawan: data });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { error, deleted } = await deleteKaryawan(auth.ctx.supabase, params.id);
  if (error) return fail("DB_ERROR", "Gagal hapus karyawan.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Karyawan tidak ditemukan.", 404);
  return ok(null, "Karyawan berhasil dihapus.");
}
