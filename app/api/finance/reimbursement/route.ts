import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listReimbursement, createReimbursement } from "@/lib/services/finance.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listReimbursement(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail("DB_ERROR", "Gagal mengambil data reimbursement.", 500, error.message);
  return ok({ reimbursement: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.employee_id) {
    return fail("VALIDATION_ERROR", "employee_id wajib diisi.", 400);
  }
  if (input.amount === undefined || typeof input.amount !== "number") {
    return fail("VALIDATION_ERROR", "amount wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createReimbursement(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mengajukan reimbursement.", 500, error.message);
  return ok({ reimbursement: data }, "Reimbursement berhasil diajukan.", 201);
}
