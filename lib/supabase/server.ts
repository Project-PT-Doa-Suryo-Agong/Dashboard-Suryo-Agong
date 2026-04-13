import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { env } from "@/lib/env";

import type { Database } from "@/types/supabase";

function resolveCookiePolicy(hostHeader: string | null) {
  const host = (hostHeader ?? "").split(":")[0]?.toLowerCase() ?? "";
  const isLocalhost = host === "localhost" || host.endsWith(".localhost");
  const isLvh = host === "lvh.me" || host.endsWith(".lvh.me");
  const productionCookieDomain = process.env.APP_COOKIE_DOMAIN;

  const domain = isLvh
    ? ".lvh.me"
    : isLocalhost
      ? ".localhost"
      : productionCookieDomain
        ? `.${productionCookieDomain.replace(/^\./, "")}`
        : undefined;

  return {
    domain,
    sameSite: "lax" as const,
    secure: !(isLocalhost || isLvh),
  };
}

export async function createSupabaseServerClient() {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const cookiePolicy = resolveCookiePolicy(headerStore.get("host"));

  return createServerClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({
            name,
            value,
            ...(options as object),
            domain: cookiePolicy.domain,
            sameSite: cookiePolicy.sameSite,
            secure: cookiePolicy.secure,
          });
        } catch {
          // The `set` method was called from a Server Component or GET route.
          // Ignore the error.
        }
      },
      remove(name: string, options: Record<string, unknown>) {
        try {
          cookieStore.set({
            name,
            value: "",
            ...(options as object),
            domain: cookiePolicy.domain,
            sameSite: cookiePolicy.sameSite,
            secure: cookiePolicy.secure,
            maxAge: 0,
          });
        } catch {
          // The `remove` method was called from a Server Component or GET route.
          // Ignore the error.
        }
      },
    },
  });
}

