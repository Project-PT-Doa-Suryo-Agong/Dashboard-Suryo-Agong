import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listQCInbound, createQCInbound } from "@/lib/services/production.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const produksiOrderId = url.searchParams.get("produksi_order_id") ?? undefined;

  const { data, error, meta } = await listQCInbound(auth.ctx.supabase, page, limit, produksiOrderId);
  if (error) return fail("DB_ERROR", "Gagal mengambil data QC inbound.", 500, error.message);
  return ok({ qc_inbound: data, meta });
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

  const { data, error } = await createQCInbound(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal mencatat QC inbound.", 500, error.message);
  return ok({ qc_inbound: data }, "QC inbound berhasil dicatat.", 201);
}
