import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { ErrorCode } from "@/lib/http/error-codes";

const DEPRECATED_MESSAGE = "Endpoint /api/finance/reimbursement sudah deprecated. Gunakan /api/finance/reimburse.";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  return fail(ErrorCode.DEPRECATED_ENDPOINT, DEPRECATED_MESSAGE, 410);
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;
  return fail(ErrorCode.DEPRECATED_ENDPOINT, DEPRECATED_MESSAGE, 410);
}
