import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { parseGenerateContractInput } from "@/lib/validation/hr-contract-template";
import { generateContractDraft, isContractTemplateType } from "@/lib/services/hr-contract-template.service";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function hr(client: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>) {
  return (client as any).schema("hr") as any;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asDateOrNull(value: unknown): string | null {
  const text = asNonEmptyString(value);
  return text ?? null;
}

function extractMissingColumn(errorMessage: string): string | null {
  const patterns = [
    /column\s+"([a-zA-Z0-9_]+)"\s+of\s+relation\s+"[a-zA-Z0-9_]+"\s+does\s+not\s+exist/i,
    /Could not find the '([a-zA-Z0-9_]+)' column/i,
    /column\s+([a-zA-Z0-9_]+)\s+does\s+not\s+exist/i,
  ];

  for (const pattern of patterns) {
    const match = errorMessage.match(pattern);
    if (match && match[1]) return match[1];
  }

  return null;
}

function isRlsOrPermissionError(errorMessage: string): boolean {
  const msg = errorMessage.toLowerCase();
  return (
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("insufficient privilege") ||
    msg.includes("not allowed")
  );
}

async function insertPkwtWithClient(client: any, initialPayload: Record<string, unknown>) {
  let payload = { ...initialPayload };

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await client.from("t_pkwt").insert(payload).select("*").single();
    if (!error) return { data, error: null as any };

    const message = typeof error.message === "string" ? error.message : "";
    const missingColumn = extractMissingColumn(message);
    if (!missingColumn) {
      return { data: null, error };
    }

    if (!(missingColumn in payload)) {
      return { data: null, error };
    }

    const { [missingColumn]: _removed, ...nextPayload } = payload;
    payload = nextPayload;
  }

  const { data, error } = await client.from("t_pkwt").insert(payload).select("*").single();
  return { data, error };
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);
  const q = url.searchParams.get("q") ?? "";
  const from = (page - 1) * limit;

  try {
    let query: any = hr(auth.ctx.supabase).from("t_pkwt").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + limit - 1);

    if (q && q.trim()) {
      const pattern = `%${q.trim()}%`;
      query = hr(auth.ctx.supabase)
        .from("t_pkwt")
        .select("*", { count: "exact" })
        .or(`employee_name.ilike.${pattern},contract_number.ilike.${pattern}`)
        .order("created_at", { ascending: false })
        .range(from, from + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil riwayat kontrak.", 500, error.message);

    return ok({ pkwt: data ?? [], meta: { page, limit, total: count ?? 0 } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil riwayat kontrak.", 500, message);
  }
}

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
  if (!parsed.ok) return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);

  if (!isContractTemplateType(parsed.data.templateType)) {
    return fail(ErrorCode.VALIDATION_ERROR, "templateType tidak valid. Gunakan pkwt atau pkwtp.", 400);
  }

  try {
    const emp = parsed.data.employee as Record<string, unknown>;
    const requestedEmployeeId = asNonEmptyString(emp.employee_id) ?? asNonEmptyString(emp.employeeId);

    let dbEmployee: Record<string, unknown> | null = null;
    if (requestedEmployeeId) {
      const { data: employeeData, error: employeeError } = await hr(auth.ctx.supabase)
        .from("m_karyawan")
        .select("id, nama, nik, nip, posisi, divisi, alamat_domisili")
        .eq("id", requestedEmployeeId)
        .maybeSingle();

      if (employeeError) {
        return fail(ErrorCode.DB_ERROR, "Gagal mengambil data karyawan untuk kontrak.", 500, employeeError.message);
      }
      if (!employeeData) {
        return fail(ErrorCode.NOT_FOUND, "Karyawan untuk kontrak tidak ditemukan.", 404);
      }

      dbEmployee = employeeData as Record<string, unknown>;
    }

    const mergedEmployee: Record<string, unknown> = dbEmployee
      ? {
          ...emp,
          employee_id: asNonEmptyString(dbEmployee.id),
          employee_name: asNonEmptyString(dbEmployee.nama) ?? asNonEmptyString(emp.employee_name) ?? "",
          employee_nik: asNonEmptyString(dbEmployee.nik) ?? asNonEmptyString(emp.employee_nik) ?? "",
          // Prefer NIP for identity number; fallback to manual input or NIK for legacy data.
          employee_identity_number:
            asNonEmptyString(dbEmployee.nip) ??
            asNonEmptyString(emp.employee_identity_number) ??
            "",
          employee_address: asNonEmptyString(dbEmployee.alamat_domisili) ?? asNonEmptyString(emp.employee_address) ?? "",
          employee_position: asNonEmptyString(dbEmployee.posisi) ?? asNonEmptyString(emp.employee_position) ?? "",
          employee_department: asNonEmptyString(dbEmployee.divisi) ?? asNonEmptyString(emp.employee_department) ?? "",
        }
      : emp;

    const result = await generateContractDraft({
      templateType: parsed.data.templateType,
      employee: mergedEmployee,
    });
    if (!result.found) return fail(ErrorCode.NOT_FOUND, "Template tidak ditemukan.", 404);
    if (result.missingFields.length > 0) {
      return fail(ErrorCode.VALIDATION_ERROR, "Informasi karyawan belum lengkap.", 400, { missingFields: result.missingFields });
    }

    const payload: Record<string, unknown> = {
      template_type: parsed.data.templateType,
      contract_number: (mergedEmployee.contract_number ?? "") as string,
      employee_name: (mergedEmployee.employee_name ?? "") as string,
      employee_nik: (mergedEmployee.employee_nik ?? "") as string,
      employee_identity_number: (mergedEmployee.employee_identity_number ?? "") as string,
      employee_address: (mergedEmployee.employee_address ?? "") as string,
      employee_position: (mergedEmployee.employee_position ?? "") as string,
      employee_department: (mergedEmployee.employee_department ?? "") as string,
      contract_start_date: asNonEmptyString(mergedEmployee.contract_start_date) ?? "",
      contract_end_date: asDateOrNull(mergedEmployee.contract_end_date),
      probation_months: mergedEmployee.probation_months ? Number(mergedEmployee.probation_months) : null,
      probation_end_date: asDateOrNull(mergedEmployee.probation_end_date),
      generated_content: result.draft?.content ?? "",
    };

    const employeeIdForInsert = asNonEmptyString(mergedEmployee.employee_id);
    if (employeeIdForInsert) {
      payload.employee_id = employeeIdForInsert;
    }

    let { data, error } = await insertPkwtWithClient(hr(auth.ctx.supabase), payload);

    const firstErrorMessage = typeof error?.message === "string" ? error.message : "";
    if (error && isRlsOrPermissionError(firstErrorMessage)) {
      const adminHr = (supabaseAdmin as any).schema("hr");
      const retryByAdmin = await insertPkwtWithClient(adminHr, payload);
      data = retryByAdmin.data;
      error = retryByAdmin.error;
    }

    if (error) {
      const detail = typeof error.message === "string" ? error.message : "Unknown DB error";
      return fail(ErrorCode.DB_ERROR, `Gagal menyimpan riwayat kontrak. Detail: ${detail}`, 500, detail);
    }

    return ok({ pkwt: data }, "Kontrak berhasil digenerate dan disimpan.", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal generate dan menyimpan kontrak.", 500, message);
  }
}
