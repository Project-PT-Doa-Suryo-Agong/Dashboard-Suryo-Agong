"use client";

import { FormEvent, useMemo, useState, useEffect } from "react";
import { AlertTriangle, Pencil, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  useWarnings,
  useInsertWarning,
  useUpdateWarning,
  useDeleteWarning,
} from "@/lib/supabase/hooks/use-warnings";
import { useKaryawan } from "@/lib/supabase/hooks/use-karyawan";
import type { TEmployeeWarning, MKaryawan } from "@/types/supabase";

type WarningItem = TEmployeeWarning;

type EmployeeOption = {
  id: string;
  nama: string;
  posisi: string;
};

const warningLevelOptions = ["Teguran Lisan", "SP1", "SP2", "SP3"];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function levelBadgeClass(level: string) {
  if (level === "SP1") return "bg-amber-100 text-amber-700";
  if (level === "SP2") return "bg-orange-100 text-orange-700";
  if (level === "SP3") return "bg-red-100 text-red-700";
  return "bg-slate-200 text-slate-700";
}

export default function EmployeeWarningsPage() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editData, setEditData] = useState<WarningItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState<{
    employee_id: string;
    level: string;
    alasan: string;
  }>({
    employee_id: "",
    level: warningLevelOptions[0],
    alasan: "",
  });

  // ── Supabase Direct ──
  const { data: warnings, loading: isLoadingWarnings, refresh: refreshWarnings } = useWarnings();
  const { data: rawKaryawan, loading: isLoadingKaryawan } = useKaryawan();
  const { insert } = useInsertWarning();
  const { update } = useUpdateWarning();
  const { remove } = useDeleteWarning();

  const isLoading = isLoadingWarnings || isLoadingKaryawan;

  // Normalize employees
  const employees: EmployeeOption[] = useMemo(
    () =>
      rawKaryawan.map((employee: MKaryawan) => ({
        id: employee.id,
        nama: employee.nama,
        posisi: employee.posisi ?? "-",
      })),
    [rawKaryawan],
  );

  // Default selection when employees load
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
    if (!keyword) return warnings;
    return warnings.filter((item) => (employeeById[item.employee_id ?? ""]?.nama ?? "").toLowerCase().includes(keyword));
  }, [warnings, searchTerm, employeeById]);

  const filteredEmployeeOptions = useMemo(() => {
    const keyword = employeeSearchTerm.trim().toLowerCase();
    if (!keyword) return employees;
    return employees.filter((employee) =>
      employee.nama.toLowerCase().includes(keyword),
    );
  }, [employeeSearchTerm, employees]);

  const employeeSelectOptions =
    filteredEmployeeOptions.length > 0 ? filteredEmployeeOptions : employees;

  const resetForm = () => {
    setFormData({
      employee_id: employees[0]?.id ?? "",
      level: warningLevelOptions[0],
      alasan: "",
    });
    setEmployeeSearchTerm("");
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: WarningItem) => {
    setEditData(item);
    setFormData({
      employee_id: item.employee_id ?? "",
      level: item.level ?? warningLevelOptions[0],
      alasan: item.alasan ?? "",
    });
    setEmployeeSearchTerm("");
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
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
      level: formData.level,
      alasan: formData.alasan.trim(),
    };

    try {
      if (editData) {
        const result = await update(editData.id, payload);
        if (!result) throw new Error("Gagal update surat peringatan.");
      } else {
        const result = await insert(payload);
        if (!result) throw new Error("Gagal membuat surat peringatan.");
      }

      refreshWarnings();
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan gagal.";
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
    if (!deleteId) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const success = await remove(deleteId);
      if (!success) throw new Error("Gagal menghapus peringatan.");
      refreshWarnings();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus peringatan.";
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
          Manajemen Surat Peringatan (SP)
        </h1>
        <p className="text-sm md:text-base text-slate-200">
          Catat dan pantau histori teguran atau surat peringatan karyawan.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
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

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
        >
          <AlertTriangle size={18} />
          Buat Warning
        </button>
      </div>

      <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Nama Karyawan
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                Alasan
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
              filteredItems.map((item) => {
                const employee = employeeById[item.employee_id ?? ""];
                const employeeName = employee?.nama ?? "Karyawan tidak ditemukan";
                return (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                      {item.created_at ? dateFormatter.format(new Date(item.created_at)) : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-slate-900">{employeeName}</p>
                      <p className="text-xs text-slate-500">{employee?.posisi ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${levelBadgeClass(
                          item.level ?? "",
                        )}`}
                      >
                        {item.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <p className="max-w-xs truncate sm:max-w-sm md:max-w-md">
                        {item.alasan}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
                          aria-label={`Edit warning ${employeeName}`}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                          aria-label={`Hapus warning ${employeeName}`}
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
                  Data warning tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Record Surat Peringatan" : "Buat Surat Peringatan Baru"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-slate-700">
                Cari Karyawan
              </label>
              <input
                type="text"
                value={employeeSearchTerm}
                onChange={(event) => setEmployeeSearchTerm(event.target.value)}
                placeholder="Ketik nama karyawan..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </div>

            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Pilih Karyawan</span>
              <select
                required
                value={formData.employee_id}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, employee_id: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              >
                {employeeSelectOptions.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.nama} - {employee.posisi}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Level</span>
              <select
                required
                value={formData.level}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, level: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              >
                {warningLevelOptions.map((levelOption) => (
                  <option key={levelOption} value={levelOption}>
                    {levelOption}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Alasan</label>
              <textarea
                required
                rows={4}
                value={formData.alasan}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, alasan: event.target.value }))
                }
                placeholder="Tuliskan alasan peringatan secara jelas..."
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
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
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Record"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Warning"
        description="Yakin ingin menghapus data warning ini?"
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
