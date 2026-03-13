"use client";

import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  List,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';

type Platform = 'TikTok' | 'Instagram' | 'YouTube Shorts' | 'LinkedIn' | 'Twitter / X';

type ContentItem = {
  id: string;
  title: string;
  platform: Platform;
  createdAt: string;
};

const PLATFORM_OPTIONS: Platform[] = ['TikTok', 'Instagram', 'YouTube Shorts', 'LinkedIn', 'Twitter / X'];

const INITIAL_CONTENT: ContentItem[] = [
  {
    id: '#CT-8892',
    title: 'Summer Beach Collection Reel',
    platform: 'Instagram',
    createdAt: '2026-10-24T09:00:00Z',
  },
  {
    id: '#CT-8893',
    title: 'Product Launch BTS',
    platform: 'TikTok',
    createdAt: '2026-10-25T13:30:00Z',
  },
];

const PLATFORM_BADGE: Record<Platform, string> = {
  TikTok: 'bg-slate-100 text-slate-700 before:bg-slate-900',
  Instagram: 'bg-pink-50 text-pink-700 before:bg-pink-500',
  'YouTube Shorts': 'bg-red-50 text-red-700 before:bg-red-500',
  LinkedIn: 'bg-sky-50 text-sky-700 before:bg-sky-500',
  'Twitter / X': 'bg-zinc-100 text-zinc-700 before:bg-zinc-900',
};

type ContentFormProps = {
  title: string;
  platform: string;
  onTitleChange: (value: string) => void;
  onPlatformChange: (value: Platform) => void;
  submitLabel: string;
  submitIcon?: React.ReactNode;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};

function ContentForm({
  title,
  platform,
  onTitleChange,
  onPlatformChange,
  submitLabel,
  submitIcon,
  onSubmit,
  onCancel,
}: ContentFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Content Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
            placeholder="e.g., Summer Promo Video"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
            Platform
          </label>
          <div className="relative">
            <select
              value={platform}
              onChange={(event) => onPlatformChange(event.target.value as Platform)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
              required
            >
              <option value="" disabled>
                Select Platform
              </option>
              {PLATFORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Batal
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 shadow-green-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-600"
        >
          {submitIcon}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function ContentPlannerPage() {
  const [contents, setContents] = useState<ContentItem[]>(INITIAL_CONTENT);
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<Platform | ''>('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editData, setEditData] = useState<ContentItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const totalEntriesLabel = useMemo(() => `${contents.length} entries`, [contents.length]);

  const resetCreateForm = () => {
    setTitle('');
    setPlatform('');
  };

  const handleSaveContent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !platform) return;

    const newContent: ContentItem = {
      id: `#CT-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title.trim(),
      platform,
      createdAt: new Date().toISOString(),
    };

    setContents((prev) => [newContent, ...prev]);
    resetCreateForm();
  };

  const handleOpenEdit = (item: ContentItem) => {
    setEditData(item);
    setIsEditModalOpen(true);
  };

  const handleEditChange = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => {
    setEditData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSaveEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editData || !editData.title.trim()) return;

    setContents((prev) => prev.map((item) => (item.id === editData.id ? { ...editData, title: editData.title.trim() } : item)));
    setIsEditModalOpen(false);
    setEditData(null);
  };

  const handleOpenDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    setContents((prev) => prev.filter((item) => item.id !== deleteId));
    setIsDeleteModalOpen(false);
    setDeleteId(null);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:space-y-6 md:p-6 lg:space-y-8 lg:p-8">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-slate-100 md:text-2xl lg:text-3xl">Content Planner</h2>
          <p className="text-sm text-slate-300 md:text-base">Kelola daftar konten sales dengan edit dan delete flow yang lebih aman.</p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex items-center gap-2">
          <PlusCircle size={18} className="text-slate-800" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Quick Add Content</h3>
        </div>

        <ContentForm
          title={title}
          platform={platform}
          onTitleChange={setTitle}
          onPlatformChange={setPlatform}
          submitLabel="Save Content"
          submitIcon={<Save size={16} />}
          onSubmit={handleSaveContent}
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between md:p-6">
          <div className="flex items-center gap-2">
            <List size={18} className="text-slate-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Content Log</h3>
          </div>
          <button className="text-left text-xs font-semibold text-slate-500 underline transition-colors hover:text-slate-700 sm:text-right">
            View All Schedule
          </button>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="min-w-205 w-full text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:px-6">Content ID</th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:px-6">Title</th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:px-6">Platform</th>
                <th className="px-4 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 md:px-6">Date Added</th>
                <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 md:px-6">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contents.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="px-4 py-4 font-mono text-sm text-slate-500 md:px-6">{item.id}</td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-800 md:px-6">{item.title}</td>
                  <td className="px-4 py-4 md:px-6">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold before:h-1.5 before:w-1.5 before:rounded-full ${PLATFORM_BADGE[item.platform]}`}>
                      {item.platform}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500 md:px-6">
                    {new Intl.DateTimeFormat('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    }).format(new Date(item.createdAt))}
                  </td>
                  <td className="px-4 py-4 md:px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-[#BC934B] transition-all hover:-translate-y-0.5 hover:bg-amber-100"
                        title="Edit Content"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDelete(item.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-100"
                        title="Delete Content"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p className="text-xs text-slate-500">Showing {contents.length} of {totalEntriesLabel}</p>
          <div className="flex gap-2">
            <button className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Previous
            </button>
            <button className="rounded border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </section>

      {isEditModalOpen && editData && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditData(null);
          }}
          maxWidth="max-w-md"
          title={
            <div>
              <h3 className="text-lg font-bold text-slate-900">Edit Content</h3>
              <p className="mt-1 text-sm text-slate-500">Perbarui judul dan platform untuk konten yang dipilih.</p>
            </div>
          }
        >
          <ContentForm
            title={editData.title}
            platform={editData.platform}
            onTitleChange={(value) => handleEditChange('title', value)}
            onPlatformChange={(value) => handleEditChange('platform', value)}
            submitLabel="Simpan Perubahan"
            submitIcon={<Save size={16} />}
            onSubmit={handleSaveEdit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditData(null);
            }}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteId(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Hapus Konten"
        description="Apakah Anda yakin ingin menghapus konten ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}