/**
 * Domain-specific Supabase hooks — barrel export.
 *
 * Fase 2 & 3 migrasi: CRUD direct Core, HR, Finance, Logistics, Sales.
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

// ── Finance ──
export { useCashflow, useInsertCashflow, useUpdateCashflow, useDeleteCashflow } from "./use-finance";

// ── Logistics ──
export { useManifest, useInsertManifest, useUpdateManifest, useDeleteManifest, usePacking, useInsertPacking, useUpdatePacking, useDeletePacking, useReturnOrder, useInsertReturnOrder, useUpdateReturnOrder, useDeleteReturnOrder } from "./use-logistics";

// ── Management ──
export { useKpiWeekly, useInsertKpiWeekly, useUpdateKpiWeekly, useDeleteKpiWeekly } from "./use-management";

// ── Sales ──
export { useAffiliator, useInsertAffiliator, useUpdateAffiliator, useDeleteAffiliator, useContentPlanner, useInsertContentPlanner, useUpdateContentPlanner, useDeleteContentPlanner, useLivePerformance, useInsertLivePerformance, useUpdateLivePerformance, useDeleteLivePerformance } from "./use-sales";

