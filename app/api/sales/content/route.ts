import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { createContentPlanner, listContentPlanner } from "@/lib/services/sales.service";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 500);

  const { data, error, meta } = await listContentPlanner(auth.ctx.supabase, page, limit);
  if (error) return fail("DB_ERROR", "Gagal mengambil data content planner.", 500, error.message);
  return ok({ content: data, meta });
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
  if (!input.judul || typeof input.judul !== "string" || !input.judul.trim()) {
    return fail("VALIDATION_ERROR", "judul wajib diisi.", 400);
  }
  if (!input.platform || typeof input.platform !== "string" || !input.platform.trim()) {
    return fail("VALIDATION_ERROR", "platform wajib diisi.", 400);
  }

  const { data, error } = await createContentPlanner(auth.ctx.supabase, {
    judul: (input.judul as string).trim(),
    platform: (input.platform as string).trim(),
  });
  if (error) return fail("DB_ERROR", "Gagal membuat content planner.", 500, error.message);
  return ok({ content: data }, "Content planner berhasil dibuat.", 201);
}
