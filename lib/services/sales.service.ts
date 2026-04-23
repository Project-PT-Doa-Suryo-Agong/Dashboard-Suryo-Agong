/**
 * @deprecated — FASE 2 MIGRASI HYBRID BACKEND
 *
 * File ini sudah di-deprecated per April 2026.
 * Segera migrasikan endpoint yang menggunakan service ini menuju direct Supabase hooks.
 * 
 * @see lib/supabase/hooks/use-sales.ts
 */
import type { MAfiliator, TContentPlanner, TSalesOrder, TContentStatistic } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("sales");

//  m_affiliator 

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
  const { data, error } = await db(client).from("m_affiliator").insert(input as never).select("*").single();
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

//  t_content_planner 

export async function listContentPlanner(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_content_planner")
    .select("*, m_affiliator(nama)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TContentPlanner[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createContentPlanner(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_content_planner").insert(input as never).select("*").single();
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

export async function deleteContentPlanner(client: DbClient, id: string) {
  const { error, count } = await db(client)
    .from("t_content_planner")
    .delete({ count: "exact" })
    .eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_content_statistic

async function enrichContentStatisticWithPlanner(
  client: DbClient,
  rows: TContentStatistic[]
): Promise<TContentStatistic[]> {
  const plannerIds = Array.from(
    new Set(rows.map((row) => row.content_planner_id).filter((id): id is string => Boolean(id)))
  );

  if (plannerIds.length === 0) return rows;

  const { data: planners } = await db(client)
    .from("t_content_planner")
    .select("id, judul")
    .in("id", plannerIds);

  const plannerMap = new Map((planners ?? []).map((p) => [p.id, p.judul]));

  return rows.map((row) => ({
    ...row,
    t_content_planner: row.content_planner_id
      ? { judul: plannerMap.get(row.content_planner_id) ?? null }
      : null,
  }));
}

export async function listContentStatistic(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_content_statistic")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(from, from + limit - 1);
  const rows = (data ?? []) as TContentStatistic[];
  const enriched = await enrichContentStatisticWithPlanner(client, rows);
  return { data: enriched, error, meta: { page, limit, total: count ?? 0 } };
}

export async function createContentStatistic(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_content_statistic")
    .insert(input as never)
    .select("*")
    .single();
  const row = (data as TContentStatistic | null) ?? null;
  if (!row) return { data: row, error };
  const [enriched] = await enrichContentStatisticWithPlanner(client, [row]);
  return { data: enriched ?? row, error };
}

export async function updateContentStatistic(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_content_statistic")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  const row = (data as TContentStatistic | null) ?? null;
  if (!row) return { data: row, error };
  const [enriched] = await enrichContentStatisticWithPlanner(client, [row]);
  return { data: enriched ?? row, error };
}

export async function deleteContentStatistic(client: DbClient, id: string) {
  const { error, count } = await db(client)
    .from("t_content_statistic")
    .delete({ count: "exact" })
    .eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_sales_order 

export async function listSalesOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_sales_order")
    .select("*, m_coa(kode_akun,nama_akun)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TSalesOrder[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getSalesOrderById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("t_sales_order").select("*").eq("id", id).maybeSingle();
  return { data: data as TSalesOrder | null, error };
}

export async function createSalesOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_sales_order").insert(input as never).select("*").single();
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

export async function deleteSalesOrder(client: DbClient, id: string) {
  const { error, count } = await db(client)
    .from("t_sales_order")
    .delete({ count: "exact" })
    .eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

