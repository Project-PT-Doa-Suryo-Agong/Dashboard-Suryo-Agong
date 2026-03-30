"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Handshake,
  Palette,
  Plus,
  Landmark,
  CreditCard,
  ReceiptText,
  Banknote,
  Users,
  Fingerprint,
  AlertTriangle,
  UserPlus,
  BarChart2,
  Wallet,
  ClipboardList,
  Package,
  RotateCcw,
  Truck,
  Receipt,
  ShieldCheck,
  Factory,
  Headphones,
  Database,
  UserCog,
  Code2,
  LogOut,
  User,
  Tags,
  ChevronDown,
  BookAlert,
  ScrollText,
  ChartCandlestick,
  Undo2,
  ListChecks,
  CheckSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Handshake,
  Palette,
  Plus,
  Landmark,
  CreditCard,
  ReceiptText,
  Banknote,
  Users,
  Fingerprint,
  AlertTriangle,
  UserPlus,
  BarChart2,
  Wallet,
  ClipboardList,
  Package,
  RotateCcw,
  Truck,
  Receipt,
  ShieldCheck,
  Factory,
  Headphones,
  Database,
  UserCog,
  Code2,
  User,
  Tags,
  BookAlert,
  ScrollText,
  ChartCandlestick,
  Undo2,
  ListChecks,
  CheckSquare, 
};

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  children?: NavItem[];
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
  isOpen?: boolean;
  onClose?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function Icon({ name, size }: { name: string; size: number }) {
  const Component = ICONS[name];
  if (!Component) return null;
  return <Component size={size} />;
}

export default function Sidebar(props: SidebarProps) {
  const {
    subtitle = "Management Portal",
    navItems,
    isOpen,
    onClose,
    isMobileOpen = false,
    onCloseMobile,
  } = props;

  const pathname = usePathname();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const mobileIsOpen = isOpen ?? isMobileOpen;
  const handleClose = onClose ?? onCloseMobile;

  const isPathActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Most-specific prefix match: pick the nav item whose href is the longest
  // prefix of the current pathname (handles sub-pages transparently).
  const activeHref = navItems
    .filter((item) => isPathActive(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 shrink-0 bg-[#1e293b] text-slate-100 transform transition-transform duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0 ${
          mobileIsOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
            {/* Logo & Title */}
            <div className="mb-4 flex flex-col items-start gap-2 md:mb-5">
              <Image
                src="/logo.png"
                alt="logo"
                width={100}
                height={28}
                className="h-9 w-auto md:h-10"
              />
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>

            {/* Navigation */}
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
              {navItems.map((item) => {
                const hasChildren = !!item.children?.length;
                const isChildActive =
                  item.children?.some((child) => isPathActive(child.href)) ?? false;
                const isGroupOpen =
                  (openGroups[item.href] ?? false) ||
                  isPathActive(item.href) ||
                  isChildActive;
                const isActive = item.href === activeHref || isChildActive;

                return (
                  <div key={item.href}>
                    {hasChildren ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenGroups((prev) => ({
                            ...prev,
                            [item.href]: !isGroupOpen,
                          }))
                        }
                        aria-expanded={isGroupOpen}
                        className={`w-full flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg md:rounded-xl transition-colors min-w-0 ${
                          isActive || isGroupOpen
                            ? "text-white bg-primary"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <Icon name={item.icon} size={16} />
                        <span className="text-xs md:text-sm font-medium flex-1 truncate text-left">
                          {item.label}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${
                            isGroupOpen ? "rotate-0" : "-rotate-90"
                          }`}
                        />
                      </button>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (handleClose) handleClose();
                        }}
                        className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-2 rounded-lg md:rounded-xl transition-colors min-w-0 ${
                          isActive
                            ? "text-white bg-primary"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        <Icon name={item.icon} size={16} />
                        <span className="text-xs md:text-sm font-medium flex-1 truncate">
                          {item.label}
                        </span>
                      </Link>
                    )}

                    {hasChildren && isGroupOpen && (
                      <div className="mt-1 ml-2 pl-3 border-l border-slate-600 space-y-0.5">
                        {item.children!.map((child) => {
                          const isChildActive =
                            pathname === child.href ||
                            pathname.startsWith(child.href + "/");
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => {
                                if (handleClose) handleClose();
                              }}
                              className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-md md:rounded-lg transition-colors min-w-0 ${
                                isChildActive
                                  ? "text-white bg-white/15"
                                  : "text-slate-400 hover:text-white hover:bg-slate-700"
                              }`}
                            >
                              <Icon name={child.icon} size={12} />
                              <span className="text-[10px] md:text-xs font-medium truncate">
                                {child.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="mt-auto border-t border-slate-700/70 p-4 md:p-6">
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-3 py-2.5 text-white transition-colors hover:bg-red-700 md:gap-3 md:rounded-xl"
            >
              <LogOut size={16} />
              <span className="text-xs font-medium text-white md:text-sm">
                Logout
              </span>
            </button>
          </div>
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
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 md:p-6 w-72 md:w-80 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <LogOut size={20} className="text-red-500" />
            </div>
            <div className="text-center">
              <h3 className="text-sm md:text-base font-bold text-slate-900">
                Konfirmasi Logout
              </h3>
              <p className="text-xs md:text-sm text-slate-500 mt-1">
                Apakah kamu yakin ingin keluar dari sesi ini?
              </p>
            </div>
            <div className="flex gap-2 md:gap-3 w-full">
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
