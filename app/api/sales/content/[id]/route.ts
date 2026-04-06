import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteContentPlanner, updateContentPlanner } from "@/lib/services/sales.service";

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
  if (input.judul !== undefined && (typeof input.judul !== "string" || !input.judul.trim())) {
    return fail("VALIDATION_ERROR", "judul tidak boleh kosong.", 400);
  }
  if (input.platform !== undefined && (typeof input.platform !== "string" || !input.platform.trim())) {
    return fail("VALIDATION_ERROR", "platform tidak boleh kosong.", 400);
  }

  const payload = {
    ...input,
    ...(typeof input.judul === "string" ? { judul: input.judul.trim() } : {}),
    ...(typeof input.platform === "string" ? { platform: input.platform.trim() } : {}),
  };

  const { data, error } = await updateContentPlanner(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update content planner.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Content planner tidak ditemukan.", 404);
  return ok({ content: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteContentPlanner(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus content planner.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Content planner tidak ditemukan.", 404);
  return ok(null, "Content planner berhasil dihapus.");
}
