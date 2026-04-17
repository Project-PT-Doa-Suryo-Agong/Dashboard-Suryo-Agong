import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { getCookieDomain } from "@/lib/cookie-domain";
import type { Database } from "@/types/supabase";
import { fail, ok } from "@/lib/http/response";
import { ErrorCode } from "@/lib/http/error-codes";

// --------------- helpers ---------------

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://lvh.me:3000",
  "http://super-admin.lvh.me:3000",
  "http://management.lvh.me:3000",
  "http://finance.lvh.me:3000",
  "http://hr.lvh.me:3000",
  "http://produksi.lvh.me:3000",
  "http://logistik.lvh.me:3000",
  "http://creative.lvh.me:3000",
  "http://office.lvh.me:3000",
];

function isAllowedOrigin(origin: string | null): origin is string {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;

    // Allow Vercel preview/prod domains.
    if (parsed.hostname.endsWith(".vercel.app")) return true;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      const base = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
      const baseHost = base.hostname.replace(/^www\./, "");
      const reqHost = parsed.hostname.replace(/^www\./, "");
      if (reqHost === baseHost || reqHost.endsWith(`.${baseHost}`)) return true;
    }
  } catch {
    return false;
  }

  return false;
}

function getCorsHeaders(origin: string | null, fallbackOrigin: string) {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : fallbackOrigin;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };
}

function slugifyRole(role: string) {
  return role
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapRoleToSubdomain(role: string | null | undefined): string {
  if (!role) return "management";
  const slug = slugifyRole(role);

  const exactMap: Record<string, string> = {
    "super-admin":         "super-admin",
    "developer":           "super-admin",
    "senior-developer":    "super-admin",
    "ceo":                 "management",
    "management":          "management",
    "manager":             "management",
    "management-strategy": "management",
    "management-strategic":"management",
    "finance":             "finance",
    "finance-accounting":  "finance",
    "finance-team":        "finance",
    "hr":                  "hr",
    "human-resource":      "hr",
    "human-resources":     "hr",
    "human-resource-dept": "hr",
    "human-resources-dept":"hr",
    "produksi":            "produksi",
    "production":          "produksi",
    "produksi-team":       "produksi",
    "logistik":            "logistik",
    "logistics":           "logistik",
    "logistik-team":       "logistik",
    "creative":            "creative",
    "creative-manager":    "creative",
    "sales":               "creative",
    "creative-sales":      "creative",
    "office":              "office",
    "office-support":      "office",
  };

  if (exactMap[slug]) return exactMap[slug];

  if (slug.includes("super-admin") || slug.includes("developer")) return "super-admin";
  if (slug.includes("management")) return "management";
  if (slug.includes("ceo"))        return "management";
  if (slug.includes("finance"))    return "finance";
  if (slug.includes("human-resource")) return "hr";
  if (slug.includes("produksi"))   return "produksi";
  if (slug.includes("production")) return "produksi";
  if (slug.includes("logistik"))   return "logistik";
  if (slug.includes("logistics"))  return "logistik";
  if (slug.includes("creative"))   return "creative";
  if (slug.includes("sales"))      return "creative";
  if (slug.includes("office"))     return "office";
  if (slug.includes("hr"))         return "hr";

  return "management";
}

function buildTenantRedirectUrl(subdomain: string, requestOrigin: string): string {
  const dashboardPath = `/${subdomain}`;

  const fallbackBase = new URL(requestOrigin);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  let baseUrl = fallbackBase;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    baseUrl = new URL(base);
  }

  const hostname = baseUrl.hostname.replace(/^www\./, "");
  const isLocalHost =
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "lvh.me" ||
    hostname.endsWith(".lvh.me");

  if (isLocalHost) {
    return `${baseUrl.protocol}//${subdomain}.${hostname}${baseUrl.port ? `:${baseUrl.port}` : ""}${dashboardPath}`;
  }

  // In hosted environments without wildcard subdomain setup, keep same host and route by path.
  return `${baseUrl.protocol}//${hostname}${baseUrl.port ? `:${baseUrl.port}` : ""}${dashboardPath}`;
}

// --------------- CORS preflight ---------------

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fallbackOrigin = request.nextUrl.origin;
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin, fallbackOrigin),
  });
}

// --------------- POST handler ---------------

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const fallbackOrigin = request.nextUrl.origin;
  const corsHeaders = getCorsHeaders(origin, fallbackOrigin);

  try {
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      const response = fail(ErrorCode.INVALID_JSON, "Body request harus JSON valid.", 400);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      const response = fail(ErrorCode.VALIDATION_ERROR, "Email dan password wajib diisi.", 400);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const cookieDomain = getCookieDomain();

    // Collect all cookies Supabase sets, including chunked auth cookies.
    const cookieMap = new Map<string, {
      value: string;
      options: Record<string, unknown>;
    }>();

    const supabase = createServerClient<Database>(
      env.supabaseUrl,
      env.supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: Record<string, unknown>) {
            cookieMap.set(name, { value, options });
          },
          remove(name: string, options: Record<string, unknown>) {
            cookieMap.set(name, {
              value: "",
              options: { ...options, maxAge: 0 },
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const response = fail(ErrorCode.UNAUTHORIZED, error.message, 401);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    let role =
      (typeof data.user?.user_metadata?.role === "string"
        ? data.user.user_metadata.role
        : null) ??
      (typeof data.user?.app_metadata?.role === "string"
        ? data.user.app_metadata.role
        : null);
    let displayName =
      (typeof data.user?.user_metadata?.nama === "string" ? data.user.user_metadata.nama : null) ??
      (typeof data.user?.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null) ??
      null;

    let profile = null;
    if (data.user?.id) {
      const res = await supabase
        .schema("core")
        .from("profiles")
        .select("role, nama")
        .eq("id", data.user.id)
        .maybeSingle();
      profile = res.data;
      if (!role) role = typeof profile?.role === "string" ? profile.role : null;
      if (!displayName) displayName = typeof profile?.nama === "string" ? profile.nama : null;
    }

    const subdomain = mapRoleToSubdomain(role);
    const redirectUrl = buildTenantRedirectUrl(subdomain, fallbackOrigin);

    const finalResponse = ok({ redirectUrl }, "Login berhasil.");
    Object.entries(corsHeaders).forEach(([key, value]) => finalResponse.headers.set(key, value));

    for (const [name, { value, options }] of cookieMap.entries()) {
      finalResponse.cookies.set({
        name,
        value,
        ...(options as object),
        domain: cookieDomain,
        sameSite: "lax",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      });
    }

    if (role) {
      finalResponse.cookies.set("role", role, {
        domain: cookieDomain,
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    if (displayName) {
      finalResponse.cookies.set("display_name", displayName, {
        domain: cookieDomain,
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const response = fail(ErrorCode.INTERNAL_ERROR, message, 500);
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
}
