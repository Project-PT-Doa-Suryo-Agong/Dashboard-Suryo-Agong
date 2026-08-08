import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUUID } from "@/lib/validation/body-validator";

type PostAcquisitionResult = {
  success: boolean;
  error_code?: string;
  message?: string;
  journal_id?: string;
};

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
  const assetId = requireUUID(input, "asset_id");
  if (!assetId.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, "Format asset_id tidak valid.", 400);
  }

  const coaKasId = requireUUID(input, "coa_kas_id");
  if (!coaKasId.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, "Format coa_kas_id tidak valid.", 400);
  }

  const { data, error } = await (supabaseAdmin as any)
    .schema("finance")
    .rpc("fn_post_asset_acquisition_journal", {
      p_asset_id: assetId.data,
      p_coa_kas_id: coaKasId.data,
    });

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal memposting jurnal akuisisi.", 500, error.message);
  }

  const result = data as PostAcquisitionResult;

  if (!result.success) {
    switch (result.error_code) {
      case "ALREADY_POSTED":
        return fail(ErrorCode.ALREADY_EXISTS, result.message || "Aset sudah memiliki jurnal akuisisi.", 409);
      case "ASSET_NOT_FOUND":
        return fail(ErrorCode.NOT_FOUND, result.message || "Data aset tidak ditemukan.", 404);
      case "COA_NOT_FOUND":
        return fail(ErrorCode.VALIDATION_ERROR, result.message || "Akun kas tidak ditemukan.", 422);
      case "ASSET_COA_MISSING":
        return fail(ErrorCode.VALIDATION_ERROR, result.message || "Aset belum memiliki akun aset.", 422);
      case "INVALID_AMOUNT":
        return fail(ErrorCode.VALIDATION_ERROR, result.message || "Nilai perolehan tidak valid.", 422);
      default:
        return fail(ErrorCode.DB_ERROR, result.message || "Gagal memposting jurnal akuisisi.", 500);
    }
  }

  return ok({ journal_id: result.journal_id }, result.message || "Jurnal akuisisi aset berhasil diposting.", 201);
}
