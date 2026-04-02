"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type SchemaName = "core" | "hr" | "finance" | "production" | "logistics" | "sales" | "management";

type QueryMeta = {
  page: number;
  limit: number;
  total: number;
};

type QueryResult<T> = {
  /** Fetched rows */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error object if any */
  error: string | null;
  /** Pagination metadata */
  meta: QueryMeta;
  /** Force re-fetch */
  refresh: () => void;
};

type MutationResult = {
  /** True while mutation is in flight */
  loading: boolean;
  /** Error message if failed */
  error: string | null;
};

export type UseTableOptions = {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Column to order by */
  orderBy?: string;
  /** Ascending order? */
  ascending?: boolean;
  /** Additional filters as [column, value] pairs */
  filters?: Array<[string, string]>;
  /** If false, skip the initial fetch */
  enabled?: boolean;
};

// ─── List / Read Hook ─────────────────────────────────────────────────────────

/**
 * Generic hook to list rows from any table in any schema.
 *
 * @example
 * const { data, loading, meta, refresh } = useTable<MProduk>("core", "m_produk", {
 *   page: 1,
 *   limit: 20,
 *   orderBy: "created_at",
 *   ascending: false,
 * });
 */
export function useTable<T extends Record<string, unknown>>(
  schema: SchemaName,
  table: string,
  options: UseTableOptions = {}
): QueryResult<T> {
  const {
    page = 1,
    limit = 50,
    orderBy = "created_at",
    ascending = false,
    filters = [],
    enabled = true,
  } = options;

  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const refreshRef = useRef(0);

  const filtersKey = JSON.stringify(filters);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const from = (page - 1) * limit;
      const db = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema(schema);

      let query = db
        .from(table)
        .select("*", { count: "exact" })
        .order(orderBy, { ascending })
        .range(from, from + limit - 1);

      // Apply filters
      const parsedFilters = JSON.parse(filtersKey) as Array<[string, string]>;
      for (const [col, val] of parsedFilters) {
        query = query.eq(col, val);
      }

      const { data: rows, error: queryError, count } = await query;

      if (queryError) {
        setError(queryError.message);
        setData([]);
      } else {
        setData((rows ?? []) as T[]);
        setTotal(count ?? 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase, schema, table, page, limit, orderBy, ascending, filtersKey, enabled]);

  useEffect(() => {
    void fetchData();
  }, [fetchData, refreshRef.current]);

  const refresh = useCallback(() => {
    refreshRef.current += 1;
    // Trigger re-render which will re-run the effect
    setLoading(true);
    void fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    meta: { page, limit, total },
    refresh,
  };
}

// ─── Single Row Hook ──────────────────────────────────────────────────────────

/**
 * Fetch a single row by ID.
 *
 * @example
 * const { data, loading } = useRow<MProduk>("core", "m_produk", productId);
 */
export function useRow<T extends Record<string, unknown>>(
  schema: SchemaName,
  table: string,
  id: string | null,
  idColumn = "id"
) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const db = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema(schema);

    db.from(table)
      .select("*")
      .eq(idColumn, id)
      .maybeSingle()
      .then(({ data: row, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else {
          setData(row as T | null);
        }
        setLoading(false);
      });
  }, [supabase, schema, table, id, idColumn]);

  return { data, loading, error };
}

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/**
 * Hook for inserting a row into any table.
 *
 * @example
 * const { insert, loading, error } = useInsert<MProduk>("core", "m_produk");
 * const newProduct = await insert({ nama_produk: "Test", kategori: "A" });
 */
export function useInsert<T extends Record<string, unknown>>(
  schema: SchemaName,
  table: string
) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insert = useCallback(
    async (input: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const db = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema(schema);
        const { data, error: insertError } = await db
          .from(table)
          .insert(input as never)
          .select("*")
          .single();

        if (insertError) {
          setError(insertError.message);
          return null;
        }

        return data as T;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Insert failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, schema, table]
  );

  return { insert, loading, error } as MutationResult & {
    insert: (input: Record<string, unknown>) => Promise<T | null>;
  };
}

/**
 * Hook for updating a row.
 *
 * @example
 * const { update, loading, error } = useUpdate<MProduk>("core", "m_produk");
 * const updated = await update(productId, { nama_produk: "Updated" });
 */
export function useUpdate<T extends Record<string, unknown>>(
  schema: SchemaName,
  table: string,
  idColumn = "id"
) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, input: Record<string, unknown>): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const db = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema(schema);
        const { data, error: updateError } = await db
          .from(table)
          .update({ ...input, updated_at: new Date().toISOString() } as never)
          .eq(idColumn, id)
          .select("*")
          .maybeSingle();

        if (updateError) {
          setError(updateError.message);
          return null;
        }

        return data as T | null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [supabase, schema, table, idColumn]
  );

  return { update, loading, error } as MutationResult & {
    update: (id: string, input: Record<string, unknown>) => Promise<T | null>;
  };
}

/**
 * Hook for deleting a row.
 *
 * @example
 * const { remove, loading, error } = useDelete("core", "m_produk");
 * const success = await remove(productId);
 */
export function useDelete(schema: SchemaName, table: string, idColumn = "id") {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const db = (supabase as unknown as { schema: (s: string) => typeof supabase }).schema(schema);
        const { error: deleteError } = await db
          .from(table)
          .delete()
          .eq(idColumn, id);

        if (deleteError) {
          setError(deleteError.message);
          return false;
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [supabase, schema, table, idColumn]
  );

  return { remove, loading, error } as MutationResult & {
    remove: (id: string) => Promise<boolean>;
  };
}
