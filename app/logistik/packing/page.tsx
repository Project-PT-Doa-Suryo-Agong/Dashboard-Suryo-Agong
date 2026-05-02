"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Plus, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { LogisticsPackingStatus, TPacking, TSalesOrder } from "@/types/supabase";
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

type PackingItem = TPacking & {
  order?: TSalesOrder | null;
  variant?: VariantLite | null;
  product?: ProductLite | null;
};

type FilterStatus = "all" | LogisticsPackingStatus;

type PackingListPayload = {
  packing: PackingItem[];
  meta: { page: number; limit: number; total: number };
};

type PackingPayload = { packing: PackingItem | null };

type OrdersListPayload = {
  orders: TSalesOrder[];
  meta: { page: number; limit: number; total: number };
};

const ORDER_FETCH_LIMIT = 200;
const ORDER_FETCH_MAX_PAGES = 50;

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function pickPacking(data: unknown): PackingItem[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<PackingItem>(source.packing ?? source.packings ?? source.data);
}

function pickOrders(data: unknown): TSalesOrder[] {
  if (!data || typeof data !== "object") return [];
  const source = data as Record<string, unknown>;
  return asArray<TSalesOrder>(source.orders ?? source.order ?? source.data);
}

function shortId(id: string | null | undefined) {
  if (!id) return "-";
  return id.slice(0, 8).toUpperCase();
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

function statusBadgeClass(status: LogisticsPackingStatus): string {
  if (status === "pending") return "bg-orange-500 text-white";
  if (status === "packed") return "bg-blue-500 text-white";
  return "bg-emerald-500 text-white";
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default function PackingPage() {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [orders, setOrders] = useState<TSalesOrder[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TPacking | null>(null);
  const [packingNumber, setPackingNumber] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ order_id: string; status: LogisticsPackingStatus }>({
    order_id: "",
    status: "pending",
  });

  const fetchPacking = async () => {
    try {
      const response = await apiFetch("/api/logistics/packing?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<PackingListPayload>(response);
      setItems(pickPacking(payload.data));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data packing.";
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

  const fetchDefaultPackingNumber = async () => {
    try {
      const response = await apiFetch("/api/logistics/packing-number", {
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

      setPackingNumber(`PCK-${mm}${yy}-${nnnnn}`);
    } catch (error) {
      console.error("Gagal mengambil packing number:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchPacking(), fetchOrders(), fetchDefaultPackingNumber()]);
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

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
      const matchesSearch =
        getOrderDisplayCode(order, item.order_id).toLowerCase().includes(keyword) ||
        (item.variant?.nama_varian ?? "").toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus, orderById]);

  const resetForm = () => {
    setFormData({ order_id: getOrderPrimaryKey(orders[0]) || "", status: "pending" });
    setEditData(null);
    void fetchDefaultPackingNumber();
  };

  const openFormModal = (item?: TPacking) => {
    if (item) {
      setEditData(item);
      setFormData({ order_id: item.order_id ?? "", status: item.status ?? "pending" });
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

    setIsSubmitting(true);
    try {
      if (editData) {
        const response = await apiFetch(`/api/logistics/packing/${getOrderPrimaryKey(editData)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        await parseJsonResponse<PackingPayload>(response);
      } else {
        const payload = {
          ...formData,
          packing_number: packingNumber || undefined
        };
        const response = await apiFetch("/api/logistics/packing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<PackingPayload>(response);
      }

      await fetchPacking();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan packing gagal.";
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
      const response = await apiFetch(`/api/logistics/packing/${selectedOrderId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchPacking();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus data packing.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Daftar Packing Barang</h1>
        <p className="text-sm md:text-base text-slate-200">Pantau antrean dan proses pengemasan pesanan.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari order atau varian..."
            className="relative w-full sm:max-w-md"
          />

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
          className="w-full sm:w-52 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
        >
          <option value="all">Semua Status</option>
          <option value="pending">pending</option>
          <option value="packed">packed</option>
          <option value="shipped">shipped</option>
        </select>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID Packing</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Varian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Data packing tidak ditemukan.</td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
                return (
                  <tr key={getOrderPrimaryKey(item)} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-bold font-mono text-slate-700 whitespace-nowrap">{item.packing_number?.trim() || shortId(getOrderPrimaryKey(item))}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{getOrderDisplayCode(order, item.order_id)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.variant?.nama_varian ?? "Varian tidak ditemukan"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(item.status ?? "pending")}`}>
                        {item.status ?? "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFormModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-600 bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-yellow-500 hover:text-white disabled:opacity-50"
                        >
                          <CheckCircle2 size={15} />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(getOrderPrimaryKey(item))}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-600 bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-orange-600 hover:text-white disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Form Packing" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-700">Packing Number</span>
            <input
              type="text"
              readOnly
              value={editData?.packing_number ?? packingNumber}
              className="w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm font-bold font-mono text-slate-500 cursor-not-allowed"
              placeholder="Auto-generated"
              disabled
            />
          </label>

          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-700">Pilih Order</span>
            <select
              value={formData.order_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, order_id: event.target.value }))}
              required
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="" disabled>Pilih order</option>
              {formData.order_id && !orders.some((order) => getOrderPrimaryKey(order) === formData.order_id) ? (
                <option value={formData.order_id}>{formData.order_id} - Order tersimpan</option>
              ) : null}
              {orders.map((order) => {
                const orderId = getOrderPrimaryKey(order);
                return (
                  <option key={orderId} value={orderId}>{getOrderDisplayCode(order, orderId)}</option>
                );
              })}
            </select>
          </label>

          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={formData.status}
              onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as LogisticsPackingStatus }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="pending">pending</option>
              <option value="packed">packed</option>
              <option value="shipped">shipped</option>
            </select>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button type="button" onClick={closeFormModal} disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50">Batal</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDelete}
        title="Hapus Data Packing"
        description="Apakah Anda yakin ingin menghapus data packing ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
