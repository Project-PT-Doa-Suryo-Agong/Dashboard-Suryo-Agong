"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type {
  MProduk,
  MVendor,
  ProductionStatus,
  TProduksiOrder,
} from "@/types/supabase";

type OrdersListPayload = {
  orders: TProduksiOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type OrderPayload = {
  order: TProduksiOrder | null;
};

type ProductsListPayload = {
  produk: MProduk[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type VendorsListPayload = {
  vendor: MVendor[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

const statusLabel: Record<ProductionStatus, string> = {
  draft: "Draft",
  ongoing: "Berjalan",
  done: "Selesai",
};

const statusBadgeClass: Record<ProductionStatus, string> = {
  draft: "bg-amber-100 text-amber-700",
  ongoing: "bg-blue-100 text-blue-700",
  done: "bg-emerald-100 text-emerald-700",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ProductionOrdersPage() {
  const [items, setItems] = useState<TProduksiOrder[]>([]);
  const [produkList, setProdukList] = useState<MProduk[]>([]);
  const [vendorList, setVendorList] = useState<MVendor[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProductionStatus>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TProduksiOrder | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    product_id: string;
    vendor_id: string;
    quantity: string;
    status: ProductionStatus;
  }>({
    product_id: "",
    vendor_id: "",
    quantity: "",
    status: "draft",
  });

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/production/orders?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<OrdersListPayload>(response);
      setItems(payload.data.orders ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data pesanan produksi.";
      alert(message);
    }
  };

  const fetchProduk = async () => {
    try {
      const response = await fetch("/api/core/products?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ProductsListPayload>(response);
      setProdukList(payload.data.produk ?? []);
      setFormData((prev) => ({
        ...prev,
        product_id: prev.product_id || payload.data.produk?.[0]?.id || "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat daftar produk.";
      alert(message);
    }
  };

  const fetchVendor = async () => {
    try {
      const response = await fetch("/api/core/vendors?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VendorsListPayload>(response);
      setVendorList(payload.data.vendor ?? []);
      setFormData((prev) => ({
        ...prev,
        vendor_id: prev.vendor_id || payload.data.vendor?.[0]?.id || "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat daftar vendor.";
      alert(message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchOrders(), fetchProduk(), fetchVendor()]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const productById = useMemo(
    () => Object.fromEntries(produkList.map((item) => [item.id, item.nama_produk])) as Record<string, string>,
    [produkList],
  );

  const vendorById = useMemo(
    () => Object.fromEntries(vendorList.map((item) => [item.id, item.nama_vendor])) as Record<string, string>,
    [vendorList],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        item.id.toLowerCase().includes(normalizedSearch) ||
        (productById[item.product_id ?? ""] ?? "").toLowerCase().includes(normalizedSearch) ||
        (vendorById[item.vendor_id ?? ""] ?? "").toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus, productById, vendorById]);

  const resetForm = () => {
    setFormData({
      product_id: produkList[0]?.id ?? "",
      vendor_id: vendorList[0]?.id ?? "",
      quantity: "",
      status: "draft",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (order: TProduksiOrder) => {
    setEditData(order);
    setFormData({
      product_id: order.product_id ?? "",
      vendor_id: order.vendor_id ?? "",
      quantity: String(order.quantity ?? ""),
      status: order.status ?? "draft",
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedQty = Number(formData.quantity);
    if (!formData.product_id || !formData.vendor_id) {
      alert("Produk dan vendor wajib dipilih.");
      return;
    }
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      alert("Target quantity harus angka lebih dari 0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        product_id: formData.product_id,
        vendor_id: formData.vendor_id,
        quantity: parsedQty,
        status: formData.status,
      };

      if (editData) {
        const response = await fetch(`/api/production/orders/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<OrderPayload>(response);
      } else {
        const response = await fetch("/api/production/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<OrderPayload>(response);
      }

      await fetchOrders();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan pesanan produksi gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/production/orders/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchOrders();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus pesanan produksi.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Pesanan Produksi (Orders)</h1>
        <p className="text-sm md:text-base text-slate-600">Kelola dan pantau antrean proses manufaktur produk.</p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari ID pesanan, produk, atau vendor..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | ProductionStatus)}
            className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="ongoing">Berjalan</option>
            <option value="done">Selesai</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Buat Pesanan Baru
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar Pesanan Produksi</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">Data pesanan produksi dari antrean proses aktif dan historis.</p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">ID Pesanan</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Produk</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Vendor</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Target (Qty)</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Dibuat</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={7}>
                    Memuat data...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={7}>
                    Tidak ada pesanan yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{item.id}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-56">{productById[item.product_id ?? ""] ?? "Produk tidak ditemukan"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{vendorById[item.vendor_id ?? ""] ?? "Vendor tidak ditemukan"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.quantity ?? 0} Unit</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusBadgeClass[item.status ?? "draft"]}`}>
                        {statusLabel[item.status ?? "draft"]}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#BC934B] transition hover:text-[#a88444] whitespace-nowrap disabled:opacity-50"
                        >
                          <Edit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 transition hover:text-red-700 whitespace-nowrap disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Pesanan Produksi" : "Buat Pesanan Produksi"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="product-order" className="text-sm font-semibold text-slate-700">Produk</label>
            <select
              id="product-order"
              required
              value={formData.product_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, product_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="" disabled>Pilih produk</option>
              {produkList.map((product) => (
                <option key={product.id} value={product.id}>{product.nama_produk}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="vendor-order" className="text-sm font-semibold text-slate-700">Vendor</label>
            <select
              id="vendor-order"
              required
              value={formData.vendor_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, vendor_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="" disabled>Pilih vendor</option>
              {vendorList.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.nama_vendor ?? "-"}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="target-order" className="text-sm font-semibold text-slate-700">Target Quantity</label>
            <input
              id="target-order"
              required
              min={1}
              type="number"
              value={formData.quantity}
              onChange={(event) => setFormData((prev) => ({ ...prev, quantity: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status-order" className="text-sm font-semibold text-slate-700">Status</label>
            <select
              id="status-order"
              value={formData.status}
              onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as ProductionStatus }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="draft">Draft</option>
              <option value="ongoing">Berjalan</option>
              <option value="done">Selesai</option>
            </select>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeFormModal}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a88444] disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Pesanan Produksi"
        description="Apakah Anda yakin ingin menghapus pesanan produksi ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
