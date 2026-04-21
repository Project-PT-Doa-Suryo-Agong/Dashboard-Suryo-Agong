import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  getEmployeeContractFormFields,
  getContractTemplateTypes,
  listContractTemplates,
} from "@/lib/services/hr-contract-template.service";
import { ErrorCode } from "@/lib/http/error-codes";

export const runtime = "nodejs";

export async function GET() {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  try {
    const templates = await listContractTemplates();

    return ok({
      templates,
      formFields: getEmployeeContractFormFields(),
      supportedTypes: getContractTemplateTypes(),
      companyProfile: {
        company_name: "PT DOA SURYO AGONG",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar template kontrak.", 500, message);
  }
}
