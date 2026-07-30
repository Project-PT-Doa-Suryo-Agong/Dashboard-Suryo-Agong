import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUUID } from "@/lib/validation/body-validator";

type PostDepreciationResult = {
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
  const scheduleId = requireUUID(input, "schedule_id");
  if (!scheduleId.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, "Format schedule_id tidak valid.", 400);
  }

  console.log("[DEP POST] Calling RPC fn_post_depreciation_journal with:", {
    p_schedule_id: scheduleId.data,
  });

  const { data, error } = await (supabaseAdmin as any)
    .schema("finance")
    .rpc("fn_post_depreciation_journal", {
      p_schedule_id: scheduleId.data,
    });

  // ── DEBUG LOGGING SEMENTARA ────────────────────────────────────────────────
  console.log("[DEP POST] RPC raw data:", JSON.stringify(data, null, 2));
  if (error) {
    const _e = error as unknown as Record<string, unknown>;
    console.error("[DEP POST] RPC ERROR message :", error.message);
    console.error("[DEP POST] RPC ERROR code    :", _e.code);
    console.error("[DEP POST] RPC ERROR details :", _e.details);
    console.error("[DEP POST] RPC ERROR hint    :", _e.hint);
    console.error("[DEP POST] RPC ERROR full    :", JSON.stringify(error, null, 2));
  }
  // ── END DEBUG LOGGING ──────────────────────────────────────────────────────

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal memposting jurnal penyusutan.", 500, error.message);
  }

  const result = data as PostDepreciationResult;

  console.log("[DEP POST] RPC result.success   :", result?.success);
  console.log("[DEP POST] RPC result.error_code:", result?.error_code);
  console.log("[DEP POST] RPC result.message   :", result?.message);
  console.log("[DEP POST] RPC result.journal_id:", result?.journal_id);

  if (!result.success) {
    switch (result.error_code) {
      case "ALREADY_POSTED":
        return fail(ErrorCode.ALREADY_EXISTS, result.message || "Schedule sudah terposting.", 409);
      case "RECOVERED_EXISTING_JOURNAL":
        return ok({ journal_id: result.journal_id, recovered: true }, result.message || "Jurnal penyusutan berhasil dipulihkan dan dikaitkan ke schedule.", 200);
      case "INVALID_EXISTING_JOURNAL":
        return fail(ErrorCode.VALIDATION_ERROR, result.message || "Jurnal existing ditemukan tetapi strukturnya tidak valid.", 422);
      case "SCHEDULE_NOT_FOUND":
        return fail(ErrorCode.NOT_FOUND, result.message || "Schedule tidak ditemukan.", 404);
      case "ASSET_NOT_FOUND":
        return fail(ErrorCode.NOT_FOUND, result.message || "Aset tidak ditemukan.", 404);
      default:
        return fail(ErrorCode.DB_ERROR, result.message || "Gagal memposting jurnal penyusutan.", 500);
    }
  }

  return ok({ journal_id: result.journal_id }, result.message || "Jurnal penyusutan berhasil diposting.", 201);
}