"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { TAttendance } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type AttendanceListPayload = {
  attendance: TAttendance[];
  meta: QueryMeta;
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

// ─── Attendance (hr.t_attendance) ──────────────────────────────────────────────

/**
 * List attendance records with optional employee_id filter.
 *
 * @example
 * const { data, loading, refresh } = useAttendance({
 *   limit: 500,
 *   filters: [["employee_id", "some-uuid"]],
 * });
 */
export function useAttendance(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 500;

  const [data, setData] = useState<TAttendance[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/hr/attendance?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<AttendanceListPayload>(response);
      setData(payload.data.attendance ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data attendance.");
      setData([]);
      setMeta({ page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  return useMemo(
    () => ({ data, loading, error, meta, refresh }),
    [data, loading, error, meta, refresh],
  );
}

/**
 * Insert a new attendance record.
 */
export function useInsertAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ attendance: TAttendance }>(response);
      return payload.data.attendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah attendance.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

/**
 * Update an attendance record.
 */
export function useUpdateAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID attendance tidak valid.");
      }
      const response = await apiFetch(`/api/hr/attendance/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ attendance: TAttendance }>(response);
      return payload.data.attendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update attendance.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateByIdentity = useCallback(async (
    source: { source_employee_id: string; source_tanggal: string },
    input: Record<string, unknown>,
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (!source.source_employee_id || !source.source_tanggal) {
        throw new Error("Identitas data attendance tidak lengkap.");
      }
      const response = await apiFetch("/api/hr/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...source,
          ...input,
        }),
      });
      const payload = await parseJsonResponse<{ attendance: TAttendance }>(response);
      return payload.data.attendance;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update attendance.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, updateByIdentity, loading, error };
}

/**
 * Delete an attendance record.
 */
export function useDeleteAttendance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID attendance tidak valid.");
      }
      const response = await apiFetch(`/api/hr/attendance/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus attendance.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeByIdentity = useCallback(async (source: { source_employee_id: string; source_tanggal: string }) => {
    setLoading(true);
    setError(null);
    try {
      if (!source.source_employee_id || !source.source_tanggal) {
        throw new Error("Identitas data attendance tidak lengkap.");
      }
      const response = await apiFetch(`/api/hr/attendance`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(source),
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus attendance.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, removeByIdentity, loading, error };
}
