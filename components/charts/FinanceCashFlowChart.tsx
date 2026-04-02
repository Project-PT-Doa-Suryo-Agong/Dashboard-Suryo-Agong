'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface CashFlowDataPoint {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

// ─── Mock Data (6 bulan terakhir, dalam juta IDR) ─────────────────────────────

const CASH_FLOW_DATA: CashFlowDataPoint[] = [
  { bulan: 'Okt', pemasukan: 285_000_000, pengeluaran: 172_000_000 },
  { bulan: 'Nov', pemasukan: 310_000_000, pengeluaran: 198_000_000 },
  { bulan: 'Des', pemasukan: 420_000_000, pengeluaran: 245_000_000 },
  { bulan: 'Jan', pemasukan: 298_000_000, pengeluaran: 183_000_000 },
  { bulan: 'Feb', pemasukan: 335_000_000, pengeluaran: 201_000_000 },
  { bulan: 'Mar', pemasukan: 325_000_000, pengeluaran: 189_500_000 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(0)}jt`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm">
      <p className="font-bold text-slate-800 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600 capitalize">{entry.name}:</span>
          <span className="font-semibold text-slate-900">
            {formatRupiahShort(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FinanceCashFlowChart() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900">Tren Arus Kas — 6 Bulan Terakhir</h2>
        <p className="mt-1 text-xs md:text-sm text-slate-500">
          Visualisasi pemasukan vs pengeluaran per bulan.
        </p>
      </div>

      <div className="px-2 py-6">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart
            data={CASH_FLOW_DATA}
            margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradPemasukan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPengeluaran" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="bulan"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRupiahShort}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={72}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            />

            <Area
              type="monotone"
              dataKey="pemasukan"
              name="Pemasukan"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#gradPemasukan)"
              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
            <Area
              type="monotone"
              dataKey="pengeluaran"
              name="Pengeluaran"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#gradPengeluaran)"
              dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
