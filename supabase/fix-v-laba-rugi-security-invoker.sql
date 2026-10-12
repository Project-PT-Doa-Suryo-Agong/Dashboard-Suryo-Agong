-- =============================================================================
-- FIX: Security Definer View -> security_invoker untuk
--      finance.v_laba_rugi (project PT DOA - production)
-- Jalankan MANUAL di Supabase SQL Editor. Tidak dijalankan otomatis.
--
-- Latar:
--   * View dibuat oleh owner "postgres" tanpa security_invoker, sehingga
--     Supabase Advisor memberi warning "Security Definer View".
--   * View membaca tiga tabel dasar finance.m_coa, finance.t_journal_item, dan
--     finance.t_journal. Ketiganya SUDAH punya policy SELECT yang permisif
--     (FOR SELECT TO authenticated/anon USING (true)), sehingga
--     security_invoker AMAN diaktifkan tanpa membuat policy baru.
--   * Tidak ada CREATE POLICY di file ini.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) PRE-FLIGHT (read-only, opsional - jalankan dulu sebelum perbaikan)
-- -----------------------------------------------------------------------------
-- SELECT c.relname, c.reloptions
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'finance' AND c.relname = 'v_laba_rugi';
--   -- reloptions belum memuat security_invoker
--
-- SELECT grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_schema = 'finance' AND table_name = 'v_laba_rugi';
--   -- minimal: authenticated = SELECT, service_role = SELECT

-- -----------------------------------------------------------------------------
-- 1) PERBAIKAN (satu transaksi)
-- -----------------------------------------------------------------------------
BEGIN;

ALTER VIEW finance.v_laba_rugi SET (security_invoker = true);

COMMIT;

-- -----------------------------------------------------------------------------
-- 2) VERIFIKASI
-- -----------------------------------------------------------------------------
SELECT c.relname, c.reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'finance' AND c.relname = 'v_laba_rugi';
-- reloptions harus memuat security_invoker=true

SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'finance' AND table_name = 'v_laba_rugi';
-- authenticated=SELECT, service_role=SELECT

-- Uji fungsional: login sebagai role finance (Finance & Administration /
-- Super Admin / Management & Strategy) lalu buka halaman Laporan Laba Rugi
-- dan pastikan data tidak kosong. Catatan: SQL Editor berjalan sebagai
-- postgres sehingga TIDAK bisa menguji jalur security_invoker dari sini.

-- -----------------------------------------------------------------------------
-- 3) ROLLBACK
-- -----------------------------------------------------------------------------
-- ALTER VIEW finance.v_laba_rugi RESET (security_invoker);
