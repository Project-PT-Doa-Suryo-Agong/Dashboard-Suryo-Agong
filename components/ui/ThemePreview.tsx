"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { primaryHoverColor } from "@/lib/utils/color";

interface ThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  appName: string;
  companyName: string;
  logoUrl: string;
  landingBackground: string;
  landingPrimary: string;
  landingSecondary: string;
  loginBackground: string;
  loginPrimary: string;
  loginSecondary: string;
  dashboardBackground: string;
  dashboardPrimary: string;
  dashboardSecondary: string;
  sidebarBackground: string;
}

interface WindowProps {
  title: string;
  children: ReactNode;
}

function Window({ title, children }: WindowProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </span>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function BrandLogo({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={`${className} object-contain`} />
  );
}

export default function ThemePreview({
  primaryColor,
  secondaryColor,
  appName,
  companyName,
  logoUrl,
  landingBackground,
  landingPrimary,
  landingSecondary,
  loginBackground,
  loginPrimary,
  loginSecondary,
  dashboardBackground,
  dashboardPrimary,
  dashboardSecondary,
  sidebarBackground,
}: ThemePreviewProps) {
  const themeVars = {
    "--brand-primary": dashboardPrimary,
    "--brand-primary-hover": primaryHoverColor(dashboardPrimary),
    "--brand-secondary": dashboardSecondary,
    "--brand-landing-background": landingBackground,
    "--brand-landing-primary": landingPrimary,
    "--brand-landing-primary-hover": primaryHoverColor(landingPrimary),
    "--brand-landing-secondary": landingSecondary,
    "--brand-login-background": loginBackground,
    "--brand-login-primary": loginPrimary,
    "--brand-login-primary-hover": primaryHoverColor(loginPrimary),
    "--brand-login-secondary": loginSecondary,
    "--brand-dashboard-background": dashboardBackground,
    "--brand-dashboard-primary": dashboardPrimary,
    "--brand-dashboard-primary-hover": primaryHoverColor(dashboardPrimary),
    "--brand-dashboard-secondary": dashboardSecondary,
    "--brand-sidebar-background": sidebarBackground,
  } as CSSProperties;

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Users, label: "Karyawan", active: false },
    { icon: FileText, label: "Laporan", active: false },
    { icon: BarChart3, label: "KPI", active: false },
    { icon: Boxes, label: "Produksi", active: false },
    { icon: Settings, label: "Pengaturan", active: false },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" style={themeVars}>
      {/* Landing Page */}
      <Window title="Landing Page">
        <div className="flex h-full flex-col bg-landing-background">
          <div className="flex items-center justify-between border-b border-white/5 bg-slate-900/60 px-4 py-2.5">
            <BrandLogo src={logoUrl} alt={`${appName} Logo`} className="h-6 w-auto" />
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-slate-200">
                Buku Tamu
              </span>
              <span className="rounded-lg bg-landing-primary px-2.5 py-1 text-[9px] font-bold text-white">
                Sign In
              </span>
            </div>
          </div>
          <div className="flex grow flex-col items-center justify-center px-6 text-center">
            <h3 className="text-lg font-black leading-tight text-white">
              Unified Enterprise Dashboard
            </h3>
            <p className="mt-1.5 max-w-[220px] text-[10px] leading-relaxed text-white/80">
              Seamlessly manage Finance, HR, Production, and more from one
              intelligent ecosystem.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="rounded-lg bg-landing-primary px-3 py-1.5 text-[10px] font-bold text-white">
                Access System
              </span>
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold text-slate-200">
                Isi Buku Tamu
              </span>
            </div>
          </div>
          <div className="border-t border-white/5 bg-slate-950/60 px-4 py-2 text-center text-[9px] text-slate-400">
            &copy; {companyName}
          </div>
        </div>
      </Window>

      {/* Login Page */}
      <Window title="Login Page">
        <div className="flex h-full flex-col bg-login-background px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-auto items-center overflow-hidden rounded-md bg-white/95 px-1.5">
              <BrandLogo src={logoUrl} alt={`${appName} Logo`} className="h-5 w-auto" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-100">{appName}</p>
              <p className="truncate text-[9px] text-slate-300">{companyName}</p>
            </div>
          </div>
          <h4 className="mt-3 text-base font-bold text-slate-100">Masuk</h4>
          <p className="text-[10px] text-slate-300">
            Silakan masukkan email dan password Anda.
          </p>
          <div className="mt-3 space-y-2">
            <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] text-slate-400">
              nama@perusahaan.com
            </div>
            <div className="rounded-lg border border-login-primary bg-white px-2.5 py-1.5 text-[9px] text-slate-400 ring-2 ring-login-primary/20">
              ••••••••
            </div>
          </div>
          <span className="mt-auto flex items-center justify-center gap-1.5 rounded-lg bg-login-primary px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white">
            Login
          </span>
        </div>
      </Window>

      {/* Dashboard / After Login */}
      <Window title="Dashboard / After Login">
        <div className="flex h-full">
          <div className="flex w-24 shrink-0 flex-col bg-sidebar-background px-2 py-3 text-slate-100">
            <BrandLogo src={logoUrl} alt={`${appName} Logo`} className="mb-3 h-4 w-auto" />
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <span
                  key={item.label}
                  className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[8px] font-semibold ${
                    item.active
                      ? "bg-dashboard-primary text-white"
                      : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon size={10} />
                  {item.label}
                </span>
              ))}
            </nav>
            <span className="mt-auto rounded-lg bg-red-500 px-2 py-1.5 text-center text-[8px] font-semibold text-white">
              Logout
            </span>
          </div>
          <div className="flex min-w-0 grow flex-col bg-dashboard-background">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
              <span className="truncate text-[10px] font-bold text-slate-800">
                Dashboard Overview
              </span>
              <span className="h-5 w-5 shrink-0 rounded-full bg-slate-200 text-[8px] font-semibold text-slate-500 flex items-center justify-center">
                SA
              </span>
            </div>
            <div className="grid grow grid-cols-2 gap-2 p-3">
              {[
                { label: "Total Aset", value: "Rp 1.2 M" },
                { label: "Karyawan", value: "48" },
                { label: "Order Aktif", value: "12" },
                { label: "Kunjungan", value: "87" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-2"
                >
                  <p className="text-[8px] text-slate-500">{stat.label}</p>
                  <p className="text-xs font-bold text-dashboard-primary">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 pb-3">
              <span className="rounded-lg bg-dashboard-primary px-3 py-1.5 text-[9px] font-bold text-white">
                Primary
              </span>
              <span className="rounded-lg bg-dashboard-secondary px-3 py-1.5 text-[9px] font-bold text-white">
                Secondary
              </span>
            </div>
          </div>
        </div>
      </Window>
    </div>
  );
}