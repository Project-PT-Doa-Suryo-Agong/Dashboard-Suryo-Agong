"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { PlusCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { apiFetch } from "@/lib/utils/api-fetch";
import {
  RowActions,
  EditButton,
  DeleteButton,
} from "@/components/ui/RowActions";
import { SearchBar } from "@/components/ui/search-bar";
import type {
  FinanceTipeKas,
  FinanceUtangPiutangTipe,
  TUtangPiutang,
  MCoa,
} from "@/types/supabase";
import type { ApiSuccess } from "@/types/api";

type TUtangPiutangWithCoa = TUtangPiutang & { coa?: MCoa | null };
type UtangPiutangListPayload = {
  utang_piutang: TUtangPiutangWithCoa[];
  meta: { total: number };
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function FinancePiutangPage() {
  const [items, setItems] = useState<TUtangPiutangWithCoa[]>([]);
  const [coas, setCoas] = useState<MCoa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editData, setEditData] = useState<TUtangPiutangWithCoa | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    klien: "",
    deskripsi: "",
    nominal: "0",
    tanggal_awal: new Date().toISOString().split("T")[0],
    jatuh_tempo: new Date().toISOString().split("T")[0],
    kas: "tidak" as FinanceTipeKas,
    tipe: "piutang" as FinanceUtangPiutangTipe,
    coa: "",
  });

  const fetchPiutang = async () => {
    setIsLoading(true);
    try {
      // Query specifically with type parameter 'piutang'
      const url = `/api/finance/utang-piutang?page=1&limit=500&tipe=piutang`;
      const [res, coaRes] = await Promise.all([
        apiFetch(url),
        apiFetch(`/api/finance/coa?page=1&limit=500`),
      ]);
      const payload = (await res.json()) as ApiSuccess<UtangPiutangListPayload>;
      const coaPayload = (await coaRes.json()) as ApiSuccess<{ coa: MCoa[] }>;

      if (payload.success) setItems(payload.data.utang_piutang ?? []);
      if (coaPayload.success) setCoas(coaPayload.data.coa ?? []);
    } catch (err) {
      alert("Gagal memuat data piutang.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchPiutang();
  }, []);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((item) => {
      const klien = item.klien ?? "";
      const deskripsi = item.deskripsi ?? "";
      const coa = item.coa ? `${item.coa.kode_akun} ${item.coa.nama_akun}` : "";
      return (
        klien.toLowerCase().includes(keyword) ||
        deskripsi.toLowerCase().includes(keyword) ||
        coa.toLowerCase().includes(keyword)
      );
    });
  }, [items, searchTerm]);

  const resetForm = () => {
    setFormData({
      klien: "",
      deskripsi: "",
      nominal: "0",
      tanggal_awal: new Date().toISOString().split("T")[0],
      jatuh_tempo: new Date().toISOString().split("T")[0],
      kas: "tidak",
      tipe: "piutang",
      coa: "",
    });
    setEditData(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: TUtangPiutangWithCoa) => {
    setEditData(item);
    setFormData({
      klien: item.klien,
      deskripsi: item.deskripsi ?? "",
      nominal: String(item.nominal),
      tanggal_awal: item.tanggal_awal,
      jatuh_tempo: item.jatuh_tempo,
      kas: item.kas,
      tipe: "piutang", // Hardcoded to 'piutang'
      coa: item.coa?.id ?? "",
    });
    setIsFormModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        tipe: "piutang", // Force 'piutang' on submission
        nominal: Number(formData.nominal),
        coa: formData.coa || null,
      };

      const url = editData
        ? `/api/finance/utang-piutang/${editData.id}`
        : "/api/finance/utang-piutang";
      const method = editData ? "PATCH" : "POST";

      const res = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const resData = await res.json();
      if (!resData.success)
        throw new Error(resData.message || "Gagal menyimpan");

      await fetchPiutang();
      setIsFormModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/finance/utang-piutang/${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await fetchPiutang();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
      setDeleteId(null);
    }
  };

  const filteredCoas = useMemo(() => {
    const parent = coas.find((c) => c.kode_akun === "1102");
    return coas.filter((c) => 
      c.kode_akun.startsWith("1102.") || 
      (parent && c.parent_id === parent.id)
    );
  }, [coas]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto w-full">
      <section className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Catatan Piutang</h1>
          <p className="text-slate-300">
            Kelola catatan hak piutang atau tagihan klien perusahaan.
          </p>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row justify-between gap-3 items-center">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Cari klien, deskripsi, atau COA..."
          className="w-full sm:max-w-md"
        />
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 rounded-xl bg-green-500 px-4 py-2 text-white font-semibold hover:bg-green-600 transition"
        >
          <PlusCircle className="h-5 w-5" /> Catat Piutang Baru
        </button>
      </section>

      <section className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Tipe</th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  Pihak/Klien
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  Tanggal Awal
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  Jatuh Tempo
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                  Nominal
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  Lunas (Kas)
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600">
                  COA/Akun
                </th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-500">
                    Memuat...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-500">
                    Belum ada catatan piutang
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full font-semibold bg-green-500 text-white">
                        PIUTANG
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {item.klien}
                      {item.deskripsi && (
                        <div className="text-xs text-slate-500 font-normal">
                          {item.deskripsi}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(item.tanggal_awal)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(item.jatuh_tempo)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">
                      {formatRupiah(item.nominal)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${item.kas === "ya" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
                      >
                        {item.kas === "ya" ? "YA" : "TIDAK"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.coa ? (
                        <span className="text-md">{item.coa.nama_akun}</span>
                      ) : (
                        <span className="text-md">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <RowActions>
                        <EditButton onClick={() => openEditModal(item)} />
                        <DeleteButton onClick={() => setDeleteId(item.id)} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editData ? "Edit Catatan Piutang" : "Catat Piutang Baru"}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pihak/Klien
              </label>
              <input
                required
                placeholder="Nama pihak penerima tagihan"
                value={formData.klien}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, klien: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nominal
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.nominal}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, nominal: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tanggal Awal
              </label>
              <input
                type="date"
                required
                value={formData.tanggal_awal}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, tanggal_awal: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Jatuh Tempo
              </label>
              <input
                type="date"
                required
                value={formData.jatuh_tempo}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, jatuh_tempo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sudah Lunas? (Kas)
              </label>
              <select
                value={formData.kas}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, kas: e.target.value as any }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              >
                <option value="tidak">Belum (Tidak)</option>
                <option value="ya">Sudah (Ya)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Akun (COA)
              </label>
              <select
                value={formData.coa}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, coa: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              >
                <option value="">-- Pilih Akun COA --</option>
                {filteredCoas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.kode_akun} - {c.nama_akun}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Deskripsi
              </label>
              <input
                placeholder="Keterangan tambahan piutang..."
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, deskripsi: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-300/20"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Catatan Piutang"
        description="Yakin hapus catatan piutang ini?"
        variant="danger"
      />
    </div>
  );
}
