"use client";

import { useState } from "react";
import Image from "next/image";
import { ShieldCheck, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginPage() {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setLoading(true);

		const formData = new FormData(e.currentTarget);
		const email = String(formData.get("email") ?? "").trim();
		const password = String(formData.get("password") ?? "");

		const supabase = createSupabaseBrowserClient();
    
		const { data, error: authError } = await supabase.auth
		  .signInWithPassword({ email, password });

		if (authError) {
		  setError(authError.message);
		  setLoading(false);
		  return;
		}

		// Get role from profile
		let role =
		  (typeof data.user?.user_metadata?.role === "string"
			? data.user.user_metadata.role : null) ??
		  (typeof data.user?.app_metadata?.role === "string"
			? data.user.app_metadata.role : null);

		if (!role && data.user?.id) {
		  const { data: profile } = await supabase
			.schema("core")
			.from("profiles")
			.select("role")
			.eq("id", data.user.id)
			.maybeSingle();
		  role = typeof profile?.role === "string" 
			? profile.role : null;
		}

		// Map role to subdomain
		const slugMapToSubdomain = (rawRole: string | null | undefined): string => {
			if (!rawRole) return "management";
			const slug = rawRole.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

			const exactMap: Record<string, string> = {
				"developer":           "developer",
				"senior-developer":    "developer",
				"ceo":                 "management",
				"management":          "management",
				"manager":             "management",
				"management-strategy": "management",
				"management-strategic":"management",
				"finance":             "finance",
				"finance-accounting":  "finance",
				"finance-team":        "finance",
				"hr":                  "hr",
				"human-resource":      "hr",
				"human-resources":     "hr",
				"human-resource-dept": "hr",
				"human-resources-dept":"hr",
				"produksi":            "produksi",
				"production":          "produksi",
				"produksi-team":       "produksi",
				"logistik":            "logistik",
				"logistics":           "logistik",
				"logistik-team":       "logistik",
				"creative":            "creative",
				"creative-manager":    "creative",
				"sales":               "creative",
				"creative-sales":      "creative",
				"office":              "office",
				"office-support":      "office",
			};

			if (exactMap[slug]) return exactMap[slug];

			if (slug.includes("developer"))  return "developer";
			if (slug.includes("management")) return "management";
			if (slug.includes("ceo"))        return "management";
			if (slug.includes("finance"))    return "finance";
			if (slug.includes("human-resource")) return "hr";
			if (slug.includes("produksi"))   return "produksi";
			if (slug.includes("production")) return "produksi";
			if (slug.includes("logistik"))   return "logistik";
			if (slug.includes("logistics"))  return "logistik";
			if (slug.includes("creative"))   return "creative";
			if (slug.includes("sales"))      return "creative";
			if (slug.includes("office"))     return "office";
			if (slug.includes("hr"))         return "hr";

			return "management";
		};

		const subdomain = slugMapToSubdomain(role);
		const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
		  || "http://lvh.me:3000";
		const base = new URL(siteUrl);
		const redirectUrl = 
		  `${base.protocol}//${subdomain}.${base.hostname}` +
		  (base.port ? `:${base.port}` : "");

		// Hard navigation to subdomain
		window.location.href = redirectUrl;
	}

	return (
		<div className="bg-slate-700 font-display flex min-h-screen items-center justify-center p-4">
			<div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 shadow-2xl">
				<div className="border-b border-slate-100 px-6 pb-5 pt-7 text-center">
					<div className=" flex items-center justify-center">
						<Image
							src="/logo.png"
							alt="Suryo Agong Logo"
							width={170}
							height={50}
							className="h-11 w-auto"
						/>
					</div>
					<h1 className="text-2xl font-bold tracking-tight text-slate-900">Enterprise Login</h1>
					<p className="mt-2 text-sm text-slate-500">
						Masuk menggunakan akun resmi untuk mengakses dashboard divisi.
					</p>
				</div>

				<div className="px-6 pb-7 pt-6">
					{error && (
						<div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
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
								disabled={loading}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:opacity-50"
								placeholder="nama@perusahaan.com"
							/>
						</div>

						<div className="space-y-2">
							<label htmlFor="password" className="text-sm font-semibold text-slate-700">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								disabled={loading}
								className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#BC934B] focus:ring-2 focus:ring-[#BC934B]/20 disabled:opacity-50"
								placeholder="Masukkan password"
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#BC934B] px-4 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-[#A88444] disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Memproses...
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
		</div>
	);
}
