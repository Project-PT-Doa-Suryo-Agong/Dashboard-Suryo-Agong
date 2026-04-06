import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteAfiliator, updateAfiliator } from "@/lib/services/sales.service";

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
  if (input.nama !== undefined && (typeof input.nama !== "string" || !input.nama.trim())) {
    return fail("VALIDATION_ERROR", "nama tidak boleh kosong.", 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama === "string" ? { nama: input.nama.trim() } : {}),
    ...(typeof input.platform === "string" ? { platform: input.platform.trim() || null } : {}),
  };

  const { data, error } = await updateAfiliator(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update affiliator.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Affiliator tidak ditemukan.", 404);
  return ok({ afiliator: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteAfiliator(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus affiliator.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Affiliator tidak ditemukan.", 404);
  return ok(null, "Affiliator berhasil dihapus.");
}
