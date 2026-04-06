"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Profile } from "@/types/supabase";
import type { AccessSummary, AccessLevel } from "@/types/access";
import {
  buildAccessSummary,
  inferAccessLevel,
} from "@/lib/access/policy";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  email: string | undefined;
  profile: Profile | null;
  accessLevel: AccessLevel;
  accessSummary: AccessSummary;
};

type AuthState = {
  /** Current Supabase session (null = signed out) */
  session: Session | null;
  /** Enriched user data with profile & access info */
  user: AuthUser | null;
  /** True while initial session is being resolved */
  loading: boolean;
  /** Sign in with email + password; returns error on failure */
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Force-refresh profile data from DB */
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveLoginUrl = useCallback(() => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://lvh.me:3000";
    return `${siteUrl.replace(/\/$/, "")}/auth/login`;
  }, []);

  // ── fetch profile from core.profiles ──

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      const { data, error } = await (supabase as unknown as { schema: (s: string) => typeof supabase })
        .schema("core")
        .from("profiles")
        .select("id, nama, role, phone, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) return null;
      return data as Profile;
    },
    [supabase]
  );

  // ── build enriched AuthUser ──

  const buildAuthUser = useCallback(
    async (supabaseUser: User): Promise<AuthUser> => {
      const profile = await fetchProfile(supabaseUser.id);

      const accessSummary = buildAccessSummary({
        role: profile?.role ?? null,
        division: null,
        fullName: profile?.nama ?? null,
        jobTitle:
          (supabaseUser.user_metadata?.job_title as string | undefined) ?? null,
      });

      return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        profile,
        accessLevel: accessSummary.level,
        accessSummary,
      };
    },
    [fetchProfile]
  );

  // ── initialise session on mount ──

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(currentSession);

      if (currentSession?.user) {
        const enriched = await buildAuthUser(currentSession.user);
        if (mounted) setUser(enriched);
      }

      setLoading(false);
    };

    void init();

    // listen for auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;

      if (event === "TOKEN_REFRESHED") {
        console.log("Session refreshed successfully");
      }

      if (
        event === "SIGNED_OUT" &&
        !newSession &&
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/auth/login")
      ) {
        window.location.replace(resolveLoginUrl());
        return;
      }

      setSession(newSession);

      if (newSession?.user) {
        const enriched = await buildAuthUser(newSession.user);
        if (mounted) setUser(enriched);
      } else {
        setUser(null);
      }

      // on sign-in, ensure we're no longer "loading"
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, buildAuthUser, resolveLoginUrl]);

  // ── signIn: direct Supabase Auth ──

  const signIn = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error };
    },
    [supabase]
  );

  // ── signOut: direct Supabase Auth ──

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
  }, [supabase]);

  // ── refreshProfile: re-fetch profile from DB ──

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const enriched = await buildAuthUser(session.user);
    setUser(enriched);
  }, [session, buildAuthUser]);

  // ── context value ──

  const value = useMemo<AuthState>(
    () => ({ session, user, loading, signIn, signOut, refreshProfile }),
    [session, user, loading, signIn, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

/** Convenience: returns just the enriched user (null when signed out). */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/** Convenience: returns true while initial session is resolving. */
export function useAuthLoading() {
  const { loading } = useAuth();
  return loading;
}
