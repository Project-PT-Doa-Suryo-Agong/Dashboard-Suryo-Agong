import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listQCInbound, createQCInbound } from "@/lib/services/production.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TQCInboundInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  // ── Field validations ──────────────────────────────────────────────────────
  const produksiOrderId = requireUUID(input, "produksi_order_id");
  if (!produksiOrderId.ok) return fail(ErrorCode.VALIDATION_ERROR, produksiOrderId.message, 400);

  const hasil = requireString(input, "hasil");
  if (!hasil.ok) return fail(ErrorCode.VALIDATION_ERROR, hasil.message, 400);
  if (!["pass", "reject"].includes(hasil.data!)) {
    return fail(ErrorCode.VALIDATION_ERROR, "hasil harus pass atau reject.", 400);
  }

  const bahanBakuId = requireUUID(input, "bahan_baku_id");
  if (!bahanBakuId.ok) return fail(ErrorCode.VALIDATION_ERROR, bahanBakuId.message, 400);

  const jumlah = requireNumber(input, "jumlah", { min: 0.0001 });
  if (!jumlah.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlah.message, 400);

  const operator = requireString(input, "operator");
  if (!operator.ok) return fail(ErrorCode.VALIDATION_ERROR, operator.message, 400);

  const qcInNumber = requireString(input, "qc_in_number", { optional: true });
  if (!qcInNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, qcInNumber.message, 400);

  // ── Generate QC number ─────────────────────────────────────────────────────
  const generateQcInNumber = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data: countData, error: countError } = await supabaseAdmin.rpc("count_qc_inbound_this_month", {
      start_of_month: startOfMonth,
      start_of_next_month: startOfNextMonth,
    });

    if (countError) {
      return { ok: false as const, error: countError };
    }

    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const seq = String(((countData as number) ?? 0) + 1).padStart(5, "0");
    return { ok: true as const, number: `QCI-${mm}${yy}-${seq}` };
  };

  let finalQcInNumber = qcInNumber.data ?? null;
  if (!finalQcInNumber) {
    const generated = await generateQcInNumber();
    if (!generated.ok) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat nomor QC inbound.", 500, generated.error.message);
    }
    finalQcInNumber = generated.number;
  }

  // ── Stock mutation (only when PASS) ────────────────────────────────────────
  let mutasiStokId: string | null = null;

  if (hasil.data === "pass") {
    const sb = auth.ctx.supabase as any;

    const { data: mutasi, error: mutasiError } = await sb
      .schema("production")
      .from("t_stok_mutasi")
      .insert({
        bahan_baku_id: bahanBakuId.data,
        tipe: "masuk",
        jumlah: jumlah.data,
        keterangan: `QC Inbound ${finalQcInNumber}`,
        operator: operator.data,
      })
      .select("id")
      .single();

    if (mutasiError) {
      return fail(ErrorCode.DB_ERROR, "Gagal mencatat mutasi stok masuk.", 500, mutasiError.message);
    }

    mutasiStokId = mutasi.id;
  }

  // ── Create QC record ───────────────────────────────────────────────────────
  const payload: TQCInboundInsert = {
    qc_in_number: finalQcInNumber,
    produksi_order_id: produksiOrderId.data,
    bahan_baku_id: bahanBakuId.data,
    jumlah: jumlah.data,
    mutasi_stok_id: mutasiStokId,
    hasil: hasil.data as TQCInboundInsert["hasil"],
  };

  const { data, error } = await createQCInbound(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mencatat QC inbound.", 500, error.message);
  return ok({ qc_inbound: data }, "QC inbound berhasil dicatat.", 201);
}
