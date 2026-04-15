import { ok } from "@/lib/http/response";
import type { NextResponse } from "next/server";
import { getCookieDomain } from "@/lib/cookie-domain";

function expireCookie(response: NextResponse, name: string, domain?: string) {
  response.cookies.set(name, "", {
    expires: new Date(0),
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export async function POST(request: Request) {
  const response = ok(null, "Logout berhasil.") as NextResponse;
  const cookieDomain = getCookieDomain();

  // Call Supabase signOut to clear the session securely
  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return request.headers.get("cookie")?.split(';').find(c => c.trim().startsWith(`${name}=`))?.split('=')[1];
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          // ignore
        },
        remove(name: string, options: Record<string, unknown>) {
          // ignore
        },
      },
    }
  );

  try {
    await supabase.auth.signOut();
  } catch (err) {
    // ignore signout errors
  }

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
  const authCookieBase = projectRef
    ? `sb-${projectRef}-auth-token`
    : "sb-mhfdzprxauqfczmtyizg-auth-token";

  // Clear base + chunked cookies from current request to avoid stale session remnants.
  const requestCookieHeader = request.headers.get("cookie") ?? "";
  const requestCookieNames = requestCookieHeader
    .split(";")
    .map((segment) => segment.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name));

  const authCookieNames = new Set<string>([
    authCookieBase,
    ...requestCookieNames.filter((name) => name === authCookieBase || name.startsWith(`${authCookieBase}.`)),
  ]);

  for (const cookieName of authCookieNames) {
    expireCookie(response, cookieName);
    if (cookieDomain) expireCookie(response, cookieName, cookieDomain);
  }

  expireCookie(response, "role");
  if (cookieDomain) expireCookie(response, "role", cookieDomain);

  expireCookie(response, "display_name");
  if (cookieDomain) expireCookie(response, "display_name", cookieDomain);

  return response;
}
