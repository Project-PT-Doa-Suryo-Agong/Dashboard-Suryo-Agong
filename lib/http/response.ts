import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/types/api";
import { ErrorCode, HTTP_STATUS, type ErrorCode as ErrorCodeType } from "./error-codes";

export function ok<T>(data: T, message?: string, status = 200) {
  const payload: ApiSuccess<T> = {
    ok: true,
    success: true,
    data,
    message: message ?? null,
  };
  return NextResponse.json(payload, { status });
}

export function fail(
  code: ErrorCodeType,
  message: string,
  status?: number,
  details?: unknown
) {
  const resolvedStatus = status ?? HTTP_STATUS[code] ?? 500;
  const payload: ApiError = {
    ok: false,
    success: false,
    data: null,
    message,
    errorCode: code,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === "production" ? undefined : details,
    },
  };

  return NextResponse.json(payload, { status: resolvedStatus });
}

export { ErrorCode };
