import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type AppRole =
  | "super-admin"
  | "management"
  | "finance"
  | "hr"
  | "produksi"
  | "logistik"
  | "creative"
  | "office";

type ProtectedRoute = {
  prefix: string;
  allowed: AppRole[];
};

const LOGIN_PATH = "/auth/login";
const DEV_ROOT_HOST = "lvh.me";

const VALID_SUBDOMAINS: AppRole[] = [
  "creative",
  "super-admin",
  "finance",
  "hr",
  "logistik",
  "management",
  "produksi",
  "office",
];

const ACCESS_CONTROL_LIST: ProtectedRoute[] = [
  { prefix: "/finance", allowed: ["finance", "management", "super-admin"] },
  { prefix: "/logistik", allowed: ["logistik", "management", "super-admin"] },
  { prefix: "/hr", allowed: ["hr", "management", "super-admin"] },
  { prefix: "/management", allowed: ["management", "super-admin"] },
  { prefix: "/produksi", allowed: ["produksi", "management", "super-admin"] },
  { prefix: "/creative", allowed: ["creative", "management", "super-admin"] },
  { prefix: "/office", allowed: ["office", "management", "super-admin"] },
  { prefix: "/super-admin", allowed: ["super-admin"] },
];

const ROLE_DASHBOARD: Record<AppRole, string> = {
  "super-admin": "/super-admin",
  management: "/management",
  finance: "/finance",
  hr: "/hr",
  produksi: "/produksi",
  logistik: "/logistik",
  creative: "/creative",
  office: "/office",
};

function normalizeRole(input: string | null | undefined): AppRole | null {
  if (!input) return null;

  // Slugify: lowercase, collapse non-alphanumeric runs to "-", trim dashes
  const slug = input.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  // ── Pass 1: exact slug match ──────────────────────────────────────────────
  const exactMap: Record<string, AppRole> = {
    "super-admin":         "super-admin",
    "developer":           "super-admin",
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

  // ── Pass 2: substring keyword fallback (handles arbitrary compound names) ─
  if (slug.includes("super-admin") || slug.includes("developer"))  return "super-admin";
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

  return null;
}
import { createServerClient } from "@supabase/ssr";

function getHostWithoutPort(hostHeader: string): string {
  return hostHeader.split(":")[0]?.toLowerCase() ?? "";
}

function resolveCookieDomain(hostHeader: string): string | undefined {
  const host = getHostWithoutPort(hostHeader);
  if (host === "localhost" || host.endsWith(".localhost")) return ".localhost";
  if (host === DEV_ROOT_HOST || host.endsWith(`.${DEV_ROOT_HOST}`)) return `.${DEV_ROOT_HOST}`;

  const configured = process.env.APP_COOKIE_DOMAIN?.replace(/^\./, "");
  if (configured) return `.${configured}`;
  return undefined;
}

function resolveAuthRootHost(hostHeader: string): string | null {
  const host = getHostWithoutPort(hostHeader);
  if (host.endsWith(".localhost") && host !== "localhost") return "localhost";
  if (host.endsWith(`.${DEV_ROOT_HOST}`) && host !== DEV_ROOT_HOST) return DEV_ROOT_HOST;
  return null;
}

async function readRoleFromSupabaseSession(request: NextRequest, response: NextResponse): Promise<AppRole | null> {
  const cookieDomain = resolveCookieDomain(request.headers.get("host") ?? "");

  const supabase = createServerClient(
    env.supabaseUrl, 
    env.supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          const raw = request.cookies.get(name)?.value;
          if (!raw) return undefined;
          
          // Handle base64- prefix set by browser client
          if (raw.startsWith("base64-")) {
            try {
              return atob(raw.slice(7));
            } catch {
              return raw;
            }
          }
          return raw;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          response.cookies.set({ 
            name, value, 
            ...(options as object), 
            ...(cookieDomain ? { domain: cookieDomain } : {})
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ 
            name, value: "", 
            ...(options as object), 
            ...(cookieDomain ? { domain: cookieDomain } : {}),
            maxAge: 0 
          });
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.log("[PROXY] getUser error:", userError.message);
  }

  console.log("[PROXY] session user:", user?.email ?? "(no session)");
  if (!user) return null;

  const metaRole = typeof user.user_metadata?.role === "string" ? user.user_metadata.role : null;
  const appRole  = typeof user.app_metadata?.role  === "string" ? user.app_metadata.role  : null;
  console.log("[PROXY] role from user_metadata:", metaRole);
  console.log("[PROXY] role from app_metadata:",  appRole);

  let role = normalizeRole(metaRole) ?? normalizeRole(appRole);

  if (!role && user.id) {
    const { data: profile, error: profileError } = await supabase
      .schema("core")
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    console.log("[PROXY] role from DB profile:", profile?.role ?? "(none)", profileError ? `| error: ${profileError.message}` : "");
    role = normalizeRole(typeof profile?.role === "string" ? profile.role : null);
  }

  console.log("[PROXY] resolved role:", role ?? "(null — no match)");
  return role;
}

function readRoleFromSimpleCookies(request: NextRequest): AppRole | null {
  const roleCookieKeys = ["role", "user_role", "profile_role", "division_role", "access_role"];

  for (const key of roleCookieKeys) {
    const role = normalizeRole(request.cookies.get(key)?.value);
    if (role) return role;
  }

  return null;
}

async function resolveCurrentRole(request: NextRequest, response: NextResponse): Promise<AppRole | null> {
  return readRoleFromSimpleCookies(request) ?? (await readRoleFromSupabaseSession(request, response));
}

function findRouteRule(pathname: string): ProtectedRoute | null {
  return (
    ACCESS_CONTROL_LIST.find(
      (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
    ) ?? null
  );
}

function resolveRewrittenPath(pathname: string, hostHeader: string): string {
  const subdomain = hostHeader.split(".")[0]?.toLowerCase();
  if (!subdomain || !VALID_SUBDOMAINS.includes(subdomain as AppRole)) {
    return pathname;
  }

  // Preserve absolute cross-module routing (to stop 404s on layout skips).
  const hasValidPrefix = VALID_SUBDOMAINS.some(v => pathname === `/${v}` || pathname.startsWith(`/${v}/`));
  if (hasValidPrefix) {
    return pathname;
  }

  if (pathname === `/${subdomain}` || pathname.startsWith(`/${subdomain}/`)) {
    return pathname;
  }

  return `/${subdomain}${pathname}`;
}

function isLocalhostSubdomain(hostHeader: string) {
  const hostWithoutPort = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  if (hostWithoutPort.endsWith(".localhost")) {
    return hostWithoutPort !== "localhost";
  }
  if (hostWithoutPort.endsWith(`.${DEV_ROOT_HOST}`)) {
    return hostWithoutPort !== DEV_ROOT_HOST;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostHeader = request.headers.get("host") ?? "";
  const authRootHost = resolveAuthRootHost(hostHeader);
  const requestHeaders = new Headers(request.headers);
  let response = NextResponse.next();

  console.log("[PROXY] incoming:", hostHeader, request.method, url.pathname);

  if (url.pathname.includes(".")) {
    return response;
  }

  if (url.pathname.startsWith("/auth")) {
    if (isLocalhostSubdomain(hostHeader) && authRootHost) {
      const authUrl = request.nextUrl.clone();
      authUrl.hostname = authRootHost;
      return NextResponse.redirect(authUrl);
    }
    return response;
  }

  const effectivePathname = resolveRewrittenPath(url.pathname, hostHeader);
  const routeRule = findRouteRule(effectivePathname);

  console.log("[PROXY] host:", hostHeader);
  console.log("[PROXY] pathname (original):", url.pathname);
  console.log("[PROXY] effectivePathname:", effectivePathname);
  console.log("[PROXY] routeRule matched:", routeRule ? `${routeRule.prefix} (allowed: ${routeRule.allowed.join(",")})` : "(none — unprotected)");

  if (routeRule) {
    const role = await resolveCurrentRole(request, response);

    console.log("[PROXY] role resolved:", role ?? "(null)");
    console.log("[PROXY] session exists:", !!role);

    if (!role) {
      console.log("[PROXY] BRANCH → redirecting to login (no role)");
      const loginUrl = request.nextUrl.clone();
      if (authRootHost) loginUrl.hostname = authRootHost;
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set("next", effectivePathname);
      const redirect = NextResponse.redirect(loginUrl);
      response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value));
      return redirect;
    }

    const isAllowed = routeRule.allowed.includes(role);
    console.log("[PROXY] role allowed for this route:", isAllowed);

    if (!isAllowed) {
      const dashboardPath = ROLE_DASHBOARD[role] ?? LOGIN_PATH;
      console.log("[PROXY] BRANCH → role denied, redirecting to:", dashboardPath);
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = dashboardPath;
      deniedUrl.searchParams.set("denied", "1");
      const redirect = NextResponse.redirect(deniedUrl);
      response.cookies.getAll().forEach(c => redirect.cookies.set(c.name, c.value));
      return redirect;
    }

    console.log("[PROXY] BRANCH → access granted, continuing");
    requestHeaders.set("x-user-role", role);
  }

  if (effectivePathname !== url.pathname) {
    console.log("[PROXY] BRANCH → rewriting", url.pathname, "→", effectivePathname);
    const rewrite = NextResponse.rewrite(new URL(effectivePathname, request.url), {
      request: { headers: requestHeaders }
    });
    response.cookies.getAll().forEach(c => rewrite.cookies.set(c.name, c.value));
    return rewrite;
  }

  console.log("[PROXY] BRANCH → passthrough (no rewrite needed)");
  const passthrough = NextResponse.next({
    request: { headers: requestHeaders }
  });
  response.cookies.getAll().forEach(c => passthrough.cookies.set(c.name, c.value));
  return passthrough;
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.svg|style.css).*)"],
};
