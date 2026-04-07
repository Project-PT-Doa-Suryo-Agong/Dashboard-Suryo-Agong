export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export function requireString(
  body: Record<string, unknown>,
  key: string,
  options?: { maxLen?: number; optional?: boolean }
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
  if (options?.maxLen && trimmed.length > options.maxLen) {
    return {
      ok: false,
      message: `${key} maksimal ${options.maxLen} karakter.`,
    };
  }
  return { ok: true, data: trimmed || null };
}

export function requireNumber(
  body: Record<string, unknown>,
  key: string,
  options?: { min?: number; max?: number; optional?: boolean }
): ValidationResult<number | null> {
  const val = body[key];
  if (val === undefined || val === null || val === "") {
    if (options?.optional) return { ok: true, data: null };
    return { ok: false, message: `${key} wajib diisi.` };
  }
  const num = Number(val);
  if (Number.isNaN(num)) {
    return { ok: false, message: `${key} harus berupa angka.` };
  }
  if (options?.min !== undefined && num < options.min) {
    return {
      ok: false,
      message: `${key} minimal ${options.min}.`,
    };
  }
  if (options?.max !== undefined && num > options.max) {
    return {
      ok: false,
      message: `${key} maksimal ${options.max}.`,
    };
  }
  return { ok: true, data: num };
}

export function requireUUID(
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
    return { ok: false, message: `${key} harus berupa UUID.` };
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(val)) {
    return { ok: false, message: `${key} format UUID tidak valid.` };
  }
  return { ok: true, data: val };
}

export function requireDate(
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
    return { ok: false, message: `${key} harus berupa tanggal.` };
  }
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) {
    return {
      ok: false,
      message: `${key} format tanggal tidak valid.`,
    };
  }
  return { ok: true, data: val };
}

export function parseBody(
  validators: ValidationResult<unknown>[]
): { ok: false; message: string } | null {
  for (const result of validators) {
    if (!result.ok) return result;
  }
  return null;
}
