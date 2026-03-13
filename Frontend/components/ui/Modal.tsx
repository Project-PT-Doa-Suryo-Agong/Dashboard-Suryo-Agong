"use client";

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string | ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
        <div className={`animate-in fade-in zoom-in-95 duration-200 relative w-full ${maxWidth} rounded-xl bg-white p-6 shadow-2xl`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {typeof title === 'string' ? (
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              ) : (
                title
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
