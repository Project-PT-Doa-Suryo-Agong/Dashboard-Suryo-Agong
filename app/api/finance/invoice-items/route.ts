import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listInvoiceItem, createInvoiceItem, deleteInvoiceItem } from "@/lib/services/finance.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const invoiceId = url.searchParams.get("invoice_id");
  if (!invoiceId) {
    return fail(ErrorCode.VALIDATION_ERROR, "invoice_id wajib diisi pada query string.", 400);
  }

  const { data, error } = await listInvoiceItem(auth.ctx.supabase, invoiceId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data invoice items.", 500, error.message);
  return ok({ invoice_items: data });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;

  const id_invoice = requireString(input, "id_invoice");
  if (!id_invoice.ok) return fail(ErrorCode.VALIDATION_ERROR, id_invoice.message, 400);

  const id_sales_order = requireUUID(input, "id_sales_order");
  if (!id_sales_order.ok) return fail(ErrorCode.VALIDATION_ERROR, id_sales_order.message, 400);

  const deskripsi = requireString(input, "deskripsi", { maxLen: 500, optional: true });
  if (!deskripsi.ok) return fail(ErrorCode.VALIDATION_ERROR, deskripsi.message, 400);

  const payload = {
    id_invoice: id_invoice.data as string,
    id_sales_order: id_sales_order.data as string,
    deskripsi: deskripsi.data,
  };

  const { data, error } = await createInvoiceItem(supabaseAdmin as any, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat invoice item.", 500, error.message);
  return ok({ invoice_item: data }, "Invoice item berhasil dibuat.", 201);
}

export async function DELETE(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id_invoice = url.searchParams.get("id_invoice");
  const id_sales_order = url.searchParams.get("id_sales_order");

  if (!id_invoice || !id_sales_order) {
    return fail(ErrorCode.VALIDATION_ERROR, "id_invoice dan id_sales_order wajib diisi pada query string.", 400);
  }

  const { error, deleted } = await deleteInvoiceItem(supabaseAdmin as any, id_invoice, id_sales_order);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus invoice item.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Invoice item tidak ditemukan.", 404);
  
  return ok(null, "Invoice item berhasil dihapus.");
}
