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
    label: 'Produk Induk',
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
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

      {/* Header */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <Link href="/developer" className="hover:text-slate-600 transition-colors">Developer</Link>
          <ChevronRight size={13} className="text-slate-300" />
          <span className="text-slate-700 font-medium">Master Data</span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#BC934B]/10 flex items-center justify-center">
            <Database size={18} className="text-[#BC934B]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Master Data Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">Kelola data referensi inti yang digunakan di seluruh sistem.</p>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MASTER_DATA_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="group bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center`}>
                <Icon size={24} className={card.color} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">{card.label}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">
                  Total: <span className="text-slate-700">{card.count}</span> entri
                </span>
                <ArrowRight
                  size={16}
                  className="text-slate-300 group-hover:text-[#BC934B] group-hover:translate-x-1 transition-all"
                />
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
