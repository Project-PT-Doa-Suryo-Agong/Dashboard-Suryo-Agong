import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listPacking, createPacking } from "@/lib/services/logistics.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listPacking(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data packing.", 500, error.message);
  return ok({ packing: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.order_id || typeof input.order_id !== "string") {
    return fail("VALIDATION_ERROR", "order_id wajib diisi.", 400);
  }

  const { data, error } = await createPacking(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mencatat packing.", 500, error.message);
  return ok({ packing: data }, "Data packing berhasil dicatat.", 201);
}
