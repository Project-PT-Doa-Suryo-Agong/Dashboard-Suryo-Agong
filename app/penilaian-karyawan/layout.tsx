"use client";

import React from "react";
import { useProfile } from "@/hooks/use-profile";

// Mengambil semua layout yang ada
import SuperAdminLayout from "@/components/layouts/SuperAdminLayout";
import ManagementLayout from "@/components/layouts/ManagementLayout";
import HRLayout from "@/components/layouts/HRLayout";
import FinanceLayout from "@/components/layouts/FinanceLayout";
import ProduksiLayout from "@/components/layouts/ProduksiLayout";
import LogistikLayout from "@/components/layouts/LogistikLayout";
import CreativeLayout from "@/components/layouts/CreativeLayout";
import OfficeLayout from "@/components/layouts/OfficeLayout";

export default function PenilaianKaryawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role } = useProfile();
  const r = (role || "").toLowerCase();

  if (r.includes("super admin") || r.includes("super-admin") || r.includes("admin")) {
    return <SuperAdminLayout>{children}</SuperAdminLayout>;
  }
  if (r.includes("management")) {
    return <ManagementLayout>{children}</ManagementLayout>;
  }
  if (r.includes("finance")) {
    return <FinanceLayout>{children}</FinanceLayout>;
  }
  if (r.includes("hr") || r.includes("human resource")) {
    return <HRLayout>{children}</HRLayout>;
  }
  if (r.includes("produksi") || r.includes("production")) {
    return <ProduksiLayout>{children}</ProduksiLayout>;
  }
  if (r.includes("logistik") || r.includes("logistics")) {
    return <LogistikLayout>{children}</LogistikLayout>;
  }
  if (r.includes("creative") || r.includes("sales")) {
    return <CreativeLayout>{children}</CreativeLayout>;
  }
  if (r.includes("office")) {
    return <OfficeLayout>{children}</OfficeLayout>;
  }

  // Fallback default jika role tidak terdeteksi
  return <SuperAdminLayout>{children}</SuperAdminLayout>;
}
