import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listQCInbound, createQCInbound } from "@/lib/services/production.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TQCInboundInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const produksiOrderId = url.searchParams.get("produksi_order_id") ?? undefined;

  const { data, error, meta } = await listQCInbound(auth.ctx.supabase, page, limit, produksiOrderId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data QC inbound.", 500, error.message);
  return ok({ qc_inbound: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const produksiOrderId = requireUUID(input, "produksi_order_id", { optional: true });
  if (!produksiOrderId.ok) return fail(ErrorCode.VALIDATION_ERROR, produksiOrderId.message, 400);
  const hasil = requireString(input, "hasil", { optional: true });
  if (!hasil.ok) return fail(ErrorCode.VALIDATION_ERROR, hasil.message, 400);
  if (hasil.data !== null && !["pass", "reject"].includes(hasil.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "hasil harus pass atau reject.", 400);
  }
  if (!("produksi_order_id" in input) && !("hasil" in input)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Minimal satu field qc-inbound harus diisi.", 400);
  }

  const payload: TQCInboundInsert = {
    ...input,
    produksi_order_id: produksiOrderId.data,
    hasil: hasil.data as TQCInboundInsert["hasil"],
  };

  const { data, error } = await createQCInbound(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mencatat QC inbound.", 500, error.message);
  return ok({ qc_inbound: data }, "QC inbound berhasil dicatat.", 201);
}
