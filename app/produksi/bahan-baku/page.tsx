"use client";

import { useState, useMemo } from "react";
import { Plus, Edit3, Trash2, ArrowLeftRight, Check, X, Package, Printer } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { exportToPDF } from "@/lib/utils/export-pdf";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
import {
  useBahanBaku,
  useInsertBahanBaku,
  useUpdateBahanBaku,
  useDeleteBahanBaku,
} from "@/lib/supabase/hooks/use-bahan-baku";
import type { MBahanBaku } from "@/types/supabase";
import { useAuth } from "@/lib/supabase/auth-context";
import LinkNext from "next/link";

const CRUD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50";
const CRUD_CANCEL_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:opacity-50";

export default function BahanBakuPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Hooks
  const { data: items, loading, error, meta, refresh } = useBahanBaku({
    page,
    limit: 100,
    search: searchTerm,
  });

  const { insert, loading: isInserting } = useInsertBahanBaku();
  const { update, loading: isUpdating } = useUpdateBahanBaku();
  const { remove, loading: isDeleting } = useDeleteBahanBaku();

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<MBahanBaku | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    kode_bahan: "",
    nama_bahan: "",
    kategori: "",
    satuan: "",
    minimum_stok: "0",
    status_aktif: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const openAddModal = () => {
    setEditData(null);
    setFormData({
      kode_bahan: "",
      nama_bahan: "",
      kategori: "",
      satuan: "",
      minimum_stok: "0",
      status_aktif: true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: MBahanBaku) => {
    setEditData(item);
    setFormData({
      kode_bahan: item.kode_bahan,
      nama_bahan: item.nama_bahan,
      kategori: item.kategori ?? "",
      satuan: item.satuan,
      minimum_stok: String(item.minimum_stok),
      status_aktif: item.status_aktif,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      kode_bahan: formData.kode_bahan,
      nama_bahan: formData.nama_bahan,
      kategori: formData.kategori || null,
      satuan: formData.satuan,
      minimum_stok: Number(formData.minimum_stok),
      status_aktif: formData.status_aktif,
    };

    let result;
    if (editData) {
      result = await update(editData.id, payload);
    } else {
      result = await insert(payload);
    }

    if (result) {
      setIsFormModalOpen(false);
      refresh();
    } else {
      setFormError("Gagal menyimpan data bahan baku. Pastikan kode bahan baku belum digunakan.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const success = await remove(deleteId);
    if (success) {
      setIsDeleteModalOpen(false);
      refresh();
    } else {
      alert("Gagal menghapus bahan baku. Bahan baku ini mungkin sedang digunakan dalam produksi.");
    }
  };

  const handleExportPDF = () => {
    const data = searchTerm ? items : items;
    exportToPDF({
      title: "Master Bahan Baku",
      subtitle: "Daftar katalog bahan baku produksi",
      headers: ["Kode Bahan", "Nama Bahan", "Kategori", "Stok", "Min. Stok", "Satuan", "Status"],
      rows: data.map((item) => [
        item.kode_bahan,
        item.nama_bahan,
        item.kategori || "-",
        String(item.stok),
        String(item.minimum_stok),
        item.satuan,
        item.status_aktif ? "Aktif" : "Nonaktif",
      ]),
      columnStyles: {
        0: { cellWidth: 28 },
      },
      summary: [
        { label: "Total Bahan Baku", value: `${meta.total} item` },
        { label: "Aktif", value: `${data.filter((i) => i.status_aktif).length} item` },
        { label: "Stok Tipis", value: `${data.filter((i) => i.stok <= i.minimum_stok).length} item` },
      ],
      fileName: "Master_Bahan_Baku_PT_Doa_Suryo_Agong.pdf",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Master Bahan Baku</h1>
          <p className="text-sm text-slate-300">
            Kelola data katalog bahan baku produksi dan minimum ambang batas stok.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPDF}
            disabled={loading || items.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF
          </button>
          <LinkNext
            href="/produksi/mutasi"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Kelola Stok (Mutasi)
          </LinkNext>
          <button onClick={openAddModal} className={CRUD_PRIMARY_BUTTON_CLASS}>
            <Plus className="h-4 w-4" />
            Tambah Bahan Baku
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <SearchBar
          placeholder="Cari kode atau nama..."
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          className="w-full sm:w-80"
        />
      </section>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Kode Bahan</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Bahan</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Kategori</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Stok</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Min. Stok</th>
                <th className="w-24 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Satuan</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={8}>
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={8}>
                    Belum ada data bahan baku.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow = item.stok <= item.minimum_stok;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono font-semibold text-slate-800">{item.kode_bahan}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 font-semibold">{item.nama_bahan}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.kategori || "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm">
                        <span className={`font-semibold ${isLow ? "text-rose-600 flex items-center gap-1" : "text-emerald-600"}`}>
                          {item.stok}
                          {isLow && (
                            <span className="inline-flex rounded bg-rose-50 px-1 py-0.5 text-[9px] font-bold text-rose-600 uppercase border border-rose-100">
                              Tipis
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.minimum_stok}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.satuan}</td>
                      <td className="px-4 md:px-6 py-3">
                        {item.status_aktif ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                            <Check className="h-3 w-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                            <X className="h-3 w-3" /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <RowActions>
                          <EditButton onClick={() => openEditModal(item)} />
                          <DeleteButton onClick={() => openDeleteModal(item.id)} />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {meta.total > meta.limit && (
        <section className="flex justify-end gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            disabled={page * meta.limit >= meta.total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </section>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editData ? "Edit Bahan Baku" : "Tambah Bahan Baku Baru"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Kode Bahan Baku *</label>
            <input
              required
              placeholder="Contoh: BB-001"
              value={formData.kode_bahan}
              onChange={(e) => setFormData((p) => ({ ...p, kode_bahan: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nama Bahan Baku *</label>
            <input
              required
              placeholder="Contoh: Kain Katun Premium"
              value={formData.nama_bahan}
              onChange={(e) => setFormData((p) => ({ ...p, nama_bahan: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Kategori</label>
            <input
              placeholder="Contoh: Tekstil, Benang, Kemasan"
              value={formData.kategori}
              onChange={(e) => setFormData((p) => ({ ...p, kategori: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Satuan *</label>
              <input
                required
                placeholder="Contoh: meter, pcs, kg"
                value={formData.satuan}
                onChange={(e) => setFormData((p) => ({ ...p, satuan: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Ambang Min. Stok</label>
              <input
                required
                type="number"
                min={0}
                value={formData.minimum_stok}
                onChange={(e) => setFormData((p) => ({ ...p, minimum_stok: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="status_aktif"
              type="checkbox"
              checked={formData.status_aktif}
              onChange={(e) => setFormData((p) => ({ ...p, status_aktif: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="status_aktif" className="text-sm text-slate-700 font-medium">Bahan Baku Aktif</label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isInserting || isUpdating}
              className={CRUD_CANCEL_BUTTON_CLASS}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isInserting || isUpdating}
              className={CRUD_PRIMARY_BUTTON_CLASS}
            >
              {isInserting || isUpdating ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Hapus Bahan Baku"
        description="Apakah Anda yakin ingin menghapus bahan baku ini dari master data?"
        confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
