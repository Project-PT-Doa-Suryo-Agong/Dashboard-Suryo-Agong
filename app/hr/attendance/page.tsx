"use client";

import { FormEvent, useMemo, useState } from "react";
import { Pencil, Search, Trash2, UserCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha";

type AttendanceItem = {
	id: string;
	employeeName: string;
	divisi: string;
	tanggal: string;
	status: AttendanceStatus;
};

type EmployeeOption = {
	id: string;
	nama: string;
	divisi: string;
};

const employeeOptions: EmployeeOption[] = [
	{ id: "emp-001", nama: "Rani Wulandari", divisi: "HR" },
	{ id: "emp-002", nama: "Bima Pratama", divisi: "Finance" },
	{ id: "emp-003", nama: "Nadia Putri", divisi: "Produksi" },
	{ id: "emp-004", nama: "Dwi Firmansyah", divisi: "Logistik" },
	{ id: "emp-005", nama: "Salsa Maharani", divisi: "Creative" },
	{ id: "emp-006", nama: "Agus Setiawan", divisi: "Office" },
	{ id: "emp-007", nama: "Farhan Maulana", divisi: "Management" },
];

function getTodayDateInput() {
	const now = new Date();
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

const todayDate = getTodayDateInput();

const dummyAttendance: AttendanceItem[] = [
	{
		id: "att-001",
		employeeName: "Rani Wulandari",
		divisi: "HR",
		tanggal: todayDate,
		status: "hadir",
	},
	{
		id: "att-002",
		employeeName: "Bima Pratama",
		divisi: "Finance",
		tanggal: todayDate,
		status: "izin",
	},
	{
		id: "att-003",
		employeeName: "Nadia Putri",
		divisi: "Produksi",
		tanggal: todayDate,
		status: "sakit",
	},
	{
		id: "att-004",
		employeeName: "Dwi Firmansyah",
		divisi: "Logistik",
		tanggal: todayDate,
		status: "alpha",
	},
	{
		id: "att-005",
		employeeName: "Salsa Maharani",
		divisi: "Creative",
		tanggal: todayDate,
		status: "hadir",
	},
	{
		id: "att-006",
		employeeName: "Agus Setiawan",
		divisi: "Office",
		tanggal: todayDate,
		status: "hadir",
	},
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

function statusBadgeClass(status: AttendanceStatus) {
	if (status === "hadir") return "bg-emerald-100 text-emerald-700";
	if (status === "izin") return "bg-amber-100 text-amber-700";
	if (status === "sakit") return "bg-blue-100 text-blue-700";
	return "bg-red-100 text-red-700";
}

export default function AttendancePage() {
	const [items, setItems] = useState<AttendanceItem[]>(dummyAttendance);
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [filterStatus, setFilterStatus] = useState<"all" | AttendanceStatus>("all");
	const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
	const [editData, setEditData] = useState<AttendanceItem | null>(null);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const [formData, setFormData] = useState<{
		employeeId: string;
		tanggal: string;
		status: AttendanceStatus;
	}>({
		employeeId: employeeOptions[0]?.id ?? "",
		tanggal: todayDate,
		status: "hadir",
	});

	const filteredItems = useMemo(() => {
		const keyword = searchTerm.trim().toLowerCase();
		return items.filter((item) => {
			const matchName = item.employeeName.toLowerCase().includes(keyword);
			const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
			return matchName && matchStatus;
		});
	}, [items, searchTerm, filterStatus]);

	const attendanceSummary = useMemo(() => {
		return {
			hadir: items.filter((item) => item.status === "hadir").length,
			izin: items.filter((item) => item.status === "izin").length,
			sakit: items.filter((item) => item.status === "sakit").length,
			alpha: items.filter((item) => item.status === "alpha").length,
		};
	}, [items]);

	const resetForm = () => {
		setFormData({
			employeeId: employeeOptions[0]?.id ?? "",
			tanggal: todayDate,
			status: "hadir",
		});
		setEditData(null);
	};

	const openAddModal = () => {
		resetForm();
		setIsFormModalOpen(true);
	};

	const openEditModal = (item: AttendanceItem) => {
		setEditData(item);
		const selectedEmployee =
			employeeOptions.find((employee) => employee.nama === item.employeeName) ??
			employeeOptions[0];
		setFormData({
			employeeId: selectedEmployee?.id ?? "",
			tanggal: item.tanggal,
			status: item.status,
		});
		setIsFormModalOpen(true);
	};

	const closeFormModal = () => {
		setIsFormModalOpen(false);
		resetForm();
	};

	const openDeleteModal = (id: string) => {
		setDeleteId(id);
		setIsDeleteModalOpen(true);
	};

	const closeDeleteModal = () => {
		setDeleteId(null);
		setIsDeleteModalOpen(false);
	};

	const createRandomId = () => {
		if (typeof crypto !== "undefined" && crypto.randomUUID) {
			return crypto.randomUUID();
		}
		return `att-${Math.random().toString(36).slice(2, 10)}`;
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const selectedEmployee = employeeOptions.find(
			(employee) => employee.id === formData.employeeId
		);

		if (!selectedEmployee) return;

		const payload: Omit<AttendanceItem, "id"> = {
			employeeName: selectedEmployee.nama,
			divisi: selectedEmployee.divisi,
			tanggal: formData.tanggal,
			status: formData.status,
		};

		if (editData) {
			setItems((prev) =>
				prev.map((item) =>
					item.id === editData.id ? { ...item, ...payload } : item
				)
			);
		} else {
			const newItem: AttendanceItem = {
				id: createRandomId(),
				...payload,
			};
			setItems((prev) => [newItem, ...prev]);
		}

		closeFormModal();
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
					Presensi Karyawan
				</h1>
				<p className="text-sm md:text-base text-slate-200">
					Catat dan tinjau kehadiran harian seluruh staf.
				</p>
			</div>

			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
						Hadir
					</p>
					<p className="mt-1 text-2xl font-bold text-emerald-800">{attendanceSummary.hadir}</p>
				</div>
				<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
						Izin
					</p>
					<p className="mt-1 text-2xl font-bold text-amber-800">{attendanceSummary.izin}</p>
				</div>
				<div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
						Sakit
					</p>
					<p className="mt-1 text-2xl font-bold text-blue-800">{attendanceSummary.sakit}</p>
				</div>
				<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
					<p className="text-xs font-semibold uppercase tracking-wide text-red-700">
						Alpha
					</p>
					<p className="mt-1 text-2xl font-bold text-red-800">{attendanceSummary.alpha}</p>
				</div>
			</div>

			<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-2xl">
					<div className="relative w-full sm:flex-1">
						<Search
							size={18}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
						/>
						<input
							type="text"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Cari nama karyawan..."
							className="w-full rounded-xl border border-slate-300 bg-slate-200 py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
						/>
					</div>
					<select
						value={filterStatus}
						onChange={(event) =>
							setFilterStatus(event.target.value as "all" | AttendanceStatus)
						}
						className="w-full rounded-xl border border-slate-300 bg-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition sm:w-44 focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
					>
						<option value="all">Semua Status</option>
						<option value="hadir">Hadir</option>
						<option value="izin">Izin</option>
						<option value="sakit">Sakit</option>
						<option value="alpha">Alpha</option>
					</select>
				</div>

				<button
					type="button"
					onClick={openAddModal}
					className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-95"
				>
					<UserCheck size={18} />
					Input Presensi
				</button>
			</div>

			<div className="overflow-x-auto w-full -mx-4 md:mx-0 px-4 md:px-0">
				<table className="min-w-max w-full border-separate border-spacing-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
					<thead className="bg-slate-50">
						<tr>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Nama Karyawan
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Divisi
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
								Tanggal
							</th>
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
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
										{item.employeeName}
									</td>
									<td className="px-4 py-3 text-sm text-slate-700">{item.divisi}</td>
									<td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
										{dateFormatter.format(new Date(item.tanggal))}
									</td>
									<td className="px-4 py-3 text-sm">
										<span
											className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(
												item.status
											)}`}
										>
											{item.status}
										</span>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center justify-center gap-2">
											<button
												type="button"
												onClick={() => openEditModal(item)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-amber-200 text-amber-600 transition hover:bg-amber-50"
												aria-label={`Edit presensi ${item.employeeName}`}
											>
												<Pencil size={16} />
											</button>
											<button
												type="button"
												onClick={() => openDeleteModal(item.id)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
												aria-label={`Hapus presensi ${item.employeeName}`}
											>
												<Trash2 size={16} />
											</button>
										</div>
									</td>
								</tr>
							))
						) : (
							<tr>
								<td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
									Data presensi tidak ditemukan.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>

			<Modal
				isOpen={isFormModalOpen}
				onClose={closeFormModal}
				title={editData ? "Edit Presensi Karyawan" : "Input Presensi Karyawan"}
				maxWidth="max-w-xl"
			>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<label className="space-y-1.5 md:col-span-2">
							<span className="text-sm font-medium text-slate-700">Pilih Karyawan</span>
							<select
								required
								value={formData.employeeId}
								onChange={(event) =>
									setFormData((prev) => ({ ...prev, employeeId: event.target.value }))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							>
								{employeeOptions.map((employee) => (
									<option key={employee.id} value={employee.id}>
										{employee.nama} - {employee.divisi}
									</option>
								))}
							</select>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Pilih Tanggal</span>
							<input
								required
								type="date"
								value={formData.tanggal}
								onChange={(event) =>
									setFormData((prev) => ({ ...prev, tanggal: event.target.value }))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							/>
						</label>

						<label className="space-y-1.5">
							<span className="text-sm font-medium text-slate-700">Pilih Status</span>
							<select
								required
								value={formData.status}
								onChange={(event) =>
									setFormData((prev) => ({
										...prev,
										status: event.target.value as AttendanceStatus,
									}))
								}
								className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20"
							>
								<option value="hadir">hadir</option>
								<option value="izin">izin</option>
								<option value="sakit">sakit</option>
								<option value="alpha">alpha</option>
							</select>
						</label>
					</div>

					<div className="flex justify-end pt-2">
						<button
							type="submit"
							className="inline-flex items-center justify-center rounded-xl bg-[#BC934B] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
						>
							Simpan Presensi
						</button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog
				isOpen={isDeleteModalOpen}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				title="Hapus Data Presensi"
				description="Yakin ingin menghapus data presensi ini?"
				confirmText="Ya, Hapus"
				cancelText="Batal"
				variant="danger"
			/>
		</div>
	);
}
