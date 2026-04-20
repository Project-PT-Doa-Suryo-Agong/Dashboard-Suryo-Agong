export type E2ERoute = {
  path: string;
  expectedText: string;
  role?: "management" | "developer";
};

export const publicRoutes: E2ERoute[] = [
  { path: "/", expectedText: "Unified Enterprise Dashboard" },
  { path: "/auth", expectedText: "Masuk" },
  { path: "/auth/login", expectedText: "Masuk" },
  { path: "/unauthorized", expectedText: "Akses Ditolak" },
];

export const protectedRoutes: E2ERoute[] = [
  { path: "/finance", expectedText: "Finance Dashboard", role: "management" },
  { path: "/finance/cashflow", expectedText: "Finance Dashboard", role: "management" },
  { path: "/finance/payroll", expectedText: "Finance Dashboard", role: "management" },
  { path: "/finance/reimburse", expectedText: "Finance Dashboard", role: "management" },
  { path: "/hr", expectedText: "Human Resource Dashboard", role: "management" },
  { path: "/hr/attendance", expectedText: "Human Resource Dashboard", role: "management" },
  { path: "/hr/karyawan", expectedText: "Human Resource Dashboard", role: "management" },
  { path: "/hr/warnings", expectedText: "Human Resource Dashboard", role: "management" },
  { path: "/logistik", expectedText: "Logistics Dashboard", role: "management" },
  { path: "/logistik/manifest", expectedText: "Logistics Dashboard", role: "management" },
  { path: "/logistik/packing", expectedText: "Logistics Dashboard", role: "management" },
  { path: "/logistik/returns", expectedText: "Logistics Dashboard", role: "management" },
  { path: "/management", expectedText: "Management Dashboard", role: "management" },
  { path: "/management/budget", expectedText: "Management Dashboard", role: "management" },
  { path: "/management/kpi", expectedText: "Management Dashboard", role: "management" },
  { path: "/produksi", expectedText: "Production Dashboard", role: "management" },
  { path: "/produksi/orders", expectedText: "Production Dashboard", role: "management" },
  { path: "/produksi/qc/inbound", expectedText: "Production Dashboard", role: "management" },
  { path: "/produksi/qc/outbound", expectedText: "Production Dashboard", role: "management" },
  { path: "/creative", expectedText: "Creative & Sales Dashboard", role: "management" },
  { path: "/creative/affiliates", expectedText: "Creative & Sales Dashboard", role: "management" },
  { path: "/creative/content", expectedText: "Creative & Sales Dashboard", role: "management" },
  { path: "/creative/content-stats", expectedText: "Creative & Sales Dashboard", role: "management" },
  { path: "/creative/sales-order", expectedText: "Creative & Sales Dashboard", role: "management" },
  { path: "/office", expectedText: "Office Support Dashboard", role: "management" },
  { path: "/office/products", expectedText: "Office Support Dashboard", role: "management" },
  { path: "/office/vendors", expectedText: "Office Support Dashboard", role: "management" },
  { path: "/developer", expectedText: "Developer Dashboard", role: "developer" },
  { path: "/developer/master-data", expectedText: "Developer Dashboard", role: "developer" },
  { path: "/developer/master-data/vendor", expectedText: "Developer Dashboard", role: "developer" },
  { path: "/developer/master-data/produk", expectedText: "Developer Dashboard", role: "developer" },
  { path: "/developer/master-data/varian", expectedText: "Developer Dashboard", role: "developer" },
  { path: "/developer/users", expectedText: "Developer Dashboard", role: "developer" },
];

export const allRoutes = [...publicRoutes, ...protectedRoutes];