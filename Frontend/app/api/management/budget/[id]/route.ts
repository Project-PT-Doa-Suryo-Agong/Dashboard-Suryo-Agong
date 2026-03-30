import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { updateBudgetRequest, deleteBudgetRequest } from "@/lib/services/management.service";

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

  const input = body as Record<string, unknown>;
  if (input.status !== undefined && input.status !== "pending" && input.status !== "approved" && input.status !== "rejected") {
    return fail("VALIDATION_ERROR", "status harus pending, approved, atau rejected.", 400);
  }

  const { data, error } = await updateBudgetRequest(auth.ctx.supabase, id, input);
  if (error) return fail("DB_ERROR", "Gagal update budget request.", 500, error.message);
  if (!data) return fail("NOT_FOUND", "Data budget request tidak ditemukan.", 404);
  return ok({ budget_request: data });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const { error, deleted } = await deleteBudgetRequest(auth.ctx.supabase, id);
  if (error) return fail("DB_ERROR", "Gagal hapus budget request.", 500, error.message);
  if (!deleted) return fail("NOT_FOUND", "Data budget request tidak ditemukan.", 404);
  return ok(null, "Budget request berhasil dihapus.");
}
