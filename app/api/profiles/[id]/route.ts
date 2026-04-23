import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  deleteProfileAndAuthByIdAsAdmin,
  getProfileById,
  updateProfileAuthPasswordById,
  updateProfileById,
  updateProfileByIdAsAdmin,
} from "@/lib/services/profile.service";
import { parseUpdateProfileByIdInput } from "@/lib/validation/profiles-admin";
import { ErrorCode } from "@/lib/http/error-codes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return fail(ErrorCode.VALIDATION_ERROR, "ID harus berupa UUID yang valid.", 400);
  }

  const { data, error } = await getProfileById(auth.ctx.supabase, id);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data profil.", 500, error.message);
  }

  if (!data) {
    return fail(ErrorCode.NOT_FOUND, "Profil tidak ditemukan.", 404);
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
    return fail(ErrorCode.VALIDATION_ERROR, "ID harus berupa UUID yang valid.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
  }

  if (!body || typeof body !== "object") {
    return fail(ErrorCode.VALIDATION_ERROR, "Body request harus berupa object JSON.", 400);
  }

  const payload = body as Record<string, unknown>;
  const hasProfileFields =
    payload.nama !== undefined ||
    payload.role !== undefined ||
    payload.phone !== undefined;
  const hasRoleField = payload.role !== undefined;
  const hasPasswordField = payload.password !== undefined;

  if (!hasProfileFields && !hasPasswordField) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang dapat diupdate.", 400);
  }

  let parsedPassword: string | null = null;
  if (hasPasswordField) {
    if (typeof payload.password !== "string" || payload.password.length < 6) {
      return fail(ErrorCode.VALIDATION_ERROR, "password minimal 6 karakter.", 400);
    }
    parsedPassword = payload.password;
  }

  let updatedProfile = null;

  if (hasProfileFields) {
    const parsed = parseUpdateProfileByIdInput({
      nama: payload.nama,
      role: payload.role,
      phone: payload.phone,
    });
    if (!parsed.ok) {
      return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
    }

    const { data, error } = hasRoleField
      ? await updateProfileByIdAsAdmin(id, parsed.data)
      : await updateProfileById(auth.ctx.supabase, id, parsed.data);

    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal memperbarui profil.", 500, error.message);
    }

    if (!data) {
      return fail(ErrorCode.NOT_FOUND, "Profil tidak ditemukan.", 404);
    }

    updatedProfile = data;
  }

  if (parsedPassword !== null) {
    const { data: actorProfile, error: actorProfileError } = await getProfileById(
      auth.ctx.supabase,
      auth.ctx.userId
    );

    if (actorProfileError) {
      return fail(ErrorCode.DB_ERROR, "Gagal memverifikasi role user.", 500, actorProfileError.message);
    }

    if (!actorProfile || actorProfile.role !== "Super Admin") {
      return fail(ErrorCode.FORBIDDEN, "Hanya Super Admin yang dapat mengubah password user lain.", 403);
    }

    if (id === auth.ctx.userId) {
      return fail(ErrorCode.FORBIDDEN, "Perubahan password sendiri tidak diizinkan di endpoint ini.", 403);
    }

    const { error: updatePasswordError } = await updateProfileAuthPasswordById(id, parsedPassword);
    if (updatePasswordError) {
      return fail(
        ErrorCode.DB_ERROR,
        "Gagal memperbarui password user.",
        500,
        updatePasswordError.message
      );
    }
  }

  if (!updatedProfile) {
    const { data, error } = await getProfileById(auth.ctx.supabase, id);
    if (error) {
      return fail(ErrorCode.DB_ERROR, "Gagal mengambil data profil.", 500, error.message);
    }
    if (!data) {
      return fail(ErrorCode.NOT_FOUND, "Profil tidak ditemukan.", 404);
    }
    updatedProfile = data;
  }

  const message =
    parsedPassword !== null
      ? "Profil berhasil diperbarui dan password user berhasil diubah."
      : "Profil berhasil diperbarui.";

  return ok({ profile: updatedProfile }, message);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return fail(ErrorCode.VALIDATION_ERROR, "ID harus berupa UUID yang valid.", 400);
  }

  const { error, deleted, authError } = await deleteProfileAndAuthByIdAsAdmin(id);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal menghapus profil.", 500, error.message);
  }

  if (!deleted) {
    return fail(ErrorCode.NOT_FOUND, "Profil tidak ditemukan.", 404);
  }

  if (authError) {
    return fail(
      ErrorCode.DB_ERROR,
      "Profil berhasil dihapus, tetapi akun auth gagal dihapus.",
      500,
      authError.message,
    );
  }

  return ok(null, "Profil berhasil dihapus.");
}
