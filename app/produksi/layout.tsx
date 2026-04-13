"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const navItems = [
  { label: 'Dashboard Produksi', href: '/produksi', icon: 'LayoutDashboard' },
  { label: 'Pesanan (Orders)', href: '/produksi/orders', icon: 'ClipboardList' },
  {
    label: 'QC',
    href: '/produksi/qc',
    icon: 'ShieldCheck',
    children: [
      { label: 'QC Inbound', href: '/produksi/qc/inbound', icon: 'ShieldCheck' },
      { label: 'QC Outbound', href: '/produksi/qc/outbound', icon: 'CheckSquare' },
    ],
  },
];

export default function ProduksiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light font-display">
      {/* Overlay Sidebar Mobile */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Kiri: Sidebar */}
      <Sidebar
        title="Production"
        subtitle="Manufacturing Portal"
        logoIcon="Factory"
        navItems={navItems}
        footerAction={{ label: 'New Order', icon: 'Plus' }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Kanan: Area Utama */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col bg-slate-100/50">
        <Topbar
          title="Production Dashboard"
          user={{ name: 'Ahmad Kasim', role: 'Production Head' }}
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
