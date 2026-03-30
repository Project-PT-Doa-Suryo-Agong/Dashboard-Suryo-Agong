import { ok } from "@/lib/http/response";
import { MENU_CATALOG } from "@/lib/access/catalog";
import { LEVEL_CLUSTERS } from "@/lib/access/policy";

export async function GET() {
  return ok({
    levels: LEVEL_CLUSTERS,
    clusters: MENU_CATALOG,
  });
}
