"use client";
import { SearchBar } from "@/components/ui/search-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  Save,
  Search,
  Edit,
  Trash2,
  PlusCircle,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  X,
} from "lucide-react";
import type { MProduk } from "@/types/supabase";
import {
  useProducts,
  useInsertProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "@/lib/supabase/hooks/index";
import {
  uploadProdukFoto,
  extractStoragePath,
} from "@/lib/utils/upload-produk-foto";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";

const KATEGORI_LIST = [
  "Pakaian",
  "Aksesoris",
  "Sepatu",
  "Tas",
  "Elektronik",
  "Lainnya",
];

export default function ProdukPage() {
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ── Delete confirm state ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // ── Foto state ──
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [existingFotoUrl, setExistingFotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Supabase Direct: read products ──
  const { data: produkList, loading: isLoading, error: readError, refresh } = useProducts();

  // ── Supabase Direct: mutations ──
  const { insert } = useInsertProduct();
  const { update } = useUpdateProduct();
  const { remove } = useDeleteProduct();

  const handleFotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  }, []);

  const handleRemoveFoto = useCallback(() => {
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const resetForm = useCallback(() => {
    setNamaProduk("");
    setKategori("");
    setEditingId(null);
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      let fotoUrl: string | null = existingFotoUrl ?? null;

      // Upload new foto if selected
      if (fotoFile) {
        setIsUploading(true);
        const oldPath = existingFotoUrl
          ? extractStoragePath(existingFotoUrl)
          : null;
        fotoUrl = await uploadProdukFoto(fotoFile, oldPath);
        setIsUploading(false);
      }

      const payload = { nama_produk: namaProduk, kategori, foto_url: fotoUrl };

      if (editingId) {
        const result = await update(editingId, payload);
        if (!result) throw new Error("Gagal update produk.");
      } else {
        const result = await insert(payload);
        if (!result) throw new Error("Gagal membuat produk.");
      }

      refresh();
      resetForm();
    } catch (error) {
      setIsUploading(false);
      const message = error instanceof Error ? error.message : "Operasi simpan produk gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p: MProduk) => {
    setEditingId(p.id);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori ?? "");
    setFotoFile(null);
    setFotoPreview(null);
    setExistingFotoUrl(p.foto_url ?? null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (p: MProduk) => {
    setDeleteTargetId(p.id);
    setDeleteTargetName(p.nama_produk ?? "produk ini");
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
      if (!success) throw new Error("Gagal menghapus produk.");
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus produk.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteDialog();
    }
  };

  const filtered = useMemo(
    () =>
      produkList.filter(
        (p) =>
          p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.kategori ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [produkList, searchQuery],
  );

  // The preview to show in the form — new file takes priority over existing URL
  const displayPreview = fotoPreview ?? existingFotoUrl ?? null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link
            href="/admin"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Admin
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link
            href="/admin/master-data"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Master Data
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-emerald-300 font-medium">Produk</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Master Data: Produk Induk
            </h2>
            <p className="text-sm text-slate-200 mt-0.5">
              Kelola produk utama sebelum dibentuk menjadi varian SKU.
            </p>
          </div>
        </div>
      </div>

      {/* ── Form Section ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h3>
          {editingId && (
            <span
              className="ml-auto text-xs text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
              onClick={resetForm}
            >
              Batal Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nama Produk <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaProduk}
              onChange={(e) => setNamaProduk(e.target.value)}
              required
              placeholder="contoh: Kaos Polo Classic"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Kategori <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                required
                className="w-full appearance-none px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all cursor-pointer"
              >
                <option value="" disabled>
                  - Pilih Kategori -
                </option>
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
              />
            </div>
          </div>

          {/* Foto Produk — full width */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Foto Produk <span className="text-slate-400 normal-case font-normal">(opsional)</span>
            </label>

            <div className="flex items-start gap-4">
              {/* Preview box */}
              <div className="relative flex-shrink-0 w-28 h-28 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center group">
                {displayPreview ? (
                  <>
                    <Image
                      src={displayPreview}
                      alt="Preview foto produk"
                      fill
                      className="object-cover"
                      sizes="112px"
                      unoptimized={displayPreview.startsWith("blob:")}
                    />
                    {/* Remove overlay */}
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      title="Hapus foto"
                    >
                      <X size={20} className="text-white" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <ImagePlus size={24} />
                    <span className="text-[10px]">Belum ada foto</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFotoChange}
                  id="foto-produk-input"
                />
                <label
                  htmlFor="foto-produk-input"
                  className="inline-flex items-center gap-2 cursor-pointer rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <ImagePlus size={15} />
                  {displayPreview ? "Ganti Foto" : "Pilih Foto"}
                </label>

                {displayPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <X size={15} />
                    Hapus Foto
                  </button>
                )}

                <p className="text-xs text-slate-400 mt-1">
                  Format: JPG, PNG, WEBP. Maks 5 MB.
                </p>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-100 transition-all"
            >
              <Save size={17} />
              {isUploading
                ? "Mengunggah foto..."
                : isSubmitting
                  ? "Menyimpan..."
                  : editingId
                    ? "Simpan Perubahan"
                    : "Save Product"}
            </button>
          </div>
        </form>
      </section>

      {/* ── Table Section ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {readError ? (
          <p className="px-5 pt-5 text-sm text-rose-600">Gagal memuat data produk: {readError}</p>
        ) : null}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Produk Induk
            </h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              {filtered.length}
            </span>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama produk atau kategori..."
            className="w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Foto
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Nama Produk
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Kategori
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  Ditambahkan
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Tidak ada produk yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Foto thumbnail */}
                    <td className="px-6 py-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                        {p.foto_url ? (
                          <Image
                            src={p.foto_url}
                            alt={p.nama_produk}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <Package size={18} className="text-slate-300" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {p.nama_produk}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                        {p.kategori ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {p.created_at ? p.created_at.split("T")[0] : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActions>
                        <EditButton onClick={() => handleEdit(p)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteDialog(p)} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Menampilkan {filtered.length} dari {produkList.length} produk
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
        title="Hapus Produk"
        description={`Apakah kamu yakin ingin menghapus produk "${deleteTargetName}"? Semua varian terkait mungkin juga terpengaruh.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
