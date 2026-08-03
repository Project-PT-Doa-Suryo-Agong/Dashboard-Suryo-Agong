ALTER TABLE hr.m_karyawan
    ADD COLUMN IF NOT EXISTS bpjs_number text,
    ADD COLUMN IF NOT EXISTS no_rekening text,
    ADD COLUMN IF NOT EXISTS bank text,
    ADD COLUMN IF NOT EXISTS tanggal_masuk date,
    ADD COLUMN IF NOT EXISTS tunjangan_tetap numeric DEFAULT 0;

-- Validasi nilai tunjangan_tetap tidak negatif (mengikuti pola gaji_pokok check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'm_karyawan_tunjangan_tetap_check'
          AND conrelid = 'hr.m_karyawan'::regclass
    ) THEN
        ALTER TABLE hr.m_karyawan
            ADD CONSTRAINT m_karyawan_tunjangan_tetap_check
            CHECK (tunjangan_tetap >= 0);
    END IF;
END $$;
