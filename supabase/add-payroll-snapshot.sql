-- Migration: Tambah kolom snapshot payroll
-- Tujuan: Slip Gaji historis tidak berubah saat master gaji karyawan berubah
-- Aman: Kolom baru nullable, data lama tetap NULL, tidak ada destructive change

ALTER TABLE finance.t_payroll_history
  ADD COLUMN IF NOT EXISTS gaji_pokok numeric,
  ADD COLUMN IF NOT EXISTS potongan_kasbon numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gaji_bersih numeric;
