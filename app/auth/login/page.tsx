"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	type LoginResponse = {
		redirectUrl?: string;
	};

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		const formData = new FormData(e.currentTarget);
		const email = String(formData.get("email") ?? "").trim();
		const password = String(formData.get("password") ?? "");

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ email, password }),
			});

			const payload = (await response.json()) as {
				success?: boolean;
				message?: string;
				error?: { message?: string };
				data?: LoginResponse;
			};

			if (!response.ok || !payload.success) {
				setError(payload.error?.message || payload.message || "Login gagal.");
				return;
			}

			const redirectUrl = payload.data?.redirectUrl;
			window.location.href = redirectUrl || "/management";
		} catch {
			setError("Terjadi kesalahan saat login. Silakan coba lagi.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="font-display flex min-h-screen bg-slate-50">
			{/* Left Column: Form */}
			<div className="relative flex w-full flex-col bg-slate-700 justify-center px-4 sm:px-6 md:px-8 lg:w-1/2 lg:px-12 xl:px-24">
				<div className="absolute top-6 left-6 md:top-8 md:left-8">
					<Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-[#BC934B]">
						<ArrowLeft className="h-6 w-6" />
						<p className="text-lg">Kembali</p>
					</Link>
				</div>
				<div className="mx-auto w-full max-w-md space-y-8">
					<div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
						<Image
							src="/logo.png"
							alt="Suryo Agong Logo"
							width={170}
							height={50}
							className="h-15 w-auto"
						/>
						<div>
							<h1 className="text-3xl font-bold tracking-tight text-slate-100">Masuk</h1>
							<p className="mt-2 text-sm text-slate-300">
								Silakan masukkan email dan password Anda.
							</p>
						</div>
					</div>

					{error && (
						<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5 mt-8">
						<div className="space-y-2">
							<label htmlFor="email" className="text-sm font-semibold text-slate-700">
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								disabled={isLoading}
								className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:opacity-50"
								placeholder="nama@perusahaan.com"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-semibold text-slate-700">
								Password
							</label>
							<div className="relative">
								<input
									id="password"
									name="password"
									type={showPassword ? "text" : "password"}
									autoComplete="current-password"
									required
									disabled={isLoading}
									className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:opacity-50"
									placeholder="Masukkan password"
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
									tabIndex={-1}
								>
									{showPassword ? (
										<EyeOff className="h-5 w-5" />
									) : (
										<Eye className="h-5 w-5" />
									)}
								</button>
							</div>
						</div>

						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-3 mt-4 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#A88444] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isLoading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Loading...
								</>
							) : (
								<>
									<ShieldCheck className="h-4 w-4" />
									Login
								</>
							)}
						</button>
					</form>
				</div>
			</div>

			{/* Right Column: Decorative Image */}
			<div className="relative hidden w-0 flex-1 lg:block bg-slate-900">
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay"
					src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop"
					alt="Office Background"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent"></div>
				
				<div className="absolute inset-x-0 bottom-50 p-16 xl:p-24">
					<h2 className="text-4xl font-bold tracking-tight text-white mb-4">
						Enterprise Login
					</h2>
					<p className="text-lg text-slate-300 max-w-lg">
						Masuk menggunakan akun resmi untuk mengakses dashboard divisi Anda.
					</p>
				</div>
			</div>
		</div>
	);
}
