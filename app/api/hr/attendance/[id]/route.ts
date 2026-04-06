import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateAttendance, deleteAttendance } from "@/lib/services/hr.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (
    input.status !== undefined &&
    input.status !== "hadir" &&
    input.status !== "izin" &&
    input.status !== "sakit" &&
    input.status !== "alpha"
  ) {
    return fail("VALIDATION_ERROR", "status harus hadir, izin, sakit, atau alpha.", 400);
  }

  const { data, error } = await updateAttendance(auth.ctx.supabase, id, input);
  if (error) return fail("DB_ERROR", "Gagal update attendance.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Data attendance tidak ditemukan.", 404);
  return ok({ attendance: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteAttendance(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus attendance.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Data attendance tidak ditemukan.", 404);
  return ok(null, "Data attendance berhasil dihapus.");
}
