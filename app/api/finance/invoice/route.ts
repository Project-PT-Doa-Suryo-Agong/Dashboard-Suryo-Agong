import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listInvoice, createInvoice } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireDate } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 100, 1), 500);

  const { data, error, meta } = await listInvoice(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data invoice.", 500, error.message);
  return ok({ invoices: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;

  const pelanggan = requireString(input, "pelanggan", { maxLen: 200 });
  if (!pelanggan.ok) return fail(ErrorCode.VALIDATION_ERROR, pelanggan.message, 400);

  const tanggal = requireDate(input, "tanggal");
  if (!tanggal.ok) return fail(ErrorCode.VALIDATION_ERROR, tanggal.message, 400);

  const jatuh_tempo = requireDate(input, "jatuh_tempo");
  if (!jatuh_tempo.ok) return fail(ErrorCode.VALIDATION_ERROR, jatuh_tempo.message, 400);

  const total_amount = requireNumber(input, "total_amount", { min: 0, optional: true });
  if (!total_amount.ok) return fail(ErrorCode.VALIDATION_ERROR, total_amount.message, 400);

  const catatan = requireString(input, "catatan", { maxLen: 500, optional: true });
  if (!catatan.ok) return fail(ErrorCode.VALIDATION_ERROR, catatan.message, 400);

  const idInvoice = requireString(input, "id_invoice", { optional: true });
  if (!idInvoice.ok) return fail(ErrorCode.VALIDATION_ERROR, idInvoice.message, 400);

  const generateInvoiceId = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data: countData, error: countError } = await supabaseAdmin.rpc("count_invoices_this_month", {
      start_of_month: startOfMonth,
      start_of_next_month: startOfNextMonth,
    });

    if (countError) {
      return { ok: false as const, error: countError };
    }

    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const seq = String(((countData as number) ?? 0) + 1).padStart(5, "0");
    return { ok: true as const, id: `INVC-${mm}${yy}-${seq}` };
  };

  let finalInvoiceId = idInvoice.data ?? null;
  if (!finalInvoiceId) {
    const generated = await generateInvoiceId();
    if (!generated.ok) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat ID invoice.", 500, generated.error.message);
    }
    finalInvoiceId = generated.id;
  }

  const payload = {
    id_invoice: finalInvoiceId,
    pelanggan: pelanggan.data as string,
    tanggal: tanggal.data as string,
    jatuh_tempo: jatuh_tempo.data as string,
    total_amount: (total_amount.data as number) ?? 0,
    catatan: catatan.data,
  };

  const { data, error } = await createInvoice(supabaseAdmin as any, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat invoice.", 500, error.message);

  if (Array.isArray(input.items) && input.items.length > 0) {
    const validItems = input.items.filter((it: any) => it.id_sales_order && it.id_sales_order.trim() !== "");
    if (validItems.length > 0) {
      const itemsToInsert = validItems.map((it: any) => ({
        id_invoice: data?.id_invoice,
        id_sales_order: it.id_sales_order,
        deskripsi: it.deskripsi || null,
      }));
      const { error: insertError } = await (supabaseAdmin as any).schema("finance").from("t_invoice_item").insert(itemsToInsert);
      if (insertError) {
        console.error("Gagal insert invoice item:", insertError);
      }
    }
  }

  return ok({ invoice: data }, "Invoice berhasil dibuat.", 201);
}
