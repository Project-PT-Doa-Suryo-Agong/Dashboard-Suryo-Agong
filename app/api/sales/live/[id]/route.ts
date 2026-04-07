import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteLivePerformance, updateLivePerformance } from "@/lib/services/sales.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("platform" in input) {
    const platform = requireString(input, "platform", { maxLen: 120 });
    if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);
  }
  if ("revenue" in input) {
    const revenue = requireNumber(input, "revenue", { min: 0, optional: true });
    if (!revenue.ok) return fail(ErrorCode.VALIDATION_ERROR, revenue.message, 400);
  }

  const payload = {
    ...input,
    ...(typeof input.platform === "string" ? { platform: input.platform.trim() } : {}),
  };

  const { data, error } = await updateLivePerformance(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update live performance.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data live performance tidak ditemukan.", 404);
  return ok({ live: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteLivePerformance(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus live performance.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data live performance tidak ditemukan.", 404);
  return ok(null, "Data live performance berhasil dihapus.");
}
