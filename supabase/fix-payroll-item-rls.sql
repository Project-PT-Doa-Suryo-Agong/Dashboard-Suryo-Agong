-- ============================================================================
-- Migration: ENABLE RLS + policies untuk finance.t_payroll_item
-- ============================================================================

BEGIN;

-- 1. Nyalakan RLS
ALTER TABLE finance.t_payroll_item ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan policy lama bila ada
DROP POLICY IF EXISTS "Allow Public Read Access"      ON finance.t_payroll_item;
DROP POLICY IF EXISTS "finance.t_payroll_item: Manage" ON finance.t_payroll_item;
DROP POLICY IF EXISTS "finance.t_payroll_item: Read all" ON finance.t_payroll_item;
DROP POLICY IF EXISTS "finance.t_payroll_item: Read"  ON finance.t_payroll_item;

-- 3. Policy: Manage (SELECT/INSERT/UPDATE/DELETE) hanya untuk role tertentu
CREATE POLICY "finance.t_payroll_item: Manage"
ON finance.t_payroll_item
FOR ALL
TO authenticated
USING (
  core.is_admin()
  OR core.get_user_role() IN (
    'HR & Operation Manager',
    'Finance & Administration',
    'Super Admin'
  )
)
WITH CHECK (
  core.is_admin()
  OR core.get_user_role() IN (
    'HR & Operation Manager',
    'Finance & Administration',
    'Super Admin'
  )
);

COMMIT;
