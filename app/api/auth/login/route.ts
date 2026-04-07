import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import { getCookieDomain } from "@/lib/cookie-domain";
import type { Database } from "@/types/supabase";
import { fail, ok } from "@/lib/http/response";

// --------------- helpers ---------------

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://lvh.me:3000",
  "http://developer.lvh.me:3000",
  "http://management.lvh.me:3000",
  "http://finance.lvh.me:3000",
  "http://hr.lvh.me:3000",
  "http://produksi.lvh.me:3000",
  "http://logistik.lvh.me:3000",
  "http://creative.lvh.me:3000",
  "http://office.lvh.me:3000",
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
      : "http://localhost:3000";

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
    "developer":           "developer",
    "senior-developer":    "developer",
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

  if (slug.includes("developer"))  return "developer";
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

function buildTenantRedirectUrl(subdomain: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    const base = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const baseUrl = new URL(base);
    const hostname = baseUrl.hostname.replace(/^www\./, "");
    return `${baseUrl.protocol}//${subdomain}.${hostname}${baseUrl.port ? `:${baseUrl.port}` : ""}`;
  }
  return `http://${subdomain}.localhost:3000`;
}

// --------------- CORS preflight ---------------

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}

// --------------- POST handler ---------------

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      const response = fail("BAD_REQUEST", "Body request harus JSON valid.", 400);
      Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      const response = fail("VALIDATION_ERROR", "Email dan password wajib diisi.", 400);
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
      const response = fail("UNAUTHORIZED", error.message, 401);
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

    let profile = null;
    if (!role && data.user?.id) {
      const res = await supabase
        .schema("core")
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      profile = res.data;
      role = typeof profile?.role === "string" ? profile.role : null;
    }

    const subdomain = mapRoleToSubdomain(role);
    const redirectUrl = buildTenantRedirectUrl(subdomain);

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

    return finalResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const response = fail("INTERNAL_ERROR", message, 500);
    Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
    return response;
  }
}
