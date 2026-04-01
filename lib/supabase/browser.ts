import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // BACA LANGSUNG SECARA STATIS, JANGAN GUNAKAN lib/env.ts DI SINI
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or ANON_KEY in browser")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

export const createSupabaseBrowserClient = createClient
