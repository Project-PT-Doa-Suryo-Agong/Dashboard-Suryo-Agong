"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type BudgetRequestStatus = "pending" | "approved" | "rejected";
type BudgetRequestFilterStatus = "all" | BudgetRequestStatus;

type BudgetRequestItem = {
  id: string;
  divisi: string;
  amount: number;
  keterangan: string;
  status: BudgetRequestStatus;
  created_at: string;
};

const DUMMY_BUDGET_REQUESTS: BudgetRequestItem[] = [
  {
    id: "BGT-2026-001",
    divisi: "Logistik",
    amount: 185000000,
    keterangan: "Pengadaan rak gudang dan perbaikan area loading",
    status: "pending",
    created_at: "2026-03-14T08:20:00+07:00",
  },
  {
    id: "BGT-2026-002",
    divisi: "HR",
    amount: 95000000,
    keterangan: "Program pelatihan leadership batch Q2",
    status: "approved",
    created_at: "2026-03-13T14:05:00+07:00",
  },
  {
    id: "BGT-2026-003",
    divisi: "Creative",
    amount: 120000000,
    keterangan: "Produksi konten kampanye produk semester 1",
    status: "pending",
    created_at: "2026-03-13T10:30:00+07:00",
  },
  {
    id: "BGT-2026-004",
    divisi: "Finance",
    amount: 68000000,
    keterangan: "Upgrade sistem pelaporan keuangan internal",
    status: "rejected",
    created_at: "2026-03-12T16:10:00+07:00",
  },
  {
    id: "BGT-2026-005",
    divisi: "Produksi",
    amount: 260000000,
    keterangan: "Maintenance mesin produksi dan kalibrasi alat",
    status: "approved",
    created_at: "2026-03-12T09:00:00+07:00",
  },
  {
    id: "BGT-2026-006",
    divisi: "Management",
    amount: 74000000,
    keterangan: "Penyusunan roadmap transformasi operasional",
    status: "pending",
    created_at: "2026-03-11T11:45:00+07:00",
  },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function statusBadgeClass(status: BudgetRequestStatus): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "approved") return "bg-emerald-100 text-emerald-700";
  return "bg-rose-100 text-rose-700";
}

function statusLabel(status: BudgetRequestStatus): string {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  return "Ditolak";
}

export default function ManagementBudgetPage() {
  const [items, setItems] = useState<BudgetRequestItem[]>(DUMMY_BUDGET_REQUESTS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<BudgetRequestFilterStatus>("all");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<BudgetRequestItem | null>(null);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        item.divisi.toLowerCase().includes(keyword) ||
        item.keterangan.toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const openReviewModal = (item: BudgetRequestItem) => {
    setSelectedRequest(item);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  const updateRequestStatus = (status: BudgetRequestStatus) => {
    if (!selectedRequest) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedRequest.id ? { ...item, status } : item,
      ),
    );

    setSelectedRequest((prev) => (prev ? { ...prev, status } : null));
    setIsReviewModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Persetujuan Anggaran</h1>
        <p className="text-sm md:text-base text-slate-200">
          Tinjau dan kelola pengajuan dana operasional dari setiap divisi.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-2xl">
          <div className="relative w-full sm:flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari divisi / kebutuhan..."
              className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as BudgetRequestFilterStatus)
            }
            className="w-full sm:w-56 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          >
            <option value="all">Semua Status</option>
            <option value="pending">pending</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
          </select>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/40 bg-white px-4 py-2.5 text-sm font-semibold text-blue-500 transition hover:text-white hover:bg-blue-500"
        >
          <Download size={17} />
          Export Laporan
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                ID Pengajuan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Divisi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Kebutuhan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Nominal
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
              filteredItems.map((item) => {
                const isProcessed = item.status !== "pending";

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">
                      {item.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {dateFormatter.format(new Date(item.created_at))}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">
                      {item.divisi}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 min-w-[260px]">
                      {item.keterangan}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">
                      {formatRupiah(item.amount)}
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
                        onClick={() => openReviewModal(item)}
                        disabled={isProcessed}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                          isProcessed
                            ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                            : "border border-green-500/70 bg-white text-green-600 hover:bg-green-500 hover:text-white"
                        }`}
                      >
                        <Eye size={15} />
                        Tinjau
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data pengajuan tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={closeReviewModal}
        title="Review Pengajuan Anggaran"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <p className="text-slate-500">Divisi</p>
              <p className="font-semibold text-slate-900">{selectedRequest?.divisi ?? "-"}</p>
              <p className="text-slate-500">Kebutuhan</p>
              <p className="font-semibold text-slate-900">{selectedRequest?.keterangan ?? "-"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-yellow-400/25 bg-yellow-500/10 px-4 py-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-yellow-700">Nominal Pengajuan</p>
            <p className="mt-1 text-xl md:text-2xl font-bold text-yellow-600 break-words">
              {selectedRequest ? formatRupiah(selectedRequest.amount) : "-"}
            </p>
          </div>

          {selectedRequest?.status === "pending" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateRequestStatus("rejected")}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                Tolak Pengajuan
              </button>
              <button
                type="button"
                onClick={() => updateRequestStatus("approved")}
                className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                Setujui Anggaran
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Pengajuan ini sudah diproses.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
