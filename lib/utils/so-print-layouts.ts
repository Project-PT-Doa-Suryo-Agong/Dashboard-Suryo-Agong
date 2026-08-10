import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { TSalesOrder } from "@/types/supabase";

export type SoPaperLayout = "a4" | "thermal" | "dotmatrix" | "label" | "continuous";

export interface SoPaperOption {
  id: string;
  label: string;
  group: string;
  widthMm: number;
  heightMm: number;
  printableWidthMm: number;
  layout: SoPaperLayout;
  receiptFontSize: number;
}

export const DEFAULT_PAPER_ID = "a4-default";

export const SO_PAPER_GROUPS = [
  "Format Standar",
  "Printer Thermal 58 mm",
  "Printer Thermal 80 mm",
  "Printer Thermal 100–105 mm",
  "Printer Pita / Dot Matrix",
  "Continuous Form",
] as const;

export const SO_PAPER_OPTIONS: SoPaperOption[] = [
  {
    id: DEFAULT_PAPER_ID,
    label: "A4 — Format Standar (tampilan lama)",
    group: "Format Standar",
    widthMm: 210,
    heightMm: 297,
    printableWidthMm: 182,
    layout: "a4",
    receiptFontSize: 9,
  },
  {
    id: "thermal-58x30",
    label: "58 × 30 mm (Struk Mini)",
    group: "Printer Thermal 58 mm",
    widthMm: 58,
    heightMm: 30,
    printableWidthMm: 48,
    layout: "thermal",
    receiptFontSize: 7,
  },
  {
    id: "thermal-58x37",
    label: "58 × 37 mm (Struk Mini)",
    group: "Printer Thermal 58 mm",
    widthMm: 58,
    heightMm: 37,
    printableWidthMm: 48,
    layout: "thermal",
    receiptFontSize: 7,
  },
  {
    id: "thermal-58x40",
    label: "58 × 40 mm (Struk Mini)",
    group: "Printer Thermal 58 mm",
    widthMm: 58,
    heightMm: 40,
    printableWidthMm: 48,
    layout: "thermal",
    receiptFontSize: 7,
  },
  {
    id: "thermal-80x47",
    label: "80 × 47 mm (Struk Kasir)",
    group: "Printer Thermal 80 mm",
    widthMm: 80,
    heightMm: 47,
    printableWidthMm: 72,
    layout: "thermal",
    receiptFontSize: 8,
  },
  {
    id: "thermal-80x60",
    label: "80 × 60 mm (Struk Kasir)",
    group: "Printer Thermal 80 mm",
    widthMm: 80,
    heightMm: 60,
    printableWidthMm: 72,
    layout: "thermal",
    receiptFontSize: 8,
  },
  {
    id: "thermal-80x80",
    label: "80 × 80 mm (Struk Kasir)",
    group: "Printer Thermal 80 mm",
    widthMm: 80,
    heightMm: 80,
    printableWidthMm: 72,
    layout: "thermal",
    receiptFontSize: 8,
  },
  {
    id: "thermal-100x150",
    label: "100 × 150 mm (Label / A6)",
    group: "Printer Thermal 100–105 mm",
    widthMm: 100,
    heightMm: 150,
    printableWidthMm: 90,
    layout: "label",
    receiptFontSize: 9,
  },
  {
    id: "dot-75x60",
    label: "75 × 60 mm (Kasir / Struk)",
    group: "Printer Pita / Dot Matrix",
    widthMm: 75,
    heightMm: 60,
    printableWidthMm: 65,
    layout: "dotmatrix",
    receiptFontSize: 8,
  },
  {
    id: "dot-75x65",
    label: "75 × 65 mm (Kasir / Struk)",
    group: "Printer Pita / Dot Matrix",
    widthMm: 75,
    heightMm: 65,
    printableWidthMm: 65,
    layout: "dotmatrix",
    receiptFontSize: 8,
  },
  {
    id: "cont-letter",
    label: "9.5 × 11 inch (Letter) — Continuous",
    group: "Continuous Form",
    widthMm: 241.3,
    heightMm: 279.4,
    printableWidthMm: 227.3,
    layout: "continuous",
    receiptFontSize: 9,
  },
  {
    id: "cont-a4-kwitansi",
    label: "9.5 × 12 inch (A4 / Kwitansi) — Continuous",
    group: "Continuous Form",
    widthMm: 241.3,
    heightMm: 304.8,
    printableWidthMm: 227.3,
    layout: "continuous",
    receiptFontSize: 9,
  },
  {
    id: "cont-legal",
    label: "15 × 11 inch (Legal / Komputer) — Continuous",
    group: "Continuous Form",
    widthMm: 381,
    heightMm: 279.4,
    printableWidthMm: 367,
    layout: "continuous",
    receiptFontSize: 9,
  },
];

export function getSoPaperOption(id: string | null | undefined): SoPaperOption | undefined {
  if (!id) return undefined;
  return SO_PAPER_OPTIONS.find((option) => option.id === id);
}

export function createSoPdfDoc(opt: SoPaperOption): jsPDF {
  return new jsPDF({
    orientation: opt.widthMm > opt.heightMm ? "landscape" : "portrait",
    unit: "mm",
    format: [opt.widthMm, opt.heightMm],
  });
}

export interface SoItemRow {
  name: string;
  qty: number;
  harga: number;
  total: number;
}

export function getSoItemRows(
  order: TSalesOrder,
  variantMap: ReadonlyMap<string, { nama_varian: string | null }>,
): SoItemRow[] {
  const items = (order as unknown as { items?: Array<{ id_varian?: string; qty?: number | string; harga?: number | string; harga_total?: number | string }> }).items;
  if (Array.isArray(items) && items.length > 0) {
    return items.map((it) => {
      const v = variantMap.get(it.id_varian ?? "");
      return {
        name: v?.nama_varian ?? "Produk Varian",
        qty: Number(it.qty ?? 0),
        harga: Number(it.harga ?? 0),
        total: Number(it.harga_total ?? 0),
      };
    });
  }

  const totalItem = Number(order.total_item ?? 0);
  const qty = totalItem > 0 ? totalItem : Number(order.quantity ?? 0);
  const total = Number(order.total_price || 0);
  const v = variantMap.get(order.varian_id ?? "");
  return [
    {
      name: v?.nama_varian ?? "Produk Varian",
      qty,
      harga: qty > 0 ? total / qty : 0,
      total,
    },
  ];
}

export interface SoPrintDeps {
  variantMap: ReadonlyMap<string, { nama_varian: string | null }>;
  coaMap: ReadonlyMap<string, { kode_akun: string; nama_akun: string }>;
  formatRupiah: (value: number) => string;
  formatDate: (value: string | null) => string;
  getOrderDisplayCode: (order: TSalesOrder) => string;
}

function getSoOrderQuantity(order: TSalesOrder): number {
  const items = (order as unknown as { items?: Array<{ qty?: number | string }> }).items;
  if (Array.isArray(items) && items.length > 0) {
    const itemQty = items.reduce((total, item) => total + Number(item.qty ?? 0), 0);
    if (itemQty > 0) return itemQty;
  }
  const totalItem = Number(order.total_item ?? 0);
  if (totalItem > 0) return totalItem;
  return Number(order.quantity ?? 0);
}

export function renderContinuousPdf(doc: jsPDF, order: TSalesOrder, opt: SoPaperOption, deps: SoPrintDeps): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - 14;
  const titleX = rightX - 66;
  const rightColX = rightX - 84;
  const rightTextX = rightX - 52;
  const summaryLabelX = rightColX + 8;
  const sigX = rightColX + 28;
  const sigXEnd = rightColX + 68;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text("PT. DOA SURYO AGONG", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Jl. Nglinggo, Gobang, Nglinggo, Kec. Gondang, Kab. Nganjuk, Jatim 64451", 14, 25);
  doc.text("Telp: 0851-4123-9009 | Email: info@suryoagong.co.id", 14, 29);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("SALES ORDER INVOICE", titleX, 20);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`No. Order: ${deps.getOrderDisplayCode(order)}`, titleX, 25);
  doc.text(`Tanggal  : ${deps.formatDate(order.created_at)}`, titleX, 29);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 35, rightX, 35);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("INFORMASI PELANGGAN", 14, 42);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  doc.text("Nama Pelanggan  :", 14, 48);
  const nameLines = doc.splitTextToSize(order.nama_pelanggan || "-", 55);
  doc.text(nameLines, 45, 48);

  const nameOffset = (nameLines.length - 1) * 4;
  const phoneY = 53 + nameOffset;
  doc.text("Nomor Telepon   :", 14, phoneY);
  doc.text(order.nomor_telepon || "-", 45, phoneY);

  const locationY = 58 + nameOffset;
  doc.text("Lokasi / Alamat :", 14, locationY);
  const locationLines = doc.splitTextToSize(order.lokasi || "-", 55);
  doc.text(locationLines, 45, locationY);

  doc.setFont("helvetica", "bold");
  doc.text("METODE PEMBAYARAN", rightColX, 42);

  doc.setFont("helvetica", "normal");
  const cashCoa = order.coa_cash_id && deps.coaMap.get(order.coa_cash_id);
  const creditCoa = order.coa_credit_id && deps.coaMap.get(order.coa_credit_id);
  const coaCashName = cashCoa ? `${cashCoa.kode_akun} - ${cashCoa.nama_akun}` : "-";
  const coaCreditName = creditCoa ? `${creditCoa.kode_akun} - ${creditCoa.nama_akun}` : "-";

  doc.text("Terms of Payment :", rightColX, 48);
  doc.text(`${order.terms_of_payment ?? 0} Hari`, rightTextX, 48);

  doc.text("COA Cash         :", rightColX, 53);
  const coaCashLines = doc.splitTextToSize(coaCashName, 48);
  doc.text(coaCashLines, rightTextX, 53);

  const cashOffset = (coaCashLines.length - 1) * 4;
  const creditY = 58 + cashOffset;
  doc.text("COA Piutang      :", rightColX, creditY);
  const coaCreditLines = doc.splitTextToSize(coaCreditName, 48);
  doc.text(coaCreditLines, rightTextX, creditY);

  const maxLeftY = locationY + (locationLines.length - 1) * 4;
  const maxRightY = creditY + (coaCreditLines.length - 1) * 4;
  const separatorY = Math.max(maxLeftY, maxRightY) + 6;

  doc.line(14, separatorY, rightX, separatorY);

  const tableStartY = separatorY + 5;

  const rows = getSoItemRows(order, deps.variantMap);
  const tableRows = rows.map((row) => [
    row.name,
    `${row.qty}`,
    deps.formatRupiah(row.harga),
    deps.formatRupiah(row.total),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [["Nama Item / Varian", "Qty", "Harga Satuan", "Total Harga"]],
    body: tableRows,
    styles: { fontSize: 9, cellPadding: 3, font: "helvetica" },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text("Total Harga Barang :", summaryLabelX, finalY);
  doc.text("Diskon             :", summaryLabelX, finalY + 5);
  doc.text(Number(order.terms_of_payment ?? 0) > 0 ? "Jumlah DP          :" : "Jumlah Cash        :", summaryLabelX, finalY + 10);
  doc.text("Jumlah Piutang     :", summaryLabelX, finalY + 15);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("Total Bayar        :", summaryLabelX, finalY + 22);

  doc.setFont("helvetica", "normal");
  doc.text(deps.formatRupiah(Number(order.total_price || 0)), rightX, finalY, { align: "right" });
  doc.text(deps.formatRupiah(order.diskon ?? 0), rightX, finalY + 5, { align: "right" });
  doc.text(deps.formatRupiah(order.jumlah_cash ?? (order.total_price || 0)), rightX, finalY + 10, { align: "right" });
  doc.text(deps.formatRupiah(order.jumlah_piutang ?? 0), rightX, finalY + 15, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text(deps.formatRupiah(order.total_bayar ?? (order.total_price || 0)), rightX, finalY + 22, { align: "right" });

  const footerY = finalY + 40;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Syarat & Ketentuan:", 14, footerY);
  doc.text("1. Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.", 14, footerY + 4);
  doc.text("2. Pembayaran piutang jatuh tempo sesuai Terms of Payment (TOP).", 14, footerY + 8);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Dibuat Oleh,", sigX, footerY);
  doc.line(sigX, footerY + 18, sigXEnd, footerY + 18);
  doc.text("Bagian Penjualan", sigX, footerY + 22);
}

export function renderReceiptPdf(doc: jsPDF, order: TSalesOrder, opt: SoPaperOption, deps: SoPrintDeps): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 5;
  const contentWidth = pageWidth - marginX * 2;
  const centerX = pageWidth / 2;
  const rightEdge = pageWidth - marginX;
  const fs = opt.receiptFontSize;
  const compact = (value: number) => deps.formatRupiah(value).replace(/^Rp\s*/i, "");

  let y = marginX + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fs + 2);
  doc.setTextColor(30, 41, 59);
  doc.text("PT. DOA SURYO AGONG", centerX, y, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fs - 1);
  doc.setTextColor(100, 116, 139);
  y += 3.5;
  doc.text("Jl. Nglinggo, Gobang, Nglinggo,", centerX, y, { align: "center" });
  y += 3;
  doc.text("Kec. Gondang, Kab. Nganjuk, Jatim", centerX, y, { align: "center" });
  y += 3;
  doc.text("Telp: 0851-4123-9009", centerX, y, { align: "center" });

  y += 3;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, rightEdge, y);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(fs);
  doc.setTextColor(30, 41, 59);
  doc.text(`No. Order: ${deps.getOrderDisplayCode(order)}`, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.text(deps.formatDate(order.created_at), rightEdge, y, { align: "right" });

  y += 4;
  doc.text("Nama:", marginX, y);
  doc.text(order.nama_pelanggan || "-", marginX + 11, y);
  y += 3.5;
  doc.text("Telp:", marginX, y);
  doc.text(order.nomor_telepon || "-", marginX + 11, y);
  y += 3.5;
  doc.text("Alamat:", marginX, y);
  const addressLines = doc.splitTextToSize(order.lokasi || "-", contentWidth - 11);
  doc.text(addressLines, marginX + 11, y);
  y += addressLines.length * 3.5;

  const rows = getSoItemRows(order, deps.variantMap);
  const tableRows = rows.map((row) => [
    row.name,
    `${row.qty}`,
    compact(row.harga),
    compact(row.total),
  ]);

  autoTable(doc, {
    startY: y + 2,
    head: [["Item", "Qty", "Harga", "Total"]],
    body: tableRows,
    styles: { fontSize: fs, cellPadding: 1.5, font: "helvetica" },
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: Math.round(contentWidth * 0.42 * 10) / 10 },
      1: { cellWidth: Math.round(contentWidth * 0.13 * 10) / 10, halign: "center" },
      2: { cellWidth: Math.round(contentWidth * 0.225 * 10) / 10, halign: "right" },
      3: { cellWidth: Math.round(contentWidth * 0.225 * 10) / 10, halign: "right" },
    },
    margin: { left: marginX, right: marginX, top: marginX, bottom: marginX },
  });

  let finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (finalY > pageHeight - 22) {
    doc.addPage();
    finalY = marginX + 4;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(fs);
  doc.setTextColor(71, 85, 105);
  doc.text("Total Barang :", marginX, finalY);
  doc.text(compact(Number(order.total_price || 0)), rightEdge, finalY, { align: "right" });
  doc.text("Diskon       :", marginX, finalY + 4);
  doc.text(compact(order.diskon ?? 0), rightEdge, finalY + 4, { align: "right" });
  doc.text(Number(order.terms_of_payment ?? 0) > 0 ? "Jumlah DP    :" : "Jumlah Cash  :", marginX, finalY + 8);
  doc.text(compact(order.jumlah_cash ?? (order.total_price || 0)), rightEdge, finalY + 8, { align: "right" });
  doc.text("Jumlah Piutang:", marginX, finalY + 12);
  doc.text(compact(order.jumlah_piutang ?? 0), rightEdge, finalY + 12, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(22, 101, 52);
  doc.text("TOTAL BAYAR", marginX, finalY + 19);
  doc.text(compact(order.total_bayar ?? (order.total_price || 0)), rightEdge, finalY + 19, { align: "right" });

  let footerY = finalY + 28;
  if (footerY > pageHeight - 8) {
    doc.addPage();
    footerY = marginX + 4;
  }

  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY, rightEdge, footerY);
  footerY += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(fs - 1);
  doc.setTextColor(148, 163, 184);
  doc.text("Terima kasih atas kunjungan Anda.", centerX, footerY, { align: "center" });
  doc.text(`${getSoOrderQuantity(order)} item`, centerX, footerY + 3, { align: "center" });
}

export function renderLabelPdf(doc: jsPDF, order: TSalesOrder, opt: SoPaperOption, deps: SoPrintDeps): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 5;
  const contentWidth = pageWidth - marginX * 2;
  const rightEdge = pageWidth - marginX;
  const centerX = pageWidth / 2;

  let y = marginX + 3;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("LABEL PENGIRIMAN", centerX, y, { align: "center" });

  y += 4;
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  doc.line(marginX, y, rightEdge, y);

  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("PENGIRIM (FROM):", marginX, y);

  y += 3.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text("PT. DOA SURYO AGONG", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const fromLines = doc.splitTextToSize(
    "Jl. Nglinggo, Gobang, Nglinggo, Kec. Gondang, Kab. Nganjuk, Jawa Timur 64451",
    contentWidth,
  );
  fromLines.forEach((line: string) => {
    y += 3.2;
    doc.text(line, marginX, y);
  });
  y += 3.2;
  doc.text("Telp: 0851-4123-9009", marginX, y);

  y += 4;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(marginX, y, rightEdge, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("PENERIMA (TO):", marginX, y);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(order.nama_pelanggan || "-", marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  y += 4;
  doc.text("No. Telp:", marginX, y);
  doc.text(order.nomor_telepon || "-", marginX + 12, y);

  y += 4;
  doc.text("Alamat:", marginX, y);
  const toAddressLines = doc.splitTextToSize(order.lokasi || "-", contentWidth - 12);
  doc.text(toAddressLines, marginX + 12, y);
  y += toAddressLines.length * 3.2;

  y += 4;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(marginX, y, rightEdge, y);

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("No. Order:", marginX, y);
  doc.text(deps.getOrderDisplayCode(order), marginX + 17, y);
  doc.text("Tanggal:", rightEdge - 17, y);
  doc.text(deps.formatDate(order.created_at), rightEdge, y, { align: "right" });

  y += 5;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.2);
  doc.line(marginX, y, rightEdge, y);

  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("ISI PAKET:", marginX, y);

  const rows = getSoItemRows(order, deps.variantMap);
  const maxLabelLines = 10;
  const visibleRows = rows.slice(0, maxLabelLines);
  const extraCount = rows.length - visibleRows.length;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  visibleRows.forEach((row) => {
    y += 4;
    doc.text(row.name, marginX, y);
    doc.text(`${row.qty}x`, rightEdge, y, { align: "right" });
  });
  if (extraCount > 0) {
    y += 4;
    doc.text(`... dan ${extraCount} item lainnya`, marginX, y);
  }

  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(`Total: ${getSoOrderQuantity(order)} item`, marginX, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Rp ${compactNumber(Number(order.total_price || 0))}`, rightEdge, y, { align: "right" });
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value);
}

export function getPrintLayoutCss(opt: SoPaperOption): string {
  const pageSize = `${opt.widthMm}mm ${opt.heightMm}mm`;

  if (opt.layout === "a4" || opt.layout === "continuous") {
    return `@page { size: ${pageSize}; margin: 15mm; }
      body { padding: 40px; }`;
  }

  if (opt.layout === "label") {
    return `@page { size: ${pageSize}; margin: 0; }
      body { margin: 0; padding: 0 !important; }
      .so-print-label { width: ${opt.printableWidthMm}mm; margin: 0 auto; padding: 3mm; box-sizing: border-box; }
      .so-print-label .grid { display: block !important; }
      .so-print-label [class*="grid-cols-2"] { grid-template-columns: 1fr !important; }
      .so-print-label .print-hide-label { display: none !important; }
      .so-print-label .rounded-xl { border-radius: 2px !important; }
      .so-print-label > * + * { margin-top: 2.5mm !important; }
      .so-print-label label { font-size: 8px !important; }
      .so-print-label p { font-size: 10px !important; }
      .so-print-label .text-base { font-size: 12px !important; }
      .so-print-label table th, .so-print-label table td { font-size: 9px !important; padding: 2px 4px !important; }`;
  }

  return `@page { size: ${pageSize}; margin: 0; }
    body { margin: 0; padding: 0 !important; }
    .so-print-receipt { width: ${opt.printableWidthMm}mm; margin: 0 auto; padding: 2mm; box-sizing: border-box; }
    .so-print-receipt .grid { display: block !important; }
    .so-print-receipt [class*="grid-cols-2"] { grid-template-columns: 1fr !important; }
    .so-print-receipt .print-hide-receipt { display: none !important; }
    .so-print-receipt .rounded-xl { border-radius: 2px !important; }
    .so-print-receipt > * + * { margin-top: 2mm !important; }
    .so-print-receipt label { font-size: 7px !important; }
    .so-print-receipt p { font-size: 9px !important; margin-top: 0 !important; }
    .so-print-receipt .text-base { font-size: 10px !important; }
    .so-print-receipt table th, .so-print-receipt table td { font-size: 8px !important; padding: 2px 4px !important; }`;
}
