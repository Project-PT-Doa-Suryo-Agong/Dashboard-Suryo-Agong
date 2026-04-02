/**
 * Resolves the cookie domain for subdomain-based multi-tenant auth.
 *
 * In local dev  → ".localhost"   (shared across *.localhost)
 * In production → ".example.com" (shared across *.example.com)
 *
 * Browsers require a leading dot for subdomain cookie sharing.
 */
export function getCookieDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    try {
      const url = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
      const hostname = url.hostname.replace(/^www\./, "");
      // Return ".domain.com" for subdomain sharing
      return `.${hostname}`;
    } catch {
      // Malformed URL, fall through to localhost default
    }
  }

  // Local dev: ".localhost" allows cookie sharing across *.localhost
  return ".localhost";
}
