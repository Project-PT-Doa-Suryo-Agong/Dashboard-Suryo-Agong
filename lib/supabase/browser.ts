import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/types/supabase";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY in browser")
  }

  const resolveCookieDomain = () => {
    const configuredDomain =
      process.env.NEXT_PUBLIC_COOKIE_DOMAIN ?? process.env.NEXT_PUBLIC_APP_COOKIE_DOMAIN;
    if (configuredDomain) {
      return configuredDomain.startsWith(".") ? configuredDomain : `.${configuredDomain}`;
    }
    if (typeof window === "undefined") return undefined;

    const host = window.location.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return undefined;
    if (host === "lvh.me" || host.endsWith(".lvh.me")) return ".lvh.me";
    return undefined;
  };

  return createBrowserClient<Database>(
    supabaseUrl, 
    supabaseAnonKey,
    {
      cookieOptions: {
        domain: resolveCookieDomain(),
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      }
    }
  )
}
