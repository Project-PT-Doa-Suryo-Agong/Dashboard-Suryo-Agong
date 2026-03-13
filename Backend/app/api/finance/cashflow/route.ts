import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listCashflow, createCashflow } from "@/lib/services/finance.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listCashflow(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data cashflow.", 500, error.message);
  return ok({ cashflow: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.tipe || typeof input.tipe !== "string") {
    return fail("VALIDATION_ERROR", "tipe wajib diisi.", 400);
  }
  if (input.amount === undefined || typeof input.amount !== "number") {
    return fail("VALIDATION_ERROR", "amount wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createCashflow(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mencatat cashflow.", 500, error.message);
  return ok({ cashflow: data }, "Cashflow berhasil dicatat.", 201);
}
