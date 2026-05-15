"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "🚛",
  title: "Logistik",
  subtitle: "Panduan role Logistik — kelola packing, manifest pengiriman, dan penanganan retur barang.",
  accent: "#ef4444",
  accessLevel: "Operational",
  accessDescription: "Role Logistik mengakses cluster Logistics & Packing (cluster 5). Fokus: pengiriman, gudang, dan retur.",
  sections: [
    {
      title: "Dashboard Utama Logistik",
      type: "features",
      items: [
        { title: "Total Packing", description: "Total seluruh packing dengan rincian: Selesai (packed), Proses (pending), dan Dikirim (shipped)." },
        { title: "Manifest Pengiriman Aktif", description: "Jumlah manifest pengiriman yang saat ini tercatat dalam sistem." },
        { title: "Retur Pending", description: "Jumlah retur barang berstatus 'pending' yang perlu penanganan segera." },
      ],
    },
    {
      title: "Modul Packing (/logistik/packing)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Packing", description: "Tabel seluruh data packing: order, status (pending/packed/shipped), dan timestamp." },
        { title: "Tambah Data Packing", description: "Input data packing baru untuk pesanan yang siap dikemas. Status awal: pending." },
        { title: "Update Status Packing", description: "Ubah status dari pending → packed → shipped seiring proses pengiriman." },
      ],
    },
    {
      title: "Modul Manifest (/logistik/manifest)",
      type: "steps",
      steps: [
        { title: "Lihat Manifest Pengiriman", description: "Tabel manifest: Order ID, Nomor Resi, dan Tanggal Dibuat. Dashboard menampilkan 5 terbaru." },
        { title: "Tambah Manifest Baru", description: "Input manifest baru dengan mengisi Order ID dan Nomor Resi pengiriman." },
      ],
    },
    {
      title: "Modul Retur (/logistik/returns)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Retur", description: "Daftar retur barang: Order ID, Alasan Retur, dan Status (Pending/Diproses/Selesai)." },
        { title: "Tambah Data Retur", description: "Input data retur baru. Isi Order ID, alasan retur, dan status penanganan." },
        { title: "Proses Penanganan Retur", description: "Update status retur dari Pending → Diproses → Selesai seiring tindak lanjut." },
      ],
    },
  ],
  tips: [
    "Update status packing secara real-time agar tim penjualan mendapat informasi akurat.",
    "Pastikan nomor resi diinput ke manifest segera setelah barang diserahkan ke kurir.",
    "Prioritaskan penanganan retur pending untuk menjaga kepuasan pelanggan.",
  ],
};

export default function LogistikManualPage() {
  return <UserManualDetail data={data} />;
}
