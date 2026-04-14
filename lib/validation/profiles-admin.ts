import type {
  CreateProfileInput,
  UpdateProfileByIdInput,
} from "@/types/profile";
import type { CoreUserRole } from "@/types/supabase";

type SystemRoleKey =
  | "management"
  | "finance"
  | "hr"
  | "produksi"
  | "logistik"
  | "creative"
  | "office"
  | "developer";

export const USER_ROLES: SystemRoleKey[] = [
  'management',
  'finance',
  'hr',
  'produksi',
  'logistik',
  'creative',
  'office',
  'developer'
];

export const SYSTEM_ROLE_TO_CORE_ROLE: Record<SystemRoleKey, CoreUserRole> = {
  management: "Management & Strategy",
  finance: "Finance & Administration",
  hr: "HR & Operation Manager",
  produksi: "Produksi & Quality Control",
  logistik: "Logistics & Packing",
  creative: "Creative & Sales",
  office: "Office Support",
  developer: "Developer",
};

export const VALID_CORE_ROLES: CoreUserRole[] = [
  "Developer",
  "Management & Strategy",
  "Finance & Administration",
  "HR & Operation Manager",
  "Produksi & Quality Control",
  "Logistics & Packing",
  "Creative & Sales",
  "Office Support",
  "CEO",
  "Finance",
  "HR",
  "Produksi",
  "Logistik",
  "Creative",
  "Office",
];

export function isValidCoreRole(value: string): value is CoreUserRole {
  return VALID_CORE_ROLES.includes(value as CoreUserRole);
}

export function isSystemRoleKey(value: string): value is SystemRoleKey {
  return USER_ROLES.includes(value as SystemRoleKey);
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
  let finalRole: CoreUserRole;
  
  if (isValidCoreRole(role)) {
    // Apabila frontend melempar real DB role ("Produksi & Quality Control") maka terima lgsg
    finalRole = role; 
  } else {
    // Kalau dia menggunakan alias ("produksi")
    const lowerRole = role.toLowerCase();
    if (!isSystemRoleKey(lowerRole)) {
      return { ok: false, message: "role tidak valid." };
    }
    finalRole = SYSTEM_ROLE_TO_CORE_ROLE[lowerRole];
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;

  return {
    ok: true,
    data: {
      email: body.email.trim(),
      password: body.password,
      nama: body.nama.trim(),
      role: finalRole,
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
    const rawRole = role.value;
    if (isValidCoreRole(rawRole)) {
      parsed.role = rawRole;
    } else {
      const systemRole = rawRole.toLowerCase();
      if (!isSystemRoleKey(systemRole)) {
        return { ok: false, message: "role tidak valid." };
      }
      parsed.role = SYSTEM_ROLE_TO_CORE_ROLE[systemRole];
    }
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;
  if (phone.value !== undefined) parsed.phone = phone.value;

  if (Object.keys(parsed).length === 0) {
    return { ok: false, message: "Tidak ada field yang dapat diupdate." };
  }

  return { ok: true, data: parsed };
}
