"use client";

import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type CashflowType = 'income' | 'expense';
type CashflowFilter = 'all' | 'income' | 'expense';

type CashflowItem = {
	id: string;
	tipe: CashflowType;
	amount: number;
	keterangan: string;
	createdAt: string;
};

const INITIAL_CASHFLOW_DATA: CashflowItem[] = [
	{
		id: 'CF-240301',
		tipe: 'income',
		amount: 125000000,
		keterangan: 'Pembayaran invoice campaign Q1',
		createdAt: '2026-03-10T08:15:00Z',
	},
	{
		id: 'CF-240302',
		tipe: 'expense',
		amount: 28250000,
		keterangan: 'Pembelian bahan baku produksi',
		createdAt: '2026-03-10T11:35:00Z',
	},
	{
		id: 'CF-240303',
		tipe: 'income',
		amount: 48000000,
		keterangan: 'Termin kedua proyek digitalisasi gudang',
		createdAt: '2026-03-11T09:25:00Z',
	},
	{
		id: 'CF-240304',
		tipe: 'expense',
		amount: 17400000,
		keterangan: 'Biaya operasional kantor cabang',
		createdAt: '2026-03-11T16:10:00Z',
	},
	{
		id: 'CF-240305',
		tipe: 'expense',
		amount: 9600000,
		keterangan: 'Biaya maintenance perangkat server',
		createdAt: '2026-03-12T10:45:00Z',
	},
];

function formatRupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(value);
}

function formatDate(value: string): string {
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(value));
}

export default function FinanceCashflowPage() {
	const [items, setItems] = useState<CashflowItem[]>(INITIAL_CASHFLOW_DATA);
	const [filter, setFilter] = useState<CashflowFilter>('all');
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);

	const [newType, setNewType] = useState<CashflowType>('income');
	const [newDescription, setNewDescription] = useState('');
	const [newAmount, setNewAmount] = useState('');

	const totalIncome = useMemo(
		() => items.filter((item) => item.tipe === 'income').reduce((acc, item) => acc + item.amount, 0),
		[items],
	);

	const totalExpense = useMemo(
		() => items.filter((item) => item.tipe === 'expense').reduce((acc, item) => acc + item.amount, 0),
		[items],
	);

	const netBalance = totalIncome - totalExpense;

	const filteredItems = useMemo(() => {
		if (filter === 'all') return items;
		return items.filter((item) => item.tipe === filter);
	}, [items, filter]);

	const handleAddTransaction = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const parsedAmount = Number(newAmount);
		if (!newDescription.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) return;

		const newItem: CashflowItem = {
			id: `CF-${Math.floor(100000 + Math.random() * 900000)}`,
			tipe: newType,
			amount: parsedAmount,
			keterangan: newDescription.trim(),
			createdAt: new Date().toISOString(),
		};

		setItems((prev) => [newItem, ...prev]);
		setNewType('income');
		setNewDescription('');
		setNewAmount('');
		setIsAddModalOpen(false);
	};

	return (
		<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
			<section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Laporan Arus Kas</h1>
					<p className="text-sm md:text-base text-slate-300">Pantau seluruh transaksi pemasukan dan pengeluaran secara real-time.</p>
				</div>

				<button
					type="button"
					onClick={() => setIsAddModalOpen(true)}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 hover:bg-lime-700 hover:text-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors"
				>
					<PlusCircle className="h-4 w-4 md:h-5 md:w-5" />
					Catat Transaksi
				</button>
			</section>

			<section className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
				<article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
					<p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pemasukan</p>
					<p className="mt-2 text-base md:text-xl font-bold text-emerald-600 break-all">{formatRupiah(totalIncome)}</p>
				</article>

				<article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
					<p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Total Pengeluaran</p>
					<p className="mt-2 text-base md:text-xl font-bold text-red-600 break-all">{formatRupiah(totalExpense)}</p>
				</article>

				<article className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 md:p-6">
					<p className="text-xs uppercase tracking-wide font-semibold text-slate-500">Saldo Bersih</p>
					<p className="mt-2 text-base md:text-xl font-bold text-blue-700 break-all">{formatRupiah(netBalance)}</p>
				</article>
			</section>

			<section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
				<div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<h2 className="text-sm md:text-base font-bold text-slate-900">Daftar Arus Kas</h2>

					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							onClick={() => setFilter('all')}
							className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-slate-600 hover:bg-indigo-200'
							}`}
						>
							Semua
						</button>
						<button
							type="button"
							onClick={() => setFilter('income')}
							className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								filter === 'income' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
							}`}
						>
							Income
						</button>
						<button
							type="button"
							onClick={() => setFilter('expense')}
							className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
								filter === 'expense' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
							}`}
						>
							Expense
						</button>
					</div>
				</div>

				<div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
					<table className="w-full min-w-max text-left">
						<thead className="bg-slate-50/80">
							<tr>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Keterangan</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tipe</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nominal</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{filteredItems.map((item) => (
								<tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
									<td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.createdAt)}</td>
									<td className="px-4 md:px-6 py-3 text-sm text-slate-800 min-w-80">{item.keterangan}</td>
									<td className="px-4 md:px-6 py-3">
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
												item.tipe === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
											}`}
										>
											{item.tipe}
										</span>
									</td>
									<td
										className={`px-4 md:px-6 py-3 text-sm font-semibold text-right whitespace-nowrap ${
											item.tipe === 'income' ? 'text-emerald-600' : 'text-red-600'
										}`}
									>
										{item.tipe === 'income' ? '+ ' : '- '}
										{formatRupiah(item.amount)}
									</td>
								</tr>
							))}

							{filteredItems.length === 0 && (
								<tr>
									<td colSpan={4} className="px-4 md:px-6 py-8 text-center text-sm text-slate-500">
										Tidak ada transaksi untuk filter ini.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			<Modal
				isOpen={isAddModalOpen}
				onClose={() => {
					setIsAddModalOpen(false);
					setNewType('income');
					setNewDescription('');
					setNewAmount('');
				}}
				maxWidth="max-w-md"
				title="Catat Transaksi Baru"
			>
				<form onSubmit={handleAddTransaction} className="space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tipe Transaksi</label>
						<select
							value={newType}
							onChange={(event) => setNewType(event.target.value as CashflowType)}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							required
						>
							<option value="income">income</option>
							<option value="expense">expense</option>
						</select>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keterangan</label>
						<input
							type="text"
							value={newDescription}
							onChange={(event) => setNewDescription(event.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							placeholder="Contoh: Pembayaran invoice klien"
							required
						/>
					</div>

					<div className="space-y-2">
						<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nominal</label>
						<input
							type="number"
							min={1}
							value={newAmount}
							onChange={(event) => setNewAmount(event.target.value)}
							className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							placeholder="Masukkan nominal"
							required
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:justify-end gap-3">
						<button
							type="button"
							onClick={() => {
								setIsAddModalOpen(false);
								setNewType('income');
								setNewDescription('');
								setNewAmount('');
							}}
							className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
						>
							Batal
						</button>
						<button
							type="submit"
							className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 transition-colors"
						>
							Simpan Transaksi
						</button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
