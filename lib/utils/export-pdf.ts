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
};

const NAVY: [number, number, number] = [27, 54, 93];
const DARK_GRAY: [number, number, number] = [60, 60, 60];
const MEDIUM_GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [150, 150, 150];
const BORDER_GRAY: [number, number, number] = [200, 200, 200];
const TEXT_COLOR: [number, number, number] = [50, 50, 50];

const COMPANY_NAME = "PT Doa Suryo Agong";

function formatDateID(): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
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
  } = config;

  const doc = new jsPDF({ orientation, unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  // ── Header ──
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

  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...MEDIUM_GRAY);
  doc.text(`Tanggal Cetak: ${formatDateID()}`, pageWidth - marginX, 20, { align: "right" });

  // ── Divider ──
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.8);
  const dividerY = subtitle ? 32 : 27;
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
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249],
    },
    columnStyles: columnStyles ?? {},
    margin: { left: marginX, right: marginX },
  });

  let finalY = (doc as any).lastAutoTable.finalY;

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
    finalY = Math.max(finalY + 8, (doc as any).lastAutoTable.finalY + 15);
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
