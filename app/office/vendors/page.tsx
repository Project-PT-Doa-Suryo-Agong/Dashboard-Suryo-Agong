"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MVendor } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type VendorsListPayload = {
  vendor: MVendor[];
  meta: { page: number; limit: number; total: number };
};

type VendorPayload = {
  vendor: MVendor | null;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const raw = await response.text();
  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    const fallback = response.ok ? "Respons server tidak valid (bukan JSON)." : raw.slice(0, 200);
    throw new Error(fallback || "Respons server tidak valid.");
  }

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }

  return payload;
}

function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function OfficeVendorsPage() {
  const [items, setItems] = useState<MVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<MVendor | null>(null);

  const [formNamaVendor, setFormNamaVendor] = useState("");
  const [formKontak, setFormKontak] = useState("");

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/core/vendors?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VendorsListPayload>(response);
      setItems(payload.data.vendor ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data vendor.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchVendors();
  }, []);

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter(
      (item) =>
        (item.nama_vendor ?? "").toLowerCase().includes(normalized) ||
        (item.kontak ?? "").toLowerCase().includes(normalized),
    );
  }, [items, searchTerm]);

  const openAddModal = () => {
    setSelectedVendor(null);
    setFormNamaVendor("");
    setFormKontak("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (vendor: MVendor) => {
    setSelectedVendor(vendor);
    setFormNamaVendor(vendor.nama_vendor ?? "");
    setFormKontak(vendor.kontak ?? "");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedVendor(null);
    setFormNamaVendor("");
    setFormKontak("");
  };

  const handleSaveVendor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const namaVendor = formNamaVendor.trim();
    if (!namaVendor) {
      alert("Nama vendor wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        nama_vendor: namaVendor,
        kontak: formKontak.trim() || null,
      };

      if (selectedVendor) {
        const response = await apiFetch(`/api/core/vendors/${selectedVendor.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<VendorPayload>(response);
      } else {
        const response = await apiFetch("/api/core/vendors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<VendorPayload>(response);
      }

      await fetchVendors();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan vendor.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (vendor: MVendor) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedVendor(null);
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/core/vendors/${selectedVendor.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchVendors();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus vendor.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen Mitra dan Vendor</h1>
        <p className="text-sm md:text-base text-slate-300">Kelola data kontak pemasok dari tabel core.m_vendor.</p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama vendor atau kontak..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Vendor
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar Vendor</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">Data vendor dari backend API core.</p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Vendor</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Vendor</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Kontak</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Terakhir Diupdate</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={5}>Memuat data...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={5}>Tidak ada vendor yang sesuai pencarian.</td>
                </tr>
              ) : (
                filteredItems.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{vendor.id}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-64 break-words">{vendor.nama_vendor ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{vendor.kontak ?? "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{formatDate(vendor.updated_at)}</td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(vendor)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(vendor)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={selectedVendor ? "Edit Vendor" : "Tambah Vendor"} maxWidth="max-w-lg">
        <form onSubmit={handleSaveVendor} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nama-vendor" className="text-sm font-semibold text-slate-700">Nama Vendor</label>
            <input
              id="nama-vendor"
              type="text"
              value={formNamaVendor}
              onChange={(event) => setFormNamaVendor(event.target.value)}
              placeholder="Masukkan nama vendor"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="kontak-vendor" className="text-sm font-semibold text-slate-700">Kontak</label>
            <input
              id="kontak-vendor"
              type="text"
              value={formKontak}
              onChange={(event) => setFormKontak(event.target.value)}
              placeholder="Contoh: 021-xxxxxxx atau email vendor"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeFormModal} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteVendor}
        title="Konfirmasi Hapus Vendor"
        description={`Apakah Anda yakin ingin menghapus vendor ${selectedVendor?.nama_vendor ?? "-"}?`}
        confirmText={isSubmitting ? "Menghapus..." : "Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
