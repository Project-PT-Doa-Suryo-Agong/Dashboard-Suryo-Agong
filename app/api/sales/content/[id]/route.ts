import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteContentPlanner, updateContentPlanner } from "@/lib/services/sales.service";
import { requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("judul" in input) {
    const judul = requireString(input, "judul", { maxLen: 180 });
    if (!judul.ok) return fail(ErrorCode.VALIDATION_ERROR, judul.message, 400);
  }
  if ("platform" in input) {
    const platform = requireString(input, "platform", { maxLen: 120, optional: true });
    if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);
  }

  const payload: Record<string, any> = {};
  if ("judul" in input) payload.judul = typeof input.judul === "string" ? input.judul.trim() : input.judul;
  if ("platform" in input) payload.platform = typeof input.platform === "string" ? input.platform.trim() : input.platform;
  if ("affiliator_id" in input) payload.affiliator_id = typeof input.affiliator_id === "string" ? input.affiliator_id.trim() : null;
  if ("jadwal" in input) payload.jadwal = typeof input.jadwal === "string" ? input.jadwal.trim() : null;
  if ("tipe" in input) payload.tipe = typeof input.tipe === "string" ? input.tipe.trim() : null;
  if ("status" in input) payload.status = typeof input.status === "string" ? input.status.trim() : null;

  if (Object.keys(payload).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field valid yang diupdate.", 400);
  }

  const { data, error } = await updateContentPlanner(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update content planner.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Content planner tidak ditemukan.", 404);
  return ok({ content: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteContentPlanner(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus content planner.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Content planner tidak ditemukan.", 404);
  return ok(null, "Content planner berhasil dihapus.");
}
