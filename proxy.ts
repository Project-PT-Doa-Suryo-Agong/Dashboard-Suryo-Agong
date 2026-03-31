import { NextResponse, type NextRequest } from "next/server";

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
  const value = input.trim().toLowerCase();

  if (value === "developer") return "developer";
  if (value === "ceo" || value === "management") return "management";
  if (value === "finance") return "finance";
  if (value === "hr" || value === "human resource") return "hr";
  if (value === "produksi" || value === "production") return "produksi";
  if (value === "logistik" || value === "logistics") return "logistik";
  if (value === "creative" || value === "sales") return "creative";
  if (value === "office") return "office";

  return null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readRoleFromSupabaseCookies(request: NextRequest): AppRole | null {
  const authCookie = request.cookies
    .getAll()
    .find((cookie) => cookie.name.includes("auth-token"));

  if (!authCookie) return null;

  const parseCandidates = [authCookie.value, decodeURIComponent(authCookie.value)];

  for (const candidate of parseCandidates) {
    try {
      const parsed = JSON.parse(candidate) as unknown;

      const accessToken =
        (Array.isArray(parsed) ? parsed[0] : null) ??
        (typeof parsed === "object" && parsed !== null && "access_token" in parsed
          ? (parsed as { access_token?: string }).access_token
          : null);

      if (typeof accessToken === "string" && accessToken.length > 0) {
        const payload = decodeJwtPayload(accessToken);
        if (!payload) continue;

        const appMeta =
          typeof payload.app_metadata === "object" && payload.app_metadata !== null
            ? (payload.app_metadata as Record<string, unknown>)
            : null;
        const userMeta =
          typeof payload.user_metadata === "object" && payload.user_metadata !== null
            ? (payload.user_metadata as Record<string, unknown>)
            : null;

        const role =
          normalizeRole(typeof payload.role === "string" ? payload.role : null) ??
          normalizeRole(typeof appMeta?.role === "string" ? appMeta.role : null) ??
          normalizeRole(typeof userMeta?.role === "string" ? userMeta.role : null);

        if (role) return role;
      }
    } catch {
      continue;
    }
  }

  return null;
}

function readRoleFromSimpleCookies(request: NextRequest): AppRole | null {
  const roleCookieKeys = ["role", "user_role", "profile_role", "division_role", "access_role"];

  for (const key of roleCookieKeys) {
    const role = normalizeRole(request.cookies.get(key)?.value);
    if (role) return role;
  }

  return null;
}

function resolveCurrentRole(request: NextRequest): AppRole | null {
  return readRoleFromSimpleCookies(request) ?? readRoleFromSupabaseCookies(request);
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

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostHeader = request.headers.get("host") ?? "";

  if (url.pathname.includes(".")) {
    return NextResponse.next();
  }

  if (url.pathname.startsWith("/auth")) {
    if (isLocalhostSubdomain(hostHeader)) {
      const authUrl = request.nextUrl.clone();
      authUrl.hostname = DEV_ROOT_HOST;
      return NextResponse.redirect(authUrl);
    }

    return NextResponse.next();
  }

  const effectivePathname = resolveRewrittenPath(url.pathname, hostHeader);
  const routeRule = findRouteRule(effectivePathname);

  if (routeRule) {
    const role = resolveCurrentRole(request);
    if (!role) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.hostname = DEV_ROOT_HOST;
      loginUrl.pathname = LOGIN_PATH;
      loginUrl.searchParams.set("next", effectivePathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!routeRule.allowed.includes(role)) {
      const deniedUrl = request.nextUrl.clone();
      deniedUrl.pathname = ROLE_DASHBOARD[role] ?? LOGIN_PATH;
      deniedUrl.searchParams.set("denied", "1");
      return NextResponse.redirect(deniedUrl);
    }
  }

  if (effectivePathname !== url.pathname) {
    return NextResponse.rewrite(new URL(effectivePathname, request.url));
  }

  return NextResponse.next();
}

export const middleware = proxy;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.svg|style.css).*)"],
};