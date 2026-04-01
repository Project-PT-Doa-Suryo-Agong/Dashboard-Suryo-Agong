import type { TLogistikManifest, TPacking, TReturnOrder } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("logistics");

//  t_logistik_manifest 

export async function listManifest(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_logistik_manifest")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TLogistikManifest[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createManifest(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_logistik_manifest").insert(input).select("*").single();
  return { data: data as TLogistikManifest | null, error };
}

export async function updateManifest(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_logistik_manifest")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TLogistikManifest | null, error };
}

export async function deleteManifest(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_logistik_manifest").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_packing 

export async function listPacking(client: DbClient, page = 1, limit = 100) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_packing")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TPacking[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createPacking(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_packing").insert(input).select("*").single();
  return { data: data as TPacking | null, error };
}

export async function updatePacking(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_packing")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TPacking | null, error };
}

export async function deletePacking(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_packing").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_return_order 

export async function listReturnOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_return_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as TReturnOrder[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createReturnOrder(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_return_order").insert(input).select("*").single();
  return { data: data as TReturnOrder | null, error };
}

export async function updateReturnOrder(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_return_order")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as TReturnOrder | null, error };
}

export async function deleteReturnOrder(client: DbClient, id: string) {
  const { error, count } = await db(client).from("t_return_order").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

