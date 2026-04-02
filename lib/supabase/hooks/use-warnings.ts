"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TEmployeeWarning } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Employee Warnings (hr.t_employee_warning) ────────────────────────────────

/**
 * List employee warnings with optional employee_id filter.
 *
 * @example
 * const { data, loading, refresh } = useWarnings({
 *   filters: [["employee_id", "some-uuid"]],
 * });
 */
export function useWarnings(options?: UseTableOptions) {
  return useTable<TEmployeeWarning>("hr", "t_employee_warning", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}

/**
 * Insert a new employee warning.
 */
export function useInsertWarning() {
  return useInsert<TEmployeeWarning>("hr", "t_employee_warning");
}

/**
 * Update an employee warning.
 */
export function useUpdateWarning() {
  return useUpdate<TEmployeeWarning>("hr", "t_employee_warning");
}

/**
 * Delete an employee warning.
 */
export function useDeleteWarning() {
  return useDelete("hr", "t_employee_warning");
}
