"use client";

import { useTable, useInsert, useUpdate, useDelete, useRow } from "@/lib/supabase/hooks";
import type { MKaryawan } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Karyawan / Employees (hr.m_karyawan) ──────────────────────────────────────

/**
 * List all employees with pagination.
 *
 * @example
 * const { data, loading, meta, refresh } = useKaryawan({ page: 1, limit: 50 });
 */
export function useKaryawan(options?: UseTableOptions) {
  return useTable<MKaryawan>("hr", "m_karyawan", {
    orderBy: "nama",
    ascending: true,
    limit: 200,
    ...options,
  });
}

/**
 * Fetch a single employee by ID.
 */
export function useKaryawanById(id: string | null) {
  return useRow<MKaryawan>("hr", "m_karyawan", id);
}

/**
 * Insert a new employee.
 */
export function useInsertKaryawan() {
  return useInsert<MKaryawan>("hr", "m_karyawan");
}

/**
 * Update an existing employee.
 */
export function useUpdateKaryawan() {
  return useUpdate<MKaryawan>("hr", "m_karyawan");
}

/**
 * Delete an employee by ID.
 */
export function useDeleteKaryawan() {
  return useDelete("hr", "m_karyawan");
}
