"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TCashflow } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Cashflow (finance.t_cashflow) ─────────────────────────────────────────────
export function useCashflow(options?: UseTableOptions) {
  return useTable<TCashflow>("finance", "t_cashflow", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertCashflow() { return useInsert<TCashflow>("finance", "t_cashflow"); }
export function useUpdateCashflow() { return useUpdate<TCashflow>("finance", "t_cashflow"); }
export function useDeleteCashflow() { return useDelete("finance", "t_cashflow"); }
