import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/types/supabase";

export function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY in browser")
  }

  return createBrowserClient<Database>(
    supabaseUrl, 
    supabaseAnonKey,
    {
      cookieOptions: {
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || ".lvh.me",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      }
    }
  )
}
