import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKPIWeekly, createKPIWeekly } from "@/lib/services/management.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 500, 1), 500);
  const divisi = url.searchParams.get("divisi") ?? undefined;

  const { data, error, meta } = await listKPIWeekly(auth.ctx.supabase, page, limit, divisi);
  if (error) return fail("DB_ERROR", "Gagal mengambil data kpi.", 500, error.message);
  return ok({ kpi: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.minggu || typeof input.minggu !== "string") {
    return fail("VALIDATION_ERROR", "minggu wajib diisi.", 400);
  }
  if (!input.divisi || typeof input.divisi !== "string") {
    return fail("VALIDATION_ERROR", "divisi wajib diisi.", 400);
  }
  if (input.target === undefined || typeof input.target !== "number") {
    return fail("VALIDATION_ERROR", "target wajib diisi dan harus angka.", 400);
  }
  if (input.realisasi === undefined || typeof input.realisasi !== "number") {
    return fail("VALIDATION_ERROR", "realisasi wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createKPIWeekly(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal menyimpan KPI.", 500, error.message);
  return ok({ kpi: data }, "KPI berhasil disimpan.", 201);
}
