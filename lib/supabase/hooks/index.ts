/**
 * Domain-specific Supabase hooks — barrel export.
 *
 * Fase 2 migrasi: CRUD direct Core & HR.
 *
 * Usage:
 *   import { useProducts, useInsertProduct } from "@/lib/supabase/hooks/index";
 */

// ── Core ──
export { useProducts, useProduct, useInsertProduct, useUpdateProduct, useDeleteProduct } from "./use-products";
export { useVariants, useVariant, useInsertVariant, useUpdateVariant, useDeleteVariant } from "./use-variants";
export { useVendors, useVendor, useInsertVendor, useUpdateVendor, useDeleteVendor } from "./use-vendors";

// ── HR ──
export { useKaryawan, useKaryawanById, useInsertKaryawan, useUpdateKaryawan, useDeleteKaryawan } from "./use-karyawan";
export { useAttendance, useInsertAttendance, useUpdateAttendance, useDeleteAttendance } from "./use-attendance";
export { useWarnings, useInsertWarning, useUpdateWarning, useDeleteWarning } from "./use-warnings";
