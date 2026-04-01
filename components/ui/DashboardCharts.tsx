"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export type CashflowPoint = {
  bulan: string;
  pemasukan: number;
  pengeluaran: number;
};

export type PerformancePoint = {
  label: string;
  value: number;
};

type CashflowLineChartProps = {
  data: CashflowPoint[];
};

type PerformanceBarChartProps = {
  data: PerformancePoint[];
  barLabel?: string;
};

function compactNumber(value: number) {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function toNumber(value: number | string | ReadonlyArray<number | string> | undefined) {
  const normalized = Array.isArray(value) ? value[0] : value;
  const numeric = Number(normalized ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

export function CashflowLineChart({ data }: CashflowLineChartProps) {
  return (
    <div className="h-72 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="bulan" tick={{ fontSize: 12 }} stroke="#64748B" />
          <YAxis tickFormatter={compactNumber} tick={{ fontSize: 12 }} stroke="#64748B" />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(toNumber(value))
            }
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="pemasukan"
            name="Pemasukan"
            stroke="#16A34A"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="pengeluaran"
            name="Pengeluaran"
            stroke="#DC2626"
            strokeWidth={3}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformanceBarChart({ data, barLabel = "Nilai" }: PerformanceBarChartProps) {
  return (
    <div className="h-72 w-full md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#64748B" />
          <YAxis tickFormatter={compactNumber} tick={{ fontSize: 12 }} stroke="#64748B" />
          <Tooltip formatter={(value) => compactNumber(toNumber(value))} />
          <Legend />
          <Bar dataKey="value" name={barLabel} fill="#0EA5E9" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
