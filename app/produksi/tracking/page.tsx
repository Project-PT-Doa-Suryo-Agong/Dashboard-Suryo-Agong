"use client";

import { useState } from "react";
import { ArrowLeft, Search, Calendar, User, ClipboardList, Tag, Printer } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "@/components/ui/search-bar";
import { useTrackingBahanBaku } from "@/lib/supabase/hooks/use-bahan-baku";
import { exportToPDF } from "@/lib/utils/export-pdf";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function TrackingBahanBakuPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: trackingList, loading, error, meta } = useTrackingBahanBaku({
    page,
    limit: 50,
    search: searchTerm,
  });

  const handleExportPDF = () => {
    exportToPDF({
      title: "Pelacakan Penggunaan Bahan Baku",
      subtitle: searchTerm ? `Pencarian: "${searchTerm}"` : "Riwayat alokasi bahan baku per batch produksi",
      headers: ["Tanggal", "No. Produksi", "Kode Bahan", "Nama Bahan Baku", "Jumlah Terpakai", "Operator"],
      rows: trackingList.map((item) => [
        item.created_at ? formatDate(item.created_at) : "-",
        item.t_produksi_order?.produksi_number ?? "-",
        item.m_bahan_baku?.kode_bahan ?? "-",
        item.m_bahan_baku?.nama_bahan ?? "-",
        `${item.jumlah} ${item.m_bahan_baku?.satuan ?? ""}`,
        item.operator,
      ]),
      columnStyles: {
        0: { cellWidth: 32 },
        1: { cellWidth: 32 },
      },
      summary: [
        { label: "Total Penggunaan", value: `${meta.total} catatan` },
      ],
      fileName: "Pelacakan_Penggunaan_Bahan_Baku_PT_Doa_Suryo_Agong.pdf",
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
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Pelacakan Penggunaan Bahan Baku</h1>
          <p className="text-sm text-slate-300">
            Lacak riwayat lengkap alokasi bahan baku untuk setiap batch pesanan produksi.
          </p>
        </div>
        <div>
          <button
            onClick={handleExportPDF}
            disabled={loading || trackingList.length === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
          >
            <Printer className="h-4 w-4" />
            Cetak PDF
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
        <SearchBar
          placeholder="Cari operator atau keterangan..."
          value={searchTerm}
          onChange={(val) => {
            setSearchTerm(val);
            setPage(1);
          }}
          className="w-full sm:w-80"
        />
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
                <th className="w-44 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">No. Produksi</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Kode Bahan</th>
                <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Nama Bahan Baku</th>
                <th className="w-32 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Jumlah Terpakai</th>
                <th className="w-40 px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={6}>
                    Memuat data pelacakan...
                  </td>
                </tr>
              ) : trackingList.length === 0 ? (
                <tr>
                  <td className="px-4 md:px-6 py-6 text-sm text-slate-500 text-center" colSpan={6}>
                    Belum ada data penggunaan bahan baku.
                  </td>
                </tr>
              ) : (
                trackingList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {item.created_at ? formatDate(item.created_at) : "-"}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap font-semibold">
                      {item.t_produksi_order?.produksi_number ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                          <ClipboardList className="h-3 w-3" />
                          {item.t_produksi_order.produksi_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">-</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm font-mono font-semibold text-slate-800">
                      {item.m_bahan_baku?.kode_bahan ?? "-"}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-800 font-semibold wrap-break-word">
                      {item.m_bahan_baku?.nama_bahan ?? "-"}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm font-semibold text-rose-600">
                      {item.jumlah} {item.m_bahan_baku?.satuan}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">
                      {item.operator}
                    </td>
                  </tr>
                ))
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
    </div>
  );
}
