"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Save,
  Search,
  Edit,
  Trash2,
  PlusCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { MProduk } from "@/types/supabase";
import type { ApiError, ApiSuccess } from "@/types/api";

type ProdukItem = MProduk;

type ProductsListPayload = {
  produk: ProdukItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type ProductPayload = {
  produk: ProdukItem | null;
};

const KATEGORI_LIST = [
  "Pakaian",
  "Aksesoris",
  "Sepatu",
  "Tas",
  "Elektronik",
  "Lainnya",
];

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

export default function ProdukPage() {
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [produkList, setProdukList] = useState<ProdukItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNamaProduk("");
    setKategori("");
    setEditingId(null);
  };

  const fetchProduk = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/core/products?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ProductsListPayload>(response);
      setProdukList(payload.data.produk ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data produk.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProduk();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const response = await fetch(`/api/core/products/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_produk: namaProduk, kategori }),
        });
        await parseJsonResponse<ProductPayload>(response);
      } else {
        const response = await fetch("/api/core/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_produk: namaProduk, kategori }),
        });
        await parseJsonResponse<ProductPayload>(response);
      }

      await fetchProduk();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan produk gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (p: ProdukItem) => {
    setEditingId(p.id);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/core/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchProduk();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus produk.";
      alert(message);
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link
            href="/developer"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Developer
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link
            href="/developer/master-data"
            className="hover:text-slate-300 text-slate-100 transition-colors"
          >
            Master Data
          </Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-emerald-300 font-medium">Produk</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Package size={18} className="text-emerald-500" />
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

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-slate-400" />
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

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
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

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-100 transition-all"
            >
              <Save size={17} />
              {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Save Product"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Produk Induk
            </h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              {filtered.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama produk atau kategori..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-200 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                  ID
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
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      {p.id}
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
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-orange-300 hover:text-orange-400 hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Edit Produk"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => void handleDelete(p.id)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Hapus Produk"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
    </div>
  );
}
