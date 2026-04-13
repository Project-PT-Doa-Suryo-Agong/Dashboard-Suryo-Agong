import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createManifest, listManifest } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TLogistikManifestInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listManifest(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data manifest.", 500, error.message);
  return ok({ manifest: data, meta });
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
  const orderId = requireUUID(input, "order_id");
  if (!orderId.ok) return fail(ErrorCode.VALIDATION_ERROR, orderId.message, 400);
  if (!orderId.data) return fail(ErrorCode.VALIDATION_ERROR, "order_id wajib diisi.", 400);
  const resi = requireString(input, "resi", { maxLen: 120, optional: true });
  if (!resi.ok) return fail(ErrorCode.VALIDATION_ERROR, resi.message, 400);

  const payload: TLogistikManifestInsert = {
    ...input,
    order_id: orderId.data,
    resi: resi.data,
  };

  const { data, error } = await createManifest(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat manifest.", 500, error.message);
  return ok({ manifest: data }, "Manifest berhasil dibuat.", 201);
}
