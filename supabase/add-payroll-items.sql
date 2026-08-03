CREATE TABLE IF NOT EXISTS finance.t_payroll_item (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    employee_id uuid NOT NULL,
    bulan date NOT NULL,
    kode_komponen text NOT NULL,
    nama_komponen text NOT NULL,
    kategori text NOT NULL CHECK (kategori IN ('pendapatan', 'potongan')),
    tipe text NOT NULL DEFAULT 'auto' CHECK (tipe IN ('auto', 'manual')),
    jumlah numeric NOT NULL DEFAULT 0 CHECK (jumlah >= 0),
    kasbon_id uuid,
    coa_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT t_payroll_item_pkey PRIMARY KEY (id),
    CONSTRAINT t_payroll_item_payroll_fkey
        FOREIGN KEY (employee_id, bulan)
        REFERENCES finance.t_payroll_history (employee_id, bulan)
        ON DELETE CASCADE,
    CONSTRAINT t_payroll_item_kasbon_fkey
        FOREIGN KEY (kasbon_id)
        REFERENCES finance.t_utang_piutang (id)
        ON DELETE SET NULL,
    CONSTRAINT t_payroll_item_coa_fkey
        FOREIGN KEY (coa_id)
        REFERENCES finance.m_coa (id)
        ON DELETE SET NULL
);

ALTER TABLE finance.t_payroll_item OWNER TO postgres;

-- Index agar query detail payroll cepat
CREATE INDEX IF NOT EXISTS idx_t_payroll_item_payroll
    ON finance.t_payroll_item (employee_id, bulan);

CREATE INDEX IF NOT EXISTS idx_t_payroll_item_kasbon
    ON finance.t_payroll_item (kasbon_id);

-- Timestamp otomatis saat update
CREATE OR REPLACE TRIGGER tr_upd_finance_t_payroll_item
    BEFORE UPDATE ON finance.t_payroll_item
    FOR EACH ROW
    EXECUTE FUNCTION core.update_timestamp();

-- Grant (mengikuti pola tabel finance lain)
GRANT ALL ON TABLE finance.t_payroll_item TO authenticated;
GRANT SELECT, INSERT, DELETE, UPDATE ON TABLE finance.t_payroll_item TO service_role;

-- ============================================================================
-- 2. KOLOM RINGKAS BARU: finance.t_payroll_history
--    (semua nullable/default — data lama tetap NULL/default, tidak rusak)
-- ============================================================================
ALTER TABLE finance.t_payroll_history
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'paid',
    ADD COLUMN IF NOT EXISTS tanggal_pay date,
    ADD COLUMN IF NOT EXISTS gaji_kotor numeric,
    ADD COLUMN IF NOT EXISTS tunjangan numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS lembur numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bonus numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS insentif numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS potongan_manual numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bpjs_jht numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bpjs_jp numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bpjs_jkk_jkm numeric DEFAULT 0,
    ADD COLUMN IF NOT EXISTS keterangan text;
