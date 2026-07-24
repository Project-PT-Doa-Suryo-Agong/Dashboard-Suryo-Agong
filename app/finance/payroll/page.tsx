"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { Edit, PlusCircle, Search, Trash2, FileSpreadsheet, FileText, Eye, Printer, Send, ChevronDown } from "lucide-react";
import { exportToPDF } from "@/lib/utils/export-pdf";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MCOA, MKaryawan, TPayrollHistory, TUtangPiutang } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { jsPDF } from "jspdf";
import DropdownMenu from "@/components/ui/DropdownMenu";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type TPayrollHistoryWithCoa = TPayrollHistory & {
  m_coa?: { kode_akun: string; nama_akun: string } | null;
};
import { RowActions, EditButton, DetailButton, DeleteButton, DownloadButton } from "@/components/ui/RowActions";

type EmployeeOption = {
  id: string;
  nama: string;
  nip: string | null;
  posisi: string | null;
  divisi: string | null;
  gaji_pokok: number | null;
};

type PayrollListPayload = {
  payroll: TPayrollHistory[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type PayrollPayload = {
  payroll: TPayrollHistory | null;
};

type CoaListPayload = {
  coa: MCOA[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type EmployeesListPayload = {
  karyawan: MKaryawan[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPeriod(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function toDateInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const REPORT_CONFIG = {
  companyName: "PT Doa Suryo Agong",
  title: "Slip Gaji - PT Doa Suryo Agong",
  headers: ["Periode", "Nama Karyawan", "Total Gaji", "Tanggal Eksekusi"],
} as const;

function prepareReportRows(
  data: TPayrollHistoryWithCoa[],
  employeeLookup: Record<string, string>,
): string[][] {
  return data.map((item) => [
    item.bulan ? formatPeriod(item.bulan) : "-",
    employeeLookup[item.employee_id ?? ""] ?? "Karyawan tidak ditemukan",
    formatRupiah(item.total ?? 0),
    item.created_at ? formatDate(item.created_at) : "-",
  ]);
}

export default function FinancePayrollPage() {
  const [items, setItems] = useState<TPayrollHistoryWithCoa[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [coaOptions, setCoaOptions] = useState<MCOA[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TPayrollHistory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<{
    employee_id: string;
    coa_id: string | null;
    bulan: string;
    total: string;
  }>({
    employee_id: "",
    coa_id: "654d8b38-ac1e-4db9-bcba-93fe87a6efa4",
    bulan: "",
    total: "",
  });

  const fetchPayroll = async () => {
    try {
      const response = await apiFetch("/api/finance/payroll?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<PayrollListPayload>(response);
      setItems(payload.data.payroll ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data payroll.";
      alert(message);
    }
  };

  const fetchCoa = async () => {
    try {
      const response = await apiFetch("/api/finance/coa?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<CoaListPayload>(response);
      setCoaOptions(payload.data.coa ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat daftar COA.";
      alert(message);
    }
  };

  const fetchKaryawan = async () => {
    try {
      const response = await apiFetch("/api/hr/employees?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<EmployeesListPayload>(response);
      const options = (payload.data.karyawan ?? []).map((employee) => ({
        id: employee.id,
        nama: employee.nama,
        nip: employee.nip,
        posisi: employee.posisi,
        divisi: employee.divisi,
        gaji_pokok: employee.gaji_pokok,
      }));
      setEmployees(options);
      setFormData((prev) => ({
        ...prev,
        employee_id: prev.employee_id || options[0]?.id || "",
        total:
          prev.total ||
          (options[0]?.gaji_pokok != null && options[0].gaji_pokok > 0
            ? String(options[0].gaji_pokok)
            : ""),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat daftar karyawan.";
      alert(message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPayroll(), fetchKaryawan(), fetchCoa()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee.nama])) as Record<string, string>,
    [employees],
  );

  const employeeSalaryById = useMemo(
    () =>
      Object.fromEntries(
        employees.map((employee) => [employee.id, employee.gaji_pokok]),
      ) as Record<string, number | null>,
    [employees],
  );

  const employeeDataById = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e])) as Record<string, EmployeeOption>,
    [employees],
  );

  const [kasbonInfo, setKasbonInfo] = useState<{ totalKasbon: number; count: number } | null>(null);

  const fetchKasbonByEmployee = async (employeeId: string) => {
    try {
      const response = await apiFetch(`/api/finance/utang-piutang?page=1&limit=50&tipe=kasbon&employee_id=${employeeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await parseJsonResponse<{ utang_piutang: TUtangPiutang[] }>(response);
      const kasbonList = payload.data.utang_piutang ?? [];
      if (kasbonList.length > 0) {
        const total = kasbonList.reduce((sum, k) => sum + Number(k.nominal), 0);
        setKasbonInfo({ totalKasbon: total, count: kasbonList.length });
      } else {
        setKasbonInfo(null);
      }
    } catch {
      setKasbonInfo(null);
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const baseSalary = employeeSalaryById[employeeId];

    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      total: baseSalary != null && baseSalary > 0 ? String(baseSalary) : "",
    }));

    setKasbonInfo(null);
    if (employeeId) {
      void fetchKasbonByEmployee(employeeId);
    }
  };

  const totalPayroll = useMemo(
    () => items.reduce((sum, item) => sum + (item.total ?? 0), 0),
    [items],
  );

  const filteredPayroll = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) =>
      (employeeById[item.employee_id ?? ""] ?? "").toLowerCase().includes(keyword),
    );
  }, [items, searchTerm, employeeById]);

  const reportRows = useMemo(
    () => prepareReportRows(filteredPayroll, employeeById),
    [filteredPayroll, employeeById],
  );

  const resetForm = () => {
    const defaultEmployee = employees[0];
    setFormData({
      employee_id: defaultEmployee?.id ?? "",
      coa_id: "654d8b38-ac1e-4db9-bcba-93fe87a6efa4",
      bulan: "",
      total:
        defaultEmployee?.gaji_pokok != null && defaultEmployee.gaji_pokok > 0
          ? String(defaultEmployee.gaji_pokok)
          : "",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TPayrollHistory) => {
    setEditData(item);
    setFormData({
      employee_id: item.employee_id ?? "",
      coa_id: item.coa_id ?? null,
      bulan: toDateInput(item.bulan),
      total: String(item.total ?? ""),
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedTotal = Number(formData.total);
    if (!formData.employee_id) {
      alert("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (!formData.bulan) {
      alert("Periode bulan wajib diisi.");
      return;
    }
    if (Number.isNaN(parsedTotal) || parsedTotal <= 0) {
      alert("Total gaji harus berupa angka lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        coa_id: formData.coa_id,
        bulan: formData.bulan,
        total: parsedTotal,
      };

      if (editData) {
        const identifier = `${editData.employee_id}_${toDateInput(editData.bulan)}`;
        const response = await apiFetch(`/api/finance/payroll/${identifier}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<PayrollPayload>(response);
      } else {
        const response = await apiFetch("/api/finance/payroll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<PayrollPayload>(response);
      }

      await fetchPayroll();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan payroll gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/payroll/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchPayroll();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus payroll.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: REPORT_CONFIG.title,
      headers: REPORT_CONFIG.headers,
      rows: reportRows,
      fileName: "Slip_Gaji_PT_Doa_Suryo_Agong.pdf",
    });
  };

  const handleExportExcel = async () => {
    if (filteredPayroll.length === 0) {
      alert("Tidak ada data payroll untuk diekspor.");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Payroll");

    worksheet.mergeCells("A1:D1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "PT Doa Suryo Agong";
    titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1B365D" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:D2");
    const subCell = worksheet.getCell("A2");
    subCell.value = "Laporan Payroll";
    subCell.font = { name: "Arial", size: 12 };
    subCell.alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A3:D3");
    const dateCell = worksheet.getCell("A3");
    dateCell.value = `Tanggal Cetak: ${new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}`;
    dateCell.font = { name: "Arial", size: 10, italic: true };
    dateCell.alignment = { vertical: "middle", horizontal: "center" };

    const headerRow = worksheet.getRow(5);
    headerRow.values = ["Periode", "Nama Karyawan", "Total Gaji", "Tanggal Eksekusi"];
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

    filteredPayroll.forEach((item, index) => {
      const row = worksheet.getRow(6 + index);
      const employeeName = employeeById[item.employee_id ?? ""] ?? "Karyawan tidak ditemukan";
      row.values = [
        item.bulan ? formatPeriod(item.bulan) : "-",
        employeeName,
        item.total ?? 0,
        item.created_at ? formatDate(item.created_at) : "-",
      ];

      const isEven = index % 2 === 0;
      row.eachCell((cell, colNumber) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isEven ? "FFFFFFFF" : "FFF9F9F9" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD3D3D3" } },
          left: { style: "thin", color: { argb: "FFD3D3D3" } },
          bottom: { style: "thin", color: { argb: "FFD3D3D3" } },
          right: { style: "thin", color: { argb: "FFD3D3D3" } },
        };
        cell.alignment = { vertical: "middle", horizontal: colNumber === 3 ? "right" : "left" };
        if (colNumber === 3) {
          cell.numFmt = '"Rp" #,##0';
        }
      });
    });

    worksheet.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: true }, (cell) => {
        if (cell.value) maxLen = Math.max(maxLen, String(cell.value).length);
      });
      col.width = maxLen + 3;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Payroll_PT_Doa_Suryo_Agong_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handlePrint = () => {
    const el = reportRef.current;
    if (!el) return;

    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = "static";
    clone.style.left = "auto";
    clone.style.top = "auto";
    clone.style.margin = "0 auto";
    clone.style.background = "#fff";
    clone.querySelectorAll(".no-print").forEach((n) => n.remove());
    clone.querySelectorAll("*").forEach((child) => {
      (child as HTMLElement).style.maxHeight = "none";
      (child as HTMLElement).style.overflow = "visible";
    });

    const styles = document.querySelectorAll("style, link[rel=\"stylesheet\"]");
    const stylesHTML = Array.from(styles).map((s) => s.outerHTML).join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.open();
    win.document.write(`<!DOCTYPE html><html><head><title>Print - Payroll</title>${stylesHTML}<style>body{padding:40px}@page{margin:15mm}</style></head><body>${clone.outerHTML}</body></html>`);
    win.document.close();

    win.onload = () => { win.focus(); win.print(); };
    win.onafterprint = () => win.close();
  };

  const handleExportSlipGaji = (item: TPayrollHistoryWithCoa) => {
    const employee = employeeDataById[item.employee_id ?? ""];
    const employeeName = employee?.nama ?? "Karyawan";
    const gajiPokok = employeeSalaryById[item.employee_id ?? ""] ?? 0;
    const totalDibayar = item.total ?? 0;
    const potongan = Math.max(gajiPokok - totalDibayar, 0);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const mx = 20;
    const contentW = pageW - mx * 2;

    // ── Header ──
    doc.setFillColor(27, 54, 93);
    doc.rect(0, 0, pageW, 38, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PT DOA SURYO AGONG", pageW / 2, 15, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Jl. Nglinggo, Gobang, Kec. Gondang, Kabupaten Nganjuk, Jawa Timur 64451", pageW / 2, 23, { align: "center" });
    doc.text("Email: ptdoasuryoagong@gmail.com", pageW / 2, 33, { align: "center" });

    // ── Title ──
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("SLIP GAJI KARYAWAN", pageW / 2, 50, { align: "center" });

    // ── Separator ──
    doc.setDrawColor(27, 54, 93);
    doc.setLineWidth(0.6);
    doc.line(mx, 54, pageW - mx, 54);

    // ── Employee Info ──
    const info: [string, string][] = [
      ["NIP", employee?.nip ?? "-"],
      ["Nama Karyawan", employeeName],
      ["Jabatan", employee?.posisi ?? "-"],
      ["Divisi", employee?.divisi ?? "-"],
      ["Periode", item.bulan ? formatPeriod(item.bulan) : "-"],
      ["Tanggal Cetak", formatDate(new Date().toISOString())],
    ];

    doc.setFontSize(9);
    let iy = 63;
    for (const [label, value] of info) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text(label, mx, iy);
      doc.text(":", mx + 40, iy);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      doc.text(value, mx + 45, iy);
      iy += 6;
    }

    // ── Pendapatan Table ──
    iy += 4;
    const rowH = 7;
    doc.setFillColor(27, 54, 93);
    doc.rect(mx, iy, contentW, rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("PENDAPATAN", mx + 4, iy + 5);
    doc.text("JUMLAH", pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH;

    doc.setFillColor(248, 248, 248);
    doc.rect(mx, iy, contentW, rowH, "F");
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Gaji Pokok", mx + 4, iy + 5);
    doc.text(formatRupiah(gajiPokok), pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH;

    doc.setFillColor(235, 242, 255);
    doc.rect(mx, iy, contentW, rowH, "F");
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.text("Total Pendapatan", mx + 4, iy + 5);
    doc.text(formatRupiah(gajiPokok), pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH + 3;

    // ── Potongan Table ──
    doc.setFillColor(27, 54, 93);
    doc.rect(mx, iy, contentW, rowH, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("POTONGAN", mx + 4, iy + 5);
    doc.text("JUMLAH", pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH;

    if (potongan > 0) {
      doc.setFillColor(255, 242, 242);
      doc.rect(mx, iy, contentW, rowH, "F");
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Potongan Kasbon", mx + 4, iy + 5);
      doc.text(formatRupiah(potongan), pageW - mx - 4, iy + 5, { align: "right" });
      iy += rowH;
    } else {
      doc.setFillColor(248, 248, 248);
      doc.rect(mx, iy, contentW, rowH, "F");
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Tidak ada potongan", mx + 4, iy + 5);
      iy += rowH;
    }

    doc.setFillColor(255, 235, 235);
    doc.rect(mx, iy, contentW, rowH, "F");
    doc.setTextColor(180, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Total Potongan", mx + 4, iy + 5);
    doc.text(formatRupiah(potongan), pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH + 3;

    // ── Grand Total ──
    doc.setFillColor(230, 240, 255);
    doc.rect(mx, iy, contentW, rowH + 2, "F");
    doc.setDrawColor(27, 54, 93);
    doc.setLineWidth(0.5);
    doc.line(mx, iy, pageW - mx, iy);
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL DITERIMA", mx + 4, iy + 6);
    doc.text(formatRupiah(totalDibayar), pageW - mx - 4, iy + 6, { align: "right" });
    iy += rowH + 6;

    // ── Tanda Tangan ──
    const ttdY = Math.max(iy + 8, 210);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(mx, ttdY, pageW - mx, ttdY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Nganjuk, " + formatDate(new Date().toISOString()), pageW - mx - 4, ttdY + 6, { align: "right" });
    doc.text("Finance & Administration", pageW - mx - 4, ttdY + 12, { align: "right" });
    doc.text("( _______________________ )", pageW - mx - 4, ttdY + 24, { align: "right" });

    // ── Footer ──
    const ftY = 278;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(mx, ftY, pageW - mx, ftY);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text("Slip gaji ini sah dan diterbitkan oleh sistem perusahaan. Data bersifat rahasia dan hanya untuk kepentingan internal.", pageW / 2, ftY + 5, { align: "center" });

    doc.save(`Slip_Gaji_${employeeName.replace(/\s+/g, "_")}_${(item.bulan ?? "unknown").substring(0, 7)}.pdf`);
  };

  const renderPayrollTable = (showActions: boolean) => {
    return (
      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="w-full min-w-max text-left">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Periode</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">COA</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Karyawan</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Total Gaji</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal Eksekusi</th>
              {showActions && (
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr key="loading-row">
                <td colSpan={showActions ? 6 : 5} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : filteredPayroll.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={showActions ? 6 : 5} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                  Karyawan tidak ditemukan.
                </td>
              </tr>
            ) : (
              filteredPayroll.map((item, index) => {
                const employeeName = employeeById[item.employee_id ?? ""] ?? "Karyawan tidak ditemukan";
                const rowKey =
                  item.id ??
                  `${item.employee_id ?? "unknown"}-${item.bulan ?? "no-period"}-${item.created_at ?? "no-date"}-${index}`;
                return (
                  <tr key={rowKey} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.bulan ? formatPeriod(item.bulan) : "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.m_coa ? `${item.m_coa.kode_akun} - ${item.m_coa.nama_akun}` : "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{employeeName}</td>
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-slate-900 whitespace-nowrap">{formatRupiah(item.total ?? 0)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    {showActions && (
                      <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                        <RowActions>
                          <DownloadButton onClick={() => handleExportSlipGaji(item)} label="Slip" />
                          <EditButton onClick={() => openEditModal(item)} disabled={isSubmitting} />
                          <DeleteButton onClick={() => openDeleteModal(`${item.employee_id}_${toDateInput(item.bulan)}`)} disabled={isSubmitting} />
                        </RowActions>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const NAVY = "bg-[#1B365D]";

  type PayrollReportProps = {
    config: typeof REPORT_CONFIG;
    rows: string[][];
    total: string;
  };

  function PayrollReport({ config, rows, total }: PayrollReportProps) {
    const today = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());

    return (
      <div className="text-sm">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-bold text-[#1B365D]">{config.companyName}</h2>
          <p className="text-[10px] italic text-slate-400">Tanggal Cetak: {today}</p>
        </div>
        <hr className="border-[#1B365D] border-t-2 mb-3" />
        <h3 className="text-sm font-bold text-[#1B365D] mb-3">{config.title}</h3>

        <table className="w-full border-collapse">
          <thead>
            <tr className={`${NAVY} text-white`}>
              {config.headers.map((header, i) => (
                <th
                  key={header}
                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-center ${i === config.headers.length - 1 ? "text-right" : ""}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={config.headers.length} className="px-3 py-8 text-center text-slate-500">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-[#F9F9F9]"}>
                  {row.map((cell, i) => (
                    <td
                      key={i}
                      className={`px-3 py-2 text-xs border-b border-[#E5E7EB] ${i === row.length - 1 ? "text-right font-semibold" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <hr className="border-[#1B365D] border-t mt-3 mb-2" />
        <div className="flex justify-end text-xs font-bold text-[#1B365D] py-1">
          <span className="mr-8">Total Pengeluaran Gaji: {total}</span>
        </div>
        <hr className="border-[#1B365D] border-t mb-4" />

        <p className="text-[9px] italic text-slate-400 text-center">
          Laporan ini sah dan diterbitkan oleh sistem perusahaan. Data bersifat rahasia dan hanya untuk kepentingan internal.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Riwayat Penggajian (Payroll)</h1>
        <p className="text-sm md:text-base text-slate-300">Laporan distribusi gaji karyawan per periode.</p>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran Gaji</p>
          <p className="mt-2 text-xl md:text-3xl font-bold text-blue-900 break-all">{formatRupiah(totalPayroll)}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
              >
                Output
                <ChevronDown size={16} />
              </button>
            }
            items={[
              {
                label: "Open in Excel",
                onClick: handleExportExcel,
                icon: <FileSpreadsheet size={16} />,
              },
              {
                label: "PDF",
                onClick: handleExportPDF,
                icon: <FileText size={16} />,
              },
              {
                label: "Send To",
                onClick: () => {},
                icon: <Send size={16} />,
                disabled: true,
              },
              {
                label: "Preview",
                onClick: handlePreview,
                icon: <Eye size={16} />,
              },
              {
                label: "Print",
                onClick: handlePrint,
                icon: <Printer size={16} />,
              },
            ]}
          />
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            <PlusCircle size={18} />
            Tambah Payroll
          </button>
        </div>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari nama karyawan..."
            className="relative w-full md:max-w-md"
          />
        </div>

        {renderPayrollTable(true)}
      </section>

      <div className="fixed left-[-99999px] top-0" style={{ width: "210mm", background: "#fff", zIndex: -1 }} ref={reportRef}>
        <div className="p-8">
          <PayrollReport config={REPORT_CONFIG} rows={reportRows} total={formatRupiah(totalPayroll)} />
        </div>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Payroll" : "Tambah Payroll"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Karyawan</label>
            <select
              required
              value={formData.employee_id}
              onChange={(event) => handleEmployeeChange(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            >
              <option value="" disabled>
                Pilih karyawan
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">COA</label>
            <select
              value={formData.coa_id ?? ""}
              onChange={(event) => setFormData((prev) => ({ ...prev, coa_id: event.target.value || null }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            >
              <option value="">-- Pilih COA (opsional) --</option>
              {coaOptions.map((coa) => (
                <option key={coa.id} value={coa.id}>
                  {coa.kode_akun} - {coa.nama_akun}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal Payroll</label>
            <input
              required
              type="date"
              value={formData.bulan}
              onChange={(event) => setFormData((prev) => ({ ...prev, bulan: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nominal Gaji Pokok</label>
            <input
              required
              type="number"
              min={1}
              value={formData.total}
              onChange={(event) => setFormData((prev) => ({ ...prev, total: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              placeholder="Terisi otomatis dari data karyawan"
            />
          </div>

          {kasbonInfo && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Potongan Kasbon Aktif</p>
              <p className="text-sm text-amber-800">
                {kasbonInfo.count} kasbon aktif — Total: {formatRupiah(kasbonInfo.totalKasbon)}
              </p>
              <p className="text-xs text-amber-600">
                Gaji setelah potongan: {formatRupiah(Math.max(Number(formData.total) - kasbonInfo.totalKasbon, 0))}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Payroll"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Payroll"
        description="Apakah Anda yakin ingin menghapus data payroll ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Preview Payroll"
        maxWidth="max-w-5xl"
      >
        <div className="p-6">
          <PayrollReport config={REPORT_CONFIG} rows={reportRows} total={formatRupiah(totalPayroll)} />
        </div>
      </Modal>
    </div>
  );
}
