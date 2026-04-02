import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

type AppRole =
  | "developer"
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
  "developer",
  "finance",
  "hr",
  "logistik",
  "management",
  "produksi",
  "office",
];

const ACCESS_CONTROL_LIST: ProtectedRoute[] = [
  { prefix: "/finance", allowed: ["finance", "management"] },
  { prefix: "/logistik", allowed: ["logistik", "management"] },
  { prefix: "/hr", allowed: ["hr", "management"] },
  { prefix: "/management", allowed: ["management"] },
  { prefix: "/produksi", allowed: ["produksi", "management"] },
  { prefix: "/creative", allowed: ["creative", "management"] },
  { prefix: "/office", allowed: ["office", "management"] },
  { prefix: "/developer", allowed: ["developer"] },
];

const ROLE_DASHBOARD: Record<AppRole, string> = {
  developer: "/developer",
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

  // ── Pass 2: substring keyword fallback (handles arbitrary compound names) ─
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

  return null;
}
import { createServerClient } from "@supabase/ssr";

async function readRoleFromSupabaseSession(request: NextRequest, response: NextResponse): Promise<AppRole | null> {
  const cookieDomain = DEV_ROOT_HOST;

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
            domain: `.${cookieDomain}` 
          });
        },
        remove(name: string, options: Record<string, unknown>) {
          response.cookies.set({ 
            name, value: "", 
            ...(options as object), 
            domain: `.${cookieDomain}`, 
            maxAge: 0 
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  console.log("[PROXY] session user:", session?.user?.email ?? "(no session)");
  if (!session?.user) return null;

  const metaRole = typeof session.user.user_metadata?.role === "string" ? session.user.user_metadata.role : null;
  const appRole  = typeof session.user.app_metadata?.role  === "string" ? session.user.app_metadata.role  : null;
  console.log("[PROXY] role from user_metadata:", metaRole);
  console.log("[PROXY] role from app_metadata:",  appRole);

  let role = normalizeRole(metaRole) ?? normalizeRole(appRole);

  if (!role && session.user.id) {
    const { data: profile, error: profileError } = await supabase
      .schema("core")
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
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
  let response = NextResponse.next();

  console.log("[PROXY] incoming:", hostHeader, request.method, url.pathname);

  if (url.pathname.includes(".")) {
    return response;
  }

  if (url.pathname.startsWith("/auth")) {
    if (isLocalhostSubdomain(hostHeader)) {
      const authUrl = request.nextUrl.clone();
      authUrl.hostname = DEV_ROOT_HOST;
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
      loginUrl.hostname = DEV_ROOT_HOST;
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
  }

  if (effectivePathname !== url.pathname) {
    console.log("[PROXY] BRANCH → rewriting", url.pathname, "→", effectivePathname);
    const rewrite = NextResponse.rewrite(new URL(effectivePathname, request.url));
    response.cookies.getAll().forEach(c => rewrite.cookies.set(c.name, c.value));
    return rewrite;
  }

  console.log("[PROXY] BRANCH → passthrough (no rewrite needed)");
  return response;
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.svg|style.css).*)"],
};
