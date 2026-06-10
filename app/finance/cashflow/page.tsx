"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, PlusCircle, Trash2, Wallet, Coins, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { FinanceCashflowType, TCashflow } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import { SearchBar } from "@/components/ui/search-bar";

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
  const [activeTab, setActiveTab] = useState<"besar" | "kecil">("besar");
  const [filter, setFilter] = useState<CashflowFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TCashflow | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cashflowNumber, setCashflowNumber] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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

  const fetchDefaultCashflowNumber = async () => {
    try {
      const response = await apiFetch("/api/finance/cashflow-number", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ count: number }>(response);
      const count = payload.data.count;

      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const nnnnn = String(count + 1).padStart(5, "0");

      setCashflowNumber(`CSH-${mm}${yy}-${nnnnn}`);
    } catch (error) {
      console.error("Gagal mengambil cashflow number:", error);
    }
  };

  useEffect(() => {
    void Promise.all([fetchCashflow(), fetchDefaultCashflowNumber()]);
  }, []);

  // Kas Besar calculations
  const totalIncomeBesar = useMemo(
    () =>
      items
        .filter((item) => item.tipe === "income")
        .reduce((acc, item) => acc + (item.amount ?? 0), 0),
    [items],
  );

  const totalExpenseBesar = useMemo(
    () =>
      items
        .filter((item) => item.tipe === "expense" && (item.amount ?? 0) > 1000000)
        .reduce((acc, item) => acc + (item.amount ?? 0), 0),
    [items],
  );

  const balanceBesar = totalIncomeBesar - totalExpenseBesar;

  // Kas Kecil calculations
  const totalExpenseKecil = useMemo(
    () =>
      items
        .filter((item) => item.tipe === "expense" && (item.amount ?? 0) <= 1000000)
        .reduce((acc, item) => acc + (item.amount ?? 0), 0),
    [items],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    
    // 1. Filter by Active Tab
    let tabFiltered = items;
    if (activeTab === "besar") {
      tabFiltered = items.filter(
        (item) => item.tipe === "income" || (item.tipe === "expense" && (item.amount ?? 0) > 1000000)
      );
    } else {
      tabFiltered = items.filter(
        (item) => item.tipe === "expense" && (item.amount ?? 0) <= 1000000
      );
    }

    // 2. Filter by Sub-filter
    let subFiltered = tabFiltered;
    if (filter !== "all") {
      subFiltered = tabFiltered.filter((item) => item.tipe === filter);
    }

    // 3. Filter by Search Term
    if (!keyword) return subFiltered;
    return subFiltered.filter((item) => {
      const number = item.cashflow_number ?? "";
      const note = item.keterangan ?? "";
      return (
        number.toLowerCase().includes(keyword) ||
        note.toLowerCase().includes(keyword)
      );
    });
  }, [items, activeTab, filter, searchTerm]);

  const resetForm = () => {
    setFormData({ tipe: "income", amount: "", keterangan: "" });
    setEditData(null);
    void fetchDefaultCashflowNumber();
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
        cashflow_number: cashflowNumber || undefined,
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

  // Render the categorization live feedback in modal
  const getCategoryIndicator = () => {
    const parsedAmount = Number(formData.amount);
    if (formData.tipe === "income") {
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-600">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500 animate-pulse" />
          <div>
            <span className="font-bold text-emerald-700">Kategori: Kas Besar (Pemasukan)</span>
            <p className="text-slate-500 mt-0.5">Semua tipe pemasukan otomatis dialokasikan ke Kas Besar.</p>
          </div>
        </div>
      );
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
          <div>
            <span className="font-semibold text-slate-700">Menunggu Input Nominal...</span>
            <p className="text-slate-400 mt-0.5">Sistem akan mengkategori kas berdasarkan nominal secara otomatis.</p>
          </div>
        </div>
      );
    }

    if (parsedAmount > 1000000) {
      return (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-600">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-500 animate-pulse" />
          <div>
            <span className="font-bold text-blue-700">Kategori: Kas Besar (Pengeluaran &gt; Rp 1 jt)</span>
            <p className="text-slate-500 mt-0.5">Pengeluaran bernilai besar dialokasikan ke Kas Besar (Utama).</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-600">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-500 animate-pulse" />
        <div>
          <span className="font-bold text-amber-700">Kategori: Kas Kecil (Pengeluaran &le; Rp 1 jt)</span>
          <p className="text-slate-500 mt-0.5">Pengeluaran harian/rutin dialokasikan ke Kas Kecil (Harian).</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Laporan Arus Kas</h1>
          <p className="text-sm md:text-base text-slate-300">Pantau seluruh transaksi pemasukan dan pengeluaran secara real-time.</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 hover:text-gray-300 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm active:scale-95"
        >
          <PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
          Catat Transaksi
        </button>
      </section>

      {/* Modern custom tab switcher with glassmorphic tabs and glowing status states */}
      <div className="flex border-b border-slate-700/30 gap-2 md:gap-4 pt-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("besar");
            setFilter("all");
          }}
          className={`flex items-center gap-2 pb-3 pt-1 px-3 border-b-2 text-xs md:text-sm font-bold transition-all ${
            activeTab === "besar"
              ? "border-indigo-500 text-white font-extrabold"
              : "border-transparent text-slate-300 hover:text-white"
          }`}
        >
          <Wallet className="h-4 w-4 shrink-0 text-indigo-500" />
          <span className="text-white">Kas Besar</span>
          <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-500/20 text-white">
            &gt; 1 Jt &amp; Pemasukan
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("kecil");
            setFilter("all");
          }}
          className={`flex items-center gap-2 pb-3 pt-1 px-3 border-b-2 text-xs md:text-sm font-bold transition-all ${
            activeTab === "kecil"
              ? "border-amber-500 text-white font-extrabold"
              : "border-transparent text-slate-300 hover:text-white"
          }`}
        >
          <Coins className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-white">Kas Kecil</span>
          <span className="hidden sm:inline px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-500/20 text-white">
            &le; 1 Jt (Harian)
          </span>
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        {activeTab === "besar" ? (
          <>
            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pemasukan (Kas Besar)</p>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-emerald-600 break-all">{formatRupiah(totalIncomeBesar)}</p>
            </article>

            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran Besar (&gt; Rp 1 Jt)</p>
                <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-red-600 break-all">{formatRupiah(totalExpenseBesar)}</p>
            </article>

            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Saldo Bersih Kas Besar</p>
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-blue-700 break-all">{formatRupiah(balanceBesar)}</p>
            </article>
          </>
        ) : (
          <>
            <article className="bg-white/80 border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md relative overflow-hidden group">
              <div className="flex items-center justify-between opacity-75">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Pemasukan (Kas Kecil)</p>
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400">
                  <Info className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-slate-400 break-all">Rp 0</p>
              <p className="text-[10px] text-slate-500 mt-1 font-medium italic">Pemasukan otomatis masuk ke Kas Besar</p>
            </article>

            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Pengeluaran Harian (&le; Rp 1 Jt)</p>
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                  <ArrowDownRight className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-amber-600 break-all">{formatRupiah(totalExpenseKecil)}</p>
            </article>

            <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Jumlah Transaksi Kas Kecil</p>
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-2 text-base md:text-xl lg:text-2xl font-black text-indigo-700 break-all">{filteredItems.length} Transaksi</p>
            </article>
          </>
        )}
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm md:text-base font-bold text-slate-900 flex items-center gap-2">
            <span>Daftar Arus {activeTab === "besar" ? "Kas Besar" : "Kas Kecil"}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "besar" ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"
            }`}>
              {activeTab === "besar" ? "Kas Utama" : "Kas Harian"}
            </span>
          </h2>

          <div className="flex flex-wrap gap-2">
            {activeTab === "besar" ? (
              <>
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === "all" ? "bg-indigo-600 text-white shadow-sm" : "bg-indigo-100 text-slate-600 hover:bg-indigo-200"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("income")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === "income" ? "bg-emerald-600 text-white shadow-sm" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("expense")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    filter === "expense" ? "bg-red-600 text-white shadow-sm" : "bg-red-50 text-red-700 hover:bg-red-100"
                  }`}
                >
                  Pengeluaran
                </button>
              </>
            ) : (
              <span className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Coins className="h-3.5 w-3.5 text-amber-500" />
                Hanya Pengeluaran Harian
              </span>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari nomor atau keterangan..."
            className="w-full sm:max-w-md"
          />
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID Cashflow</th>
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
                  <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
                    Tidak ada transaksi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-bold font-mono text-slate-900 whitespace-nowrap">{item.cashflow_number ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-800 min-w-[240px] max-w-md truncate">{item.keterangan ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.tipe === "income" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}
                      >
                        {item.tipe === "income" ? "Pemasukan" : "Pengeluaran"}
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
                      <RowActions>
                        <EditButton onClick={() => openEditModal(item)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteModal(item.id)} disabled={isSubmitting} />
                      </RowActions>
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
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">ID Cashflow</label>
            <input
              type="text"
              readOnly
              value={editData?.cashflow_number ?? cashflowNumber}
              className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-bold font-mono text-slate-500 cursor-not-allowed"
              placeholder="Auto-generated"
              disabled
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipe Transaksi</label>
            <select
              value={formData.tipe}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, tipe: event.target.value as FinanceCashflowType }))
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 transition-all font-medium"
              required
            >
              <option value="income">Pemasukan (Income)</option>
              <option value="expense">Pengeluaran (Expense)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keterangan</label>
            <input
              type="text"
              value={formData.keterangan}
              onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 transition-all placeholder:text-slate-400"
              placeholder="Contoh: Pembayaran invoice klien atau sewa bulanan"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20 transition-all placeholder:text-slate-400"
              placeholder="Masukkan nominal dalam Rupiah"
              required
            />
          </div>

          {/* Interactive, self-routing indicator based on the entered transaction value and type */}
          <div className="pt-1">
            {getCategoryIndicator()}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
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
