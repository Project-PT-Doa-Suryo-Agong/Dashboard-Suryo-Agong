"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckSquare,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";
import type { ApiError, ApiSuccess } from "@/types/api";
import type {
  MProduk,
  ProductionQcResult,
  ProductionStatus,
  TProduksiOrder,
  TQCInbound,
  TQCOutbound,
} from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type OrdersListPayload = {
  orders: TProduksiOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type QcInboundListPayload = {
  qc_inbound: TQCInbound[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type QcOutboundListPayload = {
  qc_outbound: TQCOutbound[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type ProductsListPayload = {
  produk: MProduk[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type DisplayOrderStatus = ProductionStatus | "unknown";
type DisplayQcStatus = ProductionQcResult | "unknown";

const quick_links = [
  {
    href: "/produksi/orders",
    title: "Daftar Pesanan Produksi",
    description: "Kelola antrean batch dan progres produksi harian.",
  },
  {
    href: "/produksi/qc/inbound",
    title: "QC Bahan Baku Masuk",
    description: "Lanjutkan inspeksi material supplier sebelum masuk gudang.",
  },
  {
    href: "/produksi/qc/outbound",
    title: "QC Produk Jadi",
    description: "Evaluasi kualitas akhir produk sebelum serah logistik.",
  },
];

const order_status_label: Record<DisplayOrderStatus, string> = {
  draft: "Draft",
  ongoing: "Berjalan",
  done: "Selesai",
  unknown: "Tidak diketahui",
};

const order_status_class: Record<DisplayOrderStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  ongoing: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
  unknown: "bg-slate-100 text-slate-700",
};

const qc_result_label: Record<DisplayQcStatus, string> = {
  pass: "Pass",
  reject: "Reject",
  unknown: "N/A",
};

const qc_result_class: Record<DisplayQcStatus, string> = {
  pass: "bg-emerald-100 text-emerald-700",
  reject: "bg-rose-100 text-rose-700",
  unknown: "bg-slate-100 text-slate-700",
};

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

function getOrderStatus(status: ProductionStatus | null): DisplayOrderStatus {
  if (status === "draft" || status === "ongoing" || status === "done") {
    return status;
  }
  return "unknown";
}

function getQcStatus(status: ProductionQcResult | null): DisplayQcStatus {
  if (status === "pass" || status === "reject") {
    return status;
  }
  return "unknown";
}

export default function ProduksiDashboardPage() {
  const [orders, setOrders] = useState<TProduksiOrder[]>([]);
  const [qcInboundRows, setQcInboundRows] = useState<TQCInbound[]>([]);
  const [qcOutboundRows, setQcOutboundRows] = useState<TQCOutbound[]>([]);
  const [products, setProducts] = useState<MProduk[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = async () => {
    const response = await apiFetch("/api/production/orders?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<OrdersListPayload>(response);
    setOrders(payload.data.orders ?? []);
  };

  const fetchQcInbound = async () => {
    const response = await apiFetch("/api/production/qc-inbound?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<QcInboundListPayload>(response);
    setQcInboundRows(payload.data.qc_inbound ?? []);
  };

  const fetchQcOutbound = async () => {
    const response = await apiFetch("/api/production/qc-outbound?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<QcOutboundListPayload>(response);
    setQcOutboundRows(payload.data.qc_outbound ?? []);
  };

  const fetchProducts = async () => {
    const response = await apiFetch("/api/core/products?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<ProductsListPayload>(response);
    setProducts(payload.data.produk ?? []);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchOrders(),
          fetchQcInbound(),
          fetchQcOutbound(),
          fetchProducts(),
        ]);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Gagal memuat dashboard produksi.";
        alert(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const productById = useMemo(
    () =>
      Object.fromEntries(
        products.map((item) => [item.id, item.nama_produk]),
      ) as Record<string, string>,
    [products],
  );

  const orderById = useMemo(
    () => Object.fromEntries(orders.map((item) => [item.id, item])) as Record<string, TProduksiOrder>,
    [orders],
  );

  const pesanan_aktif_count = useMemo(() => {
    return orders.filter((item) => item.status === "ongoing").length;
  }, [orders]);

  const antrean_qc_inbound_count = useMemo(() => {
    return qcInboundRows.filter((item) => item.hasil === "reject").length;
  }, [qcInboundRows]);

  const outbound_passed_rate = useMemo(() => {
    if (qcOutboundRows.length === 0) return 0;
    const passed_count = qcOutboundRows.filter((item) => item.hasil === "pass").length;
    return Math.round((passed_count / qcOutboundRows.length) * 100);
  }, [qcOutboundRows]);

  const pesanan_berjalan_rows = useMemo(() => {
    return orders.filter((item) => item.status === "ongoing").slice(0, 5);
  }, [orders]);

  const hasil_qc_terbaru_rows = useMemo(() => {
    return [...qcOutboundRows]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [qcOutboundRows]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Produksi</h1>
        <p className="text-sm md:text-base text-slate-300">
          Command Center untuk monitoring pesanan dan kualitas dari inbound sampai outbound.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#BC934B]/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pesanan Aktif (Orders)</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{pesanan_aktif_count} Batch</p>
              <p className="text-xs md:text-sm text-slate-600">Sedang dalam proses (In Progress)</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] shrink-0">
              <ClipboardList className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-amber-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-amber-100/80" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Antrean QC Inbound</p>
              <p className="text-base md:text-2xl font-bold text-amber-700">{antrean_qc_inbound_count} Inspeksi</p>
              <p className="text-xs md:text-sm text-amber-700/80">Bahan baku dengan hasil reject</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-emerald-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-8 h-28 w-28 rounded-full bg-emerald-100/80" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Lolos QC Akhir (Outbound)</p>
              <p className="text-base md:text-2xl font-bold text-emerald-700">{outbound_passed_rate}%</p>
              <p className="text-xs md:text-sm text-emerald-700/80">Produk jadi siap kirim ke logistik</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <CheckSquare className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-200">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quick_links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-400"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm md:text-base font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs md:text-sm text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700 group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Pesanan Berjalan</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Ringkasan dari /produksi/orders</p>
          </div>

          <div className="px-4 md:px-6 py-4 overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Pesanan</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Target Qty</th>
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr key="loading-orders-row">
                    <td colSpan={4} className="py-5 text-sm text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : pesanan_berjalan_rows.length === 0 ? (
                  <tr key="empty-orders-row">
                    <td colSpan={4} className="py-5 text-sm text-slate-500">
                      Belum ada pesanan berstatus berjalan.
                    </td>
                  </tr>
                ) : (
                  pesanan_berjalan_rows.map((item) => {
                    const displayStatus = getOrderStatus(item.status);
                    return (
                      <tr key={item.id}>
                        <td className="py-3 pr-2 text-sm font-semibold text-slate-800 break-all">{item.id}</td>
                        <td className="py-3 pr-2 text-sm text-slate-700 wrap-break-word">
                          {productById[item.product_id ?? ""] ?? "Produk tidak ditemukan"}
                        </td>
                        <td className="py-3 pr-2 text-sm text-slate-700 whitespace-nowrap">{item.quantity ?? 0} Unit</td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${order_status_class[displayStatus]}`}>
                            {order_status_label[displayStatus]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Hasil QC Terbaru</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">Ringkasan dari /produksi/qc/outbound</p>
          </div>

          <div className="px-4 md:px-6 py-4 overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Batch</th>
                  <th className="pb-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                  <th className="pb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Hasil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr key="loading-qc-row">
                    <td colSpan={3} className="py-5 text-sm text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : hasil_qc_terbaru_rows.length === 0 ? (
                  <tr key="empty-qc-row">
                    <td colSpan={3} className="py-5 text-sm text-slate-500">
                      Belum ada data QC outbound.
                    </td>
                  </tr>
                ) : (
                  hasil_qc_terbaru_rows.map((item, index) => {
                    const relatedOrder = orderById[item.produksi_order_id ?? ""];
                    const displayStatus = getQcStatus(item.hasil);
                    const rowKey = item.id || `${item.produksi_order_id ?? "no-order"}-${item.created_at ?? "no-date"}-${index}`;

                    return (
                      <tr key={rowKey}>
                        <td className="py-3 pr-2 text-sm font-semibold text-slate-800 break-all">
                          {relatedOrder?.id ?? item.produksi_order_id ?? "-"}
                        </td>
                        <td className="py-3 pr-2 text-sm text-slate-700 wrap-break-word">
                          {relatedOrder
                            ? productById[relatedOrder.product_id ?? ""] ?? "Produk tidak ditemukan"
                            : "Produk tidak ditemukan"}
                        </td>
                        <td className="py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${qc_result_class[displayStatus]}`}>
                            {qc_result_label[displayStatus]}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
