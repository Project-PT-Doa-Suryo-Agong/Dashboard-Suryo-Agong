"use client";

import { useTable, useInsert, useUpdate, useDelete, useRow } from "@/lib/supabase/hooks";
import type { MProduk } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Products (core.m_produk) ──────────────────────────────────────────────────

/**
 * List all products with pagination & filtering.
 *
 * @example
 * const { data, loading, meta, refresh } = useProducts({ page: 1, limit: 50 });
 */
export function useProducts(options?: UseTableOptions) {
  return useTable<MProduk>("core", "m_produk", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}

/**
 * Fetch a single product by ID.
 */
export function useProduct(id: string | null) {
  return useRow<MProduk>("core", "m_produk", id);
}

/**
 * Insert a new product.
 *
 * @example
 * const { insert, loading, error } = useInsertProduct();
 * await insert({ nama_produk: "Kaos", kategori: "Pakaian" });
 */
export function useInsertProduct() {
  return useInsert<MProduk>("core", "m_produk");
}

/**
 * Update an existing product.
 */
export function useUpdateProduct() {
  return useUpdate<MProduk>("core", "m_produk");
}

/**
 * Delete a product by ID.
 */
export function useDeleteProduct() {
  return useDelete("core", "m_produk");
}
