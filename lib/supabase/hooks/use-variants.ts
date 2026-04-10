"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MVarian } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type VariantListPayload = {
  varian: MVarian[];
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

// ─── Variants (core.m_varian) ──────────────────────────────────────────────────

/**
 * List all variants with optional product_id filter.
 *
 * @example
 * const { data, loading, refresh } = useVariants({ filters: [["product_id", productId]] });
 */
export function useVariants(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 200;
  const productId = options?.filters?.find(([col]) => col === "product_id")?.[1];

  const [data, setData] = useState<MVarian[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = productId ? `?product_id=${encodeURIComponent(productId)}` : "";
      const response = await apiFetch(`/api/core/variants${query}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<VariantListPayload>(response);
      const rows = payload.data.varian ?? [];
      setData(rows);
      setMeta({ page, limit, total: rows.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data varian.");
      setData([]);
      setMeta({ page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, productId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, meta, refresh }), [data, loading, error, meta, refresh]);
}

/**
 * Fetch a single variant by ID.
 */
export function useVariant(id: string | null) {
  const { data, loading, error, refresh } = useVariants({ page: 1, limit: 200 });
  const row = useMemo(() => (id ? data.find((item) => item.id === id) ?? null : null), [id, data]);
  return { data: row, loading, error, refresh };
}

/**
 * Insert a new variant.
 */
export function useInsertVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/core/variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ varian: MVarian }>(response);
      return payload.data.varian;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah varian.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

/**
 * Update an existing variant.
 */
export function useUpdateVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID varian tidak valid.");
      }
      const response = await apiFetch(`/api/core/variants/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ varian: MVarian }>(response);
      return payload.data.varian;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update varian.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Delete a variant by ID.
 */
export function useDeleteVariant() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID varian tidak valid.");
      }
      const response = await apiFetch(`/api/core/variants/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus varian.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}
