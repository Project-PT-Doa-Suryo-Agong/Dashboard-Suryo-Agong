import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { RowInput } from "jspdf-autotable";

type Align = "left" | "center" | "right";

export type PDFReportConfig = {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: RowInput[];
  fileName?: string;
  orientation?: "portrait" | "landscape";
  columnStyles?: Record<number, { cellWidth?: number; halign?: Align }>;
  summary?: { label: string; value: string }[];
  footNotes?: string[];
  startY?: number;
  letterheadImage?: string;
  /** Gambar background full-page (A4 penuh). Jika disediakan, gambar ditempatkan
   *  di belakang seluruh konten pada SETIAP halaman PDF. */
  fullPageBackground?: string;
};

const NAVY: [number, number, number] = [27, 54, 93];
const DARK_GRAY: [number, number, number] = [60, 60, 60];
const MEDIUM_GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const BORDER_GRAY: [number, number, number] = [200, 200, 200];
const TEXT_COLOR: [number, number, number] = [50, 50, 50];

const COMPANY_NAME = "PT Doa Suryo Agong";

const KOP_SURAT_SRC = "/Kop%20Surat%20DSA.png";
const KOP_SURAT_BAND = 440 / 3508;
const KOP_SURAT_HEIGHT_MM = 37.2;

let kopSuratDataUrlPromise: Promise<string> | null = null;

export function getKopSuratDataUrl(): Promise<string> {
  if (!kopSuratDataUrlPromise) {
    kopSuratDataUrlPromise = loadKopSuratDataUrl();
  }
  return kopSuratDataUrlPromise;
}async function loadKopSuratDataUrl(): Promise<string> {
  const response = await fetch(KOP_SURAT_SRC);
  if (!response.ok) {
    throw new Error(`Kop surat tidak dapat dimuat (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Kop surat gagal dimuat."));
      el.src = objectUrl;
    });
    const bandHeight = Math.max(1, Math.round(image.naturalHeight * KOP_SURAT_BAND));
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = bandHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas tidak didukung.");
    }
    ctx.drawImage(image, 0, 0, image.naturalWidth, bandHeight, 0, 0, image.naturalWidth, bandHeight);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

let kopSuratFullPageDataUrlPromise: Promise<string> | null = null;

/** Data URL PNG dari template A4 PENUH (2481×3508, tidak dicrop).
 *  Sumber yang sama dengan background HTML (public/Kop Surat DSA.png). */
export function getKopSuratFullPageDataUrl(): Promise<string> {
  if (!kopSuratFullPageDataUrlPromise) {
    kopSuratFullPageDataUrlPromise = loadKopSuratFullPageDataUrl();
  }
  return kopSuratFullPageDataUrlPromise;
}

async function loadKopSuratFullPageDataUrl(): Promise<string> {
  const response = await fetch(KOP_SURAT_SRC);
  if (!response.ok) {
    throw new Error(`Kop surat tidak dapat dimuat (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Kop surat gagal dimuat."));
      el.src = objectUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas tidak didukung.");
    }
    ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatDateID(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

type AutoTableResult = { finalY: number };

function getLastAutoTableFinalY(doc: jsPDF): number {
  const table = (doc as unknown as { lastAutoTable?: AutoTableResult | false }).lastAutoTable;
  return table && typeof table !== "boolean" ? table.finalY : 0;
}

export function exportToPDF(config: PDFReportConfig) {
  const {
    title,
    subtitle,
    headers,
    rows,
    fileName = "Laporan_PT_Doa_Suryo_Agong.pdf",
    orientation = "portrait",
    columnStyles,
    summary,
    footNotes,
    letterheadImage,
    fullPageBackground,
  } = config;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // ── Background full-page A4 (SEBELUM semua konten, di setiap halaman) ──
  const hasFullPageBackground = Boolean(fullPageBackground);
  const drawFullPageBackground = () => {
    if (fullPageBackground) {
      doc.addImage(fullPageBackground, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
    }
  };
  if (hasFullPageBackground) {
    drawFullPageBackground();
  }

  // ── Kop Surat (opsional) ──
  if (letterheadImage) {
    doc.addImage(letterheadImage, "PNG", 0, 0, pageWidth, KOP_SURAT_HEIGHT_MM, undefined, "FAST");
  }

  const hasKopSurat = Boolean(letterheadImage || fullPageBackground);

  // ── Header ──
  if (!hasKopSurat) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...NAVY);
    doc.text(COMPANY_NAME, marginX, 20);

    if (subtitle) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...DARK_GRAY);
      doc.text(subtitle, marginX, 27);
    }
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...MEDIUM_GRAY);
  const dateY = hasKopSurat ? KOP_SURAT_HEIGHT_MM + 9 : 20;
  doc.text(`Tanggal Cetak: ${formatDateID()}`, pageWidth - marginX, dateY, { align: "right" });

  // ── Divider ──
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  const dividerY = hasKopSurat ? KOP_SURAT_HEIGHT_MM + 4 : subtitle ? 32 : 27;
  doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

  // ── Title line above table ──
  const tableStartY = config.startY ?? dividerY + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text(title, marginX, tableStartY);

  // ── Table ──
  autoTable(doc, {
    startY: tableStartY + 4,
    head: [headers],
    body: rows,
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: BORDER_GRAY,
      lineWidth: 0.2,
      textColor: TEXT_COLOR,
      font: "helvetica",
    },
    headStyles: {
      fillColor: NAVY,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    bodyStyles: {
      minCellHeight: 8,
      // Baris transparan agar watermark pada template tetap terlihat.
      fillColor: hasFullPageBackground ? false : undefined,
    },
    alternateRowStyles: {
      fillColor: hasFullPageBackground ? false : [249, 249, 249],
    },
    columnStyles: columnStyles ?? {},
    margin: { left: marginX, right: marginX },
    willDrawPage: (hookData) => {
      // Dipanggil setelah halaman baru dibuat dan SEBELUM konten halaman digambar,
      // sehingga background template ada di SETIAP halaman.
      if (fullPageBackground) {
        hookData.doc.addImage(fullPageBackground, "PNG", 0, 0, pageWidth, pageHeight, undefined, "FAST");
      }
    },
  });

  let finalY = getLastAutoTableFinalY(doc);

  // ── Summary block ──
  if (summary && summary.length > 0) {
    finalY += 6;
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.3);
    doc.line(marginX, finalY, pageWidth - marginX, finalY);
    finalY += 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...NAVY);
    doc.text("Ringkasan:", marginX, finalY);
    finalY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_GRAY);
    for (const item of summary) {
      doc.text(`${item.label}: ${item.value}`, marginX, finalY);
      finalY += 5;
    }
  }

  // ── Foot notes ──
  if (footNotes && footNotes.length > 0) {
    finalY = Math.max(finalY + 8, getLastAutoTableFinalY(doc) + 15);
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.4);
    doc.line(marginX, finalY, pageWidth - marginX, finalY);
    finalY += 4;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(...LIGHT_GRAY);
    for (const note of footNotes) {
      doc.text(note, marginX, finalY);
      finalY += 3.5;
    }
  }

  doc.save(fileName);
}
