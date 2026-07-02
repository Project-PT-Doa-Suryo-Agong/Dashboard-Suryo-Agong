"use client";

import { useState } from "react";
import { Plus, Check, X, ArrowLeft, ArrowUpRight, ArrowDownLeft, Printer } from "lucide-react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { exportToPDF } from "@/lib/utils/export-pdf";
import {
  useBahanBaku,
  useMutasiStok,
  useInsertMutasiStok,
} from "@/lib/supabase/hooks/use-bahan-baku";
import type { MBahanBaku } from "@/types/supabase";
import { useAuth } from "@/lib/supabase/auth-context";

const CRUD_PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50";
const CRUD_CANCEL_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 disabled:opacity-50";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function MutasiStokPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedBahanFilter, setSelectedBahanFilter] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");

  // Hooks
  const { data: bahanBakuList } = useBahanBaku({ limit: 500, statusAktif: true });
  const { data: mutasiList, loading, error, meta, refresh } = useMutasiStok({
    page,
    limit: 50,
    bahanBakuId: selectedBahanFilter,
    tipe: tipeFilter,
  });

  const { insert, loading: isSubmitting } = useInsertMutasiStok();

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    bahan_baku_id: "",
    tipe: "masuk",
    jumlah: "",
    keterangan: "",
    operator: "",
  });

  const openAddModal = () => {
    setFormData({
      bahan_baku_id: "",
      tipe: "masuk",
      jumlah: "",
      keterangan: "",
      operator: user?.profile?.nama || "Operator Produksi",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = {
      bahan_baku_id: formData.bahan_baku_id,
      tipe: formData.tipe,
      jumlah: Number(formData.jumlah),
      keterangan: formData.keterangan || "Pencatatan Manual",
      operator: formData.operator,
    };

    const result = await insert(payload);
    if (result) {
      setIsModalOpen(false);
      refresh();
    } else {
      setFormError("Gagal mencatat mutasi. Periksa kembali stok yang tersedia (stok tidak boleh minus).");
    }
  };

  const bahanNamaMap = new Map(bahanBakuList.map((b) => [b.id, b.nama_bahan]));
  const bahanKodeMap = new Map(bahanBakuList.map((b) => [b.id, b.kode_bahan]));
  const bahanSatuanMap = new Map(bahanBakuList.map((b) => [b.id, b.satuan]));

  const handleExportPDF = () => {
    const filterBahan = selectedBahanFilter
      ? `${bahanKodeMap.get(selectedBahanFilter)} - ${bahanNamaMap.get(selectedBahanFilter)}`
      : "Semua Bahan Baku";
    const filterTipe = tipeFilter ? `Tipe: ${tipeFilter}` : "Semua Tipe";
    exportToPDF({
      title: "Laporan Mutasi Stok",
      subtitle: `Bahan: ${filterBahan} | ${filterTipe}`,
      headers: ["Tanggal", "Kode Bahan", "Nama Bahan", "Tipe", "Jumlah", "Keterangan", "Operator"],
      rows: mutasiList.map((item) => {
        const sign = item.tipe === "masuk" ? "+" : item.tipe === "produksi" ? "=" : "-";
        return [
          item.created_at ? formatDate(item.created_at) : "-",
          item.m_bahan_baku?.kode_bahan ?? "-",
          item.m_bahan_baku?.nama_bahan ?? "-",
          item.tipe.toUpperCase(),
          `${sign} ${item.jumlah} ${item.m_bahan_baku?.satuan ?? ""}`,
          item.keterangan || "-",
          item.operator,
        ];
      }),
      columnStyles: {
        0: { cellWidth: 32 },
      },
      summary: [
        { label: "Total Mutasi", value: `${meta.total} catatan` },
        ...(!tipeFilter || tipeFilter === "masuk" ? [{ label: "Barang Masuk", value: `${mutasiList.filter((i) => i.tipe === "masuk").length}x` }] : []),
        ...(!tipeFilter || tipeFilter === "keluar" ? [{ label: "Barang Keluar", value: `${mutasiList.filter((i) => i.tipe === "keluar").length}x` }] : []),
        ...(!tipeFilter || tipeFilter === "produksi" ? [{ label: "Alokasi Produksi", value: `${mutasiList.filter((i) => i.tipe === "produksi").length}x` }] : []),
      ],
      fileName: "Laporan_Mutasi_Stok_PT_Doa_Suryo_Agong.pdf",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/produksi/bahan-baku"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="h-3 w-3" /> Kembali ke Master
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Manajemen & Mutasi Stok</h1>
          <p className="text-sm text-slate-300">
            Catat barang masuk, keluar, dan lihat riwayat log mutasi stok bahan baku.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPDF}
            disabled={loading || mutasiList.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF
          </button>
          <button onClick={openAddModal} className={CRUD_PRIMARY_BUTTON_CLASS}>
            <Plus className="h-4 w-4" />
            Catat Mutasi Stok
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <label htmlFor="filter-bahan" className="text-xs font-semibold text-slate-300 shrink-0">Filter Bahan:</label>
          <select
            id="filter-bahan"
            value={selectedBahanFilter}
            onChange={(e) => {
              setSelectedBahanFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none transition focus:border-slate-500"
          >
            <option value="">Semua Bahan Baku</option>
            {bahanBakuList.map((item) => (
              <option key={item.id} value={item.id}>
                [{item.kode_bahan}] {item.nama_bahan}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Tab Filter Tipe */}
      <section className="flex flex-wrap gap-1.5">
        {[
          { label: "Semua", value: "" },
          { label: "Masuk", value: "masuk" },
          { label: "Keluar", value: "keluar" },
          { label: "Produksi", value: "produksi" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setTipeFilter(tab.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              tipeFilter === tab.value
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/20 p-4 text-sm text-red-400">
          Error: {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="w-44 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Tanggal</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Kode Bahan</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Bahan</th>
                <th className="w-24 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Tipe</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Jumlah</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Keterangan</th>
                <th className="w-40 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={7}>
                    Memuat data...
                  </td>
                </tr>
              ) : mutasiList.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={7}>
                    Belum ada riwayat mutasi stok.
                  </td>
                </tr>
              ) : (
                mutasiList.map((item) => {
                  const labelClass =
                    item.tipe === "masuk"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : item.tipe === "keluar"
                      ? "bg-rose-50 text-rose-700 border-rose-100"
                      : "bg-blue-50 text-blue-700 border-blue-100";
                  
                  const Icon =
                    item.tipe === "masuk"
                      ? ArrowUpRight
                      : item.tipe === "keluar"
                      ? ArrowDownLeft
                      : ArrowDownLeft;

                  const sign = item.tipe === "masuk" ? "+" : "-";

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {item.created_at ? formatDate(item.created_at) : "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm font-mono font-semibold text-slate-800">
                        {item.m_bahan_baku?.kode_bahan ?? "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 font-semibold">
                        {item.m_bahan_baku?.nama_bahan ?? "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3">
                        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold uppercase border ${labelClass}`}>
                          <Icon className="h-3 w-3" />
                          {item.tipe}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800">
                        {sign} {item.jumlah} {item.m_bahan_baku?.satuan}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600 wrap-break-word">
                        {item.keterangan || "-"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {item.operator}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pagination */}
      {meta.total > meta.limit && (
        <section className="flex justify-end gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Sebelumnya
          </button>
          <button
            disabled={page * meta.limit >= meta.total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Berikutnya
          </button>
        </section>
      )}

      {/* Input Mutasi Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Mutasi Stok"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="select-bahan-mutasi" className="text-sm font-semibold text-slate-700">Pilih Bahan Baku *</label>
            <select
              id="select-bahan-mutasi"
              required
              value={formData.bahan_baku_id}
              onChange={(e) => setFormData((p) => ({ ...p, bahan_baku_id: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="" disabled>Pilih bahan baku...</option>
              {bahanBakuList.map((item) => (
                <option key={item.id} value={item.id}>
                  [{item.kode_bahan}] {item.nama_bahan} - Stok: {item.stok} {item.satuan}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tipe-mutasi" className="text-sm font-semibold text-slate-700">Tipe Mutasi *</label>
            <select
              id="tipe-mutasi"
              value={formData.tipe}
              onChange={(e) => setFormData((p) => ({ ...p, tipe: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="masuk">Barang Masuk (+)</option>
              <option value="keluar">Barang Keluar (-)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="jumlah-mutasi" className="text-sm font-semibold text-slate-700">Jumlah *</label>
            <input
              id="jumlah-mutasi"
              required
              type="number"
              step="any"
              min={0.0001}
              placeholder="0.00"
              value={formData.jumlah}
              onChange={(e) => setFormData((p) => ({ ...p, jumlah: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="keterangan-mutasi" className="text-sm font-semibold text-slate-700">Keterangan / Referensi *</label>
            <input
              id="keterangan-mutasi"
              required
              placeholder="Contoh: Penerimaan Supplier, Penyesuaian Audit, dll"
              value={formData.keterangan}
              onChange={(e) => setFormData((p) => ({ ...p, keterangan: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="operator-mutasi" className="text-sm font-semibold text-slate-700">Operator / Penanggung Jawab *</label>
            <input
              id="operator-mutasi"
              required
              value={formData.operator}
              onChange={(e) => setFormData((p) => ({ ...p, operator: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className={CRUD_CANCEL_BUTTON_CLASS}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={CRUD_PRIMARY_BUTTON_CLASS}
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Mutasi"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
