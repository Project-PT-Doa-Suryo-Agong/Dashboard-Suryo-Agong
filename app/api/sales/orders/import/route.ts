import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createSalesOrder } from "@/lib/services/sales.service";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import * as XLSX from "xlsx";

/**
 * POST /api/sales/orders/import
 * Accepts multipart/form-data with an Excel file (.xlsx/.xls).
 *
 * Supports MULTI-VARIANT orders via the `no_order` column:
 *   - Rows sharing the same `no_order` value are grouped into a single order
 *   - Customer info (nama_pelanggan, nomor_telepon, lokasi, diskon, terms_of_payment)
 *     is taken from the FIRST row in each group
 *   - Each row contributes one item (varian + quantity) to the order
 *   - If `no_order` is empty/missing, each row becomes its own order
 *
 * Template columns:
 *   no_order | nama_varian | sku | quantity | nama_pelanggan | nomor_telepon | lokasi | diskon | terms_of_payment
 */

type ImportRow = {
  no_order?: number | string;
  nama_varian?: string;
  sku?: string;
  quantity?: number | string;
  harga?: number | string;
  kategori?: string;
  nama_pelanggan?: string;
  nomor_telepon?: string;
  lokasi?: string;
  diskon?: number | string;
  terms_of_payment?: number | string;
};

type GroupedOrder = {
  firstRowNumber: number;
  rowNumbers: number[];
  nama_pelanggan: string | null;
  nomor_telepon: string | null;
  lokasi: string | null;
  diskon: number;
  terms_of_payment: number;
  items: {
    varian_id: string;
    quantity: number;
    harga: number;
    rowNumber: number;
    is_new?: boolean;
    nama_produk?: string;
    nama_varian?: string;
    sku?: string | null;
    kategori?: string | null;
  }[];
};

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/[\s\-]+/g, "_");
}

function parseProductAndVariantName(namaVarianRaw: string): { productName: string; variantName: string } {
  const raw = (namaVarianRaw || "").trim();
  if (!raw) {
    return { productName: "Produk Baru", variantName: "Standar" };
  }

  const separators = [" - ", " / ", " | ", "-", "/", "|"];
  for (const sep of separators) {
    if (raw.includes(sep)) {
      const parts = raw.split(sep);
      const productName = parts[0].trim();
      const variantName = parts.slice(1).join(sep).trim();
      if (productName && variantName) {
        return { productName, variantName };
      }
    }
  }

  return { productName: raw, variantName: "Original" };
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Request harus multipart/form-data.", 400);
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return fail(ErrorCode.VALIDATION_ERROR, "File Excel (.xlsx/.xls) wajib diunggah.", 400);
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!allowedTypes.includes(file.type) && ext !== "xlsx" && ext !== "xls") {
    return fail(ErrorCode.VALIDATION_ERROR, "File harus berformat .xlsx atau .xls.", 400);
  }

  // Parse Excel
  const buffer = await file.arrayBuffer();
  let rows: ImportRow[];
  try {
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return fail(ErrorCode.VALIDATION_ERROR, "File Excel kosong.", 400);

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
    if (rawRows.length === 0) {
      return fail(ErrorCode.VALIDATION_ERROR, "File Excel tidak memiliki data baris.", 400);
    }

    // Normalize headers
    rows = rawRows.map((raw) => {
      const normalized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(raw)) {
        normalized[normalizeHeader(key)] = value;
      }
      return normalized as unknown as ImportRow;
    });
  } catch {
    return fail(ErrorCode.VALIDATION_ERROR, "Gagal memproses file Excel. Pastikan format valid.", 400);
  }

  // Fetch all varian for resolution (with price)
  const { data: allVariants } = await supabaseAdmin
    .schema("core" as any)
    .from("m_varian")
    .select("id, nama_varian, sku, harga");

  if (!allVariants || allVariants.length === 0) {
    return fail(ErrorCode.DB_ERROR, "Tidak ada varian produk di database.", 500);
  }

  const variantBySku = new Map<string, (typeof allVariants)[0]>();
  const variantByName = new Map<string, (typeof allVariants)[0]>();
  for (const v of allVariants) {
    if (v.sku) variantBySku.set(v.sku.trim().toLowerCase(), v);
    if (v.nama_varian) variantByName.set(v.nama_varian.trim().toLowerCase(), v);
  }

  // ── Group rows by no_order ────────────────────────────────────────────
  const orderGroups = new Map<string, GroupedOrder>();
  let autoGroupCounter = 0;
  const rowErrors: { row: number; status: "error"; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // 1-indexed + header row

    // Determine group key
    const rawNoOrder = String(row.no_order ?? "").trim();
    const groupKey = rawNoOrder || `__auto_${++autoGroupCounter}`;

    // Resolve variant
    const skuRaw = String(row.sku ?? "").trim().toLowerCase();
    const nameRaw = String(row.nama_varian ?? "").trim().toLowerCase();
    const variant = (skuRaw ? variantBySku.get(skuRaw) : null) ?? (nameRaw ? variantByName.get(nameRaw) : null);

    const qty = Math.max(1, Math.round(Number(row.quantity) || 1));

    if (!variant) {
      const { productName, variantName } = parseProductAndVariantName(row.nama_varian || "Produk Baru");
      const priceRaw = Number(row.harga) || 0;
      const categoryRaw = String(row.kategori ?? "").trim() || "Lainnya";
      const newItem = {
        varian_id: "",
        quantity: qty,
        harga: priceRaw,
        rowNumber,
        is_new: true,
        nama_produk: productName,
        nama_varian: variantName,
        sku: row.sku || null,
        kategori: categoryRaw,
      };

      if (!orderGroups.has(groupKey)) {
        orderGroups.set(groupKey, {
          firstRowNumber: rowNumber,
          rowNumbers: [rowNumber],
          nama_pelanggan: String(row.nama_pelanggan ?? "").trim() || null,
          nomor_telepon: String(row.nomor_telepon ?? "").trim() || null,
          lokasi: String(row.lokasi ?? "").trim() || null,
          diskon: Math.max(0, Number(row.diskon) || 0),
          terms_of_payment: Math.max(0, Math.round(Number(row.terms_of_payment) || 0)),
          items: [newItem],
        });
      } else {
        const group = orderGroups.get(groupKey)!;
        group.rowNumbers.push(rowNumber);
        group.items.push(newItem);
      }
      continue;
    }

    const harga = Number(variant.harga ?? 0);

    if (!orderGroups.has(groupKey)) {
      // First row in this group → extract customer/order-level info
      orderGroups.set(groupKey, {
        firstRowNumber: rowNumber,
        rowNumbers: [rowNumber],
        nama_pelanggan: String(row.nama_pelanggan ?? "").trim() || null,
        nomor_telepon: String(row.nomor_telepon ?? "").trim() || null,
        lokasi: String(row.lokasi ?? "").trim() || null,
        diskon: Math.max(0, Number(row.diskon) || 0),
        terms_of_payment: Math.max(0, Math.round(Number(row.terms_of_payment) || 0)),
        items: [{ varian_id: variant.id, quantity: qty, harga, rowNumber }],
      });
    } else {
      // Subsequent row in same group → only add the item
      const group = orderGroups.get(groupKey)!;
      group.rowNumbers.push(rowNumber);
      group.items.push({ varian_id: variant.id, quantity: qty, harga, rowNumber });
    }
  }

  // ── Generate order numbers ────────────────────────────────────────────
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yy = String(now.getFullYear()).slice(-2);

  // Fetch the latest order number matching this month's prefix to calculate starting sequence
  const prefix = `ORD-${mm}${yy}-`;
  const { data: maxOrderData } = await supabaseAdmin
    .schema("sales" as any)
    .from("t_sales_order")
    .select("order_number")
    .like("order_number", `${prefix}%`)
    .order("order_number", { ascending: false })
    .limit(1);

  let maxSeq = 0;
  if (maxOrderData && maxOrderData.length > 0 && maxOrderData[0].order_number) {
    const parts = maxOrderData[0].order_number.split('-');
    const seqStr = parts[parts.length - 1];
    const parsedSeq = parseInt(seqStr, 10);
    if (!isNaN(parsedSeq)) {
      maxSeq = parsedSeq;
    }
  }

  let orderSeq = maxSeq + 1;

  // ── Fetch COA for auto-assignment ─────────────────────────────────────
  const { data: coaList } = await supabaseAdmin
    .schema("finance" as any)
    .from("m_coa")
    .select("id, kode_akun, nama_akun, parent_id");

  let defaultCashCoaId: string | null = null;
  let defaultCreditCoaId: string | null = null;

  if (coaList) {
    const cashParent = coaList.find((c: any) => c.nama_akun?.trim().toLowerCase() === "kas penjualan");
    const creditParent = coaList.find((c: any) => c.nama_akun?.trim().toLowerCase() === "piutang usaha");

    if (cashParent) {
      const cashChildren = coaList.filter((c: any) => c.parent_id === cashParent.id);
      const bcaChild = cashChildren.find((c: any) => c.nama_akun?.toLowerCase().includes("bca"));
      defaultCashCoaId = bcaChild?.id ?? cashChildren[0]?.id ?? null;
    }
    if (creditParent) {
      const creditChildren = coaList.filter((c: any) => c.parent_id === creditParent.id);
      const dummyChild = creditChildren.find((c: any) => c.nama_akun?.toLowerCase().includes("dummy"));
      defaultCreditCoaId = dummyChild?.id ?? creditChildren[0]?.id ?? null;
    }
  }

  // ── Process grouped orders ────────────────────────────────────────────
  const results: { row: number; status: "success" | "error"; message: string; order_number?: string }[] = [];
  // Add the variant-resolution errors first
  results.push(...rowErrors);
  let successCount = 0;
  let errorCount = rowErrors.length;

  for (const [, group] of orderGroups) {
    const { items, diskon, terms_of_payment: top } = group;
    const isCreditPayment = top > 0;

    // Calculate totals across ALL items in this order
    const calculatedTotalPrice = items.reduce((sum, it) => sum + it.harga * it.quantity, 0);
    const calculatedTotalItem = items.reduce((sum, it) => sum + it.quantity, 0);
    const calculatedTotalBayar = Math.max(0, calculatedTotalPrice - diskon);
    const finalJumlahCash = isCreditPayment ? 0 : calculatedTotalBayar;
    const finalJumlahPiutang = isCreditPayment ? calculatedTotalBayar : 0;

    const orderNumber = `ORD-${mm}${yy}-${String(orderSeq).padStart(5, "0")}`;
    const rowLabel = group.rowNumbers.length > 1
      ? `Baris ${group.rowNumbers.join(", ")}`
      : `Baris ${group.firstRowNumber}`;

    // Build payload — mirrors POST /api/sales/orders exactly
    const payload: Record<string, any> = {
      order_number: orderNumber,
      varian_id: items[0].varian_id || undefined,
      quantity: calculatedTotalItem,
      total_price: calculatedTotalPrice,
      coa_cash_id: defaultCashCoaId,
      coa_credit_id: isCreditPayment ? defaultCreditCoaId : null,
      nama_pelanggan: group.nama_pelanggan,
      nomor_telepon: group.nomor_telepon,
      lokasi: group.lokasi,
      terms_of_payment: top,
      diskon: diskon,
      total_bayar: calculatedTotalBayar,
      jumlah_cash: finalJumlahCash,
      jumlah_piutang: finalJumlahPiutang,
      total_item: calculatedTotalPrice,  // monetary value, NOT count
      created_at: new Date().toISOString(),
      items: items.map((it) => ({
        varian_id: it.varian_id || undefined,
        quantity: it.quantity,
        harga: it.harga,
        is_new: it.is_new,
        nama_produk: it.nama_produk,
        nama_varian: it.nama_varian,
        sku: it.sku,
        kategori: it.kategori || undefined,
      })),
    };

    try {
      let { data, error } = await createSalesOrder(auth.ctx.supabase, payload);

      if (error) {
        const msg = typeof error.message === "string" ? error.message : "";
        if (
          msg.toLowerCase().includes("row-level security") ||
          msg.toLowerCase().includes("permission denied")
        ) {
          const retry = await createSalesOrder(supabaseAdmin as any, payload);
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        errorCount += group.rowNumbers.length;
        for (const rn of group.rowNumbers) {
          results.push({
            row: rn,
            status: "error",
            message: `Gagal insert (${rowLabel}): ${error.message}`,
          });
        }
      } else {
        successCount += group.rowNumbers.length;
        orderSeq++;
        for (const rn of group.rowNumbers) {
          results.push({
            row: rn,
            status: "success",
            message: `Berhasil (${items.length} varian)`,
            order_number: orderNumber,
          });
        }
      }
    } catch (err) {
      errorCount += group.rowNumbers.length;
      for (const rn of group.rowNumbers) {
        results.push({
          row: rn,
          status: "error",
          message: `Exception: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      }
    }
  }

  // Sort results by row number
  results.sort((a, b) => a.row - b.row);

  return ok(
    {
      summary: {
        total: rows.length,
        success: successCount,
        error: errorCount,
      },
      details: results,
    },
    `Import selesai: ${successCount} berhasil, ${errorCount} gagal dari ${rows.length} baris.`,
    successCount > 0 ? 201 : 200,
  );
}
