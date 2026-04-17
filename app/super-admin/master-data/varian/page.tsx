"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Tag,
  Save,
  Search,
  Edit,
  Trash2,
  PackageOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import type { MVarian } from "@/types/supabase";
import {
  useVariants,
  useInsertVariant,
  useUpdateVariant,
  useDeleteVariant,
} from "@/lib/supabase/hooks/index";
import { useProducts } from "@/lib/supabase/hooks/use-products";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

export default function VarianPage() {
  const [productId, setProductId] = useState("");
  const [namaVarian, setNamaVarian] = useState("");
  const [sku, setSku] = useState("");
  const [harga, setHarga] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Delete confirm state ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // ── Supabase Direct ──
  const { data: varianList, loading: isLoading, error: variantReadError, refresh: refreshVariants } = useVariants();
  const { data: produkList, error: productReadError } = useProducts();
  const { insert } = useInsertVariant();
  const { update } = useUpdateVariant();
  const { remove } = useDeleteVariant();

  const productNameById = useMemo(
    () => new Map(produkList.map((produk) => [produk.id, produk.nama_produk])),
    [produkList],
  );

  const resetForm = () => {
    setProductId("");
    setNamaVarian("");
    setSku("");
    setHarga("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const hargaNumber = Number(harga);
      if (Number.isNaN(hargaNumber)) {
        throw new Error("Harga harus berupa angka yang valid.");
      }

      if (editingId) {
        const result = await update(editingId, {
          product_id: productId,
          nama_varian: namaVarian,
          sku,
          harga: hargaNumber,
        });
        if (!result) throw new Error("Gagal update varian.");
      } else {
        const result = await insert({
          product_id: productId,
          nama_varian: namaVarian,
          sku,
          harga: hargaNumber,
        });
        if (!result) throw new Error("Gagal membuat varian.");
      }

      refreshVariants();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan varian gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (variant: MVarian) => {
    setEditingId(variant.id);
    setProductId(variant.product_id ?? "");
    setNamaVarian(variant.nama_varian ?? "");
    setSku(variant.sku ?? "");
    setHarga(String(variant.harga ?? ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (variant: MVarian) => {
    setDeleteTargetId(variant.id);
    setDeleteTargetName(variant.nama_varian ?? variant.sku ?? "varian ini");
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteTargetName("");
  };

  const handleDelete = async () => {
    if (!deleteTargetId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await remove(deleteTargetId);
      if (!success) throw new Error("Gagal menghapus varian.");
      refreshVariants();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus varian.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteDialog();
    }
  };

  const filteredVarian = useMemo(
    () =>
      varianList.filter((variant) => {
        const productName = productNameById.get(variant.product_id ?? "") ?? "";
        return (
          (variant.sku ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (variant.nama_varian ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          productName.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }),
    [productNameById, searchQuery, varianList],
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* ── PAGE HEADER ── */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/super-admin" className="hover:text-slate-300 text-slate-100 transition-colors">Super Admin</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link href="/super-admin/master-data" className="hover:text-slate-300 text-slate-100 transition-colors">Master Data</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-orange-300 font-medium">Varian</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
            <Tag size={18} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Master Data: Varian Produk</h2>
            <p className="text-sm text-slate-200 mt-0.5">Kelola data varian SKU yang terhubung ke produk induk.</p>
          </div>
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Tag size={18} className="text-orange-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? 'Edit Varian' : 'Tambah Varian Baru'}
          </h3>
          {editingId && (
            <span className="ml-auto text-xs text-slate-400 cursor-pointer hover:text-red-500 transition-colors" onClick={resetForm}>
              Batal Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Produk Induk */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Produk Induk <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full appearance-none px-4 py-3 pr-10 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
              >
                <option value="">Pilih produk induk</option>
                {produkList.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.nama_produk}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          {/* Nama Varian */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nama Varian <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaVarian}
              onChange={(e) => setNamaVarian(e.target.value)}
              required
              placeholder="contoh: Merah - XL"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              SKU <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              placeholder="contoh: TS-MRH-XL"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all font-mono"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Harga <span className="text-red-400">*</span>
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm font-semibold text-slate-500">
                Rp
              </span>
              <input
                type="number"
                min={0}
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                required
                placeholder="85000"
                className="flex-1 px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-r-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-100 transition-all"
            >
              <Save size={17} />
              {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Varian"}
            </button>
          </div>

        </form>
      </section>

      {/* ── TABLE CARD ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {variantReadError || productReadError ? (
          <p className="px-5 pt-5 text-sm text-rose-600">
            Gagal memuat data varian: {variantReadError ?? productReadError}
          </p>
        ) : null}

        {/* Table Header Bar */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <PackageOpen size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Varian</h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              {filteredVarian.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, varian, produk..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-200 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKU</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama Produk</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama Varian</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Harga</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredVarian.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada data varian yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredVarian.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-700">{v.sku ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{productNameById.get(v.product_id ?? "") ?? "-"}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{v.nama_varian ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatRupiah(v.harga ?? 0)}</td>
                    <td className="px-6 py-4 text-right">
                      <RowActions>
                        <EditButton onClick={() => handleEdit(v)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteDialog(v)} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Menampilkan {filteredVarian.length} dari {varianList.length} varian
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Sebelumnya
            </button>
            <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Berikutnya
            </button>
          </div>
        </div>

      </section>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Hapus Varian Produk"
        description={`Apakah kamu yakin ingin menghapus varian "${deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
