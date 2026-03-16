import { ok } from "@/lib/http/response";

export async function GET() {
  return ok({
    service: "dashboard-suryo-agung-frontend",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
