import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

export const runtime = "nodejs";

function hr(client: Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>) {
  return (client as any).schema("hr") as any;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const { data, error } = await hr(auth.ctx.supabase).from("t_pkwt").select("*").eq("id", id).maybeSingle();
    if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil detail kontrak.", 500, error.message);
    if (!data) return fail(ErrorCode.NOT_FOUND, "Riwayat kontrak tidak ditemukan.", 404);
    return ok({ pkwt: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal mengambil detail kontrak.", 500, message);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLevel("strategic", "managerial");
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const { error, count } = await hr(auth.ctx.supabase).from("t_pkwt").delete({ count: "exact" }).eq("id", id);
    if (error) return fail(ErrorCode.DB_ERROR, "Gagal menghapus riwayat kontrak.", 500, error.message);
    if (!count || count === 0) return fail(ErrorCode.NOT_FOUND, "Riwayat kontrak tidak ditemukan.", 404);
    return ok(null, "Riwayat kontrak berhasil dihapus.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return fail(ErrorCode.DB_ERROR, "Gagal menghapus riwayat kontrak.", 500, message);
  }
}
