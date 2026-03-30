import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateAfiliator, deleteAfiliator } from "@/lib/services/sales.service";

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

  const { data, error } = await updateAfiliator(auth.ctx.supabase, id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update afiliator.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Afiliator tidak ditemukan.", 404);
  return ok({ afiliator: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteAfiliator(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus afiliator.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Afiliator tidak ditemukan.", 404);
  return ok(null, "Afiliator berhasil dihapus.");
}
