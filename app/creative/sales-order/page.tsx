"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit, Plus, ShoppingBag, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MAfiliator, MVarian, TSalesOrder } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type SalesOrderListPayload = {
  orders: TSalesOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type SalesOrderPayload = {
  order: TSalesOrder | null;
};

type AffiliatorListPayload = {
  afiliator: MAfiliator[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type VarianListPayload = {
  varian: MVarian[];
};

type FormState = {
  varian_id: string;
  affiliator_id: string;
  quantity: string;
  total_price: string;
};

const initialFormState: FormState = {
  varian_id: "",
  affiliator_id: "",
  quantity: "",
  total_price: "",
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

function getVarianLabel(item: MVarian): string {
  const nama = item.nama_varian ?? "Varian tanpa nama";
  const sku = item.sku ? `SKU: ${item.sku}` : "SKU: -";
  const harga = item.harga ? formatRupiah(item.harga) : "Harga: -";
  return `${nama} (${sku}) - ${harga}`;
}

export default function SalesOrderPage() {
  const [orders, setOrders] = useState<TSalesOrder[]>([]);
  const [variants, setVariants] = useState<MVarian[]>([]);
  const [affiliators, setAffiliators] = useState<MAfiliator[]>([]);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<TSalesOrder | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const variantMap = useMemo(
    () => new Map<string, MVarian>(variants.map((item) => [item.id, item])),
    [variants],
  );

  const resolveCalculatedTotal = useCallback(
    (variantId: string, quantity: string) => {
      const qty = Number(quantity);
      if (!variantId || Number.isNaN(qty) || qty <= 0) return "";

      const variant = variantMap.get(variantId);
      if (!variant || variant.harga == null) return "";

      return String(variant.harga * qty);
    },
    [variantMap],
  );

  const handleVariantChange = (variantId: string) => {
    setFormData((prev) => ({
      ...prev,
      varian_id: variantId,
    }));
  };

  const handleQuantityChange = (quantity: string) => {
    setFormData((prev) => ({
      ...prev,
      quantity,
    }));
  };

  useEffect(() => {
    setFormData((prev) => {
      const nextTotal = resolveCalculatedTotal(prev.varian_id, prev.quantity);
      if (prev.total_price === nextTotal) {
        return prev;
      }

      return {
        ...prev,
        total_price: nextTotal,
      };
    });
  }, [formData.varian_id, formData.quantity, resolveCalculatedTotal]);

  const affiliatorMap = useMemo(
    () => new Map<string, MAfiliator>(affiliators.map((item) => [item.id, item])),
    [affiliators],
  );

  const resetForm = () => {
    setFormData(initialFormState);
    setEditData(null);
  };

  const fetchDependencies = useCallback(async () => {
    const [ordersResponse, variantsResponse, affiliatorsResponse] = await Promise.all([
      apiFetch("/api/sales/orders?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
      apiFetch("/api/core/variants", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
      apiFetch("/api/sales/affiliates?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }),
    ]);

    const ordersPayload = await parseJsonResponse<SalesOrderListPayload>(ordersResponse);
    const varianPayload = await parseJsonResponse<VarianListPayload>(variantsResponse);
    const affiliatorPayload = await parseJsonResponse<AffiliatorListPayload>(affiliatorsResponse);

    setOrders(ordersPayload.data.orders ?? []);
    setVariants(varianPayload.data.varian ?? []);
    setAffiliators(affiliatorPayload.data.afiliator ?? []);
  }, []);

  const fetchOrdersAndDependencies = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchDependencies();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data sales order.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchDependencies]);

  useEffect(() => {
    void fetchOrdersAndDependencies();
  }, [fetchOrdersAndDependencies]);

  const openEditModal = (item: TSalesOrder) => {
    setEditData(item);
    const initialQuantity = String(item.quantity);
    const initialVariantId = item.varian_id ?? "";
    setFormData({
      varian_id: initialVariantId,
      affiliator_id: item.affiliator_id ?? "",
      quantity: initialQuantity,
      total_price: resolveCalculatedTotal(initialVariantId, initialQuantity) || String(item.total_price),
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedQuantity = Number(formData.quantity);
    const parsedTotalPrice = Number(formData.total_price);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert("Quantity harus lebih dari 0.");
      return;
    }
    if (Number.isNaN(parsedTotalPrice) || parsedTotalPrice < 0) {
      alert("Total price harus angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/api/sales/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          varian_id: formData.varian_id,
          affiliator_id: formData.affiliator_id || null,
          quantity: parsedQuantity,
          total_price: parsedTotalPrice,
        }),
      });
      await parseJsonResponse<SalesOrderPayload>(response);
      await fetchOrdersAndDependencies();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membuat sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editData || isSubmitting) return;

    const parsedQuantity = Number(formData.quantity);
    const parsedTotalPrice = Number(formData.total_price);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      alert("Quantity harus lebih dari 0.");
      return;
    }
    if (Number.isNaN(parsedTotalPrice) || parsedTotalPrice < 0) {
      alert("Total price harus angka valid.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/sales/orders/${editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          varian_id: formData.varian_id,
          affiliator_id: formData.affiliator_id || null,
          quantity: parsedQuantity,
          total_price: parsedTotalPrice,
        }),
      });
      await parseJsonResponse<SalesOrderPayload>(response);
      await fetchOrdersAndDependencies();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal update sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/sales/orders/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchOrdersAndDependencies();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus sales order.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="text-slate-500 w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-800">Affiliate Sales Management</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Variant</label>
            <select
              required
              value={formData.varian_id}
              onChange={(event) => handleVariantChange(event.target.value)}
              className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isSubmitting}
            >
              <option value="" disabled>
                -- Choose a Product --
              </option>
              {variants.map((item) => (
                <option key={item.id} value={item.id}>
                  {getVarianLabel(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Affiliator</label>
            <select
              value={formData.affiliator_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, affiliator_id: event.target.value }))}
              className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              disabled={isSubmitting}
            >
              <option value="">-- Without Affiliator --</option>
              {affiliators.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} ({item.platform ?? "-"})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Quantity</label>
            <input
              required
              type="number"
              min={1}
              value={formData.quantity}
              onChange={(event) => handleQuantityChange(event.target.value)}
              className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Qty"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Price</label>
            <input
              type="number"
              min={0}
              value={formData.total_price}
              readOnly
              className="w-full bg-slate-100 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm cursor-not-allowed"
              placeholder="0"
              disabled
            />
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
            >
              <Plus className="w-5 h-5" strokeWidth={3} />
              {isSubmitting ? "Menyimpan..." : "Submit Order"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-slate-800 font-bold">Sales Order History</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Order ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Product Variant</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Affiliator</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Qty</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Price</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Order Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    Belum ada sales order.
                  </td>
                </tr>
              ) : (
                orders.map((item) => {
                  const varian = item.varian_id ? variantMap.get(item.varian_id) : null;
                  const affiliator = item.affiliator_id ? affiliatorMap.get(item.affiliator_id) : null;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 font-mono">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">{varian?.nama_varian ?? "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700">{affiliator ? `${affiliator.nama} (${affiliator.platform ?? "-"})` : "-"}</td>
                      <td className="px-6 py-4 text-sm text-slate-700 text-center font-bold">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatRupiah(item.total_price)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 text-right">{formatDate(item.created_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                            aria-label="Edit sales order"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(item.id)}
                            disabled={isSubmitting}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            aria-label="Hapus sales order"
                          >
                            <Trash2 size={14} />
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
      </section>

      {isEditModalOpen && editData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          maxWidth="max-w-lg"
          title="Edit Sales Order"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Product Variant</label>
              <select
                required
                value={formData.varian_id}
                onChange={(event) => handleVariantChange(event.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  -- Choose a Product --
                </option>
                {variants.map((item) => (
                  <option key={item.id} value={item.id}>
                    {getVarianLabel(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Affiliator</label>
              <select
                value={formData.affiliator_id}
                onChange={(event) => setFormData((prev) => ({ ...prev, affiliator_id: event.target.value }))}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
                disabled={isSubmitting}
              >
                <option value="">-- Without Affiliator --</option>
                {affiliators.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nama} ({item.platform ?? "-"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                required
                type="number"
                min={1}
                value={formData.quantity}
                onChange={(event) => handleQuantityChange(event.target.value)}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
                placeholder="Quantity"
                disabled={isSubmitting}
              />
              <input
                type="number"
                min={0}
                value={formData.total_price}
                readOnly
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700 cursor-not-allowed"
                placeholder="Total Price"
                disabled
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Sales Order"
        description="Apakah Anda yakin ingin menghapus sales order ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}