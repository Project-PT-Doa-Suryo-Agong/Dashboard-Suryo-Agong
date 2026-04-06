import type { MKaryawan, TAttendance } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createProfile } from "./profile.service";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { CreateEmployeeWithAccountInput } from "@/lib/validation/hr-admin";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("hr");

export async function listKaryawan(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_karyawan")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MKaryawan[], error, meta: { page, limit, total: count ?? 0 } };
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
    await db(client).schema("core").from("profiles").delete().eq("id", profile.id);
    await supabaseAdmin.auth.admin.deleteUser(profile.id);
    return { data: null, error: employeeError };
  }

  return { data: employee as MKaryawan, error: null };
}
