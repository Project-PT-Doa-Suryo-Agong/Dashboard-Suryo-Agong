"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Landmark, Target, Users } from "lucide-react";
import { PerformanceBarChart, type PerformancePoint } from "@/components/ui/DashboardCharts";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TBudgetRequest } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type BudgetStatus = "pending" | "approved" | "rejected" | null;

type BudgetListPayload = {
  budget_requests: TBudgetRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type PenilaianRekap = {
  nama_karyawan: string;
  jumlah_penilai: number;
  bulan: number;
  tahun: number;
  avg_kepribadian_persen: number;
  avg_teamwork_persen: number;
  avg_wawasan_persen: number;
  avg_komunikasi_persen: number;
  avg_networking_persen: number;
  avg_produktivitas_persen: number;
  avg_problem_solving_persen: number;
  avg_leadership_persen: number;
  skor_akhir_total: number;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function budgetStatusBadgeClass(status: BudgetStatus): string {
  if (status === "approved") return "bg-emerald-500 text-white";
  if (status === "pending") return "bg-amber-500 text-white";
  return "bg-rose-500 text-white";
}

function budgetStatusLabel(status: BudgetStatus): string {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending";
  return "Rejected";
}

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  return "D";
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function ManagementDashboardPage() {
  const [budgetItems, setBudgetItems] = useState<TBudgetRequest[]>([]);
  const [penilaianItems, setPenilaianItems] = useState<PenilaianRekap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverview = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [budgetResponse, penilaianResponse] = await Promise.all([
          apiFetch("/api/management/budget?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/management/penilaian", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
        ]);

        const budgetPayload = await parseJsonResponse<BudgetListPayload>(budgetResponse);
        const penilaianPayload = await parseJsonResponse<{ items: PenilaianRekap[] }>(penilaianResponse);
        
        setBudgetItems(budgetPayload.data.budget_requests ?? []);
        setPenilaianItems(penilaianPayload.data.items ?? []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat ringkasan management.";
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOverview();
  }, []);

  const totalBudgetTahunIni = useMemo(
    () => budgetItems.reduce((sum, item) => sum + item.amount, 0),
    [budgetItems],
  );

  const approvedAmount = useMemo(
    () => budgetItems.filter((item) => item.status === "approved").reduce((sum, item) => sum + item.amount, 0),
    [budgetItems],
  );

  const budgetSerapanPersen = useMemo(
    () => (totalBudgetTahunIni > 0 ? Math.round((approvedAmount / totalBudgetTahunIni) * 100) : 0),
    [approvedAmount, totalBudgetTahunIni],
  );

  const rataRataSkorPenilaian = useMemo(() => {
    if (penilaianItems.length === 0) return 0;
    const totalScore = penilaianItems.reduce((sum, item) => sum + Number(item.skor_akhir_total), 0);
    return totalScore / penilaianItems.length;
  }, [penilaianItems]);

  const totalDivisiAktif = useMemo(() => {
    const divisions = new Set<string>();
    for (const item of budgetItems) {
      if (item.divisi?.trim()) divisions.add(item.divisi.trim());
    }
    return divisions.size;
  }, [budgetItems]);

  const recentBudgetApprovals = useMemo(
    () => [...budgetItems]
      .sort((a, b) => {
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 4),
    [budgetItems],
  );

  const topKaryawan = useMemo(() => {
    return [...penilaianItems]
      .sort((a, b) => b.skor_akhir_total - a.skor_akhir_total);
  }, [penilaianItems]);

  const managementPerformancePreview: PerformancePoint[] = useMemo(
    () => topKaryawan.slice(0, 6).map((item) => ({ label: item.nama_karyawan, value: Math.round(item.skor_akhir_total) })),
    [topKaryawan],
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Management</h1>
        <p className="text-sm md:text-base text-slate-200">
          Executive Command Center untuk memantau performa finansial dan penilaian kinerja karyawan.
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
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B] text-white">
              <Landmark className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-blue-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rata-Rata Penilaian Pekerja</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{rataRataSkorPenilaian.toFixed(1)}%</p>
              <p className="text-xs md:text-sm text-slate-600">Berdasarkan rekap penilaian terbaru</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Target className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-10 h-28 w-28 rounded-full bg-emerald-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Divisi Aktif</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{totalDivisiAktif}</p>
              <p className="text-xs md:text-sm text-slate-600">Divisi unik dari data pengajuan anggaran</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
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
          href="/penilaian-karyawan"
          className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-sm md:text-base font-bold text-slate-900">Penilaian Pekerja</p>
              <p className="text-xs md:text-sm text-slate-600">Pantau rekapitulasi performa dan penilaian kinerja karyawan.</p>
            </div>
            <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-500 group-hover:translate-x-0.5 shrink-0" />
          </div>
        </Link>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
        <div className="mb-3 md:mb-4">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Performa Pekerja</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">Visualisasi nilai performa pekerja untuk evaluasi cepat manajemen.</p>
        </div>
        {managementPerformancePreview.length > 0 ? (
          <PerformanceBarChart data={managementPerformancePreview} barLabel="Skor Evaluasi" />
        ) : (
          <p className="text-sm text-slate-500">Belum ada data penilaian.</p>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Persetujuan Anggaran Terbaru</h2>
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
            <h2 className="text-base font-bold text-slate-900">Pekerja Terbaik</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Karyawan dengan rata-rata nilai performa tertinggi</p>
          </div>

          <ul className="p-4 md:p-6 space-y-3">
            {topKaryawan.length > 0 ? (
              topKaryawan.slice(0, 4).map((item, index) => (
                <li key={`${item.nama_karyawan}-${index}`} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 break-words">{index + 1}. {item.nama_karyawan}</p>
                      <p className="text-xs md:text-sm text-slate-600">Periode: {MONTHS[item.bulan - 1]} {item.tahun}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-white whitespace-nowrap">
                      Grade {getGrade(item.skor_akhir_total)} ({item.skor_akhir_total.toFixed(1)}%)
                    </span>
                  </div>
                </li>
              ))
            ) : (
              <li className="rounded-lg border border-slate-100 p-3 text-sm text-slate-500">Belum ada data penilaian.</li>
            )}
          </ul>
        </article>
      </section>

      {isLoading ? <p className="text-sm text-slate-200">Memuat data dashboard management...</p> : null}
      {errorMessage ? <p className="text-sm text-rose-200">{errorMessage}</p> : null}
    </div>
  );
}
