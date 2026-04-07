import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createVendor, listVendor } from "@/lib/services/core.service";
import { requireString } from "@/lib/validation/body-validator";
import type { MVendorInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listVendor(auth.ctx.supabase, page, limit);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil daftar vendor.", 500, error.message);
  return ok({ vendor: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational", "support");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const namaVendor = requireString(input, "nama_vendor", { maxLen: 120, optional: true });
  if (!namaVendor.ok) return fail(ErrorCode.VALIDATION_ERROR, namaVendor.message, 400);
  const kontak = requireString(input, "kontak", { maxLen: 120, optional: true });
  if (!kontak.ok) return fail(ErrorCode.VALIDATION_ERROR, kontak.message, 400);

  if (!("nama_vendor" in input) && !("kontak" in input)) {
    return fail(ErrorCode.VALIDATION_ERROR, "Minimal satu field vendor harus diisi.", 400);
  }

  const payload: MVendorInsert = {
    ...input,
    nama_vendor: namaVendor.data,
    kontak: kontak.data,
  };

  const { data, error } = await createVendor(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal membuat vendor.", 500, error.message);
  return ok({ vendor: data }, "Vendor berhasil dibuat.", 201);
}