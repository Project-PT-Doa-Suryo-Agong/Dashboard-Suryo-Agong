"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, PlusCircle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SearchBar } from "@/components/ui/search-bar";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MCOA, TJournal, TJournalItem } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type JournalItemForm = {
  id?: string;
  coa_id: string;
  debit: string;
  kredit: string;
};

type JournalRow = TJournal & {
  t_journal_item?: JournalItemForm[];
};

type JournalListPayload = {
  jurnal: JournalRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type JournalItemsPayload = {
  items: (TJournalItem & { m_coa?: { kode_akun: string; nama_akun: string } | null })[];
};

type CoaListPayload = {
  coa: MCOA[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type JournalPayload = {
  jurnal: TJournal | null;
};

type CoaOption = { id: string; label: string };

function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  return response.json().then((payload) => {
    const typed = payload as ApiSuccess<T> | ApiError;
    if (!response.ok || !typed.success) {
      const message = typed.success ? "Terjadi kesalahan." : typed.error.message;
      throw new Error(message);
    }
    return typed;
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

const initialItemRow: JournalItemForm = {
  coa_id: "",
  debit: "0",
  kredit: "0",
};

const categoryBadgeClass = {
  debit: "bg-emerald-50 text-emerald-700",
  kredit: "bg-red-50 text-red-700",
};

export default function FinanceJournalPage() {
  const [journals, setJournals] = useState<JournalRow[]>([]);
  const [coaOptions, setCoaOptions] = useState<CoaOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editData, setEditData] = useState<TJournal | null>(null);
  const [detailData, setDetailData] = useState<TJournal | null>(null);
  const [journalNumber, setJournalNumber] = useState("");
  const [detailItems, setDetailItems] = useState<JournalItemForm[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [journalItems, setJournalItems] = useState<JournalItemForm[]>([initialItemRow]);
  const [originalItems, setOriginalItems] = useState<JournalItemForm[]>([]);
  const [formData, setFormData] = useState({
    no_bukti: "",
    tanggal: "",
    keterangan: "",
  });

  const fetchJournals = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/finance/jurnal?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<JournalListPayload>(response);
      setJournals(payload.data.jurnal ?? []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memuat daftar jurnal.");
    } finally {
      setIsLoading(false);
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
      const options = payload.data.coa.map((coa) => ({
        id: coa.id,
        label: `${coa.kode_akun} - ${coa.nama_akun}`,
      }));
      setCoaOptions(options);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memuat daftar COA.");
    }
  };

  const fetchDefaultJournalNumber = async () => {
    try {
      const response = await apiFetch("/api/finance/journal-number", {
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

      setJournalNumber(`JRN-${mm}${yy}-${nnnnn}`);
    } catch (error) {
      console.error("Gagal mengambil journal number:", error);
    }
  };

  useEffect(() => {
    void Promise.all([fetchJournals(), fetchCoa(), fetchDefaultJournalNumber()]);
  }, []);

  const filteredJournals = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return journals;
    return journals.filter((journal) => journal.no_bukti?.toLowerCase().includes(keyword));
  }, [journals, searchTerm]);

  const openAddModal = () => {
    setEditData(null);
    setJournalItems([initialItemRow]);
    setOriginalItems([]);
    setFormData({ no_bukti: "", tanggal: "", keterangan: "" });
    void fetchDefaultJournalNumber();
    setIsFormModalOpen(true);
  };

  const fetchItemsForJournal = async (journalId: string) => {
    setIsItemLoading(true);
    try {
      const response = await apiFetch(`/api/finance/jurnal-items?journal_id=${journalId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<JournalItemsPayload>(response);
      const loaded = payload.data.items.map((item) => ({
        id: item.id,
        coa_id: item.coa_id,
        debit: item.debit != null ? String(item.debit) : "0",
        kredit: item.kredit != null ? String(item.kredit) : "0",
      }));
      return loaded.length > 0 ? loaded : [initialItemRow];
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memuat item jurnal.");
      return [initialItemRow];
    } finally {
      setIsItemLoading(false);
    }
  };

  const openEditModal = async (journal: TJournal) => {
    setEditData(journal);
    setFormData({
      no_bukti: journal.no_bukti ?? "",
      tanggal: journal.tanggal ?? "",
      keterangan: journal.keterangan ?? "",
    });
    setIsFormModalOpen(true);
    const loadedItems = await fetchItemsForJournal(journal.id);
    setJournalItems(loadedItems);
    setOriginalItems(loadedItems);
  };

  const openDetailModal = async (journal: TJournal) => {
    setDetailData(journal);
    setIsDetailModalOpen(true);
    const loadedItems = await fetchItemsForJournal(journal.id);
    setDetailItems(loadedItems);
  };

  const addItemRow = () => {
    setJournalItems((prev) => [...prev, { ...initialItemRow }]);
  };

  const removeItemRow = (index: number) => {
    setJournalItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const updateItemRow = (index: number, key: keyof JournalItemForm, value: string) => {
    setJournalItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    );
  };

  const debitTotal = useMemo(
    () => journalItems.reduce((sum, row) => sum + (Number(row.debit) || 0), 0),
    [journalItems],
  );
  const kreditTotal = useMemo(
    () => journalItems.reduce((sum, row) => sum + (Number(row.kredit) || 0), 0),
    [journalItems],
  );
  const isBalanced = debitTotal === kreditTotal;

  const resetForm = () => {
    setFormData({ no_bukti: "", tanggal: "", keterangan: "" });
    setJournalItems([initialItemRow]);
    setOriginalItems([]);
    setEditData(null);
    void fetchDefaultJournalNumber();
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setDetailData(null);
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const validateItemRow = (row: JournalItemForm, index: number) => {
    if (!row.coa_id) return `Pilih COA pada baris ${index + 1}.`;
    const debit = Number(row.debit) || 0;
    const kredit = Number(row.kredit) || 0;
    if (debit < 0 || kredit < 0) return `Debit/Kredit tidak boleh negatif pada baris ${index + 1}.`;
    if (debit > 0 && kredit > 0) return `Isi hanya salah satu dari Debit atau Kredit pada baris ${index + 1}.`;
    if (debit === 0 && kredit === 0) return `Debit atau Kredit harus diisi pada baris ${index + 1}.`;
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isItemLoading) return;

    if (!formData.no_bukti.trim()) {
      alert("No Bukti wajib diisi.");
      return;
    }
    if (!formData.tanggal) {
      alert("Tanggal wajib diisi.");
      return;
    }
    if (journalItems.length === 0) {
      alert("Minimal satu item jurnal wajib ditambahkan.");
      return;
    }
    for (const [index, row] of journalItems.entries()) {
      const error = validateItemRow(row, index);
      if (error) {
        alert(error);
        return;
      }
    }
    if (!isBalanced) {
      alert("Total debit dan kredit harus seimbang sebelum menyimpan.");
      return;
    }

    setIsSubmitting(true);
    try {
      let journalId: string | null = editData?.id ?? null;
      if (editData) {
        const response = await apiFetch(`/api/finance/jurnal/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            no_bukti: formData.no_bukti.trim(),
            tanggal: formData.tanggal,
            keterangan: formData.keterangan || null,
          }),
        });
        await parseJsonResponse<JournalPayload>(response);
      } else {
        const response = await apiFetch("/api/finance/jurnal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            no_bukti: formData.no_bukti.trim(),
            tanggal: formData.tanggal,
            keterangan: formData.keterangan || null,
            journal_number: journalNumber || undefined,
          }),
        });
        const payload = await parseJsonResponse<JournalPayload>(response);
        journalId = payload.data.jurnal?.id ?? null;
      }

      if (!journalId) {
        throw new Error("Gagal menentukan ID jurnal.");
      }

      if (editData) {
        const deleteTasks = originalItems
          .filter((orig) => orig.id && !journalItems.some((current) => current.id === orig.id))
          .map((item) => apiFetch(`/api/finance/jurnal-items/${item.id}`, { method: "DELETE" }));

        const patchTasks = journalItems
          .filter((item) => item.id)
          .map((item) =>
            apiFetch(`/api/finance/jurnal-items/${item.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                coa_id: item.coa_id,
                debit: Number(item.debit) || 0,
                kredit: Number(item.kredit) || 0,
              }),
            }),
          );

        const createTasks = journalItems
          .filter((item) => !item.id)
          .map((item) =>
            apiFetch("/api/finance/jurnal-items", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                journal_id: journalId,
                coa_id: item.coa_id,
                debit: Number(item.debit) || 0,
                kredit: Number(item.kredit) || 0,
              }),
            }),
          );

        const responses = await Promise.all([...deleteTasks, ...patchTasks, ...createTasks]);
        for (const response of responses) {
          if (response instanceof Response) {
            if (!response.ok) {
              const payload = (await response.json()) as ApiError;
              throw new Error(payload.error?.message ?? "Gagal menyimpan item jurnal.");
            }
          }
        }
      } else {
        const createTasks = journalItems.map((item) =>
          apiFetch("/api/finance/jurnal-items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              journal_id: journalId,
              coa_id: item.coa_id,
              debit: Number(item.debit) || 0,
              kredit: Number(item.kredit) || 0,
            }),
          }),
        );
        const responses = await Promise.all(createTasks);
        for (const response of responses) {
          if (!response.ok) {
            const payload = (await response.json()) as ApiError;
            throw new Error(payload.error?.message ?? "Gagal menyimpan item jurnal.");
          }
        }
      }

      await fetchJournals();
      closeFormModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan jurnal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/jurnal/${deleteId}`, { method: "DELETE" });
      await parseJsonResponse<null>(response);
      await fetchJournals();
      closeDeleteModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus jurnal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Jurnal Akuntansi</h1>
        <p className="text-sm md:text-base text-slate-300">Catat jurnal transaksi keuangan dan pastikan debit/kredit seimbang.</p>
      </section>

      <section className="rounded-xl md:flex flex-col lg:flex-row items-start lg:items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari nomor bukti..."
          className="w-full lg:max-w-md"
        />
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600 transition"
        >
          <PlusCircle size={18} />
          Tambah Jurnal
        </button>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Daftar Jurnal</h2>
          <span className="text-xs text-slate-500">{filteredJournals.length} data</span>
        </div>
        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Journal Number</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">No Bukti</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Jumlah Item</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">Tidak ada jurnal ditemukan.</td>
                </tr>
              ) : (
                filteredJournals.map((journal) => (
                  <tr key={journal.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-bold font-mono text-slate-900 whitespace-nowrap">{journal.journal_number ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{journal.no_bukti ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDate(journal.tanggal)}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-center text-slate-900">{journal.t_journal_item?.length ?? 0}</td>
                    <td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
                      <RowActions>
                        <DetailButton onClick={() => openDetailModal(journal)} disabled={isSubmitting} />
                        <EditButton onClick={() => void openEditModal(journal)} disabled={isSubmitting || isItemLoading} />
                        <DeleteButton onClick={() => openDeleteModal(journal.id)} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editData ? "Edit Jurnal" : "Tambah Jurnal"} maxWidth="max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Journal Number</label>
              <input
                type="text"
                readOnly
                value={editData?.journal_number ?? journalNumber}
                className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-bold font-mono text-slate-500 cursor-not-allowed"
                placeholder="Auto-generated"
                disabled
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">No Bukti</label>
              <input
                required
                value={formData.no_bukti}
                onChange={(event) => setFormData((prev) => ({ ...prev, no_bukti: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                placeholder="Nomor bukti"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal</label>
              <input
                required
                type="date"
                value={formData.tanggal}
                onChange={(event) => setFormData((prev) => ({ ...prev, tanggal: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keterangan</label>
              <input
                value={formData.keterangan}
                onChange={(event) => setFormData((prev) => ({ ...prev, keterangan: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                placeholder="Keterangan opsional"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm font-semibold text-slate-900">Item Jurnal</p>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                <PlusCircle size={16} />
                Tambah Baris
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2">Akun</th>
                    <th className="px-3 py-2 text-right">Debit</th>
                    <th className="px-3 py-2 text-right">Kredit</th>
                    <th className="px-3 py-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {journalItems.map((item, index) => (
                    <tr key={`${item.id ?? "new"}-${index}`}> 
                      <td className="px-3 py-2">
                        <select
                          required
                          value={item.coa_id}
                          onChange={(event) => updateItemRow(index, "coa_id", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                          disabled={isSubmitting}
                        >
                          <option value="" disabled>
                            Pilih COA
                          </option>
                          {coaOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={item.debit}
                          onChange={(event) => updateItemRow(index, "debit", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={item.kredit}
                          onChange={(event) => updateItemRow(index, "kredit", event.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          disabled={journalItems.length <= 1 || isSubmitting}
                          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Debit</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(debitTotal)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Kredit</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatCurrency(kreditTotal)}</p>
              </div>
            </div>

            {!isBalanced && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                Total debit dan kredit belum seimbang. Pastikan jumlah keduanya sama.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isItemLoading || !isBalanced}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : editData ? "Perbarui Jurnal" : "Simpan Jurnal"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title="Detail Jurnal" maxWidth="max-w-4xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Journal Number</p>
              <p className="mt-2 text-sm font-bold font-mono text-slate-900">{detailData?.journal_number ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">No Bukti</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{detailData?.no_bukti ?? "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tanggal</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{formatDate(detailData?.tanggal)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Keterangan</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{detailData?.keterangan ?? "-"}</p>
            </div>
          </div>
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">Akun</th>
                  <th className="px-3 py-2 text-right">Debit</th>
                  <th className="px-3 py-2 text-right">Kredit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isItemLoading ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm text-slate-500">Memuat item jurnal...</td>
                  </tr>
                ) : detailItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-sm text-slate-500">Tidak ada item jurnal.</td>
                  </tr>
                ) : (
                  detailItems.map((item, index) => {
                    const selectedCoa = coaOptions.find((option) => option.id === item.coa_id)?.label ?? "-";
                    return (
                      <tr key={`${item.id ?? "detail"}-${index}`}>
                        <td className="px-3 py-2 text-slate-700">{selectedCoa}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(Number(item.debit) || 0)}</td>
                        <td className="px-3 py-2 text-right text-slate-700">{formatCurrency(Number(item.kredit) || 0)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Hapus Jurnal"
        description="Apakah Anda yakin ingin menghapus jurnal ini? Semua item jurnal akan terhapus otomatis." 
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
