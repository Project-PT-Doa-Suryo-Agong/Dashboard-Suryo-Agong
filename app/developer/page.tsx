"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  Tags,
  Truck,
  ArrowRight,
  UserCog,
  Server,
} from 'lucide-react';
import type { ApiError, ApiSuccess } from '@/types/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { apiFetch } from "@/lib/utils/api-fetch";

type ProfilesListPayload = {
  profiles: Array<{ id: string }>;
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type DashboardStats = {
  totalUsers: number;
  totalProduk: number;
  totalVarian: number;
  totalVendor: number;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? 'Terjadi kesalahan.' : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

const modules = [
  {
    title: 'Pengelolaan User',
    description:
      'Kelola data user enterprise, role akses, dan validasi profil pada skema core.profiles.',
    href: '/developer/users',
    icon: UserCog,
  },
  {
    title: 'Pengelolaan Database Master',
    description:
      'Atur data master lintas modul untuk memastikan integritas referensi pada seluruh sistem.',
    href: '/developer/master-data',
    icon: Server,
  },
];

export default function DeveloperDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProduk: 0,
    totalVarian: 0,
    totalVendor: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const supabase = createSupabaseBrowserClient();
        const [profilesResponse, produkCountResult, varianCountResult, vendorCountResult] = await Promise.all([
          apiFetch('/api/profiles?page=1&limit=1', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
          }),
          (supabase as unknown as { schema: (schema: string) => typeof supabase })
            .schema('core')
            .from('m_produk')
            .select('id', { count: 'exact', head: true }),
          (supabase as unknown as { schema: (schema: string) => typeof supabase })
            .schema('core')
            .from('m_varian')
            .select('id', { count: 'exact', head: true }),
          (supabase as unknown as { schema: (schema: string) => typeof supabase })
            .schema('core')
            .from('m_vendor')
            .select('id', { count: 'exact', head: true }),
        ]);

        const profilesPayload = await parseJsonResponse<ProfilesListPayload>(profilesResponse);
        if (produkCountResult.error) throw new Error(produkCountResult.error.message);
        if (varianCountResult.error) throw new Error(varianCountResult.error.message);
        if (vendorCountResult.error) throw new Error(vendorCountResult.error.message);

        setStats({
          totalUsers: profilesPayload.data.meta.total ?? 0,
          totalProduk: produkCountResult.count ?? 0,
          totalVarian: varianCountResult.count ?? 0,
          totalVendor: vendorCountResult.count ?? 0,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat statistik developer.';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total System Users',
      value: String(stats.totalUsers),
      icon: Users,
    },
    {
      title: 'Total Produk',
      value: String(stats.totalProduk),
      icon: Package,
    },
    {
      title: 'Total Varian',
      value: String(stats.totalVarian),
      icon: Tags,
    },
    {
      title: 'Total Vendor',
      value: String(stats.totalVendor),
      icon: Truck,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-3 md:space-y-4 md:p-4 lg:space-y-8 lg:p-8">
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg font-bold text-slate-100 md:text-2xl lg:text-3xl">Developer Command Center</h1>
        <p className="text-xs text-slate-200 md:text-sm lg:text-base">
          Monitor performa sistem, akses modul kritikal, dan kelola konfigurasi inti enterprise dari satu tempat.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {statCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 space-y-1 md:space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm lg:text-base">{item.title}</p>
                  <p className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">{isLoading ? '...' : item.value}</p>
                </div>
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] md:h-10 md:w-10 lg:h-12 lg:w-12">
                  <Icon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      {errorMessage ? <p className="text-sm text-rose-200">{errorMessage}</p> : null}

      <section className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-4">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-[#BC934B]/60 md:p-4 lg:p-6"
            >
              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start md:gap-4">
                <div className="min-w-0 space-y-3 md:space-y-4">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#BC934B]/15 text-[#BC934B] md:h-10 md:w-10 lg:h-12 lg:w-12">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
                  </span>
                  <h2 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">{module.title}</h2>
                  <p className="text-xs leading-relaxed text-slate-600 md:text-sm lg:text-base">{module.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-[#BC934B] md:h-6 md:w-6" />
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
