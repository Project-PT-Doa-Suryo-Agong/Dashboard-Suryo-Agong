import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listWarnings, createWarning } from "@/lib/services/hr.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listWarnings(auth.ctx.supabase, page, limit, employeeId);

  console.log("[HR ROUTE][warnings][GET] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][warnings][GET] role:", auth.ctx.role);
  console.log("[HR ROUTE][warnings][GET] query result:", {
    count: data.length,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data warning.", 500, error.message);
  return ok({ warnings: data, meta });
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
  const level = requireString(input, "level");
  if (!level.ok || !level.data) return fail(ErrorCode.VALIDATION_ERROR, level.ok ? "level wajib diisi." : level.message, 400);
  const alasan = requireString(input, "alasan");
  if (!alasan.ok || !alasan.data) return fail(ErrorCode.VALIDATION_ERROR, alasan.ok ? "alasan wajib diisi." : alasan.message, 400);

  const { data, error } = await createWarning(auth.ctx.supabase, {
    employee_id: employeeId.data,
    level: level.data,
    alasan: alasan.data,
  });

  console.log("[HR ROUTE][warnings][POST] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][warnings][POST] role:", auth.ctx.role);
  console.log("[HR ROUTE][warnings][POST] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat warning.", 500, error.message);
  return ok({ warning: data }, "Warning berhasil dibuat.", 201);
}
