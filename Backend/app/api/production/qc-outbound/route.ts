import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listQCOutbound, createQCOutbound } from "@/lib/services/production.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listQCOutbound(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data QC outbound.", 500, error.message);
  return ok({ qc_outbound: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail("BAD_REQUEST", "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (!input.produksi_order_id || !input.hasil) {
    return fail("VALIDATION_ERROR", "produksi_order_id dan hasil wajib diisi.", 400);
  }

  const { data, error } = await createQCOutbound(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mencatat QC outbound.", 500, error.message);
  return ok({ qc_outbound: data }, "QC outbound berhasil dicatat.", 201);
}
