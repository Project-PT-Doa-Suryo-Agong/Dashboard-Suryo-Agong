"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, PlusCircle, Search, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MKaryawan, TPayrollHistory } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type EmployeeOption = {
  id: string;
  nama: string;
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

function toMonthInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export default function FinancePayrollPage() {
  const [items, setItems] = useState<TPayrollHistory[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TPayrollHistory | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    employee_id: string;
    bulan: string;
    total: string;
  }>({
    employee_id: "",
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
        await Promise.all([fetchPayroll(), fetchKaryawan()]);
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

  const handleEmployeeChange = (employeeId: string) => {
    const baseSalary = employeeSalaryById[employeeId];

    setFormData((prev) => ({
      ...prev,
      employee_id: employeeId,
      total: baseSalary != null && baseSalary > 0 ? String(baseSalary) : "",
    }));
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

  const resetForm = () => {
    const defaultEmployee = employees[0];
    setFormData({
      employee_id: defaultEmployee?.id ?? "",
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
      bulan: toMonthInput(item.bulan),
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
        bulan: `${formData.bulan}-01`,
        total: parsedTotal,
      };

      if (editData) {
        const response = await apiFetch(`/api/finance/payroll/${editData.id}`, {
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
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const exportRows = filteredPayroll.map((item) => {
      const employeeName = employeeById[item.employee_id ?? ""] ?? "Karyawan tidak ditemukan";
      return [
        item.bulan ? formatPeriod(item.bulan) : "-",
        employeeName,
        formatRupiah(item.total ?? 0),
        item.created_at ? formatDate(item.created_at) : "-",
      ];
    });

    doc.setFontSize(14);
    doc.text("Slip Gaji - PT Doa Suryo Agong", 14, 16);
    doc.setFontSize(10);
    doc.text(`Tanggal cetak: ${formatDate(new Date().toISOString())}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Periode", "Nama Karyawan", "Total Gaji", "Tanggal Eksekusi"]],
      body: exportRows,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [30, 58, 138] },
    });

    doc.save("Slip_Gaji_PT_Doa_Suryo_Agong.pdf");
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
          <button
            type="button"
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
          >
            Cetak PDF
          </button>
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
          <div className="relative w-full md:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama karyawan..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Periode</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Karyawan</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Total Gaji</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal Eksekusi</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr key="loading-row">
                  <td colSpan={5} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredPayroll.length === 0 ? (
                <tr key="empty-row">
                  <td colSpan={5} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
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
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{employeeName}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-slate-900 whitespace-nowrap">{formatRupiah(item.total ?? 0)}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                            aria-label="Edit payroll"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item.id)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Hapus payroll"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
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
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Periode Bulan</label>
            <input
              required
              type="month"
              value={formData.bulan}
              onChange={(event) => setFormData((prev) => ({ ...prev, bulan: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Terisi otomatis dari data karyawan"
            />
          </div>

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
    </div>
  );
}
