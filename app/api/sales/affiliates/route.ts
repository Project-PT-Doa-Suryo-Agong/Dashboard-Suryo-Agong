import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createAfiliator, listAfiliator } from "@/lib/services/sales.service";
import { requireString } from "@/lib/validation/body-validator";
import type { MAfiliatorInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listAfiliator(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data affiliator.", 500, error.message);
  return ok({ afiliator: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const nama = requireString(input, "nama", { maxLen: 120 });
  if (!nama.ok) return fail(ErrorCode.VALIDATION_ERROR, nama.message, 400);
  const platform = requireString(input, "platform", { maxLen: 120, optional: true });
  if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);

  const payload: MAfiliatorInsert = {
    ...input,
    nama: nama.data!,
    platform: platform.data,
  };

  const { data, error } = await createAfiliator(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat affiliator.", 500, error.message);
  return ok({ afiliator: data }, "Affiliator berhasil dibuat.", 201);
}
