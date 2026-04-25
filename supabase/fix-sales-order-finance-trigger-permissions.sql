-- Fix permission issue when inserting sales.t_sales_order triggers finance.fn_sales_to_cashflow
-- Symptom:
--   POST /api/sales/orders -> "permission denied for schema finance"
-- Root cause:
--   Trigger function finance.fn_sales_to_cashflow runs with invoker privileges,
--   while authenticated role has insufficient permission for finance schema/table.

BEGIN;

-- Ensure finance schema can be resolved by app roles.
GRANT USAGE ON SCHEMA finance TO authenticated, service_role;

-- Ensure trigger target table can be written by privileged role paths.
GRANT INSERT, SELECT ON TABLE finance.t_cashflow TO authenticated, service_role;

-- Make trigger function run with owner privileges.
CREATE OR REPLACE FUNCTION finance.fn_sales_to_cashflow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = finance, sales, public
AS $$
BEGIN
  INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
  VALUES (
    'income',
    NEW.total_price,
    'Pemasukan dari Sales Order ID: ' || NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Explicit execute grants for safety.
GRANT EXECUTE ON FUNCTION finance.fn_sales_to_cashflow() TO authenticated, service_role;

-- Recreate trigger to bind latest function definition.
DROP TRIGGER IF EXISTS trg_sales_to_cashflow ON sales.t_sales_order;
CREATE TRIGGER trg_sales_to_cashflow
AFTER INSERT ON sales.t_sales_order
FOR EACH ROW
EXECUTE FUNCTION finance.fn_sales_to_cashflow();

COMMIT;
