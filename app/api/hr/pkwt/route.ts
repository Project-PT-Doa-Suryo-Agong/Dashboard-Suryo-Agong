import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { parseGenerateContractInput } from "@/lib/validation/hr-contract-template";
import { generateContractDraft, isContractTemplateType } from "@/lib/services/hr-contract-template.service";
import { ErrorCode } from "@/lib/http/error-codes";

export const runtime = "nodejs";

function hr(client: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>) {
  return (client as any).schema("hr") as any;
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
    const result = await generateContractDraft(parsed.data);
    if (!result.found) return fail(ErrorCode.NOT_FOUND, "Template tidak ditemukan.", 404);
    if (result.missingFields.length > 0) {
      return fail(ErrorCode.VALIDATION_ERROR, "Informasi karyawan belum lengkap.", 400, { missingFields: result.missingFields });
    }

    const emp = parsed.data.employee as Record<string, unknown>;

    const payload: Record<string, unknown> = {
      template_type: parsed.data.templateType,
      contract_number: (emp.contract_number ?? "") as string,
      employee_name: (emp.employee_name ?? "") as string,
      employee_nik: (emp.employee_nik ?? "") as string,
      employee_identity_number: (emp.employee_identity_number ?? "") as string,
      employee_address: (emp.employee_address ?? "") as string,
      employee_position: (emp.employee_position ?? "") as string,
      employee_department: (emp.employee_department ?? "") as string,
      contract_start_date: (emp.contract_start_date ?? "") as string,
      contract_end_date: emp.contract_end_date ?? null,
      probation_months: emp.probation_months ? Number(emp.probation_months) : null,
      probation_end_date: emp.probation_end_date ?? null,
      generated_content: result.draft?.content ?? "",
    };

    const { data, error } = await hr(auth.ctx.supabase).from("t_pkwt").insert(payload).select("*").single();
    if (error) return fail(ErrorCode.DB_ERROR, "Gagal menyimpan riwayat kontrak.", 500, error.message);

    return ok({ pkwt: data }, "Kontrak berhasil digenerate dan disimpan.", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal generate dan menyimpan kontrak.", 500, message);
  }
}
