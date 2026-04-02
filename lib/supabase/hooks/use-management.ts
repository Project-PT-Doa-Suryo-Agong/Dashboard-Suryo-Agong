"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TKPIWeekly } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── KPI Weekly (management.t_kpi_weekly) ──────────────────────────────────────
export function useKpiWeekly(options?: UseTableOptions) {
  return useTable<TKPIWeekly>("management", "t_kpi_weekly", {
    orderBy: "minggu",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertKpiWeekly() { return useInsert<TKPIWeekly>("management", "t_kpi_weekly"); }
export function useUpdateKpiWeekly() { return useUpdate<TKPIWeekly>("management", "t_kpi_weekly"); }
export function useDeleteKpiWeekly() { return useDelete("management", "t_kpi_weekly"); }
