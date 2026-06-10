/**
 * Resolves the cookie domain for auth cookies.
 *
 * With path-based routing (no subdomains), we generally don't need to
 * set a cookie domain — the browser defaults to the current host.
 *
 * Returns undefined when no cross-domain sharing is needed.
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

  if (!hostname) return undefined;

  // In local dev, no domain needed (browser defaults to current host)
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return undefined;

  // For production with a custom domain, set domain for cookie sharing
  // e.g., "dashboard.example.com" → ".dashboard.example.com"
  if (hostname !== "localhost" && !hostname.includes("localhost")) {
    return `.${hostname}`;
  }

  return undefined;
}
