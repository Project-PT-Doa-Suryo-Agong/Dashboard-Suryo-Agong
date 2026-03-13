import type { MAfiliator, TContentPlanner, TLivePerformance, TSalesOrder } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = ReturnType<typeof createSupabaseServerClient>;
const db = (client: DbClient) => (client as any).schema("sales");

// ─── m_affiliator ─────────────────────────────────────────────────────────────

export async function listAfiliator(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_affiliator")
    .select("*", { count: "exact" })
    .order("nama", { ascending: true })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MAfiliator[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getAfiliatorById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("m_affiliator").select("*").eq("id", id).maybeSingle();
  return { data: data as MAfiliator | null, error };
}

export async function createAfiliator(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_affiliator").insert(input).select("*").single();
  return { data: data as MAfiliator | null, error };
}

export async function updateAfiliator(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_affiliator")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MAfiliator | null, error };
}

export async function deleteAfiliator(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_affiliator").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// ─── t_content_planner ────────────────────────────────────────────────────────

export async function listContentPlanner(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_content_planner")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TContentPlanner[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createContentPlanner(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_content_planner").insert(input).select("*").single();
  return { data: data as TContentPlanner | null, error };
}

export async function updateContentPlanner(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_content_planner")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TContentPlanner | null, error };
}

// ─── t_live_performance ───────────────────────────────────────────────────────

export async function listLivePerformance(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_live_performance")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TLivePerformance[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createLivePerformance(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_live_performance").insert(input).select("*").single();
  return { data: data as TLivePerformance | null, error };
}

export async function updateLivePerformance(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_live_performance")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TLivePerformance | null, error };
}

// ─── t_sales_order ────────────────────────────────────────────────────────────

export async function listSalesOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_sales_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TSalesOrder[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getSalesOrderById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("t_sales_order").select("*").eq("id", id).maybeSingle();
  return { data: data as TSalesOrder | null, error };
}

export async function createSalesOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_sales_order").insert(input).select("*").single();
  return { data: data as TSalesOrder | null, error };
}

export async function updateSalesOrder(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_sales_order")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TSalesOrder | null, error };
}
