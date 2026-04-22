"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchBar({
  placeholder = "Cari...",
  value,
  onChange,
  className = "w-full sm:w-64",
}: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-slate-700 bg-slate-100 outline-none transition-all"
      />
    </div>
  );
}
