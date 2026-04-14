import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKaryawan, createKaryawan } from "@/lib/services/hr.service";
import { parseCreateEmployeeInput } from "@/lib/validation/hr-admin";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listKaryawan(auth.ctx.supabase, page, limit);
  console.log("[HR ROUTE][employees][GET] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][employees][GET] role:", auth.ctx.role);
  console.log("[HR ROUTE][employees][GET] query result:", {
    count: data.length,
    hasError: Boolean(error),
    error: error?.message,
  });
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data karyawan.", 500, error.message);
  return ok({ karyawan: data, meta });
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

  const parsed = parseCreateEmployeeInput(body);
  if (!parsed.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, parsed.message, 400);
  }

  const { data, error } = await createKaryawan(auth.ctx.supabase, parsed.data);

  console.log("[HR ROUTE][employees][POST] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][employees][POST] role:", auth.ctx.role);
  console.log("[HR ROUTE][employees][POST] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) {
    const lowerMessage = (error.message ?? "").toLowerCase();
    if (
      lowerMessage.includes("already") ||
      lowerMessage.includes("exists") ||
      lowerMessage.includes("duplicate") ||
      lowerMessage.includes("unique")
    ) {
      return fail(
        ErrorCode.VALIDATION_ERROR,
        "Email sudah terdaftar. Gunakan email lain.",
        409,
        error.message,
      );
    }

    return fail(ErrorCode.DB_ERROR, "Gagal menambahkan karyawan baru.", 500, error.message);
  }

  return ok({ karyawan: data }, "Karyawan dan akun berhasil dibuat.", 201);
}
