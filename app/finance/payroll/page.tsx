"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import { Edit, PlusCircle, Search, Trash2, FileSpreadsheet, FileText, Eye, Printer, Send, ChevronDown } from "lucide-react";
import { exportToPDF, getKopSuratFullPageDataUrl } from "@/lib/utils/export-pdf";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MCOA, MKaryawan, TPayrollHistory, TPayrollItem, TUtangPiutang } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { jsPDF, GState } from "jspdf";
import DropdownMenu from "@/components/ui/DropdownMenu";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  calculatePayroll,
  type PayrollCalculationResult,
  type PayrollKasbonInput,
  type PayrollManualItemInput,
} from "@/lib/services/payroll.service";
import {
  MANUAL_PAYROLL_COMPONENTS,
  PAYROLL_COMPONENT,
  PAYROLL_COMPONENT_LABEL,
  type PayrollComponentCode,
} from "@/lib/constants/payroll";

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
  tunjangan_tetap: number | null;
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

type PayrollDetailPayload = {
  payroll: TPayrollHistoryWithCoa | null;
  items: TPayrollItem[];
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

const NAVY = "bg-[#1B365D]";

/** Opacity default untuk baris slip gaji yang diberi background semi-transparan. */
const SLIP_ROW_OPACITY = 0.85;

/** Mengisi background satu baris slip gaji dengan warna RGB + opacity semi-transparan
 *  sehingga watermark template tetap terlihat. GState hanya dipakai saat opacity < 1
 *  (header solid tidak lewat sini). */
function fillSlipRow(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  color: [number, number, number],
  opacity: number = SLIP_ROW_OPACITY,
) {
  if (opacity < 1) {
    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity }));
  }
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, w, h, "F");
  if (opacity < 1) {
    doc.restoreGraphicsState();
  }
}

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
    <div
      className="text-sm payroll-sheet"
      style={{
        width: "210mm",
        minHeight: "297mm",
        position: "relative",
        boxSizing: "border-box",
        backgroundImage: "url(\"/Kop%20Surat%20DSA.png\")",
        backgroundSize: "210mm 297mm",
        backgroundRepeat: "repeat",
        backgroundPosition: "top left",
      }}
    >
      <div
        className="payroll-bg-fixed"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          width: "210mm",
          height: "297mm",
          backgroundImage: "url(\"/Kop%20Surat%20DSA.png\")",
          backgroundSize: "210mm 297mm",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div style={{ padding: "40mm 16mm 28mm", position: "relative" }}>
        <div className="flex items-end justify-between mb-2">
          <h3 className="text-sm font-bold text-[#1B365D]">{config.title}</h3>
          <p className="text-[10px] italic text-slate-400">Tanggal Cetak: {today}</p>
        </div>
        <hr className="border-[#1B365D] border-t mb-3" />

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
                <tr key={index} className={index % 2 === 0 ? "bg-transparent" : "bg-[rgba(249,249,249,0.6)]"}>
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
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: number;
  bold?: boolean;
  muted?: boolean;
}) {
  const mutedClass = muted ? "italic text-slate-400" : "";
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 ${bold ? "bg-slate-50" : ""}`}>
      <span className={`text-slate-600 ${bold ? "font-bold text-slate-900" : ""} ${mutedClass}`}>{label}</span>
      <span className={`font-semibold whitespace-nowrap ${bold ? "text-slate-900" : "text-slate-700"} ${mutedClass}`}>
        {formatRupiah(value)}
      </span>
    </div>
  );
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

  const [detailData, setDetailData] = useState<{ payroll: TPayrollHistoryWithCoa | null; items: TPayrollItem[] } | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [formData, setFormData] = useState<{
    employee_id: string;
    coa_id: string | null;
    bulan: string;
    total: string;
    bpjs_jht: string;
    bpjs_jp: string;
  }>({
    employee_id: "",
    coa_id: "654d8b38-ac1e-4db9-bcba-93fe87a6efa4",
    bulan: "",
    total: "",
    bpjs_jht: "",
    bpjs_jp: "",
  });

  const [manualItems, setManualItems] = useState<PayrollManualItemInput[]>([]);

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
        tunjangan_tetap: employee.tunjangan_tetap,
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

  const [kasbonInfo, setKasbonInfo] = useState<{
    totalKasbon: number;
    count: number;
    list: PayrollKasbonInput[];
  } | null>(null);

  const fetchKasbonByEmployee = async (employeeId: string) => {
    try {
      const response = await apiFetch(`/api/finance/utang-piutang?page=1&limit=50&tipe=kasbon&employee_id=${employeeId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const payload = await parseJsonResponse<{ utang_piutang: TUtangPiutang[] }>(response);
      // Hanya hitung kasbon yang BELUM LUNAS (kas === "tidak")
      // kas === "ya" berarti sudah lunas (di-map dari "kas tunai" oleh API)
      const kasbonList = (payload.data.utang_piutang ?? []).filter(
        (k) => k.kas === "tidak",
      );
      if (kasbonList.length > 0) {
        const total = kasbonList.reduce((sum, k) => sum + Number(k.nominal), 0);
        setKasbonInfo({
          totalKasbon: total,
          count: kasbonList.length,
          list: kasbonList.map((k) => ({ id: k.id, nominal: Number(k.nominal) })),
        });
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

  // ── Komponen manual (Tunjangan/Lembur/Bonus/Insentif/Potongan Manual) ──
  const hasManualItems = manualItems.length > 0;

  const addManualItem = () => {
    setManualItems((prev) => [
      ...prev,
      { kode_komponen: PAYROLL_COMPONENT.TUNJANGAN, jumlah: 0, nama_komponen: "" },
    ]);
  };

  const updateManualItem = (index: number, patch: Partial<PayrollManualItemInput>) => {
    setManualItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeManualItem = (index: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== index));
  };

  const validManualItems = useMemo(() => {
    return manualItems
      .filter((item) => {
        const jumlah = Number(item.jumlah);
        return !Number.isNaN(jumlah) && jumlah > 0;
      })
      .map((item) => ({
        kode_komponen: item.kode_komponen,
        jumlah: Math.floor(Number(item.jumlah)),
        nama_komponen: item.nama_komponen?.trim() || undefined,
      }));
  }, [manualItems]);

  // ── Ringkasan live (meniru logika API: `total` dipakai hanya tanpa items) ──
  const selectedEmployee = employeeDataById[formData.employee_id];

  const effectiveGajiPokok = useMemo(() => {
    const rawTotal = Number(formData.total);
    if (!hasManualItems && rawTotal > 0) return rawTotal;
    return selectedEmployee?.gaji_pokok ?? 0;
  }, [hasManualItems, formData.total, selectedEmployee]);

  const tunjanganTetapMaster = selectedEmployee?.tunjangan_tetap ?? 0;

  const tunjanganManual = useMemo(
    () =>
      manualItems.reduce((sum, item) => {
        if (item.kode_komponen !== PAYROLL_COMPONENT.TUNJANGAN) return sum;
        const jumlah = Number(item.jumlah);
        return sum + (Number.isNaN(jumlah) || jumlah <= 0 ? 0 : Math.floor(jumlah));
      }, 0),
    [manualItems],
  );

  const liveCalculation = useMemo<PayrollCalculationResult | null>(() => {
    if (!formData.employee_id) return null;
    const rawJht = formData.bpjs_jht.trim();
    const rawJp = formData.bpjs_jp.trim();
    const bpjsOverride = {
      jht: rawJht ? Number(rawJht) : undefined,
      jp: rawJp ? Number(rawJp) : undefined,
    };
    return calculatePayroll({
      gajiPokok: effectiveGajiPokok,
      tunjanganTetap: tunjanganTetapMaster,
      manualItems,
      kasbonList: kasbonInfo?.list ?? [],
      bpjsOverride,
    });
  }, [
    formData.employee_id,
    formData.bpjs_jht,
    formData.bpjs_jp,
    effectiveGajiPokok,
    tunjanganTetapMaster,
    manualItems,
    kasbonInfo,
  ]);

  const liveSummary = liveCalculation?.summary ?? null;

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
      bpjs_jht: "",
      bpjs_jp: "",
    });
    setManualItems([]);
    setKasbonInfo(null);
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    if (employees[0]?.id) {
      void fetchKasbonByEmployee(employees[0].id);
    }
    setIsFormModalOpen(true);
  };

  const openEditModal = async (item: TPayrollHistory) => {
    setEditData(item);
    setFormData({
      employee_id: item.employee_id ?? "",
      coa_id: item.coa_id ?? null,
      bulan: toDateInput(item.bulan),
      total: String(item.total ?? ""),
      bpjs_jht: item.bpjs_jht != null && item.bpjs_jht > 0 ? String(item.bpjs_jht) : "",
      bpjs_jp: item.bpjs_jp != null && item.bpjs_jp > 0 ? String(item.bpjs_jp) : "",
    });
    setKasbonInfo(null);

    // Muat komponen manual yang sudah tersimpan untuk prefill (tipe === "manual")
    setManualItems([]);
    try {
      const identifier = `${item.employee_id ?? ""}_${toDateInput(item.bulan)}`;
      const response = await apiFetch(`/api/finance/payroll/${identifier}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<PayrollDetailPayload>(response);
      const savedManual = (payload.data.items ?? []).filter((i) => i.tipe === "manual");
      if (savedManual.length > 0) {
        setManualItems(
          savedManual.map((i) => ({
            kode_komponen: i.kode_komponen as PayrollComponentCode,
            jumlah: Number(i.jumlah),
            nama_komponen: i.nama_komponen ?? "",
          })),
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat komponen payroll.";
      alert(message);
      return;
    }

    if (item.employee_id) {
      void fetchKasbonByEmployee(item.employee_id);
    }
    setIsFormModalOpen(true);
  };

  const fetchPayrollDetail = async (item: TPayrollHistoryWithCoa) => {
    const identifier = `${item.employee_id ?? ""}_${toDateInput(item.bulan)}`;
    try {
      const response = await apiFetch(`/api/finance/payroll/${identifier}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<PayrollDetailPayload>(response);
      setDetailData({ payroll: payload.data.payroll, items: payload.data.items ?? [] });
      setIsDetailOpen(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat detail payroll.";
      alert(message);
    }
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
    const parsedBpjsJht = formData.bpjs_jht.trim() ? Number(formData.bpjs_jht.trim()) : null;
    const parsedBpjsJp = formData.bpjs_jp.trim() ? Number(formData.bpjs_jp.trim()) : null;
    if (!formData.employee_id) {
      alert("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (!formData.bulan) {
      alert("Periode bulan wajib diisi.");
      return;
    }

    const hasInvalidManualItem = manualItems.some((item) => {
      const jumlah = Number(item.jumlah);
      return Number.isNaN(jumlah) || jumlah < 0;
    });
    if (hasInvalidManualItem) {
      alert("Nominal setiap komponen manual harus berupa angka >= 0.");
      return;
    }
    if (validManualItems.length === 0 && (Number.isNaN(parsedTotal) || parsedTotal <= 0)) {
      alert("Total gaji harus berupa angka lebih dari 0.");
      return;
    }
    if ((parsedBpjsJht !== null && (Number.isNaN(parsedBpjsJht) || parsedBpjsJht < 0)) ||
        (parsedBpjsJp !== null && (Number.isNaN(parsedBpjsJp) || parsedBpjsJp < 0))) {
      alert("BPJS JHT/JP harus berupa angka >= 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        coa_id: formData.coa_id,
        bulan: formData.bulan,
        ...(validManualItems.length > 0
          ? { items: validManualItems }
          : { total: parsedTotal }),
        ...(parsedBpjsJht !== null ? { bpjs_jht: parsedBpjsJht } : {}),
        ...(parsedBpjsJp !== null ? { bpjs_jp: parsedBpjsJp } : {}),
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

  const handleExportPDF = async () => {
    let fullPageBackground: string | undefined;
    try {
      fullPageBackground = await getKopSuratFullPageDataUrl();
    } catch {
      // Fallback ke PDF standar tanpa kop surat bila asset gagal dimuat.
    }
    exportToPDF({
      title: REPORT_CONFIG.title,
      headers: [...REPORT_CONFIG.headers],
      rows: reportRows,
      fileName: "Slip_Gaji_PT_Doa_Suryo_Agong.pdf",
      fullPageBackground,
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
    win.document.write(`<!DOCTYPE html><html><head><title>Print - Payroll</title>${stylesHTML}<link rel="preload" as="image" href="/Kop%20Surat%20DSA.png"><style>@page{size:A4;margin:0}html,body{margin:0;padding:0}body{background:#fff}.payroll-bg-fixed{display:block !important;position:fixed !important;top:0 !important;left:0 !important;width:210mm !important;height:297mm !important;background-image:url("/Kop%20Surat%20DSA.png") !important;background-size:210mm 297mm !important;background-repeat:no-repeat !important;z-index:0}.payroll-sheet{background-image:none !important;min-height:297mm}@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${clone.outerHTML}</body></html>`);
    win.document.close();

    const triggerPrint = () => {
      const image = win.document.createElement("img");
      image.src = "/Kop%20Surat%20DSA.png";
      image.onload = () => { win.focus(); win.print(); };
      image.onerror = () => { win.focus(); win.print(); };
    };
    win.onload = triggerPrint;
    win.onafterprint = () => win.close();
  };

  const handleExportSlipGaji = async (item: TPayrollHistoryWithCoa) => {
    const employee = employeeDataById[item.employee_id ?? ""];
    const employeeName = employee?.nama ?? "Karyawan";
    const gajiPokok = item.gaji_pokok ?? 0;
    const totalDibayar = item.gaji_bersih ?? item.total ?? 0;
    const potongan = item.potongan_kasbon ?? 0;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = 210;
    const mx = 20;
    const contentW = pageW - mx * 2;

    // ── Background full-page A4 (template 2481×3508, harus PALING BAWAH) ──
    let hasKopSurat = false;
    try {
      const kopSuratFullPage = await getKopSuratFullPageDataUrl();
      doc.addImage(kopSuratFullPage, "PNG", 0, 0, pageW, 297, undefined, "FAST");
      hasKopSurat = true;
    } catch {
      // Fallback ke header teks lama bila asset kop surat gagal dimuat.
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
    }

    // ── Title ──
    doc.setTextColor(27, 54, 93);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    const titleY = hasKopSurat ? 47 : 50;
    doc.text("SLIP GAJI KARYAWAN", pageW / 2, titleY, { align: "center" });

    // ── Separator ──
    doc.setDrawColor(27, 54, 93);
    doc.setLineWidth(0.6);
    const separatorY = hasKopSurat ? 51 : 54;
    doc.line(mx, separatorY, pageW - mx, separatorY);

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
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Potongan Kasbon", mx + 4, iy + 5);
      doc.text(formatRupiah(potongan), pageW - mx - 4, iy + 5, { align: "right" });
      iy += rowH;
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.text("Tidak ada potongan", mx + 4, iy + 5);
      iy += rowH;
    }

    fillSlipRow(doc, mx, iy, contentW, rowH, [255, 232, 232]);
    doc.setTextColor(180, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Total Potongan", mx + 4, iy + 5);
    doc.text(formatRupiah(potongan), pageW - mx - 4, iy + 5, { align: "right" });
    iy += rowH + 3;

    // ── Grand Total ──
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
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Gaji Pokok</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">BPJS JHT</th>
              <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">BPJS JP</th>
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
                <td colSpan={showActions ? 9 : 8} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : filteredPayroll.length === 0 ? (
              <tr key="empty-row">
                <td colSpan={showActions ? 9 : 8} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
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
                    <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-700 whitespace-nowrap">{formatRupiah(item.gaji_pokok ?? 0)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-600 whitespace-nowrap">{formatRupiah(item.bpjs_jht ?? 0)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-right text-slate-600 whitespace-nowrap">{formatRupiah(item.bpjs_jp ?? 0)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-slate-900 whitespace-nowrap">{formatRupiah(item.total ?? 0)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    {showActions && (
                      <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                        <RowActions>
                          <DetailButton onClick={() => fetchPayrollDetail(item)} label="Detail" />
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
        <PayrollReport config={REPORT_CONFIG} rows={reportRows} total={formatRupiah(totalPayroll)} />
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Payroll" : "Tambah Payroll"}
        maxWidth="max-w-2xl"
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
              disabled={hasManualItems}
              value={hasManualItems && selectedEmployee ? String(selectedEmployee.gaji_pokok ?? "") : formData.total}
              onChange={(event) => setFormData((prev) => ({ ...prev, total: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              placeholder="Terisi otomatis dari data karyawan"
            />
            {hasManualItems && (
              <p className="text-xs text-slate-400">
                Gaji pokok memakai nilai master karyawan saat komponen manual aktif.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">BPJS JHT (2%)</label>
              <input
                type="number"
                min={0}
                value={formData.bpjs_jht}
                onChange={(event) => setFormData((prev) => ({ ...prev, bpjs_jht: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                placeholder="Otomatis"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">BPJS JP (1%)</label>
              <input
                type="number"
                min={0}
                value={formData.bpjs_jp}
                onChange={(event) => setFormData((prev) => ({ ...prev, bpjs_jp: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                placeholder="Otomatis"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-slate-400">
            Kosongkan untuk memakai tarif otomatis; isi 0 untuk menonaktifkan potongan.
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Komponen Manual</p>
              <button
                type="button"
                onClick={addManualItem}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E3A8A] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-50"
              >
                <PlusCircle size={14} />
                Tambah Baris
              </button>
            </div>

            {manualItems.length === 0 ? (
              <p className="text-xs text-slate-400">
                Belum ada komponen manual. Tambahkan Tunjangan, Lembur, Bonus, Insentif, atau Potongan Manual per periode.
              </p>
            ) : (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-12 gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  <span className="col-span-3">Jenis Komponen</span>
                  <span className="col-span-5">Nama Komponen</span>
                  <span className="col-span-3">Nominal</span>
                  <span className="col-span-1" />
                </div>
                {manualItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <select
                      value={item.kode_komponen}
                      onChange={(event) =>
                        updateManualItem(index, { kode_komponen: event.target.value as PayrollComponentCode })
                      }
                      className="col-span-12 md:col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                    >
                      {MANUAL_PAYROLL_COMPONENTS.map((kode) => (
                        <option key={kode} value={kode}>
                          {PAYROLL_COMPONENT_LABEL[kode]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={item.nama_komponen ?? ""}
                      onChange={(event) => updateManualItem(index, { nama_komponen: event.target.value })}
                      placeholder="Nama (opsional)"
                      className="col-span-12 md:col-span-5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                    />
                    <input
                      type="number"
                      min={0}
                      value={item.jumlah === 0 ? "" : String(item.jumlah)}
                      onChange={(event) => updateManualItem(index, { jumlah: Number(event.target.value) })}
                      placeholder="Rp"
                      className="col-span-11 md:col-span-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
                    />
                    <button
                      type="button"
                      onClick={() => removeManualItem(index)}
                      disabled={isSubmitting}
                      aria-label={`Hapus komponen ${PAYROLL_COMPONENT_LABEL[item.kode_komponen]}`}
                      className="col-span-1 inline-flex items-center justify-center rounded-xl p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {liveSummary && (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Ringkasan Perhitungan
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="divide-y divide-slate-100 text-sm">
                  <SummaryRow label="Gaji Pokok" value={liveSummary.gaji_pokok} />
                  <SummaryRow label="Tunjangan Tetap" value={tunjanganTetapMaster} />
                  <SummaryRow label="Tunjangan Manual" value={tunjanganManual} />
                  <SummaryRow label="Lembur" value={liveSummary.lembur} />
                  <SummaryRow label="Bonus" value={liveSummary.bonus} />
                  <SummaryRow label="Insentif" value={liveSummary.insentif} />
                  <SummaryRow label="Total Bruto" value={liveSummary.gaji_kotor} bold />
                </div>
                <div className="divide-y divide-slate-100 text-sm">
                  <SummaryRow label="BPJS JHT" value={liveSummary.bpjs_jht} />
                  <SummaryRow label="BPJS JP" value={liveSummary.bpjs_jp} />
                  <SummaryRow label="Kasbon" value={liveSummary.potongan_kasbon} />
                  <SummaryRow label="Potongan Manual" value={liveSummary.potongan_manual} />
                  <SummaryRow label="Total Potongan" value={liveSummary.gaji_kotor - liveSummary.gaji_bersih} bold />
                  <SummaryRow label="Total Diterima (Net)" value={liveSummary.gaji_bersih} bold />
                </div>
              </div>
            </div>
          )}

          {kasbonInfo && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Potongan Kasbon Aktif</p>
              <p className="text-sm text-amber-800">
                {kasbonInfo.count} kasbon aktif — Total: {formatRupiah(kasbonInfo.totalKasbon)}
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
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Komponen Payroll"
        maxWidth="max-w-3xl"
      >
        {detailData && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Karyawan</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {employeeById[detailData.payroll?.employee_id ?? ""] ?? "Karyawan tidak ditemukan"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Periode</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {detailData.payroll?.bulan ? formatPeriod(detailData.payroll.bulan) : "-"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pendapatan</p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                  <SummaryRow label="Gaji Pokok" value={detailData.payroll?.gaji_pokok ?? 0} />
                  <SummaryRow label="Tunjangan" value={detailData.payroll?.tunjangan ?? 0} />
                  <SummaryRow label="Lembur" value={detailData.payroll?.lembur ?? 0} />
                  <SummaryRow label="Bonus" value={detailData.payroll?.bonus ?? 0} />
                  <SummaryRow label="Insentif" value={detailData.payroll?.insentif ?? 0} />
                  <SummaryRow label="Gaji Kotor (Bruto)" value={detailData.payroll?.gaji_kotor ?? 0} bold />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Potongan</p>
                <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm">
                  <SummaryRow label="BPJS JHT (2%)" value={detailData.payroll?.bpjs_jht ?? 0} />
                  <SummaryRow label="BPJS JP (1%)" value={detailData.payroll?.bpjs_jp ?? 0} />
                  <SummaryRow label="Kasbon" value={detailData.payroll?.potongan_kasbon ?? 0} />
                  <SummaryRow label="Potongan Manual" value={detailData.payroll?.potongan_manual ?? 0} />
                  <SummaryRow label="BPJS JKK+JKM (info)" value={detailData.payroll?.bpjs_jkk_jkm ?? 0} muted />
                  <SummaryRow label="Gaji Bersih (Net)" value={detailData.payroll?.gaji_bersih ?? detailData.payroll?.total ?? 0} bold />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rincian Komponen ({detailData.items.length})</p>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-max text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Komponen</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kategori</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipe</th>
                      <th className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailData.items.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">Tidak ada rincian komponen.</td>
                      </tr>
                    ) : (
                      detailData.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-2.5 text-slate-700">{item.nama_komponen}</td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                item.kategori === "pendapatan"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {item.kategori === "pendapatan" ? "Pendapatan" : "Potongan"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">{item.tipe === "auto" ? "Otomatis" : "Manual"}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-900 whitespace-nowrap">
                            {formatRupiah(item.jumlah ?? 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
