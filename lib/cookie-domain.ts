/**
 * Resolves the cookie domain for subdomain-based multi-tenant auth.
 *
 * In local dev  → ".localhost"   (shared across *.localhost)
 * In production → ".example.com" (shared across *.example.com)
 *
 * Browsers require a leading dot for subdomain cookie sharing.
 */
function parseHostname(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `http://${value}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function getCookieDomain(fallbackHost?: string): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const hostname = siteUrl
    ? parseHostname(siteUrl)
    : fallbackHost
      ? parseHostname(fallbackHost)
      : null;

  if (hostname) {
    if (hostname === "localhost" || hostname.endsWith(".localhost")) return ".localhost";
    if (hostname === "lvh.me" || hostname.endsWith(".lvh.me")) return ".lvh.me";
    return `.${hostname}`;
  }

  // Local dev: ".localhost" allows cookie sharing across *.localhost
  return ".localhost";
}
