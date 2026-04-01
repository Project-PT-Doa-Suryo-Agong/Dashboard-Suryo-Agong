import { fail, ok } from "@/lib/http/response";
import { requireAuth } from "@/lib/guards/auth.guard";
import { canAccessCluster, canAccessMenu } from "@/lib/access/policy";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (!auth.ok) return auth.response;

    const url = new URL(request.url);
    const cluster = (url.searchParams.get("cluster") ?? "").trim();
    const menu = (url.searchParams.get("menu") ?? "").trim();

    if (!cluster && !menu) {
      return fail(
        "VALIDATION_ERROR",
        "Minimal salah satu query wajib diisi: cluster atau menu.",
        400
      );
    }

    const accessLevel = auth.ctx.accessLevel;
    const clusterAllowed = cluster ? canAccessCluster(accessLevel, cluster) : null;
    const menuAllowed = menu ? canAccessMenu(accessLevel, menu) : null;

    return ok({
      level: accessLevel,
      jabatan: auth.ctx.jabatan,
      cluster,
      menu,
      allowed: {
        cluster: clusterAllowed,
        menu: menuAllowed,
        all: [clusterAllowed, menuAllowed]
          .filter((value): value is boolean => value !== null)
          .every(Boolean),
      },
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
