import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { deleteKaryawan, updateKaryawan } from "@/lib/services/hr.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";

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

  const payload: Record<string, unknown> = {};

  if ("profile_id" in input) {
    const profileId = requireUUID(input, "profile_id", { optional: true });
    if (!profileId.ok) return fail(ErrorCode.VALIDATION_ERROR, profileId.message, 400);
    payload.profile_id = profileId.data;
  }

  if ("nama" in input) {
    const nama = requireString(input, "nama");
    if (!nama.ok || !nama.data) return fail(ErrorCode.VALIDATION_ERROR, nama.ok ? "nama wajib diisi." : nama.message, 400);
    payload.nama = nama.data;
  }

  if ("posisi" in input) {
    const posisi = requireString(input, "posisi", { optional: true });
    if (!posisi.ok) return fail(ErrorCode.VALIDATION_ERROR, posisi.message, 400);
    payload.posisi = posisi.data;
  }

  if ("divisi" in input) {
    const divisi = requireString(input, "divisi", { optional: true });
    if (!divisi.ok) return fail(ErrorCode.VALIDATION_ERROR, divisi.message, 400);
    payload.divisi = divisi.data;
  }

  if ("status" in input) {
    const status = requireString(input, "status", { optional: true });
    if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
    if (status.data && !["aktif", "nonaktif"].includes(status.data)) {
      return fail(ErrorCode.VALIDATION_ERROR, "status harus aktif atau nonaktif.", 400);
    }
    payload.status = status.data;
  }

  if ("gaji_pokok" in input) {
    const gajiPokok = requireNumber(input, "gaji_pokok", { min: 0, optional: true });
    if (!gajiPokok.ok) return fail(ErrorCode.VALIDATION_ERROR, gajiPokok.message, 400);
    payload.gaji_pokok = gajiPokok.data;
  }

  const optionalStringFields = [
    "nik",
    "alamat_domisili",
    "nomor_whatsapp",
    "email_pribadi",
    "foto_perorangan_url",
    "foto_ktp_url",
    "foto_kk_url",
    "pendidikan_terakhir",
    "jurusan",
    "pengalaman_kerja_sebelumnya",
    "keahlian_khusus",
    "motivasi_kerja",
  ];

  for (const field of optionalStringFields) {
    if (field in input) {
      const val = requireString(input, field, { optional: true });
      if (!val.ok) return fail(ErrorCode.VALIDATION_ERROR, val.message, 400);
      payload[field] = val.data;
    }
  }

  const { data, error } = await updateKaryawan(auth.ctx.supabase, id, payload);

  console.log("[HR ROUTE][employees][PATCH] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][employees][PATCH] role:", auth.ctx.role);
  console.log("[HR ROUTE][employees][PATCH] query result:", {
    id: data?.id ?? null,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal update karyawan.", 500, error.message);
  if (!data) return fail(ErrorCode.NOT_FOUND, "Data karyawan tidak ditemukan.", 404);
  return ok({ karyawan: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  if (!id) return fail(ErrorCode.VALIDATION_ERROR, "ID wajib diisi.", 400);

  const { error, deleted } = await deleteKaryawan(auth.ctx.supabase, id);

  console.log("[HR ROUTE][employees][DELETE] auth level:", auth.ctx.accessLevel);
  console.log("[HR ROUTE][employees][DELETE] role:", auth.ctx.role);
  console.log("[HR ROUTE][employees][DELETE] query result:", {
    deleted,
    hasError: Boolean(error),
    error: error?.message,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal hapus karyawan.", 500, error.message);
  if (!deleted) return fail(ErrorCode.NOT_FOUND, "Data karyawan tidak ditemukan.", 404);
  return ok(null, "Data karyawan berhasil dihapus.");
}
