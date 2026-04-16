import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteReturnOrder, updateReturnOrder } from "@/lib/services/logistics.service";
import { requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";

const RETURN_BUKTI_BUCKET = "returns";

// ─── Bucket mapping (UI → semantic group) ────────────────────────────────────
// UI mengirim salah satu dari tiga nilai (dari <select> di page.tsx):
//   "pending" | "diproses" | "selesai"
// Kita petakan ke bucket semantik, lalu cari nilai enum aktual di DB.
type StatusBucket = "pending" | "process" | "done";

const UI_TO_BUCKET: Record<string, StatusBucket> = {
  // Nilai enum aktual di DB
  pending: "pending",
  inspected: "process",   // sudah diinspeksi (tahap proses)
  restocked: "done",     // barang dikembalikan ke stok
  rejected: "done",      // pengajuan ditolak (final)
  diproses: "process",
  selesai: "done",
  // Alias UI / legacy
  proses: "process",
  in_progress: "process",
  on_progress: "process",
  processing: "process",
  processed: "process",
  inprogress: "process",
  done: "done",
  finished: "done",
  completed: "done",
  returned: "done",
  resolved: "done",
  closed: "done",
};

function uiStatusToBucket(value: string | null | undefined): StatusBucket | null {
  if (!value) return null;
  return UI_TO_BUCKET[value.trim().toLowerCase()] ?? null;
}

// ─── Fetch actual enum values from pg_enum ────────────────────────────────────
// Cache in-memory sederhana supaya tidak query DB berulang kali per request.
let cachedEnumValues: string[] | null = null;

async function getActualReturnStatusEnumValues(): Promise<string[]> {
  if (cachedEnumValues !== null) return cachedEnumValues;

  // Primer: baca via RPC SQL function (jika sudah dibuat di Supabase)
  try {
    const { data, error } = await supabaseAdmin.rpc("get_return_status_enum_values");
    if (!error && Array.isArray(data) && data.length > 0) {
      cachedEnumValues = (data as string[]).map((v: string) => v.trim().toLowerCase());
      return cachedEnumValues;
    }
  } catch {
    // RPC belum ada — lanjut ke fallback
  }

  // Fallback: baca dari data yang sudah ada di tabel
  const { data: rows } = await supabaseAdmin
    .schema("logistics")
    .from("t_return_order")
    .select("status")
    .not("status", "is", null)
    .limit(500);

  const found = new Set<string>();
  for (const row of (rows ?? []) as Array<{ status?: string | null }>) {
    const s = row.status?.trim().toLowerCase();
    if (s) found.add(s);
  }
  cachedEnumValues = Array.from(found);
  return cachedEnumValues;
}

// Urutan preferensi per bucket: nilai pertama yang ditemukan di enum DB akan dipakai
const BUCKET_PREFERENCE: Record<StatusBucket, string[]> = {
  pending: ["pending"],
  process: ["diproses", "proses", "in_progress", "inspected", "processing", "on_progress"],
  done: ["selesai", "done", "finished", "completed", "restocked", "rejected"],
};

// Resolusi: cari nilai enum aktual yang sesuai dengan bucket semantik yang diminta.
// Mengembalikan null jika tidak ada nilai yang cocok.
async function resolveEnumValue(targetBucket: StatusBucket): Promise<string | null> {
  const enumValues = await getActualReturnStatusEnumValues();
  const enumSet = new Set(enumValues);

  // Coba preferensi per bucket secara berurutan
  for (const preferred of BUCKET_PREFERENCE[targetBucket]) {
    if (enumSet.has(preferred)) return preferred;
  }

  // Fallback: cari nilai manapun dalam bucket ini
  for (const v of enumValues) {
    if (UI_TO_BUCKET[v] === targetBucket) return v;
  }

  // Jika tabel masih kosong (tidak ada data sama sekali), gunakan default
  if (enumValues.length === 0) {
    return BUCKET_PREFERENCE[targetBucket][0] ?? null;
  }

  return null;
}

function isReturnStatusEnumError(error: { message?: string } | null | undefined): boolean {
  const message = (error?.message ?? "").toLowerCase();
  return message.includes("invalid input value for enum return_status");
}

function parseDataUrl(value: string): { mimeType: string; buffer: Buffer; ext: string } | null {
  const matches = value.match(/^data:([A-Za-z0-9.+/-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;

  const mimeType = matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1]?.toLowerCase() || "bin";
  return { mimeType, buffer, ext };
}

async function uploadReturnProofFromDataUrl(value: string, orderId: string): Promise<string> {
  const parsed = parseDataUrl(value);
  if (!parsed) return value;

  const fileName = `${orderId}-${Date.now()}.${parsed.ext}`;
  const { error } = await supabaseAdmin.storage
    .from(RETURN_BUKTI_BUCKET)
    .upload(fileName, parsed.buffer, {
      contentType: parsed.mimeType,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw new Error(`Gagal upload bukti retur ke storage: ${error.message}`);
  }

  return fileName;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

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

  // ── Validasi input ────────────────────────────────────────────────────────
  let resolvedStatusBucket: StatusBucket | null = null;

  if ("order_id" in input) {
    const orderId = requireUUID(input, "order_id", { optional: true });
    if (!orderId.ok) return fail(ErrorCode.VALIDATION_ERROR, orderId.message, 400);
  }
  if ("alasan" in input) {
    const alasan = requireString(input, "alasan", { maxLen: 255 });
    if (!alasan.ok) return fail(ErrorCode.VALIDATION_ERROR, alasan.message, 400);
  }
  if ("status" in input) {
    const status = requireString(input, "status", { optional: true });
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (status.data !== null) {
      resolvedStatusBucket = uiStatusToBucket(status.data);
      if (!resolvedStatusBucket) {
        return fail(
          ErrorCode.VALIDATION_ERROR,
          "status harus pending, diproses, atau selesai.",
          400,
        );
      }
    }
  }
  if ("foto_bukti_url" in input) {
    const fotoBuktiUrl = requireString(input, "foto_bukti_url", { optional: true });
    if (!fotoBuktiUrl.ok) return fail(ErrorCode.VALIDATION_ERROR, fotoBuktiUrl.message, 400);

    if (
      fotoBuktiUrl.data &&
      !fotoBuktiUrl.data.startsWith("data:") &&
      fotoBuktiUrl.data.length > 500
    ) {
      return fail(ErrorCode.VALIDATION_ERROR, "foto_bukti_url maksimal 500 karakter.", 400);
    }
  }
  if ("bukti" in input) {
    const buktiCompat = requireString(input, "bukti", { optional: true });
    if (!buktiCompat.ok) return fail(ErrorCode.VALIDATION_ERROR, buktiCompat.message, 400);

    if (
      buktiCompat.data &&
      !buktiCompat.data.startsWith("data:") &&
      buktiCompat.data.length > 500
    ) {
      return fail(ErrorCode.VALIDATION_ERROR, "bukti maksimal 500 karakter.", 400);
    }
  }

  // ── Susun payload ─────────────────────────────────────────────────────────
  const resolvedFotoBukti =
    typeof input.foto_bukti_url === "string"
      ? input.foto_bukti_url.trim() || null
      : typeof input.bukti === "string"
        ? input.bukti.trim() || null
        : undefined;

  const payload: Record<string, unknown> = {
    ...input,
    ...(typeof input.alasan === "string" ? { alasan: input.alasan.trim() } : {}),
    ...(resolvedFotoBukti !== undefined ? { foto_bukti_url: resolvedFotoBukti } : {}),
  };

  // Hapus field yang tidak perlu / akan di-handle khusus
  delete payload.bukti;
  delete payload.status; // Akan di-set setelah resolusi enum

  // ── Upload foto bukti (jika data URL) ────────────────────────────────────
  if (typeof payload.foto_bukti_url === "string" && payload.foto_bukti_url.startsWith("data:")) {
    const { data: existing } = await auth.ctx.supabase
      .schema("logistics")
      .from("t_return_order")
      .select("order_id, foto_bukti_url")
      .eq("id", id)
      .maybeSingle();

    const existingRow = existing as { order_id?: string; foto_bukti_url?: string } | null;
    const orderIdForFile = existingRow?.order_id ?? "return";
    const uploadedPath = await uploadReturnProofFromDataUrl(
      payload.foto_bukti_url as string,
      orderIdForFile,
    );
    payload.foto_bukti_url = uploadedPath;

    if (existingRow?.foto_bukti_url && existingRow.foto_bukti_url !== uploadedPath) {
      await supabaseAdmin.storage
        .from(RETURN_BUKTI_BUCKET)
        .remove([existingRow.foto_bukti_url]);
    }
  }

  // ── Resolusi status enum & tulis ke DB ───────────────────────────────────
  if (resolvedStatusBucket !== null) {
    // Dapatkan nilai enum aktual yang sesuai bucket dari database
    const resolvedStatus = await resolveEnumValue(resolvedStatusBucket);

    if (!resolvedStatus) {
      // Tidak ada nilai enum yang cocok — enum DB perlu dimigrasi
      return fail(
        ErrorCode.VALIDATION_ERROR,
        "Enum return_status di database tidak memiliki nilai yang sesuai. Hubungi administrator untuk menjalankan migrasi SQL.",
        400,
        `Tidak ditemukan nilai enum untuk status bucket "${resolvedStatusBucket}".`,
      );
    }

    payload.status = resolvedStatus;

    const { data, error } = await updateReturnOrder(auth.ctx.supabase, id, payload);
    if (!error) {
      if (!data) return fail(ErrorCode.NOT_FOUND, "Data retur tidak ditemukan.", 404);
      return ok({ return: data });
    }

    // Jika masih enum error, nilai yang di-resolve ternyata juga tidak valid
    // → invalidate cache agar request berikutnya refetch dari DB
    if (isReturnStatusEnumError(error)) {
      cachedEnumValues = null;
      return fail(
        ErrorCode.VALIDATION_ERROR,
        "Status retur tidak cocok dengan enum database pada environment ini.",
        400,
        error.message,
      );
    }

    return fail(ErrorCode.DB_ERROR, "Gagal update data retur.", 500, error.message);
  }

  // ── Tidak ada perubahan status — tulis payload biasa ─────────────────────
  const { data, error } = await updateReturnOrder(auth.ctx.supabase, id, payload);
  if (!error) {
    if (!data) return fail(ErrorCode.NOT_FOUND, "Data retur tidak ditemukan.", 404);
    return ok({ return: data });
  }
  return fail(ErrorCode.DB_ERROR, "Gagal update data retur.", 500, error.message);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteReturnOrder(auth.ctx.supabase, id);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus data retur.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data retur tidak ditemukan.", 404);
  return ok(null, "Data retur berhasil dihapus.");
}
