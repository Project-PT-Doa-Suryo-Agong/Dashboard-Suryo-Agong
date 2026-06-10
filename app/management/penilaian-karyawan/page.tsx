"use client";

import { useMemo, useState } from "react";
import { Activity, PlusCircle, Trophy, Users } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/search-bar";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

// Tipe data mock (hanya untuk UI)
type Penilaian = {
  id: string;
  penilai_nama: string;
  dinilai_nama: string;
  kepribadian_sikap: number;
  teamwork: number;
  pengetahuan_wawasan: number;
  komunikasi_pemasaran: number;
  networking_data: number;
  produktivitas: number;
  problem_solving: number;
  leadership: number;
  tanggal_penilaian: string;
};

// Data mock untuk tampilan awal
const mockData: Penilaian[] = [
  {
    id: "1",
    penilai_nama: "Budi Santoso (Manager)",
    dinilai_nama: "Andi Saputra",
    kepribadian_sikap: 4,
    teamwork: 3,
    pengetahuan_wawasan: 4,
    komunikasi_pemasaran: 3,
    networking_data: 3,
    produktivitas: 4,
    problem_solving: 3,
    leadership: 2,
    tanggal_penilaian: "2026-05-10",
  },
  {
    id: "2",
    penilai_nama: "Siti Aminah (Supervisor)",
    dinilai_nama: "Dewi Lestari",
    kepribadian_sikap: 3,
    teamwork: 4,
    pengetahuan_wawasan: 3,
    komunikasi_pemasaran: 4,
    networking_data: 2,
    produktivitas: 3,
    problem_solving: 4,
    leadership: 3,
    tanggal_penilaian: "2026-05-12",
  },
];

const parameterOptions = [
  { value: 1, label: "1 - Kurang" },
  { value: 2, label: "2 - Cukup" },
  { value: 3, label: "3 - Baik" },
  { value: 4, label: "4 - Sangat Baik" },
];

function calculateTotalScore(item: Penilaian): number {
  return (
    item.kepribadian_sikap +
    item.teamwork +
    item.pengetahuan_wawasan +
    item.komunikasi_pemasaran +
    item.networking_data +
    item.produktivitas +
    item.problem_solving +
    item.leadership
  );
}

function calculateMaxScore(): number {
  return 8 * 4; // 8 parameter * skor maksimal 4
}

function getGrade(score: number): string {
  const percentage = (score / calculateMaxScore()) * 100;
  if (percentage >= 85) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 50) return "C";
  return "D";
}

function gradeClass(grade: string): string {
  switch (grade) {
    case "A":
      return "bg-emerald-500 text-white";
    case "B":
      return "bg-blue-500 text-white";
    case "C":
      return "bg-amber-500 text-white";
    default:
      return "bg-rose-500 text-white";
  }
}

export default function PenilaianKaryawanPage() {
  const [items, setItems] = useState<Penilaian[]>(mockData);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<Penilaian | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Penilaian | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    penilai_nama: "",
    dinilai_nama: "",
    kepribadian_sikap: 3,
    teamwork: 3,
    pengetahuan_wawasan: 3,
    komunikasi_pemasaran: 3,
    networking_data: 3,
    produktivitas: 3,
    problem_solving: 3,
    leadership: 3,
    tanggal_penilaian: new Date().toISOString().split("T")[0],
  });

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter(
      (item) =>
        item.dinilai_nama.toLowerCase().includes(keyword) ||
        item.penilai_nama.toLowerCase().includes(keyword)
    );
  }, [items, searchTerm]);

  // Statistik ringan (Mock)
  const averageScore = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    const total = filteredItems.reduce((acc, item) => acc + calculateTotalScore(item), 0);
    return Math.round((total / (filteredItems.length * calculateMaxScore())) * 100);
  }, [filteredItems]);

  const bestEmployee = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return [...filteredItems].sort((a, b) => calculateTotalScore(b) - calculateTotalScore(a))[0];
  }, [filteredItems]);

  // Handlers Modal
  const openCreateModal = () => {
    setEditData(null);
    setFormData({
      penilai_nama: "",
      dinilai_nama: "",
      kepribadian_sikap: 3,
      teamwork: 3,
      pengetahuan_wawasan: 3,
      komunikasi_pemasaran: 3,
      networking_data: 3,
      produktivitas: 3,
      problem_solving: 3,
      leadership: 3,
      tanggal_penilaian: new Date().toISOString().split("T")[0],
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: Penilaian) => {
    setEditData(item);
    setFormData({
      penilai_nama: item.penilai_nama,
      dinilai_nama: item.dinilai_nama,
      kepribadian_sikap: item.kepribadian_sikap,
      teamwork: item.teamwork,
      pengetahuan_wawasan: item.pengetahuan_wawasan,
      komunikasi_pemasaran: item.komunikasi_pemasaran,
      networking_data: item.networking_data,
      produktivitas: item.produktivitas,
      problem_solving: item.problem_solving,
      leadership: item.leadership,
      tanggal_penilaian: item.tanggal_penilaian,
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => setIsFormModalOpen(false);

  const openDetailModal = (item: Penilaian) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };
  const closeDetailModal = () => setIsDetailModalOpen(false);

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulasi simpan data UI
    closeFormModal();
  };

  const handleConfirmDelete = () => {
    // Simulasi hapus data UI
    closeDeleteModal();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Penilaian Karyawan</h1>
        <p className="text-sm md:text-base text-slate-200">
          Kelola evaluasi kinerja karyawan secara berkala.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rata-Rata Nilai
              </p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{averageScore}%</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Activity className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Karyawan Terbaik (Bulan Ini)
              </p>
              <p className="text-lg md:text-2xl font-bold text-[#BC934B] break-words">
                {bestEmployee ? bestEmployee.dinilai_nama : "-"}
              </p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
              <Trophy className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Penilaian
              </p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{filteredItems.length}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari karyawan / penilai..."
          className="w-full sm:max-w-sm rounded-xl border border-slate-300 bg-slate-200 text-sm text-slate-700 shadow-sm outline-none"
        />

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <PlusCircle size={17} />
          Tambah Penilaian
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-max w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Tanggal
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Karyawan (Dinilai)
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Penilai
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Skor
                </th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Grade
                </th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const score = calculateTotalScore(item);
                  const grade = getGrade(score);
                  const formattedDate = new Date(item.tanggal_penilaian).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }
                  );
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {formattedDate}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800">
                        {item.dinilai_nama}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600">
                        {item.penilai_nama}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-800 font-semibold">
                        {score} / {calculateMaxScore()}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${gradeClass(
                            grade
                          )}`}
                        >
                          Grade {grade}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right">
                        <RowActions>
                          <DetailButton onClick={() => openDetailModal(item)} />
                          <EditButton onClick={() => openEditModal(item)} />
                          <DeleteButton onClick={() => openDeleteModal(item.id)} />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 md:px-6 py-8 text-center text-sm text-slate-500"
                  >
                    Data Penilaian tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={editData ? "Edit Penilaian" : "Tambah Penilaian"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tanggal Penilaian
              </label>
              <input
                required
                type="date"
                value={formData.tanggal_penilaian}
                onChange={(e) => setFormData({ ...formData, tanggal_penilaian: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Karyawan (Dinilai)
              </label>
              {/* Simulasi Dropdown Karyawan */}
              <input
                required
                type="text"
                placeholder="Pilih Karyawan..."
                value={formData.dinilai_nama}
                onChange={(e) => setFormData({ ...formData, dinilai_nama: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Penilai
              </label>
              <input
                required
                type="text"
                placeholder="Pilih Penilai..."
                value={formData.penilai_nama}
                onChange={(e) => setFormData({ ...formData, penilai_nama: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              />
            </div>
          </div>

          <hr className="border-slate-200" />
          <p className="text-sm font-semibold text-slate-800">Parameter Penilaian (Skala 1-4)</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "kepribadian_sikap", label: "Kepribadian & Sikap" },
              { key: "teamwork", label: "Teamwork" },
              { key: "pengetahuan_wawasan", label: "Pengetahuan & Wawasan" },
              { key: "komunikasi_pemasaran", label: "Komunikasi & Pemasaran" },
              { key: "networking_data", label: "Networking & Data" },
              { key: "produktivitas", label: "Produktivitas" },
              { key: "problem_solving", label: "Problem Solving" },
              { key: "leadership", label: "Leadership" },
            ].map((param) => (
              <div key={param.key} className="space-y-1">
                <label className="text-xs font-semibold tracking-wide text-slate-500">
                  {param.label}
                </label>
                <select
                  required
                  value={formData[param.key as keyof typeof formData] as number}
                  onChange={(e) =>
                    setFormData({ ...formData, [param.key]: parseInt(e.target.value, 10) })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
                >
                  {parameterOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeFormModal}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="Detail Penilaian Karyawan"
        maxWidth="max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Karyawan (Dinilai)</p>
                  <p className="font-semibold text-slate-900 text-base">{selectedItem.dinilai_nama}</p>
                </div>
                <div>
                  <p className="text-slate-500">Penilai</p>
                  <p className="font-semibold text-slate-900">{selectedItem.penilai_nama}</p>
                </div>
                <div>
                  <p className="text-slate-500">Tanggal Penilaian</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(selectedItem.tanggal_penilaian).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total Skor</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold text-slate-900">
                      {calculateTotalScore(selectedItem)} / {calculateMaxScore()}
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${gradeClass(
                        getGrade(calculateTotalScore(selectedItem))
                      )}`}
                    >
                      Grade {getGrade(calculateTotalScore(selectedItem))}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />
              <p className="font-semibold text-slate-800">Rincian Parameter (Skala 1-4)</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { key: "kepribadian_sikap", label: "Kepribadian & Sikap" },
                  { key: "teamwork", label: "Teamwork" },
                  { key: "pengetahuan_wawasan", label: "Pengetahuan & Wawasan" },
                  { key: "komunikasi_pemasaran", label: "Komunikasi & Pemasaran" },
                  { key: "networking_data", label: "Networking & Data" },
                  { key: "produktivitas", label: "Produktivitas" },
                  { key: "problem_solving", label: "Problem Solving" },
                  { key: "leadership", label: "Leadership" },
                ].map((param) => {
                  const val = selectedItem[param.key as keyof Penilaian] as number;
                  const label = parameterOptions.find((o) => o.value === val)?.label;
                  return (
                    <div key={param.key} className="flex justify-between border-b border-slate-200 py-1">
                      <span className="text-slate-600">{param.label}</span>
                      <span className="font-medium text-slate-900">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Penilaian"
        description="Apakah Anda yakin ingin menghapus data penilaian ini? Data yang dihapus tidak dapat dikembalikan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}