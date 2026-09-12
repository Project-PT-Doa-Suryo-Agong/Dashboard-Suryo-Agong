import { createRequire } from "module";
import { ThermalPrinter, types } from "node-thermal-printer";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);

const PRINTER_TYPE = process.env.PRINTER_TYPE || "epson";
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || "";
// Lebar kertas thermal dalam mm adalah sumber utama lebar struk (charactersPerLine).
// Default 80mm. Independen dari fitur "pilih ukuran kertas" lama di aplikasi web.
const PRINTER_WIDTH_MM = Number(process.env.PRINTER_WIDTH_MM || 80);
// Override manual jumlah karakter per baris. Kalau > 0, menang atas PRINTER_WIDTH_MM.
const PRINTER_WIDTH_CHARS = Number(process.env.PRINTER_WIDTH_CHARS || 0);

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "Rp0";
  return rupiahFormatter.format(num);
}

/**
 * Resolve interface string into something node-thermal-printer understands.
 * Accepts:
 *   - "COM3"          -> "\\.\COM3"    (jenis file/local port, COM > 9)
 *   - "\\.\COM3"      -> kept as-is    (raw bytes via local port)
 *   - "printer:NAME"  -> Windows/system printer (butuh driver "printer")
 *   - "printer:auto"  -> auto-pilih printer RAW-ONLY
 *   - "tcp://ip:port" -> printer jaringan
 */
export function resolveInterface(raw) {
  const value = (raw || "").trim();
  if (!value) return "";
  if (/^COM\d+$/i.test(value)) return `\\.\\${value.toUpperCase()}`;
  return value;
}

/**
 * Terjemahkan LEBAR KERTAS (mm) ke jumlah karakter per baris (charactersPerLine)
 * sesuai spesifikasi umum thermal printer pada font normal:
 *   - 58mm  -> 32 karakter
 *   - 80mm  -> 48 karakter
 *   - >80mm -> 56 karakter (lebar ekstra / dot matrix)
 * Angka ini dipakai untuk semua layout kolom struk.
 */
export function charactersPerLineFrom(mm) {
  const width = Number(mm || 0);
  if (width <= 58) return 32;
  if (width <= 80) return 48;
  return 56;
}

/**
 * Tentukan jumlah karakter per baris untuk struk.
 * Prioritas: PRINTER_WIDTH_CHARS (override manual) > PRINTER_WIDTH_MM (env > fallback).
 * Tidak lagi bergantung pada payload.widthMm dari fitur pilih kertas lama.
 */
export function charWidthFor() {
  if (PRINTER_WIDTH_CHARS > 0) return PRINTER_WIDTH_CHARS;
  return charactersPerLineFrom(PRINTER_WIDTH_MM);
}

export function getPrinterConfig() {
  return {
    type: PRINTER_TYPE,
    rawInterface: PRINTER_INTERFACE,
    interface: resolveInterface(PRINTER_INTERFACE),
    widthMm: PRINTER_WIDTH_MM,
    widthChars: PRINTER_WIDTH_CHARS || charactersPerLineFrom(PRINTER_WIDTH_MM),
  };
}

export class PrinterNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrinterNotConfiguredError";
    this.code = "PRINTER_NOT_CONFIGURED";
  }
}

export class PrinterNotConnectedError extends Error {
  constructor(message) {
    super(message);
    this.name = "PrinterNotConnectedError";
    this.code = "PRINTER_NOT_CONNECTED";
  }
}

/**
 * Interface "printer:NAME" butuh driver dari package "printer" (native).
 * Dimuat lazy supaya install default tetap ringan (tanpa build tools).
 */
function loadPrinterDriver() {
  try {
    return require("printer");
  } catch (err) {
    if (err && err.code === "MODULE_NOT_FOUND") {
      throw new PrinterNotConfiguredError(
        "Interface 'printer:...' dipakai tapi package 'printer' belum ter-install. " +
          "Jalankan: cd printer-agent && npm install printer (butuh build tools Windows). " +
          "Alternatif lebih mudah: isi PRINTER_INTERFACE dengan nomor COM (\\\\.\\COM3) dari Device Manager."
      );
    }
    throw err;
  }
}

export function buildPrinter(widthChars) {
  const config = getPrinterConfig();
  if (!config.rawInterface) {
    throw new PrinterNotConfiguredError(
      "Printer belum dikonfigurasi: isi PRINTER_INTERFACE di printer-agent/.env (contoh: \\\\.\\COM3 atau printer:NamaPrinter)."
    );
  }

  const deviceMap = {
    epson: types.EPSON,
    star: types.STAR,
    brother: types.BROTHER,
    // Thermal generik biasanya identik dengan command set Epson.
    generic: types.EPSON,
  };
  const device = deviceMap[PRINTER_TYPE.toLowerCase()] || types.EPSON;

  const printerConfig = {
    type: device,
    interface: config.interface,
    options: { timeout: Number(process.env.PRINTER_TIMEOUT_MS || 5000) },
  };

  if (widthChars && widthChars > 0) {
    printerConfig.width = widthChars;
  }
  if (config.interface.startsWith("printer:")) {
    printerConfig.driver = loadPrinterDriver();
  }

  return new ThermalPrinter(printerConfig);
}

const SEPARATOR = "=";
const THIN_SEPARATOR = "-";

function repeat(char, count) {
  return char.repeat(Math.max(0, count));
}

function center(text, width) {
  const len = text.length;
  if (len >= width) return text.slice(0, width);
  const padLeft = Math.floor((width - len) / 2);
  return repeat(" ", padLeft) + text;
}

function padRight(text, width) {
  const ct = text.length;
  if (ct >= width) return text.slice(0, width);
  return text + repeat(" ", width - ct);
}

function padLeft(text, width) {
  const ct = text.length;
  if (ct >= width) return text.slice(0, width);
  return repeat(" ", width - ct) + text;
}

function wrapLine(text, width) {
  const clean = String(text ?? "-");
  if (clean.length <= width) return [clean];
  const lines = [];
  for (let i = 0; i < clean.length; i += width) {
    lines.push(clean.slice(i, i + width));
  }
  return lines;
}

/**
 * Render struk dari payload (strukturnya konsisten dengan data yang dipakai
 * renderReceiptPdf di lib/utils/so-print-layouts.ts).
 */
export function renderReceiptLines(payload, width) {
  const storeName = String(payload?.store?.name || "PT. DOA SURYO AGONG");
  const storeAddress = Array.isArray(payload?.store?.address)
    ? payload.store.address
    : [String(payload?.store?.address || "")];
  const storePhone = String(payload?.store?.phone || "");
  const orderNumber = String(payload?.order?.number || "-");
  const orderDate = String(payload?.order?.date || "-");
  const customerName = String(payload?.customer?.name || "-");
  const customerPhone = String(payload?.customer?.phone || "-");
  const customerAddress = String(payload?.customer?.address || "-");
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const totals = payload?.totals || {};
  const footnote = payload?.footnote || {};

  const rows = [];

  rows.push(center(storeName, width));
  storeAddress
    .filter((line) => line)
    .slice(0, 2)
    .forEach((line) => {
      wrapLine(line, width).forEach((wrapped) => rows.push(center(wrapped, width)));
    });
  if (storePhone) rows.push(center(storePhone, width));
  rows.push(repeat(SEPARATOR, width));

  rows.push(`No Order: ${orderNumber}`);
  rows.push(`Tanggal  : ${orderDate}`);
  rows.push(repeat(THIN_SEPARATOR, width));

  wrapLine(`Nama : ${customerName}`, width).forEach((line) => rows.push(line));
  wrapLine(`Telp : ${customerPhone}`, width).forEach((line) => rows.push(line));
  wrapLine(`Almt : ${customerAddress}`, width).forEach((line) => rows.push(line));
  rows.push(repeat(THIN_SEPARATOR, width));

  // Kolom item dihitung dinamis terhadap `width` (charactersPerLine) supaya
  // tidak meluber saat 58mm (32 char). Proporsi: Item ~50%, Qty ~12%, Harga ~19%, Total ~19%.
  const qtyW = Math.max(3, Math.round(width * 0.12));
  const priceW = Math.max(6, Math.round(width * 0.19));
  const totalW = Math.max(6, Math.round(width * 0.19));
  const nameW = Math.max(6, width - (qtyW + priceW + totalW));
  const colSep = " ";
  const itemHeader = `${padRight("Item", nameW).slice(0, nameW)}${colSep}` +
    `${padLeft("Qty", qtyW)}${colSep}${padRight("Harga", priceW)}${colSep}${padRight("Total", totalW)}`;
  rows.push(itemHeader.slice(0, width));

  for (const item of items) {
    const name = String(item?.name || "Produk");
    const qty = Number(item?.qty || 0);
    const price = formatRupiah(item?.price);
    const total = formatRupiah(item?.total);
    const row = `${padRight(name, nameW).slice(0, nameW)}${colSep}` +
      `${padLeft(String(qty), qtyW)}${colSep}${padRight(price, priceW)}${colSep}${padRight(total, totalW)}`;
    rows.push(row.slice(0, width));
  }
  rows.push(repeat(THIN_SEPARATOR, width));

  rows.push(`${padRight("Total Barang", 14)}: ${padLeft(formatRupiah(totals.totalBarang), width - 16)}`);
  rows.push(`${padRight("Diskon", 14)}: ${padLeft(formatRupiah(totals.diskon), width - 16)}`);
  rows.push(`${padRight(String(totals.cashLabel || "Jumlah Cash"), 14)}: ${padLeft(formatRupiah(totals.cashValue), width - 16)}`);
  rows.push(`${padRight("Jumlah Piutang", 14)}: ${padLeft(formatRupiah(totals.piutang), width - 16)}`);
  rows.push(`${padRight("TOTAL BAYAR", 14)}: ${padLeft(formatRupiah(totals.totalBayar), width - 16)}`);
  rows.push(repeat(SEPARATOR, width));

  rows.push(center(String(footnote.thankYou || "Terima kasih atas kunjungan Anda."), width));
  if (footnote.itemCount !== undefined && footnote.itemCount !== null) {
    rows.push(center(`${footnote.itemCount} item`, width));
  }

  return rows;
}

/**
 * Cetak struk ke printer.
 * Throws pada kegagalan — tidak pernah crash server.
 */
export async function printReceipt(payload) {
  const width = charWidthFor();
  const printer = buildPrinter(width);

  const connected = await printer.isPrinterConnected();
  if (!connected) {
    throw new PrinterNotConnectedError(
      "Printer tidak terhubung. Pastikan printer USB menyala & kabel terpasang, lalu cek PRINTER_INTERFACE di printer-agent/.env."
    );
  }

  const lines = renderReceiptLines(payload, width);

  printer.clear();
  printer.alignLeft();
  lines.forEach((line) => printer.println(line));
  printer.newLine();
  printer.cut();

  const result = await printer.execute();
  return { result };
}

export function validatePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload harus berupa JSON object.");
  }
  if (!Array.isArray(payload.items)) {
    throw new Error("Payload.items wajib berupa array.");
  }
  for (const item of payload.items) {
    if (item === null || typeof item !== "object") {
      throw new Error("Setiap entri di payload.items harus berupa object.");
    }
  }
  return payload;
}