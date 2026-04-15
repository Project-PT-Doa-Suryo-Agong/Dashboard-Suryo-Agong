"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCcw, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TReturnOrder, TSalesOrder } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

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
    throw new Error(message);
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
const RETURN_BUKTI_BUCKET = "returns";

function buildUploadPath(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${random}.${ext}`;
}

async function uploadReturnBukti(file: File, oldPath?: string | null): Promise<string> {
  const supabase = createSupabaseBrowserClient();
  const uploadPath = buildUploadPath(file);

  if (oldPath) {
    await supabase.storage.from(RETURN_BUKTI_BUCKET).remove([oldPath]);
  }

  const { error } = await supabase.storage
    .from(RETURN_BUKTI_BUCKET)
    .upload(uploadPath, file, { upsert: false, cacheControl: "3600" });

  if (error) {
    throw new Error(`Gagal upload bukti retur: ${error.message}`);
  }

  return uploadPath;
}

function getStorageFileName(path: string | null | undefined): string {
  if (!path) return "-";
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnItem[]>([]);
  const [orders, setOrders] = useState<TSalesOrder[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TReturnOrder | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ order_id: string; alasan: string; foto_bukti_url: string | null }>({
    order_id: "",
    alasan: "",
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
      setFormData((prev) => ({ ...prev, order_id: prev.order_id || firstOrderId || "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data sales order.";
      alert(message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchReturns(), fetchOrders()]);
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
    const map = new Map<string, TSalesOrder>();
    for (const order of orders) {
      const orderId = getOrderPrimaryKey(order).trim();
      if (!orderId || map.has(orderId)) continue;
      map.set(orderId, order);
    }
    return Array.from(map.values());
  }, [orders]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id ?? ""] ?? item.order ?? null;
      return (
        getOrderPrimaryKey(order).toLowerCase().includes(keyword) ||
        (item.alasan ?? "").toLowerCase().includes(keyword) ||
        (item.product?.nama_produk ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm, orderById]);

  const resetForm = () => {
    setFormData({ order_id: getOrderPrimaryKey(selectableOrders[0]) || "", alasan: "", foto_bukti_url: null });
    setSelectedBuktiFile(null);
    setEditData(null);
  };

  const openFormModal = (item?: TReturnOrder) => {
    if (item) {
      setEditData(item);
      setFormData({
        order_id: item.order_id ?? "",
        alasan: item.alasan ?? "",
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
        fotoBuktiUrl = await uploadReturnBukti(selectedBuktiFile, editData?.foto_bukti_url);
      }

      const payload = {
        order_id: formData.order_id,
        alasan: formData.alasan.trim(),
        foto_bukti_url: fotoBuktiUrl,
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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen Retur Barang</h1>
        <p className="text-sm md:text-base text-slate-200">Kelola pengajuan pengembalian barang berdasarkan sales order.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari order / alasan..."
            className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          />
        </div>

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
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Alasan</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Bukti</th>
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
                return (
                  <tr key={rowKey} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">{returnId ? returnId.slice(0, 8).toUpperCase() : "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">{getOrderPrimaryKey(order) || item.order_id || "Order tidak ditemukan"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.product?.nama_produk ?? "Produk tidak ditemukan"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.alasan ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.foto_bukti_url ? getStorageFileName(item.foto_bukti_url) : "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFormModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          <RefreshCcw size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(returnId)}
                          disabled={isSubmitting || !returnId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
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

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Form Retur" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Order</span>
            <select
              required
              value={formData.order_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, order_id: event.target.value }))}
              disabled={selectableOrders.length === 0}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="" disabled>{selectableOrders.length === 0 ? "Tidak ada order tersedia" : "Pilih order"}</option>
              {formData.order_id && !selectableOrders.some((order) => getOrderPrimaryKey(order) === formData.order_id) ? (
                <option value={formData.order_id}>{formData.order_id} - Order tersimpan</option>
              ) : null}
              {selectableOrders.map((order) => {
                const orderId = getOrderPrimaryKey(order);
                return <option key={orderId} value={orderId}>{orderId}</option>;
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
    </div>
  );
}
