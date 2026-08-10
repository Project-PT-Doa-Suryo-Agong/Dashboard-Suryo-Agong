import { describe, expect, it, vi } from "vitest";
import { requireHexColor, requireAssetUrl } from "@/lib/validation/branding";

// Service membawa supabaseAdmin (butuh env) — mock agar fungsi murni
// (resolveBrandingConfig) bisa diuji tanpa koneksi DB.
vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {},
}));

import { resolveBrandingConfig, DEFAULT_BRANDING } from "@/lib/services/branding.service";
import type { AppSettings } from "@/types/supabase";

describe("requireHexColor", () => {
  it("menerima HEX 6 digit", () => {
    const result = requireHexColor({ color: "#BC934B" }, "color");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("#BC934B");
  });

  it("menormalisasi ke huruf besar", () => {
    const result = requireHexColor({ color: "#bc934b" }, "color");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBe("#BC934B");
  });

  it("menolak format invalid (tanpa #, 3 digit, 7 digit, bukan hex)", () => {
    expect(requireHexColor({ color: "BC934B" }, "color").ok).toBe(false);
    expect(requireHexColor({ color: "#BC9" }, "color").ok).toBe(false);
    expect(requireHexColor({ color: "#BC934B1" }, "color").ok).toBe(false);
    expect(requireHexColor({ color: "#GGGGGG" }, "color").ok).toBe(false);
    expect(requireHexColor({ color: 123 }, "color").ok).toBe(false);
  });

  it("wajib diisi kecuali optional", () => {
    expect(requireHexColor({}, "color").ok).toBe(false);
    expect(requireHexColor({}, "color", { optional: true }).ok).toBe(true);
  });
});

describe("requireAssetUrl", () => {
  it("menerima URL http(s) dan path lokal", () => {
    expect(
      requireAssetUrl({ url: "https://supabase.carubra.com/storage/v1/object/public/branding/x.png" }, "url").ok
    ).toBe(true);
    expect(requireAssetUrl({ url: "/logo.png" }, "url").ok).toBe(true);
  });

  it("menolak nilai bukan URL", () => {
    expect(requireAssetUrl({ url: "logo.png" }, "url").ok).toBe(false);
    expect(requireAssetUrl({ url: "javascript:alert(1)" }, "url").ok).toBe(false);
    expect(requireAssetUrl({ url: "//example.com" }, "url").ok).toBe(false);
  });

  it("mengembalikan null saat kosong dan optional", () => {
    const result = requireAssetUrl({ url: "" }, "url", { optional: true });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toBeNull();
  });
});

describe("resolveBrandingConfig — fallback default", () => {
  it("mengisi fallback default saat row null", () => {
    const config = resolveBrandingConfig(null);
    expect(config).toEqual(DEFAULT_BRANDING);
  });

  it("mengisi fallback per-field saat kolom kosong", () => {
    const row = {
      id: 1,
      company_name: null,
      app_name: "MyApp",
      primary_color: "#112233",
      secondary_color: null,
      logo_url: "",
      favicon_url: "  ",
    } as unknown as AppSettings;
    const config = resolveBrandingConfig(row);
    expect(config.appName).toBe("MyApp");
    expect(config.primaryColor).toBe("#112233");
    expect(config.companyName).toBe(DEFAULT_BRANDING.companyName);
    expect(config.secondaryColor).toBe(DEFAULT_BRANDING.secondaryColor);
    expect(config.logoUrl).toBe(DEFAULT_BRANDING.logoUrl);
    expect(config.faviconUrl).toBe(DEFAULT_BRANDING.faviconUrl);
  });
});
