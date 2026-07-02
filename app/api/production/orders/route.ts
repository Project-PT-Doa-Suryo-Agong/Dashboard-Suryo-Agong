import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listProduksiOrder, createProduksiOrder } from "@/lib/services/production.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TProduksiOrderInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getProfileById } from "@/lib/services/profile.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listProduksiOrder(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data produksi order.", 500, error.message);
  return ok({ orders: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const vendorId = requireUUID(input, "vendor_id", { optional: true });
  if (!vendorId.ok) return fail(ErrorCode.VALIDATION_ERROR, vendorId.message, 400);
  const productId = requireUUID(input, "product_id", { optional: true });
  if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
  const quantity = requireNumber(input, "quantity", { min: 0, optional: true });
  if (!quantity.ok) return fail(ErrorCode.VALIDATION_ERROR, quantity.message, 400);
  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data && !["draft", "ongoing", "done"].includes(status.data as string)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus draft, ongoing, atau done.", 400);
  }

  const produksiNumber = requireString(input, "produksi_number", { optional: true });
  if (!produksiNumber.ok) return fail(ErrorCode.VALIDATION_ERROR, produksiNumber.message, 400);

  const generateProduksiNumber = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

    const { data: countData, error: countError } = await supabaseAdmin.rpc("count_produksi_orders_this_month", {
      start_of_month: startOfMonth,
      start_of_next_month: startOfNextMonth,
    });

    if (countError) {
      return { ok: false as const, error: countError };
    }

    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yy = String(now.getFullYear()).slice(-2);
    const seq = String(((countData as number) ?? 0) + 1).padStart(5, "0");
    return { ok: true as const, number: `PRD-${mm}${yy}-${seq}` };
  };

  let finalProduksiNumber = produksiNumber.data ?? null;
  if (!finalProduksiNumber) {
    const generated = await generateProduksiNumber();
    if (!generated.ok) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat nomor produksi.", 500, generated.error.message);
    }
    finalProduksiNumber = generated.number;
  }

  // Get active operator name
  const { data: profile } = await getProfileById(auth.ctx.supabase, auth.ctx.userId);
  const operatorName = profile?.nama || "Operator Produksi";

  // Check if materials are supplied
  const materials = input.materials;

  if (Array.isArray(materials) && materials.length > 0) {
    for (const item of materials) {
      if (!item.bahan_baku_id || typeof item.bahan_baku_id !== "string" || !item.jumlah || isNaN(Number(item.jumlah)) || Number(item.jumlah) <= 0) {
        return fail(ErrorCode.VALIDATION_ERROR, "Format data alokasi bahan baku tidak valid.", 400);
      }
    }

    // 1. Create the production order (retry once if duplicate produksi_number)
    let createdOrder: any;
    const sb = auth.ctx.supabase as any;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: order, error: orderError } = await sb
        .schema("production")
        .from("t_produksi_order")
        .insert({
          vendor_id: vendorId.data,
          product_id: productId.data,
          quantity: quantity.data,
          status: status.data ?? "draft",
          produksi_number: finalProduksiNumber,
        })
        .select("*")
        .single();

      if (order && !orderError) {
        createdOrder = order;
        break;
      }

      if (orderError?.message?.includes("duplicate key") || orderError?.code === "23505") {
        finalProduksiNumber = await generateProduksiNumber().then(r => r.ok ? r.number : `PRD-${Date.now()}`);
      } else {
        return fail(ErrorCode.DB_ERROR, "Gagal membuat produksi order.", 500, orderError?.message);
      }
    }

    if (!createdOrder) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat produksi order setelah percobaan ulang.", 500);
    }

    // 2. Process each material allocation
    for (const item of materials) {
      const bahanId = item.bahan_baku_id as string;
      const jumlah = Number(item.jumlah);

      // Validate stock availability
      const { data: bahan, error: bahanErr } = await sb
        .schema("production")
        .from("m_bahan_baku")
        .select("stok, nama_bahan, satuan")
        .eq("id", bahanId)
        .single();

      if (bahanErr || !bahan) {
        return fail(ErrorCode.DB_ERROR, "Bahan baku tidak ditemukan.", 500, bahanErr?.message);
      }

      if (bahan.stok < jumlah) {
        // Cleanup: delete the created order if allocation fails
        await sb.schema("production").from("t_produksi_order").delete().eq("id", createdOrder.id);
        return fail(ErrorCode.VALIDATION_ERROR, `Stok ${bahan.nama_bahan} tidak mencukupi. Stok tersedia: ${bahan.stok} ${bahan.satuan}.`, 400);
      }

      // Insert allocation detail
      const { error: alokasiErr } = await sb
        .schema("production")
        .from("t_produksi_bahan")
        .insert({ produksi_order_id: createdOrder.id, bahan_baku_id: bahanId, jumlah });

      if (alokasiErr) {
        return fail(ErrorCode.DB_ERROR, "Gagal menyimpan alokasi bahan baku.", 500, alokasiErr.message);
      }

      // Log mutasi stok (trigger tr_stok_mutasi_after_insert will auto-update m_bahan_baku.stok)
      const { error: mutasiErr } = await sb
        .schema("production")
        .from("t_stok_mutasi")
        .insert({
          bahan_baku_id: bahanId,
          produksi_order_id: createdOrder.id,
          tipe: "produksi",
          jumlah,
          keterangan: `Alokasi Produksi ${finalProduksiNumber}`,
          operator: operatorName,
        });

      if (mutasiErr) {
        return fail(ErrorCode.DB_ERROR, "Gagal mencatat mutasi stok.", 500, mutasiErr.message);
      }
    }

    return ok({ order: createdOrder }, "Produksi order berhasil dibuat dengan alokasi bahan baku.", 201);
  }

  // Setidaknya validasi ini memastikan payload bersih dari extraneous keys.
  const payload: TProduksiOrderInsert = {
    produksi_number: finalProduksiNumber,
    vendor_id: vendorId.data,
    product_id: productId.data,
    quantity: quantity.data,
    status: (status.data ?? "draft") as TProduksiOrderInsert["status"],
  };

  const { data, error } = await createProduksiOrder(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat produksi order.", 500, error.message);
  return ok({ order: data }, "Produksi order berhasil dibuat.", 201);
}
