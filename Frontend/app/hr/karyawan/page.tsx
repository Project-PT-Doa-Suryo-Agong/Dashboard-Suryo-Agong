"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, PlusCircle, Search, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type KaryawanItem = {
	id: string;
	nama: string;
	posisi: string;
	divisi: string;
	status: "aktif" | "nonaktif";
	gaji_pokok: number;
};

const dummyKaryawan: KaryawanItem[] = [
	{
		id: "emp-001",
		nama: "Rani Wulandari",
		posisi: "HR Generalist",
		divisi: "HR",
		status: "aktif",
		gaji_pokok: 7800000,
	},
	{
		id: "emp-002",
		nama: "Bima Pratama",
		posisi: "Staff Finance",
		divisi: "Finance",
		status: "aktif",
		gaji_pokok: 7200000,
	},
	{
		id: "emp-003",
		nama: "Nadia Putri",
		posisi: "QC Lead",
		divisi: "Produksi",
		status: "nonaktif",
		gaji_pokok: 8500000,
	},
	{
		id: "emp-004",
		nama: "Dwi Firmansyah",
		posisi: "Supervisor Logistik",
		divisi: "Logistik",
		status: "aktif",
		gaji_pokok: 8100000,
	},
	{
		id: "emp-005",
		nama: "Salsa Maharani",
		posisi: "Content Specialist",
		divisi: "Creative",
		status: "aktif",
		gaji_pokok: 7000000,
	},
	{
		id: "emp-006",
		nama: "Agus Setiawan",
		posisi: "Office Assistant",
		divisi: "Office",
		status: "nonaktif",
		gaji_pokok: 5200000,
	},
];

const divisiOptions = [
	"HR",
	"Finance",
	"Produksi",
	"Logistik",
	"Creative",
	"Office",
	"Management",
];

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
	style: "currency",
	currency: "IDR",
	maximumFractionDigits: 0,
});

function Badge({ status }: { status: "aktif" | "nonaktif" }) {
	return (
		<span
			className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
				status === "aktif"
					? "bg-emerald-100 text-emerald-700"
					: "bg-red-100 text-red-700"
			}`}
		>
			{status}
		</span>
	);
}

export default function KaryawanPage() {
	const [items, setItems] = useState<KaryawanItem[]>(dummyKaryawan);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
	const [editData, setEditData] = useState<KaryawanItem | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState<Omit<KaryawanItem, "id">>({
		nama: "",
		posisi: "",
		divisi: divisiOptions[0],
		status: "aktif",
		gaji_pokok: 0,
	});

	const filteredItems = useMemo(() => {
		const keyword = searchTerm.trim().toLowerCase();
		if (!keyword) return items;
		return items.filter((item) => item.nama.toLowerCase().includes(keyword));
	}, [items, searchTerm]);

	const resetForm = () => {
		setFormData({
			nama: "",
			posisi: "",
			divisi: divisiOptions[0],
			status: "aktif",
			gaji_pokok: 0,
		});
		setEditData(null);
	};

	const openAddModal = () => {
		resetForm();
		setIsFormModalOpen(true);
	};

	const openEditModal = (item: KaryawanItem) => {
		setEditData(item);
		setFormData({
			nama: item.nama,
			posisi: item.posisi,
			divisi: item.divisi,
			status: item.status,
			gaji_pokok: item.gaji_pokok,
		});
		setIsFormModalOpen(true);
	};

	const closeFormModal = () => {
		setIsFormModalOpen(false);
		resetForm();
	};

	const createRandomId = () => {
		if (typeof crypto !== "undefined" && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		return `emp-${Math.random().toString(36).slice(2, 10)}`;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (editData) {
			setItems((prev) =>
				prev.map((item) =>
					item.id === editData.id ? { ...item, ...formData } : item
				)
			);
		} else {
			const newItem: KaryawanItem = {
				id: createRandomId(),
				...formData,
			};
			setItems((prev) => [newItem, ...prev]);
		}

		closeFormModal();
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteModalOpen(true);
	};

	const closeDeleteModal = () => {
		setDeleteId(null);
		setIsDeleteModalOpen(false);
	};

	const handleConfirmDelete = () => {
		if (!deleteId) return;
		setItems((prev) => prev.filter((item) => item.id !== deleteId));
		closeDeleteModal();
	};

	return (
		<div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto w-full">
			<div className="space-y-1">
				<h1 className="text-2xl md:text-3xl font-bold text-slate-100">
					Direktori Karyawan
				</h1>
				<p className="text-sm md:text-base text-slate-200">
					Kelola data induk, posisi, dan status aktif karyawan.
				</p>
			</div>

			<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
				<div className="relative w-full sm:max-w-md">
					<Search
						size={18}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
					/>
					<input
						type="text"
						value={searchTerm}
						onChange={(event) => setSearchTerm(event.target.value)}
						placeholder="Cari nama karyawan..."
						className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-cyan-200 focus:ring-2 focus:ring-slate-200/20"
					/>
				</div>

				<button
					type="button"
					onClick={openAddModal}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
				>
					<PlusCircle size={18} />
					Tambah Karyawan
				</button>
			</div>

			<div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
				<table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Nama Lengkap
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Posisi
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Divisi
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
								Gaji Pokok
							</th>
							<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
								Status
							</th>
							<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">
								Aksi
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredItems.length > 0 ? (
							filteredItems.map((item) => (
								<tr key={item.id} className="border-t border-slate-100">
									<td className="px-4 py-3 text-sm font-medium text-slate-900">
										{item.nama}
									</td>
									<td className="px-4 py-3 text-sm text-slate-700">{item.posisi}</td>
									<td className="px-4 py-3 text-sm text-slate-700">{item.divisi}</td>
									<td className="px-4 py-3 text-sm text-right text-slate-700">
										{rupiahFormatter.format(item.gaji_pokok)}
									</td>
									<td className="px-4 py-3 text-center">
										<Badge status={item.status} />
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-2">
											<button
												type="button"
												onClick={() => openEditModal(item)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
												aria-label={`Edit data ${item.nama}`}
											>
												<Pencil size={16} />
											</button>
											<button
												type="button"
												onClick={() => openDeleteModal(item.id)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
												aria-label={`Hapus data ${item.nama}`}
											>
												<Trash2 size={16} />
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td
									colSpan={6}
									className="px-4 py-8 text-center text-sm text-slate-500"
								>
									Data karyawan tidak ditemukan.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<Modal
				isOpen={isFormModalOpen}
				onClose={closeFormModal}
				title={editData ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
				maxWidth="max-w-2xl"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<label className="space-y-1.5 md:col-span-2">
							<span className="text-sm font-medium text-slate-700">Nama</span>
							<input
								type="text"
								required
								value={formData.nama}
								onChange={(event) =>
									setFormData((prev) => ({ ...prev, nama: event.target.value }))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							/>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Posisi</span>
							<input
								type="text"
								required
								value={formData.posisi}
								onChange={(event) =>
									setFormData((prev) => ({ ...prev, posisi: event.target.value }))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							/>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Divisi</span>
							<select
								value={formData.divisi}
								onChange={(event) =>
									setFormData((prev) => ({ ...prev, divisi: event.target.value }))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							>
								{divisiOptions.map((divisi) => (
									<option key={divisi} value={divisi}>
										{divisi}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Status</span>
							<select
								value={formData.status}
								onChange={(event) =>
									setFormData((prev) => ({
										...prev,
										status: event.target.value as "aktif" | "nonaktif",
									}))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							>
								<option value="aktif">aktif</option>
								<option value="nonaktif">nonaktif</option>
							</select>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Gaji Pokok</span>
							<input
								type="number"
								min={0}
								required
								value={formData.gaji_pokok}
								onChange={(event) =>
									setFormData((prev) => ({
										...prev,
										gaji_pokok: Number(event.target.value),
									}))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							/>
						</label>
					</div>

					<div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
						<button
							type="button"
							onClick={closeFormModal}
							className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
						>
							Batal
						</button>
						<button
							type="submit"
							className="inline-flex items-center justify-center rounded-xl bg-green-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
						>
							Simpan Data
						</button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				isOpen={isDeleteModalOpen}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Hapus Data Karyawan"
				description="Apakah Anda yakin ingin menghapus data karyawan ini?"
				confirmText="Ya, Hapus"
				cancelText="Batal"
				variant="danger"
			/>
		</div>
	);
}
