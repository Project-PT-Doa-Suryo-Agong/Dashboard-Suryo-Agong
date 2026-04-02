'use client';

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ─── TypeScript Interfaces ────────────────────────────────────────────────────

interface DivisionPerformanceItem {
  divisi: string;
  target: number;
  aktual: number;
  gap: number;
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

// ─── Mock Data — Target vs Aktual per Divisi ──────────────────────────────────

const DIVISION_PERFORMANCE_DATA: DivisionPerformanceItem[] = [
  { divisi: 'Finance',   target: 100, aktual: 88,  gap: 12 },
  { divisi: 'HR',        target: 100, aktual: 90,  gap: 10 },
  { divisi: 'Produksi',  target: 100, aktual: 86,  gap: 14 },
  { divisi: 'Logistik',  target: 100, aktual: 89,  gap: 11 },
  { divisi: 'Sales',     target: 100, aktual: 85,  gap: 15 },
  { divisi: 'Creative',  target: 100, aktual: 92,  gap: 8  },
  { divisi: 'Office',    target: 100, aktual: 91,  gap: 9  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBarColor(aktual: number): string {
  if (aktual >= 90) return '#10b981'; // hijau — performa tinggi
  if (aktual >= 85) return '#f59e0b'; // amber — moderat
  return '#ef4444';                   // merah — perlu perhatian
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
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManagementPerformanceChart() {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-slate-100">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Performa KPI — Target vs Aktual</h2>
            <p className="mt-1 text-xs md:text-sm text-slate-500">
              Capaian kinerja per divisi minggu ini (skala 0–100).
            </p>
          </div>
          <div className="flex gap-3 text-xs text-slate-500 shrink-0 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              ≥ 90
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 inline-block" />
              85–89
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
              &lt; 85
            </span>
          </div>
        </div>
      </div>

      <div className="px-2 py-6">
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={DIVISION_PERFORMANCE_DATA}
            margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="divisi"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[70, 105]}
              tickFormatter={(v: number) => `${v}`}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={32}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }}
            />

            {/* Batang Aktual dengan warna dinamis */}
            <Bar dataKey="aktual" name="Aktual" radius={[6, 6, 0, 0]} maxBarSize={40}>
              {DIVISION_PERFORMANCE_DATA.map((entry) => (
                <Cell key={entry.divisi} fill={getBarColor(entry.aktual)} />
              ))}
            </Bar>

            {/* Garis Target (referensi) */}
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="#1e3a8a"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
