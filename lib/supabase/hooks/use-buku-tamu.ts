"use client";

import { useTable, useInsert, useUpdate, useDelete } from "@/lib/supabase/hooks";
import type { TBukuTamu } from "@/types/supabase";
import type { UseTableOptions } from "@/lib/supabase/hooks";

// ─── Buku Tamu (public.buku_tamu) ─────────────────────────────────────────────
export function useBukuTamu(options?: UseTableOptions) {
  return useTable<TBukuTamu>("public", "buku_tamu", {
    orderBy: "created_at",
    ascending: false,
    limit: 200,
    ...options,
  });
}
export function useInsertBukuTamu() { return useInsert<TBukuTamu>("public", "buku_tamu"); }
export function useUpdateBukuTamu() { return useUpdate<TBukuTamu>("public", "buku_tamu"); }
export function useDeleteBukuTamu() { return useDelete("public", "buku_tamu"); }
