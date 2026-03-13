"use client";

import Link from 'next/link';
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';

type TransactionType = 'In' | 'Out';

type TransactionItem = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
};

const METRICS = {
  totalBalance: 1250000000,
  monthlyIncome: 325000000,
  monthlyExpense: 189500000,
};

const RECENT_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'TRX-240301',
    date: '13 Mar 2026',
    description: 'Pelunasan invoice client A',
    type: 'In',
    amount: 78500000,
  },
  {
    id: 'TRX-240298',
    date: '12 Mar 2026',
    description: 'Pembayaran vendor bahan baku',
    type: 'Out',
    amount: 45250000,
  },
  {
    id: 'TRX-240287',
    date: '10 Mar 2026',
    description: 'Pembayaran termin proyek B',
    type: 'In',
    amount: 120000000,
  },
  {
    id: 'TRX-240281',
    date: '09 Mar 2026',
    description: 'Biaya operasional kantor',
    type: 'Out',
    amount: 18750000,
  },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FinanceDashboardPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Finance Command Center</h1>
        <p className="text-sm md:text-base text-slate-300">
          Monitor arus kas, persetujuan dana, dan ringkasan finansial perusahaan.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Total Saldo Perusahaan</p>
              <p className="text-base md:text-2xl font-bold text-slate-900 wrap-break-word">{formatRupiah(METRICS.totalBalance)}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#BC934B]/15 text-[#1E3A8A]">
              <Wallet className="h-4 w-4 md:h-5 md:w-5" />
            </span>
          </div>
        </article>

        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Pemasukan Bulan Ini</p>
              <p className="text-base md:text-2xl font-bold text-emerald-600 wrap-break-word">{formatRupiah(METRICS.monthlyIncome)}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5" />
            </span>
          </div>
        </article>

        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Pengeluaran Bulan Ini</p>
              <p className="text-base md:text-2xl font-bold text-red-600 wrap-break-word">{formatRupiah(METRICS.monthlyExpense)}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Link
          href="/finance/reimburse"
          className="group bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 hover:border-[#BC934B]/60 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
                3 Pending
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 wrap-break-word">Approval Pengajuan Dana</h2>
              <p className="text-sm text-slate-500 wrap-break-word">Tinjau dan proses pengajuan dana yang menunggu persetujuan.</p>
            </div>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>

        <Link
          href="/finance/cashflow"
          className="group bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 hover:border-[#1E3A8A]/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                Live Summary
              </div>
              <h2 className="text-base md:text-lg font-bold text-slate-900 wrap-break-word">Laporan Arus Kas</h2>
              <p className="text-sm text-slate-500 wrap-break-word">Pantau arus kas masuk dan keluar secara terstruktur per periode.</p>
            </div>
            <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-1 transition-all shrink-0" />
          </div>
        </Link>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm md:text-base font-bold text-slate-900">Recent Transactions</h3>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Ringkasan transaksi arus kas terbaru.</p>
        </div>

        <div className="overflow-x-auto w-full -mx-4 px-4 md:mx-0 md:px-0">
          <table className="w-full min-w-max text-left">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">ID Transaksi</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Keterangan</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipe</th>
                <th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RECENT_TRANSACTIONS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 md:px-6 py-3 text-sm font-mono text-slate-600">{item.id}</td>
                  <td className="px-4 md:px-6 py-3 text-sm text-slate-600">{item.date}</td>
                  <td className="px-4 md:px-6 py-3 text-sm text-slate-800">{item.description}</td>
                  <td className="px-4 md:px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.type === 'In' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 md:px-6 py-3 text-sm font-semibold text-right ${
                      item.type === 'In' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {item.type === 'In' ? '+ ' : '- '}
                    {formatRupiah(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}