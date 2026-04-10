"use client";

import { useAuth } from "@/lib/supabase/auth-context";

/**
 * Returns the current user's profile data sourced from AuthContext.
 * No extra DB query — reuses the profile already fetched by AuthProvider.
 *
 * Note: core.profiles uses 'nama' for the full name column.
 */
export function useProfile() {
  const { user, loading } = useAuth();
  const profileName = user?.profile?.nama?.trim() || null;
  const profileRole = user?.profile?.role?.trim() || null;

  // Keep fallback values sourced from real auth data (not hardcoded dummy strings).
  const emailName = user?.email?.split("@")[0]?.trim() || null;
  const accessRole = user?.accessSummary?.jabatan?.trim() || null;

  return {
    /** Full name from core.profiles.nama */
    name: profileName ?? emailName,
    /** Role from core.profiles.role */
    role: profileRole ?? accessRole,
    /** True while AuthProvider is resolving the initial session */
    loading,
  };
}
