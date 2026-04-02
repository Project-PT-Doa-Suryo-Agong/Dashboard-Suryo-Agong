"use client";

import { useTable, useInsert, useUpdate, useDelete, useRow } from "@/lib/supabase/hooks";
import type { MVendor } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Vendors (core.m_vendor) ───────────────────────────────────────────────────

/**
 * List all vendors with pagination.
 *
 * @example
 * const { data, loading, meta, refresh } = useVendors({ page: 1, limit: 50 });
 */
export function useVendors(options?: UseTableOptions) {
  return useTable<MVendor>("core", "m_vendor", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}

/**
 * Fetch a single vendor by ID.
 */
export function useVendor(id: string | null) {
  return useRow<MVendor>("core", "m_vendor", id);
}

/**
 * Insert a new vendor.
 */
export function useInsertVendor() {
  return useInsert<MVendor>("core", "m_vendor");
}

/**
 * Update an existing vendor.
 */
export function useUpdateVendor() {
  return useUpdate<MVendor>("core", "m_vendor");
}

/**
 * Delete a vendor by ID.
 */
export function useDeleteVendor() {
  return useDelete("core", "m_vendor");
}
