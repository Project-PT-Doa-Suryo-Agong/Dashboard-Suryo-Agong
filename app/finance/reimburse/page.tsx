"use client";

import { useMemo, useState } from 'react';
import { CheckCircle, FileText, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type ReimburseStatus = 'pending' | 'approved' | 'rejected';

type ReimburseItem = {
	id: string;
	employeeName: string;
	divisi: string;
	amount: number;
	keterangan: string;
	createdAt: string;
	status: ReimburseStatus;
};

const INITIAL_REIMBURSE_DATA: ReimburseItem[] = [
	{
		id: 'RMB-240301',
		employeeName: 'Rizky Pratama',
		divisi: 'Creative',
		amount: 350000,
		keterangan: 'Pembelian properti foto campaign Ramadan',
		createdAt: '2026-03-10T08:20:00Z',
		status: 'pending',
	},
	{
		id: 'RMB-240302',
		employeeName: 'Nadia Lestari',
		divisi: 'HR',
		amount: 185000,
		keterangan: 'Transport interview kandidat supervisor',
		createdAt: '2026-03-10T13:45:00Z',
		status: 'pending',
	},
	{
		id: 'RMB-240287',
		employeeName: 'Fajar Maulana',
		divisi: 'Logistik',
		amount: 420000,
		keterangan: 'Penggantian biaya pengiriman dokumen vendor',
		createdAt: '2026-03-08T09:15:00Z',
		status: 'approved',
	},
	{
		id: 'RMB-240276',
		employeeName: 'Putri Anjani',
		divisi: 'Finance',
		amount: 120000,
		keterangan: 'Biaya cetak laporan bulanan',
		createdAt: '2026-03-06T10:05:00Z',
		status: 'rejected',
	},
];

function formatRupiah(amount: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatDate(dateValue: string): string {
	return new Intl.DateTimeFormat('id-ID', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(dateValue));
}

export default function FinanceReimbursePage() {
	const [items, setItems] = useState<ReimburseItem[]>(INITIAL_REIMBURSE_DATA);
	const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');

	const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
	const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
	const [rejectReason, setRejectReason] = useState('');

	const pendingItems = useMemo(
		() => items.filter((item) => item.status === 'pending'),
		[items],
	);

	const processedItems = useMemo(
		() => items.filter((item) => item.status === 'approved' || item.status === 'rejected'),
		[items],
	);

	const visibleItems = activeTab === 'pending' ? pendingItems : processedItems;

	const approveTarget = useMemo(
		() => items.find((item) => item.id === approveTargetId) ?? null,
		[items, approveTargetId],
	);

	const rejectTarget = useMemo(
		() => items.find((item) => item.id === rejectTargetId) ?? null,
		[items, rejectTargetId],
	);

	const handleApprove = () => {
		if (!approveTargetId) return;

		setItems((prev) =>
			prev.map((item) =>
				item.id === approveTargetId ? { ...item, status: 'approved' } : item,
			),
		);
		setApproveTargetId(null);
		setActiveTab('processed');
	};

	const handleReject = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!rejectTargetId || !rejectReason.trim()) return;

		setItems((prev) =>
			prev.map((item) =>
				item.id === rejectTargetId
					? {
							...item,
							status: 'rejected',
							keterangan: `${item.keterangan} (Alasan: ${rejectReason.trim()})`,
						}
					: item,
			),
		);

		setRejectReason('');
		setRejectTargetId(null);
		setActiveTab('processed');
	};

	return (
		<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
			<section className="space-y-1 md:space-y-2">
				<h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">Persetujuan Reimburse & Petty Cash</h1>
				<p className="text-sm md:text-base text-slate-300">
					Validasi pengajuan reimbursement dari karyawan berdasarkan kebutuhan operasional divisi.
				</p>
			</section>

			<section className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 md:p-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
					<button
						type="button"
						onClick={() => setActiveTab('pending')}
						className={`h-11 rounded-lg px-4 text-sm font-semibold transition-colors ${
							activeTab === 'pending'
								? 'bg-blue-500 text-white'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
					>
						Menunggu Persetujuan ({pendingItems.length})
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('processed')}
						className={`h-11 rounded-lg px-4 text-sm font-semibold transition-colors ${
							activeTab === 'processed'
								? 'bg-blue-500 text-white'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200'
						}`}
					>
						Riwayat Diproses ({processedItems.length})
					</button>
				</div>
			</section>

			<section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
				<div className="px-4 md:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
					<h2 className="text-sm md:text-base font-bold text-slate-900">Daftar Pengajuan Reimburse</h2>
					<span className="text-xs text-slate-500">{visibleItems.length} data</span>
				</div>

				<div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
					<table className="w-full min-w-max text-left">
						<thead className="bg-slate-50/80">
							<tr>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Tanggal</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Nama Karyawan</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Divisi</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Keterangan</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Nominal</th>
								<th className="px-4 md:px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Status/Aksi</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-100">
							{visibleItems.map((item) => (
								<tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
									<td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(item.createdAt)}</td>
									<td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{item.employeeName}</td>
									<td className="px-4 md:px-6 py-3 text-sm text-slate-600 whitespace-nowrap">{item.divisi}</td>
									<td className="px-4 md:px-6 py-3 text-sm text-slate-700 min-w-65">{item.keterangan}</td>
									<td className="px-4 md:px-6 py-3 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">{formatRupiah(item.amount)}</td>
									<td className="px-4 md:px-6 py-3 text-right whitespace-nowrap">
										{activeTab === 'pending' ? (
											<div className="inline-flex items-center gap-2">
												<button
													type="button"
													onClick={() => setApproveTargetId(item.id)}
													className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
												>
													<CheckCircle className="h-4 w-4" />
													Setujui
												</button>
												<button
													type="button"
													onClick={() => setRejectTargetId(item.id)}
													className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
												>
													<XCircle className="h-4 w-4" />
													Tolak
												</button>
											</div>
										) : (
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
													item.status === 'approved'
														? 'bg-emerald-50 text-emerald-700'
														: 'bg-red-50 text-red-700'
												}`}
											>
												{item.status === 'approved' ? 'approved' : 'rejected'}
											</span>
										)}
									</td>
								</tr>
							))}

							{visibleItems.length === 0 && (
								<tr>
									<td colSpan={6} className="px-4 md:px-6 py-10 text-center text-sm text-slate-500">
										Tidak ada data pada tab ini.
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</section>

			<ConfirmDialog
				isOpen={!!approveTarget}
				onClose={() => setApproveTargetId(null)}
				onConfirm={handleApprove}
				title="Konfirmasi Persetujuan"
				description={
					approveTarget
						? `Setujui pencairan dana sebesar ${formatRupiah(approveTarget.amount)} untuk ${approveTarget.employeeName}?`
						: ''
				}
				confirmText="Setujui"
				cancelText="Batal"
				variant="warning"
			/>

			<Modal
				isOpen={!!rejectTarget}
				onClose={() => {
					setRejectTargetId(null);
					setRejectReason('');
				}}
				title={
					<div>
						<h3 className="text-lg font-bold text-slate-900">Tolak Pengajuan Reimburse</h3>
						<p className="mt-1 text-sm text-slate-500">
							Berikan alasan penolakan untuk {rejectTarget?.employeeName}.
						</p>
					</div>
				}
				maxWidth="max-w-md"
			>
				<form onSubmit={handleReject} className="space-y-4">
					<div className="space-y-2">
						<label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
							Alasan Penolakan
						</label>
						<textarea
							value={rejectReason}
							onChange={(event) => setRejectReason(event.target.value)}
							rows={4}
							className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition-all focus:border-red-300 focus:ring-2 focus:ring-red-200"
							placeholder="Contoh: Bukti transaksi tidak lengkap."
							required
						/>
					</div>

					<div className="flex flex-col sm:flex-row sm:justify-end gap-3">
						<button
							type="button"
							onClick={() => {
								setRejectTargetId(null);
								setRejectReason('');
							}}
							className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
						>
							Batal
						</button>
						<button
							type="submit"
							className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
						>
							<FileText className="h-4 w-4" />
							Tolak
						</button>
					</div>
				</form>
			</Modal>
		</div>
	);
}
