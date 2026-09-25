import { promises as fsp } from "node:fs";
import { createRequire } from "module";
import { ThermalPrinter, types, CharacterSet } from "node-thermal-printer";
import dotenv from "dotenv";
import { SerialPort } from "serialport";

dotenv.config();

const require = createRequire(import.meta.url);

const PRINTER_TYPE = process.env.PRINTER_TYPE || "epson";
const PRINTER_INTERFACE = process.env.PRINTER_INTERFACE || "";
// Lebar kertas thermal dalam mm adalah sumber utama lebar struk (charactersPerLine).
// Default 80mm. Independen dari fitur "pilih ukuran kertas" lama di aplikasi web.
const PRINTER_WIDTH_MM = Number(process.env.PRINTER_WIDTH_MM || 80);
// Override manual jumlah karakter per baris. Kalau > 0, menang atas PRINTER_WIDTH_MM.
const PRINTER_WIDTH_CHARS = Number(process.env.PRINTER_WIDTH_CHARS || 0);
// Batas waktu maksimum satu proses print (komunikasi dengan printer).
const PRINTER_TIMEOUT_MS = Number(process.env.PRINTER_TIMEOUT_MS || 5000);

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export function formatRupiah(value) {
  if (value === null || value === undefined || value === "") {
    return "Rp 0";
  }
  const num = Number(value);
  if (isNaN(num) || !Number.isFinite(num)) return "Rp 0";
  return "Rp " + num.toLocaleString("id-ID");
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
 * sesuai spesifikasi umum thermal printer pada Font A normal:
 *   - 58mm  -> 32 karakter
 *   - 80mm  -> 42 karakter (konservatif untuk 80mm / 72mm printable width)
 *   - >80mm -> 56 karakter (lebar ekstra / dot matrix)
 * Angka ini dipakai untuk semua layout kolom struk.
 */
export function charactersPerLineFrom(mm) {
  const width = Number(mm || 0);
  if (width <= 58) return 32;
  if (width <= 80) return 42;
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
  const characterSet = process.env.PRINTER_CHARACTER_SET || CharacterSet.PC437_USA;

  const printerConfig = {
    type: device,
    interface: config.interface,
    characterSet: characterSet,
    options: { timeout: PRINTER_TIMEOUT_MS },
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

function padRight(text, width) {
  const ct = String(text ?? "").length;
  if (ct >= width) return String(text).slice(0, width);
  return String(text) + repeat(" ", width - ct);
}

function padLeft(text, width) {
  const ct = String(text ?? "").length;
  if (ct >= width) return String(text).slice(0, width);
  return repeat(" ", width - ct) + String(text);
}

/**
 * Pemisah baris cerdas berbasis spasi kata (word-boundary).
 * Mencegah pemotongan kata di tengah huruf. Jika ada kata tunggal yang lebih
 * panjang dari maxWidth, kata tersebut baru dipotong paksa per-karakter.
 */
export function smartWrap(text, width) {
  const clean = String(text ?? "").trim();
  if (!clean) return [""];
  if (clean.length <= width) return [clean];

  const words = clean.split(/\s+/);
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    if (!currentLine) {
      if (word.length <= width) {
        currentLine = word;
      } else {
        for (let i = 0; i < word.length; i += width) {
          lines.push(word.slice(i, i + width));
        }
      }
    } else {
      if ((currentLine + " " + word).length <= width) {
        currentLine += " ";
        currentLine += word;
      } else {
        lines.push(currentLine);
        if (word.length <= width) {
          currentLine = word;
        } else {
          for (let i = 0; i < word.length; i += width) {
            lines.push(word.slice(i, i + width));
          }
          currentLine = "";
        }
      }
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function createLineObj(text, align = "left") {
  return {
    text,
    align,
    toString() {
      return text;
    },
  };
}

/**
 * Render struk dari payload menjadi array of line objects yang mencakup teks
 * dan flag alignment ("center" | "left").
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

  // Header (Native ESC/POS Center Alignment)
  rows.push(createLineObj(storeName, "center"));
  storeAddress
    .filter(Boolean)
    .slice(0, 2)
    .forEach((line) => {
      smartWrap(line, width).forEach((wrapped) => rows.push(createLineObj(wrapped, "center")));
    });
  if (storePhone) rows.push(createLineObj(storePhone, "center"));
  rows.push(createLineObj(repeat(SEPARATOR, width), "left"));

  // No Order & Tanggal
  rows.push(createLineObj(`No Order: ${orderNumber}`, "left"));
  rows.push(createLineObj(`Tanggal  : ${orderDate}`, "left"));
  rows.push(createLineObj(repeat(THIN_SEPARATOR, width), "left"));

  // Customer Info (Smart Word-Wrap)
  smartWrap(`Nama : ${customerName}`, width).forEach((line) => rows.push(createLineObj(line, "left")));
  smartWrap(`Telp : ${customerPhone}`, width).forEach((line) => rows.push(createLineObj(line, "left")));
  smartWrap(`Almt : ${customerAddress}`, width).forEach((line) => rows.push(createLineObj(line, "left")));
  rows.push(createLineObj(repeat(THIN_SEPARATOR, width), "left"));

  // Section Item: Header judul "Rincian Pesanan" & layout 2-baris per item
  const sectionTitle = "Rincian Pesanan";
  if (width >= sectionTitle.length + 6) {
    const sideDash = Math.floor((width - sectionTitle.length - 2) / 2);
    const titleHeader = `${repeat(THIN_SEPARATOR, sideDash)} ${sectionTitle} ${repeat(THIN_SEPARATOR, width - sideDash - sectionTitle.length - 2)}`;
    rows.push(createLineObj(titleHeader, "left"));
  } else {
    rows.push(createLineObj(sectionTitle, "left"));
  }

  for (const item of items) {
    const name = String(item?.name || "Produk");
    const qty = Number(item?.qty || 0);
    const priceFormatted = formatRupiah(item?.price);
    const totalFormatted = formatRupiah(item?.total);

    // Baris 1: Nama Produk (smartWrap full width)
    const nameLines = smartWrap(name, width);
    for (const line of nameLines) {
      rows.push(createLineObj(line, "left"));
    }

    // Baris 2: "  {qty} x {price}" di kiri, "{total}" di kanan
    const detailLeft = `  ${qty} x ${priceFormatted}`;
    if (detailLeft.length + totalFormatted.length + 1 <= width) {
      const spaceW = width - detailLeft.length - totalFormatted.length;
      rows.push(createLineObj(`${detailLeft}${repeat(" ", spaceW)}${totalFormatted}`, "left"));
    } else {
      // Jika terlalu panjang untuk 1 baris, tampilkan detail & total secara rapi
      rows.push(createLineObj(detailLeft, "left"));
      rows.push(createLineObj(padLeft(totalFormatted, width), "left"));
    }
  }
  rows.push(createLineObj(repeat(THIN_SEPARATOR, width), "left"));

  // Ringkasan Totals (Dinamis disesuaikan dengan width)
  const totalEntries = [
    { label: "Total Barang", val: totals.totalBarang },
    { label: "Diskon", val: totals.diskon },
    { label: String(totals.cashLabel || "Jumlah Cash"), val: totals.cashValue },
    { label: "Jumlah Piutang", val: totals.piutang },
    { label: "TOTAL BAYAR", val: totals.totalBayar },
  ];

  const maxLabelLen = Math.max(...totalEntries.map((e) => e.label.length));
  const labelW = Math.min(maxLabelLen, Math.max(10, width - 12));
  const valueW = width - labelW - 2;

  for (const entry of totalEntries) {
    const lbl = padRight(entry.label.slice(0, labelW), labelW);
    const val = padLeft(formatRupiah(entry.val), valueW);
    rows.push(createLineObj(`${lbl}: ${val}`, "left"));
  }
  rows.push(createLineObj(repeat(SEPARATOR, width), "left"));

  // Footer (Native ESC/POS Center Alignment)
  smartWrap(String(footnote.thankYou || "Terima kasih atas kunjungan Anda."), width).forEach((wrapped) => {
    rows.push(createLineObj(wrapped, "center"));
  });
  if (footnote.itemCount !== undefined && footnote.itemCount !== null) {
    rows.push(createLineObj(`${footnote.itemCount} item`, "center"));
  }

  return rows;
}

/**
 * Jalankan sebuah promise dengan batas waktu. Kalau lewat, reject dengan pesan
 * timeout yang jelas (bukan error mentah dari library).
 */
function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/**
 * Tulis buffer ke serial port (mis. "COM3" atau "\\.\COM3") menggunakan package 'serialport'.
 * Membuka port secara eksplisit, mengirim buffer, menunggu drain, lalu menutup port.
 */
function writeToSerialPort(portPath, buffer, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const cleanPath = portPath.trim();
    const baudRate = Number(process.env.PRINTER_BAUD_RATE || 9600);

    let isSettled = false;
    let timer = null;
    let port = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      if (port && port.isOpen) {
        try {
          port.close();
        } catch (_) {}
      }
    };

    const fail = (err) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      reject(err);
    };

    const succeed = (val) => {
      if (isSettled) return;
      isSettled = true;
      cleanup();
      resolve(val);
    };

    timer = setTimeout(() => {
      fail(new Error(`Timeout (${timeoutMs}ms) saat membuka/menulis ke port serial ${cleanPath}.`));
    }, timeoutMs);

    try {
      port = new SerialPort(
        {
          path: cleanPath,
          baudRate: baudRate,
          autoOpen: false,
        },
        (err) => {
          if (err) fail(err);
        }
      );

      port.on("error", (err) => {
        fail(err);
      });

      port.open((openErr) => {
        if (openErr) return fail(openErr);

        port.write(buffer, (writeErr) => {
          if (writeErr) return fail(writeErr);

          port.drain((drainErr) => {
            if (drainErr) return fail(drainErr);
            succeed();
          });
        });
      });
    } catch (err) {
      fail(err);
    }
  });
}

/**
 * Tulis buffer ke serial port dengan retry loop & timeout.
 * Bluetooth SPP port mungkin memerlukan percobaan ulang singkat jika port sedang inisialisasi.
 */
async function writeToSerialPortWithRetry(path, buffer, timeoutMs, retryIntervalMs = 300) {
  const startTime = Date.now();
  let lastError = null;

  while (Date.now() - startTime < timeoutMs) {
    try {
      const remainingTimeout = Math.max(1000, timeoutMs - (Date.now() - startTime));
      await writeToSerialPort(path, buffer, remainingTimeout);
      return;
    } catch (err) {
      lastError = err;
      const remainingTime = timeoutMs - (Date.now() - startTime);
      if (remainingTime <= 300) break;
      await new Promise((resolve) => setTimeout(resolve, Math.min(retryIntervalMs, remainingTime)));
    }
  }

  throw new Error(
    `Gagal mencetak ke ${path} via SerialPort setelah ${timeoutMs}ms (${lastError?.message || "Port serial tidak dapat diakses"}).`
  );
}

/**
 * Eksekusi print dengan timeout PRINTER_TIMEOUT_MS (dari .env).
 * - Interface local/COM (path file, mis. "\\.\COM3"): tulis buffer menggunakan package 'serialport'
 *   dengan retry loop yang dikontrol timeout .env.
 * - Interface lain (tcp:// atau printer:): tetap memakai library, tapi dibungkus
 *   withTimeout agar PRINTER_TIMEOUT_MS berlaku konsisten.
 */
async function executeWithTimeout(printer, timeoutMs) {
  const iface = printer.Interface;

  if (iface && typeof iface.path === "string") {
    return writeToSerialPortWithRetry(iface.path, printer.getBuffer(), timeoutMs, 300);
  }

  return withTimeout(printer.execute(), timeoutMs, `Printer tidak merespons dalam ${timeoutMs}ms.`);
}

/**
 * Cetak struk ke printer.
 * Tidak ada pre-check isPrinterConnected() di sini: untuk COM/Bluetooth cek
 * tersebut hanya fs.existsSync (apakah port terlihat di Windows / tidak) dan
 * bisa false-negative. Print langsung dicoba; kegagalan ditentukan berdasarkan
 * error/timeout dari proses print itu sendiri.
 * Throws pada kegagalan — tidak pernah crash server.
 */
export async function printReceipt(payload) {
  const width = charWidthFor();
  const printer = buildPrinter(width);

  const lines = renderReceiptLines(payload, width);

  printer.clear();
  let currentAlign = "left";
  printer.alignLeft();

  lines.forEach((item) => {
    const align = typeof item === "object" && item?.align ? item.align : "left";
    const text = typeof item === "object" ? item?.text ?? "" : String(item);

    if (align !== currentAlign) {
      if (align === "center") {
        printer.alignCenter();
      } else {
        printer.alignLeft();
      }
      currentAlign = align;
    }
    printer.println(text);
  });

  printer.alignLeft();
  printer.newLine();
  printer.cut();

  const result = await executeWithTimeout(printer, PRINTER_TIMEOUT_MS);
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