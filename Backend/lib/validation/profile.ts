import type { UpdateOwnProfileInput } from "@/types/profile";

export function parseUpdateOwnProfileInput(payload: unknown): {
  ok: true;
  data: UpdateOwnProfileInput;
} | {
  ok: false;
  message: string;
} {
  if (!payload || typeof payload !== "object") {
    return { ok: false, message: "Body request harus berupa object JSON." };
  }

  const body = payload as Record<string, unknown>;
  const parsed: UpdateOwnProfileInput = {};

  if ("nama" in body) {
    const value = body.nama;
    if (value !== null && typeof value !== "string") {
      return { ok: false, message: "nama harus string atau null." };
    }
    if (typeof value === "string" && value.trim().length > 120) {
      return { ok: false, message: "nama maksimal 120 karakter." };
    }
    parsed.nama = typeof value === "string" ? value.trim() : null;
  }

  if ("phone" in body) {
    const value = body.phone;
    if (value !== null && typeof value !== "string") {
      return { ok: false, message: "phone harus string atau null." };
    }
    if (typeof value === "string" && value.trim().length > 50) {
      return { ok: false, message: "phone maksimal 50 karakter." };
    }
    parsed.phone = typeof value === "string" ? value.trim() : null;
  }

  if (Object.keys(parsed).length === 0) {
    return { ok: false, message: "Tidak ada field yang dapat diupdate." };
  }

  return { ok: true, data: parsed };
}
