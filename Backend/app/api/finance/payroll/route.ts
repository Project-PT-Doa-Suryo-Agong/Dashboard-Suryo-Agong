import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listPayroll, createPayroll } from "@/lib/services/finance.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listPayroll(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail("DB_ERROR", "Gagal mengambil data payroll.", 500, error.message);
  return ok({ payroll: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.employee_id || !input.bulan) {
    return fail("VALIDATION_ERROR", "employee_id dan bulan wajib diisi.", 400);
  }
  if (input.total === undefined || typeof input.total !== "number") {
    return fail("VALIDATION_ERROR", "total wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createPayroll(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal membuat data payroll.", 500, error.message);
  return ok({ payroll: data }, "Data payroll berhasil dibuat.", 201);
}
