-- =============================================================================
-- FIX: Security Definer View -> security_invoker untuk
--      management.view_rekap_penilaian (project PT DOA - production)
-- Jalankan MANUAL di Supabase SQL Editor. Tidak dijalankan otomatis.
--
-- Latar:
--   * View dibuat oleh owner "postgres" tanpa security_invoker, sehingga
--     Supabase Advisor memberi warning "Security Definer View".
--   * management.penilaian_kerja punya RLS ON tetapi TIDAK punya satu pun
--     policy SELECT, jadi security_invoker TIDAK boleh diaktifkan sebelum
--     policy dibuat (semua role akan melihat 0 baris / view kosong).
--   * Tabel dasar lain yang dibaca view: hr.m_karyawan -> sudah punya
--     policy "Allow Public Read Access" TO authenticated USING (true),
--     jadi tidak perlu diubah.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) PRE-FLIGHT (read-only, opsional - jalankan dulu sebelum perbaikan)
-- -----------------------------------------------------------------------------
-- SELECT relname, relrowsecurity, reloptions
-- FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'management'
--   AND relname IN ('penilaian_kerja', 'view_rekap_penilaian');
--   -- penilaian_kerja      : relrowsecurity = t, reloptions kosong
--   -- view_rekap_penilaian : reloptions belum memuat security_invoker
--
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy WHERE polrelid = 'management.penilaian_kerja'::regclass;
--   -- harus kosong (konfirmasi memang belum ada policy di production)
--
-- SELECT grantee, privilege_type
-- FROM information_schema.table_privileges
-- WHERE table_schema = 'management' AND table_name = 'view_rekap_penilaian';
--   -- minimal: authenticated = SELECT, service_role = SELECT, TANPA anon

-- -----------------------------------------------------------------------------
-- 1) PERBAIKAN (satu transaksi; policy dulu, baru security_invoker)
-- -----------------------------------------------------------------------------
BEGIN;

DROP POLICY IF EXISTS "Penilaian: read app roles" ON management.penilaian_kerja;

CREATE POLICY "Penilaian: read app roles"
    ON management.penilaian_kerja
    FOR SELECT
    TO authenticated
    USING (
        core.get_user_role_safe() = ANY (ARRAY[
            'Super Admin'::core.user_role,
            'Admin'::core.user_role,
            'Management & Strategy'::core.user_role,
            'HR & Operation Manager'::core.user_role,
            'Finance & Administration'::core.user_role
        ])
    );

ALTER VIEW management.view_rekap_penilaian SET (security_invoker = true);

COMMIT;

-- -----------------------------------------------------------------------------
-- 2) VERIFIKASI
-- -----------------------------------------------------------------------------
SELECT relname, reloptions
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'management' AND relname = 'view_rekap_penilaian';
-- reloptions harus memuat security_invoker=true

SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
FROM pg_policy
WHERE polrelid = 'management.penilaian_kerja'::regclass;
-- harus memuat "Penilaian: read app roles"

SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'management' AND table_name = 'view_rekap_penilaian';
-- authenticated=SELECT, service_role=SELECT, tanpa anon

-- Uji fungsional: login sebagai Super Admin / Management & Strategy /
-- HR & Operation Manager / Finance & Administration, lalu buka halaman
-- Penilaian Karyawan (GET /api/management/penilaian) dan pastikan data
-- tidak kosong. Catatan: SQL Editor berjalan sebagai postgres sehingga
-- TIDAK bisa menguji jalur security_invoker dari sini.

-- -----------------------------------------------------------------------------
-- 3) ROLLBACK
-- -----------------------------------------------------------------------------
-- ALTER VIEW management.view_rekap_penilaian RESET (security_invoker);
-- DROP POLICY IF EXISTS "Penilaian: read app roles" ON management.penilaian_kerja;
