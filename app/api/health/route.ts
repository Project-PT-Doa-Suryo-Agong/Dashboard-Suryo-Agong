import { ok } from "@/lib/http/response";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return ok({
      service: "dashboard-suryo-agung-frontend",
      status: "ok",
      timestamp: new Date().toISOString(),
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
