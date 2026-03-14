"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Search } from "lucide-react";
import Modal from "@/components/ui/Modal";

type PackingStatusDB = "pending" | "packed" | "shipped";
type PackingStatusUI = "pending" | "proses" | "selesai";
type FilterStatus = "all" | PackingStatusUI;

type PackingItem = {
  id: string;
  order_id: string;
  picker_name: string;
  status: PackingStatusDB;
  created_at: string;
};

const DUMMY_PACKING_ITEMS: PackingItem[] = [
  {
    id: "4a7159d8-fcf2-4f09-b4a2-9b197cbde111",
    order_id: "ORD-20260314-001",
    picker_name: "Rendi Saputra",
    status: "pending",
    created_at: "2026-03-14T08:12:00+07:00",
  },
  {
    id: "f8c6f03a-d7be-4dc8-8f75-7ac1f0552d22",
    order_id: "ORD-20260314-002",
    picker_name: "Nabila Wicaksono",
    status: "packed",
    created_at: "2026-03-14T08:35:00+07:00",
  },
  {
    id: "d73095a7-8db0-42e8-8e57-0c4ad3ef8333",
    order_id: "ORD-20260314-003",
    picker_name: "Yusuf Ramadhan",
    status: "shipped",
    created_at: "2026-03-14T09:10:00+07:00",
  },
  {
    id: "85762818-86c7-4a73-aa4b-f70386af9444",
    order_id: "ORD-20260314-004",
    picker_name: "Dita Permata",
    status: "packed",
    created_at: "2026-03-14T09:26:00+07:00",
  },
  {
    id: "4d401519-a00c-4930-8a4f-cb4f7f5a5555",
    order_id: "ORD-20260314-005",
    picker_name: "Fajar Maulana",
    status: "pending",
    created_at: "2026-03-14T10:02:00+07:00",
  },
  {
    id: "c393f35a-f216-4579-b3c5-919d16076666",
    order_id: "ORD-20260314-006",
    picker_name: "Sheila Oktavia",
    status: "shipped",
    created_at: "2026-03-14T10:27:00+07:00",
  },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function dbToUIStatus(status: PackingStatusDB): PackingStatusUI {
  if (status === "packed") return "proses";
  if (status === "shipped") return "selesai";
  return "pending";
}

function uiToDBStatus(status: PackingStatusUI): PackingStatusDB {
  if (status === "proses") return "packed";
  if (status === "selesai") return "shipped";
  return "pending";
}

function statusBadgeClass(status: PackingStatusUI): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "proses") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function PackingPage() {
  const [items, setItems] = useState<PackingItem[]>(DUMMY_PACKING_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<PackingItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<PackingStatusUI>("pending");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const itemStatusUI = dbToUIStatus(item.status);
      const matchesSearch =
        item.order_id.toLowerCase().includes(keyword) ||
        item.picker_name.toLowerCase().includes(keyword);
      const matchesStatus = filterStatus === "all" ? true : itemStatusUI === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const openUpdateModal = (item: PackingItem) => {
    setSelectedItem(item);
    setSelectedStatus(dbToUIStatus(item.status));
    setIsUpdateModalOpen(true);
  };

  const closeUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedItem(null);
    setSelectedStatus("pending");
  };

  const handleSaveUpdate = () => {
    if (!selectedItem) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItem.id
          ? { ...item, status: uiToDBStatus(selectedStatus) }
          : item,
      ),
    );

    closeUpdateModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Daftar Packing Barang</h1>
        <p className="text-sm md:text-base text-slate-200">
          Pantau antrean dan proses pengemasan pesanan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari no pesanan / petugas..."
            className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(event) => setFilterStatus(event.target.value as FilterStatus)}
          className="w-full sm:w-52 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
        >
          <option value="all">Semua Status</option>
          <option value="pending">pending</option>
          <option value="proses">proses</option>
          <option value="selesai">selesai</option>
        </select>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                No. Pesanan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Petugas (Picker)
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
                const uiStatus = dbToUIStatus(item.status);

                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.order_id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {dateFormatter.format(new Date(item.created_at))}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.picker_name}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusBadgeClass(
                          uiStatus,
                        )}`}
                      >
                        {uiStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => openUpdateModal(item)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#BC934B]/30 bg-[#BC934B]/10 px-3 py-2 text-xs font-semibold text-[#BC934B] transition hover:bg-[#BC934B]/15"
                      >
                        <CheckCircle2 size={15} />
                        Update Status
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data packing tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={closeUpdateModal}
        title="Update Status Packing"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">No. Pesanan</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{selectedItem?.order_id ?? "-"}</p>
            <p className="mt-1 text-xs text-slate-600">Picker: {selectedItem?.picker_name ?? "-"}</p>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-sm font-medium text-slate-700">Pilih Status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as PackingStatusUI)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            >
              <option value="pending">pending</option>
              <option value="proses">proses</option>
              <option value="selesai">selesai</option>
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
              onClick={handleSaveUpdate}
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
