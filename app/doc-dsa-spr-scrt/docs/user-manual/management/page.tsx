"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "📊",
  title: "Management",
  subtitle:
    "Panduan lengkap untuk role Management — Executive Command Center untuk pengambilan keputusan strategis.",
  accent: "#BC934B",
  accessLevel: "Managerial (Cluster 2)",
  accessDescription:
    "Role Management memiliki akses ke cluster 2. Fokus utama adalah pemantauan budget, KPI lintas divisi, dan pengambilan keputusan strategis perusahaan.",
  sections: [
    {
      title: "Dashboard Utama Management",
      type: "features",
      items: [
        {
          title: "Total Budget Tahun Ini",
          description:
            "Menampilkan total akumulasi pengajuan budget dari seluruh divisi beserta persentase serapan anggaran yang telah disetujui.",
        },
        {
          title: "Rata-Rata Skor KPI",
          description:
            "Skor rata-rata KPI mingguan lintas divisi, dihitung dari perbandingan realisasi terhadap target. Ditampilkan dalam skala 0-100.",
        },
        {
          title: "Total Divisi Aktif",
          description:
            "Jumlah divisi unik yang tercatat aktif dalam data budget dan KPI.",
        },
      ],
    },
    {
      title: "Modul Budget (/management/budget)",
      type: "steps",
      steps: [
        {
          title: "Lihat Semua Pengajuan Budget",
          description:
            "Halaman Budget menampilkan tabel seluruh pengajuan anggaran dari berbagai divisi, lengkap dengan nominal, divisi pengaju, dan status (Pending/Approved/Rejected).",
        },
        {
          title: "Ajukan Budget Baru",
          description:
            'Klik tombol "Ajukan Budget". Isi formulir: Divisi, Deskripsi Kebutuhan, dan Nominal Anggaran. Pengajuan akan berstatus "Pending" sampai disetujui.',
        },
        {
          title: "Approve / Reject Budget",
          description:
            'Pada setiap baris pengajuan berstatus "Pending", Anda dapat klik tombol "Approve" untuk menyetujui atau "Reject" untuk menolak. Status akan berubah otomatis.',
        },
      ],
    },
    {
      title: "Modul KPI (/management/kpi)",
      type: "steps",
      steps: [
        {
          title: "Lihat KPI Mingguan",
          description:
            "Halaman KPI menampilkan data indikator kinerja utama seluruh divisi. Setiap entry memiliki: Divisi, Indikator, Target, Realisasi, dan Skor persentase.",
        },
        {
          title: "Tambah Entry KPI",
          description:
            'Klik "Tambah KPI" untuk memasukkan data kinerja baru. Isi Divisi, Indikator, Target numerik, dan Realisasi capaian minggu ini.',
        },
        {
          title: "Analisis Visualisasi",
          description:
            "Dashboard menampilkan bar chart KPI per divisi. Gunakan ini untuk mengidentifikasi divisi yang performanya di bawah rata-rata.",
        },
      ],
    },
    {
      title: "Tabel Recent Budget & Top KPI",
      type: "features",
      items: [
        {
          title: "Recent Budget Approvals",
          description:
            "Tabel ringkasan 4 pengajuan budget terbaru menampilkan Divisi, Nominal, dan Status persetujuan.",
        },
        {
          title: "Top KPI Divisi",
          description:
            "Daftar peringkat divisi berdasarkan rata-rata skor KPI tertinggi. Berguna untuk reward dan evaluasi.",
        },
      ],
    },
  ],
  tips: [
    "Review budget pengajuan secara mingguan agar tidak menumpuk pending requests.",
    "Gunakan grafik KPI untuk menyiapkan materi rapat evaluasi divisi.",
    "Bandingkan skor KPI antar divisi untuk mengidentifikasi best practices yang bisa diterapkan lintas departemen.",
    "Pastikan setiap divisi mengisi KPI mingguan tepat waktu untuk data yang akurat.",
  ],
};

export default function ManagementManualPage() {
  return <UserManualDetail data={data} />;
}
