"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TMembership } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Membership (sales.t_membership) ────────────────────────────────────────────
export function useMembership(options?: UseTableOptions) {
  return useTable<TMembership>("sales", "t_membership", {
    orderBy: "nama",
    ascending: true,
    limit: 500,
    ...options,
  });
}
export function useInsertMembership() { return useInsert<TMembership>("sales", "t_membership"); }
export function useUpdateMembership() { return useUpdate<TMembership>("sales", "t_membership"); }
export function useDeleteMembership() { return useDelete("sales", "t_membership"); }
