'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Save, Search, Edit, Trash2, ChevronDown, PackageOpen, ChevronRight } from 'lucide-react';

// Simulasi data produk induk (nantinya dari Supabase core.m_produk)
const PRODUK_LIST = [
  { id: 'p-001', nama_produk: 'Kaos Polo Classic' },
  { id: 'p-002', nama_produk: 'Hoodie Premium' },
  { id: 'p-003', nama_produk: 'Topi Snapback' },
  { id: 'p-004', nama_produk: 'Celana Chino Slim' },
];

// Simulasi data varian (nantinya dari Supabase core.m_varian)
const DUMMY_VARIAN = [
  { id: 'v-001', product_id: 'p-001', nama_produk: 'Kaos Polo Classic', nama_varian: 'Putih - M', sku: 'KPC-WHT-M', harga: 85000 },
  { id: 'v-002', product_id: 'p-001', nama_produk: 'Kaos Polo Classic', nama_varian: 'Merah - XL', sku: 'KPC-RED-XL', harga: 85000 },
  { id: 'v-003', product_id: 'p-002', nama_produk: 'Hoodie Premium', nama_varian: 'Hitam - L', sku: 'HP-BLK-L', harga: 235000 },
  { id: 'v-004', product_id: 'p-003', nama_produk: 'Topi Snapback', nama_varian: 'Navy - One Size', sku: 'TS-NVY-OS', harga: 120000 },
];

interface Varian {
  id: string;
  product_id: string;
  nama_produk: string;
  nama_varian: string;
  sku: string;
  harga: number;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

export default function VarianPage() {
  // --- Form State ---
  const [productId, setProductId] = useState('');
  const [namaVarian, setNamaVarian] = useState('');
  const [sku, setSku] = useState('');
  const [harga, setHarga] = useState('');

  // --- Table State ---
  const [varianList, setVarianList] = useState<Varian[]>(DUMMY_VARIAN);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setProductId('');
    setNamaVarian('');
    setSku('');
    setHarga('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const namaProdukterpilih = PRODUK_LIST.find((p) => p.id === productId)?.nama_produk ?? '';

    if (editingId) {
      // UPDATE
      setVarianList((prev) =>
        prev.map((v) =>
          v.id === editingId
            ? { ...v, product_id: productId, nama_produk: namaProdukterpilih, nama_varian: namaVarian, sku, harga: Number(harga) }
            : v
        )
      );
    } else {
      // INSERT
      const newVarian: Varian = {
        id: `v-${Date.now()}`,
        product_id: productId,
        nama_produk: namaProdukterpilih,
        nama_varian: namaVarian,
        sku,
        harga: Number(harga),
      };
      setVarianList((prev) => [newVarian, ...prev]);
    }

    resetForm();
  };

  const handleEdit = (v: Varian) => {
    setEditingId(v.id);
    setProductId(v.product_id);
    setNamaVarian(v.nama_varian);
    setSku(v.sku);
    setHarga(String(v.harga));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
    setVarianList((prev) => prev.filter((v) => v.id !== id));
  };

  const filteredVarian = varianList.filter(
    (v) =>
      v.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nama_varian.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nama_produk.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* â”€â”€ PAGE HEADER â”€â”€ */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/developer" className="hover:text-slate-300 text-slate-100 transition-colors">Developer</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link href="/developer/master-data" className="hover:text-slate-300 text-slate-100 transition-colors">Master Data</Link>
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

      {/* â”€â”€ FORM CARD â”€â”€ */}
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
              Nama Varian <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaVarian}
              onChange={(e) => setNamaVarian(e.target.value)}
              required
              placeholder="contoh: Kaos Polos"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-200 text-sm outline-none transition-all"
            />
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
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-100 transition-all"
            >
              <Save size={17} />
              {editingId ? 'Simpan Perubahan' : 'Tambah Varian'}
            </button>
          </div>

        </form>
      </section>

      {/* â”€â”€ TABLE CARD â”€â”€ */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

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
              {filteredVarian.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada data varian yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredVarian.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-semibold text-slate-700">{v.sku}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{v.nama_produk}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{v.nama_varian}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{formatRupiah(v.harga)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(v)}
                          className="p-2 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                          title="Edit Varian"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus Varian"
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
    </div>
  );
}

