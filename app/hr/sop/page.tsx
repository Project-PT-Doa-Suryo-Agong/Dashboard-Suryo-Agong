"use client";
import { SearchBar } from "@/components/ui/search-bar";
import { FormEvent, useMemo, useState, useEffect } from "react";
import { FileSpreadsheet, FileText, PlusCircle, Printer, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useSops,
  useInsertSop,
  useUpdateSop,
  useDeleteSop,
} from "@/lib/supabase/hooks";
import type { MSop } from "@/types/supabase";
import { RowActions, EditButton, DeleteButton, DetailButton } from "@/components/ui/RowActions";
import type { CoreUserRole } from "@/types/supabase";
import { exportToPDF } from "@/lib/utils/export-pdf";
import { exportToExcel } from "@/lib/utils/export-excel";

const FALLBACK_DIVISI_OPTIONS: CoreUserRole[] = [
  "Developer",
  "Management & Strategy",
  "Finance & Administration",
  "HR & Operation Manager",
  "Produksi & Quality Control",
  "Logistics & Packing",
  "Creative & Sales",
  "Office Support",
  "Super Admin",
  "Admin",
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function SopPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<MSop | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [detailItem, setDetailItem] = useState<MSop | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState<{ judul: string; divisi: string; konten: string }>({
    judul: "",
    divisi: FALLBACK_DIVISI_OPTIONS[0] ?? "",
    konten: "",
  });

  const { data: sops, loading: isLoadingSops, refresh: refreshSops } = useSops();
  const { insert } = useInsertSop();
  const { update } = useUpdateSop();
  const { remove } = useDeleteSop();

  const isLoading = isLoadingSops;

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return sops;
    return sops.filter((item) => (item.judul ?? "").toLowerCase().includes(keyword));
  }, [sops, searchTerm]);

  const resetForm = () => {
    setFormData({ judul: "", divisi: FALLBACK_DIVISI_OPTIONS[0] ?? "", konten: "" });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: MSop) => {
    setEditData(item);
    setFormData({ judul: item.judul ?? "", divisi: item.divisi ?? FALLBACK_DIVISI_OPTIONS[0] ?? "", konten: item.konten ?? "" });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const openDetailModal = (item: MSop) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  };

  const closeDetailModal = () => {
    setDetailItem(null);
    setIsDetailOpen(false);
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
    if (!formData.judul || formData.judul.trim().length === 0) {
      alert("Judul wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      judul: formData.judul.trim(),
      divisi: formData.divisi || null,
      konten: formData.konten.trim() || null,
    } as Record<string, unknown>;

    try {
      if (editData) {
        const result = await update(editData.id, payload);
        if (!result) throw new Error("Gagal update SOP.");
      } else {
        const result = await insert(payload);
        if (!result) throw new Error("Gagal membuat SOP.");
      }

      refreshSops();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const success = await remove(deleteId);
      if (!success) throw new Error("Gagal menghapus SOP.");
      refreshSops();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus SOP.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  const exportRows = filteredItems;

  const handleExportPDF = () => {
    if (exportRows.length === 0) return;
    exportToPDF({
      title: "Laporan Data SOP",
      headers: ["Judul", "Divisi", "Konten", "Dibuat"],
      rows: exportRows.map((item) => [
        item.judul ?? "-",
        item.divisi ?? "-",
        item.konten ?? "-",
        item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-",
      ]),
      summary: [{ label: "Total SOP", value: `${exportRows.length} dokumen` }],
      fileName: "Laporan_SOP_PT_Doa_Suryo_Agong.pdf",
    });
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }
    void exportToExcel({
      title: "Laporan Data SOP",
      headers: ["Judul", "Divisi", "Konten", "Dibuat"],
      rows: exportRows.map((item) => [
        item.judul ?? "-",
        item.divisi ?? "-",
        item.konten ?? "-",
        item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-",
      ]),
      fileName: `Laporan_SOP_${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen SOP</h1>
        <p className="text-sm md:text-base text-slate-200">Buat, ubah, dan kelola SOP internal perusahaan.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Cari judul SOP..." className="relative w-full sm:max-w-md" />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportPDF}
            disabled={isLoading || filteredItems.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <Printer size={18} />
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isLoading || filteredItems.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            <FileSpreadsheet size={18} />
            Excel
          </button>
          <button type="button" onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95">
            <PlusCircle size={18} />
            Tambah SOP Baru
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Judul</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Divisi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Konten</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Dibuat</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm text-slate-900 font-medium">{item.judul}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.divisi ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    <p className="max-w-xs truncate sm:max-w-sm md:max-w-md">{item.konten ?? "-"}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <RowActions>
                      <DetailButton onClick={() => openDetailModal(item)} />
                      <EditButton onClick={() => openEditModal(item)} />
                      <DeleteButton onClick={() => openDeleteModal(item.id)} />
                    </RowActions>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Data SOP tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editData ? "Edit SOP" : "Buat SOP Baru"} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Judul</label>
            <input required type="text" value={formData.judul} onChange={(e) => setFormData((p) => ({ ...p, judul: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Divisi</span>
              <select required value={formData.divisi} onChange={(e) => setFormData((p) => ({ ...p, divisi: e.target.value }))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20">
                {FALLBACK_DIVISI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Konten</label>
              <textarea rows={6} value={formData.konten} onChange={(e) => setFormData((p) => ({ ...p, konten: e.target.value }))} placeholder="Tuliskan isi SOP..." className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20" />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={closeFormModal} disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDetailOpen} onClose={closeDetailModal} title={detailItem?.judul ?? "Detail SOP"} maxWidth="max-w-2xl">
        <div className="space-y-3">
          <p className="text-sm text-slate-700 whitespace-pre-line">{detailItem?.konten ?? "-"}</p>
          <p className="text-xs text-slate-500">Divisi: {detailItem?.divisi ?? "-"}</p>
          <p className="text-xs text-slate-500">Dibuat: {detailItem?.created_at ? dateFormatter.format(new Date(detailItem.created_at)) : "-"}</p>
        </div>
      </Modal>

      <ConfirmDialog isOpen={isDeleteModalOpen} onClose={closeDeleteModal} onConfirm={handleConfirmDelete} title="Hapus SOP" description="Yakin ingin menghapus SOP ini?" confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"} cancelText="Batal" variant="danger" />
    </div>
  );
}
