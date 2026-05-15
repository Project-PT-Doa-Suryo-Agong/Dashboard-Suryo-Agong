"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "🏭",
  title: "Produksi",
  subtitle: "Panduan role Produksi — monitoring pesanan, QC inbound bahan baku, dan QC outbound produk jadi.",
  accent: "#f59e0b",
  accessLevel: "Operational",
  accessDescription: "Role Produksi mengakses cluster Produksi & Quality Control (cluster 4). Fokus: manajemen order produksi dan quality control.",
  sections: [
    {
      title: "Dashboard Utama Produksi",
      type: "features",
      items: [
        { title: "Pesanan Aktif (Orders)", description: "Jumlah batch produksi yang berstatus 'ongoing' / sedang dalam proses." },
        { title: "Antrean QC Inbound", description: "Jumlah inspeksi bahan baku masuk yang hasilnya 'reject'. Perlu penanganan segera." },
        { title: "Lolos QC Akhir (Outbound)", description: "Persentase produk jadi yang lolos QC akhir dan siap kirim ke logistik." },
      ],
    },
    {
      title: "Pesanan Produksi (/produksi/orders)",
      type: "steps",
      steps: [
        { title: "Lihat Daftar Pesanan", description: "Tabel pesanan produksi: ID Pesanan, Produk, Target Qty, Status (Draft/Berjalan/Selesai)." },
        { title: "Buat Pesanan Baru", description: "Tambah batch produksi baru. Pilih produk, tentukan kuantitas target, status awal 'Draft'." },
        { title: "Update Status", description: "Ubah status pesanan dari Draft → Ongoing → Done seiring progres produksi." },
      ],
    },
    {
      title: "QC Bahan Baku (/produksi/qc/inbound)",
      type: "steps",
      steps: [
        { title: "Inspeksi Material Supplier", description: "Catat hasil inspeksi bahan baku yang masuk dari supplier sebelum masuk gudang." },
        { title: "Input Hasil QC", description: "Pilih pesanan produksi terkait, masukkan hasil inspeksi: Pass atau Reject." },
        { title: "Tindak Lanjut Reject", description: "Bahan baku yang di-reject akan masuk antrean penanganan dan muncul di dashboard." },
      ],
    },
    {
      title: "QC Produk Jadi (/produksi/qc/outbound)",
      type: "steps",
      steps: [
        { title: "Evaluasi Kualitas Akhir", description: "Lakukan pengecekan kualitas produk jadi sebelum serah terima ke divisi logistik." },
        { title: "Catat Hasil QC Outbound", description: "Pilih batch/pesanan, input hasil (Pass/Reject). Dashboard menampilkan 5 hasil terbaru." },
      ],
    },
  ],
  tips: [
    "Update status pesanan secara real-time agar dashboard akurat.",
    "Prioritaskan penanganan material reject di QC Inbound.",
    "Gunakan data QC Outbound rate untuk evaluasi kualitas proses produksi.",
  ],
};

export default function ProduksiManualPage() {
  return <UserManualDetail data={data} />;
}
