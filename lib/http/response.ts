import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/types/api";

export function ok<T>(data: T, message?: string, status = 200) {
  const payload: ApiSuccess<T> = { success: true, data, message };
  return NextResponse.json(payload, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  const payload: ApiError = {
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === "production" ? undefined : details,
    },
  };

  return NextResponse.json(payload, { status });
}
