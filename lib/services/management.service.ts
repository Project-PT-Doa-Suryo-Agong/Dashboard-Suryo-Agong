/**
 * @deprecated — FASE 2 MIGRASI HYBRID BACKEND
 *
 * File ini sudah di-deprecated per April 2026.
 * Segera migrasikan endpoint yang menggunakan service ini menuju direct Supabase hooks.
 * 
 * @see lib/supabase/hooks/use-management.ts
 */
import type { TBudgetRequest, TKPIWeekly } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("management");

//  t_budget_request 

import { createClient } from "@supabase/supabase-js";

export async function listBudgetRequest(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  // Step 1: fetch budget requests without COA join
  const { data, error, count } = await db(client)
    .from("t_budget_request")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error || !data) return { data: [], error, meta: { page, limit, total: 0 } };

  // Step 2: fetch COA names separately for non-null coa_ids
  const coaIds = [...new Set(data.map(r => r.coa_id).filter(Boolean))];
  let coaMap: Record<string, { kode_akun: string; nama_akun: string }> = {};

  if (coaIds.length > 0) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: coaData } = await supabaseAdmin
      .schema('finance')
      .from('m_coa')
      .select('id, kode_akun, nama_akun')
      .in('id', coaIds);

    coaMap = Object.fromEntries((coaData ?? []).map(c => [c.id, c]));
  }

  // Step 3: merge COA data into budget requests
  const merged = data.map(r => ({
    ...r,
    m_coa: r.coa_id ? (coaMap[r.coa_id] ?? null) : null
  }));

  return { data: merged as TBudgetRequest[], error: null, meta: { page, limit, total: count ?? 0 } };
}

export async function getBudgetRequestById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("t_budget_request").select("*").eq("id", id).maybeSingle();
  return { data: data as TBudgetRequest | null, error };
}

export async function createBudgetRequest(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_budget_request").insert(input as never).select("*").single();
  return { data: data as TBudgetRequest | null, error };
}

export async function updateBudgetRequest(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_budget_request")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TBudgetRequest | null, error };
}

export async function deleteBudgetRequest(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_budget_request").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_kpi_weekly 

export async function listKPIWeekly(client: DbClient, page = 1, limit = 50, divisi?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_kpi_weekly")
    .select("*", { count: "exact" })
    .order("minggu", { ascending: false })
    .range(from, from + limit - 1);
  if (divisi) query = query.eq("divisi", divisi);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TKPIWeekly[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createKPIWeekly(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_kpi_weekly").insert(input as never).select("*").single();
  return { data: data as TKPIWeekly | null, error };
}

export async function updateKPIWeekly(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_kpi_weekly")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TKPIWeekly | null, error };
}

export async function deleteKPIWeekly(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_kpi_weekly").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

