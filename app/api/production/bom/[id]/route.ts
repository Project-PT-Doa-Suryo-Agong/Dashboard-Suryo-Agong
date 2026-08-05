import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TBomItemInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

type BomItemInput = {
  bahan_baku_id: string;
  qty_per_unit: number;
};

async function attachProductInfo(
  supabase: any,
  bom: Record<string, any>
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!bom?.product_id) return { ok: true };

  const { data: product, error } = await supabase
    .schema("core")
    .from("m_produk")
    .select("id, nama_produk, kategori")
    .eq("id", bom.product_id)
    .maybeSingle();

  if (error) return { ok: false, message: error.message };

  bom.m_produk = product
    ? { id: product.id, nama_produk: product.nama_produk, kategori: product.kategori }
    : null;

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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { data: bom, error: bomErr } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (bomErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data BOM.", 500, bomErr.message);
  }
  if (!bom) {
    return fail(ErrorCode.NOT_FOUND, "BOM tidak ditemukan.", 404);
  }

  const attachResult = await attachProductInfo(auth.ctx.supabase, bom);
  if (!attachResult.ok) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data BOM.", 500, attachResult.message);
  }

  const { data: items, error: itemsErr } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("t_bom_item")
    .select("*, m_bahan_baku(kode_bahan, nama_bahan, satuan)")
    .eq("bom_id", id)
    .order("created_at", { ascending: true });

  if (itemsErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil item BOM.", 500, itemsErr.message);
  }

  return ok({ bom, items: items ?? [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (Object.keys(input).length === 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tidak ada field yang diupdate.", 400);
  }

  const payload: Record<string, any> = {};
  let replaceItems: BomItemInput[] | null = null;

  if ("product_id" in input) {
    const productId = requireUUID(input, "product_id");
    if (!productId.ok) return fail(ErrorCode.VALIDATION_ERROR, productId.message, 400);
    payload.product_id = productId.data;
  }
  if ("nama_resep" in input) {
    const namaResep = requireString(input, "nama_resep", { maxLen: 120 });
    if (!namaResep.ok) return fail(ErrorCode.VALIDATION_ERROR, namaResep.message, 400);
    payload.nama_resep = namaResep.data;
  }
  if ("status_aktif" in input) {
    payload.status_aktif = Boolean(input.status_aktif);
  }
  if ("items" in input) {
    const itemsResult = validateBomItems(input.items);
    if (typeof itemsResult === "string") {
      return fail(ErrorCode.VALIDATION_ERROR, itemsResult, 400);
    }
    replaceItems = itemsResult;
  }

  // Cek BOM ada
  const { data: existingBom, error: existErr } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (existErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi BOM.", 500, existErr.message);
  }
  if (!existingBom) {
    return fail(ErrorCode.NOT_FOUND, "BOM tidak ditemukan.", 404);
  }

  // Validasi satu BOM per produk (bila product_id diubah)
  if (payload.product_id) {
    const { data: conflicting, error: conflictErr } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("m_bom")
      .select("id")
      .eq("product_id", payload.product_id)
      .neq("id", id)
      .maybeSingle();

    if (conflictErr) {
      return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi produk.", 500, conflictErr.message);
    }
    if (conflicting) {
      return fail(ErrorCode.ALREADY_EXISTS, "Produk ini sudah memiliki resep (BOM).", 409);
    }
  }

  // Validasi bahan baku yang dipakai ada
  if (replaceItems) {
    for (const item of replaceItems) {
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
  }

  if (Object.keys(payload).length > 0) {
    payload.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("m_bom")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (updateError) {
      if (updateError.code === "23505") {
        return fail(ErrorCode.ALREADY_EXISTS, "Produk ini sudah memiliki resep (BOM).", 409);
      }
      return fail(ErrorCode.DB_ERROR, "Gagal update BOM.", 500, updateError.message);
    }
    if (!updated) {
      return fail(ErrorCode.NOT_FOUND, "BOM tidak ditemukan.", 404);
    }
  }

  // Ganti seluruh item bila dikirim (delete + re-insert)
  if (replaceItems) {
    const { error: deleteErr } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("t_bom_item")
      .delete()
      .eq("bom_id", id);

    if (deleteErr) {
      return fail(ErrorCode.DB_ERROR, "Gagal memperbarui item BOM.", 500, deleteErr.message);
    }

    for (const item of replaceItems) {
      const itemPayload: TBomItemInsert = {
        bom_id: id,
        bahan_baku_id: item.bahan_baku_id,
        qty_per_unit: item.qty_per_unit,
      };

      const { error: itemErr } = await (auth.ctx.supabase as any)
        .schema("production")
        .from("t_bom_item")
        .insert(itemPayload);

      if (itemErr) {
        return fail(ErrorCode.DB_ERROR, "Gagal menyimpan item BOM.", 500, itemErr.message);
      }
    }
  }

  const { data: bom, error: bomErr } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (bomErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data BOM.", 500, bomErr.message);
  }

  const attachResult = await attachProductInfo(auth.ctx.supabase, bom);
  if (!attachResult.ok) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data BOM.", 500, attachResult.message);
  }

  return ok({ bom });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, count } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bom")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal menghapus BOM.", 500, error.message);
  }
  if ((count ?? 0) === 0) {
    return fail(ErrorCode.NOT_FOUND, "BOM tidak ditemukan.", 404);
  }

  return ok(null, "BOM berhasil dihapus.");
}
