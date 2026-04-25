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
  "nik",
  "nip",
  "alamat_domisili",
  "nomor_whatsapp",
  "email_pribadi",
  "foto_perorangan_url",
  "foto_ktp_url",
  "foto_kk_url",
  "pendidikan_terakhir",
  "jurusan",
  "pengalaman_kerja_sebelumnya",
  "keahlian_khusus",
  "motivasi_kerja",
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
  nik: string;
  nip: string;
  alamat_domisili: string;
  nomor_whatsapp: string;
  email_pribadi?: string | null;
  foto_perorangan_url?: string | null;
  foto_ktp_url?: string | null;
  foto_kk_url?: string | null;
  pendidikan_terakhir: string;
  jurusan: string;
  pengalaman_kerja_sebelumnya?: string | null;
  keahlian_khusus?: string | null;
  motivasi_kerja?: string | null;
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
  if (typeof body.nik !== "string" || body.nik.trim() === "") {
    return { ok: false, message: "nik wajib diisi." };
  }
  if (typeof body.nip !== "string" || body.nip.trim() === "") {
    return { ok: false, message: "nip wajib diisi." };
  }
  if (typeof body.alamat_domisili !== "string" || body.alamat_domisili.trim() === "") {
    return { ok: false, message: "alamat_domisili wajib diisi." };
  }
  if (typeof body.nomor_whatsapp !== "string" || body.nomor_whatsapp.trim() === "") {
    return { ok: false, message: "nomor_whatsapp wajib diisi." };
  }
  if (typeof body.pendidikan_terakhir !== "string" || body.pendidikan_terakhir.trim() === "") {
    return { ok: false, message: "pendidikan_terakhir wajib diisi." };
  }
  if (typeof body.jurusan !== "string" || body.jurusan.trim() === "") {
    return { ok: false, message: "jurusan wajib diisi." };
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

  const email_pribadi = validateOptionalString("email_pribadi", body.email_pribadi, 255);
  if (!email_pribadi.ok) return email_pribadi;
  const foto_perorangan_url = validateOptionalString("foto_perorangan_url", body.foto_perorangan_url, 1000);
  if (!foto_perorangan_url.ok) return foto_perorangan_url;
  const foto_ktp_url = validateOptionalString("foto_ktp_url", body.foto_ktp_url, 1000);
  if (!foto_ktp_url.ok) return foto_ktp_url;
  const foto_kk_url = validateOptionalString("foto_kk_url", body.foto_kk_url, 1000);
  if (!foto_kk_url.ok) return foto_kk_url;
  const pengalaman_kerja_sebelumnya = validateOptionalString("pengalaman_kerja_sebelumnya", body.pengalaman_kerja_sebelumnya, 2000);
  if (!pengalaman_kerja_sebelumnya.ok) return pengalaman_kerja_sebelumnya;
  const keahlian_khusus = validateOptionalString("keahlian_khusus", body.keahlian_khusus, 2000);
  if (!keahlian_khusus.ok) return keahlian_khusus;
  const motivasi_kerja = validateOptionalString("motivasi_kerja", body.motivasi_kerja, 2000);
  if (!motivasi_kerja.ok) return motivasi_kerja;

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
      nik: body.nik.trim(),
      nip: body.nip.trim(),
      alamat_domisili: body.alamat_domisili.trim(),
      nomor_whatsapp: body.nomor_whatsapp.trim(),
      email_pribadi: email_pribadi.value,
      foto_perorangan_url: foto_perorangan_url.value,
      foto_ktp_url: foto_ktp_url.value,
      foto_kk_url: foto_kk_url.value,
      pendidikan_terakhir: body.pendidikan_terakhir.trim(),
      jurusan: body.jurusan.trim(),
      pengalaman_kerja_sebelumnya: pengalaman_kerja_sebelumnya.value,
      keahlian_khusus: keahlian_khusus.value,
      motivasi_kerja: motivasi_kerja.value,
    },
  };
}
