import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TStokMutasiInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const bahanBakuId = url.searchParams.get("bahan_baku_id");
  const tipeFilter = url.searchParams.get("tipe");

  const from = (page - 1) * limit;
  let query = (auth.ctx.supabase as any)
    .schema("production")
    .from("t_stok_mutasi")
    .select("*, m_bahan_baku(kode_bahan, nama_bahan, satuan)", { count: "exact" });

  if (bahanBakuId) {
    query = query.eq("bahan_baku_id", bahanBakuId);
  }

  if (tipeFilter && ["masuk", "keluar", "produksi"].includes(tipeFilter)) {
    query = query.eq("tipe", tipeFilter);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil data mutasi stok.", 500, error.message);
  }

  return ok({
    mutasi: data,
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
  
  const bahanBakuId = requireUUID(input, "bahan_baku_id");
  if (!bahanBakuId.ok) return fail(ErrorCode.VALIDATION_ERROR, bahanBakuId.message, 400);

  const tipe = requireString(input, "tipe");
  if (!tipe.ok) return fail(ErrorCode.VALIDATION_ERROR, tipe.message, 400);
  if (!["masuk", "keluar"].includes(tipe.data!)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Tipe mutasi harus 'masuk' atau 'keluar'.", 400);
  }

  const jumlah = requireNumber(input, "jumlah", { min: 0.0001 });
  if (!jumlah.ok) return fail(ErrorCode.VALIDATION_ERROR, jumlah.message, 400);

  const keterangan = requireString(input, "keterangan", { optional: true });
  if (!keterangan.ok) return fail(ErrorCode.VALIDATION_ERROR, keterangan.message, 400);

  const operator = requireString(input, "operator");
  if (!operator.ok) return fail(ErrorCode.VALIDATION_ERROR, operator.message, 400);

  // Payload creation
  const payload: TStokMutasiInsert = {
    bahan_baku_id: bahanBakuId.data!,
    tipe: tipe.data as TStokMutasiInsert["tipe"],
    jumlah: jumlah.data!,
    keterangan: keterangan.data,
    operator: operator.data!,
  };

  const { data: created, error: createError } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("t_stok_mutasi")
    .insert(payload)
    .select("*, m_bahan_baku(kode_bahan, nama_bahan, satuan)")
    .single();

  if (createError) {
    // Check if the error is from the check constraint (stock cannot be minus) or custom trigger exception
    if (createError.message.includes("m_bahan_baku_stok_check") || createError.message.includes("Stok bahan baku tidak mencukupi") || createError.code === "23514") {
      return fail(ErrorCode.VALIDATION_ERROR, "Gagal memproses mutasi: Stok bahan baku tidak mencukupi (stok tidak boleh minus).", 400);
    }
    return fail(ErrorCode.DB_ERROR, "Gagal mencatat mutasi stok.", 500, createError.message);
  }

  return ok({ mutasi: created }, "Mutasi stok berhasil dicatat.", 201);
}
