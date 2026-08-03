import { test, expect, type Page } from "@playwright/test";
import {
  PDFDocument,
  PDFName,
  PDFDict,
  PDFStream,
  PDFNumber,
  PDFArray,
} from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Verifikasi rendering Payroll (kop surat full-page):
 * 1. Preview        - sheet A4 dengan background template
 * 2. Print          - popup print berisi sheet yang sama
 * 3. Slip PDF       - 1 halaman A4, background 2481x3508 embedded
 * 4. Export PDF     - tiap halaman memakai background template yang sama
 *
 * Test pertama (harness) berjalan TANPA login.
 * Test kedua butuh kredensial: PLAYWRIGHT_EMAIL & PLAYWRIGHT_PASSWORD.
 * Artefak disimpan di: test-results/payroll-render/
 */

const EMAIL = process.env.PLAYWRIGHT_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD;
const OUT_DIR = path.join(__dirname, "..", "..", "test-results", "payroll-render");

const TEMPLATE_PX = { width: 2481, height: 3508 };

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
});

async function login(page: Page) {
  await page.goto("/auth/login");
  await page.locator("#email").fill(EMAIL as string);
  await page.locator("#password").fill(PASSWORD as string);
  await page.getByRole("button", { name: /Login/i }).click();
  await page.waitForURL(/^\/(?!auth)/, { timeout: 15_000 });
}

async function openOutputMenu(page: Page) {
  await page.getByRole("button", { name: /Output/i }).first().click();
}

async function readPdf(filePath: string) {
  return PDFDocument.load(await fs.promises.readFile(filePath));
}

/** Ukuran gambar (Width/Height pada XObject /Image) di satu halaman PDF. */
async function getPageImageSizes(pdf: PDFDocument, pageIndex: number) {
  const sizes: { width: number; height: number }[] = [];
  const page = pdf.getPage(pageIndex);
  const resources = page.node.Resources();
  if (!resources) return sizes;
  const xObject = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
  if (!xObject) return sizes;
  for (const [, ref] of xObject.entries()) {
    const obj = pdf.context.lookup(ref);
    if (!(obj instanceof PDFStream)) continue;
    const widthObj = obj.dict.get(PDFName.of("Width"));
    const heightObj = obj.dict.get(PDFName.of("Height"));
    const width = widthObj instanceof PDFNumber ? widthObj.asNumber() : undefined;
    const height = heightObj instanceof PDFNumber ? heightObj.asNumber() : undefined;
    if (width && height) sizes.push({ width, height });
  }
  return sizes;
}

/** Isi content-stream halaman (sudah di-decode). */
function pageContents(pdf: PDFDocument, pageIndex: number): string {
  const page = pdf.getPage(pageIndex);
  const contents = page.node.Contents();
  let out = "";
  const decode = (stream: PDFStream) => new TextDecoder().decode(stream.getContents());
  if (contents instanceof PDFStream) out += decode(contents);
  else if (contents instanceof PDFArray) {
    for (const obj of contents.asArray()) {
      if (obj instanceof PDFStream) out += decode(obj);
    }
  }
  return out;
}

/** Apakah halaman menggambar background full-page (210x297 mm) pada posisi 0,0.
 *  jsPDF v4 menuliskan matriks dalam satuan points (595.28 x 841.89 pt = A4). */
function pagePaintsFullPageTemplate(pdf: PDFDocument, pageIndex: number): boolean {
  const content = pageContents(pdf, pageIndex);
  return (
    /\b210(\.0+)?\s+0\s+0\s+297(\.0+)?\s+[0-9.]+\s+[0-9.]+\s+cm\b/.test(content) ||
    /\b595\.\d+\s+0\s+0\s+841\.\d+\s+[0-9.]+\s+[0-9.]+\s+cm\b/.test(content)
  );
}

/** Apakah halaman menggambar fill CMYK (operator `k`). jsPDF menghasilkan
 *  "248. 248. 248. 130. k" saat setFillColor(r,g,b,a) 4-arg dipanggil — nilai
 *  > 1 di-clamp viewer menjadi hitam pekat. Harus TIDAK muncul di output. */
function pageHasCmykFill(pdf: PDFDocument, pageIndex: number): boolean {
  return /\d+\.\s+\d+\.\s+\d+\.\s+\d+\.\s+k\b/.test(pageContents(pdf, pageIndex));
}

const HARNESS_SCRIPT = String.raw`
const JsPDF = (window.jspdf && window.jspdf.jsPDF) ? window.jspdf.jsPDF : window.jsPDF;
if (!JsPDF) throw new Error("jsPDF tidak ditemukan");
const KOP_URL = "/Kop%20Surat%20DSA.png";
const TPL_W = 2481;
const TPL_H = 3508;

async function getKopSuratFullPageDataUrl() {
  const response = await fetch(KOP_URL);
  if (!response.ok) throw new Error("fetch gagal " + response.status);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise(function (resolve, reject) {
      const el = new Image();
      el.onload = function () { resolve(el); };
      el.onerror = function () { reject(new Error("image gagal dimuat")); };
      el.src = objectUrl;
    });
    if (image.naturalWidth !== TPL_W || image.naturalHeight !== TPL_H) {
      throw new Error("ukuran template salah: " + image.naturalWidth + "x" + image.naturalHeight);
    }
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d tidak didukung");
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatRupiah(value) {
  return "Rp " + value.toLocaleString("id-ID");
}

// Replikasi fillSlipRow() dari app (GState + RGB; tanpa setFillColor 4-arg yang
// dijsPDF diinterpretasikan sebagai CMYK dan bisa menghasilkan fill HITAM).
const SLIP_ROW_OPACITY = 0.85;
function fillSlipRow(doc, x, y, w, h, color, opacity) {
  opacity = opacity === undefined ? SLIP_ROW_OPACITY : opacity;
  if (opacity < 1) {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: opacity }));
  }
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, "F");
  if (opacity < 1) {
    doc.restoreGraphicsState();
  }
}

// Slip gaji individual (replikasi handleExportSlipGaji)
async function buildSlipPdf(fullPageBg) {
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const mx = 20;
  const contentW = pageW - mx * 2;

  doc.addImage(fullPageBg, "PNG", 0, 0, pageW, 297, undefined, "FAST");

  doc.setTextColor(27, 54, 93);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("SLIP GAJI KARYAWAN", pageW / 2, 47, { align: "center" });

  doc.setDrawColor(27, 54, 93);
  doc.setLineWidth(0.6);
  doc.line(mx, 51, pageW - mx, 51);

  const info = [
    ["NIP", "001"],
    ["Nama Karyawan", "HARUN TEST"],
    ["Jabatan", "Operator Produksi"],
    ["Divisi", "Produksi"],
    ["Periode", "Juli 2026"],
    ["Tanggal Cetak", "31 Juli 2026"],
  ];
  doc.setFontSize(9);
  let iy = 63;
  for (let i = 0; i < info.length; i++) {
    const label = info[i][0];
    const value = info[i][1];
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(label, mx, iy);
    doc.text(":", mx + 40, iy);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.text(value, mx + 45, iy);
    iy += 6;
  }

  iy += 4;
  const rowH = 7;
  const gajiPokok = 2500000;
  const potongan = 0;
  const totalDibayar = 2500000;

  doc.setFillColor(27, 54, 93);
  doc.rect(mx, iy, contentW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PENDAPATAN", mx + 4, iy + 5);
  doc.text("JUMLAH", pageW - mx - 4, iy + 5, { align: "right" });
  iy += rowH;

  doc.setTextColor(50, 50, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Gaji Pokok", mx + 4, iy + 5);
  doc.text(formatRupiah(gajiPokok), pageW - mx - 4, iy + 5, { align: "right" });
  iy += rowH;

  fillSlipRow(doc, mx, iy, contentW, rowH, [232, 240, 254]);
  doc.setTextColor(27, 54, 93);
  doc.setFont("helvetica", "bold");
  doc.text("Total Pendapatan", mx + 4, iy + 5);
  doc.text(formatRupiah(gajiPokok), pageW - mx - 4, iy + 5, { align: "right" });
  iy += rowH + 3;

  doc.setFillColor(27, 54, 93);
  doc.rect(mx, iy, contentW, rowH, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("POTONGAN", mx + 4, iy + 5);
  doc.text("JUMLAH", pageW - mx - 4, iy + 5, { align: "right" });
  iy += rowH;

  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text("Tidak ada potongan", mx + 4, iy + 5);
  iy += rowH;

  fillSlipRow(doc, mx, iy, contentW, rowH, [255, 232, 232]);
  doc.setTextColor(180, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Total Potongan", mx + 4, iy + 5);
  doc.text(formatRupiah(potongan), pageW - mx - 4, iy + 5, { align: "right" });
  iy += rowH + 3;

  fillSlipRow(doc, mx, iy, contentW, rowH + 2, [232, 240, 254]);
  doc.setDrawColor(27, 54, 93);
  doc.setLineWidth(0.5);
  doc.line(mx, iy, pageW - mx, iy);
  doc.setTextColor(27, 54, 93);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("TOTAL DITERIMA", mx + 4, iy + 6);
  doc.text(formatRupiah(totalDibayar), pageW - mx - 4, iy + 6, { align: "right" });
  iy += rowH + 6;

  const ttdY = Math.max(iy + 8, 210);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(mx, ttdY, pageW - mx, ttdY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Nganjuk, 31 Juli 2026", pageW - mx - 4, ttdY + 6, { align: "right" });
  doc.text("Finance & Administration", pageW - mx - 4, ttdY + 12, { align: "right" });
  doc.text("( _______________________ )", pageW - mx - 4, ttdY + 24, { align: "right" });

  return doc.output("arraybuffer");
}

// Export aggregate (replikasi exportToPDF + fullPageBackground)
function buildAggregatePdf(fullPageBg) {
  const doc = new JsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  doc.addImage(fullPageBg, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Tanggal Cetak: 31 Juli 2026", pageWidth - marginX, 46.2, { align: "right" });

  doc.setDrawColor(27, 54, 93);
  doc.setLineWidth(0.8);
  doc.line(marginX, 41.2, pageWidth - marginX, 41.2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(27, 54, 93);
  doc.text("Slip Gaji - PT Doa Suryo Agong", marginX, 47.2);

  const rows = [];
  for (let i = 0; i < 45; i++) {
    rows.push(["Juli 2026", "Karyawan Test " + i, "Rp " + (2500000 + i).toLocaleString("id-ID"), "31 Juli 2026"]);
  }

  doc.autoTable({
    startY: 51.2,
    head: [["Periode", "Nama Karyawan", "Total Gaji", "Tanggal Eksekusi"]],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      textColor: [50, 50, 50],
      font: "helvetica",
    },
    headStyles: {
      fillColor: [27, 54, 93],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: { minCellHeight: 8, fillColor: false },
    alternateRowStyles: { fillColor: false },
    margin: { left: marginX, right: marginX },
    willDrawPage: function (data) {
      data.doc.addImage(fullPageBg, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    },
  });

  return doc.output("arraybuffer");
}

const fullPageBg = await getKopSuratFullPageDataUrl();
const slipBuffer = await buildSlipPdf(fullPageBg);
const aggBuffer = buildAggregatePdf(fullPageBg);

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

return {
  slipBase64: bufferToBase64(slipBuffer),
  aggBase64: bufferToBase64(aggBuffer),
};
`;

test.describe("Payroll PDF pipeline (tanpa auth, jsPDF + template asli)", () => {
  test("slip 1 halaman & aggregate ber-template di tiap halaman", async ({ page }) => {
    await page.goto("/");
    await page.addScriptTag({
      path: path.join(__dirname, "..", "..", "node_modules", "jspdf", "dist", "jspdf.umd.min.js"),
    });
    await page.addScriptTag({
      path: path.join(
        __dirname,
        "..",
        "..",
        "node_modules",
        "jspdf-autotable",
        "dist",
        "jspdf.plugin.autotable.js",
      ),
    });

    const result = await page.evaluate<{ slipBase64: string; aggBase64: string }>(
      `(async () => { ${HARNESS_SCRIPT} })()`,
    );
    const slipBuffer = Buffer.from(result.slipBase64, "base64");
    const aggBuffer = Buffer.from(result.aggBase64, "base64");

    const slipPath = path.join(OUT_DIR, "3-slip-gaji-harness.pdf");
    const aggPath = path.join(OUT_DIR, "4-export-aggregate-harness.pdf");
    await fs.promises.writeFile(slipPath, slipBuffer);
    await fs.promises.writeFile(aggPath, aggBuffer);

    expect(slipBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");
    expect(aggBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");

    // Slip: 1 halaman, image full-page 2481x3508, digambar penuh di (0,0)
    const slipPdf = await readPdf(slipPath);
    expect(slipPdf.getPageCount()).toBe(1);
    expect(await getPageImageSizes(slipPdf, 0)).toContainEqual(TEMPLATE_PX);
    expect(pagePaintsFullPageTemplate(slipPdf, 0)).toBe(true);

    // Regression guard: tidak boleh ada fill CMYK (background hitam pada slip gaji)
    expect(pageHasCmykFill(slipPdf, 0), "slip memakai fill CMYK (background hitam)").toBe(false);

    // Aggregate: multi-halaman, template digambar di SETIAP halaman
    const aggPdf = await readPdf(aggPath);
    expect(aggPdf.getPageCount()).toBeGreaterThan(1);
    for (let i = 0; i < aggPdf.getPageCount(); i++) {
      expect(await getPageImageSizes(aggPdf, i), `halaman ${i + 1} tanpa image`).toContainEqual(TEMPLATE_PX);
      expect(pagePaintsFullPageTemplate(aggPdf, i), `halaman ${i + 1} tanpa paint full-page`).toBe(true);
      expect(pageHasCmykFill(aggPdf, i), `halaman ${i + 1} memakai fill CMYK (background hitam)`).toBe(false);
    }

    // Bukti visual best-effort: render PDF lewat viewer Chromium
    try {
      await page.setContent(
        `<iframe id="pdf-view" src="data:application/pdf;base64,${result.slipBase64}" style="width:900px;height:1273px;border:0"></iframe>`,
      );
      await page.waitForTimeout(3_000);
      await page.screenshot({ path: path.join(OUT_DIR, "3-slip-gaji-render.png") });
    } catch {
      console.warn("Render visual PDF di headless tidak tersedia; file PDF tersimpan di test-results.");
    }

    // ── Print (HTML): layer background position:fixed (diulang per halaman) ──
    // Catatan: Chromium TIDAK mengulang background-image CSS per halaman cetak;
    // elemen position:fixed justru DIULANG pada setiap halaman (mekanisme andal).
    const sheetStyle = `
      @page{size:A4;margin:0}
      html,body{margin:0;padding:0}
      *{box-sizing:border-box}
      .bg-fixed{
        position:fixed;top:0;left:0;width:210mm;height:297mm;z-index:0;
        background-image:url("/Kop%20Surat%20DSA.png");
        background-size:210mm 297mm;background-repeat:no-repeat;
      }
      .content{position:relative;z-index:1;padding:40mm 16mm 28mm;font-family:sans-serif}
      table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border-bottom:1px solid #ccc;padding:4px;text-align:left}
      th{background:#1B365D;color:#fff}
    `;

    // Short content -> harus TETAP 1 halaman (slip / konten pendek)
    const shortRows = new Array(5)
      .fill(null)
      .map((_, i) => `<tr><td>Periode ${i}</td><td>Karyawan ${i}</td><td>Rp 2.500.000</td></tr>`)
      .join("");
    await page.setContent(
      `<html><head><style>${sheetStyle}</style></head><body>
         <div class="bg-fixed"></div>
         <div class="content">
           <h3 style="color:#1B365D;margin-top:0">Slip Gaji - PT Doa Suryo Agong</h3>
           <table><thead><tr><th>Periode</th><th>Nama</th><th>Total</th></tr></thead>
           <tbody>${shortRows}</tbody></table>
         </div></body></html>`,
    );
    const shortPrint = await page.pdf({
      format: "A4",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
    });
    const shortPath = path.join(OUT_DIR, "2-print-short.pdf");
    await fs.promises.writeFile(shortPath, shortPrint);
    const shortPdf = await readPdf(shortPath);
    expect(shortPdf.getPageCount(), "konten pendek harus 1 halaman cetak").toBe(1);
    expect(await getPageImageSizes(shortPdf, 0), "halaman cetak tanpa background template").toContainEqual(
      { width: 2481, height: 3508 },
    );

    // Long content -> multi-halaman, SETIAP halaman cetak tetap ber-template penuh
    const longRows = new Array(60)
      .fill(null)
      .map((_, i) => `<tr><td>Periode ${i}</td><td>Karyawan ${i}</td><td>Rp 2.500.000</td></tr>`)
      .join("");
    await page.setContent(
      `<html><head><style>${sheetStyle}</style></head><body>
         <div class="bg-fixed"></div>
         <div class="content">
           <h3 style="color:#1B365D;margin-top:0">Slip Gaji - PT Doa Suryo Agong</h3>
           <table><thead><tr><th>Periode</th><th>Nama</th><th>Total</th></tr></thead>
           <tbody>${longRows}</tbody></table>
         </div></body></html>`,
    );
    const longPrint = await page.pdf({
      format: "A4",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      printBackground: true,
    });
    const longPath = path.join(OUT_DIR, "2-print-long.pdf");
    await fs.promises.writeFile(longPath, longPrint);
    const longPdf = await readPdf(longPath);
    expect(longPdf.getPageCount()).toBeGreaterThan(1);
    for (let i = 0; i < longPdf.getPageCount(); i++) {
      expect(
        await getPageImageSizes(longPdf, i),
        `halaman cetak ${i + 1} tanpa background template`,
      ).toContainEqual({ width: 2481, height: 3508 });
    }
  });
});

test.describe("Payroll render (kop surat full-page)", () => {
  test.skip(!EMAIL || !PASSWORD, "PLAYWRIGHT_EMAIL / PLAYWRIGHT_PASSWORD belum disetel.");

  test("keempat output konsisten dengan template A4", async ({ page }) => {
    await login(page);

    await page.goto("/finance/payroll");
    await expect(page.getByText("Riwayat Penggajian (Payroll)")).toBeVisible();
    // Tunggu data termuat (tabel atau state kosong)
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15_000 });

    // 1. PREVIEW
    await openOutputMenu(page);
    await page.getByRole("button", { name: /Preview/i }).click();

    const modalSheet = page
      .locator("div[style*='background-image']")
      .filter({ hasText: "Slip Gaji - PT Doa Suryo Agong" });
    await expect(modalSheet).toBeVisible();
    await expect(modalSheet).toHaveAttribute("style", /210mm 297mm/);
    await modalSheet.screenshot({ path: path.join(OUT_DIR, "1-preview.png") });
    await page.getByLabel("Close modal").click().catch(() => {});

    // 2. PRINT (popup)
    // Sumber cetak: sheet tersembunyi di halaman utama (di-clone ke popup).
    const hiddenSheet = page
      .locator("div[style*='background-image']")
      .filter({ hasText: "Slip Gaji - PT Doa Suryo Agong" })
      .first();
    await expect(hiddenSheet).toBeVisible();
    await expect(hiddenSheet).toHaveAttribute(
      "style",
      /background-image:url\("\/Kop%20Surat%20DSA\.png"\)/,
    );
    await expect(hiddenSheet).toHaveAttribute("style", /210mm 297mm/);

    await openOutputMenu(page);
    const popupPromise = page.waitForEvent("popup");
    await page.getByRole("button", { name: /Print/i }).click();
    const printPopup = await popupPromise;
    await printPopup.waitForLoadState("load", { timeout: 15_000 }).catch(() => {});

    // Bukti visual popup print (best-effort: window mungkin tertutup afterprint)
    try {
      const printSheet = printPopup
        .locator("div[style*='background-image']")
        .filter({ hasText: "Slip Gaji - PT Doa Suryo Agong" });
      await printSheet.waitFor({ state: "visible", timeout: 8_000 });
      await printSheet.screenshot({ path: path.join(OUT_DIR, "2-print-popup.png") });
    } catch {
      console.warn("Popup print tertutup sebelum screenshot diambil; sheet utama sudah diverifikasi.");
    }

    // 3. SLIP PDF INDIVIDUAL
    const slipButtons = page.getByRole("button", { name: /Slip/i });
    if ((await slipButtons.count()) === 0) {
      test.info().annotations.push({
        type: "skip",
        description: "Tidak ada data payroll; verifikasi PDF dilewati.",
      });
      return;
    }

    const slipDownloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await slipButtons.first().click();
    const slipDownload = await slipDownloadPromise;
    const slipPath = path.join(OUT_DIR, "3-slip-gaji.pdf");
    await slipDownload.saveAs(slipPath);

    const slipBuffer = await fs.promises.readFile(slipPath);
    expect(slipBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");

    const slipPdf = await readPdf(slipPath);
    expect(slipPdf.getPageCount()).toBe(1);
    const slipImages = await getPageImageSizes(slipPdf, 0);
    expect(slipImages).toContainEqual(TEMPLATE_PX);

    // 4. EXPORT PDF AGGREGATE
    await openOutputMenu(page);
    const aggDownloadPromise = page.waitForEvent("download", { timeout: 30_000 });
    await page.getByRole("button", { name: /^PDF$/i }).click();
    const aggDownload = await aggDownloadPromise;
    const aggPath = path.join(OUT_DIR, "4-export-aggregate.pdf");
    await aggDownload.saveAs(aggPath);

    const aggBuffer = await fs.promises.readFile(aggPath);
    expect(aggBuffer.subarray(0, 4).toString("latin1")).toBe("%PDF");

    const aggPdf = await readPdf(aggPath);
    const aggPageCount = aggPdf.getPageCount();
    expect(aggPageCount).toBeGreaterThanOrEqual(1);
    // Background template wajib ada di SETIAP halaman aggregate
    for (let i = 0; i < aggPageCount; i++) {
      const pageSizes = await getPageImageSizes(aggPdf, i);
      expect(pageSizes, `halaman ${i + 1} tanpa template full-page`).toContainEqual(TEMPLATE_PX);
    }
  });
});

