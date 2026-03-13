import { ok } from "@/lib/http/response";

export async function GET() {
  return ok({
    service: "dashboard-suryo-agong-be",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
