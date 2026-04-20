import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listJurnalItem, createJurnalItem } from "@/lib/services/finance.service";
import { requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const journalId = url.searchParams.get("journal_id");
  if (!journalId) {
    return fail(ErrorCode.VALIDATION_ERROR, "Query journal_id wajib diisi.", 400);
  }

  const { data, error } = await listJurnalItem(auth.ctx.supabase, journalId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data jurnal_item.", 500, error.message);
  return ok({ items: data });
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
  const journalId = requireUUID(input, "journal_id");
  if (!journalId.ok) return fail(ErrorCode.VALIDATION_ERROR, "Format journal_id tidak valid.", 400);
  
  const coaId = requireUUID(input, "coa_id");
  if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, "Format coa_id tidak valid.", 400);

  const payload: Record<string, any> = {
    journal_id: journalId.data,
    coa_id: coaId.data,
    kredit: Number(input.kredit) || 0,
    debit: Number(input.debit) || 0
  };

  const { data, error } = await createJurnalItem(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat data jurnal_item.", 500, error.message);
  return ok({ item: data }, "Data jurnal item berhasil dibuat.", 201);
}
