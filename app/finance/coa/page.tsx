"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Edit, PlusCircle, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { SearchBar } from "@/components/ui/search-bar";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MCOA } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type CoaListPayload = {
  coa: MCOA[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type CoaPayload = {
  coa: MCOA | null;
};

type FormState = {
  kode_akun: string;
  nama_akun: string;
  kategori: MCOA["kategori"];
  is_sub_account: boolean;
  parent_id: string;
};

const categoryOptions: MCOA["kategori"][] = [
  "Aset",
  "Liabilitas",
  "Ekuitas",
  "Pendapatan",
  "Beban",
  "Beban Lain-lain",
  "Pendapatan Lain-lain",
];

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

function formatCategoryBadge(category: MCOA["kategori"]) {
  if (category === "Beban" || category === "Beban Lain-lain") {
    return "bg-rose-50 text-rose-700";
  }
  if (category === "Pendapatan" || category === "Pendapatan Lain-lain") {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-slate-100 text-slate-700";
}

export default function FinanceCoaPage() {
  const [items, setItems] = useState<MCOA[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editData, setEditData] = useState<MCOA | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FormState>({
    kode_akun: "",
    nama_akun: "",
    kategori: "Aset",
    is_sub_account: false,
    parent_id: "",
  });

  const fetchCoa = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/finance/coa?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<CoaListPayload>(response);
      setItems(payload.data.coa ?? []);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal memuat data COA.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchCoa();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.kode_akun.toLowerCase().includes(keyword) ||
        item.nama_akun.toLowerCase().includes(keyword),
    );
  }, [items, searchTerm]);

  const parentOptions = useMemo(() => items.filter((item) => item.id !== editData?.id), [items, editData]);

  const resetForm = () => {
    setFormState({
      kode_akun: "",
      nama_akun: "",
      kategori: "Aset",
      is_sub_account: false,
      parent_id: "",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: MCOA) => {
    setEditData(item);
    setFormState({
      kode_akun: item.kode_akun,
      nama_akun: item.nama_akun,
      kategori: item.kategori,
      is_sub_account: Boolean(item.is_sub_account),
      parent_id: item.parent_id ?? "",
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

    if (!formState.kode_akun.trim() || !formState.nama_akun.trim()) {
      alert("Kode akun dan nama akun wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        kode_akun: formState.kode_akun.trim(),
        nama_akun: formState.nama_akun.trim(),
        kategori: formState.kategori,
        is_sub_account: formState.is_sub_account,
        parent_id: formState.is_sub_account ? formState.parent_id || null : null,
      };

      if (editData) {
        const response = await apiFetch(`/api/finance/coa/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<CoaPayload>(response);
      } else {
        const response = await apiFetch("/api/finance/coa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<CoaPayload>(response);
      }

      await fetchCoa();
      closeFormModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menyimpan data COA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/finance/coa/${deleteId}`, {
        method: "DELETE",
      });
      await parseJsonResponse<null>(response);
      await fetchCoa();
      closeDeleteModal();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Gagal menghapus data COA.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Chart of Accounts</h1>
        <p className="text-sm md:text-base text-slate-300">Kelola COA, sub-akun, dan struktur akun utama.</p>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari kode atau nama akun..."
          className="w-full lg:max-w-lg"
        />
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-600 transition"
        >
          <PlusCircle size={18} />
          Tambah COA
        </button>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Daftar COA</h2>
          <span className="text-xs text-slate-500">{filteredItems.length} data</span>
        </div>
        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kode Akun</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Akun</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Kategori</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Sub Akun</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Parent Akun</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">Memuat data COA...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">Tidak ada COA.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-900 whitespace-nowrap">{item.kode_akun}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700">{item.nama_akun}</td>
                    <td className="px-4 md:px-6 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${formatCategoryBadge(item.kategori)}`}>
                        {item.kategori}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.is_sub_account ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                        {item.is_sub_account ? "Ya" : "Tidak"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700">{item.parent?.kode_akun ? `${item.parent.kode_akun} - ${item.parent.nama_akun}` : "-"}</td>
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

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editData ? "Edit COA" : "Tambah COA"} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kode Akun</label>
            <input
              required
              value={formState.kode_akun}
              onChange={(event) => setFormState((prev) => ({ ...prev, kode_akun: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Contoh: 1101"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nama Akun</label>
            <input
              required
              value={formState.nama_akun}
              onChange={(event) => setFormState((prev) => ({ ...prev, nama_akun: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              placeholder="Contoh: Kas"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kategori</label>
              <select
                required
                value={formState.kategori}
                onChange={(event) => setFormState((prev) => ({ ...prev, kategori: event.target.value as FormState["kategori"] }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sub Akun</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={formState.is_sub_account}
                    onChange={(event) => setFormState((prev) => ({ ...prev, is_sub_account: event.target.checked, parent_id: event.target.checked ? prev.parent_id : "" }))}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Ya, ini sub akun
                </label>
              </div>
            </div>
          </div>

          {formState.is_sub_account && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parent Akun</label>
              <select
                required
                value={formState.parent_id}
                onChange={(event) => setFormState((prev) => ({ ...prev, parent_id: event.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                <option value="" disabled>
                  Pilih parent akun
                </option>
                {parentOptions.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.kode_akun} - {parent.nama_akun}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3">
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
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : editData ? "Perbarui COA" : "Simpan COA"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus COA"
        description="Apakah Anda yakin ingin menghapus akun COA ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
