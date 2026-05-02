"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Truck, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TLogistikManifest, TSalesOrder } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

type ProductLite = {
  id: string;
  nama_produk: string | null;
  kategori: string | null;
  foto_url: string | null;
};

type VariantLite = {
  id: string;
  product_id: string | null;
  nama_varian: string | null;
  sku: string | null;
  harga: number | null;
};

type ManifestItem = TLogistikManifest & {
  order?: TSalesOrder | null;
  variant?: VariantLite | null;
  product?: ProductLite | null;
};

type ManifestListPayload = {
  manifest: ManifestItem[];
  meta: { page: number; limit: number; total: number };
};

type ManifestPayload = { manifest: ManifestItem | null };

type OrdersListPayload = {
  orders: TSalesOrder[];
  meta: { page: number; limit: number; total: number };
};

type VariantsListPayload = {
  varian: VariantLite[];
  meta?: { page: number; limit: number; total: number };
};

const ORDER_FETCH_LIMIT = 200;
const ORDER_FETCH_MAX_PAGES = 50;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickOrders(data: unknown): TSalesOrder[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TSalesOrder>(source.orders ?? source.order ?? source.data);
}

function getOrderPrimaryKey(value: { order_id?: string | null; id?: string | null } | null | undefined): string {
  return value?.order_id ?? value?.id ?? "";
}

function getOrderDisplayCode(
  value: { order_code?: string | null; id?: string | null } | null | undefined,
  fallbackOrderId?: string | null,
): string {
  return value?.order_code?.trim() || value?.id || fallbackOrderId || "Order tidak ditemukan";
}

function getOrderVariantId(value: { varian_id?: string | null } | null | undefined): string {
  return value?.varian_id ?? "";
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function dedupeManifestRows(items: ManifestItem[]): ManifestItem[] {
  const byOrderId = new Map<string, ManifestItem>();
  const rowsWithoutOrderId: ManifestItem[] = [];

  for (const item of items) {
    const key = item.order_id ?? "";
    if (!key) {
      rowsWithoutOrderId.push(item);
      continue;
    }

    const existing = byOrderId.get(key);
    if (!existing || toTimestamp(item.created_at) >= toTimestamp(existing.created_at)) {
      byOrderId.set(key, item);
    }
  }

  return [...byOrderId.values(), ...rowsWithoutOrderId];
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

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function ManifestPage() {
  const [items, setItems] = useState<ManifestItem[]>([]);
  const [orders, setOrders] = useState<TSalesOrder[]>([]);
  const [variants, setVariants] = useState<VariantLite[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TLogistikManifest | null>(null);
  const [manifestNumber, setManifestNumber] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ order_id: string; resi: string }>({
    order_id: "",
    resi: "",
  });

  const fetchManifest = async () => {
    try {
      const response = await apiFetch("/api/logistics/manifest?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ManifestListPayload>(response);
      setItems(dedupeManifestRows(payload.data.manifest ?? []));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data manifest.";
      alert(message);
    }
  };

  const fetchOrders = async () => {
    try {
      const allOrders: TSalesOrder[] = [];

      for (let page = 1; page <= ORDER_FETCH_MAX_PAGES; page += 1) {
        const response = await apiFetch(`/api/sales/orders?page=${page}&limit=${ORDER_FETCH_LIMIT}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const payload = await parseJsonResponse<OrdersListPayload>(response);
        const pageOrders = pickOrders(payload.data);
        allOrders.push(...pageOrders);

        const total = payload.data.meta?.total ?? 0;
        if (pageOrders.length < ORDER_FETCH_LIMIT || allOrders.length >= total) {
          break;
        }
      }

      const dedupedOrders = Array.from(
        new Map(
          allOrders
            .map((order) => [getOrderPrimaryKey(order), order] as const)
            .filter(([orderId]) => !!orderId),
        ).values(),
      );

      setOrders(dedupedOrders);
      setFormData((prev) => ({ ...prev, order_id: prev.order_id || getOrderPrimaryKey(dedupedOrders[0]) || "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data pesanan.";
      alert(message);
    }
  };

  const fetchVariants = async () => {
    try {
      const response = await apiFetch("/api/core/variants", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VariantsListPayload>(response);
      setVariants(payload.data.varian ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data varian.";
      alert(message);
    }
  };

  const fetchDefaultManifestNumber = async () => {
    try {
      const response = await apiFetch("/api/logistics/manifest-number", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ count: number }>(response);
      const count = payload.data.count;

      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const nnnnn = String(count + 1).padStart(5, "0");

      setManifestNumber(`MNF-${mm}${yy}-${nnnnn}`);
    } catch (error) {
      console.error("Gagal mengambil manifest number:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchManifest(), fetchOrders(), fetchVariants(), fetchDefaultManifestNumber()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const orderById = useMemo(
    () =>
      Object.fromEntries(
        orders
          .map((order) => [getOrderPrimaryKey(order), order] as const)
          .filter(([orderId]) => !!orderId),
      ) as Record<string, TSalesOrder>,
    [orders],
  );

  const variantNameById = useMemo(
    () =>
      Object.fromEntries(
        variants
          .map((variant) => [variant.id, variant.nama_varian ?? ""] as const)
          .filter(([variantId]) => !!variantId),
      ) as Record<string, string>,
    [variants],
  );

  const resolveVariantName = (item: ManifestItem): string => {
    const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
    const variantId = getOrderVariantId(order);
    return item.variant?.nama_varian ?? variantNameById[variantId] ?? "Varian tidak ditemukan";
  };

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id ?? ""];
      const variantName = resolveVariantName(item).toLowerCase();
      return (
        (item.resi ?? "").toLowerCase().includes(keyword) ||
        getOrderDisplayCode(order, item.order_id).toLowerCase().includes(keyword) ||
        (item.order_id ?? "").toLowerCase().includes(keyword) ||
        variantName.includes(keyword) ||
        (item.product?.nama_produk ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm, orderById, variantNameById]);

  const resetForm = () => {
    setFormData({ order_id: getOrderPrimaryKey(orders[0]) || "", resi: "" });
    setEditData(null);
    void fetchDefaultManifestNumber();
  };

  const openFormModal = (item?: TLogistikManifest) => {
    if (item) {
      setEditData(item);
      setFormData({ order_id: item.order_id ?? "", resi: item.resi ?? "" });
    } else {
      resetForm();
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!formData.order_id) {
      alert("Order wajib dipilih.");
      return;
    }
    if (!formData.resi.trim()) {
      alert("Resi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { 
        order_id: formData.order_id, 
        resi: formData.resi.trim(),
        manifest_number: manifestNumber || undefined
      };

      if (editData) {
        const response = await apiFetch(`/api/logistics/manifest/${getOrderPrimaryKey(editData)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ManifestPayload>(response);
      } else {
        const response = await apiFetch("/api/logistics/manifest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ManifestPayload>(response);
      }

      await fetchManifest();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan manifest gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedOrderId(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedOrderId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/logistics/manifest/${selectedOrderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchManifest();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus data manifest.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  const handleExportExcel = () => {
    const exportRows = filteredItems.map((item) => {
      const order = orderById[item.order_id ?? ""] ?? item.order ?? null;

      return {
        order_id: getOrderDisplayCode(order, item.order_id),
        produk: item.product?.nama_produk ?? "Produk tidak ditemukan",
        resi: item.resi ?? "-",
        dibuat_pada: item.created_at ? dateTimeFormatter.format(new Date(item.created_at)) : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Manifest");
    XLSX.writeFile(workbook, "Manifest_Logistik.xlsx");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manifest Pengiriman</h1>
        <p className="text-sm md:text-base text-slate-200">Kelola daftar pengiriman barang dan referensi order produksi.</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari order / varian / resi..."
            className="relative w-full md:max-w-md"
          />

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Export ke Excel
          </button>
          <button
            type="button"
            onClick={() => openFormModal()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus size={17} />
            Tambah Manifest
          </button>
        </div>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Manifest Number</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Varian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Resi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Dibuat</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">Data manifest tidak ditemukan.</td></tr>
            ) : (
              filteredItems.map((item) => {
                const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
                return (
                  <tr key={getOrderPrimaryKey(item)} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-bold font-mono text-slate-700 whitespace-nowrap">{item.manifest_number?.trim() || getOrderPrimaryKey(item)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{getOrderDisplayCode(order, item.order_id)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{resolveVariantName(item)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{item.resi ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? dateTimeFormatter.format(new Date(item.created_at)) : "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <RowActions>
                        <EditButton onClick={() => openFormModal(item)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteModal(getOrderPrimaryKey(item))} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Form Manifest" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Manifest Number</span>
            <input
              type="text"
              readOnly
              value={editData?.manifest_number ?? manifestNumber}
              className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-bold font-mono text-slate-500 cursor-not-allowed"
              placeholder="Auto-generated"
              disabled
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Order</span>
            <select
              required
              value={formData.order_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, order_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="" disabled>Pilih order</option>
              {formData.order_id && !orders.some((order) => getOrderPrimaryKey(order) === formData.order_id) ? (
                <option value={formData.order_id}>{formData.order_id} - Order tersimpan</option>
              ) : null}
              {orders.map((order) => {
                const orderId = getOrderPrimaryKey(order);
                return <option key={orderId} value={orderId}>{getOrderDisplayCode(order, orderId)}</option>;
              })}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Resi</span>
            <input
              type="text"
              required
              value={formData.resi}
              onChange={(event) => setFormData((prev) => ({ ...prev, resi: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={closeFormModal} disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Hapus Manifest"
        description="Apakah Anda yakin ingin menghapus data manifest ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
