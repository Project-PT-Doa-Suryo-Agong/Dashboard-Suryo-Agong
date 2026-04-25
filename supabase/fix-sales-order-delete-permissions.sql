-- Fix delete permission for sales.t_sales_order
-- Symptom: DELETE /api/sales/orders/:id -> "permission denied for table t_sales_order"

BEGIN;

-- 1) Basic grants on schema/table
GRANT USAGE ON SCHEMA sales TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sales.t_sales_order TO authenticated, service_role;

-- 2) Refresh RLS policies with current role labels
ALTER TABLE sales.t_sales_order ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sales-related roles can read orders" ON sales.t_sales_order;
DROP POLICY IF EXISTS "Creative and strategic can insert orders" ON sales.t_sales_order;
DROP POLICY IF EXISTS "Creative and strategic can update orders" ON sales.t_sales_order;
DROP POLICY IF EXISTS "Strategic can delete orders" ON sales.t_sales_order;

CREATE POLICY "Sales-related roles can read orders"
ON sales.t_sales_order FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN (
    'Super Admin',
    'CEO',
    'Creative & Sales',
    'Finance & Administration',
    'Logistics & Packing',
    'Management & Strategy'
  )
);

CREATE POLICY "Sales and strategic can insert orders"
ON sales.t_sales_order FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN (
    'Super Admin',
    'CEO',
    'Creative & Sales',
    'Management & Strategy'
  )
);

CREATE POLICY "Sales and strategic can update orders"
ON sales.t_sales_order FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN (
    'Super Admin',
    'CEO',
    'Creative & Sales',
    'Management & Strategy'
  )
);

CREATE POLICY "Sales and strategic can delete orders"
ON sales.t_sales_order FOR DELETE
TO authenticated
USING (
  core.get_user_role() IN (
    'Super Admin',
    'CEO',
    'Creative & Sales',
    'Management & Strategy'
  )
);

COMMIT;
