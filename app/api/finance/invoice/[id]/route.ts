import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateInvoice, deleteInvoice } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireDate } from "@/lib/validation/body-validator";
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

  if ("pelanggan" in input) {
    const v = requireString(input, "pelanggan", { maxLen: 200 });
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    payload.pelanggan = v.data;
  }
  if ("tanggal" in input) {
    const v = requireDate(input, "tanggal");
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    payload.tanggal = v.data;
  }
  if ("jatuh_tempo" in input) {
    const v = requireDate(input, "jatuh_tempo");
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    payload.jatuh_tempo = v.data;
  }
  if ("total_amount" in input) {
    const v = requireNumber(input, "total_amount", { min: 0, optional: true });
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    payload.total_amount = v.data;
  }
  if ("catatan" in input) {
    const v = requireString(input, "catatan", { maxLen: 500, optional: true });
    if (!v.ok) return fail(ErrorCode.VALIDATION_ERROR, v.message, 400);
    payload.catatan = v.data;
  }

  const { data, error } = await updateInvoice(supabaseAdmin as any, id, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update invoice.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data invoice tidak ditemukan.", 404);

  if ("items" in input && Array.isArray(input.items)) {
    await (supabaseAdmin as any).schema("finance").from("t_invoice_item").delete().eq("id_invoice", id);
    const validItems = input.items.filter((it: any) => it.id_sales_order && it.id_sales_order.trim() !== "");
    if (validItems.length > 0) {
      const itemsToInsert = validItems.map((it: any) => ({
        id_invoice: id,
        id_sales_order: it.id_sales_order,
        deskripsi: it.deskripsi || null,
      }));
      const { error: insertError } = await (supabaseAdmin as any).schema("finance").from("t_invoice_item").insert(itemsToInsert);
      if (insertError) {
        console.error("Gagal update invoice item:", insertError);
      }
    }
  }

  return ok({ invoice: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteInvoice(supabaseAdmin as any, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus invoice.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data invoice tidak ditemukan.", 404);
  return ok(null, "Invoice berhasil dihapus.");
}
