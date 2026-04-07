import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  updateQCInbound,
  deleteQCInbound,
} from "@/lib/services/production.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }
  if ("produksi_order_id" in input) {
    const produksiOrderId = requireUUID(input, "produksi_order_id", { optional: true });
    if (!produksiOrderId.ok) return fail(ErrorCode.VALIDATION_ERROR, produksiOrderId.message, 400);
  }
  if ("hasil" in input) {
    const hasil = requireString(input, "hasil", { optional: true });
    if (!hasil.ok) return fail(ErrorCode.VALIDATION_ERROR, hasil.message, 400);
    if (hasil.data !== null && !["pass", "reject"].includes(hasil.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "hasil harus pass atau reject.", 400);
    }
  }

  const { data, error } = await updateQCInbound(
    auth.ctx.supabase,
    id,
    input,
  );
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update QC inbound.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data QC inbound tidak ditemukan.", 404);
  return ok({ qc_inbound: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteQCInbound(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus QC inbound.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data QC inbound tidak ditemukan.", 404);
  return ok(null, "QC inbound berhasil dihapus.");
}
