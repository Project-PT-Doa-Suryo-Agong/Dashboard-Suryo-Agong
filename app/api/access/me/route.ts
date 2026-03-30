import { ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { getClustersForLevel } from "@/lib/access/policy";

export async function GET() {
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
}
