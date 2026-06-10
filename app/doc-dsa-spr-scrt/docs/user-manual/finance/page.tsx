"use client";

import "../user-manual.css";
import { UserManualDetail } from "../components";
import type { ManualPageData } from "../components";

const data: ManualPageData = {
  icon: "💰",
  title: "Finance",
  subtitle:
    "Panduan lengkap untuk role Finance — monitoring arus kas, payroll, reimbursement, dan seluruh administrasi keuangan.",
  accent: "#10b981",
  accessLevel: "Operational",
  accessDescription:
    "Role Finance memiliki akses ke cluster Finance & Administration (cluster 2) serta cluster operasional lainnya. Fokus utama adalah pengelolaan keuangan perusahaan.",
  sections: [
    {
      title: "Dashboard Finance Command Center",
      type: "features",
      items: [
        {
          title: "Total Saldo Perusahaan",
          description:
            "Menampilkan saldo bersih perusahaan yang dihitung dari selisih total income dan expense seluruh periode.",
        },
        {
          title: "Pemasukan & Pengeluaran Bulan Ini",
          description:
            "Kartu terpisah yang menampilkan total pemasukan (hijau) dan total pengeluaran (merah) untuk bulan berjalan.",
        },
        {
          title: "Grafik Tren Cashflow",
          description:
            "Line chart interaktif yang memvisualisasikan perbandingan pemasukan vs pengeluaran selama 6 bulan terakhir.",
        },
        {
          title: "Tabel Recent Transactions",
          description:
            "Tabel 4 transaksi arus kas terbaru dengan kolom: ID Transaksi, Tanggal, Keterangan, Tipe (In/Out), dan Nominal.",
        },
      ],
    },
    {
      title: "Modul Cashflow (/finance/cashflow)",
      type: "steps",
      steps: [
        {
          title: "Lihat Daftar Transaksi Cashflow",
          description:
            "Halaman Cashflow menampilkan seluruh transaksi arus kas masuk dan keluar perusahaan dalam format tabel terstruktur.",
        },
        {
          title: "Tambah Transaksi Baru",
          description:
            'Klik "Tambah Transaksi". Pilih tipe (Income/Expense), isi keterangan, nominal, dan tanggal. Klik simpan.',
        },
        {
          title: "Filter & Pencarian",
          description:
            "Gunakan filter berdasarkan tipe transaksi atau periode tanggal untuk mempersempit data yang ditampilkan.",
        },
      ],
    },
    {
      title: "Modul Reimbursement (/finance/reimburse)",
      type: "steps",
      steps: [
        {
          title: "Lihat Daftar Pengajuan Dana",
          description:
            'Halaman Reimbursement menampilkan semua pengajuan dana karyawan. Badge "Pending" berwarna kuning menunjukkan pengajuan yang menunggu approval.',
        },
        {
          title: "Ajukan Reimbursement Baru",
          description:
            'Klik "Ajukan Reimbursement". Isi deskripsi, nominal, dan lampiran bukti. Status awal adalah "Pending".',
        },
        {
          title: "Approve / Reject Pengajuan",
          description:
            "Sebagai Finance, Anda dapat menyetujui (Approved) atau menolak (Rejected) pengajuan dana. Perubahan status akan tercatat di sistem.",
        },
      ],
    },
    {
      title: "Modul Payroll (/finance/payroll)",
      type: "features",
      items: [
        {
          title: "Laporan Penggajian",
          description:
            "Lihat dan proses payroll karyawan. Data payroll dihitung berdasarkan data kehadiran, potongan, dan tunjangan lintas tabel.",
        },
      ],
    },
    {
      title: "Modul Lainnya",
      type: "features",
      items: [
        {
          title: "Chart of Accounts — CoA (/finance/coa)",
          description:
            "Kelola bagan akun (Chart of Accounts) perusahaan. Lihat dan atur klasifikasi akun keuangan.",
        },
        {
          title: "Jurnal Umum (/finance/journal)",
          description:
            "Input dan tinjau jurnal umum. Setiap entri jurnal memiliki akun debit, akun kredit, dan nominal.",
        },
        {
          title: "Invoice (/finance/invoice)",
          description:
            "Kelola tagihan pelanggan. Buat, edit, dan pantau status pembayaran invoice.",
        },
        {
          title: "Utang Piutang (/finance/utang-piutang)",
          description:
            "Pantau dan kelola posisi hutang dan piutang perusahaan secara terstruktur.",
        },
      ],
    },
  ],
  tips: [
    "Periksa dan approve reimbursement secara harian agar tidak menumpuk.",
    "Gunakan grafik tren cashflow untuk memprediksi kebutuhan likuiditas bulan depan.",
    "Pastikan setiap transaksi cashflow diisi keterangan yang jelas untuk audit trail.",
    "Lakukan rekonsiliasi jurnal dengan CoA secara berkala.",
  ],
};

export default function FinanceManualPage() {
  return <UserManualDetail data={data} />;
}
