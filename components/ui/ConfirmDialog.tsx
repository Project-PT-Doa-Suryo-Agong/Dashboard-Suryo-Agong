"use client";

import Modal from './Modal';
import { TriangleAlert } from 'lucide-react';

type ConfirmDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Ya, Hapus',
  cancelText = 'Batal',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmClassName =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-green-500 text-white hover:bg-green-600';

  const iconClassName =
    variant === 'danger'
      ? 'bg-red-100 text-red-600'
      : 'bg-amber-100 text-[#BC934B]';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-sm"
      title={<h3 className="text-lg font-bold text-slate-900">{title}</h3>}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full ${iconClassName}`}>
          <TriangleAlert size={24} />
        </div>
        <p className="text-sm leading-relaxed text-slate-500">{description}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${confirmClassName}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
