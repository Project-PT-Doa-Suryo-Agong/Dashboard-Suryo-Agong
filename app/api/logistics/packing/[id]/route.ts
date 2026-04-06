import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deletePacking, updatePacking } from "@/lib/services/logistics.service";

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
  if (input.status && !["pending", "packed", "shipped"].includes(String(input.status))) {
    return fail("VALIDATION_ERROR", "status harus pending, packed, atau shipped.", 400);
  }

  const { data, error } = await updatePacking(auth.ctx.supabase, id, input);
  if (error) return fail("DB_ERROR", "Gagal update packing.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Data packing tidak ditemukan.", 404);
  return ok({ packing: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deletePacking(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus data packing.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Data packing tidak ditemukan.", 404);
  return ok(null, "Data packing berhasil dihapus.");
}
