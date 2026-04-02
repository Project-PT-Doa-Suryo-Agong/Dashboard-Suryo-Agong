"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { MAfiliator, TContentPlanner, TLivePerformance } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Affiliator (sales.m_affiliator) ───────────────────────────────────────────
export function useAffiliator(options?: UseTableOptions) {
  return useTable<MAfiliator>("sales", "m_affiliator", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertAffiliator() { return useInsert<MAfiliator>("sales", "m_affiliator"); }
export function useUpdateAffiliator() { return useUpdate<MAfiliator>("sales", "m_affiliator"); }
export function useDeleteAffiliator() { return useDelete("sales", "m_affiliator"); }

// ─── Content Planner (sales.t_content_planner) ─────────────────────────────────
export function useContentPlanner(options?: UseTableOptions) {
  return useTable<TContentPlanner>("sales", "t_content_planner", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertContentPlanner() { return useInsert<TContentPlanner>("sales", "t_content_planner"); }
export function useUpdateContentPlanner() { return useUpdate<TContentPlanner>("sales", "t_content_planner"); }
export function useDeleteContentPlanner() { return useDelete("sales", "t_content_planner"); }

// ─── Live Performance (sales.t_live_performance) ───────────────────────────────
export function useLivePerformance(options?: UseTableOptions) {
  return useTable<TLivePerformance>("sales", "t_live_performance", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertLivePerformance() { return useInsert<TLivePerformance>("sales", "t_live_performance"); }
export function useUpdateLivePerformance() { return useUpdate<TLivePerformance>("sales", "t_live_performance"); }
export function useDeleteLivePerformance() { return useDelete("sales", "t_live_performance"); }
