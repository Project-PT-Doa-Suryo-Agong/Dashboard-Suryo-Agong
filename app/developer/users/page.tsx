"use client";

import { useMemo, useState } from 'react';
import { Pencil, Trash2, UserPlus, Users2 } from 'lucide-react';
import type { CoreUserRole } from '@/types/supabase';

type UserRole = CoreUserRole;

type SystemUser = {
	id: string;
	nama: string;
	role: UserRole;
	phone: string;
	created_at: string;
};

const ROLE_OPTIONS: UserRole[] = [
	'Developer',
	'Management & Strategy',
	'Finance & Administration',
	'HR & Operation Manager',
	'Produksi & Quality Control',
	'Logistics & Packing',
	'Creative & Sales',
	'Office Support',
];

const ROLE_BADGE_MAP: Record<UserRole, string> = {
	Developer: 'bg-purple-100 text-purple-700 border-purple-200',
	'Management & Strategy': 'bg-slate-900 text-white border-slate-900',
	'Finance & Administration': 'bg-emerald-100 text-emerald-700 border-emerald-200',
	'HR & Operation Manager': 'bg-sky-100 text-sky-700 border-sky-200',
	'Produksi & Quality Control': 'bg-amber-100 text-amber-700 border-amber-200',
	'Logistics & Packing': 'bg-orange-100 text-orange-700 border-orange-200',
	'Creative & Sales': 'bg-pink-100 text-pink-700 border-pink-200',
	'Office Support': 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const DUMMY_USERS: SystemUser[] = [
	{
		id: 'DEVS-001',
		nama: 'Rama Pratama',
		role: 'Developer',
		phone: '0812-3456-7890',
		created_at: '2026-01-04T08:14:00Z',
	},
	{
		id: 'CEO-001',
		nama: 'Nadia Kusuma',
		role: 'Management & Strategy',
		phone: '0813-2244-9988',
		created_at: '2026-01-12T09:30:00Z',
	},
	{
		id: 'FINA-001',
		nama: 'Dimas Saputra',
		role: 'Finance & Administration',
		phone: '0821-7700-5544',
		created_at: '2026-02-09T13:00:00Z',
	},
	{
		id: 'CREA-001',
		nama: 'Putri Amalia',
		role: 'Creative & Sales',
		phone: '0857-6001-2211',
		created_at: '2026-02-17T07:42:00Z',
	},
];

export default function DeveloperUsersPage() {
	const [users, setUsers] = useState<SystemUser[]>(DUMMY_USERS);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [nama, setNama] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState<UserRole>('Developer');

	const submitLabel = editingId ? 'Update User' : 'Tambah User';

	const sortedUsers = useMemo(
		() => [...users].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
		[users],
	);

	const resetForm = () => {
		setEditingId(null);
		setNama('');
		setPhone('');
		setRole('Developer');
	};

	const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!nama.trim() || !phone.trim()) return;

		if (editingId) {
			setUsers((prev) =>
				prev.map((user) =>
					user.id === editingId
						? {
								...user,
								nama: nama.trim(),
								phone: phone.trim(),
								role,
							}
						: user,
				),
			);
			resetForm();
			return;
		}

		const newUser: SystemUser = {
			id: crypto.randomUUID(),
			nama: nama.trim(),
			phone: phone.trim(),
			role,
			created_at: new Date().toISOString(),
		};

		setUsers((prev) => [newUser, ...prev]);
		resetForm();
	};

	const handleEdit = (user: SystemUser) => {
		setEditingId(user.id);
		setNama(user.nama);
		setPhone(user.phone);
		setRole(user.role);
	};

	const handleDelete = (id: string) => {
		setUsers((prev) => prev.filter((user) => user.id !== id));
		if (editingId === id) resetForm();
	};

	return (
		<div className="p-3 md:p-4 lg:p-8 space-y-4 md:space-y-6 lg:space-y-8 max-w-7xl mx-auto w-full">
			<section className="space-y-1 md:space-y-2">
				<h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-slate-100">System Users Management</h1>
				<p className="text-xs md:text-sm lg:text-base text-slate-200">
					Manage data pengguna sistem, termasuk nama, role akses, dan informasi kontak.
				</p>
			</section>

			<section className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 md:p-4 lg:p-6 space-y-4 md:space-y-5">
				<div className="flex items-center gap-2 md:gap-3">
					<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] shrink-0 md:h-10 md:w-10">
						<UserPlus size={16} />
					</span>
					<div className="min-w-0">
						<h2 className="text-sm md:text-base lg:text-lg font-bold text-slate-900">Tambah/Edit User</h2>
					</div>
				</div>

				<form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
					<div className="space-y-1 md:space-y-2">
						<label htmlFor="nama" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
							Nama
						</label>
						<input
							id="nama"
							type="text"
							value={nama}
							onChange={(event) => setNama(event.target.value)}
							placeholder="Masukkan nama user"
							className="w-full h-10 md:h-11 text-xs md:text-sm text-slate-500 bg-slate-200 rounded-lg border border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
							required
						/>
					</div>

					<div className="space-y-1 md:space-y-2">
						<label htmlFor="phone" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
							Phone
						</label>
						<input
							id="phone"
							type="text"
							value={phone}
							onChange={(event) => setPhone(event.target.value)}
							placeholder="08xx-xxxx-xxxx"
							className="w-full h-10 md:h-11 text-xs md:text-sm text-slate-500 bg-slate-200 rounded-lg border border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
							required
						/>
					</div>

					<div className="space-y-1 md:space-y-2">
						<label htmlFor="role" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
							Role
						</label>
						<select
							id="role"
							value={role}
							onChange={(event) => setRole(event.target.value as UserRole)}
							className="w-full h-10 md:h-11 rounded-lg border text-xs md:text-sm text-slate-500 bg-slate-200 border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
						>
							{ROLE_OPTIONS.map((item) => (
								<option key={item} value={item}>
									{item}
								</option>
							))}
						</select>
					</div>

					<div className="md:col-span-2 lg:col-span-3 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 md:gap-3">
						<button
							type="submit"
							className="inline-flex items-center gap-2 h-10 md:h-11 px-3 md:px-5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs md:text-sm font-semibold transition-colors"
						>
							<UserPlus size={14} />
							<span className="hidden md:inline">{submitLabel}</span>
							<span className="md:hidden">{submitLabel.split(' ')[0]}</span>
						</button>
						{editingId && (
							<button
								type="button"
								onClick={resetForm}
								className="inline-flex items-center h-10 md:h-11 px-3 md:px-5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-semibold transition-colors"
							>
								Batal Edit
							</button>
						)}
					</div>
				</form>
			</section>

			<section className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4">
				<div className="flex items-start md:items-center gap-2 md:gap-3">
					<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0 md:h-10 md:w-10">
						<Users2 size={16} />
					</span>
					<div className="min-w-0">
						<h2 className="text-sm md:text-base lg:text-lg font-bold text-slate-900">Daftar User</h2>
						<p className="text-xs text-slate-500">Sumber data: core.profiles</p>
					</div>
				</div>

				<div className="w-full overflow-x-auto">
					<table className="min-w-200 w-full border-separate border-spacing-0">
						<thead>
							<tr>
								<th className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">User ID</th>
								<th className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">Nama</th>
								<th className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">Role</th>
								<th className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">Phone</th>
								<th className="border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">Tanggal Terdaftar</th>
								<th className="sticky right-0 z-10 border-b border-slate-200 bg-slate-50/80 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-500 md:px-4 md:py-3 md:text-[11px]">Aksi</th>
							</tr>
						</thead>
						<tbody>
							{sortedUsers.map((user) => (
								<tr key={user.id} className="transition-colors hover:bg-slate-50/70">
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-[10px] md:text-xs text-slate-600 font-mono sticky left-0 z-10 bg-white hover:bg-slate-50/70\">{user.id.slice(0, 8)}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm font-semibold text-slate-800 whitespace-nowrap\">{user.nama}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">
										<span className={`inline-flex items-center rounded-md border px-2 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold ${ROLE_BADGE_MAP[user.role]} whitespace-nowrap`}>
											{user.role}
										</span>
									</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-slate-700 text-xs md:text-sm text-slate-700\">{user.phone}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">
										<span className="whitespace-nowrap">{new Intl.DateTimeFormat('id-ID', {
											dateStyle: 'short',
											timeStyle: 'short',
										}).format(new Date(user.created_at))}</span>
									</td>
									<td className="sticky right-0 z-10 border-b border-slate-100 bg-white px-3 py-2 text-xs hover:bg-slate-50/70 md:px-4 md:py-3">
										<div className="flex items-center gap-1 md:gap-2">
											<button
												type="button"
												onClick={() => handleEdit(user)}
												className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 whitespace-nowrap md:px-2.5 md:py-1.5 md:text-xs"
											>
												<Pencil size={12} />
												<span className="hidden md:inline">Edit</span>
											</button>
											<button
												type="button"
												onClick={() => handleDelete(user.id)}
												className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 whitespace-nowrap md:px-2.5 md:py-1.5 md:text-xs"
											>
												<Trash2 size={12} />
												<span className="hidden md:inline">Hapus</span>
											</button>
										</div>
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
