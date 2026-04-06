import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteManifest, updateManifest } from "@/lib/services/logistics.service";

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
  if (input.resi !== undefined && (typeof input.resi !== "string" || !input.resi.trim())) {
    return fail("VALIDATION_ERROR", "resi tidak boleh kosong.", 400);
  }

  const payload = {
    ...input,
    ...(typeof input.resi === "string" ? { resi: input.resi.trim() } : {}),
  };

  const { data, error } = await updateManifest(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update manifest.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Data manifest tidak ditemukan.", 404);
  return ok({ manifest: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteManifest(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus manifest.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Data manifest tidak ditemukan.", 404);
  return ok(null, "Manifest berhasil dihapus.");
}
