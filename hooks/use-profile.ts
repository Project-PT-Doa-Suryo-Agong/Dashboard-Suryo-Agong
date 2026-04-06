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

  return {
    /** Full name from core.profiles.nama */
    name: user?.profile?.nama ?? null,
    /** Role from core.profiles.role */
    role: user?.profile?.role ?? null,
    /** True while AuthProvider is resolving the initial session */
    loading,
  };
}
