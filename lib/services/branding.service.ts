import { supabaseAdmin } from "@/lib/supabase/admin";
import type { AppSettings } from "@/types/supabase";

/**
 * Branding configuration surfaced to the whole app.
 * Any missing/empty field falls back to DEFAULT_BRANDING.
 */
export interface BrandingConfig {
  companyName: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  landingBackground: string;
  landingPrimary: string;
  landingSecondary: string;
  loginBackground: string;
  loginPrimary: string;
  loginSecondary: string;
  dashboardBackground: string;
  dashboardPrimary: string;
  dashboardSecondary: string;
  sidebarBackground: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: "PT Doa Suryo Agong",
  appName: "Suryo Agong",
  primaryColor: "#BC934B",
  secondaryColor: "#1e293b",
  logoUrl: "/logo.png",
  faviconUrl: "/icon.png",
  landingBackground: "#33465c",
  landingPrimary: "#BC934B",
  landingSecondary: "#1e293b",
  loginBackground: "#334155",
  loginPrimary: "#BC934B",
  loginSecondary: "#1e293b",
  dashboardBackground: "#f1f5f9",
  dashboardPrimary: "#BC934B",
  dashboardSecondary: "#1e293b",
  sidebarBackground: "#1e293b",
};

function pickString(value: string | null | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

/**
 * Map a raw DB row (or null) to a fully-resolved BrandingConfig.
 * Never throws — missing/empty fields always fall back to defaults.
 */
export function resolveBrandingConfig(row: AppSettings | null | undefined): BrandingConfig {
  const legacyPrimaryFallback = row?.primary_color ?? DEFAULT_BRANDING.primaryColor;
  const legacySecondaryFallback = row?.secondary_color ?? DEFAULT_BRANDING.secondaryColor;
  return {
    companyName: pickString(row?.company_name, DEFAULT_BRANDING.companyName),
    appName: pickString(row?.app_name, DEFAULT_BRANDING.appName),
    primaryColor: legacyPrimaryFallback,
    secondaryColor: legacySecondaryFallback,
    logoUrl: pickString(row?.logo_url, DEFAULT_BRANDING.logoUrl),
    faviconUrl: pickString(row?.favicon_url, DEFAULT_BRANDING.faviconUrl),
    landingBackground: pickString(row?.landing_background, DEFAULT_BRANDING.landingBackground),
    landingPrimary: pickString(row?.landing_primary, legacyPrimaryFallback),
    landingSecondary: pickString(row?.landing_secondary, legacySecondaryFallback),
    loginBackground: pickString(row?.login_background, DEFAULT_BRANDING.loginBackground),
    loginPrimary: pickString(row?.login_primary, legacyPrimaryFallback),
    loginSecondary: pickString(row?.login_secondary, legacySecondaryFallback),
    dashboardBackground: pickString(row?.dashboard_background, DEFAULT_BRANDING.dashboardBackground),
    dashboardPrimary: pickString(row?.dashboard_primary, legacyPrimaryFallback),
    dashboardSecondary: pickString(row?.dashboard_secondary, legacySecondaryFallback),
    sidebarBackground: pickString(row?.sidebar_background, legacySecondaryFallback),
  };
}

/**
 * Read the stored branding config from core.app_settings (single row, id = 1).
 * On any error (table missing, DB down, env missing) returns defaults so the
 * application keeps working.
 */
export async function getBrandingConfig(): Promise<BrandingConfig> {
  try {
    const { data, error } = await supabaseAdmin
      .schema("core")
      .from("app_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      console.error("[BRANDING] Gagal membaca app_settings:", error.message);
      return DEFAULT_BRANDING;
    }

    return resolveBrandingConfig(data as AppSettings | null);
  } catch (error) {
    console.error("[BRANDING] Error membaca app_settings:", error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Create/update the branding config (upsert single row id = 1).
 * Called from the API route after Developer-only authorization.
 */
export async function saveBrandingConfig(
  input: Partial<BrandingConfig>,
  updatedBy: string
): Promise<BrandingConfig> {
  const { data, error } = await supabaseAdmin
    .schema("core")
    .from("app_settings")
    .upsert(
      {
        id: 1,
        company_name: input.companyName ?? null,
        app_name: input.appName ?? null,
        primary_color: input.primaryColor ?? null,
        secondary_color: input.secondaryColor ?? null,
        logo_url: input.logoUrl ?? null,
        favicon_url: input.faviconUrl ?? null,
        landing_background: input.landingBackground ?? null,
        landing_primary: input.landingPrimary ?? null,
        landing_secondary: input.landingSecondary ?? null,
        login_background: input.loginBackground ?? null,
        login_primary: input.loginPrimary ?? null,
        login_secondary: input.loginSecondary ?? null,
        dashboard_background: input.dashboardBackground ?? null,
        dashboard_primary: input.dashboardPrimary ?? null,
        dashboard_secondary: input.dashboardSecondary ?? null,
        sidebar_background: input.sidebarBackground ?? null,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal menyimpan branding: ${error.message}`);
  }

  return resolveBrandingConfig(data as AppSettings | null);
}

/**
 * Reset branding back to defaults by removing the stored row.
 * Returns the default config so callers can immediately use it.
 */
export async function resetBrandingConfig(): Promise<BrandingConfig> {
  try {
    const { error } = await supabaseAdmin
      .schema("core")
      .from("app_settings")
      .delete()
      .eq("id", 1);

    if (error) {
      throw new Error(`Gagal mereset branding: ${error.message}`);
    }
  } catch (error) {
    console.error("[BRANDING] Error reset app_settings:", error);
    throw error instanceof Error ? error : new Error("Gagal mereset branding.");
  }

  return DEFAULT_BRANDING;
}
