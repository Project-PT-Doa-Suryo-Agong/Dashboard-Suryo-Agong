"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRow } from "@/lib/supabase/hooks";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MKaryawan } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type KaryawanListPayload = {
  karyawan: MKaryawan[];
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

// ─── Karyawan / Employees (hr.m_karyawan) ──────────────────────────────────────

/**
 * List all employees with pagination.
 *
 * @example
 * const { data, loading, meta, refresh } = useKaryawan({ page: 1, limit: 50 });
 */
export function useKaryawan(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 200;

  const [data, setData] = useState<MKaryawan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/hr/employees?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<KaryawanListPayload>(response);
      setData(payload.data.karyawan ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data karyawan.");
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
 * Fetch a single employee by ID.
 */
export function useKaryawanById(id: string | null) {
  return useRow<MKaryawan>("hr", "m_karyawan", id);
}

/**
 * Insert a new employee.
 */
export function useInsertKaryawan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ karyawan: MKaryawan }>(response);
      return payload.data.karyawan;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah karyawan.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

/**
 * Update an existing employee.
 */
export function useUpdateKaryawan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/hr/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ karyawan: MKaryawan }>(response);
      return payload.data.karyawan;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update karyawan.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Delete an employee by ID.
 */
export function useDeleteKaryawan() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/hr/employees/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus karyawan.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}
