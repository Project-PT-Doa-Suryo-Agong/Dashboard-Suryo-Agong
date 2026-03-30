import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listKaryawan, createKaryawan } from "@/lib/services/hr.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);

  const { data, error, meta } = await listKaryawan(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data karyawan.", 500, error.message);
  return ok({ karyawan: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (!input.nama || typeof input.nama !== "string") {
    return fail("VALIDATION_ERROR", "nama wajib diisi.", 400);
  }

  const { data, error } = await createKaryawan(auth.ctx.supabase, input);
  if (error) return fail("DB_ERROR", "Gagal menambah karyawan.", 500, error.message);
  return ok({ karyawan: data }, "Karyawan berhasil ditambahkan.", 201);
}
