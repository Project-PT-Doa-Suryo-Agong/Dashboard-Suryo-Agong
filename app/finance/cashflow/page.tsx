"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { FinanceCashflowType, TCashflow } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type CashflowFilter = "all" | FinanceCashflowType;

type CashflowListPayload = {
  cashflow: TCashflow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type CashflowPayload = {
  cashflow: TCashflow | null;
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

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function FinanceCashflowPage() {
  const [items, setItems] = useState<TCashflow[]>([]);
  const [filter, setFilter] = useState<CashflowFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TCashflow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    tipe: FinanceCashflowType;
    amount: string;
    keterangan: string;
  }>({
    tipe: "income",
    amount: "",
    keterangan: "",
  });

  const fetchCashflow = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/finance/cashflow?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<CashflowListPayload>(response);
      setItems(payload.data.cashflow ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data cashflow.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCashflow();
  }, []);

  const totalIncome = useMemo(
    () =>
      items
        .filter((item) => item.tipe === "income")
        .reduce((acc, item) => acc + (item.amount ?? 0), 0),
    [items],
  );

  const totalExpense = useMemo(
    () =>
      items
        .filter((item) => item.tipe === "expense")
        .reduce((acc, item) => acc + (item.amount ?? 0), 0),
    [items],
  );

  const netBalance = totalIncome - totalExpense;

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((item) => item.tipe === filter);
  }, [items, filter]);

  const resetForm = () => {
    setFormData({ tipe: "income", amount: "", keterangan: "" });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TCashflow) => {
    setEditData(item);
    setFormData({
      tipe: item.tipe ?? "income",
      amount: String(item.amount ?? ""),
      keterangan: item.keterangan ?? "",
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
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Nominal harus berupa angka lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        tipe: formData.tipe,
        amount: parsedAmount,
        keterangan: formData.keterangan.trim() || null,
      };

      if (editData) {
        const response = await apiFetch(`/api/finance/cashflow/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<CashflowPayload>(response);
      } else {
        const response = await apiFetch("/api/finance/cashflow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<CashflowPayload>(response);
      }

      await fetchCashflow();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan cashflow gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/cashflow/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchCashflow();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus cashflow.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Laporan Arus Kas</h1>
          <p className="text-sm md:text-base text-slate-300">Pantau seluruh transaksi pemasukan dan pengeluaran secara real-time.</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-700 hover:text-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors"
        >
          <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
          Catat Transaksi
        </button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pemasukan</p>
          <p className="mt-2 text-base md:text-xl font-bold text-emerald-600 break-all">{formatRupiah(totalIncome)}</p>
        </article>

        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran</p>
          <p className="mt-2 text-base md:text-xl font-bold text-red-600 break-all">{formatRupiah(totalExpense)}</p>
        </article>

        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Saldo Bersih</p>
          <p className="mt-2 text-base md:text-xl font-bold text-blue-700 break-all">{formatRupiah(netBalance)}</p>
        </article>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Daftar Arus Kas</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === "all" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-slate-600 hover:bg-indigo-200"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setFilter("income")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === "income" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              Income
            </button>
            <button
              type="button"
              onClick={() => setFilter("expense")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === "expense" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
              }`}
            >
              Expense
            </button>
          </div>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Keterangan</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipe</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nominal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
                    Tidak ada transaksi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-800 min-w-80">{item.keterangan ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.tipe === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.tipe ?? "-"}
                      </span>
                    </td>
                    <td
                      className={`px-4 md:px-6 py-3 text-sm font-semibold text-right whitespace-nowrap ${
                        item.tipe === "income" ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {item.tipe === "income" ? "+ " : "- "}
                      {formatRupiah(item.amount ?? 0)}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                          aria-label="Edit transaksi"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label="Hapus transaksi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        maxWidth="max-w-md"
        title={editData ? "Edit Transaksi" : "Catat Transaksi Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipe Transaksi</label>
            <select
              value={formData.tipe}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, tipe: event.target.value as FinanceCashflowType }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              required
            >
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keterangan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Contoh: Pembayaran invoice klien"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nominal</label>
            <input
              type="number"
              min={1}
              value={formData.amount}
              onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Masukkan nominal"
              required
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
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Transaksi"
        description="Apakah Anda yakin ingin menghapus transaksi cashflow ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
