"use client";

import { useTable, useInsert, useUpdate, useDelete, useRow } from "@/lib/supabase/hooks";
import type { MVarian } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Variants (core.m_varian) ──────────────────────────────────────────────────

/**
 * List all variants with optional product_id filter.
 *
 * @example
 * const { data, loading, refresh } = useVariants({ filters: [["product_id", productId]] });
 */
export function useVariants(options?: UseTableOptions) {
  return useTable<MVarian>("core", "m_varian", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}

/**
 * Fetch a single variant by ID.
 */
export function useVariant(id: string | null) {
  return useRow<MVarian>("core", "m_varian", id);
}

/**
 * Insert a new variant.
 */
export function useInsertVariant() {
  return useInsert<MVarian>("core", "m_varian");
}

/**
 * Update an existing variant.
 */
export function useUpdateVariant() {
  return useUpdate<MVarian>("core", "m_varian");
}

/**
 * Delete a variant by ID.
 */
export function useDeleteVariant() {
  return useDelete("core", "m_varian");
}
