-- Add readable order code to sales orders
-- Format: ORD-DDMMYYYY-XXXXXX

ALTER TABLE sales.t_sales_order
ADD COLUMN IF NOT EXISTS order_code text;

-- Backfill existing rows by order date (Asia/Jakarta) with stable sequence per day
WITH numbered AS (
  SELECT
    id,
    to_char((created_at AT TIME ZONE 'Asia/Jakarta')::date, 'DDMMYYYY') AS date_code,
    row_number() OVER (
      PARTITION BY (created_at AT TIME ZONE 'Asia/Jakarta')::date
      ORDER BY created_at, id
    ) AS seq
  FROM sales.t_sales_order
  WHERE order_code IS NULL
)
UPDATE sales.t_sales_order AS so
SET order_code = 'ORD-' || numbered.date_code || '-' || lpad(numbered.seq::text, 6, '0')
FROM numbered
WHERE so.id = numbered.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_t_sales_order_order_code_unique
ON sales.t_sales_order(order_code);

-- Optional hardening: enforce NOT NULL after all rows are backfilled
-- ALTER TABLE sales.t_sales_order ALTER COLUMN order_code SET NOT NULL;
