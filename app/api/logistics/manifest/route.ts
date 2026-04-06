import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createManifest, listManifest } from "@/lib/services/logistics.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listManifest(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data manifest.", 500, error.message);
  return ok({ manifest: data, meta });
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
  if (!input.order_id) {
    return fail("VALIDATION_ERROR", "order_id wajib diisi.", 400);
  }
  if (!input.resi || typeof input.resi !== "string" || !input.resi.trim()) {
    return fail("VALIDATION_ERROR", "resi wajib diisi.", 400);
  }

  const { data, error } = await createManifest(auth.ctx.supabase, {
    ...input,
    resi: (input.resi as string).trim(),
  });
  if (error) return fail("DB_ERROR", "Gagal membuat manifest.", 500, error.message);
  return ok({ manifest: data }, "Manifest berhasil dibuat.", 201);
}
