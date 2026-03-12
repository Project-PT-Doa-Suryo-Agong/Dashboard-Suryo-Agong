'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarDays, TrendingUp, Handshake, Palette, Plus,
  Landmark, CreditCard, ReceiptText,
  Users, Fingerprint, AlertTriangle, UserPlus,
  BarChart2, Wallet,
  ClipboardList, Package, RotateCcw, Truck,
  Receipt, ShieldCheck, Factory,
  Headphones,
  Database, UserCog, Code2,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard, CalendarDays, TrendingUp, Handshake, Palette, Plus,
  Landmark, CreditCard, ReceiptText,
  Users, Fingerprint, AlertTriangle, UserPlus,
  BarChart2, Wallet,
  ClipboardList, Package, RotateCcw, Truck,
  Receipt, ShieldCheck, Factory,
  Headphones,
  Database, UserCog, Code2,
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface SidebarFooterAction {
  label: string;
  icon: string;
  onClick?: () => void;
}

export interface SidebarProps {
  title: string;
  subtitle?: string;
  logoIcon?: string;
  navItems: NavItem[];
  footerAction?: SidebarFooterAction;
}

function Icon({ name, size }: { name: string; size: number }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} />;
}

export default function Sidebar({
  title,
  subtitle = 'Management Portal',
  logoIcon,
  navItems,
  footerAction,
}: SidebarProps) {
  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Most-specific prefix match: pick the nav item whose href is the longest
  // prefix of the current pathname (handles sub-pages transparently).
  const activeHref = navItems
    .filter(
      (item) =>
        pathname === item.href || pathname.startsWith(item.href + '/'),
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      <aside className="w-64 bg-slate-800 text-slate-100 flex flex-col shrink-0 h-screen">
        <div className="p-6">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 mb-8">
            <Image src="/logo.png" alt="logo" width={100} height={28} className="h-7 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    isActive
                      ? 'text-white bg-primary'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="mt-auto p-6">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 justify-center rounded-xl text-white bg-red-500 hover:bg-red-700 hover:text-red-350 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm text-white font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={22} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Logout</h3>
              <p className="text-sm text-slate-500 mt-1">Apakah kamu yakin ingin keluar dari sesi ini?</p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  // TODO: tambahkan logika logout di sini
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}