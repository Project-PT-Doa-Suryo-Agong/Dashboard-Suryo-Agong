"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CreditCard,
  Users,
  Factory,
  Truck,
  BarChart2,
  Palette,
} from "lucide-react";
import type { ApiError, ApiSuccess } from "@/types/api";

const departments = [
  {
    title: "Finance",
    icon: CreditCard,
    description:
      "Centralized accounting, real-time auditing, and comprehensive fiscal reporting modules.",
  },
  {
    title: "Human Resources",
    icon: Users,
    description:
      "Talent acquisition, payroll integration, and employee lifecycle management tools.",
  },
  {
    title: "Production & QC",
    icon: Factory,
    description:
      "Monitor manufacturing lines and quality assurance benchmarks in real-time.",
  },
  {
    title: "Logistics",
    icon: Truck,
    description:
      "Supply chain optimization, fleet tracking, and global distribution logistics.",
  },
  {
    title: "Management",
    icon: BarChart2,
    description:
      "Strategic oversight, KPI dashboards, and executive decision-making support.",
  },
  {
    title: "Creative",
    icon: Palette,
    description:
      "Digital asset management, brand guidelines, and creative campaign collaboration.",
  },
];

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#33465c] text-slate-100 font-sans antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-900/60 px-4 py-4 backdrop-blur-lg md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Suryo Agong Logo"
              width={130}
              height={38}
              className="h-9 w-auto md:h-10 lg:h-11"
              priority
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/buku-tamu"
              className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition-all duration-200 hover:bg-white/10 hover:text-white md:px-5 md:text-sm"
            >
              Buku Tamu
            </Link>
            <Link
              href="/auth/login"
              className="flex h-10 items-center justify-center rounded-xl bg-[#BC934B] px-5 text-xs font-bold text-white shadow-lg shadow-[#BC934B]/20 transition-all duration-200 hover:bg-[#A88444] hover:shadow-[#BC934B]/30 hover:scale-[1.02] active:scale-[0.98] md:px-6 md:text-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="grow flex flex-col justify-center">
        {/* Hero Section */}
        <section className="relative mx-auto flex max-w-5xl flex-col items-center justify-center px-4 pt-16 pb-12 text-center md:pt-24 md:pb-16 lg:px-8">
          <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-white md:mb-6 md:text-5xl lg:text-6xl">
            Unified Enterprise Dashboard
          </h1>
          <p className="mb-8 max-w-2xl text-sm font-normal leading-relaxed text-white md:mb-10 md:text-base lg:text-lg">
            Seamlessly manage Finance, HR, Production, and more from one intelligent ecosystem. Designed for modern scale, efficiency, and collaboration.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row lg:gap-4">
            <Link
              href="/auth/login"
              className="flex h-12 items-center justify-center rounded-xl bg-[#BC934B] px-8 text-sm font-bold text-white shadow-lg shadow-[#BC934B]/20 transition-all duration-200 hover:bg-[#A88444] hover:shadow-[#BC934B]/30 hover:scale-[1.02] active:scale-[0.98] md:h-13 md:text-base"
            >
              Access System
            </Link>
            <Link
              href="/buku-tamu"
              className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-8 text-sm font-bold text-slate-200 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-[1.02] active:scale-[0.98] md:h-13 md:text-base"
            >
              Isi Buku Tamu
            </Link>
          </div>
        </section>

        {/* Departments Grid Section */}
        <section className="mx-auto max-w-7xl px-4 pb-20 md:pb-28 lg:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-6 lg:p-8"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#BC934B]/10 text-[#BC934B] transition-colors duration-300 group-hover:bg-[#BC934B] group-hover:text-white md:h-14 md:w-14">
                    <dept.icon className="h-6 w-6 md:h-7 md:w-7" />
                  </div>
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900 transition-colors duration-200 group-hover:text-[#BC934B] md:text-lg lg:text-xl">
                  {dept.title}
                </h3>
                <p className="grow text-xs leading-relaxed text-slate-600 md:text-sm">
                  {dept.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="w-full bg-slate-950/60 border-t border-white/5 py-6 text-slate-400 md:py-8">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs md:text-sm">&copy; {new Date().getFullYear()} PT DOA SURYO AGONG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
