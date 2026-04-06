import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createLivePerformance, listLivePerformance } from "@/lib/services/sales.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listLivePerformance(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data live performance.", 500, error.message);
  return ok({ live: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (!input.platform || typeof input.platform !== "string" || !input.platform.trim()) {
    return fail("VALIDATION_ERROR", "platform wajib diisi.", 400);
  }
  if (input.revenue === undefined || typeof input.revenue !== "number") {
    return fail("VALIDATION_ERROR", "revenue wajib diisi dan harus angka.", 400);
  }

  const { data, error } = await createLivePerformance(auth.ctx.supabase, {
    platform: (input.platform as string).trim(),
    revenue: input.revenue,
  });
  if (error) return fail("DB_ERROR", "Gagal membuat data live performance.", 500, error.message);
  return ok({ live: data }, "Data live performance berhasil dibuat.", 201);
}
