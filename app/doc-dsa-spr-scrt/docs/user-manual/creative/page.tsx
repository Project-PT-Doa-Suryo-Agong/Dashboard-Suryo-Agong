"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "🎨",
  title: "Creative & Sales",
  subtitle: "Panduan role Creative — dashboard penjualan, affiliator, content planner, live performance, dan sales order.",
  accent: "#ec4899",
  accessLevel: "Operational",
  accessDescription: "Role Creative & Sales mengakses cluster Creative & Sales (cluster 6). Fokus: konten, penjualan, dan affiliate marketing.",
  sections: [
    {
      title: "Dashboard Creative & Sales",
      type: "features",
      items: [
        { title: "Total Sales Revenue", description: "Akumulasi total pendapatan dari seluruh sales order yang tercatat di sistem." },
        { title: "Active Affiliators", description: "Jumlah affiliator yang aktif terdaftar dalam program affiliate." },
        { title: "Total Content Planned", description: "Jumlah konten yang telah direncanakan melalui content planner." },
        { title: "Live Stream Revenue", description: "Total pendapatan (monetasi) dari data content stats / live streaming." },
      ],
    },
    {
      title: "Modul Affiliator (/creative/affiliates)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Affiliator", description: "Tabel seluruh affiliator: Nama, Kontak, Platform, dan Status." },
        { title: "Tambah Affiliator Baru", description: "Input data affiliator baru: nama, kontak, platform (TikTok/Instagram/dll), dan komisi." },
        { title: "Edit & Kelola Affiliator", description: "Perbarui data affiliator yang ada atau nonaktifkan yang sudah tidak bekerja sama." },
      ],
    },
    {
      title: "Content Planner (/creative/content)",
      type: "steps",
      steps: [
        { title: "Lihat Rencana Konten", description: "Daftar konten yang direncanakan: Judul, Jenis (Foto/Video/Live), Tanggal Publish, dan Status." },
        { title: "Buat Rencana Konten Baru", description: "Tambah entry konten baru dengan judul, tipe, jadwal, dan deskripsi brief." },
        { title: "Update Status Konten", description: "Perbarui status konten: Draft → In Progress → Published." },
      ],
    },
    {
      title: "Live Performance (/creative/content-stats)",
      type: "features",
      items: [
        { title: "Statistik Performa Konten", description: "Lihat data monetasi dari setiap konten yang dipublish. Dashboard menampilkan revenue per konten beserta tanggal dan jumlah." },
        { title: "Content Stats Revenue", description: "Akumulasi pendapatan dari content stats ditampilkan di dashboard utama beserta jumlah data yang tersedia." },
      ],
    },
    {
      title: "Sales Order (/creative/sales-order)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Sales Order", description: "Tabel pesanan penjualan: Order ID, Varian Produk, Kuantitas, Total Harga, dan Status." },
        { title: "Buat Sales Order Baru", description: "Input pesanan baru: pilih varian produk, kuantitas, harga, dan affiliator terkait." },
      ],
    },
    {
      title: "Log Chat Sales (/creative/log-chat-sales)",
      type: "features",
      items: [
        { title: "Monitoring Percakapan", description: "Akses log percakapan tim sales untuk review kualitas handling pelanggan dan audit komunikasi." },
      ],
    },
  ],
  tips: [
    "Update content planner secara rutin agar jadwal produksi konten terorganisir.",
    "Pantau revenue per affiliator untuk evaluasi program affiliate.",
    "Gunakan data live performance untuk mengoptimalkan jadwal dan konten live streaming.",
  ],
};

export default function CreativeManualPage() {
  return <UserManualDetail data={data} />;
}
