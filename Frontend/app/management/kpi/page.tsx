"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Download,
  Search,
  Trophy,
} from "lucide-react";

type KpiWeeklyItem = {
  id: string;
  minggu: string;
  divisi: string;
  target: number;
  realisasi: number;
  score: number;
};

type WeekFilter = "all" | "Week 1 - Mar 2026" | "Week 2 - Mar 2026";

const DUMMY_KPI_WEEKLY_DATA: KpiWeeklyItem[] = [
  {
    id: "KPI-2603-001",
    minggu: "Week 1 - Mar 2026",
    divisi: "Logistik",
    target: 100,
    realisasi: 52,
    score: 52,
  },
  {
    id: "KPI-2603-002",
    minggu: "Week 1 - Mar 2026",
    divisi: "HR",
    target: 100,
    realisasi: 68,
    score: 68,
  },
  {
    id: "KPI-2603-003",
    minggu: "Week 1 - Mar 2026",
    divisi: "Finance",
    target: 100,
    realisasi: 74,
    score: 74,
  },
  {
    id: "KPI-2603-004",
    minggu: "Week 2 - Mar 2026",
    divisi: "Produksi",
    target: 100,
    realisasi: 82,
    score: 82,
  },
  {
    id: "KPI-2603-005",
    minggu: "Week 2 - Mar 2026",
    divisi: "Management",
    target: 100,
    realisasi: 91,
    score: 91,
  },
  {
    id: "KPI-2603-006",
    minggu: "Week 2 - Mar 2026",
    divisi: "Creative",
    target: 100,
    realisasi: 98,
    score: 98,
  },
];

function statusClass(score: number): string {
  if (score < 60) return "bg-rose-100 text-rose-700";
  if (score <= 80) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function statusLabel(score: number): string {
  if (score < 60) return "Kurang";
  if (score <= 80) return "Cukup";
  return "Baik";
}

export default function ManagementKpiPage() {
  const [items] = useState<KpiWeeklyItem[]>(DUMMY_KPI_WEEKLY_DATA);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterWeek, setFilterWeek] = useState<WeekFilter>("all");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchDivision = item.divisi.toLowerCase().includes(keyword);
      const matchWeek = filterWeek === "all" ? true : item.minggu === filterWeek;
      return matchDivision && matchWeek;
    });
  }, [items, searchTerm, filterWeek]);

  const averagePerformance = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    const totalScore = filteredItems.reduce((sum, item) => sum + item.score, 0);
    return Math.round(totalScore / filteredItems.length);
  }, [filteredItems]);

  const bestDivision = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return [...filteredItems].sort((a, b) => b.score - a.score)[0];
  }, [filteredItems]);

  const needAttentionCount = useMemo(
    () => filteredItems.filter((item) => item.score < 70).length,
    [filteredItems],
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          Key Performance Indicator (KPI)
        </h1>
        <p className="text-sm md:text-base text-slate-200">
          Pantau target dan realisasi kinerja mingguan setiap divisi.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rata-Rata Performa
              </p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">
                {averagePerformance}%
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Activity className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Divisi Terbaik
              </p>
              <p className="text-lg md:text-2xl font-bold text-[#BC934B] break-words">
                {bestDivision ? `${bestDivision.divisi} (${bestDivision.score}%)` : "-"}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-[#BC934B]">
              <Trophy className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Perlu Perhatian
              </p>
              <p className="text-2xl md:text-3xl font-bold text-rose-600">
                {needAttentionCount}
              </p>
              <p className="text-xs md:text-sm text-rose-500">Score di bawah target (&lt; 70%)</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
          <div className="relative w-full sm:flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama divisi..."
              className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </div>

          <select
            value={filterWeek}
            onChange={(event) => setFilterWeek(event.target.value as WeekFilter)}
            className="w-full sm:w-56 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          >
            <option value="all">Semua Minggu</option>
            <option value="Week 1 - Mar 2026">Week 1</option>
            <option value="Week 2 - Mar 2026">Week 2</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 transition hover:text-white hover:bg-blue-500"
        >
          <Download size={17} />
          Download Report
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-max w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Minggu
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Divisi
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Target
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Realisasi
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Pencapaian (%)
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {item.minggu}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800">
                      {item.divisi}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {item.target}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {item.realisasi}
                    </td>
                    <td className="px-4 md:px-6 py-3 min-w-[220px]">
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-slate-800">{item.score}%</p>
                        <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-500"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                          item.score,
                        )}`}
                      >
                        {statusLabel(item.score)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
                    Data KPI tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
