"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useProfile } from '@/hooks/use-profile';

const navItems = [
  { label: 'Dashboard Overview', href: '/management', icon: 'LayoutDashboard' },
  { label: 'Budget', href: '/management/budget', icon: 'Banknote' },
  { label: 'KPI', href: '/management/kpi', icon: 'TrendingUp' },
  { label: 'Penilaian Karyawan', href: '/penilaian-karyawan', icon: 'FileUser' },
];

export default function ManagementClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { name, role } = useProfile();

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Kiri: Sidebar */}
      <Sidebar
        title="Management"
        subtitle="Management Dashboard Page"
        logoIcon="Palette"
        navItems={navItems}
        footerAction={{ label: 'New Campaign', icon: 'Plus' }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Kanan: Area Utama */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col bg-slate-100/50">
        <Topbar
          title="Management Dashboard"
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
