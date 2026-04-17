"use client";
import { SearchBar } from "@/components/ui/search-bar";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckSquare, Search, ShieldCheck, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { ProductionQcResult, TProduksiOrder, TQCOutbound } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

type QcOutboundListPayload = {
  qc_outbound: TQCOutbound[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type QcOutboundPayload = {
  qc_outbound: TQCOutbound | null;
};

type OrdersListPayload = {
  orders: TProduksiOrder[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
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

const statusLabel: Record<ProductionQcResult, string> = {
  pass: "Lolos QC / Siap Kirim",
  reject: "Reject",
};

const statusBadgeClass: Record<ProductionQcResult, string> = {
  pass: "bg-emerald-100 text-emerald-700",
  reject: "bg-rose-100 text-rose-700",
};

const CRUD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30 disabled:opacity-50";
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

function getQcPrimaryKey(value: { produksi_order_id?: string | null; id?: string | null } | null | undefined): string {
  return value?.produksi_order_id ?? value?.id ?? "";
}

export default function QcOutboundPage() {
  const [items, setItems] = useState<TQCOutbound[]>([]);
  const [orders, setOrders] = useState<TProduksiOrder[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | ProductionQcResult>("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TQCOutbound | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    produksi_order_id: string;
    hasil: ProductionQcResult;
  }>({
    produksi_order_id: "",
    hasil: "pass",
  });

  const fetchQcOutbound = async () => {
    try {
      const response = await apiFetch("/api/production/qc-outbound?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<QcOutboundListPayload>(response);
      setItems(payload.data.qc_outbound ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data QC outbound.";
      alert(message);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await apiFetch("/api/production/orders?page=1&limit=200", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<OrdersListPayload>(response);
      const orderList = payload.data.orders ?? [];
      setOrders(orderList);
      setFormData((prev) => ({
        ...prev,
        produksi_order_id: prev.produksi_order_id || orderList[0]?.id || "",
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data produksi order.";
      alert(message);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchQcOutbound(), fetchOrders()]);
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

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const order = orderById[item.produksi_order_id ?? ""];
      const matchStatus = filterStatus === "all" || item.hasil === filterStatus;
      const matchSearch =
        normalizedSearch.length === 0 ||
        (order?.id ?? item.produksi_order_id ?? "").toLowerCase().includes(normalizedSearch);

      return matchStatus && matchSearch;
    });
  }, [items, searchTerm, filterStatus, orderById]);

  const resetForm = () => {
    setFormData({
      produksi_order_id: orders[0]?.id ?? "",
      hasil: "pass",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TQCOutbound) => {
    setEditData(item);
    setFormData({
      produksi_order_id: item.produksi_order_id ?? "",
      hasil: item.hasil ?? "pass",
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

    if (!formData.produksi_order_id) {
      alert("Pilih produksi order terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        produksi_order_id: formData.produksi_order_id,
        hasil: formData.hasil,
      };

      if (editData) {
        const primaryKey = getQcPrimaryKey(editData);
        if (!primaryKey) throw new Error("Order ID QC outbound tidak ditemukan.");
        const response = await apiFetch(`/api/production/qc-outbound/${primaryKey}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<QcOutboundPayload>(response);
      } else {
        const response = await apiFetch("/api/production/qc-outbound", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<QcOutboundPayload>(response);
      }

      await fetchQcOutbound();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan QC outbound gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/production/qc-outbound/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchQcOutbound();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus data QC outbound.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">QC Outbound (Produk Jadi)</h1>
        <p className="text-sm md:text-base text-slate-300">Inspeksi akhir kualitas produk jadi sebelum diserahkan ke gudang/logistik.</p>
      </section>

      <section className="flex flex-col gap-3 md:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-3xl">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari produksi order..."
            className="relative flex-1"
          />

          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as "all" | ProductionQcResult)}
            className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
          >
            <option value="all">Semua Status</option>
            <option value="pass">Lolos QC / Siap Kirim</option>
            <option value="reject">Reject</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className={`${CRUD_PRIMARY_BUTTON_CLASS} w-full sm:w-auto`}
        >
          <ShieldCheck className="h-4 w-4" />
          Jadwalkan Inspeksi
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Daftar QC Outbound</h2>
          <p className="mt-1 text-xs md:text-sm text-slate-500">Rekap inspeksi akhir produk jadi sebelum proses serah ke logistik.</p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="w-full min-w-max">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Produksi Order</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={4}>Memuat data...</td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500" colSpan={4}>Tidak ada data inspeksi yang sesuai filter.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={getQcPrimaryKey(item)} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.created_at ? formatDate(item.created_at) : "-"}</td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-72">{orderById[item.produksi_order_id ?? ""]?.id ?? "Order tidak ditemukan"}</td>
                    <td className="px-4 md:px-6 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${statusBadgeClass[item.hasil ?? "pass"]}`}>
                        {statusLabel[item.hasil ?? "pass"]}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className={CRUD_EDIT_BUTTON_CLASS}
                        >
                          <CheckSquare className="h-4 w-4" />
                          Evaluasi QC
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const primaryKey = getQcPrimaryKey(item);
                            if (!primaryKey) {
                              alert("Order ID QC outbound tidak ditemukan.");
                              return;
                            }
                            openDeleteModal(primaryKey);
                          }}
                          disabled={isSubmitting}
                          className={CRUD_DELETE_BUTTON_CLASS}
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

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title="Evaluasi QC Outbound" maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="produksi-order-outbound" className="text-sm font-semibold text-slate-700">Produksi Order</label>
            <select
              id="produksi-order-outbound"
              required
              value={formData.produksi_order_id}
              onChange={(event) => setFormData((prev) => ({ ...prev, produksi_order_id: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
            >
              <option value="" disabled>Pilih produksi order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>{order.id}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status-qc-outbound" className="text-sm font-semibold text-slate-700">Status Evaluasi</label>
            <select
              id="status-qc-outbound"
              value={formData.hasil}
              onChange={(event) => setFormData((prev) => ({ ...prev, hasil: event.target.value as ProductionQcResult }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-400/20"
            >
              <option value="pass">Lolos QC / Siap Kirim</option>
              <option value="reject">Reject</option>
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
              {isSubmitting ? "Menyimpan..." : "Simpan Evaluasi"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Data QC Outbound"
        description="Apakah Anda yakin ingin menghapus data QC outbound ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
