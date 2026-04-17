"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useProfile } from '@/hooks/use-profile';

const navItems = [
  { label: 'Dashboard', href: '/super-admin', icon: 'LayoutDashboard' },
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
  { label: 'User', href: '/super-admin/users', icon: 'User' },
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