"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  LogIn,
  Mail,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

type AuthMePayload = {
  role: string | null;
  profileRole: string | null;
};

const ROLE_TO_DASHBOARD: Record<string, string> = {
  developer: "/developer",
  ceo: "/management",
  management: "/management",
  finance: "/finance",
  hr: "/hr",
  "human resource": "/hr",
  produksi: "/produksi",
  production: "/produksi",
  logistik: "/logistik",
  logistics: "/logistik",
  creative: "/creative",
  sales: "/creative",
  office: "/office",
};

function normalizeRole(role: string | null | undefined) {
  return (role ?? "").trim().toLowerCase();
}

function resolveDashboardPath(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return ROLE_TO_DASHBOARD[normalized] ?? "/";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Email atau password tidak valid.");
        return;
      }

      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const payload = (await response.json()) as { success: boolean; data?: AuthMePayload };
        const role = payload.data?.profileRole ?? payload.data?.role ?? null;
        const normalizedRole = normalizeRole(role);

        if (normalizedRole) {
          document.cookie = `role=${encodeURIComponent(normalizedRole)}; Path=/; Max-Age=604800; SameSite=Lax`;
        } else {
          document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
        }

        router.push(resolveDashboardPath(role));
        router.refresh();
        return;
      }

      router.push("/");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat login.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-[#999999] font-display flex min-h-screen flex-col items-center justify-center p-3 transition-colors duration-300 md:p-4 lg:p-6">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#333333]">
        <div className="flex flex-col items-center px-4 pb-3 pt-6 md:px-6 md:pt-8 lg:px-8">
          <div className="mb-4 flex items-center justify-center md:mb-6">
            <Image
              src="/logo.png"
              alt="Suryo Agong Logo"
              width={160}
              height={48}
              className="h-10 w-auto md:h-12 lg:h-14"
            />
          </div>
          <h1 className="text-center text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl lg:text-3xl">
            Employee Login
          </h1>
          <p className="mt-2 px-2 text-center text-xs font-normal text-slate-500 dark:text-[#999999] md:px-4 md:text-sm lg:text-base">
            Masuk menggunakan email dan password akun karyawan.
          </p>
        </div>

        <div className="mt-3 px-4 pb-6 md:mt-4 md:px-6 md:pb-8 lg:px-8 lg:pb-10">
          <form onSubmit={handleLogin} className="space-y-4 md:space-y-6 lg:space-y-8">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:text-base lg:text-lg">
                <Mail className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" />
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-[#666666] dark:text-slate-100 md:px-4 md:text-sm lg:text-base"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:text-base lg:text-lg">
                <Lock className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" />
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-[#666666] dark:text-slate-100 md:px-4 md:text-sm lg:text-base"
              />
            </div>

            {errorMessage ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 md:text-sm">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#BC934B] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#BC934B]/20 transition-all hover:bg-[#BC934B]/90 md:py-3.5 md:text-sm lg:text-base"
            >
              <span>{isLoading ? "Authenticating..." : "Enter Dashboard"}</span>
              <LogIn className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
            </button>
          </form>
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50 md:px-6 md:py-4 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:text-xs lg:text-sm">
            Suryo Agong Enterprise Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}