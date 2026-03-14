"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';

const navItems = [
  { label: 'Dashboard Overview', href: '/', icon: 'LayoutDashboard' },
  { label: 'Manifest', href: '/manifest', icon: 'Truck' },
  { label: 'Packing', href: '/packing', icon: 'Package' },
  { label: 'Returns', href: '/returns', icon: 'Undo2' },
];

export default function CreativeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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
        title="Logistik"
        subtitle="Logistics Portal"
        logoIcon="Palette"
        navItems={navItems}
        footerAction={{ label: 'New Campaign', icon: 'Plus' }}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Kanan: Area Utama */}
      <main className="flex-1 min-w-0 w-full overflow-x-hidden flex flex-col bg-slate-100/50">
        <Topbar
          title="Logistics Dashboard"
          user={{ name: 'I Made Trikusumo', role: 'Logistics Team' }}
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