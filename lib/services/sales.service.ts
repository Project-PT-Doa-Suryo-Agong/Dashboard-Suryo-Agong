/**
 * @deprecated — FASE 2 MIGRASI HYBRID BACKEND
 *
 * File ini sudah di-deprecated per April 2026.
 * Segera migrasikan endpoint yang menggunakan service ini menuju direct Supabase hooks.
 * 
 * @see lib/supabase/hooks/use-sales.ts
 */
import type { MAfiliator, MAfiliatorInsert, TContentPlanner, TSalesOrder, TContentStatistic } from "@/types/supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

export async function createAfiliator(client: DbClient, input: MAfiliatorInsert) {
  const { data, error } = await db(client).from("m_affiliator").insert(input as never).select("*").single();
  return { data: data as MAfiliator | null, error };
}

export async function updateAfiliator(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("m_affiliator")
    .update(input as never)
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
    .update(input as never)
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
    .update(input as never)
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

async function enrichSalesOrders(client: DbClient, orders: any[]): Promise<any[]> {
  if (orders.length === 0) return [];

  const orderIds = orders.map(o => o.id);
  const pelangganIds = orders.map(o => o.id_pelanggan).filter((id): id is string => Boolean(id));

  // Fetch memberships (customers)
  const pelangganMap = new Map<string, any>();
  if (pelangganIds.length > 0) {
    const { data: pelanggans } = await (db(client) as any)
      .from("t_membership")
      .select("*")
      .in("id", pelangganIds);
    if (pelanggans) {
      pelanggans.forEach((p: any) => pelangganMap.set(p.id, p));
    }
  }

  // Fetch order items (variants)
  const itemsMap = new Map<string, any[]>();
  let { data: items } = await (db(client) as any)
    .from("t_item")
    .select("*")
    .in("id_order", orderIds);

  if ((!items || items.length === 0) && orderIds.length > 0) {
    const { data: adminItems } = await (supabaseAdmin as any)
      .schema("sales")
      .from("t_item")
      .select("*")
      .in("id_order", orderIds);
    items = adminItems ?? items;
  }
  if (items) {
    items.forEach((item: any) => {
      if (!itemsMap.has(item.id_order)) {
        itemsMap.set(item.id_order, []);
      }
      itemsMap.get(item.id_order)!.push(item);
    });
  }

  return orders.map(order => {
    const pelanggan = order.id_pelanggan ? pelangganMap.get(order.id_pelanggan) : null;
    const orderItems = itemsMap.get(order.id) || [];
    const firstItem = orderItems[0] || null;
    const totalFromItems = orderItems.reduce((acc, item) => acc + Number(item.harga_total || 0), 0);
    const resolvedTotal = totalFromItems || order.total_bayar || 0;

    return {
      ...order,
      nama_pelanggan: order.nama_pelanggan || (pelanggan ? pelanggan.nama : null),
      nomor_telepon: order.nomor_telepon || (pelanggan ? pelanggan.telepon : null),
      lokasi: order.lokasi || (pelanggan ? pelanggan.lokasi : null),
      varian_id: order.varian_id || (firstItem ? firstItem.id_varian : null),
      quantity: order.total_item || (firstItem ? firstItem.qty : 0),
      total_price: resolvedTotal,
      items: orderItems,
      t_membership: pelanggan
    };
  });
}

export async function listSalesOrder(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_sales_order")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return { data: [], error, meta: { page, limit, total: count ?? 0 } };
  }

  const enriched = await enrichSalesOrders(client, data ?? []);
  return { data: enriched as TSalesOrder[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function getSalesOrderById(client: DbClient, id: string) {
  const { data, error } = await db(client).from("t_sales_order").select("*").eq("id", id).maybeSingle();
  if (error || !data) return { data: null, error };
  const [enriched] = await enrichSalesOrders(client, [data]);
  return { data: (enriched as TSalesOrder) || null, error };
}

async function generateUniqueSku(client: DbClient, productName: string, variantName: string): Promise<string> {
  const pInitials = productName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "PRD";
  const vInitials = variantName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase() || "VAR";
  const prefix = `SKU-${pInitials}-${vInitials}`;

  let isUnique = false;
  let finalSku = "";
  let attempts = 0;

  while (!isUnique && attempts < 100) {
    const suffix = attempts === 0 
      ? Math.floor(1000 + Math.random() * 9000).toString()
      : `${Math.floor(1000 + Math.random() * 9000)}-${attempts}`;
    finalSku = `${prefix}-${suffix}`;

    // Check if this SKU exists in core.m_varian
    const { data } = await (client as any)
      .schema("core")
      .from("m_varian")
      .select("id")
      .eq("sku", finalSku)
      .maybeSingle();

    if (!data) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    finalSku = `${prefix}-${Date.now()}`;
  }

  return finalSku;
}

async function resolveOrCreateVariant(
  client: DbClient,
  item: { varian_id?: string; nama_produk?: string; nama_varian?: string; harga?: number; kategori?: string }
): Promise<string> {
  const { varian_id, nama_produk, nama_varian, harga, kategori } = item;

  // 1. If it's a valid UUID, check if it exists in core.m_varian
  if (varian_id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(varian_id)) {
    const { data } = await (client as any).schema("core").from("m_varian").select("id").eq("id", varian_id).maybeSingle();
    if (data) return data.id;
  }

  // 2. If it has a variant name or product name
  if (nama_varian || nama_produk) {
    const resolvedProdName = (nama_produk || nama_varian || "Produk Baru").trim();
    const resolvedVarName = (nama_varian || nama_produk || "Varian Baru").trim();
    const resolvedHarga = Number(harga || 0);

    // Check if product exists (case-insensitive)
    let productId: string | null = null;
    const { data: existingProd } = await (client as any)
      .schema("core")
      .from("m_produk")
      .select("id")
      .ilike("nama_produk", resolvedProdName)
      .limit(1)
      .maybeSingle();

    if (existingProd) {
      productId = existingProd.id;
    } else {
      // Create new product with category
      const { data: newProd, error: prodErr } = await (client as any)
        .schema("core")
        .from("m_produk")
        .insert({
          nama_produk: resolvedProdName,
          kategori: kategori || "Lainnya",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id")
        .single();
      
      if (prodErr) throw new Error(`Gagal membuat produk induk baru: ${prodErr.message}`);
      if (!newProd) throw new Error(`Gagal membuat produk induk baru.`);
      productId = newProd.id;
    }

    // Check if variant exists under this product
    const { data: existingVar } = await (client as any)
      .schema("core")
      .from("m_varian")
      .select("id")
      .eq("product_id", productId)
      .ilike("nama_varian", resolvedVarName)
      .limit(1)
      .maybeSingle();

    if (existingVar) {
      return existingVar.id;
    } else {
      // Generate a unique, auto-generated SKU
      const resolvedSku = await generateUniqueSku(client, resolvedProdName, resolvedVarName);

      // Create new variant
      const { data: newVar, error: varErr } = await (client as any)
        .schema("core")
        .from("m_varian")
        .insert({
          product_id: productId,
          nama_varian: resolvedVarName,
          harga: resolvedHarga,
          sku: resolvedSku,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (varErr) throw new Error(`Gagal membuat varian baru: ${varErr.message}`);
      if (!newVar) throw new Error(`Gagal membuat varian baru.`);
      return newVar.id;
    }
  }

  throw new Error("Varian produk tidak dapat diidentifikasi.");
}

export async function createSalesOrder(client: DbClient, input: Record<string, any>) {
  // 0. Auto-resolve or create variants if new
  if (input.items && Array.isArray(input.items) && input.items.length > 0) {
    for (let i = 0; i < input.items.length; i++) {
      const it = input.items[i];
      const itemVarianId = it.id_varian || it.varian_id;
      const isNew = it.is_new || !itemVarianId || (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(itemVarianId));
      if (isNew && (it.nama_varian || it.nama_produk)) {
        try {
          const finalId = await resolveOrCreateVariant(client, {
            varian_id: itemVarianId,
            nama_produk: it.nama_produk,
            nama_varian: it.nama_varian,
            harga: Number(it.harga || 0),
            kategori: it.kategori
          });
          it.varian_id = finalId;
          it.id_varian = finalId;
        } catch (err) {
          console.error("Gagal resolveOrCreateVariant:", err);
        }
      }
    }
  }

  if (input.varian_id) {
    const isNew = input.is_new || (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(input.varian_id));
    if (isNew && (input.nama_varian || input.nama_produk)) {
      try {
        const finalId = await resolveOrCreateVariant(client, {
          varian_id: input.varian_id,
          nama_produk: input.nama_produk,
          nama_varian: input.nama_varian,
          harga: Number(input.harga || 0),
          kategori: input.kategori
        });
        input.varian_id = finalId;
      } catch (err) {
        console.error("Gagal resolveOrCreateVariant untuk single:", err);
      }
    }
  }

  // 1. Resolve id_pelanggan
  let idPelanggan = input.id_pelanggan || null;
  if (!idPelanggan && (input.nama_pelanggan || input.nomor_telepon)) {
    // Try to find existing customer by phone
    if (input.nomor_telepon) {
      const { data: existing } = await (db(client) as any)
        .from("t_membership")
        .select("id")
        .eq("telepon", input.nomor_telepon)
        .limit(1)
        .maybeSingle();
      if (existing) {
        idPelanggan = existing.id;

        // Update customer details if new values are provided
        const custUpdate: Record<string, string> = {};
        if (input.nama_pelanggan) custUpdate.nama = input.nama_pelanggan;
        if (input.lokasi) custUpdate.lokasi = input.lokasi;
        if (Object.keys(custUpdate).length > 0) {
          await (db(client) as any)
            .from("t_membership")
            .update(custUpdate)
            .eq("id", idPelanggan);
        }
      }
    }

    // If not found, create new customer
    if (!idPelanggan) {
      const { data: newCust, error: custErr } = await (db(client) as any)
        .from("t_membership")
        .insert({
          nama: input.nama_pelanggan || "Pelanggan",
          telepon: input.nomor_telepon || "",
          lokasi: input.lokasi || ""
        })
        .select("id")
        .single();
      
      if (!custErr && newCust) {
        idPelanggan = newCust.id;
      }
    }
  }

  // 2. Prepare sales order insert
  // Kolom yang ada di tabel: id, created_at, updated_at, order_number,
  // terms_of_payment, jumlah_piutang, jumlah_cash, diskon,
  // id_pelanggan, total_item, total_bayar, coa_cash_id, coa_credit_id
  const resolvedTotalItem = Number(input.total_item ?? input.quantity ?? 0);
  const resolvedTotalBayar = Number(input.total_bayar ?? input.total_price ?? 0);
  const resolvedJumlahCash = Number(input.jumlah_cash ?? resolvedTotalBayar);
  const resolvedJumlahPiutang = Number(input.jumlah_piutang ?? Math.max(0, resolvedTotalBayar - resolvedJumlahCash));

  const orderPayload = {
    order_number: input.order_number ?? null,
    coa_cash_id: input.coa_cash_id ?? null,
    coa_credit_id: input.coa_credit_id ?? null,
    terms_of_payment: Number(input.terms_of_payment || 0),
    jumlah_piutang: resolvedJumlahPiutang,
    jumlah_cash: resolvedJumlahCash,
    diskon: Number(input.diskon || 0),
    id_pelanggan: idPelanggan,
    total_item: resolvedTotalItem,
    created_at: input.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: orderData, error: orderErr } = await db(client)
    .from("t_sales_order")
    .insert(orderPayload as any)
    .select("*")
    .single();

  if (orderErr) {
    return { data: null, error: orderErr };
  }

  // 3. Create items in t_item
  const itemsToInsert = [];
  console.debug('[createSalesOrder] incoming input:', JSON.stringify(input));
  if (input.items && Array.isArray(input.items) && input.items.length > 0) {
    const varianIds = input.items
      .map((it: any) => it.id_varian || it.varian_id)
      .filter((id: any): id is string => Boolean(id));

    const varianPriceMap = new Map<string, number>();
    if (varianIds.length > 0) {
      const { data: varianRows } = await (db(client) as any)
        .schema("core")
        .from("m_varian")
        .select("id, harga")
        .in("id", varianIds);

      if (varianRows) {
        varianRows.forEach((row: any) => {
          varianPriceMap.set(row.id, Number(row.harga || 0));
        });
      }
      console.debug('[createSalesOrder] varianPriceMap:', Array.from(varianPriceMap.entries()));
    }

    for (const it of input.items) {
      const itemVarianId = it.id_varian || it.varian_id;
      const qty = Number(it.qty || it.quantity || 1);
      const fallbackPrice = itemVarianId ? (varianPriceMap.get(itemVarianId) ?? 0) : 0;
      const price = Number(it.harga ?? fallbackPrice ?? 0);
      const total = Number(it.harga_total ?? (price * qty));

      itemsToInsert.push({
        id_order: orderData.id,
        id_varian: itemVarianId,
        harga: price,
        qty,
        // `harga_total` is a generated column in DB; let DB compute it
      });
    }
    console.debug('[createSalesOrder] itemsToInsert:', JSON.stringify(itemsToInsert));
  } else if (input.varian_id) {
    // Fetch variant price
    let price = 0;
    const { data: varData } = await (client as any)
      .schema("core")
      .from("m_varian")
      .select("harga")
      .eq("id", input.varian_id)
      .single();
    if (varData) {
      price = varData.harga;
    }

    itemsToInsert.push({
      id_order: orderData.id,
      id_varian: input.varian_id,
      harga: price,
      qty: Number(input.quantity || 1),
      // `harga_total` is generated in DB; omit it here
    });
  }

  if (itemsToInsert.length > 0) {
    const { error: itemsErr } = await (db(client) as any)
      .from("t_item")
      .insert(itemsToInsert as any);
    
    if (itemsErr) {
      console.error("Failed to insert t_item detail:", itemsErr);
    }
  }

  const [enriched] = await enrichSalesOrders(client, [orderData]);
  return { data: (enriched as TSalesOrder) || orderData, error: null };
}

export async function updateSalesOrder(client: DbClient, id: string, input: Record<string, any>) {
  // 1. If customer details are updated, update the associated t_membership row or create one
  let idPelanggan = input.id_pelanggan;

  if (input.nama_pelanggan !== undefined || input.nomor_telepon !== undefined || input.lokasi !== undefined) {
    // Get existing order to get id_pelanggan
    const { data: existingOrder } = await db(client)
      .from("t_sales_order")
      .select("id_pelanggan")
      .eq("id", id)
      .single();
    
    idPelanggan = existingOrder?.id_pelanggan;

    if (idPelanggan) {
      // Update existing customer
      const custUpdate: any = {};
      if (input.nama_pelanggan !== undefined) custUpdate.nama = input.nama_pelanggan;
      if (input.nomor_telepon !== undefined) custUpdate.telepon = input.nomor_telepon;
      if (input.lokasi !== undefined) custUpdate.lokasi = input.lokasi;

      await (db(client) as any)
        .from("t_membership")
        .update(custUpdate)
        .eq("id", idPelanggan);
    } else if (input.nama_pelanggan || input.nomor_telepon) {
      // Create new customer
      const { data: newCust } = await (db(client) as any)
        .from("t_membership")
        .insert({
          nama: input.nama_pelanggan || "Pelanggan",
          telepon: input.nomor_telepon || "",
          lokasi: input.lokasi || ""
        })
        .select("id")
        .single();
      if (newCust) {
        idPelanggan = newCust.id;
      }
    }
  }

  // 2. Prepare update payload
  const updatePayload: any = {
    updated_at: new Date().toISOString()
  };
  if (input.order_number !== undefined) updatePayload.order_number = input.order_number;
  if (input.coa_cash_id !== undefined) updatePayload.coa_cash_id = input.coa_cash_id;
  if (input.coa_credit_id !== undefined) updatePayload.coa_credit_id = input.coa_credit_id;
  if (input.terms_of_payment !== undefined) updatePayload.terms_of_payment = Number(input.terms_of_payment);
  if (input.jumlah_piutang !== undefined) updatePayload.jumlah_piutang = Number(input.jumlah_piutang);
  if (input.jumlah_cash !== undefined) updatePayload.jumlah_cash = Number(input.jumlah_cash);
  if (input.diskon !== undefined) updatePayload.diskon = Number(input.diskon);
  if (idPelanggan !== undefined) updatePayload.id_pelanggan = idPelanggan;
  if (input.total_item !== undefined || input.quantity !== undefined) {
    updatePayload.total_item = Number(input.total_item !== undefined ? input.total_item : input.quantity);
  }

  const { data: orderData, error: orderErr } = await db(client)
    .from("t_sales_order")
    .update(updatePayload as any)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (orderErr) {
    return { data: null, error: orderErr };
  }

  // 3. If items are updated, update t_item
  if (input.items && Array.isArray(input.items)) {
    // Delete existing items for this order
    await (db(client) as any).from("t_item").delete().eq("id_order", id);

    const itemsToInsert = [];
    for (const it of input.items) {
      const itVarianId = it.varian_id || it.id_varian;
      const itQty = Number(it.quantity || it.qty || 1);
      
      let price = 0;
      const { data: varData } = await (client as any)
        .schema("core")
        .from("m_varian")
        .select("harga")
        .eq("id", itVarianId)
        .single();
      if (varData) {
        price = varData.harga;
      }

      itemsToInsert.push({
        id_order: id,
        id_varian: itVarianId,
        harga: price,
        qty: itQty
      });
    }
    if (itemsToInsert.length > 0) {
      await (db(client) as any).from("t_item").insert(itemsToInsert as any);
    }
  } else if (input.varian_id !== undefined || input.quantity !== undefined) {
    let finalVarianId = input.varian_id;
    let finalQty = input.quantity;
    
    if (finalVarianId === undefined || finalQty === undefined) {
      const { data: existingItems } = await (db(client) as any)
        .from("t_item")
        .select("*")
        .eq("id_order", id)
        .limit(1);
      
      const firstItem = existingItems?.[0];
      if (finalVarianId === undefined) finalVarianId = firstItem?.id_varian;
      if (finalQty === undefined) finalQty = firstItem?.qty ?? 1;
    }

    if (finalVarianId) {
      let price = 0;
      const { data: varData } = await (client as any)
        .schema("core")
        .from("m_varian")
        .select("harga")
        .eq("id", finalVarianId)
        .single();
      if (varData) {
        price = varData.harga;
      }

      const hargaTotal = price * Number(finalQty);

      const { data: existingItems } = await (db(client) as any)
        .from("t_item")
        .select("id_order")
        .eq("id_order", id);

      if (existingItems && existingItems.length > 0) {
        await (db(client) as any)
          .from("t_item")
          .update({
            id_varian: finalVarianId,
            harga: price,
            qty: Number(finalQty)
          })
          .eq("id_order", id);
      } else {
        await (db(client) as any)
          .from("t_item")
          .insert({
            id_order: id,
            id_varian: finalVarianId,
            harga: price,
            qty: Number(finalQty)
          });
      }
    }
  }

  const [enriched] = await enrichSalesOrders(client, [orderData]);
  return { data: (enriched as TSalesOrder) || orderData, error: null };
}

export async function deleteSalesOrder(client: DbClient, id: string) {
  // First delete items in t_item
  await (db(client) as any).from("t_item").delete().eq("id_order", id);

  const { error, count } = await db(client)
    .from("t_sales_order")
    .delete({ count: "exact" })
    .eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}

//  t_live_performance

export async function listLivePerformance(client: DbClient, page = 1, limit = 50) {
  const from = (page - 1) * limit;
  const { data, error, count } = await db(client)
    .from("t_live_performance")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);
  return { data: (data ?? []) as import("@/types/supabase").TLivePerformance[], error, meta: { page, limit, total: count ?? 0 } };
}

export async function createLivePerformance(client: DbClient, input: Record<string, unknown>) {
  const { data, error } = await db(client).from("t_live_performance").insert(input as never).select("*").single();
  return { data: data as import("@/types/supabase").TLivePerformance | null, error };
}

export async function updateLivePerformance(client: DbClient, id: string, input: Record<string, unknown>) {
  const { data, error } = await db(client)
    .from("t_live_performance")
    .update(input as never)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  return { data: data as import("@/types/supabase").TLivePerformance | null, error };
}

export async function deleteLivePerformance(client: DbClient, id: string) {
  const { error, count } = await db(client)
    .from("t_live_performance")
    .delete({ count: "exact" })
    .eq("id", id);
  return { error, deleted: (count ?? 0) > 0 };
}
