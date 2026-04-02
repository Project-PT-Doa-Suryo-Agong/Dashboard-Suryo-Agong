import type {
  CreateProfileInput,
  UpdateProfileByIdInput,
} from "@/types/profile";
import type { CoreUserRole } from "@/types/supabase";

<<<<<<< HEAD
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

const ROLE_ALIASES: Record<string, CoreUserRole> = {
  developer: "Developer",
  ceo: "CEO",
  management: "CEO",
  "management & strategy": "CEO",
  finance: "Finance",
  "finance & administration": "Finance",
  hr: "HR",
  "human resource": "HR",
  "hr & operation manager": "HR",
  produksi: "Produksi",
  production: "Produksi",
  "produksi & quality control": "Produksi",
  logistik: "Logistik",
  logistics: "Logistik",
  "logistics & packing": "Logistik",
  creative: "Creative",
  sales: "Creative",
  "creative & sales": "Creative",
  office: "Office",
  "office support": "Office",
};

function isCoreUserRole(value: string): value is CoreUserRole {
  return USER_ROLES.includes(value as CoreUserRole);
=======
type SystemRoleKey =
  | "management"
  | "finance"
  | "hr"
  | "produksi"
  | "logistik"
  | "creative"
  | "office"
  | "developer";

const USER_ROLES: SystemRoleKey[] = [
  'management',
  'finance',
  'hr',
  'produksi',
  'logistik',
  'creative',
  'office',
  'developer'
];

const SYSTEM_ROLE_TO_CORE_ROLE: Record<SystemRoleKey, CoreUserRole> = {
  management: "CEO",
  finance: "Finance",
  hr: "HR",
  produksi: "Produksi",
  logistik: "Logistik",
  creative: "Creative",
  office: "Office",
  developer: "Developer",
};

function isSystemRoleKey(value: string): value is SystemRoleKey {
  return USER_ROLES.includes(value as SystemRoleKey);
>>>>>>> 96c62d162db93d3b45c5759c1fbe315b6f095bf8
}

function normalizeCoreUserRole(value: string): CoreUserRole | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isCoreUserRole(trimmed)) return trimmed;

  const byAlias = ROLE_ALIASES[trimmed.toLowerCase()];
  return byAlias ?? null;
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

<<<<<<< HEAD
  const role = normalizeCoreUserRole(body.role);
  if (!role) {
=======
  const role = body.role.trim().toLowerCase();
  if (!isSystemRoleKey(role)) {
>>>>>>> 96c62d162db93d3b45c5759c1fbe315b6f095bf8
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
      role: SYSTEM_ROLE_TO_CORE_ROLE[role],
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
<<<<<<< HEAD
    const normalizedRole = normalizeCoreUserRole(role.value);
    if (!normalizedRole) {
      return { ok: false, message: "role tidak valid." };
    }
    parsed.role = normalizedRole;
=======
    const systemRole = role.value.toLowerCase();
    if (!isSystemRoleKey(systemRole)) {
      return { ok: false, message: "role tidak valid." };
    }
    parsed.role = SYSTEM_ROLE_TO_CORE_ROLE[systemRole];
>>>>>>> 96c62d162db93d3b45c5759c1fbe315b6f095bf8
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;
  if (phone.value !== undefined) parsed.phone = phone.value;

  if (Object.keys(parsed).length === 0) {
    return { ok: false, message: "Tidak ada field yang dapat diupdate." };
  }

  return { ok: true, data: parsed };
}
