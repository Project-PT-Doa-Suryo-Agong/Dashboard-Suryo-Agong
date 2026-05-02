"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, Edit, PlusCircle, Trash2, Trophy } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TKPIWeekly } from "@/types/supabase";
import { SearchBar } from "@/components/ui/search-bar";
import { apiFetch } from "@/lib/utils/api-fetch";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

type KpiListPayload = {
  kpi: TKPIWeekly[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type KpiPayload = {
  kpi: TKPIWeekly | null;
};

type FormState = {
  minggu: string;
  divisi: string;
  target: string;
  realisasi: string;
};

const initialFormState: FormState = {
  minggu: "",
  divisi: "",
  target: "",
  realisasi: "",
};

const divisionOptions = [
  "Management & Strategy",
  "Finance & Administration",
  "HR & Operation Manager",
  "Produksi & Quality Control",
  "Logistics & Packing",
  "Creative & Sales",
  "Office Support",
  "Super Admin",
] as const;

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function statusClass(score: number): string {
  if (score < 60) return "bg-rose-100 text-rose-700";
  if (score <= 80) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function statusLabel(score: number): string {
  if (score < 60) return "Kurang";
  if (score <= 80) return "Cukup";
  return "Baik";
}

function getScore(item: TKPIWeekly): number {
  if (!item.target) return 0;
  return Math.round((item.realisasi / item.target) * 100);
}

export default function ManagementKpiPage() {
  const [items, setItems] = useState<TKPIWeekly[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TKPIWeekly | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [kpiNumber, setKpiNumber] = useState("");

  const fetchKpi = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("/api/management/kpi?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<KpiListPayload>(response);
      setItems(payload.data.kpi ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data KPI.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDefaultKpiNumber = async () => {
    try {
      const response = await apiFetch("/api/management/kpi-number", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<{ count: number }>(response);
      const count = payload.data.count ?? 0;
      const now = new Date();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yy = String(now.getFullYear()).slice(-2);
      const nnnnn = String(count + 1).padStart(5, "0");
      setKpiNumber(`KPI-${mm}${yy}-${nnnnn}`);
    } catch {
      setKpiNumber("");
    }
  };

  useEffect(() => {
    void Promise.all([fetchKpi(), fetchDefaultKpiNumber()]);
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) =>
      (item.kpi_number ?? "").toLowerCase().includes(keyword) ||
      (item.divisi ?? "").toLowerCase().includes(keyword),
    );
  }, [items, searchTerm]);

  const averagePerformance = useMemo(() => {
    if (filteredItems.length === 0) return 0;
    const totalScore = filteredItems.reduce((sum, item) => sum + getScore(item), 0);
    return Math.round(totalScore / filteredItems.length);
  }, [filteredItems]);

  const bestDivision = useMemo(() => {
    if (filteredItems.length === 0) return null;
    return [...filteredItems].sort((a, b) => getScore(b) - getScore(a))[0];
  }, [filteredItems]);

  const needAttentionCount = useMemo(
    () => filteredItems.filter((item) => getScore(item) < 70).length,
    [filteredItems],
  );

  const resetForm = () => {
    setFormData(initialFormState);
    setEditData(null);
  };

  const openCreateModal = () => {
    resetForm();
    void fetchDefaultKpiNumber();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TKPIWeekly) => {
    setEditData(item);
    setKpiNumber(item.kpi_number ?? "");
    setFormData({
      minggu: item.minggu.split("T")[0],
      divisi: item.divisi ?? "",
      target: String(item.target),
      realisasi: String(item.realisasi),
    });
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    resetForm();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedTarget = Number(formData.target);
    const parsedRealisasi = Number(formData.realisasi);

    if (!formData.minggu.trim() || !formData.divisi.trim()) {
      alert("Minggu dan divisi wajib diisi.");
      return;
    }
    if (Number.isNaN(parsedTarget) || Number.isNaN(parsedRealisasi)) {
      alert("Target dan realisasi harus berupa angka.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        minggu: formData.minggu.trim(),
        divisi: formData.divisi.trim(),
        target: parsedTarget,
        realisasi: parsedRealisasi,
        ...(editData ? {} : { kpi_number: kpiNumber || undefined }),
      };

      if (editData) {
        const response = await apiFetch(`/api/management/kpi/${editData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<KpiPayload>(response);
      } else {
        const response = await apiFetch("/api/management/kpi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        await parseJsonResponse<KpiPayload>(response);
      }

      await fetchKpi();
      if (!editData) {
        await fetchDefaultKpiNumber();
      }
      closeFormModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menyimpan KPI.";
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
    if (!deleteId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/management/kpi/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchKpi();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus KPI.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Key Performance Indicator (KPI)</h1>
        <p className="text-sm md:text-base text-slate-200">Pantau target dan realisasi kinerja mingguan setiap divisi.</p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rata-Rata Performa</p>
              <p className="text-2xl md:text-3xl font-bold text-slate-900">{averagePerformance}%</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Activity className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Divisi Terbaik</p>
              <p className="text-lg md:text-2xl font-bold text-[#BC934B] break-words">
                {bestDivision ? `${bestDivision.divisi ?? "-"} (${getScore(bestDivision)}%)` : "-"}
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
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Perlu Perhatian</p>
              <p className="text-2xl md:text-3xl font-bold text-rose-600">{needAttentionCount}</p>
              <p className="text-xs md:text-sm text-rose-500">Score di bawah target (&lt; 70%)</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500 text-white">
              <Activity className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Cari nama divisi..."
            className="w-full sm:max-w-sm rounded-xl border border-slate-300 bg-slate-200 py-2.5 px-3 text-sm text-slate-700 shadow-sm outline-none"
          />

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <PlusCircle size={17} />
          Tambah KPI
        </button>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-max w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Nomor KPI</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Divisi</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Target</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Realisasi</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Pencapaian (%)</th>
                <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
                <th className="px-4 md:px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">Memuat data...</td>
                </tr>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const score = getScore(item);
                  const formattedDate = new Date(item.minggu).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-800 whitespace-nowrap">{item.kpi_number ?? item.id}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{formattedDate}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800">{item.divisi ?? "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.target}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{item.realisasi}</td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{score}%</td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(score)}`}>
                          {statusLabel(score)}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-right">
                        <RowActions>
                          <EditButton onClick={() => openEditModal(item)} disabled={isSubmitting} />
                          <DeleteButton onClick={() => openDeleteModal(item.id)} disabled={isSubmitting} />
                        </RowActions>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">Data KPI tidak ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal isOpen={isFormModalOpen} onClose={closeFormModal} title={editData ? "Edit KPI" : "Tambah KPI"} maxWidth="max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nomor KPI</label>
            <input
              readOnly
              value={editData?.kpi_number ?? kpiNumber}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-600"
            />
          </div>
          <input
            required
            type="date"
            value={formData.minggu}
            onChange={(event) => setFormData((prev) => ({ ...prev, minggu: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
            disabled={isSubmitting}
          />
          <select
            required
            value={formData.divisi}
            onChange={(event) => setFormData((prev) => ({ ...prev, divisi: event.target.value }))}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
            disabled={isSubmitting}
          >
            <option value="" disabled>
              Pilih divisi
            </option>
            {formData.divisi && !divisionOptions.includes(formData.divisi as (typeof divisionOptions)[number]) ? (
              <option value={formData.divisi}>{formData.divisi}</option>
            ) : null}
            {divisionOptions.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              required
              type="number"
              value={formData.target}
              onChange={(event) => setFormData((prev) => ({ ...prev, target: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              placeholder="Target"
              disabled={isSubmitting}
            />
            <input
              required
              type="number"
              value={formData.realisasi}
              onChange={(event) => setFormData((prev) => ({ ...prev, realisasi: event.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700"
              placeholder="Realisasi"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeFormModal} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus KPI"
        description="Apakah Anda yakin ingin menghapus data KPI ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
