"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle, Edit, PlusCircle, Trash2, XCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import { apiFetch } from "@/lib/utils/api-fetch";
import type {
  FinanceReimburseStatus,
  MKaryawan,
  TReimbursement,
} from "@/types/supabase";

type EmployeeOption = {
  id: string;
  nama: string;
  divisi: string;
};

type ReimburseListPayload = {
  reimburse: TReimbursement[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type ReimbursePayload = {
  reimburse: TReimbursement | null;
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

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));
}

export default function FinanceReimbursePage() {
  const [items, setItems] = useState<TReimbursement[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);

  const [activeTab, setActiveTab] = useState<"pending" | "processed">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TReimbursement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    employee_id: string;
    amount: string;
    status: FinanceReimburseStatus;
  }>({
    employee_id: "",
    amount: "",
    status: "pending",
  });

  const fetchReimburse = async () => {
    try {
      const response = await apiFetch("/api/finance/reimburse?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ReimburseListPayload>(response);
      setItems(payload.data.reimburse ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data reimburse.";
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
        divisi: employee.divisi ?? "-",
      }));
      setEmployees(options);
      setFormData((prev) => ({
        ...prev,
        employee_id: prev.employee_id || options[0]?.id || "",
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
        await Promise.all([fetchReimburse(), fetchKaryawan()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])) as Record<string, EmployeeOption>,
    [employees],
  );

  const pendingItems = useMemo(
    () => items.filter((item) => item.status === "pending"),
    [items],
  );

  const processedItems = useMemo(
    () => items.filter((item) => item.status === "approved" || item.status === "rejected"),
    [items],
  );

  const visibleItems = activeTab === "pending" ? pendingItems : processedItems;

  const resetForm = () => {
    setFormData({
      employee_id: employees[0]?.id ?? "",
      amount: "",
      status: "pending",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TReimbursement) => {
    setEditData(item);
    setFormData({
      employee_id: item.employee_id ?? "",
      amount: String(item.amount ?? ""),
      status: item.status ?? "pending",
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

    const parsedAmount = Number(formData.amount);
    if (!formData.employee_id) {
      alert("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Nominal reimburse harus berupa angka lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employee_id: formData.employee_id,
        amount: parsedAmount,
        status: formData.status,
      };

      if (editData) {
        const response = await apiFetch(`/api/finance/reimburse/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ReimbursePayload>(response);
      } else {
        const response = await apiFetch("/api/finance/reimburse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ReimbursePayload>(response);
      }

      await fetchReimburse();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan reimburse gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: FinanceReimburseStatus) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/reimburse/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await parseJsonResponse<ReimbursePayload>(response);
      await fetchReimburse();
      if (status !== "pending") setActiveTab("processed");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memperbarui status reimburse.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/reimburse/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchReimburse();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus reimburse.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Persetujuan Reimburse</h1>
        <p className="text-sm md:text-base text-slate-300">
          Validasi pengajuan reimbursement dari karyawan berdasarkan kebutuhan operasional divisi.
        </p>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 md:p-4 flex items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 flex-1">
          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`h-11 rounded-lg px-4 text-sm font-semibold transition-colors ${
              activeTab === "pending"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Menunggu Persetujuan ({pendingItems.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("processed")}
            className={`h-11 rounded-lg px-4 text-sm font-semibold transition-colors ${
              activeTab === "processed"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Riwayat Diproses ({processedItems.length})
          </button>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          <PlusCircle size={18} />
          Tambah Reimburse
        </button>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Daftar Pengajuan Reimburse</h2>
          <span className="text-xs text-slate-500">{visibleItems.length} data</span>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Karyawan</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Divisi</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nominal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
                    Tidak ada data pada tab ini.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => {
                  const employee = employeeById[item.employee_id ?? ""];
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{employee?.nama ?? "Karyawan tidak ditemukan"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{employee?.divisi ?? "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatRupiah(item.amount ?? 0)}</td>
                      <td className="px-4 md:px-6 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.status === "approved"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "rejected"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {item.status ?? "pending"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          {item.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => void updateStatus(item.id, "approved")}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => void updateStatus(item.id, "rejected")}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                              >
                                <XCircle className="h-4 w-4" />
                                Tolak
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                            aria-label="Edit reimburse"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item.id)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Hapus reimburse"
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
        title={editData ? "Edit Reimburse" : "Tambah Reimburse"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Karyawan</label>
            <select
              required
              value={formData.employee_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, employee_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="" disabled>
                Pilih karyawan
              </option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.nama} - {employee.divisi}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nominal</label>
            <input
              required
              type="number"
              min={1}
              value={formData.amount}
              onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Masukkan nominal reimburse"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select
              required
              value={formData.status}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, status: event.target.value as FinanceReimburseStatus }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Reimburse"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Reimburse"
        description="Apakah Anda yakin ingin menghapus data reimburse ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
