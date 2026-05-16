"use client";

import { useMemo, useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/search-bar";
import { RowActions, DetailButton } from "@/components/ui/RowActions";
import { useAuth } from "@/lib/supabase/auth-context";

// Tipe data dari view_rekap_penilaian
type PenilaianRekap = {
  nama_karyawan: string;
  jumlah_penilai: number;
  bulan: number;
  tahun: number;
  avg_kepribadian_persen: number;
  avg_teamwork_persen: number;
  avg_wawasan_persen: number;
  avg_komunikasi_persen: number;
  avg_networking_persen: number;
  avg_produktivitas_persen: number;
  avg_problem_solving_persen: number;
  avg_leadership_persen: number;
  skor_akhir_total: number;
  presensi: {
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    total: number;
    workingDays: number;
    persentase: number;
  } | null;
};

const parameterOptions = [
  { value: 1, label: "1 - Kurang" },
  { value: 2, label: "2 - Cukup" },
  { value: 3, label: "3 - Baik" },
  { value: 4, label: "4 - Sangat Baik" },
];

function getGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
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

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export default function PenilaianKaryawanPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<PenilaianRekap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [karyawanList, setKaryawanList] = useState<{ id: string; nama: string }[]>([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PenilaianRekap | null>(null);

  // Attendance summary for detail modal
  type AttendanceSummary = { hadir: number; sakit: number; izin: number; alpha: number; total: number; workingDays: number; persentase: number };
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);

  const [formData, setFormData] = useState({
    dinilai: "",
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

  const fetchPenilaian = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/management/penilaian");
      const result = await res.json();
      // Handle response wrapper either direct or nested inside data
      const payload = result.data || result;
      if (payload.items) {
        setItems(payload.items);
      }
    } catch (err) {
      console.error("Failed to fetch penilaian:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchKaryawan() {
      try {
        const res = await fetch("/api/profiles?page=1&limit=500");
        const result = await res.json();
        const payload = result.data || result;
        if (payload.profiles) {
          setKaryawanList(payload.profiles);
        }
      } catch (err) {
        console.error("Failed to fetch karyawan:", err);
      }
    }
    fetchKaryawan();
    fetchPenilaian();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      item.nama_karyawan.toLowerCase().includes(keyword)
    );
  }, [items, searchTerm]);

  // Handlers Modal
  const openCreateModal = () => {
    setFormData({
      dinilai: "",
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

  const closeFormModal = () => setIsFormModalOpen(false);

  const openDetailModal = async (item: PenilaianRekap) => {
    setSelectedItem(item);
    
    // If presensi is already available in the item, use it
    if (item.presensi) {
      setAttendanceSummary(item.presensi);
      setIsDetailModalOpen(true);
      return;
    }

    setAttendanceSummary(null);
    setIsDetailModalOpen(true);

    // Fallback: Fetch if not present (though enriched API should provide it)
    try {
      setIsLoadingAttendance(true);
      const params = new URLSearchParams({
        nama: item.nama_karyawan,
        bulan: String(item.bulan),
        tahun: String(item.tahun),
      });
      const res = await fetch(`/api/management/penilaian/attendance?${params}`);
      const result = await res.json();
      const payload = result.data || result;
      if (payload.summary) {
        setAttendanceSummary(payload.summary);
      }
    } catch (err) {
      console.error("Failed to fetch attendance summary:", err);
    } finally {
      setIsLoadingAttendance(false);
    }
  };
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setAttendanceSummary(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !formData.dinilai) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/management/penilaian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          penilai: user.id,
          dinilai: formData.dinilai,
          kepribadian_sikap: formData.kepribadian_sikap,
          teamwork: formData.teamwork,
          pengetahuan_wawasan: formData.pengetahuan_wawasan,
          komunikasi_pemasaran: formData.komunikasi_pemasaran,
          networking_data: formData.networking_data,
          produktivitas: formData.produktivitas,
          problem_solving: formData.problem_solving,
          leadership: formData.leadership,
          tanggal_penilaian: formData.tanggal_penilaian,
        }),
      });

      if (res.ok) {
        closeFormModal();
        fetchPenilaian();
      } else {
        const error = await res.json();
        alert(error.message || "Gagal menyimpan penilaian");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem");
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRole = (user?.profile?.role || "").toLowerCase();
  const canViewTable = ["super admin", "admin", "management", "hr", "human resources"].some(r => userRole.includes(r));

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Penilaian Karyawan</h1>
        <div className="space-y-1">
          <p className="text-sm md:text-base text-slate-200">
            {canViewTable 
              ? "Lihat rekapitulasi penilaian atau tambahkan data penilaian baru." 
              : "Lakukan penilaian kinerja karyawan secara objektif di sini."}
          </p>
          <p className="text-xs md:text-sm font-medium text-amber-200 bg-amber-900/40 inline-block px-3 py-1.5 rounded-lg border border-amber-500/30">
            ⚠️ <strong>Perhatian:</strong> Anda hanya dapat menilai setiap karyawan <strong>maksimal 1 kali</strong> dalam bulan yang sama.
          </p>
        </div>
      </section>

      <section className={`flex flex-col sm:flex-row gap-3 ${canViewTable ? 'sm:items-center sm:justify-between' : 'justify-start'}`}>
        {canViewTable && (
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari karyawan..."
            className="w-full sm:max-w-sm rounded-xl border border-slate-300 bg-slate-200 text-sm text-slate-700 shadow-sm outline-none"
          />
        )}

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <PlusCircle size={17} />
          Tambah Penilaian
        </button>
      </section>

      {canViewTable ? (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
            <table className="min-w-max w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Karyawan
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Periode
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Jumlah Penilai
                  </th>
                  <th className="px-4 md:px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Presensi
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Skor Akhir
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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => {
                    const grade = getGrade(item.skor_akhir_total);
                    return (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800">
                          {item.nama_karyawan}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                          {MONTHS[item.bulan - 1]} {item.tahun}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-600">
                          {item.jumlah_penilai} Orang
                        </td>
                        <td className="px-4 md:px-6 py-3 text-center">
                          {item.presensi ? (
                            <div className="flex flex-col items-center">
                              <span className={`text-sm font-bold ${
                                item.presensi.persentase >= 80 ? 'text-emerald-600' :
                                item.presensi.persentase >= 60 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {item.presensi.persentase}%
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {item.presensi.hadir}/{item.presensi.workingDays} Hari
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-800 font-semibold">
                          {Number(item.skor_akhir_total).toFixed(2)}%
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
                          </RowActions>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
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
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white/10 backdrop-blur shadow-sm p-8 text-center space-y-4">
          <div className="space-y-2">
            <p className="text-slate-200 font-medium text-lg">
              Area Penilaian
            </p>
            <p className="text-slate-300 text-sm max-w-md mx-auto">
              Anda dapat memberikan penilaian kinerja untuk rekan kerja melalui tombol <strong className="text-white">Tambah Penilaian</strong>. Namun, hanya HR dan Management yang memiliki akses untuk melihat rekapitulasi penilaian secara keseluruhan.
            </p>
          </div>
        </section>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={"Tambah Penilaian"}
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
              <select
                required
                value={formData.dinilai}
                onChange={(e) => setFormData({ ...formData, dinilai: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              >
                <option value="">Pilih Karyawan...</option>
                {karyawanList
                  .filter((k) => k.id !== user?.id)
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Penilai
              </label>
              <input
                required
                readOnly
                type="text"
                placeholder="Pilih Penilai..."
                value={user?.profile?.nama || user?.email || "Sistem"}
                className="w-full rounded-xl border border-slate-200 bg-slate-200 px-4 py-3 text-sm text-slate-500 cursor-not-allowed"
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
              disabled={isSubmitting}
              onClick={closeFormModal}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="Detail Rekap Penilaian Karyawan"
        maxWidth="max-w-2xl"
      >
        {selectedItem && (
          <div className="space-y-4 text-sm">
            {/* Info Karyawan & Skor */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-500">Karyawan</p>
                  <p className="font-semibold text-slate-900 text-base">{selectedItem.nama_karyawan}</p>
                </div>
                <div>
                  <p className="text-slate-500">Periode</p>
                  <p className="font-semibold text-slate-900">
                    {MONTHS[selectedItem.bulan - 1]} {selectedItem.tahun}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Jumlah Penilai</p>
                  <p className="font-semibold text-slate-900">
                    {selectedItem.jumlah_penilai} Orang
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Total Skor Akhir</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-semibold text-slate-900">
                      {Number(selectedItem.skor_akhir_total).toFixed(2)}%
                    </p>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${gradeClass(
                        getGrade(selectedItem.skor_akhir_total)
                      )}`}
                    >
                      Grade {getGrade(selectedItem.skor_akhir_total)}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />
              <p className="font-semibold text-slate-800">Rata-Rata Parameter Penilaian (%)</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { key: "avg_kepribadian_persen", label: "Kepribadian & Sikap" },
                  { key: "avg_teamwork_persen", label: "Teamwork" },
                  { key: "avg_wawasan_persen", label: "Pengetahuan & Wawasan" },
                  { key: "avg_komunikasi_persen", label: "Komunikasi & Pemasaran" },
                  { key: "avg_networking_persen", label: "Networking & Data" },
                  { key: "avg_produktivitas_persen", label: "Produktivitas" },
                  { key: "avg_problem_solving_persen", label: "Problem Solving" },
                  { key: "avg_leadership_persen", label: "Leadership" },
                ].map((param) => {
                  const val = selectedItem[param.key as keyof PenilaianRekap] as number;
                  return (
                    <div key={param.key} className="flex justify-between border-b border-slate-200 py-1">
                      <span className="text-slate-600">{param.label}</span>
                      <span className="font-medium text-slate-900">{Number(val).toFixed(2)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Presensi Karyawan Bulan Ini */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
              <p className="font-semibold text-blue-900 flex items-center gap-2">
                📋 Presensi Bulan {MONTHS[selectedItem.bulan - 1]} {selectedItem.tahun}
              </p>

              {isLoadingAttendance ? (
                <p className="text-blue-600 text-sm">Memuat data presensi...</p>
              ) : attendanceSummary ? (
                <div className="space-y-3">
                  {/* Percentage bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">Persentase Kehadiran</span>
                      <span className="text-sm font-bold text-blue-900">{attendanceSummary.persentase}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          attendanceSummary.persentase >= 80 ? 'bg-emerald-500' :
                          attendanceSummary.persentase >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(attendanceSummary.persentase, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600">
                      Hari kerja: {attendanceSummary.workingDays} hari
                    </p>
                  </div>

                  {/* Status breakdown grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="rounded-lg bg-emerald-100 border border-emerald-200 p-2.5 text-center">
                      <p className="text-lg font-bold text-emerald-700">{attendanceSummary.hadir}</p>
                      <p className="text-xs font-medium text-emerald-600">Hadir</p>
                    </div>
                    <div className="rounded-lg bg-sky-100 border border-sky-200 p-2.5 text-center">
                      <p className="text-lg font-bold text-sky-700">{attendanceSummary.sakit}</p>
                      <p className="text-xs font-medium text-sky-600">Sakit</p>
                    </div>
                    <div className="rounded-lg bg-amber-100 border border-amber-200 p-2.5 text-center">
                      <p className="text-lg font-bold text-amber-700">{attendanceSummary.izin}</p>
                      <p className="text-xs font-medium text-amber-600">Izin</p>
                    </div>
                    <div className="rounded-lg bg-rose-100 border border-rose-200 p-2.5 text-center">
                      <p className="text-lg font-bold text-rose-700">{attendanceSummary.alpha}</p>
                      <p className="text-xs font-medium text-rose-600">Alpha</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-blue-600 text-sm">Data presensi tidak tersedia.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}