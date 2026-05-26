"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TCashflow, TAsset, TAssetDepreciationSchedule } from "@/types/supabase";
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

// ─── Asset (finance.t_asset) ───────────────────────────────────────────────────
export function useAsset(options?: UseTableOptions) {
  return useTable<TAsset>("finance", "t_asset", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertAsset() { return useInsert<TAsset>("finance", "t_asset"); }
export function useUpdateAsset() { return useUpdate<TAsset>("finance", "t_asset"); }
export function useDeleteAsset() { return useDelete("finance", "t_asset"); }

// ─── Asset Depreciation Schedule (finance.t_asset_depreciation_schedule) ───────
export function useAssetDepreciationSchedule(options?: UseTableOptions) {
  return useTable<TAssetDepreciationSchedule>("finance", "t_asset_depreciation_schedule", {
    orderBy: "periode",
    ascending: true,
    limit: 200,
    ...options,
  });
}
export function useInsertAssetDepreciationSchedule() { return useInsert<TAssetDepreciationSchedule>("finance", "t_asset_depreciation_schedule"); }
export function useUpdateAssetDepreciationSchedule() { return useUpdate<TAssetDepreciationSchedule>("finance", "t_asset_depreciation_schedule"); }
export function useDeleteAssetDepreciationSchedule() { return useDelete("finance", "t_asset_depreciation_schedule"); }

