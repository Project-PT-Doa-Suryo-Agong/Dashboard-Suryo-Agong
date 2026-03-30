import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  deleteProfileById,
  getProfileById,
  updateProfileById,
} from "@/lib/services/profile.service";
import { parseUpdateProfileByIdInput } from "@/lib/validation/profiles-admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return fail("VALIDATION_ERROR", "ID harus berupa UUID yang valid.", 400);
  }

  const { data, error } = await getProfileById(auth.ctx.supabase, id);

  if (error) {
    return fail("DB_ERROR", "Gagal mengambil data profil.", 500, error.message);
  }

  if (!data) {
    return fail("NOT_FOUND", "Profil tidak ditemukan.", 404);
  }

  return ok({ profile: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return fail("VALIDATION_ERROR", "ID harus berupa UUID yang valid.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body request harus JSON valid.", 400);
  }

  const parsed = parseUpdateProfileByIdInput(body);
  if (!parsed.ok) {
    return fail("VALIDATION_ERROR", parsed.message, 400);
  }

  const { data, error } = await updateProfileById(auth.ctx.supabase, id, parsed.data);

  if (error) {
    return fail("DB_ERROR", "Gagal memperbarui profil.", 500, error.message);
  }

  if (!data) {
    return fail("NOT_FOUND", "Profil tidak ditemukan.", 404);
  }

  return ok({ profile: data }, "Profil berhasil diperbarui.");
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return fail("VALIDATION_ERROR", "ID harus berupa UUID yang valid.", 400);
  }

  const { error, deleted } = await deleteProfileById(auth.ctx.supabase, id);

  if (error) {
    return fail("DB_ERROR", "Gagal menghapus profil.", 500, error.message);
  }

  if (!deleted) {
    return fail("NOT_FOUND", "Profil tidak ditemukan.", 404);
  }

  return ok(null, "Profil berhasil dihapus.");
}
