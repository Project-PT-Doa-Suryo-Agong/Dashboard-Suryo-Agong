"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Package, Users } from "lucide-react";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MKaryawan, MProduk, MVarian, MVendor } from "@/types/supabase";
import { apiFetch } from "@/lib/utils/api-fetch";

type VendorsListPayload = {
  vendor: MVendor[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type ProductsListPayload = {
  produk: MProduk[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

type VariantsListPayload = {
  varian: MVarian[];
};

type EmployeesListPayload = {
  karyawan: MKaryawan[];
  meta: {
    page: number;
    limit: number;
    total: number;
  };
};

const quick_links = [
  {
    href: "/office/vendors",
    title: "Manajemen Mitra/Vendor",
    description: "Kelola mitra pemasok dan pembaruan data kontak vendor.",
  },
  {
    href: "/office/products",
    title: "Katalog Produk & Varian",
    description: "Atur master produk dan varian SKU yang aktif di sistem.",
  },
];

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const raw = await response.text();
  let payload: ApiSuccess<T> | ApiError;

  try {
    payload = JSON.parse(raw) as ApiSuccess<T> | ApiError;
  } catch {
    const fallback = response.ok ? "Respons server tidak valid (bukan JSON)." : raw.slice(0, 200);
    throw new Error(fallback || "Respons server tidak valid.");
  }

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }

  return payload;
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function OfficeDashboardPage() {
  const [vendors, setVendors] = useState<MVendor[]>([]);
  const [products, setProducts] = useState<MProduk[]>([]);
  const [variants, setVariants] = useState<MVarian[]>([]);
  const [employees, setEmployees] = useState<MKaryawan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchVendors = async () => {
    const response = await apiFetch("/api/core/vendors?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<VendorsListPayload>(response);
    setVendors(payload.data.vendor ?? []);
  };

  const fetchProducts = async () => {
    const response = await apiFetch("/api/core/products?page=1&limit=200", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<ProductsListPayload>(response);
    setProducts(payload.data.produk ?? []);
  };

  const fetchVariants = async () => {
    const response = await apiFetch("/api/core/variants", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<VariantsListPayload>(response);
    setVariants(payload.data.varian ?? []);
  };

  const fetchEmployees = async () => {
    const response = await apiFetch("/api/hr/employees?page=1&limit=500", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<EmployeesListPayload>(response);
    setEmployees(payload.data.karyawan ?? []);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchVendors(),
          fetchProducts(),
          fetchVariants(),
          fetchEmployees(),
        ]);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Gagal memuat dashboard office.";
        alert(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const total_vendor_aktif = vendors.length;
  const total_katalog_produk = variants.length;
  const total_karyawan = employees.length;

  const vendor_update_terbaru = useMemo(() => {
    return [...vendors]
      .sort((a, b) => {
        const left = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
        const right = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
        return left - right;
      })
      .slice(0, 5);
  }, [vendors]);

  const produk_by_id = useMemo(() => {
    return Object.fromEntries(products.map((item) => [item.id, item])) as Record<string, MProduk>;
  }, [products]);

  const produk_varian_baru = useMemo(() => {
    return [...variants]
      .sort((a, b) => {
        const left = new Date(b.created_at ?? 0).getTime();
        const right = new Date(a.created_at ?? 0).getTime();
        return left - right;
      })
      .slice(0, 6);
  }, [variants]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-4 md:space-y-6 lg:space-y-8">
      <section className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Dashboard Utama Administrasi Office</h1>
        <p className="text-sm md:text-base text-slate-300">
          Command Center tim Administrasi untuk memantau dan menjaga kualitas master data perusahaan.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -top-10 -right-8 h-28 w-28 rounded-full bg-[#BC934B]/10" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Vendor Aktif</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_vendor_aktif} Mitra</p>
              <p className="text-xs md:text-sm text-slate-600">Terdaftar dalam sistem</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#BC934B]/15 text-[#BC934B] shrink-0">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="absolute -bottom-10 -left-8 h-28 w-28 rounded-full bg-blue-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Katalog Produk</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_katalog_produk} Item</p>
              <p className="text-xs md:text-sm text-slate-600">{products.length} produk, varian produk aktif</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Package className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="absolute -top-10 -left-8 h-28 w-28 rounded-full bg-emerald-100/70" aria-hidden="true" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Karyawan (Office &amp; Pabrik)</p>
              <p className="text-base md:text-2xl font-bold text-slate-900">{total_karyawan} Orang</p>
              <p className="text-xs md:text-sm text-slate-600">Seluruh divisi</p>
            </div>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Users className="h-5 w-5" />
            </span>
          </div>
        </article>
      </section>

      <section className="space-y-3">
        <h2 className="text-base md:text-lg font-bold text-slate-100">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quick_links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#BC934B]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <p className="text-sm md:text-base font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs md:text-sm text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700 group-hover:translate-x-0.5 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Update Vendor Terbaru</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-115">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Nama Vendor
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Kontak
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Status/Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr key="loading-vendor-row">
                    <td colSpan={3} className="px-4 md:px-6 py-8 text-sm text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : vendor_update_terbaru.length === 0 ? (
                  <tr key="empty-vendor-row">
                    <td colSpan={3} className="px-4 md:px-6 py-8 text-sm text-slate-500">
                      Belum ada data vendor.
                    </td>
                  </tr>
                ) : (
                  vendor_update_terbaru.map((vendor) => {
                    const baseDate = vendor.created_at ?? vendor.updated_at;
                    const compareUpdated = vendor.updated_at ?? "";
                    const compareCreated = vendor.created_at ?? "";
                    const isUpdated = compareUpdated !== "" && compareUpdated !== compareCreated;

                    return (
                      <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800 wrap-break-word">
                          {vendor.nama_vendor ?? "-"}
                        </td>
                        <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{vendor.kontak ?? "-"}</td>
                        <td className="px-4 md:px-6 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isUpdated ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isUpdated ? "Updated" : "Baru"}
                            </span>
                            <span className="text-xs text-slate-500 whitespace-nowrap">
                              {baseDate ? formatDate(baseDate) : "-"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Produk &amp; Varian Baru</h2>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-115">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Nama Produk
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    SKU Varian
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    Kategori
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr key="loading-product-row">
                    <td colSpan={3} className="px-4 md:px-6 py-8 text-sm text-slate-500">
                      Memuat data...
                    </td>
                  </tr>
                ) : produk_varian_baru.length === 0 ? (
                  <tr key="empty-product-row">
                    <td colSpan={3} className="px-4 md:px-6 py-8 text-sm text-slate-500">
                      Belum ada data varian.
                    </td>
                  </tr>
                ) : (
                  produk_varian_baru.map((varian) => (
                    <tr key={varian.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 md:px-6 py-3 text-sm font-medium text-slate-800 wrap-break-word">
                        {produk_by_id[varian.product_id ?? ""]?.nama_produk ?? "Produk Tidak Ditemukan"}
                      </td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">{varian.sku ?? "-"}</td>
                      <td className="px-4 md:px-6 py-3 text-sm text-slate-700 whitespace-nowrap">
                        {produk_by_id[varian.product_id ?? ""]?.kategori ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  );
}
