import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

/**
 * READ ONLY — Endpoint kalkulasi kebutuhan bahan baku dari BOM.
 * Hanya menghitung: jumlah = qty_per_unit × quantity.
 * Tidak melakukan insert/update/delete, tidak menyentuh mutasi stok.
 */
export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");
  const quantityRaw = url.searchParams.get("quantity");

  if (!productId) {
    return fail(ErrorCode.VALIDATION_ERROR, "product_id wajib diisi.", 400);
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId)) {
    return fail(ErrorCode.VALIDATION_ERROR, "product_id format UUID tidak valid.", 400);
  }

  const quantity = Number(quantityRaw);
  if (quantityRaw === null || Number.isNaN(quantity) || quantity <= 0) {
    return fail(ErrorCode.VALIDATION_ERROR, "quantity harus angka lebih dari 0.", 400);
  }

  const sb = (auth.ctx.supabase as any).schema("production");

  console.log("CALC-ROUTE", { product_id: productId, quantity });

  // Ambil BOM aktif untuk produk
  const { data: bom, error: bomErr } = await sb
    .from("m_bom")
    .select("id, nama_resep")
    .eq("product_id", productId)
    .eq("status_aktif", true)
    .maybeSingle();

  console.log("CALC-BOM", { bom, bomErr: bomErr?.message ?? null });

  const { data: bomNoStatus } = await sb
    .from("m_bom")
    .select("id, product_id, status_aktif")
    .eq("product_id", productId)
    .maybeSingle();
  console.log("CALC-BOM-NOSTATUS", { bomNoStatus });

  if (bomErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil resep (BOM).", 500, bomErr.message);
  }
  if (!bom) {
    return ok({ items: [] }, "Produk ini belum memiliki resep (BOM) aktif.");
  }

  // Ambil detail bahan baku resep
  const { data: items, error: itemsErr } = await sb
    .from("t_bom_item")
    .select("bahan_baku_id, qty_per_unit, m_bahan_baku(kode_bahan, nama_bahan, satuan)")
    .eq("bom_id", bom.id)
    .order("created_at", { ascending: true });

  if (itemsErr) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil item resep (BOM).", 500, itemsErr.message);
  }

  const result = (items ?? []).map((item: any) => ({
    bahan_baku_id: item.bahan_baku_id,
    kode_bahan: item.m_bahan_baku?.kode_bahan ?? null,
    nama_bahan: item.m_bahan_baku?.nama_bahan ?? null,
    satuan: item.m_bahan_baku?.satuan ?? null,
    qty_per_unit: Number(item.qty_per_unit),
    jumlah: Number(item.qty_per_unit) * quantity,
  }));

  return ok({ items: result });
}
