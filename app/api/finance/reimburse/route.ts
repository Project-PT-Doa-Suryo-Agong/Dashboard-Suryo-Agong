import { fail, ok } from "@/lib/http/response";
import { requireLevel } from "@/lib/guards/auth.guard";
import { listReimbursement, createReimbursement } from "@/lib/services/finance.service";
import { requireNumber, requireString, requireUUID } from "@/lib/validation/body-validator";
import type { TReimbursementInsert } from "@/types/supabase";
import { ErrorCode } from "@/lib/http/error-codes";

export async function GET(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const employeeId = url.searchParams.get("employee_id") ?? undefined;

  const { data, error, meta } = await listReimbursement(auth.ctx.supabase, page, limit, employeeId);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengambil data reimburse.", 500, error.message);

  const reimbursements = data ?? [];
  const buktiPaths = Array.from(
    new Set(
      reimbursements
        .map((item) => item.bukti)
        .filter(
          (path): path is string =>
            typeof path === "string" && path.trim().length > 0 && !/^https?:\/\//i.test(path),
        ),
    ),
  );

  const signedUrlByPath: Record<string, string> = {};
  if (buktiPaths.length > 0) {
    const { data: signedUrls, error: signedError } = await auth.ctx.supabase.storage
      .from("reimbursements")
      .createSignedUrls(buktiPaths, 60 * 60);

    if (signedError) {
      return fail(ErrorCode.DB_ERROR, "Gagal membuat signed URL bukti reimburse.", 500, signedError.message);
    }

    for (const item of signedUrls ?? []) {
      if (item.path && item.signedUrl) {
        signedUrlByPath[item.path] = item.signedUrl;
      }
    }
  }

  const enriched = reimbursements.map((item) => {
    const rawPath = item.bukti;
    const buktiUrl =
      typeof rawPath === "string" && rawPath.length > 0
        ? /^https?:\/\//i.test(rawPath)
          ? rawPath
          : signedUrlByPath[rawPath] ?? null
        : null;

    return {
      ...item,
      bukti_url: buktiUrl,
    };
  });

  return ok({ reimburse: enriched, meta });
}

export async function POST(request: Request) {
  const auth = await requireLevel("strategic", "managerial", "operational");
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(ErrorCode.INVALID_JSON, "Body harus JSON valid.", 400);
  }

  const input = body as Record<string, unknown>;
  const employeeId = requireUUID(input, "employee_id");
  if (!employeeId.ok) return fail(ErrorCode.VALIDATION_ERROR, employeeId.message, 400);
  const amount = requireNumber(input, "amount", { min: 0 });
  if (!amount.ok) return fail(ErrorCode.VALIDATION_ERROR, amount.message, 400);
  
  const bukti = requireString(input, "bukti", { optional: true });
  if (!bukti.ok) return fail(ErrorCode.VALIDATION_ERROR, bukti.message, 400);

  const status = requireString(input, "status", { optional: true });
  if (!status.ok) return fail(ErrorCode.VALIDATION_ERROR, status.message, 400);
  if (status.data && !["pending", "approved", "rejected"].includes(status.data as string)) {
    return fail(ErrorCode.VALIDATION_ERROR, "status harus pending, approved, atau rejected.", 400);
  }

  let finalBukti = bukti.data ?? null;

  if (finalBukti && finalBukti.startsWith("data:image")) {
    const matches = finalBukti.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");
      const ext = mimeType.split("/")[1] || "png";
      const fileName = `${employeeId.data}-${Date.now()}.${ext}`;

      const { error: uploadError } = await auth.ctx.supabase.storage
        .from("reimbursements")
        .upload(fileName, buffer, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        return fail(ErrorCode.DB_ERROR, "Gagal upload bukti reimburse ke storage.", 500, uploadError.message);
      }

      // Karena bucket tipe private, kita cukup simpan path/nama filenya di DB
      // supaya mudah degenerate URL-nya (signed url) di frontend
      finalBukti = fileName;
    }
  }

  const payload: TReimbursementInsert = {
    employee_id: employeeId.data,
    amount: amount.data,
    bukti: finalBukti,
    status: (status.data ?? "pending") as TReimbursementInsert["status"],
  };

  const { data, error } = await createReimbursement(auth.ctx.supabase, payload);
  if (error) return fail(ErrorCode.DB_ERROR, "Gagal mengajukan reimburse.", 500, error.message);
  return ok({ reimburse: data }, "Reimburse berhasil diajukan.", 201);
}
