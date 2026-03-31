import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "@/types/supabase";

/**
 * Auth callback route.
 *
 * Supabase redirects here after email confirmation, magic-link clicks,
 * and OAuth flows. It exchanges the `code` query-param for a proper
 * server-side session (cookies) and then redirects the user to the app.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/auth"; // default redirect after auth

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            response.cookies.set({ name, value, ...(options as object) });
          },
          remove(name: string, options: Record<string, unknown>) {
            response.cookies.set({
              name,
              value: "",
              ...(options as object),
              maxAge: 0,
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // If code exchange failed or no code provided, redirect to auth page with error
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_failed`);
}
