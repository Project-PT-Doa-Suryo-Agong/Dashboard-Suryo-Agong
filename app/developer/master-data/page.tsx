'use client';

import Link from 'next/link';
import { Truck, Package, Tags, ArrowRight, ChevronRight, Database } from 'lucide-react';

const MASTER_DATA_CARDS = [
  {
    label: 'Vendor',
    href: '/developer/master-data/vendor',
    icon: Truck,
    description: 'Kelola daftar vendor & supplier yang digunakan dalam rantai produksi.',
    count: 24,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    label: 'Produk',
    href: '/developer/master-data/produk',
    icon: Package,
    description: 'Manajemen produk utama beserta kategorinya sebelum dibentuk varian.',
    count: 38,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Varian Produk',
    href: '/developer/master-data/varian',
    icon: Tags,
    description: 'Atur SKU, nama varian, dan harga jual untuk setiap variasi produk.',
    count: 112,
    color: 'text-[#BC934B]',
    bg: 'bg-yellow-50',
  },
];

export default function MasterDataPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-3 md:space-y-4 md:p-4 lg:space-y-8 lg:p-8">

      {/* Header */}
      <div className="space-y-2 md:space-y-3">
        <nav className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-400 md:mb-3 md:text-sm lg:text-base">
          <Link href="/developer" className="text-slate-200 transition-colors hover:text-slate-300">Developer</Link>
          <ChevronRight className="h-3 w-3 flex-shrink-0 text-slate-300 md:h-4 md:w-4" />
          <span className="font-medium text-slate-50">Master Data</span>
        </nav>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl md:h-10 md:w-10 lg:h-12 lg:w-12">
            <Database className="h-4 w-4 text-slate-50 md:h-5 md:w-5 lg:h-6 lg:w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-slate-100 md:text-2xl lg:text-3xl">Master Data Management</h2>
            <p className="mt-0.5 text-xs text-slate-300 md:text-sm lg:text-base">Kelola data referensi inti yang digunakan di seluruh sistem.</p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {MASTER_DATA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group flex cursor-pointer flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md md:gap-4 md:p-4 lg:p-6"
            >
              <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${card.bg} md:h-12 md:w-12`}>
                <Icon className={`h-5 w-5 md:h-6 md:w-6 ${card.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-800 md:text-base lg:text-lg">{card.label}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 md:text-sm lg:text-base">{card.description}</p>
              </div>
              <div className="flex flex-col items-start justify-between gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center md:gap-3">
                <span className="text-xs font-semibold text-slate-400 md:text-sm lg:text-base">
                  Total: <span className="text-slate-700">{card.count}</span> entri
                </span>
                <ArrowRight
                  className="h-4 w-4 flex-shrink-0 text-slate-300 transition-all group-hover:translate-x-1 group-hover:text-[#BC934B] md:h-5 md:w-5"
                />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
