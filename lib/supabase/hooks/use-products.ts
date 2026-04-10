"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MProduk } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type ProductListPayload = {
  produk: MProduk[];
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

// ─── Products (core.m_produk) ──────────────────────────────────────────────────

/**
 * List all products with pagination & filtering.
 *
 * @example
 * const { data, loading, meta, refresh } = useProducts({ page: 1, limit: 50 });
 */
export function useProducts(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 200;

  const [data, setData] = useState<MProduk[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/core/products?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<ProductListPayload>(response);
      setData(payload.data.produk ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data produk.");
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
 * Fetch a single product by ID.
 */
export function useProduct(id: string | null) {
  const { data, loading, error, refresh } = useProducts({ page: 1, limit: 200 });
  const row = useMemo(() => (id ? data.find((item) => item.id === id) ?? null : null), [id, data]);
  return { data: row, loading, error, refresh };
}

/**
 * Insert a new product.
 *
 * @example
 * const { insert, loading, error } = useInsertProduct();
 * await insert({ nama_produk: "Kaos", kategori: "Pakaian" });
 */
export function useInsertProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/core/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ produk: MProduk }>(response);
      return payload.data.produk;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah produk.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

/**
 * Update an existing product.
 */
export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID produk tidak valid.");
      }
      const response = await apiFetch(`/api/core/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ produk: MProduk }>(response);
      return payload.data.produk;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal update produk.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Delete a product by ID.
 */
export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID produk tidak valid.");
      }
      const response = await apiFetch(`/api/core/products/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus produk.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}
