"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Package, RefreshCcw, Truck } from "lucide-react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MProduk, TLogistikManifest, TPacking, TProduksiOrder, TReturnOrder } from "@/types/supabase";

type PackingStatus = "pending" | "packed" | "shipped";

type PackingListPayload = {
  packing: TPacking[];
  meta: { page: number; limit: number; total: number };
};

type ManifestListPayload = {
  manifest: TLogistikManifest[];
  meta: { page: number; limit: number; total: number };
};

type ReturnsListPayload = {
  returns: TReturnOrder[];
  meta: { page: number; limit: number; total: number };
};

type OrdersListPayload = {
  orders: TProduksiOrder[];
  meta: { page: number; limit: number; total: number };
};

type ProductsListPayload = {
  produk: MProduk[];
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

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickPacking(data: unknown): TPacking[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TPacking>(source.packing ?? source.packings ?? source.data);
}

function pickManifest(data: unknown): TLogistikManifest[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TLogistikManifest>(source.manifest ?? source.manifests ?? source.data);
}

function pickReturns(data: unknown): TReturnOrder[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TReturnOrder>(source.returns ?? source.retur ?? source.data);
}

function pickOrders(data: unknown): TProduksiOrder[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TProduksiOrder>(source.orders ?? source.order ?? source.data);
}

function pickProducts(data: unknown): MProduk[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<MProduk>(source.produk ?? source.products ?? source.data);
}

function getOrderPrimaryKey(value: { order_id?: string | null; id?: string | null } | null | undefined): string {
  return value?.order_id ?? value?.id ?? "";
}

function shortId(id: string | null | undefined) {
  if (!id) return "-";
  return id.slice(0, 8).toUpperCase();
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
  const [isLoading, setIsLoading] = useState(true);
  const [packingItems, setPackingItems] = useState<TPacking[]>([]);
  const [manifestItems, setManifestItems] = useState<TLogistikManifest[]>([]);
  const [returnItems, setReturnItems] = useState<TReturnOrder[]>([]);
  const [orders, setOrders] = useState<TProduksiOrder[]>([]);
  const [products, setProducts] = useState<MProduk[]>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const [packingRes, manifestRes, returnsRes, ordersRes, productsRes] = await Promise.all([
          apiFetch("/api/logistics/packing?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/logistics/manifest?page=1&limit=200", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/logistics/returns?page=1&limit=200", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/production/orders?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
          apiFetch("/api/core/products?page=1&limit=500", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          }),
        ]);

        const [packingPayload, manifestPayload, returnsPayload, ordersPayload, productsPayload] = await Promise.all([
          parseJsonResponse<PackingListPayload>(packingRes),
          parseJsonResponse<ManifestListPayload>(manifestRes),
          parseJsonResponse<ReturnsListPayload>(returnsRes),
          parseJsonResponse<OrdersListPayload>(ordersRes),
          parseJsonResponse<ProductsListPayload>(productsRes),
        ]);

        setPackingItems(pickPacking(packingPayload.data));
        setManifestItems(pickManifest(manifestPayload.data));
        setReturnItems(pickReturns(returnsPayload.data));
        setOrders(pickOrders(ordersPayload.data));
        setProducts(pickProducts(productsPayload.data));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memuat dashboard logistik.";
        alert(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const orderById = useMemo(
    () =>
      Object.fromEntries(
        orders
          .map((order) => [getOrderPrimaryKey(order), order] as const)
          .filter(([orderId]) => !!orderId),
      ) as Record<string, TProduksiOrder>,
    [orders],
  );

  const productById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product.nama_produk])) as Record<string, string>,
    [products],
  );

  const packingBreakdown = useMemo(() => {
    const base: Record<PackingStatus, number> = { pending: 0, packed: 0, shipped: 0 };
    for (const item of packingItems) {
      const status = item.status;
      if (status === "pending" || status === "packed" || status === "shipped") {
        base[status] += 1;
      }
    }
    return base;
  }, [packingItems]);

  const totalPacking = packingItems.length;
  const totalManifest = manifestItems.length;
  const totalRetur = returnItems.length;
  const recentManifests = manifestItems.slice(0, 4);
  const recentReturns = returnItems.slice(0, 4);

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
                {packingBreakdown.packed} Selesai, {packingBreakdown.pending} Proses
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Manifest</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-slate-900">{isLoading ? "..." : totalManifest}</p>
              <p className="mt-1 text-xs md:text-sm text-slate-600">Data manifest pengiriman tercatat</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Truck className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Retur</p>
              <p className="mt-1 text-2xl md:text-3xl font-bold text-orange-600">{isLoading ? "..." : totalRetur}</p>
              <p className="mt-1 text-xs md:text-sm text-orange-500">Data pengajuan retur barang</p>
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
            <p className="mt-1 text-xs md:text-sm text-slate-500">4 manifest pengiriman terakhir dari database</p>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-115">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    ID Manifest
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Order
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Resi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={3} className="px-4 md:px-6 py-6 text-sm text-slate-500">Memuat data...</td>
                  </tr>
                ) : recentManifests.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 md:px-6 py-6 text-sm text-slate-500">Belum ada data manifest.</td>
                  </tr>
                ) : (
                  recentManifests.map((manifest, index) => (
                    <tr key={manifest.id || `${manifest.order_id ?? "no-order"}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-700">{shortId(manifest.id)}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{manifest.order_id ?? "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700">{manifest.resi ?? "-"}</td>
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
            <p className="mt-1 text-xs md:text-sm text-slate-500">Daftar retur terbaru dari database</p>
          </div>

          <div className="p-4 md:p-6">
            <ul className="space-y-3">
              {isLoading ? (
                <li className="rounded-lg border border-slate-100 p-3 text-sm text-slate-500">Memuat data...</li>
              ) : recentReturns.length === 0 ? (
                <li className="rounded-lg border border-slate-100 p-3 text-sm text-slate-500">Belum ada data retur.</li>
              ) : (
                recentReturns.map((item, index) => {
                  const order = orderById[item.order_id ?? ""];
                  const productName = productById[order?.product_id ?? ""] ?? "Produk tidak ditemukan";
                  return (
                    <li key={item.id || `${item.order_id ?? "no-order"}-${index}`} className="rounded-lg border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-slate-900 wrap-break-word">{productName}</p>
                          <p className="text-xs md:text-sm text-slate-600 wrap-break-word">{item.alasan ?? "Tanpa alasan"}</p>
                        </div>
                        <span className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap bg-orange-100 text-orange-700">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
                        </span>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </article>
      </section>
    </div>
  );
}
