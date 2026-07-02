"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/utils/api-fetch";
import type { ApiError, ApiSuccess } from "@/types/api";
import type { MBahanBaku, TStokMutasi } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type BahanBakuListPayload = {
  bahan_baku: MBahanBaku[];
  meta: QueryMeta;
};

type MutasiListPayload = {
  mutasi: (TStokMutasi & {
    m_bahan_baku?: { kode_bahan: string; nama_bahan: string; satuan: string } | null;
  })[];
  meta: QueryMeta;
};

type TrackingListPayload = {
  tracking: (TStokMutasi & {
    m_bahan_baku?: { kode_bahan: string; nama_bahan: string; satuan: string } | null;
    t_produksi_order?: { produksi_number: string | null } | null;
  })[];
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

// ─── useBahanBaku ──────────────────────────────────────────────────────────

export function useBahanBaku(options?: UseTableOptions & { search?: string; statusAktif?: boolean }) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 200;
  const search = options?.search ?? "";
  const statusAktif = options?.statusAktif;

  const [data, setData] = useState<MBahanBaku[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/production/bahan-baku?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusAktif !== undefined) url += `&status_aktif=${statusAktif}`;

      const response = await apiFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<BahanBakuListPayload>(response);
      setData(payload.data.bahan_baku ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data bahan baku.");
      setData([]);
      setMeta({ page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusAktif]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, meta, refresh }), [data, loading, error, meta, refresh]);
}

// ─── useInsertBahanBaku ──────────────────────────────────────────────────────

export function useInsertBahanBaku() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/production/bahan-baku", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ bahan_baku: MBahanBaku }>(response);
      return payload.data.bahan_baku;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah bahan baku.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

// ─── useUpdateBahanBaku ──────────────────────────────────────────────────────

export function useUpdateBahanBaku() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(async (id: string, input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID bahan baku tidak valid.");
      }
      const response = await apiFetch(`/api/production/bahan-baku/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ bahan_baku: MBahanBaku }>(response);
      return payload.data.bahan_baku;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengupdate bahan baku.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

// ─── useDeleteBahanBaku ──────────────────────────────────────────────────────

export function useDeleteBahanBaku() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!id || typeof id !== "string") {
        throw new Error("ID bahan baku tidak valid.");
      }
      const response = await apiFetch(`/api/production/bahan-baku/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      await parseJsonResponse<null>(response);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus bahan baku.");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { remove, loading, error };
}

// ─── useMutasiStok ───────────────────────────────────────────────────────────

export function useMutasiStok(options?: UseTableOptions & { bahanBakuId?: string; tipe?: string }) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const bahanBakuId = options?.bahanBakuId ?? "";
  const tipe = options?.tipe ?? "";

  const [data, setData] = useState<MutasiListPayload["mutasi"]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/production/bahan-baku/mutasi?page=${page}&limit=${limit}`;
      if (bahanBakuId) url += `&bahan_baku_id=${bahanBakuId}`;
      if (tipe) url += `&tipe=${tipe}`;

      const response = await apiFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<MutasiListPayload>(response);
      setData(payload.data.mutasi ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat mutasi stok.");
      setData([]);
      setMeta({ page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, bahanBakuId, tipe]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, meta, refresh }), [data, loading, error, meta, refresh]);
}

// ─── useInsertMutasiStok ──────────────────────────────────────────────────────

export function useInsertMutasiStok() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(async (input: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/production/bahan-baku/mutasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await parseJsonResponse<{ mutasi: TStokMutasi }>(response);
      return payload.data.mutasi;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses mutasi stok.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { insert, loading, error };
}

// ─── useTrackingBahanBaku ─────────────────────────────────────────────────────

export function useTrackingBahanBaku(options?: UseTableOptions & { search?: string }) {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 50;
  const search = options?.search ?? "";

  const [data, setData] = useState<TrackingListPayload["tracking"]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<QueryMeta>({ page, limit, total: 0 });
  const [refreshSeed, setRefreshSeed] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/production/bahan-baku/tracking?page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const response = await apiFetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const payload = await parseJsonResponse<TrackingListPayload>(response);
      setData(payload.data.tracking ?? []);
      setMeta(payload.data.meta ?? { page, limit, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat tracking bahan baku.");
      setData([]);
      setMeta({ page, limit, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshSeed]);

  const refresh = useCallback(() => {
    setRefreshSeed((prev) => prev + 1);
  }, []);

  return useMemo(() => ({ data, loading, error, meta, refresh }), [data, loading, error, meta, refresh]);
}
