import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listBudgetRequest, createBudgetRequest } from "@/lib/services/management.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listBudgetRequest(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data budget request.", 500, error.message);
  return ok({ budget_requests: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.divisi || typeof input.divisi !== "string") {
    return fail("VALIDATION_ERROR", "divisi wajib diisi.", 400);
  }
  if (input.amount === undefined || typeof input.amount !== "number") {
    return fail("VALIDATION_ERROR", "amount wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createBudgetRequest(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mengajukan budget request.", 500, error.message);
  return ok({ budget_request: data }, "Budget request berhasil diajukan.", 201);
}
