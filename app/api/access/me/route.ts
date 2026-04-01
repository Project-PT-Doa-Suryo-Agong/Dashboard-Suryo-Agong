import { ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { getClustersForLevel } from "@/lib/access/policy";
import { NextResponse } from "next/server";

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
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const status =
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      [400, 404, 500].includes((error as { status: number }).status)
        ? (error as { status: number }).status
        : 500;

    return NextResponse.json(
      { success: false, error: { message } },
      { status }
    );
  }
}
