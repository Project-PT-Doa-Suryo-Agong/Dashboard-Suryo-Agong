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

COMMIT;
