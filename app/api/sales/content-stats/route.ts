import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createContentStatistic, listContentStatistic } from "@/lib/services/sales.service";
import { requireString, requireNumber, requireUUID } from "@/lib/validation/body-validator";
import type { TContentStatisticInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listContentStatistic(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data content statistics.", 500, error.message);
  return ok({ content_stats: data, meta });
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
  const contentPlannerId = requireUUID(input, "content_planner_id");
  if (!contentPlannerId.ok) return fail(ErrorCode.VALIDATION_ERROR, contentPlannerId.message, 400);
  const link = requireString(input, "link", { optional: true });
  if (!link.ok) return fail(ErrorCode.VALIDATION_ERROR, link.message, 400);
  const jumlahView = requireNumber(input, "jumlah_view", { min: 0, optional: true });
  if (!jumlahView.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlahView.message, 400);
  const monetasi = requireNumber(input, "monetasi", { min: 0, optional: true });
  if (!monetasi.ok) return fail(ErrorCode.VALIDATION_ERROR, monetasi.message, 400);

  const payload: TContentStatisticInsert = {
    content_planner_id: contentPlannerId.data!,
    link: link.data,
    jumlah_view: jumlahView.data,
    monetasi: monetasi.data,
  };

  const { data, error } = await createContentStatistic(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat content statistic.", 500, error.message);
  return ok({ content_stat: data }, "Content statistic berhasil dibuat.", 201);
}
