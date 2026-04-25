"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  FileText,
  Tv2,
  Users,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type {
  MAfiliator,
  MVarian,
  TContentPlanner,
  TContentStatistic,
  TSalesOrder,
} from "@/types/supabase";

type SalesOrderListPayload = { orders: TSalesOrder[] };
type ContentStatsListPayload = { content_stats: TContentStatistic[] };
type ContentListPayload = { content: TContentPlanner[] };
type AffiliatorListPayload = { afiliator: MAfiliator[] };
type VarianListPayload = { varian: MVarian[] };

async function parseJsonResponse<T>(
  response: Response,
): Promise<ApiSuccess<T>> {
  const raw = await response.text();
  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    const fallback = response.ok
      ? "Respons server tidak valid (bukan JSON)."
      : raw.slice(0, 200);
    throw new Error(fallback || "Respons server tidak valid.");
  }

  if (!response.ok || !payload.success) {
    const message = payload.success
      ? "Terjadi kesalahan."
      : payload.error.message;
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

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CreativeDashboard() {
  const [orders, setOrders] = useState<TSalesOrder[]>([]);
  const [contentStats, setContentStats] = useState<TContentStatistic[]>([]);
  const [contents, setContents] = useState<TContentPlanner[]>([]);
  const [affiliators, setAffiliators] = useState<MAfiliator[]>([]);
  const [variants, setVariants] = useState<MVarian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [
          ordersResponse,
          contentStatsResponse,
          contentResponse,
          affiliatesResponse,
          variantsResponse,
        ] = await Promise.all([
          apiFetch("/api/sales/orders?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/sales/content-stats?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/sales/content?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/sales/affiliates?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/core/variants", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
        ]);

        const ordersPayload =
          await parseJsonResponse<SalesOrderListPayload>(ordersResponse);
        const contentStatsPayload =
          await parseJsonResponse<ContentStatsListPayload>(contentStatsResponse);
        const contentPayload =
          await parseJsonResponse<ContentListPayload>(contentResponse);
        const affiliatesPayload =
          await parseJsonResponse<AffiliatorListPayload>(affiliatesResponse);
        const variantsPayload =
          await parseJsonResponse<VarianListPayload>(variantsResponse);

        setOrders(ordersPayload.data.orders ?? []);
        setContentStats(contentStatsPayload.data.content_stats ?? []);
        setContents(contentPayload.data.content ?? []);
        setAffiliators(affiliatesPayload.data.afiliator ?? []);
        setVariants(variantsPayload.data.varian ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal memuat dashboard creative.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  const totalSalesRevenue = useMemo(
    () => orders.reduce((sum, item) => sum + (item.total_price ?? 0), 0),
    [orders],
  );

  const liveRevenue = useMemo(
    () => contentStats.reduce((sum, item) => sum + (item.monetasi ?? 0), 0),
    [contentStats],
  );

  const recentContents = useMemo(
    () =>
      [...contents]
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 3),
    [contents],
  );

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => {
          const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5),
    [orders],
  );

  const variantNameById = useMemo(
    () =>
      new Map<string, string>(
        variants.map((item) => [item.id, item.nama_varian ?? "-"]),
      ),
    [variants],
  );

  const affiliatorById = useMemo(
    () =>
      new Map<string, MAfiliator>(affiliators.map((item) => [item.id, item])),
    [affiliators],
  );

  const quickLinks = [
    { label: "Affiliators", href: "/creative/affiliates", className: "block rounded-xl border bg-blue-400 border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-500 text-white" },
    { label: "Content Planner", href: "/creative/content", className: "block rounded-xl border bg-green-400 border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-500 text-white" },
    { label: "Live Performance", href: "/creative/content-stats", className: "block rounded-xl border bg-orange-400 border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-500 text-white" },
    { label: "Sales Order", href: "/creative/sales-order", className: "block rounded-xl border bg-red-400 border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-500 text-white" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-3 md:space-y-4 md:p-4 lg:space-y-8 lg:p-8">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">
              Total Sales Revenue
            </p>
            <p className="mt-1 text-medium font-bold text-slate-900 md:text-2xl lg:text-xl">
              {formatRupiah(totalSalesRevenue)}
            </p>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Banknote className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">
              Active Affiliators
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-2xl">
              {affiliators.length}
            </h3>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Users className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">
              Total Content Planned
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
              {contents.length}
            </h3>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <FileText className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 md:text-sm lg:text-base">
              Live Stream Revenue
            </p>
            <h3 className="mt-1 text-lg font-bold text-slate-900 md:text-2xl lg:text-xl">
              {formatRupiah(liveRevenue)}
            </h3>
          </div>
          <div className="rounded-lg bg-primary/10 p-2 text-slate-600 md:p-3">
            <Tv2 className="h-5 w-5 flex-shrink-0 md:h-6 md:w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:col-span-2 md:p-4 lg:p-6">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center md:mb-6 md:gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">
                Content Stats Revenue
              </h3>
              <p className="text-xs text-slate-500 md:text-sm lg:text-base">
                  Akumulasi monetasi dari data content stats.
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
                {formatRupiah(liveRevenue)}
              </span>
              <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-600 md:text-xs">
                {contentStats.length} Data
              </span>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500">
              Memuat data content stats...
            </p>
          ) : contentStats.length === 0 ? (
            <p className="text-sm text-slate-500">
              Belum ada data content stats.
            </p>
          ) : (
            <div className="space-y-2">
              {contentStats.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.t_content_planner?.judul ?? "Konten"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatRupiah(item.monetasi ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <h3 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">
              Quick Links
            </h3>
          </div>

          <div className="space-y-2">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={item.className}
              >
                <div className="flex items-center justify-between text-slate-900 hover:text-slate-100">
                  <div className="text-sm font-semibold">
                    <p className="">{item.label}</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                      <ArrowRight className="h-2 w-2 flex-shrink-0 md:h-4 md:w-4" />
                    </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
