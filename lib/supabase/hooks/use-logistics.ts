"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TLogistikManifest, TPacking, TReturnOrder } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Manifest (logistics.t_logistik_manifest) ──────────────────────────────────
export function useManifest(options?: UseTableOptions) {
  return useTable<TLogistikManifest>("logistics", "t_logistik_manifest", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertManifest() { return useInsert<TLogistikManifest>("logistics", "t_logistik_manifest"); }
export function useUpdateManifest() { return useUpdate<TLogistikManifest>("logistics", "t_logistik_manifest"); }
export function useDeleteManifest() { return useDelete("logistics", "t_logistik_manifest"); }

// ─── Packing (logistics.t_packing) ─────────────────────────────────────────────
export function usePacking(options?: UseTableOptions) {
  return useTable<TPacking>("logistics", "t_packing", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertPacking() { return useInsert<TPacking>("logistics", "t_packing"); }
export function useUpdatePacking() { return useUpdate<TPacking>("logistics", "t_packing"); }
export function useDeletePacking() { return useDelete("logistics", "t_packing"); }

// ─── Return Order (logistics.t_return_order) ───────────────────────────────────
export function useReturnOrder(options?: UseTableOptions) {
  return useTable<TReturnOrder>("logistics", "t_return_order", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertReturnOrder() { return useInsert<TReturnOrder>("logistics", "t_return_order"); }
export function useUpdateReturnOrder() { return useUpdate<TReturnOrder>("logistics", "t_return_order"); }
export function useDeleteReturnOrder() { return useDelete("logistics", "t_return_order"); }
