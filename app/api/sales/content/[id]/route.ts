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

  const payload = {
    ...input,
    ...(typeof input.judul === "string" ? { judul: input.judul.trim() } : {}),
    ...(typeof input.platform === "string" ? { platform: input.platform.trim() } : {}),
  };

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
