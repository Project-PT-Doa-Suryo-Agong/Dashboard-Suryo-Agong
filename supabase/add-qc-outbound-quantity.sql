
-- 1. Tambah kolom quantity (jumlah hasil produksi / finished goods)
ALTER TABLE production.t_qc_outbound
ADD COLUMN IF NOT EXISTS quantity integer CHECK (quantity IS NULL OR quantity > 0);

-- 2. Re-verify grants
GRANT ALL PRIVILEGES ON production.t_qc_outbound TO authenticated, service_role;
