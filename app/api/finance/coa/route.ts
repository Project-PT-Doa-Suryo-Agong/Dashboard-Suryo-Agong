import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listCoa, createCoa } from "@/lib/services/finance.service";
import type { MCoaInsert, FinanceCoaCategory } from "@/types/supabase";
import { requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listCoa(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data COA.", 500, error.message);
  return ok({ coa: data, meta });
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
  const kode = requireString(input, "kode_akun", { maxLen: 50 });
  if (!kode.ok) return fail(ErrorCode.VALIDATION_ERROR, kode.message, 400);
  const nama = requireString(input, "nama_akun", { maxLen: 255 });
  if (!nama.ok) return fail(ErrorCode.VALIDATION_ERROR, nama.message, 400);
  const kategori = requireString(input, "kategori");
  if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);

  const payload: MCoaInsert = {
    kode_akun: String(kode.data),
    nama_akun: String(nama.data),
    kategori: kategori.data as unknown as FinanceCoaCategory,
  };
  
  if ("is_sub_account" in input) payload.is_sub_account = Boolean(input.is_sub_account);
  if ("parent_id" in input) payload.parent_id = input.parent_id ? String(input.parent_id) : null;

  const { data, error } = await createCoa(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data COA.", 500, error.message);
  return ok({ coa: data }, "Data COA berhasil dibuat.", 201);
}
