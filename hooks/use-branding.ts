"use client";

import { useEffect, useState } from "react";

export interface BrandingSettings {
  companyName: string;
  appName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  companyName: "PT Doa Suryo Agong",
  appName: "Suryo Agong",
  primaryColor: "#BC934B",
  secondaryColor: "#1e293b",
  logoUrl: "/logo.png",
  faviconUrl: "/icon.png",
};

type BrandingResponse = {
  ok: boolean;
  success: boolean;
  data: { settings: BrandingSettings } | null;
  error?: { message?: string } | null;
};

// Single-flight module cache: menghindari fetch berulang untuk konsumen
// yang dirender bersamaan (sidebar, topbar, login, dsb).
let cachedPromise: Promise<BrandingSettings> | null = null;

async function fetchBranding(): Promise<BrandingSettings> {
  if (!cachedPromise) {
    cachedPromise = (async () => {
      try {
        const response = await fetch("/api/branding", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });
        const payload = (await response.json()) as BrandingResponse;
        if (!response.ok || !payload.success || !payload.data?.settings) {
          throw new Error(payload.error?.message ?? "Gagal memuat branding.");
        }
        return payload.data.settings;
      } catch (error) {
        console.error("[BRANDING] Gagal memuat konfigurasi:", error);
        return DEFAULT_BRANDING_SETTINGS;
      }
    })();
  }
  return cachedPromise;
}

/**
 * Client-side branding config dengan fallback default.
 * Aman dipakai di halaman publik maupun halaman ber-auth.
 */
export function useBranding() {
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_BRANDING_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    void fetchBranding().then((result) => {
      if (isMounted) {
        setSettings(result);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  return { ...settings, loading };
}
