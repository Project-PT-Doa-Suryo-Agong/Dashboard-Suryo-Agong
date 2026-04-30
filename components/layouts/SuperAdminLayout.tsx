"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useProfile } from '@/hooks/use-profile';

const navItems = [
  { label: 'Dashboard', href: '/super-admin', icon: 'LayoutDashboard' },
  { label: 'User Management', href: '/super-admin/users', icon: 'User' },
  {
    label: 'Master Data',
    href: '/super-admin/master-data',
    icon: 'Database',
    children: [
      { label: 'Vendor', href: '/super-admin/master-data/vendor', icon: 'Truck' },
      { label: 'Produk Induk', href: '/super-admin/master-data/produk', icon: 'Package' },
      { label: 'Varian Produk', href: '/super-admin/master-data/varian', icon: 'Tags' },
    ],
  },
  {
    label: 'Management',
    href: '/management',
    icon: 'BriefcaseBusiness',
    children: [
      { label: 'Overview', href: '/management', icon: 'LayoutDashboard' },
      { label: 'Budget', href: '/management/budget', icon: 'Banknote' },
      { label: 'KPI', href: '/management/kpi', icon: 'TrendingUp' },
    ]
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: 'Wallet',
    children: [
      { label: 'Overview', href: '/finance', icon: 'LayoutDashboard' },
      { label: 'Cashflow', href: '/finance/cashflow', icon: 'ChartCandlestick' },
      { label: 'Payroll', href: '/finance/payroll', icon: 'Banknote' },
      { label: 'Reimburse', href: '/finance/reimburse', icon: 'ReceiptText' },
      { label: 'Chart of Accounts', href: '/finance/coa', icon: 'BookOpen' },
      { label: 'Journal', href: '/finance/journal', icon: 'BookMarked' },
      { label: 'Invoice', href: '/finance/invoice', icon: 'FileText' },
      { label: 'Utang Piutang', href: '/finance/utang-piutang', icon: 'HandCoins' },
    ]
  },
  {
    label: 'Human Resources',
    href: '/hr',
    icon: 'Users',
    children: [
      { label: 'Overview', href: '/hr', icon: 'LayoutDashboard' },
      { label: 'Kehadiran', href: '/hr/attendance', icon: 'CalendarDays' },
      { label: 'Karyawan', href: '/hr/karyawan', icon: 'Users' },
      { label: 'PKWT/PKWTP', href: '/hr/pkwt', icon: 'ScrollText' },
      { label: 'Peringatan', href: '/hr/warnings', icon: 'ShieldAlert' },
      { label: 'SOP', href: '/hr/sop', icon: 'FileText' },
    ]
  },
  {
    label: 'Production',
    href: '/produksi',
    icon: 'Factory',
    children: [
      { label: 'Overview', href: '/produksi', icon: 'LayoutDashboard' },
      { label: 'Orders', href: '/produksi/orders', icon: 'ClipboardList' },
      { label: 'QC Inbound', href: '/produksi/qc/inbound', icon: 'ShieldCheck' },
      { label: 'QC Outbound', href: '/produksi/qc/outbound', icon: 'CheckSquare' },
    ]
  },
  {
    label: 'Logistics',
    href: '/logistik',
    icon: 'Truck',
    children: [
      { label: 'Overview', href: '/logistik', icon: 'LayoutDashboard' },
      { label: 'Manifest', href: '/logistik/manifest', icon: 'Truck' },
      { label: 'Packing', href: '/logistik/packing', icon: 'Package' },
      { label: 'Returns', href: '/logistik/returns', icon: 'Undo2' },
    ]
  },
  {
    label: 'Creative & Sales',
    href: '/creative',
    icon: 'Palette',
    children: [
      { label: 'Overview', href: '/creative', icon: 'LayoutDashboard' },
      { label: 'Affiliators', href: '/creative/affiliates', icon: 'Users' },
      { label: 'Content Planner', href: '/creative/content', icon: 'CalendarDays' },
      { label: 'Content Stats', href: '/creative/content-stats', icon: 'TrendingUp' },
      { label: 'Sales Order', href: '/creative/sales-order', icon: 'ScrollText' },
    ]
  },
  {
    label: 'Office Support',
    href: '/office',
    icon: 'Building',
    children: [
      { label: 'Overview', href: '/office', icon: 'LayoutDashboard' },
      { label: 'Product', href: '/office/products', icon: 'Package' },
      { label: 'Vendors', href: '/office/vendors', icon: 'Handshake' },
    ]
  }
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { name, role } = useProfile();

  return (
    <div className="flex min-h-screen bg-background-light font-display">
      {/* Kiri: Sidebar */}
      <Sidebar
        title="Super Admin"
        subtitle="Super Admin Dashboard Page"
        logoIcon="Shield"
        navItems={navItems}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Kanan: Area Utama */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col bg-slate-100/50">
        <Topbar
          title="Super Admin Dashboard"
          user={{ name: name ?? '...', role: role ?? '' }}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Area Konten Dinamis yang bisa di-scroll */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
