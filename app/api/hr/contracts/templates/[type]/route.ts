import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  getContractTemplateByType,
  isContractTemplateType,
  updateContractTemplateByType,
} from "@/lib/services/hr-contract-template.service";
import { parseContractTemplateUpdateInput } from "@/lib/validation/hr-contract-template";
import { ErrorCode } from "@/lib/http/error-codes";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { type } = await params;

  if (!isContractTemplateType(type)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tipe template tidak valid.", 400);
  }

  try {
    const template = await getContractTemplateByType(type);
    if (!template) {
      return fail(ErrorCode.NOT_FOUND, "Template tidak ditemukan.", 404);
    }

    return ok({ templateType: type, template });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil detail template kontrak.", 500, message);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { type } = await params;

  if (!isContractTemplateType(type)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tipe template tidak valid.", 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
  }

  const parsed = parseContractTemplateUpdateInput(body);
  if (!parsed.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
  }

  try {
    const updated = await updateContractTemplateByType(type, parsed.data);

    if (!updated) {
      return fail(ErrorCode.NOT_FOUND, "Template tidak ditemukan.", 404);
    }

    return ok(
      { templateType: type, template: updated },
      "Template kontrak berhasil diperbarui."
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal memperbarui template kontrak.", 500, message);
  }
}
