"use client";

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, UserPlus, Users2 } from 'lucide-react';
import type { ApiError, ApiSuccess } from '@/types/api';
import type { CoreUserRole, Profile } from '@/types/supabase';
import { apiFetch } from "@/lib/utils/api-fetch";

type UserRole = CoreUserRole;

type SystemRoleKey =
	| 'management'
	| 'finance'
	| 'hr'
	| 'produksi'
	| 'logistik'
	| 'creative'
	| 'office'
	| 'developer';

type ProfilesListPayload = {
	profiles: Profile[];
	meta: {
		page: number;
		limit: number;
		total: number;
	};
};

type ProfilePayload = {
	profile: Profile | null;
};

const ROLE_OPTIONS: Array<{ key: SystemRoleKey; label: UserRole }> = [
	{ key: 'developer', label: 'Developer' },
	{ key: 'management', label: 'Management & Strategy' },
	{ key: 'finance', label: 'Finance & Administration' },
	{ key: 'hr', label: 'HR & Operation Manager' },
	{ key: 'produksi', label: 'Produksi & Quality Control' },
	{ key: 'logistik', label: 'Logistics & Packing' },
	{ key: 'creative', label: 'Creative & Sales' },
	{ key: 'office', label: 'Office Support' },
];

const LABEL_TO_ROLE_KEY = new Map<UserRole, SystemRoleKey>(ROLE_OPTIONS.map((item) => [item.label, item.key]));

const ROLE_BADGE_MAP: Record<UserRole, string> = {
	Developer: 'bg-purple-100 text-purple-700 border-purple-200',
	'Management & Strategy': 'bg-slate-900 text-white border-slate-900',
	'Finance & Administration': 'bg-emerald-100 text-emerald-700 border-emerald-200',
	'HR & Operation Manager': 'bg-sky-100 text-sky-700 border-sky-200',
	'Produksi & Quality Control': 'bg-amber-100 text-amber-700 border-amber-200',
	'Logistics & Packing': 'bg-orange-100 text-orange-700 border-orange-200',
	'Creative & Sales': 'bg-pink-100 text-pink-700 border-pink-200',
	'Office Support': 'bg-indigo-100 text-indigo-700 border-indigo-200',
	CEO: 'bg-slate-800 text-white border-slate-800',
	Finance: 'bg-emerald-50 text-emerald-600 border-emerald-100',
	HR: 'bg-sky-50 text-sky-600 border-sky-100',
	Produksi: 'bg-amber-50 text-amber-600 border-amber-100',
	Logistik: 'bg-orange-50 text-orange-600 border-orange-100',
	Creative: 'bg-pink-50 text-pink-600 border-pink-100',
	Office: 'bg-indigo-50 text-indigo-600 border-indigo-100',
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Terjadi kesalahan.' : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

export default function DeveloperUsersPage() {
	const [users, setUsers] = useState<Profile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [nama, setNama] = useState('');
	const [phone, setPhone] = useState('');
	const [role, setRole] = useState<SystemRoleKey>('developer');

	const submitLabel = editingId ? 'Update User' : 'Tambah User';

	const fetchUsers = async () => {
		setIsLoading(true);
		setErrorMessage(null);
		try {
			const response = await apiFetch('/api/profiles?page=1&limit=500', {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				cache: 'no-store',
			});
			const payload = await parseJsonResponse<ProfilesListPayload>(response);
			setUsers(payload.data.profiles ?? []);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Gagal memuat data user.';
			setErrorMessage(message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchUsers();
	}, []);

	const sortedUsers = useMemo(
		() => [...users].sort((a, b) => {
			const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
			const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
			return bTime - aTime;
		}),
		[users],
	);

	const resetForm = () => {
		setEditingId(null);
		setEmail('');
		setPassword('');
		setNama('');
		setPhone('');
		setRole('developer');
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!nama.trim()) return;

		if (!editingId && (!email.trim() || password.length < 6)) {
			setErrorMessage('Email wajib diisi dan password minimal 6 karakter.');
			return;
		}

		setErrorMessage(null);

		try {
			if (editingId) {
				const response = await apiFetch(`/api/profiles/${editingId}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						nama: nama.trim(),
						phone: phone.trim() || null,
						role,
					}),
				});
				await parseJsonResponse<ProfilePayload>(response);
			} else {
				const response = await apiFetch('/api/profiles', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						email: email.trim(),
						password,
						nama: nama.trim(),
						phone: phone.trim() || null,
						role,
					}),
				});
				await parseJsonResponse<ProfilePayload>(response);
			}

			await fetchUsers();
			resetForm();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Gagal menyimpan user.';
			setErrorMessage(message);
		}
	};

	const handleEdit = (user: Profile) => {
		setEditingId(user.id);
		setNama(user.nama);
		setPhone(user.phone ?? '');
		setRole(LABEL_TO_ROLE_KEY.get(user.role) ?? 'developer');
		setPassword('');
		setEmail('');
	};

	const handleDelete = async (id: string) => {
		if (!window.confirm('Yakin ingin menghapus user ini?')) return;
		setErrorMessage(null);
		try {
			const response = await apiFetch(`/api/profiles/${id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			await parseJsonResponse<null>(response);
			await fetchUsers();
			if (editingId === id) resetForm();
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Gagal menghapus user.';
			setErrorMessage(message);
		}
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
						<label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							placeholder="nama@domain.com"
							disabled={!!editingId}
							required={!editingId}
							className="w-full h-10 md:h-11 text-xs md:text-sm text-slate-500 bg-slate-200 rounded-lg border border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20 disabled:opacity-60"
						/>
					</div>

					<div className="space-y-1 md:space-y-2">
						<label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							placeholder={editingId ? 'Password tidak diubah di mode edit' : 'Minimal 6 karakter'}
							disabled={!!editingId}
							required={!editingId}
							className="w-full h-10 md:h-11 text-xs md:text-sm text-slate-500 bg-slate-200 rounded-lg border border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20 disabled:opacity-60"
						/>
					</div>

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
							onChange={(event) => setRole(event.target.value as SystemRoleKey)}
							className="w-full h-10 md:h-11 rounded-lg border text-xs md:text-sm text-slate-500 bg-slate-200 border-slate-300 px-2 md:px-3 outline-none focus:border-slate-200 focus:ring-2 focus:ring-slate-200/20"
						>
							{ROLE_OPTIONS.map((item) => (
								<option key={item.key} value={item.key}>
									{item.label}
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
				{errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
			</section>

			<section className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 md:p-4 lg:p-6 space-y-3 md:space-y-4">
				<div className="flex items-start md:items-center gap-2 md:gap-3">
					<span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0 md:h-10 md:w-10">
						<Users2 size={16} />
					</span>
					<div className="min-w-0">
						<h2 className="text-sm md:text-base lg:text-lg font-bold text-slate-900">Daftar User</h2>
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
							{isLoading ? (
								<tr>
									<td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Memuat data user...</td>
								</tr>
							) : sortedUsers.length === 0 ? (
								<tr>
									<td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">Belum ada data user.</td>
								</tr>
							) : (
								sortedUsers.map((user) => (
								<tr key={user.id} className="transition-colors hover:bg-slate-50/70">
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-[10px] md:text-xs text-slate-600 font-mono sticky left-0 z-10 bg-white hover:bg-slate-50/70">{user.id.slice(0, 8)}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">{user.nama?.trim() || '-'}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">
										<span className={`inline-flex items-center rounded-md border px-2 md:px-2.5 py-0.5 md:py-1 text-[10px] md:text-xs font-semibold ${ROLE_BADGE_MAP[user.role] ?? 'bg-slate-100 text-slate-700 border-slate-200'} whitespace-nowrap`}>
											{user.role}
										</span>
									</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">{user.phone?.trim() || '-'}</td>
									<td className="px-3 md:px-4 py-2 md:py-3 border-b border-slate-100 text-xs md:text-sm text-slate-700">
										<span className="whitespace-nowrap">{user.created_at ? new Intl.DateTimeFormat('id-ID', {
											dateStyle: 'short',
											timeStyle: 'short',
										}).format(new Date(user.created_at)) : '-'}</span>
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
												onClick={() => void handleDelete(user.id)}
												className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-700 transition-colors hover:bg-rose-100 whitespace-nowrap md:px-2.5 md:py-1.5 md:text-xs"
											>
												<Trash2 size={12} />
												<span className="hidden md:inline">Hapus</span>
											</button>
										</div>
									</td>
								</tr>
							))
							)}
						</tbody>
					</table>
				</div>
			</section>
		</div>
	);
}
