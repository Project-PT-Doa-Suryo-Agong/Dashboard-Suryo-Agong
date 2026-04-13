"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { Pencil, Search, Trash2, UserCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { HrAttendanceStatus, MKaryawan, TAttendance } from "@/types/supabase";
import {
  useAttendance,
  useInsertAttendance,
  useUpdateAttendance,
  useDeleteAttendance,
} from "@/lib/supabase/hooks/use-attendance";
import { useKaryawan } from "@/lib/supabase/hooks/use-karyawan";

type AttendanceStatus = HrAttendanceStatus;
type AttendanceItem = TAttendance;

type EmployeeOption = {
  id: string;
  nama: string;
  divisi: string;
};

function getTodayDateInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const todayDate = getTodayDateInput();

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function statusBadgeClass(status: AttendanceStatus) {
  if (status === "hadir") return "bg-emerald-100 text-emerald-700";
  if (status === "izin") return "bg-amber-100 text-amber-700";
  if (status === "sakit") return "bg-blue-100 text-blue-700";
  return "bg-red-100 text-red-700";
}

export default function AttendancePage() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | AttendanceStatus>("all");
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<AttendanceItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteTarget, setDeleteTarget] = useState<{ employee_id: string; tanggal: string } | null>(null);

  const [formData, setFormData] = useState<{
    employee_id: string;
    tanggal: string;
    status: AttendanceStatus;
  }>({
    employee_id: "",
    tanggal: todayDate,
    status: "hadir",
  });

  // ── Supabase Direct ──
  const { data: items, loading: isLoadingAttendance, refresh: refreshAttendance } = useAttendance();
  const { data: rawKaryawan, loading: isLoadingKaryawan } = useKaryawan();
  const { insert } = useInsertAttendance();
  const { updateByIdentity } = useUpdateAttendance();
  const { removeByIdentity } = useDeleteAttendance();

  const isLoading = isLoadingAttendance || isLoadingKaryawan;

  // Normalize employees
  const employees: EmployeeOption[] = useMemo(
    () =>
      rawKaryawan.map((employee: MKaryawan) => ({
        id: employee.id,
        nama: employee.nama,
        divisi: employee.divisi ?? "-",
      })),
    [rawKaryawan],
  );

  // Set default employee_id when employees first load
  useEffect(() => {
    if (employees.length > 0 && !formData.employee_id) {
      setFormData((prev) => ({
        ...prev,
        employee_id: employees[0].id,
      }));
    }
  }, [employees, formData.employee_id]);

  const employeeById = useMemo(
    () => Object.fromEntries(employees.map((employee) => [employee.id, employee])) as Record<string, EmployeeOption>,
    [employees],
  );

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const employee = employeeById[item.employee_id ?? ""];
      const matchName = (employee?.nama ?? "").toLowerCase().includes(keyword);
      const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
      return matchName && matchStatus;
    });
  }, [items, searchTerm, filterStatus, employeeById]);

  const attendanceSummary = useMemo(() => {
    return {
      hadir: items.filter((item) => item.status === "hadir").length,
      izin: items.filter((item) => item.status === "izin").length,
      sakit: items.filter((item) => item.status === "sakit").length,
      alpha: items.filter((item) => item.status === "alpha").length,
    };
  }, [items]);

  const resetForm = () => {
    setFormData({
      employee_id: employees[0]?.id ?? "",
      tanggal: todayDate,
      status: "hadir",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: AttendanceItem) => {
    setEditData(item);
    setFormData({
      employee_id: item.employee_id ?? "",
      tanggal: item.tanggal ?? todayDate,
      status: item.status ?? "alpha",
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const openDeleteModal = (target: { employee_id: string; tanggal: string }) => {
    setDeleteTarget(target);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const selectedEmployee = employees.find(
      (employee) => employee.id === formData.employee_id,
    );

    if (!selectedEmployee) {
      alert("Silakan pilih karyawan terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      employee_id: selectedEmployee.id,
      tanggal: formData.tanggal,
      status: formData.status,
    };

    try {
      if (editData) {
        const sourceEmployeeId = editData.employee_id;
        const sourceTanggal = editData.tanggal;
        if (!sourceEmployeeId || !sourceTanggal) {
          throw new Error("Identitas data presensi lama tidak lengkap.");
        }

        const result = await updateByIdentity(
          {
            source_employee_id: sourceEmployeeId,
            source_tanggal: sourceTanggal,
          },
          payload,
        );

        if (!result) throw new Error("Gagal update presensi.");
      } else {
        const result = await insert(payload);
        if (!result) throw new Error("Gagal mencatat presensi.");
      }

      refreshAttendance();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan presensi gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const success = await removeByIdentity({
        source_employee_id: deleteTarget.employee_id,
        source_tanggal: deleteTarget.tanggal,
      });
      if (!success) throw new Error("Gagal menghapus presensi.");
      refreshAttendance();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus presensi.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          Presensi Karyawan
        </h1>
        <p className="text-sm md:text-base text-slate-200">
          Catat dan tinjau kehadiran harian seluruh staf.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Hadir
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{attendanceSummary.hadir}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Izin
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{attendanceSummary.izin}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Sakit
          </p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{attendanceSummary.sakit}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
            Alpha
          </p>
          <p className="mt-1 text-2xl font-bold text-red-800">{attendanceSummary.alpha}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
          <div className="relative w-full sm:flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Cari nama karyawan..."
              className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(event.target.value as "all" | AttendanceStatus)
            }
            className="w-full rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition sm:w-55 md:w-50 lg:w-55 focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
          >
            <option value="all">Semua Status</option>
            <option value="hadir">Hadir</option>
            <option value="izin">Izin</option>
            <option value="sakit">Sakit</option>
            <option value="alpha">Alpha</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          <UserCheck size={18} />
          Input Presensi
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Nama Karyawan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Divisi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tanggal
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Memuat data...
                </td>
              </tr>
            ) : filteredItems.length > 0 ? (
              filteredItems.map((item, index) => {
                const employee = employeeById[item.employee_id ?? ""];
                const employeeName = employee?.nama ?? "Karyawan tidak ditemukan";
                return (
                  <tr
                    key={`${item.employee_id ?? "unknown"}-${item.tanggal ?? "no-date"}-${index}`}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {employeeName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{employee?.divisi ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {item.tanggal ? dateFormatter.format(new Date(item.tanggal)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
                          item.status ?? "alpha",
                        )}`}
                      >
                        {item.status ?? "alpha"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                          aria-label={`Edit presensi ${employeeName}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!item.employee_id || !item.tanggal) {
                              alert("Identitas data presensi tidak lengkap. Muat ulang halaman lalu coba lagi.");
                              return;
                            }
                            openDeleteModal({
                              employee_id: item.employee_id,
                              tanggal: item.tanggal,
                            });
                          }}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                          aria-label={`Hapus presensi ${employeeName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  Data presensi tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Presensi Karyawan" : "Input Presensi Karyawan"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Pilih Karyawan</span>
              <select
                required
                value={formData.employee_id}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, employee_id: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                <option value="" disabled>
                  Pilih karyawan
                </option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nama} - {employee.divisi}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Pilih Tanggal</span>
              <input
                required
                type="date"
                value={formData.tanggal}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, tanggal: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Pilih Status</span>
              <select
                required
                value={formData.status}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: event.target.value as AttendanceStatus,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              >
                <option value="hadir">hadir</option>
                <option value="izin">izin</option>
                <option value="sakit">sakit</option>
                <option value="alpha">alpha</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Presensi"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Presensi"
        description="Yakin ingin menghapus data presensi ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
