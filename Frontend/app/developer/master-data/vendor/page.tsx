'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Truck, Save, Search, Edit, Trash2, PlusCircle, ChevronRight } from 'lucide-react';

interface Vendor {
  id: string;
  nama_vendor: string;
  kontak: string;
  created_at: string;
}

const DUMMY_VENDORS: Vendor[] = [
  { id: 'vnd-001', nama_vendor: 'PT. Sinar Abadi Tekstil', kontak: '021-5501234', created_at: '2026-01-10' },
  { id: 'vnd-002', nama_vendor: 'CV. Maju Bersama', kontak: '0812-3456-7890', created_at: '2026-02-03' },
  { id: 'vnd-003', nama_vendor: 'UD. Karya Sentosa', kontak: 'karya@sentosa.id', created_at: '2026-03-01' },
];

export default function VendorPage() {
  const [namaVendor, setNamaVendor] = useState('');
  const [kontak, setKontak] = useState('');
  const [vendorList, setVendorList] = useState<Vendor[]>(DUMMY_VENDORS);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setNamaVendor('');
    setKontak('');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setVendorList((prev) =>
        prev.map((v) =>
          v.id === editingId ? { ...v, nama_vendor: namaVendor, kontak } : v
        )
      );
    } else {
      setVendorList((prev) => [
        {
          id: `vnd-${Date.now()}`,
          nama_vendor: namaVendor,
          kontak,
          created_at: new Date().toISOString().split('T')[0],
        },
        ...prev,
      ]);
    }
    resetForm();
  };

  const handleEdit = (v: Vendor) => {
    setEditingId(v.id);
    setNamaVendor(v.nama_vendor);
    setKontak(v.kontak);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) =>
    setVendorList((prev) => prev.filter((v) => v.id !== id));

  const filtered = vendorList.filter(
    (v) =>
      v.nama_vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.kontak.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/developer" className="hover:text-slate-300 text-slate-100 transition-colors">Developer</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link href="/developer/master-data" className="hover:text-slate-300 text-slate-100 transition-colors">Master Data</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-blue-300 font-medium">Vendor</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Truck size={18} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Master Data: Vendor</h2>
            <p className="text-sm text-slate-200 mt-0.5">Kelola data vendor &amp; supplier yang terdaftar di sistem.</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? 'Edit Vendor' : 'Tambah Vendor Baru'}
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
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nama Vendor <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={namaVendor}
              onChange={(e) => setNamaVendor(e.target.value)}
              required
              placeholder="contoh: PT. Sinar Abadi Tekstil"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-500 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Kontak <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              required
              placeholder="contoh: 0812-3456-7890 atau email@vendor.com"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-slate-200/20 focus:border-slate-500 text-sm outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-200 transition-all"
            >
              <Save size={17} />
              {editingId ? 'Simpan Perubahan' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </section>

      {/* Table Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Vendor</h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              {filtered.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama vendor atau kontak..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-200 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200/20 focus:border-slate-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama Vendor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Kontak</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Terdaftar</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada vendor yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{v.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{v.nama_vendor}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{v.kontak}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{v.created_at}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(v)}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#BC934B] hover:bg-yellow-50 transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Hapus Vendor"
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
            Menampilkan {filtered.length} dari {vendorList.length} vendor
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
