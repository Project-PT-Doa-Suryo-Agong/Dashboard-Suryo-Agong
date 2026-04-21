import { promises as fs } from "node:fs";
import path from "node:path";

export type HrContractTemplateType = "pkwt" | "pkwtp";

type ContractTemplateRecord = {
  title: string;
  description: string;
  content: string;
};

type ContractTemplateStore = {
  templates: Record<HrContractTemplateType, ContractTemplateRecord>;
};

export type ContractTemplateField = {
  key: string;
  label: string;
  required: boolean;
  type: "text" | "date" | "number";
};

export type GenerateContractInput = {
  templateType: HrContractTemplateType;
  employee: Record<string, unknown>;
};

const TEMPLATE_FILE_PATH = path.join(process.cwd(), "data", "hr-contract-templates.json");

const CONTRACT_TYPES: HrContractTemplateType[] = ["pkwt", "pkwtp"];

const COMPANY_TEMPLATE_CONTEXT: Record<string, string> = {
  company_name: "PT DOA SURYO AGONG",
  company_address: "Alamat Perusahaan PT DOA SURYO AGONG",
  company_city: "Surabaya",
  company_representative: "Direktur PT DOA SURYO AGONG",
  company_representative_title: "Direktur",
};

const EMPLOYEE_FORM_FIELDS: ContractTemplateField[] = [
  { key: "employee_name", label: "Nama Karyawan", required: true, type: "text" },
  { key: "employee_nik", label: "NIK Karyawan", required: true, type: "text" },
  { key: "employee_identity_number", label: "No. KTP", required: true, type: "text" },
  { key: "employee_address", label: "Alamat Karyawan", required: true, type: "text" },
  { key: "employee_position", label: "Jabatan", required: true, type: "text" },
  { key: "employee_department", label: "Unit/Divisi", required: true, type: "text" },
  { key: "contract_number", label: "Nomor Kontrak", required: true, type: "text" },
  { key: "contract_start_date", label: "Tanggal Mulai Kontrak", required: true, type: "date" },
  { key: "contract_end_date", label: "Tanggal Selesai Kontrak (PKWT)", required: false, type: "date" },
  { key: "probation_months", label: "Masa Percobaan (bulan, PKWTP)", required: false, type: "number" },
  { key: "probation_end_date", label: "Tanggal Akhir Masa Percobaan (PKWTP)", required: false, type: "date" },
];

function getHumanDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
}

async function ensureTemplateStoreFile() {
  try {
    await fs.access(TEMPLATE_FILE_PATH);
  } catch {
    const fallback: ContractTemplateStore = {
      templates: {
        pkwt: {
          title: "PERJANJIAN KERJA WAKTU TERTENTU (PKWT)",
          description: "Template kontrak PKWT.",
          content: "{{company_name}} - {{employee_name}}",
        },
        pkwtp: {
          title: "PERJANJIAN KERJA WAKTU TIDAK TERTENTU DENGAN MASA PERCOBAAN (PKWTP)",
          description: "Template kontrak PKWTP.",
          content: "{{company_name}} - {{employee_name}}",
        },
      },
    };

    await fs.mkdir(path.dirname(TEMPLATE_FILE_PATH), { recursive: true });
    await fs.writeFile(TEMPLATE_FILE_PATH, JSON.stringify(fallback, null, 2), "utf-8");
  }
}

async function readStore(): Promise<ContractTemplateStore> {
  await ensureTemplateStoreFile();
  const raw = await fs.readFile(TEMPLATE_FILE_PATH, "utf-8");
  return JSON.parse(raw) as ContractTemplateStore;
}

async function saveStore(store: ContractTemplateStore) {
  await fs.writeFile(TEMPLATE_FILE_PATH, JSON.stringify(store, null, 2), "utf-8");
}

export function isContractTemplateType(value: string): value is HrContractTemplateType {
  return CONTRACT_TYPES.includes(value as HrContractTemplateType);
}

export function getContractTemplateTypes() {
  return [...CONTRACT_TYPES];
}

export function getEmployeeContractFormFields() {
  return [...EMPLOYEE_FORM_FIELDS];
}

export async function listContractTemplates() {
  const store = await readStore();

  return CONTRACT_TYPES.map((type) => ({
    type,
    title: store.templates[type].title,
    description: store.templates[type].description,
  }));
}

export async function getContractTemplateByType(type: HrContractTemplateType) {
  const store = await readStore();
  return store.templates[type] ?? null;
}

export async function updateContractTemplateByType(
  type: HrContractTemplateType,
  input: Partial<ContractTemplateRecord>
) {
  const store = await readStore();
  const current = store.templates[type];

  if (!current) return null;

  const next: ContractTemplateRecord = {
    title: input.title ?? current.title,
    description: input.description ?? current.description,
    content: input.content ?? current.content,
  };

  store.templates[type] = next;
  await saveStore(store);

  return next;
}

function asStringOrEmpty(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toTemplateContext(employee: Record<string, unknown>) {
  const now = new Date();

  return {
    ...COMPANY_TEMPLATE_CONTEXT,
    current_date_human: getHumanDate(now),
    employee_name: asStringOrEmpty(employee.employee_name),
    employee_nik: asStringOrEmpty(employee.employee_nik),
    employee_identity_number: asStringOrEmpty(employee.employee_identity_number),
    employee_address: asStringOrEmpty(employee.employee_address),
    employee_position: asStringOrEmpty(employee.employee_position),
    employee_department: asStringOrEmpty(employee.employee_department),
    contract_number: asStringOrEmpty(employee.contract_number),
    contract_start_date: asStringOrEmpty(employee.contract_start_date),
    contract_end_date: asStringOrEmpty(employee.contract_end_date),
    probation_months: String(employee.probation_months ?? "").trim(),
    probation_end_date: asStringOrEmpty(employee.probation_end_date),
  };
}

function findMissingFields(templateType: HrContractTemplateType, employee: Record<string, unknown>) {
  const baseRequired = [
    "employee_name",
    "employee_nik",
    "employee_identity_number",
    "employee_address",
    "employee_position",
    "employee_department",
    "contract_number",
    "contract_start_date",
  ];

  const pkwtRequired = templateType === "pkwt" ? ["contract_end_date"] : [];
  const pkwtpRequired = templateType === "pkwtp" ? ["probation_months", "probation_end_date"] : [];

  const allRequired = [...baseRequired, ...pkwtRequired, ...pkwtpRequired];

  return allRequired.filter((field) => {
    const value = employee[field];
    if (typeof value === "number") return Number.isNaN(value);
    return typeof value !== "string" || value.trim() === "";
  });
}

function applyContext(template: string, context: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_matched, key: string) => {
    return context[key] ?? "";
  });
}

export async function generateContractDraft(input: GenerateContractInput) {
  const template = await getContractTemplateByType(input.templateType);
  if (!template) return { found: false as const, missingFields: [], draft: null };

  const missingFields = findMissingFields(input.templateType, input.employee);
  if (missingFields.length > 0) {
    return { found: true as const, missingFields, draft: null };
  }

  const context = toTemplateContext(input.employee);
  const rendered = applyContext(template.content, context);

  const fileName = `${input.templateType.toUpperCase()}-${context.employee_name || "karyawan"}.txt`;

  return {
    found: true as const,
    missingFields: [],
    draft: {
      templateType: input.templateType,
      title: template.title,
      content: rendered,
      context,
      fileName,
    },
  };
}
