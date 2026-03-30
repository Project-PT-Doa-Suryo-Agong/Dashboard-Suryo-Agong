"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit, PlusCircle, Save, Trash2, Users } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MAfiliator } from "@/types/supabase";

type AffiliatorListPayload = {
  afiliator: MAfiliator[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type AffiliatorPayload = {
  afiliator: MAfiliator | null;
};

type FormState = {
  nama: string;
  platform: string;
};

const initialFormState: FormState = {
  nama: "",
  platform: "",
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function AffiliatesPage() {
  const [items, setItems] = useState<MAfiliator[]>([]);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<MAfiliator | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAffiliators = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sales/affiliates?page=1&limit=500", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<AffiliatorListPayload>(response);
      setItems(payload.data.afiliator ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal memuat data affiliator.";
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchAffiliators();
  }, []);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditData(null);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/sales/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          platform: formData.platform.trim() || null,
        }),
      });
      await parseJsonResponse<AffiliatorPayload>(response);
      await fetchAffiliators();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menambah affiliator.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: MAfiliator) => {
    setEditData(item);
    setFormData({
      nama: item.nama,
      platform: item.platform ?? "",
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editData || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sales/affiliates/${editData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: formData.nama.trim(),
          platform: formData.platform.trim() || null,
        }),
      });
      await parseJsonResponse<AffiliatorPayload>(response);
      await fetchAffiliators();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal update affiliator.";
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
      const response = await fetch(`/api/sales/affiliates/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      await fetchAffiliators();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghapus affiliator.";
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-slate-500 w-6 h-6" />
          <h2 className="text-xl font-bold text-slate-800">Master Affiliator</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Affiliator</label>
            <input
              required
              type="text"
              value={formData.nama}
              onChange={(event) => setFormData((prev) => ({ ...prev, nama: event.target.value }))}
              className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Nama"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform</label>
            <input
              type="text"
              value={formData.platform}
              onChange={(event) => setFormData((prev) => ({ ...prev, platform: event.target.value }))}
              className="w-full bg-slate-200 border text-slate-700 border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="TikTok / Instagram"
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 uppercase tracking-wide text-sm"
          >
            <PlusCircle className="w-5 h-5" />
            {isSubmitting ? "Menyimpan..." : "Tambah Affiliator"}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-slate-800 font-bold">Daftar Affiliator</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nama</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Created At</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                    Belum ada affiliator.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-slate-700">{item.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.nama}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.platform ?? "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                          aria-label="Edit affiliator"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label="Hapus affiliator"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isEditModalOpen && editData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          title="Edit Affiliator"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Nama Affiliator</label>
              <input
                required
                type="text"
                value={formData.nama}
                onChange={(event) => setFormData((prev) => ({ ...prev, nama: event.target.value }))}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform</label>
              <input
                type="text"
                value={formData.platform}
                onChange={(event) => setFormData((prev) => ({ ...prev, platform: event.target.value }))}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2">
                  <Save size={14} />
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Affiliator"
        description="Apakah Anda yakin ingin menghapus affiliator ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
