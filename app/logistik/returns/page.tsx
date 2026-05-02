"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Eye, Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TReturnOrder, TSalesOrder, TLogistikManifest } from "@/types/supabase";
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

type ReturnItem = TReturnOrder & {
  order?: TSalesOrder | null;
  variant?: VariantLite | null;
  product?: ProductLite | null;
  foto_bukti_signed_url?: string | null;
};

type ReturnsListPayload = {
  returns: ReturnItem[];
  meta: { page: number; limit: number; total: number };
};

type ReturnPayload = { return: ReturnItem | null };

type OrdersListPayload = {
  orders: TSalesOrder[];
  meta: { page: number; limit: number; total: number };
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
    const details = !payload.success && typeof payload.error.details === "string" ? payload.error.details : "";
    throw new Error(details ? `${message} (${details})` : message);
  }
  return payload;
}

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function getOrderPrimaryKey(value: { order_id?: string | null; id?: string | null } | null | undefined): string {
  return value?.order_id ?? value?.id ?? "";
}

function getReturnPrimaryKey(value: { id?: string | null } | null | undefined): string {
  return value?.id ?? "";
}

const MAX_BUKTI_SIZE = 5 * 1024 * 1024;
const ACCEPTED_BUKTI_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Gagal membaca file bukti."));
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file bukti."));
    reader.readAsDataURL(file);
  });
}

function getStorageFileName(path: string | null | undefined): string {
  if (!path) return "-";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

function getOrderDisplayCode(
  value: { order_code?: string | null; id?: string | null } | null | undefined,
  fallbackOrderId?: string | null,
): string {
  return value?.order_code?.trim() || value?.id || fallbackOrderId || "Order tidak ditemukan";
}

function isPdfFile(path: string | null | undefined): boolean {
  if (!path) return false;
  return path.toLowerCase().endsWith(".pdf");
}

function normalizeReturnStatus(value: string | null | undefined): "pending" | "diproses" | "selesai" {
  const normalized = (value ?? "").toLowerCase();
  if (
    ["inspected", "processed", "diproses", "proses", "in_progress", "on_progress", "inprogress", "processing"].includes(
      normalized,
    )
  ) {
    return "diproses";
  }
  if (
    [
      "completed", "selesai", "done", "finished", "closed", "resolved",
      "returned", "restocked", "rejected",
    ].includes(normalized)
  ) {
    return "selesai";
  }
  return "pending";
}

function getReturnStatusUi(value: string | null | undefined): { label: string; className: string } {
  const raw = (value ?? "").toLowerCase();
  if (raw === "inspected") {
    return { label: "Inspected", className: "bg-blue-500 text-white border-blue-200" };
  }
  if (raw === "restocked") {
    return { label: "Restocked", className: "bg-emerald-600 text-white border-emerald-200" };
  }
  if (raw === "rejected") {
    return { label: "Rejected", className: "bg-red-500 text-white border-red-200" };
  }
  const normalized = normalizeReturnStatus(value);
  if (normalized === "diproses") {
    return {
      label: "Diproses",
      className: "bg-orange-500 text-white border-orange-200",
    };
  }
  if (normalized === "selesai") {
    return {
      label: "Selesai",
      className: "bg-emerald-500 text-white border-emerald-200",
    };
  }
  return {
    label: "Pending",
    className: "bg-red-500 text-white border-red-200",
  };
}

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [orders, setOrders] = useState<TSalesOrder[]>([]);
  const [manifests, setManifests] = useState<TLogistikManifest[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TReturnOrder | null>(null);
  const [returnNumber, setReturnNumber] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ReturnItem | null>(null);

  const [formData, setFormData] = useState<{ order_id: string; alasan: string; status: string; foto_bukti_url: string | null }>({
    order_id: "",
    alasan: "",
    status: "pending",
    foto_bukti_url: null,
  });
  const [selectedBuktiFile, setSelectedBuktiFile] = useState<File | null>(null);

  const fetchReturns = async () => {
    try {
      const response = await apiFetch("/api/logistics/returns?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ReturnsListPayload>(response);
      setItems(payload.data.returns ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data retur.";
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

      const firstOrderId = getOrderPrimaryKey(dedupedOrders[0]);
      setOrders(dedupedOrders);
      // keep existing behavior: prefill order_id only if not set yet; manifests will override if relevant
      setFormData((prev) => ({ ...prev, order_id: prev.order_id || firstOrderId || "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data sales order.";
      alert(message);
    }
  };

  const fetchManifests = async () => {
    try {
      const response = await apiFetch("/api/logistics/manifest?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ manifest: TLogistikManifest[] }>(response);
      const list = payload.data.manifest ?? [];
      setManifests(list);
      // DEBUG: verify manifest payload contains order_id/resi
      // eslint-disable-next-line no-console
      console.log("manifests:", list);
      // If no order_id chosen yet, prefer first manifest's order_id as default
      const firstManifestOrderId = list[0]?.order_id ?? "";
      setFormData((prev) => ({ ...prev, order_id: prev.order_id || firstManifestOrderId || "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data manifest.";
      alert(message);
    }
  };

  const fetchDefaultReturnNumber = async () => {
    try {
      const response = await apiFetch("/api/logistics/return-number", {
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

      setReturnNumber(`RET-${mm}${yy}-${nnnnn}`);
    } catch (error) {
      console.error("Gagal mengambil return number:", error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchReturns(), fetchOrders(), fetchManifests(), fetchDefaultReturnNumber()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const orderById = useMemo(
    () => {
      const map = new Map<string, TSalesOrder>();

      for (const order of orders) {
        const orderId = getOrderPrimaryKey(order).trim();
        if (!orderId || map.has(orderId)) continue;
        map.set(orderId, order);
      }

      for (const item of items) {
        const orderId = item.order_id?.trim() ?? "";
        if (orderId && item.order) {
          map.set(orderId, item.order);
        }
      }

      return Object.fromEntries(map) as Record<string, TSalesOrder>;
    },
    [orders, items],
  );

  const selectableOrders = useMemo(() => {
    // Only include orders that appear in logistics manifests
    const manifestOrderIds = new Set(manifests.map((m) => (m.order_id ?? "").trim()).filter(Boolean));
    const map = new Map<string, TSalesOrder>();
    for (const order of orders) {
      const orderId = getOrderPrimaryKey(order).trim();
      if (!orderId || !manifestOrderIds.has(orderId) || map.has(orderId)) continue;
      map.set(orderId, order);
    }
    return Array.from(map.values());
  }, [orders, manifests]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
      const readableOrderCode = getOrderDisplayCode(order, item.order_id);
      return (
        readableOrderCode.toLowerCase().includes(keyword) ||
        (item.alasan ?? "").toLowerCase().includes(keyword) ||
        (item.product?.nama_produk ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm, orderById]);

  const resetForm = () => {
    setFormData({ order_id: getOrderPrimaryKey(selectableOrders[0]) || "", alasan: "", status: "pending", foto_bukti_url: null });
    setSelectedBuktiFile(null);
    setEditData(null);
    void fetchDefaultReturnNumber();
  };

  const openFormModal = (item?: TReturnOrder) => {
    if (item) {
      setEditData(item);
      setFormData({
        order_id: item.order_id ?? "",
        alasan: item.alasan ?? "",
        status: normalizeReturnStatus(item.status),
        foto_bukti_url: item.foto_bukti_url ?? null,
      });
      setSelectedBuktiFile(null);
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
    if (!formData.alasan.trim()) {
      alert("Alasan retur wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    try {
      let fotoBuktiUrl = formData.foto_bukti_url;
      if (selectedBuktiFile) {
        fotoBuktiUrl = await fileToDataUrl(selectedBuktiFile);
      }

      const payload = {
        order_id: formData.order_id,
        alasan: formData.alasan.trim(),
        status: formData.status,
        foto_bukti_url: fotoBuktiUrl,
        return_number: returnNumber || undefined,
      };

      if (editData) {
        const response = await apiFetch(`/api/logistics/returns/${getReturnPrimaryKey(editData)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ReturnPayload>(response);
      } else {
        const response = await apiFetch("/api/logistics/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ReturnPayload>(response);
      }

      await fetchReturns();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan retur gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (returnId: string) => {
    setSelectedReturnId(returnId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedReturnId(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedReturnId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/logistics/returns/${selectedReturnId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchReturns();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus data retur.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal()
    }
  };

  const openDetailModal = (item: ReturnItem) => {
    setSelectedDetailItem(item);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailItem(null);
  };

  const detailOrder = selectedDetailItem
    ? orderById[selectedDetailItem.order_id ?? ""] ?? selectedDetailItem.order ?? null
    : null;
  const detailBuktiUrl = selectedDetailItem?.foto_bukti_signed_url ?? null;
  const detailHasPdf = isPdfFile(selectedDetailItem?.foto_bukti_url);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen Retur Barang</h1>
        <p className="text-sm md:text-base text-slate-200">Kelola pengajuan pengembalian barang berdasarkan sales order.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari order / alasan..."
            className="relative w-full sm:max-w-md"
          />

        <button
          type="button"
          onClick={() => openFormModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Plus size={17} />
          Tambah Retur
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID Retur</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Produk</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Alasan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tanggal</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">Data retur tidak ditemukan.</td></tr>
            ) : (
              filteredItems.map((item, index) => {
                const returnId = getReturnPrimaryKey(item);
                const rowKey = returnId || `${item.order_id ?? "no-order"}-${item.created_at ?? "no-date"}-${index}`;
                const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
                const readableOrderCode = getOrderDisplayCode(order, item.order_id);
                const statusUi = getReturnStatusUi(item.status);
                return (
                  <tr key={rowKey} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-bold font-mono text-slate-800 whitespace-nowrap">{item.return_number?.trim() || (returnId ? returnId.slice(0, 8).toUpperCase() : "-")}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">{readableOrderCode}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.product?.nama_produk ?? "Produk tidak ditemukan"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.alasan ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusUi.className}`}>
                        {statusUi.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <RowActions>
                          <DetailButton onClick={() => openDetailModal(item)} label="Detail" />
                          <EditButton onClick={() => openFormModal(item)} label="Edit" />
                          <DeleteButton onClick={() => openDeleteModal(returnId)} disabled={isSubmitting || !returnId} label="Hapus" />
                        </RowActions>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Form Retur" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Return Number</span>
            <input
              type="text"
              readOnly
              value={editData?.return_number ?? returnNumber}
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
              disabled={manifests.length === 0 && selectableOrders.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="" disabled>{manifests.length === 0 ? (selectableOrders.length === 0 ? "Tidak ada order tersedia" : "Pilih order") : "Pilih order"}</option>
              {formData.order_id && !manifests.some((m) => (m.order_id ?? "") === formData.order_id) && !selectableOrders.some((order) => getOrderPrimaryKey(order) === formData.order_id) ? (
                <option value={formData.order_id}>{formData.order_id} - Order tersimpan</option>
              ) : null}
              {manifests.length > 0
                ? manifests.map((m) => {
                    const orderId = (m.order_id ?? "").trim();
                    if (!orderId) return null;
                    return (
                      <option key={orderId} value={orderId}>
                        {m.resi ?? orderId}
                      </option>
                    );
                  })
                : selectableOrders.map((order) => {
                    const orderId = getOrderPrimaryKey(order);
                    const readableOrderCode = getOrderDisplayCode(order, orderId);
                    return (
                      <option key={orderId} value={orderId}>
                        {readableOrderCode}
                      </option>
                    );
                  })}
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Alasan Retur</span>
            <textarea
              rows={4}
              value={formData.alasan}
              onChange={(event) => setFormData((prev) => ({ ...prev, alasan: event.target.value }))}
              className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={formData.status}
              onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="pending">Pending</option>
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Upload Bukti (JPG/PNG/WEBP/PDF, maks. 5MB)</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  setSelectedBuktiFile(null);
                  return;
                }

                if (!ACCEPTED_BUKTI_TYPES.includes(file.type)) {
                  alert("Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.");
                  event.target.value = "";
                  setSelectedBuktiFile(null);
                  return;
                }

                if (file.size > MAX_BUKTI_SIZE) {
                  alert("Ukuran file maksimal 5MB.");
                  event.target.value = "";
                  setSelectedBuktiFile(null);
                  return;
                }

                setSelectedBuktiFile(file);
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-slate-700 focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
            <p className="text-xs text-slate-500">
              {selectedBuktiFile
                ? `File dipilih: ${selectedBuktiFile.name}`
                : formData.foto_bukti_url
                  ? `File saat ini: ${getStorageFileName(formData.foto_bukti_url)}`
                  : "Belum ada file bukti."}
            </p>
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
        title="Hapus Data Retur"
        description="Apakah Anda yakin ingin menghapus data retur ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />

      <Modal isOpen={isDetailModalOpen} onClose={closeDetailModal} title="Detail Retur" maxWidth="max-w-lg">
        {!selectedDetailItem ? null : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">ID Retur</p>
                <p className="text-sm font-bold font-mono text-slate-800 break-all">
                  {selectedDetailItem.return_number?.trim() || (() => {
                    const returnId = getReturnPrimaryKey(selectedDetailItem);
                    return returnId ? returnId.slice(0, 8).toUpperCase() : "-";
                  })()}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Order</p>
                <p className="text-sm font-semibold text-slate-800 break-all">
                  {getOrderDisplayCode(detailOrder, selectedDetailItem.order_id)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Produk</p>
                <p className="text-sm text-slate-700">{selectedDetailItem.product?.nama_produk ?? "Produk tidak ditemukan"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Tanggal Retur</p>
                <p className="text-sm text-slate-700">
                  {selectedDetailItem.created_at ? dateFormatter.format(new Date(selectedDetailItem.created_at)) : "-"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Alasan Retur</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 whitespace-pre-wrap">
                {selectedDetailItem.alasan ?? "-"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Bukti Retur</p>
              {!selectedDetailItem.foto_bukti_url ? (
                <p className="mt-1 text-sm text-slate-500">Belum ada file bukti.</p>
              ) : !detailBuktiUrl ? (
                <p className="mt-1 text-sm text-red-500">Gagal memuat file bukti.</p>
              ) : detailHasPdf ? (
                <a
                  href={detailBuktiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
                >
                  Lihat PDF: {getStorageFileName(selectedDetailItem.foto_bukti_url)}
                </a>
              ) : (
                <a href={detailBuktiUrl} target="_blank" rel="noreferrer" className="block mt-2">
                  <img
                    src={detailBuktiUrl}
                    alt="Bukti retur"
                    className="max-h-72 w-full rounded-lg border border-slate-200 object-contain bg-slate-50"
                  />
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
