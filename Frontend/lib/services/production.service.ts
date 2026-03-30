import type { TProduksiOrder, TQCInbound, TQCOutbound } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("production");

// â”€â”€â”€ t_produksi_order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listProduksiOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_produksi_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TProduksiOrder[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getProduksiOrderById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("t_produksi_order").select("*").eq("id", id).maybeSingle();
  return { data: data as TProduksiOrder | null, error };
}

export async function createProduksiOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_produksi_order").insert(input).select("*").single();
  return { data: data as TProduksiOrder | null, error };
}

export async function updateProduksiOrder(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_produksi_order")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TProduksiOrder | null, error };
}

export async function deleteProduksiOrder(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_produksi_order").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ t_qc_inbound â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listQCInbound(client: DbClient, page = 1, limit = 50, produksiOrderId?: string) {
  const from = (page - 1) * limit;
  let query = db(client)
    .from("t_qc_inbound")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  if (produksiOrderId) query = query.eq("produksi_order_id", produksiOrderId);
  const { data, error, count } = await query;
  return { data: (data ?? []) as TQCInbound[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createQCInbound(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_qc_inbound").insert(input).select("*").single();
  return { data: data as TQCInbound | null, error };
}

export async function updateQCInbound(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_qc_inbound")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TQCInbound | null, error };
}

export async function deleteQCInbound(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_qc_inbound").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ t_qc_outbound â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listQCOutbound(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_qc_outbound")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TQCOutbound[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createQCOutbound(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_qc_outbound").insert(input).select("*").single();
  return { data: data as TQCOutbound | null, error };
}

export async function updateQCOutbound(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_qc_outbound")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TQCOutbound | null, error };
}

export async function deleteQCOutbound(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_qc_outbound").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

