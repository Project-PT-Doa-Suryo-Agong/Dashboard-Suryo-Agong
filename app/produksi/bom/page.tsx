"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Check, X, Printer, ListTree, Package } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import { exportToPDF } from "@/lib/utils/export-pdf";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
import {
  useBom,
  useBomDetail,
  useInsertBom,
  useUpdateBom,
  useDeleteBom,
} from "@/lib/supabase/hooks/use-bom";
import type { BomDetailItemRow } from "@/lib/supabase/hooks/use-bom";
import { useBahanBaku } from "@/lib/supabase/hooks/use-bahan-baku";
import { useProducts } from "@/lib/supabase/hooks/use-products";
import type { MBom } from "@/types/supabase";

const CRUD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50";
const CRUD_CANCEL_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:opacity-50";

type BomItemForm = {
  bahan_baku_id: string;
  qty_per_unit: string;
};

export default function BomPage() {
  const { data: items, loading, error, meta, refresh } = useBom({ page: 1, limit: 100 });
  const { data: bahanBakuList } = useBahanBaku({ limit: 500, statusAktif: true });
  const { data: produkList } = useProducts({ page: 1, limit: 200 });

  const { insert, loading: isInserting, error: insertError } = useInsertBom();
  const { update, loading: isUpdating, error: updateError } = useUpdateBom();
  const { remove, loading: isDeleting } = useDeleteBom();
  const { loading: isLoadingDetail, refresh: fetchDetail } = useBomDetail(null);

  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<MBom | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    product_id: "",
    nama_resep: "",
    status_aktif: true,
    items: [] as BomItemForm[],
  });

  const [formError, setFormError] = useState<string | null>(null);

  const productNameById = useMemo(
    () => Object.fromEntries(produkList.map((p) => [p.id, p.nama_produk])) as Record<string, string>,
    [produkList]
  );

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      const productName = (item.m_produk?.nama_produk ?? "").toLowerCase();
      const resepName = (item.nama_resep ?? "").toLowerCase();
      return productName.includes(normalized) || resepName.includes(normalized);
    });
  }, [items, searchTerm]);

  const resetForm = () => {
    setFormData({
      product_id: produkList[0]?.id ?? "",
      nama_resep: "",
      status_aktif: true,
      items: [],
    });
    setFormError(null);
  };

  const openAddModal = () => {
    setEditData(null);
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = async (item: MBom) => {
    setEditData(item);
    setFormError(null);
    setFormData({
      product_id: item.product_id,
      nama_resep: item.nama_resep ?? "",
      status_aktif: item.status_aktif,
      items: [],
    });
    setIsFormModalOpen(true);

    const detail = await fetchDetail(item.id);
    if (detail.bom?.id === item.id) {
      setFormData((prev) => ({
        ...prev,
        items: (detail.items ?? []).map((it: BomDetailItemRow) => ({
          bahan_baku_id: it.bahan_baku_id,
          qty_per_unit: String(it.qty_per_unit),
        })),
      }));
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.product_id) {
      setFormError("Produk wajib dipilih.");
      return;
    }
    if (formData.items.length === 0) {
      setFormError("Resep wajib memiliki minimal satu bahan baku.");
      return;
    }
    for (const item of formData.items) {
      if (!item.bahan_baku_id || Number(item.qty_per_unit) <= 0) {
        setFormError("Pastikan setiap bahan baku terisi dan qty/unit lebih dari 0.");
        return;
      }
    }

    const payload = {
      product_id: formData.product_id,
      nama_resep: formData.nama_resep || null,
      status_aktif: formData.status_aktif,
      items: formData.items.map((item) => ({
        bahan_baku_id: item.bahan_baku_id,
        qty_per_unit: Number(item.qty_per_unit),
      })),
    };

    let result: MBom | null;
    if (editData) {
      result = await update(editData.id, payload);
    } else {
      result = await insert(payload);
    }

    if (result) {
      setIsFormModalOpen(false);
      refresh();
    } else {
      setFormError(insertError || updateError || "Gagal menyimpan resep (BOM). Produk mungkin sudah memiliki resep.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    const success = await remove(deleteId);
    if (success) {
      setIsDeleteModalOpen(false);
      refresh();
    } else {
      alert("Gagal menghapus resep (BOM).");
    }
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: "Master BOM / Resep Produksi",
      subtitle: "Daftar resep kebutuhan bahan baku per produk",
      headers: ["Produk", "Nama Resep", "Jumlah Bahan", "Status"],
      rows: filteredItems.map((item) => [
        item.m_produk?.nama_produk ?? "-",
        item.nama_resep ?? "-",
        String(item.t_bom_item?.length ?? 0),
        item.status_aktif ? "Aktif" : "Nonaktif",
      ]),
      columnStyles: {
        0: { cellWidth: 60 },
      },
      summary: [
        { label: "Total Resep", value: `${meta.total} item` },
        { label: "Aktif", value: `${filteredItems.filter((i) => i.status_aktif).length} item` },
      ],
      fileName: "Master_BOM_Resep_Produksi_PT_Doa_Suryo_Agong.pdf",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Master BOM / Resep Produksi</h1>
          <p className="text-sm text-slate-300">
            Resep kebutuhan bahan baku per unit produk. Dipakai sebagai pengisi otomatis alokasi bahan pada Production Order.
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
          <button onClick={openAddModal} className={CRUD_PRIMARY_BUTTON_CLASS}>
            <Plus className="h-4 w-4" />
            Tambah Resep
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <SearchBar
          placeholder="Cari produk atau nama resep..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full sm:w-80"
        />
        <p className="text-xs text-slate-400">
          1 produk = 1 resep. Kalkulasi otomatis terjadi saat membuat Production Order.
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                <th className="w-40 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Resep</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Jumlah Bahan</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="w-28 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={5}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={5}>
                    Belum ada data resep (BOM).
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 font-semibold">
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400 shrink-0" />
                        {item.m_produk?.nama_produk ?? "Produk tidak ditemukan"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.nama_resep || "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                        <ListTree className="h-3 w-3" />
                        {item.t_bom_item?.length ?? 0} bahan
                      </span>
                    </td>
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
                        <EditButton onClick={() => void openEditModal(item)} />
                        <DeleteButton onClick={() => openDeleteModal(item.id)} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editData ? "Edit Resep (BOM)" : "Tambah Resep (BOM) Baru"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Produk *</label>
            {editData ? (
              <input
                readOnly
                value={productNameById[editData.product_id] ?? "Produk tidak ditemukan"}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-600"
              />
            ) : (
              <select
                required
                value={formData.product_id}
                onChange={(e) => setFormData((p) => ({ ...p, product_id: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="" disabled>Pilih produk...</option>
                {produkList.map((product) => (
                  <option key={product.id} value={product.id}>{product.nama_produk}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nama Resep</label>
            <input
              placeholder="Contoh: Resep Standar Kain Katun"
              value={formData.nama_resep}
              onChange={(e) => setFormData((p) => ({ ...p, nama_resep: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Bahan Baku per Unit Produk</span>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    items: [...p.items, { bahan_baku_id: "", qty_per_unit: "" }],
                  }))
                }
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Bahan
              </button>
            </div>

            {isLoadingDetail && editData ? (
              <p className="text-xs text-slate-400 italic">Memuat bahan resep...</p>
            ) : formData.items.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada bahan baku pada resep ini.</p>
            ) : (
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      required
                      value={item.bahan_baku_id}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[index].bahan_baku_id = e.target.value;
                        setFormData((p) => ({ ...p, items: updated }));
                      }}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-400"
                    >
                      <option value="" disabled>Pilih bahan baku...</option>
                      {bahanBakuList.map((bahan) => (
                        <option key={bahan.id} value={bahan.id}>
                          {bahan.nama_bahan} ({bahan.kode_bahan}) - {bahan.satuan}
                        </option>
                      ))}
                    </select>
                    <input
                      required
                      type="number"
                      step="any"
                      min={0.0001}
                      placeholder="Qty/unit"
                      value={item.qty_per_unit}
                      onChange={(e) => {
                        const updated = [...formData.items];
                        updated[index].qty_per_unit = e.target.value;
                        setFormData((p) => ({ ...p, items: updated }));
                      }}
                      className="w-24 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs text-slate-800 outline-none transition focus:border-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = formData.items.filter((_, idx) => idx !== index);
                        setFormData((p) => ({ ...p, items: updated }));
                      }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              id="status_aktif"
              type="checkbox"
              checked={formData.status_aktif}
              onChange={(e) => setFormData((p) => ({ ...p, status_aktif: e.target.checked }))}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="status_aktif" className="text-sm text-slate-700 font-medium">Resep Aktif</label>
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
              disabled={isInserting || isUpdating || (isLoadingDetail && !!editData)}
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
        title="Hapus Resep (BOM)"
        description="Apakah Anda yakin ingin menghapus resep (BOM) ini? Order produksi yang sudah dibuat tidak terpengaruh."
        confirmText={isDeleting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
