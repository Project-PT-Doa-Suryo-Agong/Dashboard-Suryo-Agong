import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listPayroll, createPayroll } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TPayrollHistoryInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

function normalizePayrollMonth(value: string): string | null {
  const trimmed = value.trim();

  // Backward-compatible with legacy month input (YYYY-MM).
  if (/^\d{4}-\d{2}$/.test(trimmed)) {
    return `${trimmed}-01`;
  }

  // New frontend input can send full date (YYYY-MM-DD).
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month] = trimmed.split("-");
    return `${year}-${month}-01`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listPayroll(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data payroll.", 500, error.message);
  return ok({ payroll: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const bulan = requireString(input, "bulan", { maxLen: 20 });
  if (!bulan.ok) return fail(ErrorCode.VALIDATION_ERROR, bulan.message, 400);
  const normalizedBulan = bulan.data ? normalizePayrollMonth(bulan.data) : null;
  if (!normalizedBulan) {
    return fail(ErrorCode.VALIDATION_ERROR, "bulan harus berupa tanggal valid.", 400);
  }
  
  // Total can be explicitly set or fetched strictly from m_karyawan's gaji_pokok
  const total = requireNumber(input, "total", { min: 0, optional: true });
  if (!total.ok) return fail(ErrorCode.VALIDATION_ERROR, total.message, 400);

  let finalTotal = total.data ?? 0;
  
  // Jika tidak diinputkan (misalkan dikirim kosong atau 0), kita ambilkan dari gaji_pokok HR
  if (finalTotal === 0 && employeeId.data) {
      const { data: employee } = await auth.ctx.supabase.schema("hr").from("m_karyawan").select("gaji_pokok").eq("id", employeeId.data).single();
      if (employee?.gaji_pokok) {
        finalTotal = employee.gaji_pokok;
      }
  }

  const payload: TPayrollHistoryInsert = {
    employee_id: employeeId.data,
    bulan: normalizedBulan,
    total: finalTotal,
  };

  const { data, error } = await createPayroll(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data payroll.", 500, error.message);
  return ok({ payroll: data }, "Data payroll berhasil dibuat.", 201);
}
