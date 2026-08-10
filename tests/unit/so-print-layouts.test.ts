import { describe, expect, it } from "vitest";
import type { TSalesOrder } from "@/types/supabase";
import {
  SO_PAPER_OPTIONS,
  DEFAULT_PAPER_ID,
  getSoPaperOption,
  createSoPdfDoc,
  renderContinuousPdf,
  renderReceiptPdf,
  renderLabelPdf,
  getPrintLayoutCss,
} from "@/lib/utils/so-print-layouts";

function makeSampleOrder(): TSalesOrder {
  return {
    id: "ord-1",
    order_number: "SLS-2026-001",
    order_code: null,
    coa_id: null,
    coa_cash_id: "coa-cash-1",
    coa_credit_id: "coa-credit-1",
    varian_id: "var-1",
    affiliator_id: null,
    quantity: 2,
    total_price: 200000,
    nama_pelanggan: "Budi Santoso",
    nomor_telepon: "0812-3456-7890",
    lokasi: "Jl. Merdeka No. 1, Nganjuk, Jawa Timur",
    created_at: "2026-08-01T10:00:00.000Z",
    updated_at: null,
    terms_of_payment: 0,
    jumlah_piutang: 0,
    jumlah_cash: 200000,
    diskon: 0,
    id_pelanggan: null,
    total_item: 2,
    total_bayar: 200000,
    items: [
      { id_varian: "var-1", qty: 2, harga: 100000, harga_total: 200000 },
      { id_varian: "var-2", qty: 3, harga: 50000, harga_total: 150000 },
    ],
  } as unknown as TSalesOrder;
}

const deps = {
  variantMap: new Map([
    ["var-1", { nama_varian: "Kaos Polos Cotton Combed 24s" }],
    ["var-2", { nama_varian: "Hoodie Premium" }],
  ]),
  coaMap: new Map([
    ["coa-cash-1", { kode_akun: "1100", nama_akun: "Kas" }],
    ["coa-credit-1", { kode_akun: "1200", nama_akun: "Piutang Usaha" }],
  ]),
  formatRupiah: (value: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value),
  formatDate: (value: string | null) => (value ? value.slice(0, 10) : "-"),
  getOrderDisplayCode: (order: TSalesOrder) => order.order_number || order.id,
};

const EXPECTED_SIZES: Record<string, [number, number]> = {
  [DEFAULT_PAPER_ID]: [210, 297],
  "thermal-58x30": [58, 30],
  "thermal-58x37": [58, 37],
  "thermal-58x40": [58, 40],
  "thermal-80x47": [80, 47],
  "thermal-80x60": [80, 60],
  "thermal-80x80": [80, 80],
  "thermal-100x150": [100, 150],
  "dot-75x60": [75, 60],
  "dot-75x65": [75, 65],
  "cont-letter": [241.3, 279.4],
  "cont-a4-kwitansi": [241.3, 304.8],
  "cont-legal": [381, 279.4],
};

describe("so-print-layouts", () => {
  it("hanya menyediakan ukuran kertas sesuai whitelist requirement", () => {
    expect(SO_PAPER_OPTIONS).toHaveLength(13);
    expect(Object.keys(EXPECTED_SIZES)).toHaveLength(13);
    for (const option of SO_PAPER_OPTIONS) {
      expect(EXPECTED_SIZES[option.id]).toBeDefined();
      expect(EXPECTED_SIZES[option.id][0]).toBeCloseTo(option.widthMm, 1);
      expect(EXPECTED_SIZES[option.id][1]).toBeCloseTo(option.heightMm, 1);
    }
  });

  it("getSoPaperOption menolak id di luar daftar (validasi whitelist)", () => {
    expect(getSoPaperOption("thermal-58x30")).toBeDefined();
    expect(getSoPaperOption("cont-legal")).toBeDefined();
    expect(getSoPaperOption("")).toBeUndefined();
    expect(getSoPaperOption(null)).toBeUndefined();
    expect(getSoPaperOption("a4-custom-999")).toBeUndefined();
    expect(getSoPaperOption("hacked-size-9999")).toBeUndefined();
  });

  it("setiap ukuran menghasilkan dokumen jsPDF dengan dimensi halaman yang benar", () => {
    for (const option of SO_PAPER_OPTIONS) {
      const doc = createSoPdfDoc(option);
      const [expectedW, expectedH] = EXPECTED_SIZES[option.id];
      expect(doc.internal.pageSize.getWidth(), `${option.id} width`).toBeCloseTo(expectedW, 1);
      expect(doc.internal.pageSize.getHeight(), `${option.id} height`).toBeCloseTo(expectedH, 1);
      const bytes = doc.output("arraybuffer").byteLength;
      expect(bytes, `${option.id} output bytes`).toBeGreaterThan(500);
    }
  });

  it("render semua layout (continuous, receipt thermal, label) tanpa error dan menghasilkan PDF", () => {
    const order = makeSampleOrder();
    for (const option of SO_PAPER_OPTIONS) {
      const doc = createSoPdfDoc(option);
      if (option.layout === "thermal" || option.layout === "dotmatrix") {
        renderReceiptPdf(doc, order, option, deps);
      } else if (option.layout === "label") {
        renderLabelPdf(doc, order, option, deps);
      } else {
        renderContinuousPdf(doc, order, option, deps);
      }
      expect(doc.output("arraybuffer").byteLength, `${option.id} render bytes`).toBeGreaterThan(800);
    }
  });

  it("getPrintLayoutCss memakai @page size sesuai ukuran kertas", () => {
    for (const option of SO_PAPER_OPTIONS) {
      const css = getPrintLayoutCss(option);
      expect(css, `${option.id} @page`).toContain(`@page { size: ${option.widthMm}mm ${option.heightMm}mm;`);
      if (option.layout === "thermal" || option.layout === "dotmatrix") {
        expect(css).toContain(".so-print-receipt");
      } else if (option.layout === "label") {
        expect(css).toContain(".so-print-label");
      } else {
        expect(css).toContain("body { padding: 40px; }");
      }
    }
  });
});
