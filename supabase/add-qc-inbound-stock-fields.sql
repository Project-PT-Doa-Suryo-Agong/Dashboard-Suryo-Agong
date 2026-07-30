
-- 1. Tambah kolom bahan_baku_id (FK ke m_bahan_baku)
ALTER TABLE production.t_qc_inbound
ADD COLUMN IF NOT EXISTS bahan_baku_id uuid REFERENCES production.m_bahan_baku(id) ON DELETE RESTRICT;

-- 2. Tambah kolom jumlah (kuantitas bahan baku yang diterima)
ALTER TABLE production.t_qc_inbound
ADD COLUMN IF NOT EXISTS jumlah numeric CHECK (jumlah IS NULL OR jumlah > 0);

-- 3. Tambah kolom mutasi_stok_id (untuk idempotency — lacak mutasi yang sudah dibuat)
ALTER TABLE production.t_qc_inbound
ADD COLUMN IF NOT EXISTS mutasi_stok_id uuid REFERENCES production.t_stok_mutasi(id) ON DELETE SET NULL;

-- 4. Re-verify grants
GRANT ALL PRIVILEGES ON production.t_qc_inbound TO authenticated, service_role;
