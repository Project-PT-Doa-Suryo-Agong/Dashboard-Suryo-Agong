import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listJurnal, createJurnal } from "@/lib/services/finance.service";
import { requireString, requireDate } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listJurnal(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data jurnal.", 500, error.message);
  return ok({ jurnal: data, meta });
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
  const tanggal = requireDate(input, "tanggal");
  if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);
  
  const payload: Record<string, any> = {
    tanggal: tanggal.data,
  };
  
  if ("no_bukti" in input) payload.no_bukti = String(input.no_bukti);
  if ("keterangan" in input) payload.keterangan = String(input.keterangan);
  if ("referensi_id" in input) payload.referensi_id = input.referensi_id ? String(input.referensi_id) : null;

  const { data, error } = await createJurnal(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data jurnal.", 500, error.message);
  return ok({ jurnal: data }, "Data jurnal berhasil dibuat.", 201);
}
