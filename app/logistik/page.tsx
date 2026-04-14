"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Package, RefreshCcw, Truck } from "lucide-react";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TLogistikManifest, TPacking, TReturnOrder } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type PackingStatus = "pending" | "packed" | "shipped";
type ReturnStatus = "pending" | "diproses" | "selesai" | "unknown";

type PackingListPayload = {
  packing: TPacking[];
  meta: { page: number; limit: number; total: number };
};

type ManifestListPayload = {
  manifest: TLogistikManifest[];
  meta: { page: number; limit: number; total: number };
};

type ReturnListPayload = {
  returns: TReturnOrder[];
  meta: { page: number; limit: number; total: number };
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

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function getPackingStatus(status: TPacking["status"]): PackingStatus {
  if (status === "pending" || status === "packed" || status === "shipped") {
    return status;
  }
  return "pending";
}

function getReturnStatus(status: TReturnOrder["status"]): ReturnStatus {
  if (status === "pending" || status === "diproses" || status === "selesai") {
    return status;
  }
  return "unknown";
}

function returnStatusClass(status: ReturnStatus): string {
  if (status === "pending") return "bg-red-100 text-red-700";
  if (status === "diproses") return "bg-orange-100 text-orange-700";
  if (status === "selesai") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-100 text-slate-700";
}

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const raw = await response.text();

  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    const fallback = response.ok ? "Respons server tidak valid (bukan JSON)." : raw.slice(0, 200);
    throw new Error(fallback || "Respons server tidak valid.");
  }

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }

  return payload;
}

export default function LogistikDashboardPage() {
  const [packingRows, setPackingRows] = useState<TPacking[]>([]);
  const [manifestRows, setManifestRows] = useState<TLogistikManifest[]>([]);
  const [returnRows, setReturnRows] = useState<TReturnOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPacking = async () => {
    const response = await apiFetch("/api/logistics/packing?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<PackingListPayload>(response);
    setPackingRows(payload.data.packing ?? []);
  };

  const fetchManifest = async () => {
    const response = await apiFetch("/api/logistics/manifest?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<ManifestListPayload>(response);
    setManifestRows(payload.data.manifest ?? []);
  };

  const fetchReturns = async () => {
    const response = await apiFetch("/api/logistics/returns?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<ReturnListPayload>(response);
    setReturnRows(payload.data.returns ?? []);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPacking(), fetchManifest(), fetchReturns()]);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat dashboard logistik.";
        alert(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const packingBreakdown = useMemo(() => {
    return packingRows.reduce(
      (acc, row) => {
        const status = getPackingStatus(row.status);
        acc[status] += 1;
        return acc;
      },
      { pending: 0, packed: 0, shipped: 0 } as Record<PackingStatus, number>,
    );
  }, [packingRows]);

  const totalPacking = useMemo(() => {
    return packingBreakdown.pending + packingBreakdown.packed + packingBreakdown.shipped;
  }, [packingBreakdown]);

  const activeManifestCount = manifestRows.length;

  const pendingReturnCount = useMemo(() => {
    return returnRows.filter((row) => getReturnStatus(row.status) === "pending").length;
  }, [returnRows]);

  const recentManifests = useMemo(() => {
    return [...manifestRows]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [manifestRows]);

  const recentReturns = useMemo(() => {
    return [...returnRows]
      .sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 5);
  }, [returnRows]);

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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Packing</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{isLoading ? "..." : totalPacking}</p>
              <p className="mt-1 text-xs md:text-sm text-slate-600">
                {isLoading
                  ? "Memuat..."
                  : `${packingBreakdown.packed} Selesai, ${packingBreakdown.pending} Proses, ${packingBreakdown.shipped} Dikirim`}
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
              <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{isLoading ? "..." : activeManifestCount}</p>
              <p className="mt-1 text-xs md:text-sm text-slate-600">Data manifest saat ini</p>
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
              <p className="mt-1 text-2xl md:text-3xl font-bold text-orange-600">{isLoading ? "..." : pendingReturnCount}</p>
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
            <p className="mt-1 text-xs md:text-sm text-slate-500">5 data manifest terbaru</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-115">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Order ID
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Resi
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Dibuat
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">Memuat data...</td>
                  </tr>
                ) : recentManifests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 md:px-6 py-6 text-center text-sm text-slate-500">Belum ada data manifest.</td>
                  </tr>
                ) : (
                  recentManifests.map((manifest, index) => (
                    <tr key={`${manifest.order_id}-${manifest.created_at ?? "-"}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-700">{manifest.order_id}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{manifest.resi ?? "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700">
                        {manifest.created_at ? dateTimeFormatter.format(new Date(manifest.created_at)) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">Recent Returns</h3>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Daftar retur terbaru</p>
          </div>

          <div className="p-4 md:p-6">
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat data...</p>
            ) : recentReturns.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data retur.</p>
            ) : (
              <ul className="space-y-3">
                {recentReturns.map((item) => {
                  const status = getReturnStatus(item.status);
                  return (
                    <li key={item.id} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 wrap-break-word">Order: {item.order_id ?? "-"}</p>
                          <p className="text-xs md:text-sm text-slate-600 wrap-break-word">{item.alasan}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize whitespace-nowrap ${returnStatusClass(
                            status,
                          )}`}
                        >
                          {status === "unknown" ? "N/A" : status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
