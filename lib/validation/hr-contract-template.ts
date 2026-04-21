import type { HrContractTemplateType } from "@/lib/services/hr-contract-template.service";

type ParseError = { ok: false; message: string };

type TemplateUpdateInput = {
  title?: string;
  description?: string;
  content?: string;
};

type ContractGenerateInput = {
  templateType: HrContractTemplateType;
  employee: Record<string, unknown>;
};

export function parseContractTemplateUpdateInput(payload: unknown):
  | { ok: true; data: TemplateUpdateInput }
  | ParseError {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;
  const data: TemplateUpdateInput = {};

  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return { ok: false, message: "title harus berupa string dan tidak boleh kosong." };
    }
    data.title = body.title.trim();
  }

  if ("description" in body) {
    if (typeof body.description !== "string" || body.description.trim() === "") {
      return { ok: false, message: "description harus berupa string dan tidak boleh kosong." };
    }
    data.description = body.description.trim();
  }

  if ("content" in body) {
    if (typeof body.content !== "string" || body.content.trim() === "") {
      return { ok: false, message: "content harus berupa string dan tidak boleh kosong." };
    }
    data.content = body.content;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, message: "Tidak ada field template yang dapat diupdate." };
  }

  return { ok: true, data };
}

export function parseGenerateContractInput(payload: unknown):
  | { ok: true; data: ContractGenerateInput }
  | ParseError {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.templateType !== "string" || body.templateType.trim() === "") {
    return { ok: false, message: "templateType wajib diisi." };
  }

  if (!body.employee || typeof body.employee !== "object" || Array.isArray(body.employee)) {
    return { ok: false, message: "employee wajib berupa object informasi karyawan." };
  }

  return {
    ok: true,
    data: {
      templateType: body.templateType as HrContractTemplateType,
      employee: body.employee as Record<string, unknown>,
    },
  };
}
