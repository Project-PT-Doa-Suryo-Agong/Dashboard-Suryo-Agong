import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchApi } from "@/lib/http/client";
import type { MVendor } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type QueryResult<T> = {
  data: T[];
  loading: boolean;
  error: string | null;
  meta: QueryMeta;
  refresh: () => void;
};

type MutationResult = {
  loading: boolean;
  error: string | null;
};

// ─── Vendors (core.m_vendor) ───────────────────────────────────────────────────

/**
 * List all vendors with pagination.
 *
 * @example
 * const { data, loading, meta, refresh } = useVendors({ page: 1, limit: 50 });
 */
export function useVendors(options?: UseTableOptions) {
  const { page = 1, limit = 200, enabled = true } = options ?? {};

  const [data, setData] = useState<MVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(0);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetchApi<{ vendor: MVendor[]; meta?: QueryMeta }>(
        `/api/core/vendors?page=${page}&limit=${limit}`,
      );
      setData(res.vendor ?? []);
      setTotal(res.meta?.total ?? (res.vendor?.length ?? 0));
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(err instanceof Error ? err.message : "Gagal memuat vendor.");
    } finally {
      setLoading(false);
    }
  }, [enabled, page, limit]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshRef.current]);

  const refresh = useCallback(() => {
    refreshRef.current += 1;
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    meta: { page, limit, total },
    refresh,
  } as QueryResult<MVendor>;
}

/**
 * Fetch a single vendor by ID.
 */
export function useVendor(id: string | null) {
  const { data, loading, error } = useVendors({ enabled: Boolean(id), limit: 200 });
  const row = useMemo(() => {
    if (!id) return null;
    return data.find((item) => item.id === id) ?? null;
  }, [data, id]);

  return { data: row, loading, error };
}

/**
 * Insert a new vendor.
 */
export function useInsertVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>): Promise<MVendor | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ vendor: MVendor }>("/api/core/vendors", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return res.vendor ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat vendor.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error } as MutationResult & {
    insert: (input: Record<string, unknown>) => Promise<MVendor | null>;
  };
}

/**
 * Update an existing vendor.
 */
export function useUpdateVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>): Promise<MVendor | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchApi<{ vendor: MVendor }>(`/api/core/vendors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return res.vendor ?? null;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update vendor.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error } as MutationResult & {
    update: (id: string, input: Record<string, unknown>) => Promise<MVendor | null>;
  };
}

/**
 * Delete a vendor by ID.
 */
export function useDeleteVendor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await fetchApi<null>(`/api/core/vendors/${id}`, { method: "DELETE" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus vendor.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error } as MutationResult & {
    remove: (id: string) => Promise<boolean>;
  };
}
