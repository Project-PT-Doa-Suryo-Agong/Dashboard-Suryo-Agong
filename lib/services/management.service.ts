import type { TBudgetRequest, TKPIWeekly } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("management");

// â”€â”€â”€ t_budget_request â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listBudgetRequest(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_budget_request")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TBudgetRequest[], error, meta: { page, limit, total: count ?? 0 } };
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

// â”€â”€â”€ t_kpi_weekly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

