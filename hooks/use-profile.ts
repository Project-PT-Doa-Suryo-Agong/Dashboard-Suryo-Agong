"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/supabase/auth-context";

function safeDecode(value: string): string {
  let current = value;

  // Support legacy double-encoded cookie values, e.g. Fani%2520Kiara.
  for (let i = 0; i < 2; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }

  return current;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${name}=`));

  if (!raw) return null;
  const value = raw.slice(name.length + 1).trim();
  return value ? safeDecode(value) : null;
}

/**
 * Returns the current user's profile data sourced from AuthContext.
 * No extra DB query — reuses the profile already fetched by AuthProvider.
 *
 * Note: core.profiles uses 'nama' for the full name column.
 */
export function useProfile() {
  const { user, loading } = useAuth();
  const [cookieRole, setCookieRole] = useState<string | null>(null);
  const [cookieName, setCookieName] = useState<string | null>(null);

  useEffect(() => {
    setCookieRole(readCookie("role"));
    setCookieName(readCookie("display_name"));
  }, []);

  const profileName = user?.profile?.nama?.trim() || null;
  const profileRole = user?.profile?.role?.trim() || null;

  // Keep fallback values sourced from real auth data (not hardcoded dummy strings).
  const emailName = user?.email?.split("@")[0]?.trim() || null;
  const accessRole = user?.accessSummary?.jabatan?.trim() || null;

  return {
    /** Full name from core.profiles.nama */
    name: profileName ?? emailName ?? cookieName,
    /** Role from core.profiles.role */
    role: profileRole ?? accessRole ?? cookieRole,
    /** True while AuthProvider is resolving the initial session */
    loading,
  };
}
