import { ok } from "@/lib/http/response";
import type { NextResponse } from "next/server";

function expireCookie(response: NextResponse, name: string, domain?: string) {
  response.cookies.set(name, "", {
    expires: new Date(0),
    path: "/",
    ...(domain ? { domain } : {}),
  });
}

export async function POST(request: Request) {
  const response = ok(null, "Logout berhasil.") as NextResponse;

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
    expireCookie(response, cookieName, ".lvh.me");
  }

  expireCookie(response, "role");
  expireCookie(response, "role", ".lvh.me");

  return response;
}
