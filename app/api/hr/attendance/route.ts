import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listAttendance, createAttendance } from "@/lib/services/hr.service";
import { requireDate, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listAttendance(auth.ctx.supabase, page, limit, employeeId);

  console.log("[HR ROUTE][attendance][GET] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][attendance][GET] role:", auth.ctx.role);
  console.log("[HR ROUTE][attendance][GET] query result:", {
    count: data.length,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data attendance.", 500, error.message);
  return ok({ attendance: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const tanggal = requireDate(input, "tanggal");
  if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);
  const status = requireString(input, "status");
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (!status.data || !["hadir", "izin", "sakit", "alpha"].includes(status.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus hadir, izin, sakit, atau alpha.", 400);
  }

  const { data, error } = await createAttendance(auth.ctx.supabase, {
    employee_id: employeeId.data,
    tanggal: tanggal.data,
    status: status.data,
  });

  console.log("[HR ROUTE][attendance][POST] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][attendance][POST] role:", auth.ctx.role);
  console.log("[HR ROUTE][attendance][POST] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menambah attendance.", 500, error.message);
  return ok({ attendance: data }, "Attendance berhasil dibuat.", 201);
}
