"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Eye, PlusCircle, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { ManagementBudgetStatus, TBudgetRequest } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type BudgetRequestFilterStatus = "all" | ManagementBudgetStatus;

type BudgetListPayload = {
  budget_requests: TBudgetRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type BudgetPayload = {
  budget_request: TBudgetRequest | null;
};

type FormState = {
  divisi: string;
  amount: string;
  status: ManagementBudgetStatus;
};

const initialFormState: FormState = {
  divisi: "",
  amount: "",
  status: "pending",
};

const divisionOptions = [
  "Management & Strategy",
  "Finance & Administration",
  "HR & Operation Manager",
  "Produksi & Quality Control",
  "Logistics & Packing",
  "Creative & Sales",
  "Office Support",
  "Developer",
] as const;

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

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

function statusBadgeClass(status: ManagementBudgetStatus | null): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: ManagementBudgetStatus | null): string {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  return "Ditolak";
}

export default function ManagementBudgetPage() {
  const [items, setItems] = useState<TBudgetRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<BudgetRequestFilterStatus>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TBudgetRequest | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TBudgetRequest | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchBudgetRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/management/budget?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<BudgetListPayload>(response);
      setItems(payload.data.budget_requests ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat budget request.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchBudgetRequests();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch = (item.divisi ?? "").toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditData(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TBudgetRequest) => {
    setEditData(item);
    setFormData({
      divisi: item.divisi,
      amount: String(item.amount),
      status: item.status ?? "pending",
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedAmount = Number(formData.amount);
    if (!formData.divisi.trim()) {
      alert("Divisi wajib diisi.");
      return;
    }
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Nominal harus berupa angka lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        divisi: formData.divisi.trim(),
        amount: parsedAmount,
        status: formData.status,
      };

      if (editData) {
        const response = await apiFetch(`/api/management/budget/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<BudgetPayload>(response);
      } else {
        const response = await apiFetch("/api/management/budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<BudgetPayload>(response);
      }

      await fetchBudgetRequests();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan budget request.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openReviewModal = (item: TBudgetRequest) => {
    setSelectedRequest(item);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const updateRequestStatus = async (status: ManagementBudgetStatus) => {
    if (!selectedRequest || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/management/budget/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await parseJsonResponse<BudgetPayload>(response);
      await fetchBudgetRequests();
      closeReviewModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memproses budget request.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/management/budget/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchBudgetRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus budget request.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Persetujuan Anggaran</h1>
        <p className="text-sm md:text-base text-slate-200">Tinjau dan kelola pengajuan dana operasional dari setiap divisi.</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari divisi..."
            className="w-full sm:flex-1 rounded-xl border border-slate-300 bg-slate-200 py-2.5 px-3 text-sm text-slate-700 shadow-sm"
          />

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as BudgetRequestFilterStatus)}
            className="w-full sm:w-56 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700"
          >
            <option value="all">Semua Status</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <PlusCircle size={17} />
          Tambah Pengajuan
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID Pengajuan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Divisi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Nominal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const isProcessed = item.status !== "pending";

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">{item.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.divisi}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{formatRupiah(item.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(item.status)}`}>
                        {statusLabel(item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openReviewModal(item)}
                          disabled={isSubmitting}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border text-slate-600 transition disabled:opacity-50 ${
                            isProcessed ? "border-slate-200 bg-slate-100" : "border-green-300 hover:bg-green-50"
                          }`}
                          aria-label="Tinjau"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                          aria-label="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          aria-label="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Data pengajuan tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editData ? "Edit Pengajuan Anggaran" : "Tambah Pengajuan Anggaran"} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            required
            value={formData.divisi}
            onChange={(event) => setFormData((prev) => ({ ...prev, divisi: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
            disabled={isSubmitting}
          >
            <option value="" disabled>
              Pilih Divisi
            </option>
            {formData.divisi && !divisionOptions.includes(formData.divisi as (typeof divisionOptions)[number]) ? (
              <option value={formData.divisi}>{formData.divisi}</option>
            ) : null}
            {divisionOptions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
          <input
            required
            type="number"
            min={1}
            value={formData.amount}
            onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
            placeholder="Nominal"
            disabled={isSubmitting}
          />
          <select
            value={formData.status}
            onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as ManagementBudgetStatus }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
            disabled={isSubmitting}
          >
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isReviewModalOpen} onClose={closeReviewModal} title="Review Pengajuan Anggaran" maxWidth="max-w-lg">
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Divisi</p>
              <p className="font-semibold text-slate-900">{selectedRequest?.divisi ?? "-"}</p>
              <p className="text-slate-500">Nominal</p>
              <p className="font-semibold text-slate-900">{selectedRequest ? formatRupiah(selectedRequest.amount) : "-"}</p>
            </div>
          </div>

          {selectedRequest?.status === "pending" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateRequestStatus("rejected")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => updateRequestStatus("approved")}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
              >
                Setujui Anggaran
              </button>
            </div>
          ) : (
            <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">Pengajuan ini sudah diproses.</p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Pengajuan Anggaran"
        description="Apakah Anda yakin ingin menghapus data ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
