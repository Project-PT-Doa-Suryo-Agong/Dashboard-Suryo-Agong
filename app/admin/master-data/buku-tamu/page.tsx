"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ChevronRight,
  Eye,
  PlusCircle,
  Clock,
  User,
  Phone,
  MapPin,
  Building,
  Briefcase,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Download,
  Calendar,
  Save,
  Trash2,
} from "lucide-react";
import type { TBukuTamu } from "@/types/supabase";
import {
  useBukuTamu,
  useInsertBukuTamu,
  useUpdateBukuTamu,
  useDeleteBukuTamu,
} from "@/lib/supabase/hooks/index";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import { SearchBar } from "@/components/ui/search-bar";
import { RowActions, EditButton, DetailButton, DeleteButton } from "@/components/ui/RowActions";

export default function AdminBukuTamuPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [selectedGuest, setSelectedGuest] = useState<TBukuTamu | null>(null);
  const [editingGuest, setEditingGuest] = useState<TBukuTamu | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TBukuTamu | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    nama_kamu: "",
    nomor_telepon: "",
    alamat: "",
    keperluan: "",
    asal_instansi: "",
    tau_utero_darimana: "",
    kritik_saran: "",
    status_hello: "",
  });

  // Fetching data using direct hooks
  const { data: guestList, loading: isLoading, error: readError, refresh } = useBukuTamu();
  const { update } = useUpdateBukuTamu();
  const { remove } = useDeleteBukuTamu();

  // Reset form
  const resetEditForm = () => {
    setEditingGuest(null);
    setEditForm({
      nama_kamu: "",
      nomor_telepon: "",
      alamat: "",
      keperluan: "",
      asal_instansi: "",
      tau_utero_darimana: "",
      kritik_saran: "",
      status_hello: "",
    });
  };

  const handleEditOpen = (guest: TBukuTamu) => {
    setEditingGuest(guest);
    setEditForm({
      nama_kamu: guest.nama_kamu ?? "",
      nomor_telepon: guest.nomor_telepon ?? "",
      alamat: guest.alamat ?? "",
      keperluan: guest.keperluan ?? "",
      asal_instansi: guest.asal_instansi ?? "",
      tau_utero_darimana: guest.tau_utero_darimana ?? "",
      kritik_saran: guest.kritik_saran ?? "",
      status_hello: guest.status_hello ?? "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await update(editingGuest.id, editForm);
      if (!result) throw new Error("Gagal mengupdate data tamu.");
      refresh();
      resetEditForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await remove(deleteTarget.id);
      if (!success) throw new Error("Gagal menghapus data tamu.");
      refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setIsSubmitting(false);
      setDeleteTarget(null);
    }
  };

  // Filtering data logic
  const filtered = useMemo(() => {
    return guestList.filter((g) => {
      const matchSearch =
        (g.nama_kamu ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.nomor_telepon ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.asal_instansi ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.keperluan ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === "ALL" || g.status_hello === statusFilter;
      const matchSource = sourceFilter === "ALL" || g.tau_utero_darimana === sourceFilter;

      return matchSearch && matchStatus && matchSource;
    });
  }, [guestList, searchQuery, statusFilter, sourceFilter]);

  // Unique sources for filter options
  const uniqueSources = useMemo(() => {
    const sources = guestList.map((g) => g.tau_utero_darimana).filter(Boolean) as string[];
    return Array.from(new Set(sources));
  }, [guestList]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) return;

    const headers = [
      "ID",
      "Nama Lengkap",
      "Nomor Telepon",
      "Status Hello",
      "Asal Instansi",
      "Alamat",
      "Keperluan",
      "Sumber Informasi",
      "Kritik & Saran",
      "Waktu Berkunjung",
    ];

    const rows = filtered.map((g) => [
      g.id,
      g.nama_kamu,
      g.nomor_telepon,
      g.status_hello,
      g.asal_instansi || "-",
      g.alamat || "-",
      g.keperluan,
      g.tau_utero_darimana,
      g.kritik_saran || "-",
      g.created_at ? new Date(g.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${(val ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `buku_tamu_utero_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/admin" className="hover:text-slate-300 text-slate-100 transition-colors">Admin</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <Link href="/admin/master-data" className="hover:text-slate-300 text-slate-100 transition-colors">Master Data</Link>
          <ChevronRight size={13} className="text-slate-30" />
          <span className="text-[#BC934B] font-medium">Buku Tamu</span>
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center">
              <ClipboardList size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Master Data: Buku Tamu</h2>
              <p className="text-sm text-slate-200 mt-0.5">Pantau dan kelola data tamu/visitor yang berkunjung ke Utero.</p>
            </div>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-[#BC934B] hover:bg-[#A88444] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all text-sm uppercase tracking-wider"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {readError ? (
          <p className="px-5 pt-5 text-sm text-rose-600">Gagal memuat data buku tamu: {readError}</p>
        ) : null}

        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ClipboardList size={18} className="text-slate-400" />
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Kehadiran Tamu</h3>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-purple-100 text-purple-600 text-xs font-semibold">
                {filtered.length} Tamu
              </span>
            </div>
            <div className="w-full md:w-80">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Cari nama, telp, instansi, keperluan..."
                className="relative w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {/* Status Hello Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Filter Status Hello
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-[#BC934B] text-sm transition-all"
              >
                <option value="ALL">Semua Status</option>
                <option value="AS GUEST (TAMU)">AS GUEST (TAMU)</option>
                <option value="AS TEAM">AS TEAM</option>
              </select>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Filter Sumber Info
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:border-[#BC934B] text-sm transition-all"
              >
                <option value="ALL">Semua Sumber Info</option>
                {uniqueSources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Area */}
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[800px]">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[160px]">Waktu Kunjungan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[140px]">Status Hello</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[180px]">Nama Lengkap</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[140px]">No Telepon</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[160px]">Asal Instansi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[220px]">Keperluan</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-[120px] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Memuat data buku tamu...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada kunjungan tamu yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filtered.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Waktu */}
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span>
                          {g.created_at
                            ? new Date(g.created_at).toLocaleString("id-ID", {
                                dateStyle: "short",
                                timeStyle: "short",
                                timeZone: "Asia/Jakarta",
                              })
                            : "-"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          g.status_hello === "AS TEAM"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-100 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {g.status_hello}
                      </span>
                    </td>

                    {/* Nama */}
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">
                      {g.nama_kamu}
                    </td>

                    {/* Telepon */}
                    <td className="px-6 py-4 text-sm text-slate-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {g.nomor_telepon}
                    </td>

                    {/* Instansi */}
                    <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">
                      {g.asal_instansi || "-"}
                    </td>

                    {/* Keperluan */}
                    <td className="px-6 py-4 text-sm text-slate-600 truncate">
                      {g.keperluan}
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <RowActions>
                        <DetailButton onClick={() => setSelectedGuest(g)} />
                        <EditButton onClick={() => handleEditOpen(g)} />
                        <DeleteButton onClick={() => setDeleteTarget(g)} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <Modal
          isOpen={!!selectedGuest}
          onClose={() => setSelectedGuest(null)}
          title={
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-bold text-slate-900">Rincian Buku Tamu</h3>
            </div>
          }
          maxWidth="max-w-xl"
        >
          <div className="space-y-6 pt-1 text-slate-700">
            {/* Header / Hello banner */}
            <div
              className={`rounded-2xl p-4 border text-center ${
                selectedGuest.status_hello === "AS TEAM"
                  ? "bg-purple-50 border-purple-100 text-purple-800"
                  : "bg-blue-50 border-blue-100 text-blue-800"
              }`}
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest opacity-60">
                Status Kehadiran
              </span>
              <h4 className="text-lg font-black tracking-wide">{selectedGuest.status_hello}</h4>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={13} /> Nama Lengkap
                </span>
                <p className="text-sm font-semibold text-slate-800">{selectedGuest.nama_kamu}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Phone size={13} /> Nomor Telepon / WA
                </span>
                <p className="text-sm font-semibold text-slate-800">{selectedGuest.nomor_telepon}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Building size={13} /> Asal Instansi / Instansi
                </span>
                <p className="text-sm font-semibold text-slate-800">{selectedGuest.asal_instansi || "-"}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar size={13} /> Waktu Kunjungan
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedGuest.created_at
                    ? new Date(selectedGuest.created_at).toLocaleString("id-ID", {
                        timeZone: "Asia/Jakarta",
                      })
                    : "-"}
                </p>
              </div>
            </div>

            {/* Source info */}
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <HelpCircle size={13} /> Mengetahui Utero Dari
              </span>
              <p className="text-sm font-semibold text-slate-800">{selectedGuest.tau_utero_darimana}</p>
            </div>

            {/* Alamat */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <MapPin size={13} /> Alamat Domisili
              </span>
              <p className="text-sm text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                {selectedGuest.alamat || "Alamat tidak diisi."}
              </p>
            </div>

            {/* Keperluan */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Briefcase size={13} /> Keperluan / Tujuan Berkunjung
              </span>
              <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl leading-relaxed whitespace-pre-line">
                {selectedGuest.keperluan}
              </p>
            </div>

            {/* Kritik & Saran */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <MessageSquare size={13} /> Kritik &amp; Saran
              </span>
              <p className="text-sm text-slate-700 bg-amber-50/50 border border-amber-100/50 p-3 rounded-xl leading-relaxed italic whitespace-pre-line">
                {selectedGuest.kritik_saran || "Kritik & saran tidak diisi."}
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGuest(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-all text-sm"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Guest Edit Modal */}
      {editingGuest && (
        <Modal
          isOpen={!!editingGuest}
          onClose={resetEditForm}
          title={
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-[#BC934B]" />
              <h3 className="text-lg font-bold text-slate-900">Ubah Data Buku Tamu</h3>
            </div>
          }
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleEditSubmit} className="space-y-5 pt-1 text-slate-700">
            {/* Status Hello Radio */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                HELLO! <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["AS GUEST (TAMU)", "AS TEAM"].map((st) => (
                  <label
                    key={st}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs font-bold uppercase tracking-wide transition-all ${
                      editForm.status_hello === st
                        ? "border-[#BC934B] bg-[#BC934B]/10 text-slate-800"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="status_hello"
                      value={st}
                      checked={editForm.status_hello === st}
                      onChange={(e) =>
                        setEditForm((prev) => ({ ...prev, status_hello: e.target.value }))
                      }
                      className="sr-only"
                    />
                    {st}
                  </label>
                ))}
              </div>
            </div>

            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Nama Lengkap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.nama_kamu}
                onChange={(e) => setEditForm((prev) => ({ ...prev, nama_kamu: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all"
              />
            </div>

            {/* Nomor Telepon */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Nomor Telepon / WhatsApp <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.nomor_telepon}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, nomor_telepon: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all"
              />
            </div>

            {/* Asal Instansi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Asal Instansi
              </label>
              <input
                type="text"
                value={editForm.asal_instansi}
                onChange={(e) => setEditForm((prev) => ({ ...prev, asal_instansi: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all"
              />
            </div>

            {/* Alamat */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Alamat Domisili
              </label>
              <textarea
                rows={2}
                value={editForm.alamat}
                onChange={(e) => setEditForm((prev) => ({ ...prev, alamat: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all resize-none"
              />
            </div>

            {/* Keperluan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Keperluan Berkunjung <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={2.5}
                value={editForm.keperluan}
                onChange={(e) => setEditForm((prev) => ({ ...prev, keperluan: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all resize-none"
              />
            </div>

            {/* Sumber Informasi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Sumber Informasi (Darimana Mengetahui Utero) <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={editForm.tau_utero_darimana}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, tau_utero_darimana: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all"
              />
            </div>

            {/* Kritik Saran */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                Kritik &amp; Saran
              </label>
              <textarea
                rows={2.5}
                value={editForm.kritik_saran}
                onChange={(e) => setEditForm((prev) => ({ ...prev, kritik_saran: e.target.value }))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-xl focus:ring-2 focus:ring-[#BC934B]/20 focus:border-[#BC934B] text-sm outline-none transition-all resize-none"
              />
            </div>

            {/* Actions */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetEditForm}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold transition-all text-sm hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all text-sm"
              >
                <Save size={16} />
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Kunjungan Tamu"
        description={`Apakah kamu yakin ingin menghapus catatan kunjungan tamu "${deleteTarget?.nama_kamu}"? Tindakan ini bersifat permanen.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
