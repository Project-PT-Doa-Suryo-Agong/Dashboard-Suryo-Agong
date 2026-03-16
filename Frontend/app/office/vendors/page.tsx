"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";

type VendorItem = {
  id: string;
  nama_vendor: string;
  kontak: string;
  created_at: string;
  updated_at: string;
};

const core_m_vendor_rows_seed: VendorItem[] = [
  {
    id: "vnd-001",
    nama_vendor: "PT Mitra Pangan Nusantara",
    kontak: "021-7788123",
    created_at: "2026-02-10T09:00:00+07:00",
    updated_at: "2026-03-12T14:20:00+07:00",
  },
  {
    id: "vnd-002",
    nama_vendor: "CV Sumber Kemasan Prima",
    kontak: "022-6102233",
    created_at: "2026-01-28T10:00:00+07:00",
    updated_at: "2026-03-15T11:10:00+07:00",
  },
  {
    id: "vnd-003",
    nama_vendor: "PT Aroma Bahan Baku",
    kontak: "031-4991122",
    created_at: "2026-02-12T08:40:00+07:00",
    updated_at: "2026-03-11T16:00:00+07:00",
  },
  {
    id: "vnd-004",
    nama_vendor: "CV Makmur Sentosa Trade",
    kontak: "0274-889912",
    created_at: "2026-02-20T13:00:00+07:00",
    updated_at: "2026-03-16T08:35:00+07:00",
  },
  {
    id: "vnd-005",
    nama_vendor: "PT Tiga Karya Logam",
    kontak: "024-7012256",
    created_at: "2026-02-05T09:30:00+07:00",
    updated_at: "2026-03-09T15:15:00+07:00",
  },
  {
    id: "vnd-006",
    nama_vendor: "PT Ocean Packaging",
    kontak: "021-4455123",
    created_at: "2026-01-30T11:00:00+07:00",
    updated_at: "2026-03-08T12:00:00+07:00",
  },
  {
    id: "vnd-007",
    nama_vendor: "CV Multi Ingredient",
    kontak: "0231-779001",
    created_at: "2026-02-18T14:00:00+07:00",
    updated_at: "2026-03-14T09:25:00+07:00",
  },
  {
    id: "vnd-008",
    nama_vendor: "PT Agro Sukses Mandiri",
    kontak: "061-7700122",
    created_at: "2026-02-22T10:50:00+07:00",
    updated_at: "2026-03-13T17:45:00+07:00",
  },
];

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function OfficeVendorsPage() {
  const [items, setItems] = useState<VendorItem[]>(core_m_vendor_rows_seed);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);

  const [formNamaVendor, setFormNamaVendor] = useState("");
  const [formKontak, setFormKontak] = useState("");

  const filteredItems = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return items;

    return items.filter(
      (item) =>
        item.nama_vendor.toLowerCase().includes(normalized) ||
        item.kontak.toLowerCase().includes(normalized),
    );
  }, [items, searchTerm]);

  const openAddModal = () => {
    setSelectedVendor(null);
    setFormNamaVendor("");
    setFormKontak("");
    setIsFormModalOpen(true);
  };

  const openEditModal = (vendor: VendorItem) => {
    setSelectedVendor(vendor);
    setFormNamaVendor(vendor.nama_vendor);
    setFormKontak(vendor.kontak);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setSelectedVendor(null);
    setFormNamaVendor("");
    setFormKontak("");
  };

  const handleSaveVendor = () => {
    const namaVendor = formNamaVendor.trim();
    const kontakVendor = formKontak.trim();
    if (!namaVendor || !kontakVendor) return;

    const nowIso = new Date().toISOString();

    if (selectedVendor) {
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === selectedVendor.id
            ? {
                ...item,
                nama_vendor: namaVendor,
                kontak: kontakVendor,
                updated_at: nowIso,
              }
            : item,
        ),
      );
    } else {
      const newVendor: VendorItem = {
        id: `vnd-${String(Date.now()).slice(-6)}`,
        nama_vendor: namaVendor,
        kontak: kontakVendor,
        created_at: nowIso,
        updated_at: nowIso,
      };
      setItems((currentItems) => [newVendor, ...currentItems]);
    }

    closeFormModal();
  };

  const openDeleteModal = (vendor: VendorItem) => {
    setSelectedVendor(vendor);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedVendor(null);
  };

  const handleDeleteVendor = () => {
    if (!selectedVendor) return;
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== selectedVendor.id),
    );
    closeDeleteModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Manajemen Mitra &amp; Vendor</h1>
        <p className="text-sm md:text-base text-slate-600">
          Kelola data kontak pemasok, supplier, dan mitra operasional perusahaan.
        </p>
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Tambah Vendor
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar Vendor</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">
            Data utama vendor berdasarkan tabel core.m_vendor.
          </p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  ID Vendor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Nama Vendor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Kontak
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Terakhir Diupdate
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={5}>
                    Tidak ada vendor yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {vendor.id}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-64 break-words">
                      {vendor.nama_vendor}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {vendor.kontak}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {formatDate(vendor.updated_at)}
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(vendor)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BC934B] transition hover:text-[#a88444] whitespace-nowrap"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(vendor)}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 transition hover:text-rose-700 whitespace-nowrap"
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

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={selectedVendor ? "Edit Vendor" : "Tambah Vendor"}
        maxWidth="max-w-lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveVendor();
          }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label htmlFor="nama-vendor" className="text-sm font-semibold text-slate-700">
              Nama Vendor
            </label>
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
            <label htmlFor="kontak-vendor" className="text-sm font-semibold text-slate-700">
              Kontak
            </label>
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
            <button
              type="button"
              onClick={closeFormModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444]"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Konfirmasi Hapus Vendor"
        maxWidth="max-w-md"
      >
        <div className="space-y-5">
          <p className="text-sm text-slate-600 leading-relaxed">
            Apakah Anda yakin ingin menghapus vendor{" "}
            <span className="font-semibold text-slate-900">
              {selectedVendor?.nama_vendor ?? "-"}
            </span>
            ?
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDeleteVendor}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
