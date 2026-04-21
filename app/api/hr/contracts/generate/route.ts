import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { generateContractDraft, isContractTemplateType } from "@/lib/services/hr-contract-template.service";
import { parseGenerateContractInput } from "@/lib/validation/hr-contract-template";
import { ErrorCode } from "@/lib/http/error-codes";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
  }

  const parsed = parseGenerateContractInput(body);
  if (!parsed.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
  }

  if (!isContractTemplateType(parsed.data.templateType)) {
    return fail(ErrorCode.VALIDATION_ERROR, "templateType tidak valid. Gunakan pkwt atau pkwtp.", 400);
  }

  try {
    const result = await generateContractDraft(parsed.data);

    if (!result.found) {
      return fail(ErrorCode.NOT_FOUND, "Template tidak ditemukan.", 404);
    }

    if (result.missingFields.length > 0) {
      return fail(
        ErrorCode.VALIDATION_ERROR,
        "Informasi karyawan belum lengkap.",
        400,
        { missingFields: result.missingFields }
      );
    }

    return ok(
      {
        draft: result.draft,
      },
      "Draft surat kontrak berhasil di-generate."
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal generate draft surat kontrak.", 500, message);
  }
}
