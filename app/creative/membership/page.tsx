"use client";

import { useMemo, useState } from "react";
import { Crown, PlusCircle, Save } from "lucide-react";
import type { TMembership } from "@/types/supabase";
import {
  useMembership,
  useInsertMembership,
  useUpdateMembership,
  useDeleteMembership,
} from "@/lib/supabase/hooks/index";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { RowActions, EditButton, DeleteButton } from "@/components/ui/RowActions";
import { SearchBar } from "@/components/ui/search-bar";

export default function MembershipPage() {
  const [nama, setNama] = useState("");
  const [telepon, setTelepon] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Delete confirm state ──
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState("");

  // ── Supabase Direct ──
  const { data: membershipList, loading: isLoading, error: readError, refresh } = useMembership();
  const { insert } = useInsertMembership();
  const { update } = useUpdateMembership();
  const { remove } = useDeleteMembership();

  const resetForm = () => {
    setNama("");
    setTelepon("");
    setLokasi("");
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        const result = await update(editingId, { nama, telepon, lokasi });
        if (!result) throw new Error("Gagal update data member.");
      } else {
        const result = await insert({ nama, telepon, lokasi });
        if (!result) throw new Error("Gagal menambahkan member baru.");
      }

      refresh();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Operasi simpan gagal.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (member: TMembership) => {
    setEditingId(member.id);
    setNama(member.nama ?? "");
    setTelepon(member.telepon ?? "");
    setLokasi(member.lokasi ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openDeleteDialog = (member: TMembership) => {
    setDeleteTargetId(member.id);
    setDeleteTargetName(member.nama ?? "member ini");
  };

  const closeDeleteDialog = () => {
    setDeleteTargetId(null);
    setDeleteTargetName("");
  };

  const handleDelete = async () => {
    if (!deleteTargetId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await remove(deleteTargetId);
      if (!success) throw new Error("Gagal menghapus member.");
      refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus member.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteDialog();
    }
  };

  const filtered = useMemo(
    () =>
      membershipList.filter(
        (m) =>
          (m.nama ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.telepon ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.lokasi ?? "").toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, membershipList],
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
            <Crown size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Membership</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola pelanggan tetap yang terdaftar sebagai member.</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {editingId ? 'Edit Member' : 'Tambah Member Baru'}
          </h3>
          {editingId && (
            <span
              className="ml-auto text-xs text-slate-400 cursor-pointer hover:text-red-500 transition-colors"
              onClick={resetForm}
            >
              Batal Edit
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nama Pelanggan <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              placeholder="contoh: Budi Santoso"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-amber-200/50 focus:border-amber-400 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Nomor Telepon
            </label>
            <input
              type="text"
              value={telepon}
              onChange={(e) => setTelepon(e.target.value)}
              placeholder="contoh: 0812-3456-7890"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-amber-200/50 focus:border-amber-400 text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
              Lokasi / Alamat
            </label>
            <input
              type="text"
              value={lokasi}
              onChange={(e) => setLokasi(e.target.value)}
              placeholder="contoh: Surabaya, Jawa Timur"
              className="w-full px-4 py-3 bg-slate-200 border border-slate-200 text-slate-700 rounded-xl focus:ring-2 focus:ring-amber-200/50 focus:border-amber-400 text-sm outline-none transition-all"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-green-200 transition-all"
            >
              <Save size={17} />
              {isSubmitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Member"}
            </button>
          </div>
        </form>
      </section>

      {/* Table Card */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {readError ? (
          <p className="px-5 pt-5 text-sm text-rose-600">Gagal memuat data membership: {readError}</p>
        ) : null}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Member</h3>
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold border border-amber-200">
              {filtered.length}
            </span>
          </div>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Cari nama, telepon, atau lokasi..."
            className="relative w-full sm:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">No</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Telepon</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Lokasi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-400">
                    Tidak ada member yang ditemukan.
                  </td>
                </tr>
              ) : (
                filtered.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[10px] font-bold">
                          {(m.nama ?? "?")[0]?.toUpperCase()}
                        </span>
                        {m.nama ?? "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.telepon ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{m.lokasi ?? "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <RowActions>
                        <EditButton onClick={() => handleEdit(m)} disabled={isSubmitting} />
                        <DeleteButton onClick={() => openDeleteDialog(m)} disabled={isSubmitting} />
                      </RowActions>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Menampilkan {filtered.length} dari {membershipList.length} member
          </p>
        </div>
      </section>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onClose={closeDeleteDialog}
        onConfirm={handleDelete}
        title="Hapus Member"
        description={`Apakah kamu yakin ingin menghapus member "${deleteTargetName}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText={isSubmitting ? "Menghapus..." : "Ya, Hapus"}
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
