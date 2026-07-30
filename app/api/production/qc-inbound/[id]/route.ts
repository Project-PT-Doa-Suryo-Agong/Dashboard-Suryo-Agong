import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import {
  updateQCInbound,
  deleteQCInbound,
} from "@/lib/services/production.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const orderId = (await params).id;  // This is produksi_order_id (from frontend)
  if (!orderId) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

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

  // Validate optional fields
  let newHasil: string | null = null;
  if ("hasil" in input) {
    const hasil = requireString(input, "hasil", { optional: true });
    if (!hasil.ok) return fail(ErrorCode.VALIDATION_ERROR, hasil.message, 400);
    if (hasil.data !== null && !["pass", "reject"].includes(hasil.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "hasil harus pass atau reject.", 400);
    }
    newHasil = hasil.data;
  }

  if ("bahan_baku_id" in input) {
    const bahanBakuId = requireUUID(input, "bahan_baku_id", { optional: true });
    if (!bahanBakuId.ok) return fail(ErrorCode.VALIDATION_ERROR, bahanBakuId.message, 400);
  }

  if ("jumlah" in input) {
    const jumlah = requireNumber(input, "jumlah", { min: 0.0001, optional: true });
    if (!jumlah.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlah.message, 400);
  }

  if ("operator" in input) {
    const operator = requireString(input, "operator", { optional: true });
    if (!operator.ok) return fail(ErrorCode.VALIDATION_ERROR, operator.message, 400);
  }

  // ── Handle REJECT → PASS transition for stock mutation ─────────────────────
  const sb = auth.ctx.supabase as any;

  // Read existing QC to check old hasil and mutasi_stok_id
  const { data: existing, error: readError } = await sb
    .schema("production")
    .from("t_qc_inbound")
    .select("*")
    .eq("produksi_order_id", orderId)
    .maybeSingle();

  if (readError) {
    return fail(ErrorCode.DB_ERROR, "Gagal membaca data QC inbound.", 500, readError.message);
  }
  if (!existing) {
    return fail(ErrorCode.NOT_FOUND, "Data QC inbound tidak ditemukan.", 404);
  }

  // REJECT → PASS: create mutation only if not already done
  if (newHasil === "pass" && existing.hasil === "reject" && !existing.mutasi_stok_id) {
    const operatorName = (input.operator as string) || "Operator Produksi";
    const mutasiBahanId = (input.bahan_baku_id as string) || existing.bahan_baku_id;
    const mutasiJumlah = (input.jumlah as number) || existing.jumlah;

    const { data: mutasi, error: mutasiError } = await sb
      .schema("production")
      .from("t_stok_mutasi")
      .insert({
        bahan_baku_id: mutasiBahanId,
        tipe: "masuk",
        jumlah: mutasiJumlah,
        keterangan: `QC Inbound ${existing.qc_in_number}`,
        operator: operatorName,
      })
      .select("id")
      .single();

    if (mutasiError) {
      return fail(ErrorCode.DB_ERROR, "Gagal mencatat mutasi stok masuk.", 500, mutasiError.message);
    }

    input.mutasi_stok_id = mutasi.id;
  }

  // PASS → REJECT: do NOT auto-rollback stock (business decision — stock already consumed/validated)

  // Remove operator from update payload — it is not a column in t_qc_inbound
  const updatePayload = { ...input };
  delete updatePayload.operator;

  const { data, error } = await updateQCInbound(
    auth.ctx.supabase,
    orderId,
    updatePayload,
  );
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update QC inbound.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data QC inbound tidak ditemukan.", 404);
  return ok({ qc_inbound: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  // Note: No automatic stock rollback on QC delete.
  // Stock mutation remains as-is (stock already validated/consumed).
  const { error, deleted } = await deleteQCInbound(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus QC inbound.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data QC inbound tidak ditemukan.", 404);
  return ok(null, "QC inbound berhasil dihapus.");
}
