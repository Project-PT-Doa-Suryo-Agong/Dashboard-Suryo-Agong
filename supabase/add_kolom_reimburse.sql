-- Menambahkan kolom bukti dan keterangan pada tabel t_reimbursement
ALTER TABLE finance.t_reimbursement
ADD COLUMN IF NOT EXISTS bukti TEXT,
ADD COLUMN IF NOT EXISTS keterangan TEXT;
