"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "🛡️",
  title: "Super Admin",
  subtitle:
    "Panduan lengkap untuk role Super Admin — akses tertinggi dalam sistem Dashboard PT. Doa Suryo Agong.",
  accent: "#6366f1",
  accessLevel: "Strategic (Full Access)",
  accessDescription:
    "Super Admin memiliki akses penuh ke seluruh 7 cluster menu, termasuk manajemen user, master data, log aktivitas, dan konfigurasi enterprise. Role ini ditujukan untuk pengelola teknis sistem.",
  sections: [
    {
      title: "Dashboard Utama Super Admin",
      type: "features",
      items: [
        {
          title: "Statistik Global Sistem",
          description:
            "Melihat ringkasan total System Users, Total Produk, Total Varian, dan Total Vendor yang terdaftar dalam sistem secara real-time.",
        },
        {
          title: "Panel Pengelolaan User",
          description:
            'Akses cepat ke modul manajemen user enterprise melalui kartu "Pengelolaan User". Di sini Anda bisa menambah, mengedit, dan mengatur role serta validasi profil karyawan.',
        },
        {
          title: "Panel Pengelolaan Database Master",
          description:
            'Akses ke modul master data melalui kartu "Pengelolaan Database Master". Kelola data master lintas modul (produk, varian, vendor) untuk menjaga integritas referensi sistem.',
        },
      ],
    },
    {
      title: "Manajemen User (/super-admin/users)",
      type: "steps",
      steps: [
        {
          title: "Lihat Daftar User",
          description:
            "Buka halaman Users untuk melihat seluruh user yang terdaftar di sistem. Tabel menampilkan nama, email, role, divisi, dan status akun.",
        },
        {
          title: "Tambah User Baru",
          description:
            'Klik tombol "Tambah User" untuk membuat akun baru. Isi form yang meliputi: Nama Lengkap, Email, Password, Role, dan Divisi. Sistem akan otomatis membuat akun di Supabase Auth.',
        },
        {
          title: "Edit Profil User",
          description:
            "Klik icon edit pada baris user yang ingin diubah. Anda dapat mengubah nama, role, divisi, dan job title pengguna.",
        },
        {
          title: "Hapus User",
          description:
            "Klik icon hapus pada baris user. Dialog konfirmasi akan muncul. Penghapusan bersifat permanen dan akan menghapus akun dari Supabase Auth.",
        },
      ],
    },
    {
      title: "Manajemen Master Data (/super-admin/master-data)",
      type: "features",
      items: [
        {
          title: "Kelola Produk",
          description:
            "Tambah, edit, dan hapus data master produk. Setiap produk memiliki field: nama produk, kategori, dan deskripsi.",
        },
        {
          title: "Kelola Varian",
          description:
            "Atur varian untuk setiap produk. Varian memiliki field: nama varian, SKU, dan harga. Terhubung ke produk induk.",
        },
        {
          title: "Kelola Vendor",
          description:
            "Tambah dan kelola data vendor/supplier. Field meliputi: nama vendor, kontak, alamat, dan jenis kategori.",
        },
      ],
    },
    {
      title: "Log Aktivitas (/super-admin/log)",
      type: "features",
      items: [
        {
          title: "Monitoring Chat Log",
          description:
            "Lihat log percakapan WhatsApp yang terintegrasi dengan sistem. Berguna untuk audit komunikasi sales dan customer handling.",
        },
      ],
    },
    {
      title: "Quick Access ke Semua Divisi",
      type: "text",
      text: "Sebagai Super Admin, Anda memiliki Quick Access links ke seluruh dashboard divisi: HR, Management, Finance, Produksi, Logistik, Creative & Sales, dan Office Support. Gunakan ini untuk memantau atau melakukan troubleshooting di seluruh divisi.",
    },
  ],
  tips: [
    "Selalu backup data master secara berkala sebelum melakukan perubahan besar.",
    "Gunakan fitur Log untuk memantau aktivitas yang mencurigakan.",
    "Pastikan setiap user baru diberikan role dan divisi yang tepat untuk menghindari akses yang tidak sesuai.",
    "Jangan bagikan kredensial Super Admin kepada siapapun.",
  ],
};

export default function SuperAdminManualPage() {
  return <UserManualDetail data={data} />;
}
