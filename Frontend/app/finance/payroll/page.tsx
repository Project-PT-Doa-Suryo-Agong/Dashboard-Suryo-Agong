"use client";

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

type PayrollItem = {
	id: string;
	employeeName: string;
	bulan: string;
	total: number;
	createdAt: string;
};

const PAYROLL_HISTORY_DATA: PayrollItem[] = [
	{
		id: 'PR-260201',
		employeeName: 'Andi Saputra',
		bulan: '2026-02-01',
		total: 8750000,
		createdAt: '2026-03-01T08:15:00Z',
	},
	{
		id: 'PR-260202',
		employeeName: 'Nabila Putri',
		bulan: '2026-02-01',
		total: 9250000,
		createdAt: '2026-03-01T08:21:00Z',
	},
	{
		id: 'PR-260203',
		employeeName: 'Rizky Maulana',
		bulan: '2026-02-01',
		total: 8100000,
		createdAt: '2026-03-01T08:28:00Z',
	},
	{
		id: 'PR-260204',
		employeeName: 'Dewi Anggraini',
		bulan: '2026-02-01',
		total: 9800000,
		createdAt: '2026-03-01T08:36:00Z',
	},
	{
		id: 'PR-260205',
		employeeName: 'Fajar Nugraha',
		bulan: '2026-02-01',
		total: 8600000,
		createdAt: '2026-03-01T08:44:00Z',
	},
	{
		id: 'PR-260206',
		employeeName: 'Siti Rahma',
		bulan: '2026-02-01',
		total: 8950000,
		createdAt: '2026-03-01T08:53:00Z',
	},
];

function formatRupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(value);
}

function formatPeriod(value: string): string {
	return new Intl.DateTimeFormat('id-ID', {
		month: 'long',
		year: 'numeric',
	}).format(new Date(value));
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

export default function FinancePayrollPage() {
	const [searchTerm, setSearchTerm] = useState('');

	const totalPayroll = useMemo(
		() => PAYROLL_HISTORY_DATA.reduce((sum, item) => sum + item.total, 0),
		[],
	);

	const filteredPayroll = useMemo(() => {
		const keyword = searchTerm.trim().toLowerCase();
		if (!keyword) return PAYROLL_HISTORY_DATA;

		return PAYROLL_HISTORY_DATA.filter((item) =>
			item.employeeName.toLowerCase().includes(keyword),
		);
	}, [searchTerm]);

	return (
		<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
			<section className="space-y-1 md:space-y-2">
				<h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Riwayat Penggajian (Payroll)</h1>
				<p className="text-sm md:text-base text-slate-300">Laporan distribusi gaji karyawan per periode.</p>
			</section>

			<section className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
				<p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran Gaji Bulan Ini</p>
				<p className="mt-2 text-xl md:text-3xl font-bold text-blue-900 break-all">{formatRupiah(totalPayroll)}</p>
			</section>

			<section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
				<div className="px-4 md:px-6 py-4 border-b border-slate-100">
					<div className="relative w-full md:max-w-md">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
						<input
							type="text"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Cari nama karyawan..."
							className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
						/>
					</div>
				</div>

				<div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
					<table className="w-full min-w-max text-left">
						<thead className="bg-slate-50/80">
							<tr>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Periode</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Karyawan</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Total Gaji</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Tanggal Eksekusi</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredPayroll.map((item) => (
								<tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
									<td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{formatPeriod(item.bulan)}</td>
									<td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900 whitespace-nowrap">{item.employeeName}</td>
									<td className="px-4 md:px-6 py-3 text-sm font-semibold text-right text-slate-900 whitespace-nowrap">{formatRupiah(item.total)}</td>
									<td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.createdAt)}</td>
								</tr>
							))}

							{filteredPayroll.length === 0 && (
								<tr>
									<td colSpan={4} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
										Karyawan tidak ditemukan.
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
