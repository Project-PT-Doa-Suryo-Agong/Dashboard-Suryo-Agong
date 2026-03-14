"use client";

import Link from "next/link";
import { ArrowRight, Package, RefreshCcw, Truck } from "lucide-react";

type PackingStatus = "pending" | "packed" | "shipped";
type ManifestStatus = "pending" | "dikirim" | "selesai";
type ReturnStatus = "pending" | "diproses" | "selesai";

type ManifestRecord = {
  manifest_id: string;
  tujuan: string;
  manifest_status: ManifestStatus;
};

type ReturnRecord = {
  nama_barang: string;
  alasan_retur: string;
  return_status: ReturnStatus;
};

type LogisticsDashboardData = {
  packing_breakdown: Record<PackingStatus, number>;
  manifest_pengiriman_aktif: number;
  retur_pending: number;
  recent_manifests: ManifestRecord[];
  recent_returns: ReturnRecord[];
};

const LOGISTICS_DASHBOARD_DUMMY: LogisticsDashboardData = {
  packing_breakdown: {
    pending: 25,
    packed: 120,
    shipped: 0,
  },
  manifest_pengiriman_aktif: 12,
  retur_pending: 3,
  recent_manifests: [
    { manifest_id: "MNF-260314-001", tujuan: "Bandung", manifest_status: "dikirim" },
    { manifest_id: "MNF-260314-002", tujuan: "Surabaya", manifest_status: "pending" },
    { manifest_id: "MNF-260313-019", tujuan: "Semarang", manifest_status: "selesai" },
    { manifest_id: "MNF-260313-018", tujuan: "Yogyakarta", manifest_status: "dikirim" },
  ],
  recent_returns: [
    { nama_barang: "Jaket Windproof", alasan_retur: "Ukuran tidak sesuai", return_status: "pending" },
    { nama_barang: "Sepatu Safety", alasan_retur: "Salah varian warna", return_status: "diproses" },
    { nama_barang: "Helm Pro Guard", alasan_retur: "Terdapat cacat minor", return_status: "pending" },
    { nama_barang: "Tas Utility", alasan_retur: "Aksesoris kurang lengkap", return_status: "selesai" },
  ],
};

const QUICK_LINKS = [
  {
    title: "Kelola Packing",
    description: "Pantau proses packing harian tim gudang.",
    href: "/logistik/packing",
  },
  {
    title: "Kelola Manifest",
    description: "Atur manifest aktif dan status pengiriman.",
    href: "/logistik/manifest",
  },
  {
    title: "Kelola Retur",
    description: "Tinjau barang retur dan tindak lanjutnya.",
    href: "/logistik/returns",
  },
];

function manifestStatusClass(status: ManifestStatus): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "dikirim") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

function returnStatusClass(status: ReturnStatus): string {
  if (status === "pending") return "bg-red-100 text-red-700";
  if (status === "diproses") return "bg-orange-100 text-orange-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function LogistikDashboardPage() {
  const totalPackingHariIni = Object.values(LOGISTICS_DASHBOARD_DUMMY.packing_breakdown).reduce(
    (total, value) => total + value,
    0,
  );
  const packingSelesai = LOGISTICS_DASHBOARD_DUMMY.packing_breakdown.packed;
  const packingProses = LOGISTICS_DASHBOARD_DUMMY.packing_breakdown.pending;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Logistik</h1>
        <p className="text-sm md:text-base text-slate-300">
          Command Center untuk monitoring pengiriman, gudang, dan retur dalam satu tampilan.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Packing Hari Ini</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{totalPackingHariIni}</p>
              <p className="mt-1 text-xs md:text-sm text-slate-600">
                {packingSelesai} Selesai, {packingProses} Proses
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B]">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Manifest Pengiriman Aktif</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">
                {LOGISTICS_DASHBOARD_DUMMY.manifest_pengiriman_aktif}
              </p>
              <p className="mt-1 text-xs md:text-sm text-slate-600">Sedang dalam perjalanan</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Truck className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retur Pending</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-orange-600">{LOGISTICS_DASHBOARD_DUMMY.retur_pending}</p>
              <p className="mt-1 text-xs md:text-sm text-orange-500">Perlu penanganan segera</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <RefreshCcw className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-100">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-500"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm md:text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-xs md:text-sm text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-400 transition group-hover:text-slate-500 group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Manifests</h3>
            <p className="mt-1 text-xs md:text-sm text-slate-500">4 manifest pengiriman terakhir</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[460px]">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    ID Manifest
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Tujuan
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LOGISTICS_DASHBOARD_DUMMY.recent_manifests.map((manifest) => (
                  <tr key={manifest.manifest_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-700">{manifest.manifest_id}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{manifest.tujuan}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${manifestStatusClass(
                          manifest.manifest_status,
                        )}`}
                      >
                        {manifest.manifest_status}
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
            <h3 className="text-base font-bold text-slate-900">Recent Returns</h3>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Daftar barang retur terbaru</p>
          </div>

          <div className="p-4 md:p-6">
            <ul className="space-y-3">
              {LOGISTICS_DASHBOARD_DUMMY.recent_returns.map((item, index) => (
                <li key={`${item.nama_barang}-${index}`} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 break-words">{item.nama_barang}</p>
                      <p className="text-xs md:text-sm text-slate-600 break-words">{item.alasan_retur}</p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize whitespace-nowrap ${returnStatusClass(
                        item.return_status,
                      )}`}
                    >
                      {item.return_status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
