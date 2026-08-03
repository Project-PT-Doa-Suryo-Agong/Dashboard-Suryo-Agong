import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export type ExcelReportConfig = {
  title: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  fileName: string;
  /** Kolom (1-indexed) yang diformat sebagai Rupiah. */
  moneyColumns?: number[];
  /** Perataan horizontal per kolom (1-indexed). Default: left. */
  columnAlign?: Record<number, "left" | "center" | "right">;
};

function columnLetter(index: number): string {
  let result = "";
  let n = index;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

export async function exportToExcel(config: ExcelReportConfig) {
  const { title, headers, rows, fileName, moneyColumns = [], columnAlign = {} } = config;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Laporan");

  const lastCol = columnLetter(headers.length);

  // 1. Header Dokumen
  worksheet.mergeCells(`A1:${lastCol}1`);
  const titleRow = worksheet.getCell("A1");
  titleRow.value = "PT Doa Suryo Agong";
  titleRow.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1B365D" } };
  titleRow.alignment = { vertical: "middle", horizontal: "center" };

  worksheet.mergeCells(`A2:${lastCol}2`);
  const subTitleRow = worksheet.getCell("A2");
  subTitleRow.value = title;
  subTitleRow.font = { name: "Arial", size: 12 };
  subTitleRow.alignment = { vertical: "middle", horizontal: "center" };

  worksheet.mergeCells(`A3:${lastCol}3`);
  const dateRow = worksheet.getCell("A3");
  const printDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
  dateRow.value = `Tanggal Cetak: ${printDate}`;
  dateRow.font = { name: "Arial", size: 10, italic: true };
  dateRow.alignment = { vertical: "middle", horizontal: "center" };

  // 2. Table Header (Row 5)
  const headerRow = worksheet.getRow(5);
  headerRow.values = headers;
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B365D" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD3D3D3" } },
      left: { style: "thin", color: { argb: "FFD3D3D3" } },
      bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
      right: { style: "thin", color: { argb: "FFD3D3D3" } },
    };
  });

  // 3. Data Rows
  rows.forEach((rowData, index) => {
    const row = worksheet.getRow(6 + index);
    row.values = rowData;

    const isEven = index % 2 === 0;
    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: isEven ? "FFFFFFFF" : "FFF9F9F9" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD3D3D3" } },
        left: { style: "thin", color: { argb: "FFD3D3D3" } },
        bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
        right: { style: "thin", color: { argb: "FFD3D3D3" } },
      };
      cell.alignment = { vertical: "middle", horizontal: columnAlign[colNumber] ?? "left" };
      if (moneyColumns.includes(colNumber)) {
        cell.numFmt = '"Rp" #,##0';
      }
    });
  });

  // 4. Auto-fit Width
  worksheet.columns.forEach((col) => {
    let maxLength = 10;
    col.eachCell?.({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 4) {
        const textLength = cell.value ? cell.value.toString().length : 0;
        if (textLength > maxLength) {
          maxLength = textLength;
        }
      }
    });
    col.width = maxLength + 3;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), fileName);
}
