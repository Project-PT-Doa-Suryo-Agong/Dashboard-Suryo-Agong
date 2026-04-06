import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteVendor, updateVendor } from "@/lib/services/core.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (input.nama_vendor !== undefined && (typeof input.nama_vendor !== "string" || !input.nama_vendor.trim())) {
    return fail("VALIDATION_ERROR", "nama_vendor tidak boleh kosong.", 400);
  }

  const payload = {
    ...input,
    ...(typeof input.nama_vendor === "string" ? { nama_vendor: input.nama_vendor.trim() } : {}),
    ...(typeof input.kontak === "string" ? { kontak: input.kontak.trim() || null } : {}),
  };

  const { data, error } = await updateVendor(auth.ctx.supabase, id, payload);
  if (error) return fail("DB_ERROR", "Gagal update vendor.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Vendor tidak ditemukan.", 404);
  return ok({ vendor: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteVendor(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal menghapus vendor.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Vendor tidak ditemukan.", 404);
  return ok(null, "Vendor berhasil dihapus.");
}
