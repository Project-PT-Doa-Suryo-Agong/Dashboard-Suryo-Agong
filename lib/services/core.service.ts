import type { MProduk, MVarian, MVendor } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type SchemaClient = DbClient & { schema: (schema: string) => DbClient };
const db = (client: DbClient) => (client as unknown as SchemaClient).schema("core");

// â”€â”€â”€ m_produk â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listProduk(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_produk")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MProduk[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getProdukById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("m_produk").select("*").eq("id", id).maybeSingle();
  return { data: data as MProduk | null, error };
}

export async function createProduk(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_produk")
    .insert({ ...input, updated_at: new Date().toISOString() } as never)
    .select("*")
    .single();
  return { data: data as MProduk | null, error };
}

export async function updateProduk(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_produk")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MProduk | null, error };
}

export async function deleteProduk(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_produk").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ m_varian â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listVarian(client: DbClient, produkId?: string) {
  let query = db(client).from("m_varian").select("*").order("created_at", { ascending: false });
  if (produkId) query = query.eq("product_id", produkId);
  const { data, error } = await query;
  return { data: (data ?? []) as MVarian[], error };
}

export async function getVarianById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("m_varian").select("*").eq("id", id).maybeSingle();
  return { data: data as MVarian | null, error };
}

export async function createVarian(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_varian").insert(input).select("*").single();
  return { data: data as MVarian | null, error };
}

export async function updateVarian(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_varian")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MVarian | null, error };
}

export async function deleteVarian(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_varian").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

// â”€â”€â”€ m_vendor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function listVendor(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("m_vendor")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as MVendor[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getVendorById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("m_vendor").select("*").eq("id", id).maybeSingle();
  return { data: data as MVendor | null, error };
}

export async function createVendor(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("m_vendor").insert(input).select("*").single();
  return { data: data as MVendor | null, error };
}

export async function updateVendor(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_vendor")
    .update(input)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as MVendor | null, error };
}

export async function deleteVendor(client: DbClient, id: string) {
  const { error, count } = await db(client).from("m_vendor").delete({ count: "exact" }).eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

