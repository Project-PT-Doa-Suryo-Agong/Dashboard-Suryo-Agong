"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState, useRef } from "react";
import * as xlsx from "xlsx";
import { Edit3, Plus, Search, Trash2, FileSpreadsheet } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
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
  const raw = await response.text();

  if (!response.ok) {
    let message = `Request gagal dengan status ${response.status}.`;

    if (raw) {
      try {
        const parsedError = JSON.parse(raw) as ApiError;
        message = parsedError.error?.message || parsedError.message || message;
      } catch {
        message = raw.slice(0, 200) || message;
      }
    }

    throw new Error(message);
  }

  let payload: ApiSuccess<T> | ApiError;
  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    throw new Error("Respons server tidak valid (bukan JSON).")
  }

  if (!payload.success) {
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

const CRUD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#BC934B]/30 disabled:opacity-50";
const CRUD_EDIT_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 disabled:opacity-50";
const CRUD_DELETE_BUTTON_CLASS =
  "inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 disabled:opacity-50";
const CRUD_CANCEL_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:opacity-50";

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = xlsx.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = xlsx.utils.sheet_to_json<any>(ws);

        let successCount = 0;
        let failCount = 0;

        for (const row of data) {
          try {
            const namaProduk = row["Produk"] || row["produk"];
            const namaVendor = row["Vendor"] || row["vendor"];
            const qty = Number(row["Quantity"] || row["quantity"] || row["Qty"] || row["qty"] || row["Target"] || row["target"]);
            const statusRaw = String(row["Status"] || row["status"] || "draft").toLowerCase();

            const matchedProduct = produkList.find(p => p.nama_produk?.toLowerCase() === String(namaProduk).toLowerCase());
            const matchedVendor = vendorList.find(v => v.nama_vendor?.toLowerCase() === String(namaVendor).toLowerCase());

            if (!matchedProduct || !matchedVendor || isNaN(qty) || qty <= 0) {
              failCount++;
              continue;
            }

            let parsedStatus: ProductionStatus = "draft";
            if (["ongoing", "berjalan"].includes(statusRaw)) parsedStatus = "ongoing";
            if (["done", "selesai"].includes(statusRaw)) parsedStatus = "done";

            const payload = {
              product_id: matchedProduct.id,
              vendor_id: matchedVendor.id,
              quantity: Math.floor(qty),
              status: parsedStatus
            };

            await apiFetch("/api/production/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            successCount++;
          } catch(err) {
            failCount++;
          }
        }

        alert(`Import selesai.\nBerhasil: ${successCount}\nGagal/Dilewati: ${failCount}\n\nPastikan kolom bernama "Produk", "Vendor", "Qty", dan "Status" benar.`);
        await fetchOrders();
      } catch (err) {
        alert("Gagal membaca file Excel.");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/api/production/orders?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<OrdersListPayload>(response);
      setItems(payload.data.orders ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data pesanan produksi.";
      alert(message);
    } finally {
      // Keep loading state recoverable on any API failure path.
      setIsLoading(false);
    }
  };

  const fetchProduk = async () => {
    try {
      const response = await apiFetch("/api/core/products?page=1&limit=200", {
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
    } finally {
      // Keep loading state recoverable on any API failure path.
      setIsLoading(false);
    }
  };

  const fetchVendor = async () => {
    try {
      const response = await apiFetch("/api/core/vendors?page=1&limit=200", {
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
    } finally {
      // Keep loading state recoverable on any API failure path.
      setIsLoading(false);
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
        const response = await apiFetch(`/api/production/orders/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<OrderPayload>(response);
      } else {
        const response = await apiFetch("/api/production/orders", {
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
      const response = await apiFetch(`/api/production/orders/${deleteId}`, {
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
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Pesanan Produksi (Orders)</h1>
        <p className="text-sm md:text-base text-slate-300">Kelola dan pantau antrean proses manufaktur produk.</p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari ID pesanan, produk, atau vendor..."
            className="relative flex-1"
          />

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | ProductionStatus)}
            className="w-full sm:w-52 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-[#BC934B]/20"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="ongoing">Berjalan</option>
            <option value="done">Selesai</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200 disabled:opacity-50 w-full sm:w-auto"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className={`${CRUD_PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
          >
            <Plus className="h-4 w-4" />
            Pesanan Baru
          </button>
        </div>
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
                      <RowActions>
                        <EditButton onClick={() => openEditModal(item)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteModal(item.id)} disabled={isSubmitting} />
                      </RowActions>
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status-order" className="text-sm font-semibold text-slate-700">Status</label>
            <select
              id="status-order"
              value={formData.status}
              onChange={(event) => setFormData((prev) => ({ ...prev, status: event.target.value as ProductionStatus }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
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
              className={CRUD_CANCEL_BUTTON_CLASS}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={CRUD_PRIMARY_BUTTON_CLASS}
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
