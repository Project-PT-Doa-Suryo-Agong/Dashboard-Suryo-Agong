"use client";

import Link from "next/link";
import {
	AlertOctagon,
	ArrowRight,
	CalendarDays,
	ShieldAlert,
	UserCheck,
	Users,
} from "lucide-react";

type AttendanceStatus = "hadir" | "izin" | "sakit" | "alpha";

type AttendanceItem = {
	id: string;
	employeeName: string;
	status: AttendanceStatus;
	tanggal: string;
};

type WarningItem = {
	id: string;
	employeeName: string;
	level: string;
	tanggal: string;
};

const todayDate = "2026-03-13";

const attendanceData: AttendanceItem[] = [
	{ id: "att-001", employeeName: "Rani Wulandari", status: "hadir", tanggal: todayDate },
	{ id: "att-002", employeeName: "Bima Pratama", status: "hadir", tanggal: todayDate },
	{ id: "att-003", employeeName: "Nadia Putri", status: "izin", tanggal: todayDate },
	{ id: "att-004", employeeName: "Dwi Firmansyah", status: "hadir", tanggal: todayDate },
	{ id: "att-005", employeeName: "Salsa Maharani", status: "sakit", tanggal: todayDate },
	{ id: "att-006", employeeName: "Farhan Maulana", status: "alpha", tanggal: todayDate },
];

const warningData: WarningItem[] = [
	{ id: "wrn-001", employeeName: "Nadia Putri", level: "SP1", tanggal: "2026-03-12" },
	{ id: "wrn-002", employeeName: "Agus Setiawan", level: "Teguran Lisan", tanggal: "2026-03-10" },
	{ id: "wrn-003", employeeName: "Dwi Firmansyah", level: "SP2", tanggal: "2026-03-07" },
	{ id: "wrn-004", employeeName: "Bima Pratama", level: "SP3", tanggal: "2026-03-03" },
	{ id: "wrn-005", employeeName: "Salsa Maharani", level: "SP1", tanggal: "2026-03-01" },
];

const quickLinks = [
	{
		title: "Data Karyawan",
		description: "Kelola Database Karyawan",
		href: "/hr/karyawan",
		icon: Users,
	},
	{
		title: "Rekap Presensi",
		description: "Rekap Presensi Harian",
		href: "/hr/attendance",
		icon: CalendarDays,
	},
	{
		title: "Surat Peringatan",
		description: "Log Pelanggaran & SP",
		href: "/hr/warnings",
		icon: ShieldAlert,
	},
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
	day: "2-digit",
	month: "short",
	year: "numeric",
});

function warningBadgeClass(level: string) {
	if (level === "SP1") return "bg-amber-100 text-amber-700";
	if (level === "SP2") return "bg-orange-100 text-orange-700";
	if (level === "SP3") return "bg-red-100 text-red-700";
	return "bg-slate-200 text-slate-700";
}

export default function HrDashboardPage() {
	const totalKaryawan = 156;
	const totalAktif = 142;
	const totalNonaktif = 14;

	const hadirCount = attendanceData.filter((item) => item.status === "hadir").length;
	const izinCount = attendanceData.filter((item) => item.status === "izin").length;
	const sakitCount = attendanceData.filter((item) => item.status === "sakit").length;
	const alphaCount = attendanceData.filter((item) => item.status === "alpha").length;
	const totalAttendance = attendanceData.length;
	const hadirRate = totalAttendance > 0 ? Math.round((hadirCount / totalAttendance) * 100) : 0;
	const izinSakitCount = izinCount + sakitCount;

	const monthlyWarningCount = warningData.length;
	const recentWarnings = warningData.slice(0, 4);

	const attendanceOverview = [
		{ label: "Hadir", value: hadirCount, className: "bg-emerald-500" },
		{ label: "Izin", value: izinCount, className: "bg-amber-500" },
		{ label: "Sakit", value: sakitCount, className: "bg-blue-500" },
		{ label: "Alpha", value: alphaCount, className: "bg-red-500" },
	];

	return (
		<div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-bold text-slate-100 md:text-3xl">
					Dashboard Utama HR
				</h1>
				<p className="text-sm text-slate-200 md:text-base">
					Ringkasan eksekutif divisi SDM per Jumat, 13 Maret 2026.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Total Karyawan
							</p>
							<p className="mt-1 whitespace-nowrap text-2xl font-bold text-slate-900 md:text-3xl">
								{totalKaryawan}
							</p>
							<p className="mt-1 text-xs text-slate-600 md:text-sm">
								{totalAktif} Aktif, {totalNonaktif} Nonaktif
							</p>
						</div>
						<div className="rounded-lg bg-slate-100 p-2 text-slate-700">
							<Users size={18} />
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Presensi Hari Ini
							</p>
							<p className="mt-1 whitespace-nowrap text-2xl font-bold text-slate-900 md:text-3xl">
								{hadirRate}%
							</p>
							<p className="mt-1 text-xs text-slate-600 md:text-sm">
								{hadirCount} Hadir, {izinSakitCount} Izin/Sakit
							</p>
						</div>
						<div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
							<UserCheck size={18} />
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2 xl:col-span-1">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0">
							<p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
								Peringatan Aktif
							</p>
							<p className="mt-1 whitespace-nowrap text-2xl font-bold text-slate-900 md:text-3xl">
								{monthlyWarningCount} SP
							</p>
							<p className="mt-1 text-xs text-slate-600 md:text-sm">
								Diterbitkan sepanjang Maret 2026
							</p>
						</div>
						<div className="rounded-lg bg-red-100 p-2 text-red-700">
							<AlertOctagon size={18} />
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
				{quickLinks.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#BC934B]"
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-sm font-semibold text-slate-900">{item.title}</p>
									<p className="mt-1 text-xs text-slate-600 md:text-sm">{item.description}</p>
								</div>
								<div className="rounded-lg bg-slate-100 p-2 text-slate-700 transition group-hover:bg-[#BC934B]/10 group-hover:text-[#BC934B]">
									<Icon size={18} />
								</div>
							</div>
							<div className="mt-4 flex items-center justify-end text-xs font-semibold text-slate-500 transition group-hover:text-[#BC934B]">
								Lihat Detail
								<ArrowRight size={14} className="ml-1" />
							</div>
						</Link>
					);
				})}
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between gap-3">
						<h2 className="text-base font-bold text-slate-900 md:text-lg">Recent Warnings</h2>
						<span className="text-xs text-slate-500">4 catatan terakhir</span>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-max w-full">
							<thead>
								<tr className="border-b border-slate-100 text-left">
									<th className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
										Nama
									</th>
									<th className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
										Level
									</th>
									<th className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
										Tanggal
									</th>
								</tr>
							</thead>
							<tbody>
								{recentWarnings.map((item) => (
									<tr key={item.id} className="border-b border-slate-50 last:border-b-0">
										<td className="px-1 py-2.5 text-sm font-medium text-slate-900">
											{item.employeeName}
										</td>
										<td className="px-1 py-2.5 text-sm">
											<span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${warningBadgeClass(item.level)}`}>
												{item.level}
											</span>
										</td>
										<td className="whitespace-nowrap px-1 py-2.5 text-sm text-slate-600">
											{dateFormatter.format(new Date(item.tanggal))}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
					<div className="mb-3 flex items-center justify-between gap-3">
						<h2 className="text-base font-bold text-slate-900 md:text-lg">Today's Attendance Overview</h2>
						<span className="text-xs text-slate-500">{todayDate}</span>
					</div>

					<div className="space-y-3">
						{attendanceOverview.map((item) => {
							const width = totalAttendance > 0 ? Math.round((item.value / totalAttendance) * 100) : 0;
							return (
								<div key={item.label} className="space-y-1.5">
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium text-slate-700">{item.label}</span>
										<span className="font-semibold text-slate-900">{item.value}</span>
									</div>
									<div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
										<div className={`h-full rounded-full ${item.className}`} style={{ width: `${width}%` }} />
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
}
