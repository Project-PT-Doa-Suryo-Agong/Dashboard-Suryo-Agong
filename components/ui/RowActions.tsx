"use client";

import { Edit, Trash2, Eye } from "lucide-react";

// ─── Shared base className ─────────────────────────────────────────────────
const BASE =
  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed";

// ─── EditButton ───────────────────────────────────────────────────────────
type EditButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

export function EditButton({ onClick, disabled = false, label = "Edit" }: EditButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`${BASE} border-amber-500 bg-amber-500 text-white hover:bg-amber-400 hover:border-amber-400`}
    >
      <Edit size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── DetailButton ─────────────────────────────────────────────────────────
type DetailButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

export function DetailButton({ onClick, disabled = false, label = "Detail" }: DetailButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`${BASE} border-blue-400 bg-blue-500 text-white hover:bg-blue-400 hover:border-blue-500`}
    >
      <Eye size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── DeleteButton ─────────────────────────────────────────────────────────
type DeleteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

export function DeleteButton({ onClick, disabled = false, label = "Hapus" }: DeleteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={`${BASE} border-red-600 bg-red-600 text-white hover:bg-red-500 hover:border-red-500`}
    >
      <Trash2 size={14} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── RowActions (wrapper) ─────────────────────────────────────────────────
// Convenience wrapper untuk mengelompokkan tombol aksi dalam satu baris tabel.
type RowActionsProps = {
  children: React.ReactNode;
};

export function RowActions({ children }: RowActionsProps) {
  return <div className="inline-flex items-center gap-2">{children}</div>;
}
