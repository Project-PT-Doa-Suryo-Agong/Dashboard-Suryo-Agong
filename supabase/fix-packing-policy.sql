-- Fix: allow packing CRUD for logistics/production roles.
-- Run this script in Supabase SQL Editor on environments that already have RLS policies applied.

DROP POLICY IF EXISTS "Logistik and strategic can insert packing" ON logistics.t_packing;
DROP POLICY IF EXISTS "Logistik and strategic can update packing" ON logistics.t_packing;
DROP POLICY IF EXISTS "Strategic can delete packing" ON logistics.t_packing;
DROP POLICY IF EXISTS "Logistik and strategic can delete packing" ON logistics.t_packing;

CREATE POLICY "Logistik and strategic can insert packing"
ON logistics.t_packing FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can update packing"
ON logistics.t_packing FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can delete packing"
ON logistics.t_packing FOR DELETE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);
