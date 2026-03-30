import type {
  CreateProfileInput,
  UpdateProfileByIdInput,
} from "@/types/profile";
import type { CoreUserRole } from "@/types/supabase";

const USER_ROLES: CoreUserRole[] = [
  "Developer",
  "CEO",
  "Finance",
  "HR",
  "Produksi",
  "Logistik",
  "Creative",
  "Office",
];

function isCoreUserRole(value: string): value is CoreUserRole {
  return USER_ROLES.includes(value as CoreUserRole);
}

function validateOptionalString(
  key: string,
  value: unknown,
  maxLen: number,
  allowNull = true
): { ok: true; value: string | null | undefined } | { ok: false; message: string } {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null) {
    if (!allowNull) return { ok: false, message: `${key} tidak boleh null.` };
    return { ok: true, value: null };
  }
  if (typeof value !== "string") {
    return { ok: false, message: `${key} harus berupa string.` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLen) {
    return { ok: false, message: `${key} maksimal ${maxLen} karakter.` };
  }

  return { ok: true, value: trimmed === "" ? null : trimmed };
}

export function parseCreateProfileInput(payload: unknown):
  | { ok: true; data: CreateProfileInput }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.email !== "string" || body.email.trim() === "") {
    return { ok: false, message: "email wajib diisi." };
  }

  if (typeof body.password !== "string" || body.password.length < 6) {
    return { ok: false, message: "password minimal 6 karakter." };
  }

  if (typeof body.nama !== "string" || body.nama.trim() === "") {
    return { ok: false, message: "nama wajib diisi." };
  }

  if (typeof body.role !== "string" || body.role.trim() === "") {
    return { ok: false, message: "role wajib diisi." };
  }

  const role = body.role.trim();
  if (!isCoreUserRole(role)) {
    return { ok: false, message: "role tidak valid." };
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;

  return {
    ok: true,
    data: {
      email: body.email.trim(),
      password: body.password,
      nama: body.nama.trim(),
      role,
      phone: phone.value ?? null,
    },
  };
}

export function parseUpdateProfileByIdInput(payload: unknown):
  | { ok: true; data: UpdateProfileByIdInput }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;
  const parsed: UpdateProfileByIdInput = {};

  const nama = validateOptionalString("nama", body.nama, 120, false);
  if (!nama.ok) return nama;
  if (nama.value !== undefined && nama.value !== null) parsed.nama = nama.value;

  const role = validateOptionalString("role", body.role, 80, false);
  if (!role.ok) return role;
  if (role.value !== undefined && role.value !== null) {
    if (!isCoreUserRole(role.value)) {
      return { ok: false, message: "role tidak valid." };
    }
    parsed.role = role.value;
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;
  if (phone.value !== undefined) parsed.phone = phone.value;

  if (Object.keys(parsed).length === 0) {
    return { ok: false, message: "Tidak ada field yang dapat diupdate." };
  }

  return { ok: true, data: parsed };
}
