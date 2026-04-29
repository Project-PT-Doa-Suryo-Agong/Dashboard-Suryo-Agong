import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listUtangPiutang, createUtangPiutang } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireDate, requireUUID } from "@/lib/validation/body-validator";
import type { FinanceTipeKas } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listUtangPiutang(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data utang/piutang.", 500, error.message);
  return ok({ utang_piutang: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  
  const klien = requireString(input, "klien", { maxLen: 200 });
  if (!klien.ok) return fail(ErrorCode.VALIDATION_ERROR, klien.message, 400);
  
  const deskripsi = requireString(input, "deskripsi", { maxLen: 500, optional: true });
  if (!deskripsi.ok) return fail(ErrorCode.VALIDATION_ERROR, deskripsi.message, 400);
  
  const nominal = requireNumber(input, "nominal", { min: 0 });
  if (!nominal.ok) return fail(ErrorCode.VALIDATION_ERROR, nominal.message, 400);
  
  const tanggal_awal = requireDate(input, "tanggal_awal");
  if (!tanggal_awal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal_awal.message, 400);
  
  const jatuh_tempo = requireDate(input, "jatuh_tempo");
  if (!jatuh_tempo.ok) return fail(ErrorCode.VALIDATION_ERROR, jatuh_tempo.message, 400);
  
  const kas = requireString(input, "kas", { optional: true });
  if (!kas.ok) return fail(ErrorCode.VALIDATION_ERROR, kas.message, 400);
  if (kas.data && kas.data !== "ya" && kas.data !== "tidak") return fail(ErrorCode.VALIDATION_ERROR, "kas harus 'ya' atau 'tidak'.", 400);
  
  const coa = requireUUID(input, "coa", { optional: true });
  if (!coa.ok) return fail(ErrorCode.VALIDATION_ERROR, coa.message, 400);

  const payload = {
    klien: klien.data as string,
    deskripsi: deskripsi.data,
    nominal: nominal.data as number,
    tanggal_awal: tanggal_awal.data,
    jatuh_tempo: jatuh_tempo.data,
    kas: (kas.data as FinanceTipeKas) ?? "tidak",
    coa: coa.data,
  };

  const { data, error } = await createUtangPiutang(supabaseAdmin as any, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data utang/piutang.", 500, error.message);
  return ok({ utang_piutang: data }, "Data utang/piutang berhasil dibuat.", 201);
}
