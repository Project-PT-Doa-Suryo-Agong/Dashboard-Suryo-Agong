import type { TLogistikManifest, TPacking, TReturnOrder } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("logistics");

export async function listManifest(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_logistik_manifest")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as any[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createManifest(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_logistik_manifest").insert(input as any).select("*").single();
  return { data: data as TLogistikManifest | null, error };
}

export async function updateManifest(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_logistik_manifest")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TLogistikManifest | null, error };
}

export async function deleteManifest(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_logistik_manifest").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listPacking(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_packing")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as any[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createPacking(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_packing").insert(input as any).select("*").single();
  return { data: data as TPacking | null, error };
}

export async function updatePacking(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_packing")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TPacking | null, error };
}

export async function deletePacking(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_packing").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}

export async function listReturnOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_return_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as any[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createReturnOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_return_order").insert(input as any).select("*").single();
  return { data: data as TReturnOrder | null, error };
}

export async function updateReturnOrder(client: DbClient, orderId: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_return_order")
    .update(input as any)
    .eq("order_id", orderId)
    .select("*")
    .maybeSingle();
  return { data: data as TReturnOrder | null, error };
}

export async function deleteReturnOrder(client: DbClient, orderId: string) {
  const { error, count } = await db(client).from("t_return_order").delete({ count: "exact" }).eq("order_id", orderId);
  return { error, deleted: (count ?? 0) > 0 };
}
