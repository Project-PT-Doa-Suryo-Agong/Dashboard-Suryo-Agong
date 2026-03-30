"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Search, Truck, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MProduk, TLogistikManifest, TProduksiOrder } from "@/types/supabase";

type ManifestListPayload = {
  manifest: TLogistikManifest[];
  meta: { page: number; limit: number; total: number };
};

type ManifestPayload = { manifest: TLogistikManifest | null };

type OrdersListPayload = {
  orders: TProduksiOrder[];
  meta: { page: number; limit: number; total: number };
};

type ProductsListPayload = {
  produk: MProduk[];
  meta: { page: number; limit: number; total: number };
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
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
  const [items, setItems] = useState<TLogistikManifest[]>([]);
  const [orders, setOrders] = useState<TProduksiOrder[]>([]);
  const [products, setProducts] = useState<MProduk[]>([]);

  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TLogistikManifest | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{ order_id: string; resi: string }>({
    order_id: "",
    resi: "",
  });

  const fetchManifest = async () => {
    try {
      const response = await fetch("/api/logistics/manifest?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ManifestListPayload>(response);
      setItems(payload.data.manifest ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data manifest.";
      alert(message);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/production/orders?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<OrdersListPayload>(response);
      const list = payload.data.orders ?? [];
      setOrders(list);
      setFormData((prev) => ({ ...prev, order_id: prev.order_id || list[0]?.id || "" }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data pesanan.";
      alert(message);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/core/products?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ProductsListPayload>(response);
      setProducts(payload.data.produk ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat daftar produk.";
      alert(message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchManifest(), fetchOrders(), fetchProducts()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const orderById = useMemo(
    () => Object.fromEntries(orders.map((order) => [order.id, order])) as Record<string, TProduksiOrder>,
    [orders],
  );

  const productById = useMemo(
    () => Object.fromEntries(products.map((product) => [product.id, product.nama_produk])) as Record<string, string>,
    [products],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.order_id ?? ""];
      const productName = productById[order?.product_id ?? ""] ?? "";
      return (
        (item.resi ?? "").toLowerCase().includes(keyword) ||
        (order?.id ?? "").toLowerCase().includes(keyword) ||
        productName.toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm, orderById, productById]);

  const resetForm = () => {
    setFormData({ order_id: orders[0]?.id ?? "", resi: "" });
    setEditData(null);
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
      const payload = { order_id: formData.order_id, resi: formData.resi.trim() };

      if (editData) {
        const response = await fetch(`/api/logistics/manifest/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<ManifestPayload>(response);
      } else {
        const response = await fetch("/api/logistics/manifest", {
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

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/logistics/manifest/${deleteId}`, {
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

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manifest Pengiriman</h1>
        <p className="text-sm md:text-base text-slate-200">Kelola daftar pengiriman barang dan referensi order produksi.</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari order / produk / resi..."
            className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          />
        </div>

        <button
          type="button"
          onClick={() => openFormModal()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Plus size={17} />
          Tambah Manifest
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">ID Manifest</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Order</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Produk</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Resi</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Dibuat</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Data manifest tidak ditemukan.</td></tr>
            ) : (
              filteredItems.map((item) => {
                const order = orderById[item.order_id ?? ""];
                const productName = productById[order?.product_id ?? ""] ?? "Produk tidak ditemukan";
                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">{item.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{order?.id ?? "Order tidak ditemukan"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{productName}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{item.resi ?? "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? dateTimeFormatter.format(new Date(item.created_at)) : "-"}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openFormModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-yellow-400 bg-yellow-400/70 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-yellow-500 disabled:opacity-50"
                        >
                          <Truck size={15} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Form Manifest" maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Order</span>
            <select
              required
              value={formData.order_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, order_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="" disabled>Pilih order</option>
              {orders.map((order) => {
                const productName = productById[order.product_id ?? ""] ?? "Produk";
                return <option key={order.id} value={order.id}>{order.id} - {productName}</option>;
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
