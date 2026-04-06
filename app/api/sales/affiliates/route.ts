import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createAfiliator, listAfiliator } from "@/lib/services/sales.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listAfiliator(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data affiliator.", 500, error.message);
  return ok({ afiliator: data, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  if (!input.nama || typeof input.nama !== "string" || !input.nama.trim()) {
    return fail("VALIDATION_ERROR", "nama wajib diisi.", 400);
  }

  const payload = {
    ...input,
    nama: (input.nama as string).trim(),
    platform: typeof input.platform === "string" ? input.platform.trim() || null : null,
  };

  const { data, error } = await createAfiliator(auth.ctx.supabase, payload);
  if (error) return fail("DB_ERROR", "Gagal membuat affiliator.", 500, error.message);
  return ok({ afiliator: data }, "Affiliator berhasil dibuat.", 201);
}
