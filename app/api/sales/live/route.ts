import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listLivePerformance, createLivePerformance } from "@/lib/services/sales.service";
import { requireString, requireNumber } from "@/lib/validation/body-validator";
import type { TLivePerformanceInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listLivePerformance(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data live performance.", 500, error.message);
  return ok({ live_performance: data, meta });
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
  const platform = requireString(input, "platform", { maxLen: 120 });
  if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);

  const revenue = requireNumber(input, "revenue", { optional: true });
  if (!revenue.ok) return fail(ErrorCode.VALIDATION_ERROR, revenue.message, 400);

  const liveNumber = requireString(input, "live_number", { optional: true });
  if (!liveNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, liveNumber.message, 400);

  const payload: TLivePerformanceInsert = {
    ...(liveNumber.data ? { live_number: liveNumber.data } : {}),
    platform: platform.data!,
    revenue: revenue.data ?? null,
  };

  const { data, error } = await createLivePerformance(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat live performance.", 500, error.message);
  return ok({ live_performance: data }, "Live performance berhasil dibuat.", 201);
}
