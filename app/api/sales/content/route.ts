import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createContentPlanner, listContentPlanner } from "@/lib/services/sales.service";
import { requireString } from "@/lib/validation/body-validator";
import type { TContentPlannerInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listContentPlanner(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data content planner.", 500, error.message);
  return ok({ content: data, meta });
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
  const judul = requireString(input, "judul", { maxLen: 180 });
  if (!judul.ok) return fail(ErrorCode.VALIDATION_ERROR, judul.message, 400);
  const platform = requireString(input, "platform", { maxLen: 120, optional: true });
  if (!platform.ok) return fail(ErrorCode.VALIDATION_ERROR, platform.message, 400);

  const affiliatorId = requireString(input, "affiliator_id", { optional: true });
  if (!affiliatorId.ok) return fail(ErrorCode.VALIDATION_ERROR, affiliatorId.message, 400);
  const jadwal = requireString(input, "jadwal", { optional: true });
  if (!jadwal.ok) return fail(ErrorCode.VALIDATION_ERROR, jadwal.message, 400);
  const tipe = requireString(input, "tipe", { optional: true });
  if (!tipe.ok) return fail(ErrorCode.VALIDATION_ERROR, tipe.message, 400);
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);

  const payload: TContentPlannerInsert = {
    judul: judul.data!,
    platform: platform.data,
    affiliator_id: affiliatorId.data,
    jadwal: jadwal.data,
    tipe: (tipe.data as any) || null,
    status: (status.data as any) || "direncanakan",
  };

  const { data, error } = await createContentPlanner(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat content planner.", 500, error.message);
  return ok({ content: data }, "Content planner berhasil dibuat.", 201);
}
