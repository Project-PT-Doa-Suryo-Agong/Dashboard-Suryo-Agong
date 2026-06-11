"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "⚙️",
  title: "Admin",
  subtitle:
    "Panduan lengkap untuk role Admin — mengelola user, master data, dan memantau seluruh divisi perusahaan.",
  accent: "#8b5cf6",
  accessLevel: "Strategic (Full Access)",
  accessDescription:
    "Admin memiliki akses penuh ke seluruh 7 cluster menu. Fungsi utama Admin adalah mengelola data user, produk, varian, vendor, dan dapat mengakses seluruh dashboard divisi sebagai kontrol administratif.",
  sections: [
    {
      title: "Dashboard Utama Admin",
      type: "features",
      items: [
        {
          title: "Statistik Sistem",
          description:
            "Melihat ringkasan Total System Users, Total Produk, Total Varian, dan Total Vendor yang ada di database. Data ini di-load secara real-time dari API.",
        },
        {
          title: "Panel Pengelolaan User",
          description:
            "Kelola akun pengguna enterprise: tambah user baru, ubah role/divisi, dan validasi profil karyawan yang terdaftar.",
        },
        {
          title: "Panel Database Master",
          description:
            "Atur data master produk, varian SKU, dan vendor/supplier untuk memastikan integritas data lintas modul.",
        },
      ],
    },
    {
      title: "Cara Mengelola User (/admin/users)",
      type: "steps",
      steps: [
        {
          title: "Buka Halaman User Management",
          description:
            'Dari dashboard Admin, klik kartu "Pengelolaan User" atau navigasi ke menu sidebar Admin > Users.',
        },
        {
          title: "Tambah User Baru",
          description:
            'Klik tombol "Tambah User". Isi formulir: Nama Lengkap, Email, Password, Role (contoh: Finance, HR, Produksi), dan Divisi. Klik "Simpan" untuk membuat akun.',
        },
        {
          title: "Edit Data User",
          description:
            "Pada tabel daftar user, klik ikon edit (pensil) pada baris yang diinginkan. Ubah data yang diperlukan dan klik simpan.",
        },
        {
          title: "Hapus User",
          description:
            "Klik ikon hapus (tempat sampah) pada baris user. Konfirmasi penghapusan. Akun akan dihapus secara permanen dari sistem.",
        },
      ],
    },
    {
      title: "Cara Mengelola Master Data (/admin/master-data)",
      type: "steps",
      steps: [
        {
          title: "Buka Halaman Master Data",
          description:
            'Klik kartu "Pengelolaan Database Master" dari dashboard, atau navigasi lewat sidebar.',
        },
        {
          title: "Kelola Produk",
          description:
            "Lihat daftar produk, tambah produk baru dengan mengisi nama dan kategori, edit produk yang sudah ada, atau hapus produk yang tidak aktif.",
        },
        {
          title: "Kelola Varian & Vendor",
          description:
            "Tab Varian: atur varian SKU setiap produk. Tab Vendor: tambah dan kelola data supplier/mitra pemasok.",
        },
      ],
    },
    {
      title: "Quick Access ke Seluruh Divisi",
      type: "features",
      items: [
        {
          title: "Akses Dashboard Divisi",
          description:
            "Admin memiliki quick links ke HR, Management, Finance, Produksi, Logistik, Creative & Sales, dan Office Support. Gunakan untuk monitoring lintas divisi.",
        },
      ],
    },
  ],
  tips: [
    "Periksa secara berkala apakah ada user yang role-nya perlu diperbarui.",
    "Pastikan setiap vendor baru sudah diverifikasi sebelum ditambahkan ke sistem.",
    "Gunakan fitur Quick Access untuk spot-check data di divisi lain.",
  ],
};

export default function AdminManualPage() {
  return <UserManualDetail data={data} />;
}
