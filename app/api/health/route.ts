import { fail, ok } from "@/lib/http/response";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET() {
  try {
    return ok({
      service: "dashboard-suryo-agung-frontend",
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return fail(
      ErrorCode.INTERNAL_ERROR,
      error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
      503
    );
  }
}
