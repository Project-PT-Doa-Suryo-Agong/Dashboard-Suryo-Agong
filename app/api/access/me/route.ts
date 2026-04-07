import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { getClustersForLevel } from "@/lib/access/policy";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;
    const access = {
      level: auth.ctx.accessLevel,
      jabatan: auth.ctx.jabatan,
      division: auth.ctx.division,
      clusters: getClustersForLevel(auth.ctx.accessLevel),
    };

    return ok({
      userId: auth.ctx.userId,
      role: auth.ctx.role,
      access,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return fail(ErrorCode.INTERNAL_ERROR, message, 500);
  }
}
