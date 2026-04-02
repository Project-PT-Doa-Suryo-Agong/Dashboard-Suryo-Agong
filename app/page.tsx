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
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#999999] font-display antialiased">
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#333333]/90 px-3 py-3 backdrop-blur-md md:px-4 md:py-4 lg:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Image
              src="/logo.png"
              alt="NexusCore Logo"
              width={120}
              height={36}
              className="h-8 w-auto md:h-9 lg:h-10"
            />
          </div>
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/login`}
            className="flex h-10 w-full items-center justify-center rounded-lg bg-[#BC934B] px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-opacity-90 sm:w-auto md:px-6 md:text-sm lg:text-base"
          >
            Sign In
          </a>
        </div>
      </nav>

      <main className="grow">
        <section className="mx-auto flex max-w-4xl flex-col items-center justify-center px-3 py-7 text-center md:px-4 md:py-20 lg:px-6 lg:py-20">
          <h1 className="mb-4 text-lg font-black leading-tight tracking-tight text-white drop-shadow-sm md:mb-6 md:text-2xl lg:text-3xl">
            Unified Enterprise <span className="text-primary drop-shadow-none">Dashboard</span>
          </h1>
          <p className="mb-6 max-w-2xl text-xs font-medium leading-relaxed text-white opacity-90 md:mb-8 md:text-sm lg:mb-10 lg:text-base">
            Seamlessly manage Finance, HR, Production, and more from one intelligent ecosystem. Designed for modern scale.
          </p>
          <div className="flex w-full flex-col justify-center gap-2 md:gap-3 sm:w-auto sm:flex-row lg:gap-4">
            <a
              href={`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/login`}
              className="flex h-11 items-center justify-center rounded-xl bg-[#BC934B] px-5 text-sm font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 md:h-12 md:px-6 md:text-base lg:h-14 lg:px-8 lg:text-lg"
            >
              Access System
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-3 pb-12 md:px-4 md:pb-16 lg:px-6 lg:pb-24">
          <div className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="relative flex flex-col rounded-xl border border-slate-100 bg-white p-3 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-4 lg:p-6"
              >
                <div className="mb-3 flex items-start justify-between md:mb-4 lg:mb-6">
                  <dept.icon className="h-8 w-8 shrink-0 text-[#BC934B] md:h-10 md:w-10 lg:h-12 lg:w-12" />
                </div>

                <h3 className="mb-2 text-sm font-bold text-slate-900 md:text-base lg:text-lg">{dept.title}</h3>
                <p className="grow text-xs leading-relaxed text-slate-600 md:text-sm lg:text-base">{dept.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto w-full bg-[#1F2937] px-2 py-4 text-slate-300 md:px-4 md:py-8 lg:px-6 lg:py-12">
        <div className="text-center">
          <p className="text-xs text-slate-400 md:text-sm lg:text-base">&copy; {new Date().getFullYear()} PT DOA SURYO AGONG. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
