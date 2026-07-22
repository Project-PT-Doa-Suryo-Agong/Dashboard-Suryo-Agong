-- ============================================================================
-- Migration: Fix RLS policy on finance.t_reimbursement
--
-- Root Cause:
--   Policy "Finance: Reimburse own/admin" pada finance.t_reimbursement
--   tidak menyertakan is_admin(), berbeda dengan policy pada
--   management.t_budget_request dan finance.t_payroll_history yang
--   keduanya menggunakan is_admin().
--
--   Akibatnya, user dengan role 'Management & Strategy' (yang tercakup
--   dalam is_admin()) tidak bisa meng-update status reimbursement,
--   sehingga muncul error "Gagal update reimburse." ketika approve/reject.
--
-- Fix:
--   Tambahkan core.is_admin() ke dalam USING dan WITH CHECK policy
--   agar konsisten dengan tabel lain.
-- ============================================================================

BEGIN;

-- Hapus policy lama
DROP POLICY IF EXISTS "Finance: Reimburse own/admin" ON finance.t_reimbursement;

-- Buat ulang dengan is_admin() included
CREATE POLICY "Finance: Reimburse own/admin" ON finance.t_reimbursement
    USING (
        core.is_admin()
        OR core.get_user_role_safe() IN ('Finance & Administration', 'Super Admin')
        OR employee_id IN (SELECT id FROM hr.m_karyawan WHERE profile_id = auth.uid())
    )
    WITH CHECK (
        core.is_admin()
        OR core.get_user_role_safe() IN ('Finance & Administration', 'Super Admin')
        OR employee_id IN (SELECT id FROM hr.m_karyawan WHERE profile_id = auth.uid())
    );

COMMIT;
