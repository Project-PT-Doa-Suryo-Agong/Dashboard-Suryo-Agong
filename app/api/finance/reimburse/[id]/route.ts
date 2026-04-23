import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateReimbursement, deleteReimbursement } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  const payload: Record<string, any> = {};

  if ("employee_id" in input) {
    const employeeId = requireUUID(input, "employee_id");
    if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
    payload.employee_id = employeeId.data;
  }
  if ("amount" in input) {
    const amount = requireNumber(input, "amount", { min: 0 });
    if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
    payload.amount = amount.data;
  }
  if ("bukti" in input) {
    const bukti = requireString(input, "bukti", { optional: true });
    if (!bukti.ok) return fail(ErrorCode.VALIDATION_ERROR, bukti.message, 400);
    
    let finalBukti = bukti.data ?? null;

    if (finalBukti && finalBukti.startsWith("data:")) {
      const matches = finalBukti.match(/^data:([A-Za-z0-9.+\/-]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        const ext = mimeType.split("/")[1]?.toLowerCase() || "bin";
        
        const fileId = id; // use reimburse id or just timestamp
        const fileName = `${fileId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("reimbursements")
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true
          });

        if (uploadError) {
          return fail(ErrorCode.DB_ERROR, "Gagal upload bukti reimburse ke storage.", 500, uploadError.message);
        }

        // Simpan path-nya saja (karena bucket private)
        finalBukti = fileName;
      }
    }
    
    payload.bukti = finalBukti;
  }
  if ("coa_id" in input) {
    const coaId = requireUUID(input, "coa_id", { optional: true });
    if (!coaId.ok) return fail(ErrorCode.VALIDATION_ERROR, coaId.message, 400);
    payload.coa_id = coaId.data;
  }
  if ("status" in input) {
    const status = requireString(input, "status");
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (!["pending", "approved", "rejected"].includes(status.data as string)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, approved, atau rejected.", 400);
    }
    payload.status = status.data;
  }

  const { data, error } = await updateReimbursement(auth.ctx.supabase, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update reimburse.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data reimburse tidak ditemukan.", 404);
  return ok({ reimburse: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteReimbursement(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus reimburse.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data reimburse tidak ditemukan.", 404);
  return ok(null, "Data reimburse berhasil dihapus.");
}
