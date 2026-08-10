import type { ValidationResult } from "@/lib/validation/body-validator";

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Validate a 6-digit HEX color (e.g. #BC934B). Empty is allowed when optional.
 */
export function requireHexColor(
  body: Record<string, unknown>,
  key: string,
  options?: { optional?: boolean }
): ValidationResult<string | null> {
  const val = body[key];
  if (val === undefined || val === null || val === "") {
    if (options?.optional) return { ok: true, data: null };
    return { ok: false, message: `${key} wajib diisi.` };
  }
  if (typeof val !== "string") {
    return { ok: false, message: `${key} harus berupa string.` };
  }
  const trimmed = val.trim();
  if (!HEX_COLOR_REGEX.test(trimmed)) {
    return {
      ok: false,
      message: `${key} harus berupa kode warna HEX 6 digit (contoh: #BC934B).`,
    };
  }
  return { ok: true, data: trimmed.toUpperCase() };
}

/**
 * Validate an asset URL/path for logo/favicon.
 * Allows absolute storage URLs (http/https) or app-local paths (starts with "/").
 * Optional — null when empty.
 */
export function requireAssetUrl(
  body: Record<string, unknown>,
  key: string,
  options?: { optional?: boolean }
): ValidationResult<string | null> {
  const val = body[key];
  if (val === undefined || val === null || val === "") {
    if (options?.optional) return { ok: true, data: null };
    return { ok: false, message: `${key} wajib diisi.` };
  }
  if (typeof val !== "string") {
    return { ok: false, message: `${key} harus berupa string.` };
  }
  const trimmed = val.trim();
  if (trimmed.length > 500) {
    return { ok: false, message: `${key} maksimal 500 karakter.` };
  }
  const isHttpUrl = /^https?:\/\//i.test(trimmed);
  const isLocalPath = trimmed.startsWith("/") && !trimmed.startsWith("//");
  if (!isHttpUrl && !isLocalPath) {
    return {
      ok: false,
      message: `${key} harus berupa URL valid (http/https) atau path lokal (diawali "/").`,
    };
  }
  return { ok: true, data: trimmed };
}
