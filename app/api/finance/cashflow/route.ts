import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listCashflow, createCashflow } from "@/lib/services/finance.service";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import type { TCashflowInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listCashflow(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data cashflow.", 500, error.message);
  return ok({ cashflow: data, meta });
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
  const tipe = requireString(input, "tipe", { optional: true });
  if (!tipe.ok) return fail(ErrorCode.VALIDATION_ERROR, tipe.message, 400);
  if (tipe.data !== null && !["income", "expense"].includes(tipe.data)) {
    return fail(ErrorCode.VALIDATION_ERROR, "tipe harus income atau expense.", 400);
  }
  const amount = requireNumber(input, "amount", { min: 0, optional: true });
  if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
  const keterangan = requireString(input, "keterangan", { maxLen: 255, optional: true });
  if (!keterangan.ok) return fail(ErrorCode.VALIDATION_ERROR, keterangan.message, 400);

  if (!("tipe" in input) && !("amount" in input) && !("keterangan" in input)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Minimal satu field cashflow harus diisi.", 400);
  }

  const payload: TCashflowInsert = {
    ...input,
    tipe: tipe.data as TCashflowInsert["tipe"],
    amount: amount.data,
    keterangan: keterangan.data,
  };

  const { data, error } = await createCashflow(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data cashflow.", 500, error.message);
  return ok({ cashflow: data }, "Data cashflow berhasil dibuat.", 201);
}
