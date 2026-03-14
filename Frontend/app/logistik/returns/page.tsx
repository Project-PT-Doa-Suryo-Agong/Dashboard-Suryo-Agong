"use client";

import { useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type ReturnStatus = "pending" | "inspected" | "approved" | "rejected";
type ReturnFilterStatus = "all" | ReturnStatus;

type ReturnItem = {
  id: string;
  order_id: string;
  customer_name: string;
  product_name: string;
  reason: string;
  status: ReturnStatus;
  created_at: string;
};

const DUMMY_RETURN_ITEMS: ReturnItem[] = [
  {
    id: "41d1d9cb-3f89-4c5f-a0f1-8ab31a780011",
    order_id: "ORD-20260314-101",
    customer_name: "Aulia Pramesti",
    product_name: "Jaket Windproof",
    reason: "cacat jahitan di bagian lengan",
    status: "pending",
    created_at: "2026-03-14T08:20:00+07:00",
  },
  {
    id: "e42a1e84-b24e-4f98-a3b1-9dd9f8db0022",
    order_id: "ORD-20260314-102",
    customer_name: "Rizky Permana",
    product_name: "Sepatu Safety",
    reason: "salah kirim ukuran",
    status: "inspected",
    created_at: "2026-03-14T08:55:00+07:00",
  },
  {
    id: "2a3789d2-9fc3-4fc7-9a4f-e96e59fe0033",
    order_id: "ORD-20260314-103",
    customer_name: "Dina Maharani",
    product_name: "Helm Pro Guard",
    reason: "warna tidak sesuai pesanan",
    status: "approved",
    created_at: "2026-03-14T09:10:00+07:00",
  },
  {
    id: "b57de0ab-6ee9-45d6-8db7-f5437a220044",
    order_id: "ORD-20260314-104",
    customer_name: "Farhan Aji",
    product_name: "Tas Utility",
    reason: "barang digunakan dan tidak sesuai kebijakan retur",
    status: "rejected",
    created_at: "2026-03-14T09:45:00+07:00",
  },
  {
    id: "5f4a0568-2ecf-4a6e-a9ab-6fdad6d20055",
    order_id: "ORD-20260314-105",
    customer_name: "Wulan Sari",
    product_name: "Sarung Tangan Grip",
    reason: "produk rusak saat diterima",
    status: "pending",
    created_at: "2026-03-14T10:05:00+07:00",
  },
  {
    id: "18a83e6d-777f-4558-b9f7-34331e7d0066",
    order_id: "ORD-20260314-106",
    customer_name: "Yogi Prakoso",
    product_name: "Kacamata Safety",
    reason: "lensa tergores",
    status: "inspected",
    created_at: "2026-03-14T10:30:00+07:00",
  },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function statusBadgeClass(status: ReturnStatus): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "inspected") return "bg-blue-100 text-blue-700";
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: ReturnStatus): string {
  if (status === "pending") return "Menunggu Inspeksi";
  if (status === "inspected") return "Sedang Diinspeksi";
  if (status === "approved") return "Disetujui";
  return "Ditolak";
}

export default function ReturnsPage() {
  const [items, setItems] = useState<ReturnItem[]>(DUMMY_RETURN_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<ReturnFilterStatus>("all");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedReturn, setSelectedReturn] = useState<ReturnItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReturnStatus>("pending");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        item.customer_name.toLowerCase().includes(keyword) ||
        item.order_id.toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const openUpdateModal = (item: ReturnItem) => {
    setSelectedReturn(item);
    setSelectedStatus(item.status);
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedReturn(null);
    setSelectedStatus("pending");
  };

  const handleSaveDecision = () => {
    if (!selectedReturn) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedReturn.id ? { ...item, status: selectedStatus } : item,
      ),
    );

    closeUpdateModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen Retur Barang</h1>
        <p className="text-sm md:text-base text-slate-200">
          Kelola pengajuan pengembalian barang dari pelanggan dan proses inspeksi.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama pelanggan / no pesanan..."
            className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as ReturnFilterStatus)}
          className="w-full sm:w-56 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
        >
          <option value="all">Semua Status</option>
          <option value="pending">pending</option>
          <option value="inspected">inspected</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
        </select>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                ID Retur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                No. Pesanan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Info Barang & Pelanggan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Alasan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">
                    {item.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800 whitespace-nowrap">
                    {item.order_id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5 min-w-[220px]">
                      <p className="text-sm font-semibold text-slate-900">{item.product_name}</p>
                      <p className="text-xs text-slate-600">{item.customer_name}</p>
                      <p className="text-xs text-slate-500">
                        Diajukan: {dateFormatter.format(new Date(item.created_at))}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700 min-w-[220px]">
                    {item.reason}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                        item.status,
                      )}`}
                    >
                      {statusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => openUpdateModal(item)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#BC934B]/30 bg-[#BC934B]/10 px-3 py-2 text-xs font-semibold text-[#BC934B] transition hover:bg-[#BC934B]/15"
                    >
                      <RefreshCcw size={15} />
                      Proses Retur
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data retur tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        title="Proses Retur Barang"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Detail Retur
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {selectedReturn?.product_name ?? "-"}
            </p>
            <p className="text-xs text-slate-600">
              Pelanggan: {selectedReturn?.customer_name ?? "-"}
            </p>
            <p className="text-xs text-slate-600">
              No. Pesanan: {selectedReturn?.order_id ?? "-"}
            </p>
            <p className="text-xs text-slate-600">
              Alasan: {selectedReturn?.reason ?? "-"}
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Ubah Status Retur</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as ReturnStatus)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="pending">pending</option>
              <option value="inspected">inspected</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeUpdateModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveDecision}
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Simpan Keputusan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
