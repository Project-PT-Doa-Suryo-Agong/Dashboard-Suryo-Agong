/**
 * @deprecated — FASE 2 MIGRASI HYBRID BACKEND
 *
 * File ini sudah di-deprecated per April 2026.
 * Semua operasi CRUD karyawan, attendance, dan warnings sekarang dilakukan
 * langsung dari frontend via Supabase hooks (lib/supabase/hooks/).
 *
 * File ini TIDAK boleh dihapus sampai semua consumer yang lain
 * (misalnya: finance/payroll dan finance/reimburse yang masih pakai fetch('/api/hr/employees'))
 * sudah dimigrasikan juga.
 *
 * @see lib/supabase/hooks/use-karyawan.ts
 * @see lib/supabase/hooks/use-attendance.ts
 * @see lib/supabase/hooks/use-warnings.ts
 */
import type { MKaryawan, TAttendance, TEmployeeWarning } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("hr");

//  m_karyawan 

export async function listKaryawan(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_karyawan")
    .select("*", { count: "exact" })
    .order("nama", { ascending: true })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MKaryawan[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getKaryawanById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("m_karyawan").select("*").eq("id", id).maybeSingle();
  return { data: data as MKaryawan | null, error };
}

export async function createKaryawan(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_karyawan")
    .insert({ ...input, updated_at: new Date().toISOString() } as never)
    .select("*")
    .single();
  return { data: data as MKaryawan | null, error };
}

export async function updateKaryawan(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_karyawan")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MKaryawan | null, error };
}

export async function deleteKaryawan(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_karyawan").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_attendance 

export async function listAttendance(client: DbClient, page = 1, limit = 100, employeeId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_attendance")
    .select("*", { count: "exact" })
    .order("tanggal", { ascending: false })
    .range(from, from + limit - 1);
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TAttendance[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createAttendance(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_attendance").insert(input).select("*").single();
  return { data: data as TAttendance | null, error };
}

export async function updateAttendance(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_attendance")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TAttendance | null, error };
}

export async function deleteAttendance(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_attendance").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_employee_warning 

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

