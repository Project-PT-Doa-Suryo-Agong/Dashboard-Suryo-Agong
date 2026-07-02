import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireNumber, requireString } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const kodeBahan = requireString(input, "kode_bahan", { maxLen: 50, optional: true });
  if (!kodeBahan.ok) return fail(ErrorCode.VALIDATION_ERROR, kodeBahan.message, 400);
  
  const namaBahan = requireString(input, "nama_bahan", { maxLen: 120, optional: true });
  if (!namaBahan.ok) return fail(ErrorCode.VALIDATION_ERROR, namaBahan.message, 400);

  const kategori = requireString(input, "kategori", { maxLen: 100, optional: true });
  if (!kategori.ok) return fail(ErrorCode.VALIDATION_ERROR, kategori.message, 400);

  const satuan = requireString(input, "satuan", { maxLen: 50, optional: true });
  if (!satuan.ok) return fail(ErrorCode.VALIDATION_ERROR, satuan.message, 400);

  const minimumStok = requireNumber(input, "minimum_stok", { min: 0, optional: true });
  if (!minimumStok.ok) return fail(ErrorCode.VALIDATION_ERROR, minimumStok.message, 400);

  // We build update payload only with keys that are explicitly provided
  const payload: Record<string, any> = {};
  if (kodeBahan.data !== null) payload.kode_bahan = kodeBahan.data;
  if (namaBahan.data !== null) payload.nama_bahan = namaBahan.data;
  if (kategori.data !== null) payload.kategori = kategori.data;
  if (satuan.data !== null) payload.satuan = satuan.data;
  if (minimumStok.data !== null) payload.minimum_stok = minimumStok.data;
  if (input.status_aktif !== undefined) payload.status_aktif = Boolean(input.status_aktif);

  payload.updated_at = new Date().toISOString();

  // If updating kode_bahan, make sure it's unique
  if (payload.kode_bahan) {
    const { data: existing, error: checkError } = await (auth.ctx.supabase as any)
      .schema("production")
      .from("m_bahan_baku")
      .select("id")
      .eq("kode_bahan", payload.kode_bahan)
      .neq("id", id)
      .maybeSingle();

    if (checkError) {
      return fail(ErrorCode.DB_ERROR, "Gagal memvalidasi kode bahan baku.", 500, checkError.message);
    }
    if (existing) {
      return fail(ErrorCode.ALREADY_EXISTS, `Bahan baku dengan kode '${payload.kode_bahan}' sudah digunakan oleh data lain.`, 409);
    }
  }

  const { data: updated, error: updateError } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bahan_baku")
    .update(payload)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError) {
    return fail(ErrorCode.DB_ERROR, "Gagal mengupdate bahan baku.", 500, updateError.message);
  }
  if (!updated) {
    return fail(ErrorCode.NOT_FOUND, "Bahan baku tidak ditemukan.", 404);
  }

  return ok({ bahan_baku: updated }, "Bahan baku berhasil diupdate.");
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { error, count } = await (auth.ctx.supabase as any)
    .schema("production")
    .from("m_bahan_baku")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    // Check for foreign key constraint violation
    if (error.code === "23503") {
      return fail(
        ErrorCode.DB_ERROR,
        "Tidak dapat menghapus bahan baku karena sedang digunakan dalam pesanan produksi atau memiliki riwayat mutasi stok.",
        400,
        error.message
      );
    }
    return fail(ErrorCode.DB_ERROR, "Gagal menghapus bahan baku.", 500, error.message);
  }

  if (count === 0) {
    return fail(ErrorCode.NOT_FOUND, "Bahan baku tidak ditemukan.", 404);
  }

  return ok(null, "Bahan baku berhasil dihapus.");
}
