import { SYSTEM_ROLE_TO_CORE_ROLE, isSystemRoleKey, isValidCoreRole } from "./profiles-admin";
import type { CoreUserRole, HrEmployeeStatus } from "@/types/supabase";

const ALLOWED_CREATE_EMPLOYEE_FIELDS = new Set([
  "email",
  "password",
  "nama",
  "role",
  "posisi",
  "divisi",
  "gaji_pokok",
  "phone",
  "status",
]);

function validateOptionalString(
  key: string,
  value: unknown,
  maxLen: number
): { ok: true; value: string | null | undefined } | { ok: false; message: string } {
  if (value === undefined || value === null) return { ok: true, value: undefined };
  if (typeof value !== "string") return { ok: false, message: `${key} harus berupa string.` };
  const trimmed = value.trim();
  if (trimmed.length > maxLen) return { ok: false, message: `${key} maksimal ${maxLen} karakter.` };
  return { ok: true, value: trimmed === "" ? null : trimmed };
}

export type CreateEmployeeWithAccountInput = {
  email: string;
  password: string;
  nama: string;
  role: CoreUserRole;
  posisi?: string | null;
  divisi?: string | null;
  gaji_pokok?: number | null;
  phone?: string | null;
  status?: HrEmployeeStatus | null;
};

export function parseCreateEmployeeInput(payload: unknown):
  | { ok: true; data: CreateEmployeeWithAccountInput }
  | { ok: false; message: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;

  if ("profile_id" in body) {
    return {
      ok: false,
      message: "profile_id tidak digunakan lagi. Gunakan field email, password, dan role.",
    };
  }

  const unknownFields = Object.keys(body).filter((key) => !ALLOWED_CREATE_EMPLOYEE_FIELDS.has(key));
  if (unknownFields.length > 0) {
    return {
      ok: false,
      message: `Field tidak dikenali: ${unknownFields.join(", ")}.`,
    };
  }

  if (typeof body.email !== "string" || body.email.trim() === "") {
    return { ok: false, message: "email wajib diisi." };
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return { ok: false, message: "format email tidak valid." };
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

  const roleString = body.role.trim();
  let finalRole: CoreUserRole;
  
  // Coba cek apa role yang dikirim persis sama dengan struktur database (mis. "Produksi & Quality Control")
  if (isValidCoreRole(roleString)) {
    finalRole = roleString as CoreUserRole;
  } else {
    // Kalau dikirim dalam bentuk singkatan (mis. "produksi" atau "hr")
    const roleKey = roleString.toLowerCase();
    if (!isSystemRoleKey(roleKey)) {
      return { ok: false, message: "role tidak valid." };
    }
    finalRole = SYSTEM_ROLE_TO_CORE_ROLE[roleKey];
  }

  const phone = validateOptionalString("phone", body.phone, 50);
  if (!phone.ok) return phone;
  const posisi = validateOptionalString("posisi", body.posisi, 100);
  if (!posisi.ok) return posisi;
  const divisi = validateOptionalString("divisi", body.divisi, 100);
  if (!divisi.ok) return divisi;

  let gaji_pokok: number | null | undefined = undefined;
  if (body.gaji_pokok !== undefined && body.gaji_pokok !== null) {
    const parsedSalary = Number(body.gaji_pokok);
    if (Number.isNaN(parsedSalary)) {
      return { ok: false, message: "gaji_pokok harus berupa angka." };
    }
    if (parsedSalary < 0) {
      return { ok: false, message: "gaji_pokok tidak boleh kurang dari 0." };
    }
    gaji_pokok = parsedSalary;
  }

  let status: HrEmployeeStatus | null | undefined = undefined;
  if (body.status !== undefined && body.status !== null) {
    if (body.status !== "aktif" && body.status !== "nonaktif") {
      return { ok: false, message: "status harus 'aktif' atau 'nonaktif'." };
    }
    status = body.status as HrEmployeeStatus;
  }

  return {
    ok: true,
    data: {
      email: normalizedEmail,
      password: body.password,
      nama: body.nama.trim(),
      role: finalRole,
      phone: phone.value,
      posisi: posisi.value,
      divisi: divisi.value,
      gaji_pokok,
      status: status ?? "aktif",
    },
  };
}
