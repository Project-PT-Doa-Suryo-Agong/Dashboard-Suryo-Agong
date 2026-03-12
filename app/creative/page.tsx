"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  Lock,
  TriangleAlert,
  LogIn,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
    // Di sini nanti tempat logika redirect berdasarkan role
  };

  return (
    <div className="bg-background-light dark:bg-[#999999] font-display min-h-screen flex items-center justify-center p-4 transition-colors duration-300">
      {/* Main Login Card Container */}
      <div className="w-full max-w-[440px] bg-white dark:bg-[#333333] rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Image/Logo Section */}
        <div className="pt-3 pb-3 px-8 flex flex-col items-center">
          <div className="flex items-center justify-center mb-6">
            <Image
              src="/logo.png"
              alt="NexusCore Logo"
              width={160}
              height={48}
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-slate-900 dark:text-slate-100 text-2xl font-bold tracking-tight text-center">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-[#999999] text-sm font-normal text-center mt-2 px-4">
            Please enter your credentials to access your cluster
          </p>
        </div>

        {/* Login Form */}
        <div className="px-8 pb-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#666666] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 dark:text-slate-300 text-sm font-semibold">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:text-primary/80 text-xs font-semibold transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#666666] text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-slate-800    hover:bg-primary/90 text-white font-bold py-3.5 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In</span>
              <LogIn className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Optional Bottom Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/50 py-4 px-8 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
            Enterprise Grade Infrastructure
          </p>
        </div>
      </div>
    </div>
  );
}
