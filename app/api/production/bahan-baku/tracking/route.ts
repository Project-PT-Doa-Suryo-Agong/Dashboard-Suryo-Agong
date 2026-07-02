import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const search = url.searchParams.get("search") || "";

  const from = (page - 1) * limit;

  // We query t_stok_mutasi for type 'produksi' and join the relation tables
  let query = (auth.ctx.supabase as any)
    .schema("production")
    .from("t_stok_mutasi")
    .select("*, m_bahan_baku(kode_bahan, nama_bahan, satuan), t_produksi_order(produksi_number)", { count: "exact" })
    .eq("tipe", "produksi");

  if (search) {
    // Filter based on raw material name or code or production number
    // PostgreSQL allows filtering linked tables using the joined selector if we use .or with nested fields,
    // but in Supabase client, filtering nested tables can be tricky. We can do search on m_bahan_baku.nama_bahan
    // or filter by production number. Let's do it cleanly:
    // query = query.or('nama_bahan.ilike.%...' or 'produksi_number.ilike.%...') on joined tables:
    // Actually, simple and robust filter:
    // If the database trigger or RPC stores "Alokasi Produksi PRD-XXXX" in keterangan, we can filter by search query on keterangan or nama_bahan!
    // Since we also join, we can do:
    query = query.or(`keterangan.ilike.%${search}%,operator.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil riwayat pelacakan bahan baku.", 500, error.message);
  }

  return ok({
    tracking: data,
    meta: {
      page,
      limit,
      total: count ?? 0,
    },
  });
}
