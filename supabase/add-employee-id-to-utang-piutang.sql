-- Migration: Tambah kolom employee_id ke finance.t_utang_piutang
-- Untuk menghubungkan kasbon ke tabel hr.m_karyawan
-- Alasan: Integrasi kasbon ke payroll (potongan otomatis)

ALTER TABLE finance.t_utang_piutang
ADD COLUMN employee_id uuid REFERENCES hr.m_karyawan(id) ON DELETE SET NULL;
