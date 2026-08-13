import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { getBrandingConfig } from "@/lib/services/branding.service";
import { primaryHoverColor } from "@/lib/utils/color";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Branding adalah konfigurasi runtime dari database — halaman harus dirender
// per request agar CSS variables/metadata selalu mengambil konfigurasi
// tersimpan terbaru (bukan dibekukan saat build).
export const dynamic = "force-dynamic";

/**
 * Metadata dinamis dari konfigurasi branding (single source of truth).
 * Fallback ke default saat database kosong/error — halaman tidak pernah
 * gagal render.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const branding = await getBrandingConfig();
    return {
      title: branding.appName,
      description: "Unified Enterprise Dashboard",
      icons: {
        icon: branding.faviconUrl,
      },
    };
  } catch {
    return {
      title: "Suryo Agong",
      description: "Unified Enterprise Dashboard",
      icons: {
        icon: "/icon.png",
      },
    };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Nilai branding dirender server-side sebagai CSS variables.
  // Payload RSC mengirim nilai yang sama ke client → aman dari hydration error.
  let brandCssVars: React.CSSProperties = {};
  try {
    const branding = await getBrandingConfig();
    brandCssVars = {
      "--brand-primary": branding.dashboardPrimary,
      "--brand-primary-hover": primaryHoverColor(branding.dashboardPrimary),
      "--brand-secondary": branding.dashboardSecondary,
      "--brand-landing-background": branding.landingBackground,
      "--brand-landing-primary": branding.landingPrimary,
      "--brand-landing-primary-hover": primaryHoverColor(branding.landingPrimary),
      "--brand-landing-secondary": branding.landingSecondary,
      "--brand-login-background": branding.loginBackground,
      "--brand-login-primary": branding.loginPrimary,
      "--brand-login-primary-hover": primaryHoverColor(branding.loginPrimary),
      "--brand-login-secondary": branding.loginSecondary,
      "--brand-dashboard-background": branding.dashboardBackground,
      "--brand-dashboard-primary": branding.dashboardPrimary,
      "--brand-dashboard-primary-hover": primaryHoverColor(branding.dashboardPrimary),
      "--brand-dashboard-secondary": branding.dashboardSecondary,
      "--brand-sidebar-background": branding.sidebarBackground,
    } as React.CSSProperties;
  } catch {
    brandCssVars = {};
  }

  return (
    <html lang="en" style={brandCssVars}>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-400`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
