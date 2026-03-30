"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Building2, Package, Users } from "lucide-react";

type HrEmployeeStatus = "aktif" | "nonaktif";

type CoreMVendorItem = {
  id: string;
  nama_vendor: string;
  kontak: string;
  created_at: string;
  updated_at: string;
};

type CoreMProdukItem = {
  id: string;
  nama_produk: string;
  kategori: string;
  created_at: string;
  updated_at: string;
};

type CoreMVarianItem = {
  id: string;
  product_id: string;
  nama_varian: string;
  sku: string;
  harga: number;
  created_at: string;
  updated_at: string;
};

type HrMKaryawanItem = {
  id: string;
  nama: string;
  posisi: string;
  divisi: string;
  status: HrEmployeeStatus;
  created_at: string;
};

const core_m_vendor_rows_seed: CoreMVendorItem[] = [
  { id: "vnd-001", nama_vendor: "PT Mitra Pangan Nusantara", kontak: "021-7788123", created_at: "2026-02-10T09:00:00+07:00", updated_at: "2026-03-12T14:20:00+07:00" },
  { id: "vnd-002", nama_vendor: "CV Sumber Kemasan Prima", kontak: "022-6102233", created_at: "2026-01-28T10:00:00+07:00", updated_at: "2026-03-15T11:10:00+07:00" },
  { id: "vnd-003", nama_vendor: "PT Aroma Bahan Baku", kontak: "031-4991122", created_at: "2026-02-12T08:40:00+07:00", updated_at: "2026-03-11T16:00:00+07:00" },
  { id: "vnd-004", nama_vendor: "CV Makmur Sentosa Trade", kontak: "0274-889912", created_at: "2026-02-20T13:00:00+07:00", updated_at: "2026-03-16T08:35:00+07:00" },
  { id: "vnd-005", nama_vendor: "PT Tiga Karya Logam", kontak: "024-7012256", created_at: "2026-02-05T09:30:00+07:00", updated_at: "2026-03-09T15:15:00+07:00" },
  { id: "vnd-006", nama_vendor: "PT Ocean Packaging", kontak: "021-4455123", created_at: "2026-01-30T11:00:00+07:00", updated_at: "2026-03-08T12:00:00+07:00" },
  { id: "vnd-007", nama_vendor: "CV Multi Ingredient", kontak: "0231-779001", created_at: "2026-02-18T14:00:00+07:00", updated_at: "2026-03-14T09:25:00+07:00" },
  { id: "vnd-008", nama_vendor: "PT Agro Sukses Mandiri", kontak: "061-7700122", created_at: "2026-02-22T10:50:00+07:00", updated_at: "2026-03-13T17:45:00+07:00" },
  { id: "vnd-009", nama_vendor: "CV Bumi Kemas Jaya", kontak: "0267-551223", created_at: "2026-03-01T09:00:00+07:00", updated_at: "2026-03-10T10:10:00+07:00" },
  { id: "vnd-010", nama_vendor: "PT Citra Rasa Foodtech", kontak: "031-5659012", created_at: "2026-03-02T11:20:00+07:00", updated_at: "2026-03-16T09:45:00+07:00" },
  { id: "vnd-011", nama_vendor: "PT Solusi Label Indonesia", kontak: "021-8800112", created_at: "2026-02-14T15:30:00+07:00", updated_at: "2026-03-15T13:40:00+07:00" },
  { id: "vnd-012", nama_vendor: "CV Prima Kopi Supply", kontak: "0251-660998", created_at: "2026-03-04T08:15:00+07:00", updated_at: "2026-03-12T16:05:00+07:00" },
  { id: "vnd-013", nama_vendor: "PT Kharisma Ingredient", kontak: "0271-889100", created_at: "2026-03-06T10:05:00+07:00", updated_at: "2026-03-14T15:20:00+07:00" },
  { id: "vnd-014", nama_vendor: "CV Nusantara Warehouse", kontak: "024-663490", created_at: "2026-03-07T09:40:00+07:00", updated_at: "2026-03-11T14:00:00+07:00" },
  { id: "vnd-015", nama_vendor: "PT Sentral Distribusi Bahan", kontak: "021-7733445", created_at: "2026-03-09T10:25:00+07:00", updated_at: "2026-03-16T10:55:00+07:00" },
];

const core_m_produk_rows_seed: CoreMProdukItem[] = [
  { id: "prd-001", nama_produk: "Coffee Beans Arabica", kategori: "Minuman", created_at: "2026-01-10T08:00:00+07:00", updated_at: "2026-03-12T08:00:00+07:00" },
  { id: "prd-002", nama_produk: "Coffee Beans Robusta", kategori: "Minuman", created_at: "2026-01-12T08:00:00+07:00", updated_at: "2026-03-12T08:00:00+07:00" },
  { id: "prd-003", nama_produk: "Chocolate Blend", kategori: "Powder", created_at: "2026-01-15T08:00:00+07:00", updated_at: "2026-03-10T08:00:00+07:00" },
  { id: "prd-004", nama_produk: "Matcha Mix", kategori: "Powder", created_at: "2026-01-17T08:00:00+07:00", updated_at: "2026-03-14T08:00:00+07:00" },
  { id: "prd-005", nama_produk: "Vanilla Cream", kategori: "Powder", created_at: "2026-01-18T08:00:00+07:00", updated_at: "2026-03-15T08:00:00+07:00" },
  { id: "prd-006", nama_produk: "Hazelnut Syrup", kategori: "Syrup", created_at: "2026-01-21T08:00:00+07:00", updated_at: "2026-03-12T08:00:00+07:00" },
  { id: "prd-007", nama_produk: "Caramel Syrup", kategori: "Syrup", created_at: "2026-01-22T08:00:00+07:00", updated_at: "2026-03-09T08:00:00+07:00" },
  { id: "prd-008", nama_produk: "Milk Tea Base", kategori: "Minuman", created_at: "2026-01-25T08:00:00+07:00", updated_at: "2026-03-11T08:00:00+07:00" },
  { id: "prd-009", nama_produk: "Signature Latte Base", kategori: "Minuman", created_at: "2026-01-27T08:00:00+07:00", updated_at: "2026-03-13T08:00:00+07:00" },
  { id: "prd-010", nama_produk: "Mocha Premix", kategori: "Powder", created_at: "2026-01-29T08:00:00+07:00", updated_at: "2026-03-16T08:00:00+07:00" },
  { id: "prd-011", nama_produk: "Fresh Tea Concentrate", kategori: "Concentrate", created_at: "2026-02-01T08:00:00+07:00", updated_at: "2026-03-14T08:00:00+07:00" },
  { id: "prd-012", nama_produk: "Fruit Syrup Series", kategori: "Syrup", created_at: "2026-02-03T08:00:00+07:00", updated_at: "2026-03-16T08:00:00+07:00" },
];

const core_m_varian_rows_seed: CoreMVarianItem[] = Array.from({ length: 42 }, (_, index) => {
  const product = core_m_produk_rows_seed[index % core_m_produk_rows_seed.length];
  const varianNo = Math.floor(index / core_m_produk_rows_seed.length) + 1;
  const day = (index % 18) + 1;
  const createdAt = `2026-03-${String(day).padStart(2, "0")}T09:${String((index * 3) % 60).padStart(2, "0")}:00+07:00`;

  return {
    id: `var-${String(index + 1).padStart(3, "0")}`,
    product_id: product.id,
    nama_varian: `${product.nama_produk} Varian ${varianNo}`,
    sku: `${product.id.toUpperCase()}-V${String(varianNo).padStart(2, "0")}`,
    harga: 45000 + (index % 6) * 5000,
    created_at: createdAt,
    updated_at: createdAt,
  };
});

const hr_m_karyawan_rows_seed: HrMKaryawanItem[] = Array.from({ length: 142 }, (_, index) => {
  const divisi = ["Office", "Produksi", "Logistik", "Finance", "HR", "Creative"][
    index % 6
  ];
  return {
    id: `emp-${String(index + 1).padStart(3, "0")}`,
    nama: `Karyawan ${String(index + 1).padStart(3, "0")}`,
    posisi: divisi === "Office" ? "Admin Staff" : "Staff",
    divisi,
    status: index % 18 === 0 ? "nonaktif" : "aktif",
    created_at: `2025-11-${String((index % 28) + 1).padStart(2, "0")}T08:00:00+07:00`,
  };
});

const quick_links = [
  {
    href: "/office/vendors",
    title: "Manajemen Mitra/Vendor",
    description: "Kelola mitra pemasok dan pembaruan data kontak vendor.",
  },
  {
    href: "/office/products",
    title: "Katalog Produk & Varian",
    description: "Atur master produk dan varian SKU yang aktif di sistem.",
  },
];

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function OfficeDashboardPage() {
  const [core_m_vendor_rows] = useState<CoreMVendorItem[]>(core_m_vendor_rows_seed);
  const [core_m_produk_rows] = useState<CoreMProdukItem[]>(core_m_produk_rows_seed);
  const [core_m_varian_rows] = useState<CoreMVarianItem[]>(core_m_varian_rows_seed);
  const [hr_m_karyawan_rows] = useState<HrMKaryawanItem[]>(hr_m_karyawan_rows_seed);

  const total_vendor_aktif = core_m_vendor_rows.length;
  const total_katalog_produk = core_m_varian_rows.length;
  const total_karyawan = hr_m_karyawan_rows.length;

  const vendor_update_terbaru = useMemo(() => {
    return [...core_m_vendor_rows]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 5);
  }, [core_m_vendor_rows]);

  const produk_by_id = useMemo(() => {
    return Object.fromEntries(core_m_produk_rows.map((item) => [item.id, item]));
  }, [core_m_produk_rows]);

  const produk_varian_baru = useMemo(() => {
    return [...core_m_varian_rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6);
  }, [core_m_varian_rows]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Administrasi Office</h1>
        <p className="text-sm md:text-base text-slate-300">
          Command Center tim Administrasi untuk memantau dan menjaga kualitas master data perusahaan.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#BC934B]/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Vendor Aktif</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_vendor_aktif} Mitra</p>
              <p className="text-xs md:text-sm text-slate-600">Terdaftar dalam sistem</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] shrink-0">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-blue-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Katalog Produk</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_katalog_produk} Item</p>
              <p className="text-xs md:text-sm text-slate-600">{core_m_produk_rows.length} produk, varian produk aktif</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-8 h-28 w-28 rounded-full bg-emerald-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Karyawan (Office &amp; Pabrik)</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_karyawan} Orang</p>
              <p className="text-xs md:text-sm text-slate-600">Seluruh divisi</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-100">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quick_links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#BC934B]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm md:text-base font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs md:text-sm text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700 group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Update Vendor Terbaru</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[460px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Nama Vendor
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Kontak
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status/Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendor_update_terbaru.map((vendor) => {
                  const isUpdated = vendor.updated_at !== vendor.created_at;
                  return (
                    <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800 break-words">
                        {vendor.nama_vendor}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{vendor.kontak}</td>
                      <td className="px-4 md:px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isUpdated ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {isUpdated ? "Updated" : "Baru"}
                          </span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">{formatDate(vendor.updated_at)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Produk &amp; Varian Baru</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[460px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Nama Produk
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    SKU Varian
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Kategori
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {produk_varian_baru.map((varian) => (
                  <tr key={varian.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800 break-words">
                      {produk_by_id[varian.product_id]?.nama_produk ?? "Produk Tidak Ditemukan"}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{varian.sku}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {produk_by_id[varian.product_id]?.kategori ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
