"use client";

import React, { useState } from "react";
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

interface Produk {
  id: string;
  nama_produk: string;
  kategori: string;
  created_at: string;
}

const KATEGORI_LIST = [
  "Pakaian",
  "Aksesoris",
  "Sepatu",
  "Tas",
  "Elektronik",
  "Lainnya",
];

const DUMMY_PRODUK: Produk[] = [
  {
    id: "prd-001",
    nama_produk: "Kaos Polo Classic",
    kategori: "Pakaian",
    created_at: "2026-01-10",
  },
  {
    id: "prd-002",
    nama_produk: "Hoodie Premium",
    kategori: "Pakaian",
    created_at: "2026-02-03",
  },
  {
    id: "prd-003",
    nama_produk: "Topi Snapback",
    kategori: "Aksesoris",
    created_at: "2026-03-01",
  },
];

export default function ProdukPage() {
  const [namaProduk, setNamaProduk] = useState("");
  const [kategori, setKategori] = useState("");
  const [produkList, setProdukList] = useState<Produk[]>(DUMMY_PRODUK);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNamaProduk("");
    setKategori("");
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setProdukList((prev) =>
        prev.map((p) =>
          p.id === editingId ? { ...p, nama_produk: namaProduk, kategori } : p,
        ),
      );
    } else {
      setProdukList((prev) => [
        {
          id: `prd-${Date.now()}`,
          nama_produk: namaProduk,
          kategori,
          created_at: new Date().toISOString().split("T")[0],
        },
        ...prev,
      ]);
    }
    resetForm();
  };

  const handleEdit = (p: Produk) => {
    setEditingId(p.id);
    setNamaProduk(p.nama_produk);
    setKategori(p.kategori);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) =>
    setProdukList((prev) => prev.filter((p) => p.id !== id));

  const filtered = produkList.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kategori.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
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

      {/* Form Card */}
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
                  — Pilih Kategori —
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
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-100 transition-all"
            >
              <Save size={17} />
              {editingId ? "Simpan Perubahan" : "Save Product"}
            </button>
          </div>
        </form>
      </section>

      {/* Table Card */}
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
              {filtered.length === 0 ? (
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
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {p.created_at}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-2 rounded-lg text-orange-300 hover:text-orange-400 hover:bg-yellow-50 transition-colors"
                          title="Edit Produk"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
