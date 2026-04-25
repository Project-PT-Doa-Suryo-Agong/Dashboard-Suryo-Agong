import type { MKaryawan, TAttendance, TEmployeeWarning, MSop } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProfile } from "./profile.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateEmployeeWithAccountInput } from "@/lib/validation/hr-admin";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => any };
const schema = (client: DbClient, name: string) => (client as unknown as SchemaClient).schema(name) as any;
const db = (client: DbClient) => schema(client, "hr");
const EMPLOYEE_PHOTO_BUCKET = "employee_documents";
const EMPLOYEE_PHOTO_TTL_SECONDS = 60 * 60;

const EMPLOYEE_PHOTO_FIELDS = ["foto_perorangan_url", "foto_ktp_url", "foto_kk_url"] as const;
type EmployeePhotoField = (typeof EMPLOYEE_PHOTO_FIELDS)[number];

function extractStoragePathFromPhotoValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // New format: raw object path in bucket, e.g. karyawan/<id>/foto_ktp-*.jpg
  if (!/^https?:\/\//i.test(trimmed)) return trimmed;

  try {
    const parsed = new URL(trimmed);
    const publicMarker = `/storage/v1/object/public/${EMPLOYEE_PHOTO_BUCKET}/`;
    const signedMarker = `/storage/v1/object/sign/${EMPLOYEE_PHOTO_BUCKET}/`;
    if (parsed.pathname.includes(publicMarker)) {
      return decodeURIComponent(parsed.pathname.split(publicMarker)[1] ?? "");
    }
    if (parsed.pathname.includes(signedMarker)) {
      return decodeURIComponent(parsed.pathname.split(signedMarker)[1] ?? "");
    }
  } catch {
    return null;
  }

  return null;
}

async function hydrateEmployeePhotoUrls(rows: MKaryawan[]): Promise<MKaryawan[]> {
  if (rows.length === 0) return rows;

  const uniquePaths = new Set<string>();
  const pathByRow = new Map<string, Partial<Record<EmployeePhotoField, string>>>();

  for (const row of rows) {
    const perRow: Partial<Record<EmployeePhotoField, string>> = {};
    for (const field of EMPLOYEE_PHOTO_FIELDS) {
      const path = extractStoragePathFromPhotoValue(row[field]);
      if (path) {
        perRow[field] = path;
        uniquePaths.add(path);
      }
    }
    pathByRow.set(row.id, perRow);
  }

  if (uniquePaths.size === 0) return rows;

  const paths = Array.from(uniquePaths);
  const { data } = await supabaseAdmin.storage
    .from(EMPLOYEE_PHOTO_BUCKET)
    .createSignedUrls(paths, EMPLOYEE_PHOTO_TTL_SECONDS);

  const signedByPath = new Map<string, string>();
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      signedByPath.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => {
    const rowPaths = pathByRow.get(row.id);
    if (!rowPaths) return row;

    const next: MKaryawan = { ...row };
    for (const field of EMPLOYEE_PHOTO_FIELDS) {
      const path = rowPaths[field];
      if (!path) continue;
      const signed = signedByPath.get(path);
      if (signed) next[field] = signed;
    }

    return next;
  });
}

function normalizeAttendanceRow(row: Record<string, unknown>): TAttendance {
  // New DB schema uses composite PK (employee_id + tanggal) and no single `id` column.
  // Return the row as-is and let callers access `employee_id` + `tanggal` as identity.
  return row as unknown as TAttendance;
}

function missingIdColumnError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message ?? "") : "";
  return message.toLowerCase().includes("column") && message.toLowerCase().includes("id");
}

export async function listKaryawan(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_karyawan")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  const normalized = (data ?? []) as MKaryawan[];
  const hydrated = await hydrateEmployeePhotoUrls(normalized);
  return { data: hydrated, error, meta: { page, limit, total: count ?? 0 } };
}

export async function updateKaryawan(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_karyawan")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MKaryawan | null, error };
}

export async function deleteKaryawan(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_karyawan").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listAttendance(client: DbClient, page = 1, limit = 50, employeeId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_attendance")
    // include karyawan join for convenience (nama, divisi)
    .select("*, m_karyawan(nama, divisi)", { count: "exact" })
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .order("employee_id", { ascending: true })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  const normalized = (data ?? []) as TAttendance[];
  return { data: normalized, error, meta: { page, limit, total: count ?? 0 } };
}

export async function createAttendance(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_attendance").insert(input).select("*").single();
  return {
    data: data ? normalizeAttendanceRow(data as unknown as Record<string, unknown>) : null,
    error,
  };
}

export async function updateAttendance(client: DbClient, id: string, input: Record<string, unknown>) {
  const byId = await db(client)
    .from("t_attendance")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (!missingIdColumnError(byId.error)) {
    return {
      data: byId.data ? normalizeAttendanceRow(byId.data as unknown as Record<string, unknown>) : null,
      error: byId.error,
    };
  }

  const byLegacyId = await db(client)
    .from("t_attendance")
    .update(input)
    .eq("attendance_id", id)
    .select("*")
    .maybeSingle();

  return {
    data: byLegacyId.data ? normalizeAttendanceRow(byLegacyId.data as unknown as Record<string, unknown>) : null,
    error: byLegacyId.error,
  };
}

export async function updateAttendanceByEmployeeDate(
  client: DbClient,
  employeeId: string,
  tanggal: string,
  input: Record<string, unknown>,
) {
  const { data, error } = await db(client)
    .from("t_attendance")
    .update(input)
    .eq("employee_id", employeeId)
    .eq("tanggal", tanggal)
    .select("*")
    .maybeSingle();

  return {
    data: data ? normalizeAttendanceRow(data as unknown as Record<string, unknown>) : null,
    error,
  };
}

export async function deleteAttendance(client: DbClient, id: string) {
  const byId = await db(client).from("t_attendance").delete({ count: "exact" }).eq("id", id);
  if (!missingIdColumnError(byId.error)) {
    return { error: byId.error, deleted: (byId.count ?? 0) > 0 };
  }

  const byLegacyId = await db(client)
    .from("t_attendance")
    .delete({ count: "exact" })
    .eq("attendance_id", id);
  return { error: byLegacyId.error, deleted: (byLegacyId.count ?? 0) > 0 };
}

export async function deleteAttendanceByEmployeeDate(client: DbClient, employeeId: string, tanggal: string) {
  const { error, count } = await db(client)
    .from("t_attendance")
    .delete({ count: "exact" })
    .eq("employee_id", employeeId)
    .eq("tanggal", tanggal);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listWarnings(client: DbClient, page = 1, limit = 50, employeeId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_employee_warning")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TEmployeeWarning[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createWarning(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_employee_warning").insert(input).select("*").single();
  return { data: data as TEmployeeWarning | null, error };
}

export async function updateWarning(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_employee_warning")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TEmployeeWarning | null, error };
}

export async function deleteWarning(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_employee_warning").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// ─── SOP (hr.m_sop) ─────────────────────────────────────────────────────────

export async function listSOP(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_sop")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MSop[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createSOP(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_sop").insert(input).select("*").single();
  return { data: data as MSop | null, error };
}

export async function updateSOP(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_sop").update(input).eq("id", id).select("*").maybeSingle();
  return { data: data as MSop | null, error };
}

export async function deleteSOP(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_sop").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function createKaryawan(client: DbClient, input: CreateEmployeeWithAccountInput) {
  // 1. Create Profile (which also creates Supabase Auth Account)
  const { data: profile, error: profileError } = await createProfile(client, {
    email: input.email,
    password: input.password,
    nama: input.nama,
    role: input.role,
    phone: input.phone,
  });

  if (profileError || !profile) {
    return { data: null, error: profileError || new Error("Gagal membuat profil") };
  }

  // 2. Create Employee
  const employeePayload = {
    profile_id: profile.id, // linked to account
    nama: input.nama,
    posisi: input.posisi,
    divisi: input.divisi,
    status: input.status,
    gaji_pokok: input.gaji_pokok,
    nik: input.nik,
    nip: input.nip,
    alamat_domisili: input.alamat_domisili,
    nomor_whatsapp: input.nomor_whatsapp,
    email_pribadi: input.email_pribadi,
    foto_perorangan_url: input.foto_perorangan_url,
    foto_ktp_url: input.foto_ktp_url,
    foto_kk_url: input.foto_kk_url,
    pendidikan_terakhir: input.pendidikan_terakhir,
    jurusan: input.jurusan,
    pengalaman_kerja_sebelumnya: input.pengalaman_kerja_sebelumnya,
    keahlian_khusus: input.keahlian_khusus,
    motivasi_kerja: input.motivasi_kerja,
  };

  const { data: employee, error: employeeError } = await db(client)
    .from("m_karyawan")
    .insert(employeePayload)
    .select("*")
    .single();

  if (employeeError) {
    // Optionally rollback account creation
    await schema(client, "core").from("profiles").delete().eq("id", profile.id);
    await supabaseAdmin.auth.admin.deleteUser(profile.id);
    return { data: null, error: employeeError };
  }

  return { data: employee as MKaryawan, error: null };
}
