import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import type { MBahanBakuInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const search = url.searchParams.get("search") || "";
  const statusAktif = url.searchParams.get("status_aktif");

  const from = (page - 1) * limit;
  let query = (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bahan_baku")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`nama_bahan.ilike.%${search}%,kode_bahan.ilike.%${search}%`);
  }

  if (statusAktif === "true") {
    query = query.eq("status_aktif", true);
  } else if (statusAktif === "false") {
    query = query.eq("status_aktif", false);
  }

  const { data, error, count } = await query
    .order("kode_bahan", { ascending: true })
    .range(from, from + limit - 1);

  if (error) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar bahan baku.", 500, error.message);
  }

  return ok({
    bahan_baku: data,
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
  const kodeBahan = requireString(input, "kode_bahan", { maxLen: 50 });
  if (!kodeBahan.ok) return fail(ErrorCode.VALIDATION_ERROR, kodeBahan.message, 400);
  
  const namaBahan = requireString(input, "nama_bahan", { maxLen: 120 });
  if (!namaBahan.ok) return fail(ErrorCode.VALIDATION_ERROR, namaBahan.message, 400);

  const kategori = requireString(input, "kategori", { maxLen: 100, optional: true });
  if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);

  const satuan = requireString(input, "satuan", { maxLen: 50 });
  if (!satuan.ok) return fail(ErrorCode.VALIDATION_ERROR, satuan.message, 400);

  const minimumStok = requireNumber(input, "minimum_stok", { min: 0, optional: true });
  if (!minimumStok.ok) return fail(ErrorCode.VALIDATION_ERROR, minimumStok.message, 400);

  const statusAktif = input.status_aktif !== undefined ? Boolean(input.status_aktif) : true;

  // Check if kode_bahan already exists
  const { data: existing, error: checkError } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bahan_baku")
    .select("id")
    .eq("kode_bahan", kodeBahan.data!)
    .maybeSingle();

  if (checkError) {
    return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi kode bahan baku.", 500, checkError.message);
  }
  if (existing) {
    return fail(ErrorCode.ALREADY_EXISTS, `Bahan baku dengan kode '${kodeBahan.data}' sudah ada.`, 409);
  }

  const payload: MBahanBakuInsert = {
    kode_bahan: kodeBahan.data!,
    nama_bahan: namaBahan.data!,
    kategori: kategori.data,
    satuan: satuan.data!,
    stok: 0, // Master stok default starts at 0, mutasi should be used to add stock
    minimum_stok: minimumStok.data ?? 0,
    status_aktif: statusAktif,
  };

  const { data: created, error: createError } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bahan_baku")
    .insert(payload)
    .select("*")
    .single();

  if (createError) {
    return fail(ErrorCode.DB_ERROR, "Gagal membuat bahan baku.", 500, createError.message);
  }

  return ok({ bahan_baku: created }, "Bahan baku berhasil dibuat.", 201);
}
