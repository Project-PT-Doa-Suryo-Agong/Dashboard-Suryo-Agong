import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateReturnOrder, deleteReturnOrder } from "@/lib/services/logistics.service";

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

  const { data, error } = await updateReturnOrder(auth.ctx.supabase, id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update data retur.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Data retur tidak ditemukan.", 404);
  return ok({ return: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteReturnOrder(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus data retur.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Data retur tidak ditemukan.", 404);
  return ok(null, "Data retur berhasil dihapus.");
}
