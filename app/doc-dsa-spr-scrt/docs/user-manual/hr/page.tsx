"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "👥",
  title: "HR (Human Resources)",
  subtitle: "Panduan role HR — manajemen karyawan, presensi, kontrak, SP, dan SOP.",
  accent: "#3b82f6",
  accessLevel: "Operational",
  accessDescription: "Role HR mengakses cluster HR & Operation Manager (cluster 3). Fokus: pengelolaan SDM perusahaan.",
  sections: [
    {
      title: "Dashboard Utama HR",
      type: "features",
      items: [
        { title: "Total Karyawan", description: "Jumlah total karyawan beserta rincian Aktif dan Nonaktif." },
        { title: "Presensi Hari Ini", description: "Persentase kehadiran hari ini dengan rincian Hadir dan Izin/Sakit." },
        { title: "Peringatan Aktif", description: "Jumlah SP yang diterbitkan sepanjang bulan berjalan." },
      ],
    },
    {
      title: "Modul Presensi (/hr/attendance)",
      type: "steps",
      steps: [
        { title: "Lihat Rekap Presensi", description: "Tabel presensi seluruh karyawan: nama, status (Hadir/Izin/Sakit/Alpha), tanggal." },
        { title: "Input Presensi", description: "Tambah data kehadiran karyawan. Pilih karyawan, status, dan tanggal." },
        { title: "Visualisasi Kehadiran", description: "Bar progress per kategori kehadiran dengan persentase proporsional." },
      ],
    },
    {
      title: "Data Karyawan (/hr/karyawan)",
      type: "steps",
      steps: [
        { title: "Database Karyawan", description: "Tabel: Nama, NIK, Divisi, Jabatan, Status, tanggal masuk." },
        { title: "Tambah Karyawan", description: "Isi Nama, NIK, Divisi, Jabatan, Tanggal Masuk, Status." },
        { title: "Edit & Hapus", description: "Klik ikon edit/hapus pada baris karyawan. Perubahan bersifat permanen." },
      ],
    },
    {
      title: "PKWT/PKWTP & Surat Peringatan",
      type: "features",
      items: [
        { title: "Kontrak Kerja (/hr/pkwt)", description: "Buat dan kelola PKWT/PKWTP. Lacak masa berlaku kontrak karyawan." },
        { title: "Surat Peringatan (/hr/warnings)", description: "Terbitkan SP1/SP2/SP3. Badge warna: kuning (SP1), oranye (SP2), merah (SP3)." },
        { title: "SOP (/hr/sop)", description: "Akses dan kelola dokumen Standard Operating Procedures perusahaan." },
      ],
    },
  ],
  tips: [
    "Input presensi harian sebelum jam 12 siang.",
    "Periksa kontrak PKWT yang mendekati masa berakhir secara berkala.",
    "Gunakan level SP bertahap sesuai kebijakan perusahaan.",
  ],
};

export default function HrManualPage() {
  return <UserManualDetail data={data} />;
}
