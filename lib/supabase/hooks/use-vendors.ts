"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MVendor } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type VendorListPayload = {
  vendor: MVendor[];
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

// ─── Vendors (core.m_vendor) ───────────────────────────────────────────────────

/**
 * List all vendors with pagination.
 *
 * @example
 * const { data, loading, meta, refresh } = useVendors({ page: 1, limit: 50 });
 */
export function useVendors(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 200;

  const [data, setData] = useState<MVendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/core/vendors?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VendorListPayload>(response);
      setData(payload.data.vendor ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data vendor.");
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

  return useMemo(() => ({ data, loading, error, meta, refresh }), [data, loading, error, meta, refresh]);
}

/**
 * Fetch a single vendor by ID.
 */
export function useVendor(id: string | null) {
  const { data, loading, error, refresh } = useVendors({ page: 1, limit: 200 });
  const row = useMemo(() => (id ? data.find((item) => item.id === id) ?? null : null), [id, data]);
  return { data: row, loading, error, refresh };
}

/**
 * Insert a new vendor.
 */
export function useInsertVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/core/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ vendor: MVendor }>(response);
      return payload.data.vendor;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah vendor.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

/**
 * Update an existing vendor.
 */
export function useUpdateVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID vendor tidak valid.");
      }
      const response = await apiFetch(`/api/core/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ vendor: MVendor }>(response);
      return payload.data.vendor;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update vendor.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Delete a vendor by ID.
 */
export function useDeleteVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID vendor tidak valid.");
      }
      const response = await apiFetch(`/api/core/vendors/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus vendor.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}
