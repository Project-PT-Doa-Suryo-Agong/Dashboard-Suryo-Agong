"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Save,
  Search,
  Edit,
  Trash2,
  PlusCircle,
  ChevronRight,
} from "lucide-react";
import type { MVendor } from "@/types/supabase";
import type { ApiError, ApiSuccess } from "@/types/api";

type VendorItem = MVendor;

type VendorsListPayload = {
  vendor: VendorItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type VendorPayload = {
  vendor: VendorItem | null;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

export default function VendorPage() {
  const [namaVendor, setNamaVendor] = useState("");
  const [kontak, setKontak] = useState("");
  const [vendorList, setVendorList] = useState<VendorItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setNamaVendor("");
    setKontak("");
    setEditingId(null);
  };

  const fetchVendor = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/core/vendors?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VendorsListPayload>(response);
      setVendorList(payload.data.vendor ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data vendor.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchVendor();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const response = await fetch(`/api/core/vendors/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_vendor: namaVendor, kontak }),
        });
        await parseJsonResponse<VendorPayload>(response);
      } else {
        const response = await fetch("/api/core/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_vendor: namaVendor, kontak }),
        });
        await parseJsonResponse<VendorPayload>(response);
      }

      await fetchVendor();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan vendor gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (vendor: VendorItem) => {
    setEditingId(vendor.id);
    setNamaVendor(vendor.nama_vendor ?? "");
    setKontak(vendor.kontak ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/core/vendors/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchVendor();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus vendor.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(
    () =>
      vendorList.filter(
        (vendor) =>
          (vendor.nama_vendor ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (vendor.kontak ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, vendorList],
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
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-200 transition-all"
            >
              <Save size={17} />
              {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Save Vendor"}
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
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada vendor yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{v.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{v.nama_vendor ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{v.kontak ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{v.created_at ? v.created_at.split("T")[0] : "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(v)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-slate-400 hover:text-[#BC934B] hover:bg-yellow-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit size={15} />
                        </button>
                        <button
                          onClick={() => void handleDelete(v.id)}
                          disabled={isSubmitting}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
