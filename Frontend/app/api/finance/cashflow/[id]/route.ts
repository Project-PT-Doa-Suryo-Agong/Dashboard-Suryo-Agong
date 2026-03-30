import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateCashflow, deleteCashflow } from "@/lib/services/finance.service";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("BAD_REQUEST", "Body harus JSON valid.", 400);
  }

  const { data, error } = await updateCashflow(auth.ctx.supabase, id, body as Record<string, unknown>);
  if (error) return fail("DB_ERROR", "Gagal update cashflow.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Cashflow tidak ditemukan.", 404);
  return ok({ cashflow: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteCashflow(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus cashflow.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Cashflow tidak ditemukan.", 404);
  return ok(null, "Cashflow berhasil dihapus.");
}
