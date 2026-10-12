-- Fix grants for management schema used by HR/Management APIs
-- Run this in Supabase SQL Editor

BEGIN;

-- Ensure API roles can access the management schema
GRANT USAGE ON SCHEMA management TO authenticated, anon, service_role;

-- Grant permissions for penilaian_kerja table
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE management.penilaian_kerja TO authenticated, service_role;

-- Grant permissions for sequence (required for ID auto-increment)
GRANT USAGE, SELECT, UPDATE ON SEQUENCE management.penilaian_kerja_id_seq TO authenticated, service_role;

-- Grant permissions for rekap view
GRANT SELECT ON TABLE management.view_rekap_penilaian TO authenticated, service_role;

-- Fix "Security Definer View": policy SELECT dulu, baru security_invoker.
-- management.penilaian_kerja RLS ON tanpa policy -> wajib dibuat sebelum
-- security_invoker aktif, agar role pengguna tidak kehilangan akses.
DROP POLICY IF EXISTS "Penilaian: read app roles" ON management.penilaian_kerja;

CREATE POLICY "Penilaian: read app roles"
    ON management.penilaian_kerja
    FOR SELECT
    TO authenticated
    USING (
        core.get_user_role_safe() = ANY (ARRAY[
            'Super Admin'::core.user_role,
            'Admin'::core.user_role,
            'Management & Strategy'::core.user_role,
            'HR & Operation Manager'::core.user_role,
            'Finance & Administration'::core.user_role
        ])
    );

ALTER VIEW management.view_rekap_penilaian SET (security_invoker = true);

COMMIT;
