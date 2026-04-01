"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TAttendance } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Attendance (hr.t_attendance) ──────────────────────────────────────────────

/**
 * List attendance records with optional employee_id filter.
 *
 * @example
 * const { data, loading, refresh } = useAttendance({
 *   limit: 500,
 *   filters: [["employee_id", "some-uuid"]],
 * });
 */
export function useAttendance(options?: UseTableOptions) {
  return useTable<TAttendance>("hr", "t_attendance", {
    orderBy: "tanggal",
    ascending: false,
    limit: 500,
    ...options,
  });
}

/**
 * Insert a new attendance record.
 */
export function useInsertAttendance() {
  return useInsert<TAttendance>("hr", "t_attendance");
}

/**
 * Update an attendance record.
 */
export function useUpdateAttendance() {
  return useUpdate<TAttendance>("hr", "t_attendance");
}

/**
 * Delete an attendance record.
 */
export function useDeleteAttendance() {
  return useDelete("hr", "t_attendance");
}
