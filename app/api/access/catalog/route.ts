import { ok } from "@/lib/http/response";
import { MENU_CATALOG } from "@/lib/access/catalog";
import { LEVEL_CLUSTERS } from "@/lib/access/policy";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return ok({
      levels: LEVEL_CLUSTERS,
      clusters: MENU_CATALOG,
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
