"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Palette,
  Save,
  RotateCcw,
  Upload,
  Loader2,
  Lock,
  CheckCircle2,
  XCircle,
  Eye,
  Globe,
  LogIn,
  LayoutDashboard,
} from "lucide-react";
import type { ApiError, ApiSuccess } from "@/types/api";
import { apiFetch } from "@/lib/utils/api-fetch";
import { useProfile } from "@/hooks/use-profile";
import {
  uploadBrandingAsset,
  extractBrandingStoragePath,
  validateBrandingAsset,
} from "@/lib/utils/upload-branding-asset";
import { primaryHoverColor } from "@/lib/utils/color";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ThemePreview from "@/components/ui/ThemePreview";

type BrandingSettings = {
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
};

type BrandingPayload = {
  settings: BrandingSettings;
};

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

const INPUT_CLASS_NAME =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400";

function applyBrandTheme(settings: BrandingSettings) {
  const el = document.documentElement;
  el.style.setProperty("--brand-primary", settings.dashboardPrimary);
  el.style.setProperty("--brand-primary-hover", primaryHoverColor(settings.dashboardPrimary));
  el.style.setProperty("--brand-secondary", settings.dashboardSecondary);
  el.style.setProperty("--brand-landing-background", settings.landingBackground);
  el.style.setProperty("--brand-landing-primary", settings.landingPrimary);
  el.style.setProperty("--brand-landing-primary-hover", primaryHoverColor(settings.landingPrimary));
  el.style.setProperty("--brand-landing-secondary", settings.landingSecondary);
  el.style.setProperty("--brand-login-background", settings.loginBackground);
  el.style.setProperty("--brand-login-primary", settings.loginPrimary);
  el.style.setProperty("--brand-login-primary-hover", primaryHoverColor(settings.loginPrimary));
  el.style.setProperty("--brand-login-secondary", settings.loginSecondary);
  el.style.setProperty("--brand-dashboard-background", settings.dashboardBackground);
  el.style.setProperty("--brand-dashboard-primary", settings.dashboardPrimary);
  el.style.setProperty("--brand-dashboard-primary-hover", primaryHoverColor(settings.dashboardPrimary));
  el.style.setProperty("--brand-dashboard-secondary", settings.dashboardSecondary);
  el.style.setProperty("--brand-sidebar-background", settings.sidebarBackground);
}

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

function ColorField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-600">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          disabled={disabled}
          className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <input
          id={id}
          type="text"
          maxLength={7}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={INPUT_CLASS_NAME}
          placeholder="#BC934B"
        />
      </div>
      <p className="text-[11px] text-slate-400">Format HEX 6 digit (contoh: #BC934B).</p>
    </div>
  );
}

export default function WebCustomizationPage() {
  const { role } = useProfile();
  const isDeveloper = role === "Developer";

  const [settings, setSettings] = useState<BrandingSettings>({
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
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const loadSettings = async (): Promise<BrandingSettings> => {
    const response = await apiFetch("/api/branding", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const payload = await parseJsonResponse<BrandingPayload>(response);
    return payload.data.settings;
  };

  useEffect(() => {
    loadSettings()
      .then((result) => setSettings(result))
      .catch((error) =>
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Gagal memuat konfigurasi branding.",
        })
      )
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateBrandingAsset(file);
    if (validationError) {
      setMessage({ type: "error", text: `Logo: ${validationError}` });
      return;
    }
    setMessage(null);
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateBrandingAsset(file);
    if (validationError) {
      setMessage({ type: "error", text: `Favicon: ${validationError}` });
      return;
    }
    setMessage(null);
    if (faviconPreview) URL.revokeObjectURL(faviconPreview);
    setFaviconFile(file);
    setFaviconPreview(URL.createObjectURL(file));
  };

  const updateField = <K extends keyof BrandingSettings>(key: K, value: BrandingSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const validateColors = (): string | null => {
    const colorLabels: Array<[keyof BrandingSettings, string]> = [
      ["primaryColor", "Primary color"],
      ["secondaryColor", "Secondary color"],
      ["landingBackground", "Background landing page"],
      ["landingPrimary", "Primary landing page"],
      ["landingSecondary", "Secondary landing page"],
      ["loginBackground", "Background login page"],
      ["loginPrimary", "Primary login page"],
      ["loginSecondary", "Secondary login page"],
      ["dashboardBackground", "Background dashboard"],
      ["dashboardPrimary", "Primary dashboard"],
      ["dashboardSecondary", "Secondary dashboard"],
      ["sidebarBackground", "Background sidebar"],
    ];
    for (const [key, label] of colorLabels) {
      if (!HEX_COLOR_REGEX.test(settings[key])) {
        return `${label} harus berupa kode HEX 6 digit (contoh: #BC934B).`;
      }
    }
    return null;
  };

  const handleSave = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isDeveloper || isSaving) return;

    const colorError = validateColors();
    if (colorError) {
      setMessage({ type: "error", text: colorError });
      return;
    }
    if (!settings.companyName.trim()) {
      setMessage({ type: "error", text: "Nama perusahaan wajib diisi." });
      return;
    }
    if (!settings.appName.trim()) {
      setMessage({ type: "error", text: "Nama aplikasi wajib diisi." });
      return;
    }

    setIsSaving(true);
    setMessage(null);
    try {
      let logoUrl = settings.logoUrl;
      let faviconUrl = settings.faviconUrl;

      if (logoFile) {
        const oldLogoPath = extractBrandingStoragePath(settings.logoUrl);
        logoUrl = await uploadBrandingAsset(logoFile, oldLogoPath);
      }
      if (faviconFile) {
        const oldFaviconPath = extractBrandingStoragePath(settings.faviconUrl);
        faviconUrl = await uploadBrandingAsset(faviconFile, oldFaviconPath);
      }

      const response = await apiFetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: settings.companyName.trim(),
          appName: settings.appName.trim(),
          primaryColor: settings.primaryColor,
          secondaryColor: settings.secondaryColor,
          landingBackground: settings.landingBackground,
          landingPrimary: settings.landingPrimary,
          landingSecondary: settings.landingSecondary,
          loginBackground: settings.loginBackground,
          loginPrimary: settings.loginPrimary,
          loginSecondary: settings.loginSecondary,
          dashboardBackground: settings.dashboardBackground,
          dashboardPrimary: settings.dashboardPrimary,
          dashboardSecondary: settings.dashboardSecondary,
          sidebarBackground: settings.sidebarBackground,
          logoUrl,
          faviconUrl,
        }),
      });
      const payload = await parseJsonResponse<BrandingPayload>(response);
      setSettings(payload.data.settings);
      applyBrandTheme(payload.data.settings);
      setLogoFile(null);
      setFaviconFile(null);
      setMessage({ type: "success", text: "Branding berhasil disimpan. Perubahan langsung berlaku di seluruh aplikasi." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menyimpan branding.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!isDeveloper || isSaving) return;
    setIsResetDialogOpen(false);
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await apiFetch("/api/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
      const payload = await parseJsonResponse<BrandingPayload>(response);
      setSettings(payload.data.settings);
      applyBrandTheme(payload.data.settings);
      setLogoFile(null);
      setFaviconFile(null);
      setMessage({ type: "success", text: "Branding berhasil direset ke default." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal mereset branding.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = INPUT_CLASS_NAME;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg md:text-xl font-bold text-slate-900">
          Web Customization
        </h1>
        <p className="text-xs md:text-sm text-slate-500">
          Pengaturan tampilan global aplikasi (white label). Perubahan langsung
          diterapkan ke seluruh halaman.
        </p>
      </div>

      {!isDeveloper && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Mode hanya baca
            </p>
            <p className="text-xs text-amber-700">
              Hanya role <b>Developer</b> yang dapat mengubah pengaturan
              branding. Anda dapat melihat konfigurasi saat ini.
            </p>
          </div>
        </div>
      )}

      {message && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* ── Form ─────────────────────────────────────────── */}
        <form
          onSubmit={handleSave}
          className="space-y-6"
        >
          {/* Logo & Favicon */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Upload size={16} className="text-slate-500" />
              Logo &amp; Favicon
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Logo Perusahaan
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <div className="flex h-12 w-20 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview ?? settings.logoUrl}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!isDeveloper}
                    onClick={() => logoInputRef.current?.click()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {logoFile ? "Ganti File" : "Upload Logo"}
                  </button>
                  {logoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setLogoFile(null);
                        if (logoPreview) URL.revokeObjectURL(logoPreview);
                        setLogoPreview(null);
                        if (logoInputRef.current) logoInputRef.current.value = "";
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Batal
                    </button>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, WEBP, atau SVG. Maks 2 MB.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Favicon
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={faviconPreview ?? settings.faviconUrl}
                      alt="Favicon preview"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!isDeveloper}
                    onClick={() => faviconInputRef.current?.click()}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {faviconFile ? "Ganti File" : "Upload Favicon"}
                  </button>
                  {faviconFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setFaviconFile(null);
                        if (faviconPreview) URL.revokeObjectURL(faviconPreview);
                        setFaviconPreview(null);
                        if (faviconInputRef.current) faviconInputRef.current.value = "";
                      }}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Batal
                    </button>
                  )}
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                    className="hidden"
                    onChange={handleFaviconFileChange}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  PNG, JPG, WEBP, SVG, atau ICO. Maks 2 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Identitas */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Palette size={16} className="text-slate-500" />
              Identitas Perusahaan
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="companyName" className="block text-xs font-semibold text-slate-600">
                  Nama Perusahaan
                </label>
                <input
                  id="companyName"
                  type="text"
                  maxLength={100}
                  value={settings.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  disabled={!isDeveloper}
                  className={inputClassName}
                  placeholder="PT Doa Suryo Agong"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="appName" className="block text-xs font-semibold text-slate-600">
                  Nama Aplikasi
                </label>
                <input
                  id="appName"
                  type="text"
                  maxLength={100}
                  value={settings.appName}
                  onChange={(e) => updateField("appName", e.target.value)}
                  disabled={!isDeveloper}
                  className={inputClassName}
                  placeholder="Suryo Agong"
                />
              </div>
            </div>
          </section>

          {/* Warna Per Halaman */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
              <Palette size={16} className="text-slate-500" />
              Warna Per Halaman
            </h2>
            <p className="mb-5 text-xs text-slate-500">
              Warna dapat diatur berbeda untuk setiap area: Landing Page, Login
              Page, dan Dashboard (setelah login).
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <Globe size={14} />
                  Landing Page
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ColorField
                    id="landingBackground"
                    label="Background"
                    value={settings.landingBackground}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("landingBackground", v)}
                  />
                  <ColorField
                    id="landingPrimary"
                    label="Primary"
                    value={settings.landingPrimary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("landingPrimary", v)}
                  />
                  <ColorField
                    id="landingSecondary"
                    label="Secondary"
                    value={settings.landingSecondary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("landingSecondary", v)}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <LogIn size={14} />
                  Login Page
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <ColorField
                    id="loginBackground"
                    label="Background"
                    value={settings.loginBackground}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("loginBackground", v)}
                  />
                  <ColorField
                    id="loginPrimary"
                    label="Primary"
                    value={settings.loginPrimary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("loginPrimary", v)}
                  />
                  <ColorField
                    id="loginSecondary"
                    label="Secondary"
                    value={settings.loginSecondary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("loginSecondary", v)}
                  />
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  <LayoutDashboard size={14} />
                  Dashboard (Setelah Login)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <ColorField
                    id="dashboardBackground"
                    label="Background"
                    value={settings.dashboardBackground}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("dashboardBackground", v)}
                  />
                  <ColorField
                    id="dashboardPrimary"
                    label="Primary"
                    value={settings.dashboardPrimary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("dashboardPrimary", v)}
                  />
                  <ColorField
                    id="dashboardSecondary"
                    label="Secondary"
                    value={settings.dashboardSecondary}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("dashboardSecondary", v)}
                  />
                  <ColorField
                    id="sidebarBackground"
                    label="Sidebar Background"
                    value={settings.sidebarBackground}
                    disabled={!isDeveloper}
                    onChange={(v) => updateField("sidebarBackground", v)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Aksi */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!isDeveloper || isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan Perubahan
            </button>
            <button
              type="button"
              disabled={!isDeveloper || isSaving}
              onClick={() => setIsResetDialogOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={16} />
              Reset ke Default
            </button>
          </div>
        </form>

        {/* ── Preview Tema Per Halaman ─────────────────────── */}
        <section>
          <div className="mb-3 flex flex-col gap-1">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <Eye size={16} className="text-slate-500" />
              Preview Tema Per Halaman
            </h2>
            <p className="text-xs text-slate-500">
              Preview warna yang berlaku untuk Landing Page, Login Page, dan
              Dashboard (setelah login).
            </p>
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <Loader2 size={20} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <ThemePreview
              primaryColor={settings.primaryColor}
              secondaryColor={settings.secondaryColor}
              appName={settings.appName}
              companyName={settings.companyName}
              logoUrl={logoPreview ?? settings.logoUrl}
              landingBackground={settings.landingBackground}
              landingPrimary={settings.landingPrimary}
              landingSecondary={settings.landingSecondary}
              loginBackground={settings.loginBackground}
              loginPrimary={settings.loginPrimary}
              loginSecondary={settings.loginSecondary}
              dashboardBackground={settings.dashboardBackground}
              dashboardPrimary={settings.dashboardPrimary}
              dashboardSecondary={settings.dashboardSecondary}
              sidebarBackground={settings.sidebarBackground}
            />
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleReset}
        title="Reset Branding?"
        description="Semua pengaturan branding akan dikembalikan ke default (logo, nama, dan warna bawaan). Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Reset"
        variant="warning"
      />
    </div>
  );
}
