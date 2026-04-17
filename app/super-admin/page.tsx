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
import { apiFetch } from "@/lib/utils/api-fetch";

type ProfilesListPayload = {
  profiles: Array<{ id: string }>;
  meta: { page: number; limit: number; total: number };
};

type ProductsListPayload = {
  produk: Array<{ id: string }>;
  meta: { page: number; limit: number; total: number };
};

type VendorsListPayload = {
  vendor: Array<{ id: string }>;
  meta: { page: number; limit: number; total: number };
};

type VariantsListPayload = {
  varian: Array<{ id: string }>;
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

export default function SuperAdminDashboard() {
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
        const [profilesResponse, productsResponse, variantsResponse, vendorsResponse] =
          await Promise.all([
            apiFetch('/api/profiles?page=1&limit=1', { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }),
            apiFetch('/api/core/products?page=1&limit=1', { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }),
            apiFetch('/api/core/variants', { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }),
            apiFetch('/api/core/vendors?page=1&limit=1', { method: 'GET', headers: { 'Content-Type': 'application/json' }, cache: 'no-store' }),
          ]);

        const profilesPayload  = await parseJsonResponse<ProfilesListPayload>(profilesResponse);
        const productsPayload  = await parseJsonResponse<ProductsListPayload>(productsResponse);
        const variantsPayload  = await parseJsonResponse<VariantsListPayload>(variantsResponse);
        const vendorsPayload   = await parseJsonResponse<VendorsListPayload>(vendorsResponse);

        setStats({
          totalUsers:  profilesPayload.data.meta.total ?? 0,
          totalProduk: productsPayload.data.meta.total ?? 0,
          totalVarian: variantsPayload.data.varian?.length ?? 0,
          totalVendor: vendorsPayload.data.meta.total ?? 0,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Gagal memuat statistik super-admin.';
        setErrorMessage(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadStats();
  }, []);

  const val = (n: number) => (isLoading ? '...' : String(n));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-3 p-3 md:space-y-4 md:p-4 lg:space-y-8 lg:p-8">

      {/* ── Header ── */}
      <section className="space-y-1 md:space-y-2">
        <h1 className="text-lg font-bold text-slate-100 md:text-2xl lg:text-3xl">
          Super Admin Command Center
        </h1>
        <p className="text-xs text-slate-200 md:text-sm lg:text-base">
          Monitor performa sistem, akses modul kritikal, dan kelola konfigurasi inti enterprise dari satu tempat.
        </p>
      </section>

      {/* ── Stat Cards ── */}
      <section className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">

        {/* Total System Users */}
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1 md:space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm lg:text-base">
                Total System Users
              </p>
              <p className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
                {val(stats.totalUsers)}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
              <Users className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            </span>
          </div>
        </article>

        {/* Total Produk */}
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1 md:space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm lg:text-base">
                Total Produk
              </p>
              <p className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
                {val(stats.totalProduk)}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
              <Package className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            </span>
          </div>
        </article>

        {/* Total Varian */}
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1 md:space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm lg:text-base">
                Total Varian
              </p>
              <p className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
                {val(stats.totalVarian)}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
              <Tags className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            </span>
          </div>
        </article>

        {/* Total Vendor */}
        <article className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4 lg:p-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0 space-y-1 md:space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:text-sm lg:text-base">
                Total Vendor
              </p>
              <p className="text-lg font-bold text-slate-900 md:text-2xl lg:text-3xl">
                {val(stats.totalVendor)}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
              <Truck className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
            </span>
          </div>
        </article>

      </section>

      {errorMessage ? <p className="text-sm text-rose-200">{errorMessage}</p> : null}

      {/* ── Module Cards ── */}
      <section className="grid grid-cols-1 gap-2 md:gap-3 sm:grid-cols-2 lg:grid-cols-2 lg:gap-4">

        {/* Pengelolaan User */}
        <Link
          href="/super-admin/users"
          className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-indigo-300 md:p-4 lg:p-6"
        >
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start md:gap-4">
            <div className="min-w-0 space-y-3 md:space-y-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
                <UserCog className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">
                Pengelolaan User
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 md:text-sm lg:text-base">
                Kelola data user enterprise, role akses, dan validasi profil
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-indigo-500 md:h-6 md:w-6" />
          </div>
        </Link>

        {/* Pengelolaan Database Master */}
        <Link
          href="/super-admin/master-data"
          className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-orange-300 md:p-4 lg:p-6"
        >
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-start md:gap-4">
            <div className="min-w-0 space-y-3 md:space-y-4">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white md:h-10 md:w-10 lg:h-12 lg:w-12">
                <Server className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" />
              </span>
              <h2 className="text-sm font-bold text-slate-900 md:text-base lg:text-lg">
                Pengelolaan Database Master
              </h2>
              <p className="text-xs leading-relaxed text-slate-600 md:text-sm lg:text-base">
                Atur data master lintas modul untuk memastikan integritas referensi pada seluruh sistem.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-orange-500 md:h-6 md:w-6" />
          </div>
        </Link>

      </section>
    </div>
  );
}
