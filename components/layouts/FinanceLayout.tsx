"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import Topbar from '@/components/topbar';
import { useProfile } from '@/hooks/use-profile';

const navItems = [
  { label: 'Finance Dashboard', href: '/finance', icon: 'LayoutDashboard' },
  { label: 'Cashflow', href: '/finance/cashflow', icon: 'ChartCandlestick' },
  { label: 'Payroll', href: '/finance/payroll', icon: 'Banknote' },
  { label: 'Reimburse', href: '/finance/reimburse', icon: 'ReceiptText' },
  { label: 'Chart of Accounts', href: '/finance/coa', icon: 'BookOpen' },
  { label: 'Journal', href: '/finance/journal', icon: 'BookMarked' },
];

export default function FinanceClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { name, role } = useProfile();
  const topbarUser = name || role ? { name: name ?? '', role: role ?? '' } : undefined;

  return (
    <div className="flex min-h-screen bg-background-light font-display">
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        title="Finance"
        subtitle="Finance Dashboard Page"
        logoIcon="Wallet"
        navItems={navItems}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 w-full md:ml-0 overflow-x-hidden flex flex-col bg-slate-100/50">
        <Topbar
          title="Finance Dashboard"
          user={topbarUser}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
