-- ============================================================
-- SQL Migration: Tambah Kasbon ke Tipe Utang Piutang
-- Jalankan query ini di Supabase SQL Editor
-- ============================================================

-- 1. Tambah nilai 'kasbon' ke custom enum tipe di schema finance
ALTER TYPE finance.tipe ADD VALUE IF NOT EXISTS 'kasbon';

-- 2. Verifikasi enum values
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'finance'
  AND t.typname = 'tipe'
ORDER BY e.enumsortorder;
