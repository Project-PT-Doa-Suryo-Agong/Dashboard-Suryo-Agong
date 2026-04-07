import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createProfile, listProfiles } from "@/lib/services/profile.service";
import { parseCreateProfileInput } from "@/lib/validation/profiles-admin";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.max(Number(url.searchParams.get("limit")) || 50, 1);

  const { data, error, meta } = await listProfiles(auth.ctx.supabase, page, limit);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar profil.", 500, error.message);
  }

  return ok({ profiles: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
  }

  const parsed = parseCreateProfileInput(body);
  if (!parsed.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
  }

  const { data, error } = await createProfile(auth.ctx.supabase, parsed.data);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal membuat profil baru.", 500, error.message);
  }

  return ok({ profile: data }, "Profil berhasil dibuat.", 201);
}
