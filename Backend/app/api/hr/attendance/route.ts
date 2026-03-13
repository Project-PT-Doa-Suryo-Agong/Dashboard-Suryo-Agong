import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listAttendance, createAttendance } from "@/lib/services/hr.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listAttendance(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail("DB_ERROR", "Gagal mengambil data absensi.", 500, error.message);
  return ok({ attendance: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.employee_id || !input.tanggal) {
    return fail("VALIDATION_ERROR", "employee_id dan tanggal wajib diisi.", 400);
  }

  const { data, error } = await createAttendance(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal catat absensi.", 500, error.message);
  return ok({ attendance: data }, "Absensi berhasil dicatat.", 201);
}
