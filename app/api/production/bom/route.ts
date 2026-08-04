import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { MBomInsert, TBomItemInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

type BomItemInput = {
  bahan_baku_id: string;
  qty_per_unit: number;
};

async function attachProductInfo(
  supabase: any,
  rows: Record<string, any>[]
): Promise<{ ok: true } | { ok: false; message: string }> {
  const productIds = [...new Set(rows.map((row) => row.product_id).filter(Boolean))];
  if (productIds.length === 0) return { ok: true };

  const { data: products, error } = await supabase
    .schema("core")
    .from("m_produk")
    .select("id, nama_produk, kategori")
    .in("id", productIds);

  if (error) return { ok: false, message: error.message };

  const productMap = new Map(
    (products ?? []).map((product: any) => [
      product.id,
      { id: product.id, nama_produk: product.nama_produk, kategori: product.kategori },
    ])
  );

  for (const row of rows) {
    row.m_produk = productMap.get(row.product_id) ?? null;
  }

  return { ok: true };
}

function validateBomItems(items: unknown): BomItemInput[] | string {
  if (!Array.isArray(items) || items.length === 0) {
    return "items wajib berisi minimal satu bahan baku.";
  }

  const seen = new Set<string>();
  const parsed: BomItemInput[] = [];

  for (const item of items) {
    const raw = item as Record<string, unknown>;
    if (!raw || typeof raw !== "object") {
      return "Format data item BOM tidak valid.";
    }

    const bahanBakuId = raw.bahan_baku_id;
    const qtyPerUnit = Number(raw.qty_per_unit);

    if (typeof bahanBakuId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bahanBakuId)) {
      return "bahan_baku_id pada item BOM format tidak valid.";
    }
    if (Number.isNaN(qtyPerUnit) || qtyPerUnit <= 0) {
      return "qty_per_unit pada item BOM harus angka lebih dari 0.";
    }
    if (seen.has(bahanBakuId)) {
      return "Terdapat bahan baku yang sama lebih dari satu kali dalam satu resep.";
    }
    seen.add(bahanBakuId);
    parsed.push({ bahan_baku_id: bahanBakuId, qty_per_unit: qtyPerUnit });
  }

  return parsed;
}

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const from = (page - 1) * limit;
  const query = (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .select("*, t_bom_item(id)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar BOM.", 500, error.message);
  }

  const rows = (data ?? []) as Record<string, any>[];

  const attachResult = await attachProductInfo(auth.ctx.supabase, rows);
  if (!attachResult.ok) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar BOM.", 500, attachResult.message);
  }

  return ok({
    bom: rows,
    meta: {
      page,
      limit,
      total: count ?? 0,
    },
  });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;

  const productId = requireUUID(input, "product_id");
  if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);

  const namaResep = requireString(input, "nama_resep", { maxLen: 120, optional: true });
  if (!namaResep.ok) return fail(ErrorCode.VALIDATION_ERROR, namaResep.message, 400);

  const statusAktif = input.status_aktif !== undefined ? Boolean(input.status_aktif) : true;

  const itemsResult = validateBomItems(input.items);
  if (typeof itemsResult === "string") {
    return fail(ErrorCode.VALIDATION_ERROR, itemsResult, 400);
  }

  // Validasi produk ada
  const { data: product, error: productErr } = await (auth.ctx.supabase as any)
    .schema("core")
    .from("m_produk")
    .select("id")
    .eq("id", productId.data)
    .maybeSingle();

  if (productErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi produk.", 500, productErr.message);
  }
  if (!product) {
    return fail(ErrorCode.NOT_FOUND, "Produk tidak ditemukan.", 404);
  }

  // Validasi satu BOM per produk
  const { data: existing, error: existingErr } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .select("id")
    .eq("product_id", productId.data)
    .maybeSingle();

  if (existingErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi resep produk.", 500, existingErr.message);
  }
  if (existing) {
    return fail(ErrorCode.ALREADY_EXISTS, "Produk ini sudah memiliki resep (BOM).", 409);
  }

  // Validasi bahan baku yang dipakai ada dan aktif
  for (const item of itemsResult) {
    const { data: bahan, error: bahanErr } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("m_bahan_baku")
      .select("id")
      .eq("id", item.bahan_baku_id)
      .maybeSingle();

    if (bahanErr) {
      return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi bahan baku.", 500, bahanErr.message);
    }
    if (!bahan) {
      return fail(ErrorCode.NOT_FOUND, "Bahan baku tidak ditemukan.", 404);
    }
  }

  const payload: MBomInsert = {
    product_id: productId.data!,
    nama_resep: namaResep.data,
    status_aktif: statusAktif,
  };

  const { data: created, error: createError } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .insert(payload)
    .select("*")
    .single();

  if (createError) {
    if (createError.code === "23505") {
      return fail(ErrorCode.ALREADY_EXISTS, "Produk ini sudah memiliki resep (BOM).", 409);
    }
    return fail(ErrorCode.DB_ERROR, "Gagal membuat BOM.", 500, createError.message);
  }

  // Simpan item BOM satu per satu (mengikuti pola alokasi bahan existing)
  for (const item of itemsResult) {
    const itemPayload: TBomItemInsert = {
      bom_id: created.id,
      bahan_baku_id: item.bahan_baku_id,
      qty_per_unit: item.qty_per_unit,
    };

    const { error: itemErr } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("t_bom_item")
      .insert(itemPayload);

    if (itemErr) {
      // Rollback header BOM bila penyimpanan item gagal
      await (auth.ctx.supabase as any).schema("production").from("m_bom").delete().eq("id", created.id);
      return fail(ErrorCode.DB_ERROR, "Gagal menyimpan item BOM.", 500, itemErr.message);
    }
  }

  return ok({ bom: created }, "Resep (BOM) berhasil dibuat.", 201);
}
