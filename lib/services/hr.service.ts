import type { MKaryawan, TAttendance, TEmployeeWarning } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProfile } from "./profile.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateEmployeeWithAccountInput } from "@/lib/validation/hr-admin";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => any };
const schema = (client: DbClient, name: string) => (client as unknown as SchemaClient).schema(name) as any;
const db = (client: DbClient) => schema(client, "hr");

function normalizeAttendanceRow(row: Record<string, unknown>): TAttendance {
  const normalized = { ...row } as Record<string, unknown>;
  if (typeof normalized.id !== "string" || normalized.id.length === 0) {
    const legacyId = normalized.attendance_id;
    if (typeof legacyId === "string" && legacyId.length > 0) {
      normalized.id = legacyId;
    }
  }
  return normalized as unknown as TAttendance;
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
  return { data: (data ?? []) as MKaryawan[], error, meta: { page, limit, total: count ?? 0 } };
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
    .select("*", { count: "exact" })
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .order("employee_id", { ascending: true })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  const normalized = (data ?? []).map((item: Record<string, unknown>) => normalizeAttendanceRow(item));
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
