"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "🏢",
  title: "Office Support",
  subtitle: "Panduan role Office Support — administrasi master data vendor, katalog produk, dan dukungan operasional.",
  accent: "#64748b",
  accessLevel: "Support",
  accessDescription: "Role Office Support mengakses cluster Office Support (cluster 7). Fokus: pengelolaan master data vendor dan katalog produk sebagai dukungan administrasi.",
  sections: [
    {
      title: "Dashboard Administrasi Office",
      type: "features",
      items: [
        { title: "Total Vendor Aktif", description: "Jumlah vendor/mitra pemasok yang terdaftar dalam sistem." },
        { title: "Katalog Produk", description: "Jumlah total item dalam katalog beserta jumlah produk dan varian aktif." },
        { title: "Total Varian Aktif", description: "Jumlah varian produk yang aktif dalam katalog." },
      ],
    },
    {
      title: "Manajemen Vendor (/office/vendors)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Vendor", description: "Tabel vendor: Nama Vendor, Kontak, Alamat, dan Status/Tanggal. Dashboard menampilkan 5 update terbaru." },
        { title: "Tambah Vendor Baru", description: "Input data vendor baru: Nama, Kontak (telepon/email), Alamat, dan Kategori." },
        { title: "Edit Data Vendor", description: "Perbarui informasi vendor yang sudah ada. Badge 'Updated' (kuning) dan 'Baru' (hijau) membedakan status." },
      ],
    },
    {
      title: "Katalog Produk & Varian (/office/products)",
      type: "steps",
      steps: [
        { title: "Lihat Katalog", description: "Tabel produk dan varian: Nama Produk, SKU Varian, dan Kategori. Dashboard menampilkan 6 varian terbaru." },
        { title: "Tambah Produk Baru", description: "Input produk baru: Nama Produk, Kategori, dan Deskripsi." },
        { title: "Kelola Varian", description: "Tambah varian untuk setiap produk: Nama Varian, SKU, dan Harga." },
      ],
    },
  ],
  tips: [
    "Perbarui data kontak vendor secara berkala agar komunikasi tidak terhambat.",
    "Pastikan setiap produk baru langsung memiliki minimal satu varian dengan SKU.",
    "Verifikasi data vendor baru sebelum menginputnya ke sistem.",
    "Gunakan filter kategori untuk mempermudah pencarian produk di katalog.",
  ],
};

export default function OfficeManualPage() {
  return <UserManualDetail data={data} />;
}
