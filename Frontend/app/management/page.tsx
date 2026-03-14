"use client";

import Link from "next/link";
import { ArrowRight, Landmark, Target, Users } from "lucide-react";

type BudgetStatus = "pending" | "approved" | "rejected";
type EmployeeStatus = "aktif" | "nonaktif";

type ManagementBudgetRequestItem = {
  id: string;
  divisi: string;
  amount: number;
  status: BudgetStatus;
  created_at: string;
};

type ManagementKpiWeeklyItem = {
  id: string;
  minggu: string;
  divisi: string;
  target: number;
  realisasi: number;
  created_at: string;
};

type HrEmployeeItem = {
  id: string;
  nama: string;
  divisi: string;
  status: EmployeeStatus;
};

type KpiPerformerItem = {
  nama_karyawan: string;
  divisi: string;
  skor_kpi: number;
};

const management_t_budget_request_rows: ManagementBudgetRequestItem[] = [
  { id: "bgt-001", divisi: "Finance", amount: 580000000, status: "approved", created_at: "2026-03-02T09:30:00+07:00" },
  { id: "bgt-002", divisi: "HR", amount: 320000000, status: "approved", created_at: "2026-03-05T11:10:00+07:00" },
  { id: "bgt-003", divisi: "Produksi", amount: 790000000, status: "pending", created_at: "2026-03-08T14:05:00+07:00" },
  { id: "bgt-004", divisi: "Logistik", amount: 410000000, status: "approved", created_at: "2026-03-09T08:45:00+07:00" },
  { id: "bgt-005", divisi: "Creative", amount: 220000000, status: "pending", created_at: "2026-03-10T16:20:00+07:00" },
  { id: "bgt-006", divisi: "Management", amount: 180000000, status: "approved", created_at: "2026-03-12T10:15:00+07:00" },
];

const management_t_kpi_weekly_rows: ManagementKpiWeeklyItem[] = [
  { id: "kpi-001", minggu: "2026-03-02", divisi: "Finance", target: 100, realisasi: 88, created_at: "2026-03-07T17:00:00+07:00" },
  { id: "kpi-002", minggu: "2026-03-02", divisi: "HR", target: 100, realisasi: 90, created_at: "2026-03-07T17:05:00+07:00" },
  { id: "kpi-003", minggu: "2026-03-02", divisi: "Produksi", target: 100, realisasi: 86, created_at: "2026-03-07T17:10:00+07:00" },
  { id: "kpi-004", minggu: "2026-03-02", divisi: "Logistik", target: 100, realisasi: 89, created_at: "2026-03-07T17:15:00+07:00" },
  { id: "kpi-005", minggu: "2026-03-02", divisi: "Sales", target: 100, realisasi: 85, created_at: "2026-03-07T17:20:00+07:00" },
];

const hr_m_karyawan_rows: HrEmployeeItem[] = [
  { id: "emp-001", nama: "Anisa Putri", divisi: "Finance", status: "aktif" },
  { id: "emp-002", nama: "Rizal Mahendra", divisi: "HR", status: "aktif" },
  { id: "emp-003", nama: "Nadia Kurnia", divisi: "Produksi", status: "aktif" },
  { id: "emp-004", nama: "Fajar Hidayat", divisi: "Logistik", status: "aktif" },
  { id: "emp-005", nama: "Gita Mardiani", divisi: "Creative", status: "aktif" },
  { id: "emp-006", nama: "Dio Pratama", divisi: "Office", status: "aktif" },
  { id: "emp-007", nama: "Meylani Sari", divisi: "Management", status: "aktif" },
  { id: "emp-008", nama: "Tono Ardiansyah", divisi: "Sales", status: "nonaktif" },
];

const management_top_kpi_performers: KpiPerformerItem[] = [
  { nama_karyawan: "Anisa Putri", divisi: "Finance", skor_kpi: 95.5 },
  { nama_karyawan: "Nadia Kurnia", divisi: "Produksi", skor_kpi: 93.8 },
  { nama_karyawan: "Fajar Hidayat", divisi: "Logistik", skor_kpi: 92.6 },
  { nama_karyawan: "Gita Mardiani", divisi: "Creative", skor_kpi: 91.9 },
];

const budgetSerapanPersen = 65;

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function budgetStatusBadgeClass(status: BudgetStatus): string {
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  if (status === "pending") return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

function budgetStatusLabel(status: BudgetStatus): string {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending";
  return "Rejected";
}

export default function ManagementDashboardPage() {
  const totalBudgetTahunIni = management_t_budget_request_rows.reduce(
    (sum, item) => sum + item.amount,
    0,
  );

  const rataRataSkorKpi =
    management_t_kpi_weekly_rows.reduce((sum, item) => sum + item.realisasi, 0) /
    management_t_kpi_weekly_rows.length;

  const totalKaryawanAktif = hr_m_karyawan_rows.filter(
    (employee) => employee.status === "aktif",
  ).length;

  const recentBudgetApprovals = [...management_t_budget_request_rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Management</h1>
        <p className="text-sm md:text-base text-slate-200">
          Executive Command Center untuk memantau performa finansial, SDM, dan KPI perusahaan.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -top-12 -right-10 h-32 w-32 rounded-full bg-[#BC934B]/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Budget Tahun Ini</p>
              <p className="text-base md:text-2xl font-bold text-slate-900 break-words leading-tight">
                {formatRupiah(totalBudgetTahunIni)}
              </p>
              <p className="text-xs md:text-sm text-slate-600">Terserap: {budgetSerapanPersen}%</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B]">
              <Landmark className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-blue-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rata-Rata Skor KPI</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{rataRataSkorKpi.toFixed(1)} / 100</p>
              <p className="text-xs md:text-sm text-slate-600">Kinerja Perusahaan: Sangat Baik</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Target className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-emerald-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Karyawan Aktif</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{totalKaryawanAktif}</p>
              <p className="text-xs md:text-sm text-slate-600">Tersebar di 7 Divisi</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/management/budget"
          className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm md:text-base font-bold text-slate-900">Alokasi & Serapan Anggaran</p>
              <p className="text-xs md:text-sm text-slate-600">Pantau pengajuan anggaran, status persetujuan, dan progres serapan.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-500 group-hover:translate-x-0.5 shrink-0" />
          </div>
        </Link>

        <Link
          href="/management/kpi"
          className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm md:text-base font-bold text-slate-900">Indikator Kinerja Utama</p>
              <p className="text-xs md:text-sm text-slate-600">Analisis capaian KPI lintas divisi untuk pengambilan keputusan strategis.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-500 group-hover:translate-x-0.5 shrink-0" />
          </div>
        </Link>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Recent Budget Approvals</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Pengajuan anggaran terbaru lintas divisi</p>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[460px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Divisi</th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nominal</th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentBudgetApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800">{item.divisi}</td>
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-700 whitespace-nowrap">{formatRupiah(item.amount)}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${budgetStatusBadgeClass(item.status)}`}>
                        {budgetStatusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Top KPI Performers</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Performa karyawan tertinggi bulan ini</p>
          </div>

          <ul className="p-4 md:p-6 space-y-3">
            {management_top_kpi_performers.map((item, index) => (
              <li key={`${item.nama_karyawan}-${item.divisi}`} className="rounded-lg border border-slate-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 break-words">{index + 1}. {item.nama_karyawan}</p>
                    <p className="text-xs md:text-sm text-slate-600">{item.divisi}</p>
                  </div>
                  <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap">
                    {item.skor_kpi.toFixed(1)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
