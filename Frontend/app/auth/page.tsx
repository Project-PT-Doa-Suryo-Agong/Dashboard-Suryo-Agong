"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShieldAlert,
  LogIn,
  Users
} from "lucide-react";

export default function LoginPage() {
  // State untuk menyimpan role yang dipilih. Default arahkan ke Creative.
  const [selectedRole, setSelectedRole] = useState("creative");

  // Daftar role yang sesuai dengan subdomain di proxy.ts
  const roles = [
    { id: "developer", name: "Developer" },
    { id: "management", name: "Management" },
    { id: "finance", name: "Finance" },
    { id: "hr", name: "Human Resources (HR)" },
    { id: "produksi", name: "Produksi" },
    { id: "logistik", name: "Logistik" },
    { id: "creative", name: "Creative & Sales" },
    { id: "support", name: "Office Support" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect langsung ke subdomain terpilih
    const targetUrl = `http://${selectedRole}.localhost:3000`;
    console.log(`Redirecting to: ${targetUrl}`);
    window.location.href = targetUrl;
  };

  return (
    <div className="bg-background-light dark:bg-[#999999] font-display flex min-h-screen flex-col items-center justify-center p-3 transition-colors duration-300 md:p-4 lg:p-6">
      
      {/* Dev Warning Badge di luar card */}
      <div className="mb-4 flex flex-col items-center gap-1 rounded-full bg-yellow-100 px-3 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-yellow-800 shadow-sm sm:flex-row sm:gap-2 md:mb-6 md:px-4 md:text-xs lg:text-sm">
        <ShieldAlert className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
        <span>Development Mode - Mock Auth</span>
      </div>

      {/* Main Login Card Container */}
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#333333]">
        
        {/* Header Image/Logo Section */}
        <div className="flex flex-col items-center px-4 pb-3 pt-6 md:px-6 md:pt-8 lg:px-8">
          <div className="mb-4 flex items-center justify-center md:mb-6">
            <Image
              src="/logo.png"
              alt="NexusCore Logo"
              width={160}
              height={48}
              className="h-10 w-auto md:h-12 lg:h-14"
            />
          </div>
          <h1 className="text-center text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-2xl lg:text-3xl">
            Simulate Login
          </h1>
          <p className="mt-2 px-2 text-center text-xs font-normal text-slate-500 dark:text-[#999999] md:px-4 md:text-sm lg:text-base">
            Select a role below to access the respective division dashboard.
          </p>
        </div>

        {/* Login Form */}
        <div className="mt-3 px-4 pb-6 md:mt-4 md:px-6 md:pb-8 lg:px-8 lg:pb-10">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 lg:space-y-8">
            
            {/* Role Dropdown Field */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 md:text-base lg:text-lg">
                <Users className="h-4 w-4 shrink-0 text-primary md:h-5 md:w-5" />
                Select Your Role
              </label>
              <div className="relative min-w-0">
                <select
                  required
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-[#666666] dark:text-slate-100 md:px-4 md:text-sm lg:text-base"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                {/* Custom Dropdown Arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center md:right-4">
                  <svg className="h-4 w-4 text-slate-400 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enter Dashboard Button */}
            <button
              type="submit"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#BC934B] py-3 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-[#BC934B]/20 transition-all hover:bg-[#BC934B]/90 md:py-3.5 md:text-sm lg:text-base"
            >
              <span>Enter Dashboard</span>
              <LogIn className="h-4 w-4 shrink-0 md:h-5 md:w-5" />
            </button>
          </form>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-center dark:border-slate-800 dark:bg-slate-800/50 md:px-6 md:py-4 lg:px-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 md:text-xs lg:text-sm">
            Suryo Agong Enterprise Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}