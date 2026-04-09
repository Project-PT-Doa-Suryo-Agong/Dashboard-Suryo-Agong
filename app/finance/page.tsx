"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { CashflowLineChart, type CashflowPoint } from '@/components/ui/DashboardCharts';
import { apiFetch } from '@/lib/utils/api-fetch';
import type { ApiError, ApiSuccess } from '@/types/api';
import type { TCashflow, TReimbursement } from '@/types/supabase';

type TransactionType = 'In' | 'Out';

type TransactionItem = {
  id: string;
  date: string;
  description: string;
  type: TransactionType;
  amount: number;
};

type CashflowListPayload = {
  cashflow: TCashflow[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type ReimburseListPayload = {
  reimburse: TReimbursement[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Terjadi kesalahan.' : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function FinanceDashboardPage() {
  const [cashflowItems, setCashflowItems] = useState<TCashflow[]>([]);
  const [reimburseItems, setReimburseItems] = useState<TReimbursement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [cashflowResponse, reimburseResponse] = await Promise.all([
          apiFetch('/api/finance/cashflow?page=1&limit=500', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          }),
          apiFetch('/api/finance/reimburse?page=1&limit=200', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          }),
        ]);

        const cashflowPayload = await parseJsonResponse<CashflowListPayload>(cashflowResponse);
        const reimbursePayload = await parseJsonResponse<ReimburseListPayload>(reimburseResponse);

        setCashflowItems(cashflowPayload.data.cashflow ?? []);
        setReimburseItems(reimbursePayload.data.reimburse ?? []);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Gagal memuat data dashboard finance.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalBalance = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    for (const item of cashflowItems) {
      const amount = item.amount ?? 0;
      const isIncome = item.tipe === 'income';

      totalBalance += isIncome ? amount : -amount;

      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        if (isIncome) monthlyIncome += amount;
        else monthlyExpense += amount;
      }
    }

    return { totalBalance, monthlyIncome, monthlyExpense };
  }, [cashflowItems]);

  const cashflowPreviewData = useMemo<CashflowPoint[]>(() => {
    const now = new Date();
    const buckets = new Map<string, { label: string; pemasukan: number; pengeluaran: number }>();

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const labelRaw = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(date);
      const label = labelRaw.replace('.', '').replace(/^./, (s) => s.toUpperCase());
      buckets.set(key, { label, pemasukan: 0, pengeluaran: 0 });
    }

    for (const item of cashflowItems) {
      if (!item.created_at) continue;
      const date = new Date(item.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const bucket = buckets.get(key);
      if (!bucket) continue;

      const amount = item.amount ?? 0;
      if (item.tipe === 'income') bucket.pemasukan += amount;
      if (item.tipe === 'expense') bucket.pengeluaran += amount;
    }

    return Array.from(buckets.values()).map((item) => ({
      bulan: item.label,
      pemasukan: item.pemasukan,
      pengeluaran: item.pengeluaran,
    }));
  }, [cashflowItems]);

  const recentTransactions = useMemo<TransactionItem[]>(() => {
    return [...cashflowItems]
      .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        date: item.created_at
          ? new Intl.DateTimeFormat('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            }).format(new Date(item.created_at))
          : '-',
        description: item.keterangan?.trim() || 'Transaksi cashflow',
        type: item.tipe === 'income' ? 'In' : 'Out',
        amount: item.amount ?? 0,
      }));
  }, [cashflowItems]);

  const pendingReimburseCount = useMemo(
    () => reimburseItems.filter((item) => item.status === 'pending').length,
    [reimburseItems],
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Finance Command Center</h1>
        <p className="text-sm md:text-base text-slate-300">
          Monitor arus kas, persetujuan dana, dan ringkasan finansial perusahaan.
        </p>
      </section>

      {loadError && (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2 min-w-0">
              <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 truncate">Total Saldo Perusahaan</p>
              <p className="text-base md:text-2xl font-bold text-slate-900 wrap-break-word">{formatRupiah(metrics.totalBalance)}</p>
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
              <p className="text-base md:text-2xl font-bold text-emerald-600 wrap-break-word">{formatRupiah(metrics.monthlyIncome)}</p>
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
              <p className="text-base md:text-2xl font-bold text-red-600 wrap-break-word">{formatRupiah(metrics.monthlyExpense)}</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
        <div className="mb-3 md:mb-4">
          <h2 className="text-sm md:text-base font-bold text-slate-900">Tren Cashflow</h2>
          <p className="text-xs md:text-sm text-slate-500 mt-1">Preview interaktif pemasukan vs pengeluaran 6 bulan terakhir.</p>
        </div>
        <CashflowLineChart data={cashflowPreviewData} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <Link
          href="/finance/reimburse"
          className="group bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6 hover:border-[#BC934B]/60 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-3 min-w-0">
              <div className="inline-flex items-center rounded-full border border-orange-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-orange-400">
                {isLoading ? 'Loading...' : `${pendingReimburseCount} Pending`}
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
              {recentTransactions.map((item) => (
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
              {!isLoading && recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 md:px-6 py-6 text-sm text-slate-500">
                    Belum ada data transaksi cashflow.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}