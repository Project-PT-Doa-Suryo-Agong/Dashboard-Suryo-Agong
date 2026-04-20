"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import { SearchBar } from "@/components/ui/search-bar";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  RowActions,
  EditButton,
  DeleteButton,
} from "@/components/ui/RowActions";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { TContentStatistic, TContentPlanner } from "@/types/supabase";

export default function ContentStatsPage() {
  const [stats, setStats] = useState<TContentStatistic[]>([]);
  const [planners, setPlanners] = useState<TContentPlanner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contentPlannerId, setContentPlannerId] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [jumlahView, setJumlahView] = useState<number | null>(null);
  const [monetasi, setMonetasi] = useState<number | null>(null);

  // delete
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  const formatCurrency = useCallback((v?: number | null) => {
    const n = v ?? 0;
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  }, []);

  const loadPlanners = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/sales/content?page=1&limit=500`);
      const json = await res.json();
      if (json?.ok) setPlanners(json.data.content ?? []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/api/sales/content-stats?page=1&limit=500`);
      const json = await res.json();
      if (json?.ok) setStats(json.data.content_stats ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlanners();
    loadStats();
  }, [loadPlanners, loadStats]);

  const resetForm = () => {
    setEditingId(null);
    setContentPlannerId(null);
    setLink("");
    setJumlahView(null);
    setMonetasi(null);
  };

  const handleEdit = (row: TContentStatistic) => {
    setEditingId(row.id);
    setContentPlannerId(row.content_planner_id ?? null);
    setLink(row.link ?? "");
    setJumlahView(row.jumlah_view ?? null);
    setMonetasi(row.monetasi ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (row: TContentStatistic) => {
    setDeleteTargetId(row.id);
    setDeleteTargetName(row.t_content_planner?.judul ?? "content ini");
  };
  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteTargetName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!contentPlannerId) return alert("Pilih konten planner.");

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        content_planner_id: contentPlannerId,
        link: link || null,
        jumlah_view: jumlahView ?? null,
        monetasi: monetasi ?? null,
      };

      if (editingId) {
        const res = await apiFetch(`/api/sales/content-stats/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.message || "Gagal update");
      } else {
        const res = await apiFetch(`/api/sales/content-stats`, {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.message || "Gagal membuat");
      }

      await loadStats();
      resetForm();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat menyimpan.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/sales/content-stats/${deleteTargetId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || "Gagal hapus");
      await loadStats();
      closeDeleteDialog();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return stats.filter((s) => {
      const title = s.t_content_planner?.judul ?? "";
      return (
        title.toLowerCase().includes(q) ||
        (s.link ?? "").toLowerCase().includes(q)
      );
    });
  }, [searchQuery, stats]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <PlusCircle size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Content Statistics
            </h2>
            <p className="text-sm text-slate-200 mt-0.5">
              Kelola statistik konten dari content planner.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? "Edit Statistik" : "Tambah Statistik Konten"}
          </h3>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Judul Konten <span className="text-red-400">*</span>
            </label>
            <select
              value={contentPlannerId ?? ""}
              onChange={(e) => setContentPlannerId(e.target.value || null)}
              required
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-sm"
            >
              <option value="">Pilih konten...</option>
              {planners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.judul}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Link
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Link ke konten (opsional)"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Jumlah View
            </label>
            <input
              type="number"
              value={jumlahView ?? ("" as any)}
              onChange={(e) => setJumlahView(e.target.value ? Number(e.target.value) : null)}
              min={0}
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Monetasi
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 bg-slate-200 border border-r-0 border-slate-200 text-sm rounded-l-xl text-slate-700">
                Rp.
              </span>
              <input
                type="number"
                value={monetasi ?? ("" as any)}
                onChange={(e) =>
                  setMonetasi(e.target.value ? Number(e.target.value) : null)
                }
                min={0}
                className="flex-1 px-4 py-3 bg-slate-200 border border-slate-200 border-l-0 text-slate-700 rounded-r-xl text-sm"
              />
            </div>
          </div>

          <div className="md:col-span-3 flex justify-end">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 mr-3 text-sm rounded-lg bg-white border"
              >
                Batal Edit
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-bold py-3 px-6 rounded-xl"
            >
              {isSubmitting
                ? "Menyimpan..."
                : editingId
                  ? "Simpan Perubahan"
                  : "Tambah Statistik"}
            </button>
          </div>
        </form>
      </section>

      {/* Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Daftar Statistik Konten
            </h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
              {filtered.length}
            </span>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari judul atau link..."
            className="w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                  Judul Konten
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                  Link
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                  Jumlah View
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                  Monetasi (Rp.)
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">
                  Terakhir Update
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-sm text-slate-400"
                  >
                    Tidak ada statistik konten.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {r.t_content_planner?.judul ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.link ? (
                        <a
                          href={r.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          lihat
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.jumlah_view ?? "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {r.monetasi !== null ? formatCurrency(r.monetasi) : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {r.updated_at ? r.updated_at.split("T")[0] : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowActions>
                        <EditButton
                          onClick={() => handleEdit(r)}
                          disabled={isSubmitting}
                        />
                        <DeleteButton
                          onClick={() => openDeleteDialog(r)}
                          disabled={isSubmitting}
                        />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Hapus Statistik Konten"
        description={`Apakah kamu yakin ingin menghapus statistik untuk "${deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
