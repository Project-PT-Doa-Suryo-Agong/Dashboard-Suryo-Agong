import { fail, ok } from "@/lib/http/response";
import { MENU_CATALOG } from "@/lib/access/catalog";
import { LEVEL_CLUSTERS } from "@/lib/access/policy";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET() {
  try {
    return ok({
      levels: LEVEL_CLUSTERS,
      clusters: MENU_CATALOG,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal server.";
    return fail(ErrorCode.INTERNAL_ERROR, message, 500);
  }
}
