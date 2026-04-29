import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateUtangPiutang, deleteUtangPiutang } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireDate, requireUUID } from "@/lib/validation/body-validator";
import type { FinanceTipeKas } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);

  const payload: Record<string, any> = {};

  if ("klien" in input) { const v = requireString(input, "klien", { maxLen: 200 }); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.klien = v.data; }
  if ("deskripsi" in input) { const v = requireString(input, "deskripsi", { maxLen: 500, optional: true }); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.deskripsi = v.data; }
  if ("nominal" in input) { const v = requireNumber(input, "nominal", { min: 0 }); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.nominal = v.data; }
  if ("tanggal_awal" in input) { const v = requireDate(input, "tanggal_awal"); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.tanggal_awal = v.data; }
  if ("jatuh_tempo" in input) { const v = requireDate(input, "jatuh_tempo"); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.jatuh_tempo = v.data; }
  if ("kas" in input) {
    const v = requireString(input, "kas");
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    if (v.data !== "ya" && v.data !== "tidak") return fail(ErrorCode.VALIDATION_ERROR, "kas harus 'ya' atau 'tidak'.", 400);
    payload.kas = v.data;
  }
  if ("coa" in input) { const v = requireUUID(input, "coa", { optional: true }); if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400); payload.coa = v.data; }

  const { data, error } = await updateUtangPiutang(supabaseAdmin as any, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update utang/piutang.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data utang/piutang tidak ditemukan.", 404);
  return ok({ utang_piutang: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteUtangPiutang(supabaseAdmin as any, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus utang/piutang.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data utang/piutang tidak ditemukan.", 404);
  return ok(null, "Data utang/piutang berhasil dihapus.");
}
