import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKPIWeekly, createKPIWeekly } from "@/lib/services/management.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const divisi = url.searchParams.get("divisi") ?? undefined;

  const { data, error, meta } = await listKPIWeekly(auth.ctx.supabase, page, limit, divisi);
  if (error) return fail("DB_ERROR", "Gagal mengambil data KPI weekly.", 500, error.message);
  return ok({ kpi: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.minggu || !input.divisi) {
    return fail("VALIDATION_ERROR", "minggu dan divisi wajib diisi.", 400);
  }
  if (input.target === undefined || input.realisasi === undefined) {
    return fail("VALIDATION_ERROR", "target dan realisasi wajib diisi.", 400);
  }

  const { data, error } = await createKPIWeekly(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mencatat KPI weekly.", 500, error.message);
  return ok({ kpi: data }, "KPI weekly berhasil dicatat.", 201);
}
