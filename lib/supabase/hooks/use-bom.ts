"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MBom } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

export type BomListItem = MBom & {
  m_produk?: { nama_produk: string | null; kategori: string | null } | null;
  t_bom_item?: { id: string }[] | null;
};

export type BomDetailItem = MBom & {
  m_produk?: { nama_produk: string | null; kategori: string | null } | null;
};

export type BomDetailItemRow = {
  id: string;
  bahan_baku_id: string;
  qty_per_unit: number;
  m_bahan_baku?: { kode_bahan: string; nama_bahan: string; satuan: string } | null;
};

export type BomCalculateItem = {
  bahan_baku_id: string;
  kode_bahan: string | null;
  nama_bahan: string | null;
  satuan: string | null;
  qty_per_unit: number;
  jumlah: number;
};

type BomListPayload = {
  bom: BomListItem[];
  meta: QueryMeta;
};

type BomDetailPayload = {
  bom: BomDetailItem | null;
  items: BomDetailItemRow[];
};

type BomCalculatePayload = {
  items: BomCalculateItem[];
};

async function parseJsonResponse<T>(response: Response): Promise<ApiSuccess<T>> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !payload.success) {
    const message = payload.success ? "Terjadi kesalahan." : payload.error.message;
    throw new Error(message);
  }
  return payload;
}

// ─── useBom ──────────────────────────────────────────────────────────────────

export function useBom(options?: UseTableOptions) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 100;

  const [data, setData] = useState<BomListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/production/bom?page=${page}&limit=${limit}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<BomListPayload>(response);
      setData(payload.data.bom ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data BOM.");
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

// ─── useBomDetail ────────────────────────────────────────────────────────────

export function useBomDetail(id: string | null) {
  const [data, setData] = useState<{ bom: BomDetailItem | null; items: BomDetailItemRow[] }>({ bom: null, items: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async (overrideId?: string) => {
    const targetId = overrideId ?? id;
    if (!targetId) return { bom: null as BomDetailItem | null, items: [] as BomDetailItemRow[] };
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`/api/production/bom/${targetId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<BomDetailPayload>(response);
      const result = { bom: payload.data.bom ?? null, items: payload.data.items ?? [] };
      setData(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat detail BOM.");
      return { bom: null as BomDetailItem | null, items: [] as BomDetailItemRow[] };
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { data, loading, error, refresh: fetchDetail };
}

// ─── useInsertBom ────────────────────────────────────────────────────────────

export function useInsertBom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/production/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ bom: MBom }>(response);
      return payload.data.bom;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah resep (BOM).");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

// ─── useUpdateBom ────────────────────────────────────────────────────────────

export function useUpdateBom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID BOM tidak valid.");
      }
      const response = await apiFetch(`/api/production/bom/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ bom: MBom }>(response);
      return payload.data.bom;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate resep (BOM).");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

// ─── useDeleteBom ────────────────────────────────────────────────────────────

export function useDeleteBom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID BOM tidak valid.");
      }
      const response = await apiFetch(`/api/production/bom/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus resep (BOM).");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

// ─── useCalculateBom ─────────────────────────────────────────────────────────

export function useCalculateBom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (productId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!productId) {
        throw new Error("Produk belum dipilih.");
      }
      if (Number.isNaN(quantity) || quantity <= 0) {
        throw new Error("Quantity harus angka lebih dari 0.");
      }
      const response = await apiFetch(
        `/api/production/bom/calculate?product_id=${encodeURIComponent(productId)}&quantity=${encodeURIComponent(String(quantity))}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );
      const payload = await parseJsonResponse<BomCalculatePayload>(response);
      return payload.data.items ?? [];
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghitung kebutuhan bahan baku.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculate, loading, error };
}
