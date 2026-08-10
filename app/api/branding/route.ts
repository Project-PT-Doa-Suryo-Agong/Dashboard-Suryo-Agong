import { fail, ok } from "@/lib/http/response";
import { ErrorCode } from "@/lib/http/error-codes";
import { requireRole } from "@/lib/guards/auth.guard";
import { requireString } from "@/lib/validation/body-validator";
import { requireHexColor, requireAssetUrl } from "@/lib/validation/branding";
import {
  DEFAULT_BRANDING,
  getBrandingConfig,
  saveBrandingConfig,
  resetBrandingConfig,
} from "@/lib/services/branding.service";

/**
 * GET /api/branding — public read-only.
 * Dipakai oleh halaman publik (login, landing, buku tamu) maupun halaman
 * ber-auth. Selalu mengembalikan konfigurasi dengan fallback default,
 * tidak pernah gagal render.
 */
export async function GET() {
  try {
    const settings = await getBrandingConfig();
    return ok({ settings });
  } catch (error) {
    console.error("[BRANDING] GET gagal:", error);
    return ok({ settings: DEFAULT_BRANDING });
  }
}

/**
 * PUT /api/branding — hanya role Developer.
 * Menyimpan (create/update) atau mereset konfigurasi branding.
 * Body:
 *   { companyName?, appName?, primaryColor?, secondaryColor?, logoUrl?, faviconUrl? }
 *   { reset: true }  → kembali ke default
 */
export async function PUT(request: Request) {
  const auth = await requireRole("Developer");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = (body ?? {}) as Record<string, unknown>;

  // Mode reset: hapus konfigurasi → kembali ke default
  if (input.reset === true) {
    try {
      const settings = await resetBrandingConfig();
      return ok({ settings }, "Branding berhasil direset ke default.");
    } catch (error) {
      return fail(
        ErrorCode.DB_ERROR,
        error instanceof Error ? error.message : "Gagal mereset branding.",
        500
      );
    }
  }

  const companyName = requireString(input, "companyName", { maxLen: 100 });
  if (!companyName.ok) return fail(ErrorCode.VALIDATION_ERROR, companyName.message, 400);

  const appName = requireString(input, "appName", { maxLen: 100 });
  if (!appName.ok) return fail(ErrorCode.VALIDATION_ERROR, appName.message, 400);

  const primaryColor = requireHexColor(input, "primaryColor");
  if (!primaryColor.ok) return fail(ErrorCode.VALIDATION_ERROR, primaryColor.message, 400);

  const secondaryColor = requireHexColor(input, "secondaryColor");
  if (!secondaryColor.ok) {
    return fail(ErrorCode.VALIDATION_ERROR, secondaryColor.message, 400);
  }

  const logoUrl = requireAssetUrl(input, "logoUrl", { optional: true });
  if (!logoUrl.ok) return fail(ErrorCode.VALIDATION_ERROR, logoUrl.message, 400);

  const faviconUrl = requireAssetUrl(input, "faviconUrl", { optional: true });
  if (!faviconUrl.ok) return fail(ErrorCode.VALIDATION_ERROR, faviconUrl.message, 400);

  try {
    const settings = await saveBrandingConfig(
      {
        companyName: companyName.data ?? undefined,
        appName: appName.data ?? undefined,
        primaryColor: primaryColor.data ?? undefined,
        secondaryColor: secondaryColor.data ?? undefined,
        logoUrl: logoUrl.data ?? undefined,
        faviconUrl: faviconUrl.data ?? undefined,
      },
      auth.ctx.userId
    );
    return ok({ settings }, "Branding berhasil disimpan.");
  } catch (error) {
    return fail(
      ErrorCode.DB_ERROR,
      error instanceof Error ? error.message : "Gagal menyimpan branding.",
      500
    );
  }
}
