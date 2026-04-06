import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteVarian, updateVarian } from "@/lib/services/core.service";

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
  const payload = {
    ...input,
    ...(typeof input.nama_varian === "string" ? { nama_varian: input.nama_varian.trim() || null } : {}),
    ...(typeof input.sku === "string" ? { sku: input.sku.trim().toUpperCase() || null } : {}),
  };

  const { data, error } = await updateVarian(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update varian.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Varian tidak ditemukan.", 404);
  return ok({ varian: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteVarian(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus varian.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Varian tidak ditemukan.", 404);
  return ok(null, "Varian berhasil dihapus.");
}
