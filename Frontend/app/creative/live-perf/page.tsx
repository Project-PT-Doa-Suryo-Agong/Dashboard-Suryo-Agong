"use client";

import { FormEvent, useEffect, useState } from 'react';
import { Edit, PlusCircle, Save, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import type { ApiError, ApiSuccess } from '@/types/api';
import type { TLivePerformance } from '@/types/supabase';

type LiveListPayload = {
  live: TLivePerformance[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type LivePayload = {
  live: TLivePerformance | null;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Terjadi kesalahan.' : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatRupiah(value: number | null): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function LivePerformancePage() {
  const [items, setItems] = useState<TLivePerformance[]>([]);
  const [platform, setPlatform] = useState('');
  const [revenue, setRevenue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<TLivePerformance | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchLivePerformance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sales/live?page=1&limit=500', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      const payload = await parseJsonResponse<LiveListPayload>(response);
      setItems(payload.data.live ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data live performance.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLivePerformance();
  }, []);

  const resetForm = () => {
    setPlatform('');
    setRevenue('');
    setEditData(null);
  };

  const handleSaveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const parsedRevenue = Number(revenue);
    if (Number.isNaN(parsedRevenue) || parsedRevenue < 0) {
      alert('Revenue harus angka valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/sales/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.trim(),
          revenue: parsedRevenue,
        }),
      });
      await parseJsonResponse<LivePayload>(response);
      await fetchLivePerformance();
      resetForm();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menyimpan live performance.';
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: TLivePerformance) => {
    setEditData(item);
    setPlatform(item.platform);
    setRevenue(String(item.revenue ?? 0));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    resetForm();
  };

  const handleUpdateRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editData || isSubmitting) return;

    const parsedRevenue = Number(revenue);
    if (Number.isNaN(parsedRevenue) || parsedRevenue < 0) {
      alert('Revenue harus angka valid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/sales/live/${editData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.trim(),
          revenue: parsedRevenue,
        }),
      });
      await parseJsonResponse<LivePayload>(response);
      await fetchLivePerformance();
      closeEditModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal update live performance.';
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
      const response = await fetch(`/api/sales/live/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      await parseJsonResponse<null>(response);
      await fetchLivePerformance();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal menghapus live performance.';
      alert(message);
    } finally {
      setIsSubmitting(false);
      closeDeleteModal();
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-4 mb-2">
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Live Performance Analytics</h2>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <PlusCircle className="text-slate-500 w-6 h-6" />
          <h3 className="text-slate-800 font-bold">Log Live Session</h3>
        </div>
        
        <form onSubmit={handleSaveRecord} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Streaming Platform</label>
            <select
              required
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-slate-200 text-slate-500  border border-slate-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-all"
            >
              <option value="" disabled>Select Platform</option>
              <option value="Twitch">Twitch</option>
              <option value="YouTube Live">YouTube Live</option>
              <option value="TikTok Live">TikTok Live</option>
              <option value="Instagram Live">Instagram Live</option>
              <option value="Shopee Live">Shopee Live</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue Generated</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
              <input 
                required
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-200 text-slate-500 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" 
                placeholder="0" 
              />
            </div>
          </div>
          
          <div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-60 border border-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-200 transition-all flex items-center gap-2 justify-center"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? 'Menyimpan...' : 'Save Record'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-slate-800 font-bold">Recent Live Sessions</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Session ID</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Platform</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Revenue</th>
                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Date Recorded</th>
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
                    Belum ada data live performance.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 font-mono">{item.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{item.platform}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900 text-right">{formatRupiah(item.revenue)}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 text-right">{formatDate(item.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50 disabled:opacity-50"
                          aria-label="Edit live performance"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(item.id)}
                          disabled={isSubmitting}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          aria-label="Hapus live performance"
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
          title="Edit Live Performance"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateRecord} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Streaming Platform</label>
              <input
                required
                type="text"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Revenue Generated</label>
              <input
                required
                type="number"
                value={revenue}
                onChange={(event) => setRevenue(event.target.value)}
                disabled={isSubmitting}
                className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-700"
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
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Hapus Live Performance"
        description="Apakah Anda yakin ingin menghapus data live performance ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

    </div>
  );
}