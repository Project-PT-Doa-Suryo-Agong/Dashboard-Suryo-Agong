"use client";

import { useMemo, useState } from "react";
import { Plus, Search, Truck } from "lucide-react";
import Modal from "@/components/ui/Modal";

type ManifestStatus = "preparing" | "in_transit" | "delivered";
type ManifestFilterStatus = "all" | ManifestStatus;

type ManifestItem = {
  id: string;
  order_id: string;
  resi: string;
  driver_name: string;
  vehicle_number: string;
  destination: string;
  status: ManifestStatus;
  dispatch_date: string;
  created_at: string;
};

type CreateManifestForm = {
  order_id: string;
  resi: string;
  driver_name: string;
  vehicle_number: string;
  destination: string;
  status: ManifestStatus;
  dispatch_date: string;
};

const DUMMY_MANIFEST_ITEMS: ManifestItem[] = [
  {
    id: "4e2f0f20-8a3b-4e6a-9a5b-3a11a8d30011",
    order_id: "ORD-20260314-010",
    resi: "RSI-260314-0010",
    driver_name: "Hendra Wijaya",
    vehicle_number: "B 9123 TKM",
    destination: "Bandung",
    status: "preparing",
    dispatch_date: "2026-03-14T08:30:00+07:00",
    created_at: "2026-03-14T07:50:00+07:00",
  },
  {
    id: "6b4d8f4a-2a67-4fb9-9f07-1cc113f30022",
    order_id: "ORD-20260314-011",
    resi: "RSI-260314-0011",
    driver_name: "Rudi Saputra",
    vehicle_number: "D 8451 MLA",
    destination: "Semarang",
    status: "in_transit",
    dispatch_date: "2026-03-14T07:45:00+07:00",
    created_at: "2026-03-14T07:15:00+07:00",
  },
  {
    id: "7775d7ab-2ebd-4269-9100-90a66d1b0033",
    order_id: "ORD-20260314-012",
    resi: "RSI-260314-0012",
    driver_name: "Maman Suherman",
    vehicle_number: "L 7720 HB",
    destination: "Surabaya",
    status: "delivered",
    dispatch_date: "2026-03-13T19:10:00+07:00",
    created_at: "2026-03-13T18:30:00+07:00",
  },
  {
    id: "0ce3a78f-1696-4fc9-89e8-2260f4690044",
    order_id: "ORD-20260314-013",
    resi: "RSI-260314-0013",
    driver_name: "Yoga Pratama",
    vehicle_number: "H 1309 YU",
    destination: "Yogyakarta",
    status: "in_transit",
    dispatch_date: "2026-03-14T06:55:00+07:00",
    created_at: "2026-03-14T06:10:00+07:00",
  },
  {
    id: "587c23e2-a877-4f8a-92d1-f8fa31f50055",
    order_id: "ORD-20260314-014",
    resi: "RSI-260314-0014",
    driver_name: "Danu Kurniawan",
    vehicle_number: "AD 9028 GP",
    destination: "Solo",
    status: "preparing",
    dispatch_date: "2026-03-14T09:40:00+07:00",
    created_at: "2026-03-14T09:05:00+07:00",
  },
  {
    id: "4f3ec6e9-5ca5-446d-8e13-ab703b7f0066",
    order_id: "ORD-20260314-015",
    resi: "RSI-260314-0015",
    driver_name: "Aldi Ramadhan",
    vehicle_number: "N 6604 PK",
    destination: "Malang",
    status: "delivered",
    dispatch_date: "2026-03-13T21:20:00+07:00",
    created_at: "2026-03-13T20:45:00+07:00",
  },
];

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function statusBadgeClass(status: ManifestStatus): string {
  if (status === "preparing") return "bg-amber-100 text-amber-700";
  if (status === "in_transit") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

function statusLabel(status: ManifestStatus): string {
  if (status === "preparing") return "Persiapan";
  if (status === "in_transit") return "Di Perjalanan";
  return "Terkirim";
}

const INITIAL_CREATE_FORM: CreateManifestForm = {
  order_id: "",
  resi: "",
  driver_name: "",
  vehicle_number: "",
  destination: "",
  status: "preparing",
  dispatch_date: "",
};

export default function ManifestPage() {
  const [items, setItems] = useState<ManifestItem[]>(DUMMY_MANIFEST_ITEMS);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<ManifestFilterStatus>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<CreateManifestForm>(INITIAL_CREATE_FORM);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [selectedManifest, setSelectedManifest] = useState<ManifestItem | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ManifestStatus>("preparing");

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return items.filter((item) => {
      const matchSearch =
        item.driver_name.toLowerCase().includes(keyword) ||
        item.destination.toLowerCase().includes(keyword);
      const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [items, searchTerm, filterStatus]);

  const handleOpenUpdateModal = (item: ManifestItem) => {
    setSelectedManifest(item);
    setSelectedStatus(item.status);
    setIsUpdateModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm(INITIAL_CREATE_FORM);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    setSelectedManifest(null);
    setSelectedStatus("preparing");
  };

  const handleSaveStatus = () => {
    if (!selectedManifest) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedManifest.id ? { ...item, status: selectedStatus } : item,
      ),
    );

    handleCloseUpdateModal();
  };

  const handleCreateManifest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const dispatchIsoDate = new Date(createForm.dispatch_date).toISOString();
    const nowIsoDate = new Date().toISOString();

    const newManifest: ManifestItem = {
      id: crypto.randomUUID(),
      order_id: createForm.order_id.trim(),
      resi: createForm.resi.trim(),
      driver_name: createForm.driver_name.trim(),
      vehicle_number: createForm.vehicle_number.trim(),
      destination: createForm.destination.trim(),
      status: createForm.status,
      dispatch_date: dispatchIsoDate,
      created_at: nowIsoDate,
    };

    setItems((prev) => [newManifest, ...prev]);
    handleCloseCreateModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manifest Pengiriman</h1>
        <p className="text-sm md:text-base text-slate-200">
          Kelola daftar pengiriman barang dan pantau status armada.
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
              placeholder="Cari nama kurir / tujuan..."
              className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as ManifestFilterStatus)
            }
            className="w-full sm:w-56 rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          >
            <option value="all">Semua Status</option>
            <option value="preparing">preparing</option>
            <option value="in_transit">in_transit</option>
            <option value="delivered">delivered</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          <Plus size={17} />
          Tambah Manifest Baru
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                ID Manifest
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Info Armada
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tujuan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Waktu Berangkat
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
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-900">{item.driver_name}</p>
                      <p className="text-xs text-slate-600">{item.vehicle_number}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{item.destination}</td>
                  <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                    {dateTimeFormatter.format(new Date(item.dispatch_date))}
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
                      onClick={() => handleOpenUpdateModal(item)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-yellow-400 bg-yellow-400/70 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-yellow-500"
                    >
                      <Truck size={15} />
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data manifest tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        title="Tambah Manifest Baru"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateManifest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Order ID</span>
              <input
                type="text"
                required
                value={createForm.order_id}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, order_id: event.target.value }))
                }
                placeholder="ORD-20260314-016"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Resi</span>
              <input
                type="text"
                required
                value={createForm.resi}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, resi: event.target.value }))
                }
                placeholder="RSI-260314-0016"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Nama Kurir</span>
              <input
                type="text"
                required
                value={createForm.driver_name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, driver_name: event.target.value }))
                }
                placeholder="Nama kurir"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Nomor Kendaraan</span>
              <input
                type="text"
                required
                value={createForm.vehicle_number}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, vehicle_number: event.target.value }))
                }
                placeholder="B 1234 ABC"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Tujuan</span>
              <input
                type="text"
                required
                value={createForm.destination}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, destination: event.target.value }))
                }
                placeholder="Kota tujuan"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    status: event.target.value as ManifestStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              >
                <option value="preparing">Persiapan</option>
                <option value="in_transit">Di Perjalanan</option>
                <option value="delivered">Terkirim</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Waktu Berangkat</span>
            <input
              type="datetime-local"
              required
              value={createForm.dispatch_date}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, dispatch_date: event.target.value }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseCreateModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Simpan Manifest
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isUpdateModalOpen}
        onClose={handleCloseUpdateModal}
        title="Update Status Manifest"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Manifest Terpilih
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {selectedManifest?.id.slice(0, 8).toUpperCase() ?? "-"}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {selectedManifest?.driver_name ?? "-"} | {selectedManifest?.destination ?? "-"}
            </p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-slate-700">Pilih Status</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as ManifestStatus)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            >
              <option value="preparing">preparing</option>
              <option value="in_transit">in_transit</option>
              <option value="delivered">delivered</option>
            </select>
          </label>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCloseUpdateModal}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveStatus}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
