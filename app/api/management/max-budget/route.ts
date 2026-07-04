import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { requireNumber } from "@/lib/validation/body-validator";
import { ErrorCode } from "@/lib/http/error-codes";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { TMaxBudget } from "@/types/supabase";

export async function GET() {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const { data, error } = await supabaseAdmin
    .schema("management")
    .from("t_max_budget")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data max budget.", 500, error.message);
  return ok({ max_budget: (data as TMaxBudget) ?? null });
}

export async function PUT(request: Request) {
  const auth = await requireLevel("strategic");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try { body = await request.json(); } catch { return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400); }

  const input = body as Record<string, unknown>;
  const maxAmount = requireNumber(input, "max_amount", { min: 0 });
  if (!maxAmount.ok) return fail(ErrorCode.VALIDATION_ERROR, maxAmount.message, 400);

  const { data, error } = await supabaseAdmin.rpc("set_max_budget", {
    p_amount: maxAmount.data,
    p_updated_by: auth.ctx.userId,
  });

  if (error) return fail(ErrorCode.DB_ERROR, "Gagal menyimpan max budget.", 500, error.message);
  return ok({ max_budget: data as TMaxBudget }, "Max budget berhasil disimpan.");
}
