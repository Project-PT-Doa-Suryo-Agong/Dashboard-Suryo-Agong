-- ============================================================================
-- FIX: Depresiasi Aset — Guard periode masa depan + cleanup jurnal future
-- ----------------------------------------------------------------------------
-- 1. fn_post_depreciation_journal: tolak posting schedule dengan periode
--    > akhir bulan berjalan (PERIODE_FUTURE). Perhitungan akhir bulan
--    DINAMIS terhadap CURRENT_DATE (reusable kapan pun dijalankan).
-- 2. UNIQUE index (asset_id, periode): anti-duplikat defensif.
-- 3. Cleanup jurnal depresiasi masa depan (DELETE) + reset is_posted.
--    Batas akhir bulan dihitung DINAMIS, tidak hardcode tanggal.
-- [FASE 8 AMEND]
--   a. Guard PERIODE_BEFORE_ACQUISITION: tolak posting schedule yang
--      periodenya SEBELUM bulan setelah bulan perolehan aset (depresiasi
--      dimulai bulan berikutnya, aset yang diperoleh 28 Juli baru disusutkan
--      mulai Agustus).
--   b. Jurnal depresiasi kini memuat journal_number JRN-MMYY-NNNNN
--      (count-based, cari slot bebas) — konsisten dengan jurnal lain.
--
-- Urutan deploy: file ini -> migration-fase8-asset-cashflow.sql
--               -> backfill-asset-acquisition.sql
-- Cara pakai: jalankan di Supabase SQL Editor. Aman dijalankan ulang.
-- ============================================================================

-- ============================================================================
-- 1. RPC posting depresiasi + guard periode masa depan
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.fn_post_depreciation_journal(
    p_schedule_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'core', 'public'
AS $$
DECLARE
    v_schedule  RECORD;
    v_asset     RECORD;
    v_journal_id UUID;
    v_no_bukti  TEXT;
    v_keterangan TEXT;
    v_batas_akhir_bulan DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date;
    -- [FASE 8] journal_number count-based
    v_journal_number TEXT;
    v_try           INTEGER := 0;
BEGIN
    -- 1. SELECT + LOCK schedule (FOR UPDATE mencegah race condition)
    SELECT s.* INTO v_schedule
    FROM finance.t_asset_depreciation_schedule s
    WHERE s.id = p_schedule_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'SCHEDULE_NOT_FOUND',
            'message', 'Schedule tidak ditemukan.'
        );
    END IF;

    -- 1b. CEGAH POSTING PERIODE MASA DEPAN (batas dinamis = akhir bulan berjalan)
    IF v_schedule.periode > v_batas_akhir_bulan THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'PERIODE_FUTURE',
            'message', 'Periode penyusutan masih di masa depan (maksimal ' || TO_CHAR(v_batas_akhir_bulan, 'YYYY-MM-DD') || '). Hanya periode berjalan atau sebelumnya yang dapat diposting.'
        );
    END IF;

    -- [FASE 8] 1c. CEGAH POSTING SEBELUM BULAN SETELAH PEROLEHAN:
    -- depresiasi dimulai bulan berikutnya setelah bulan perolehan aset.
    IF v_schedule.periode < (
        SELECT (DATE_TRUNC('month', a.tanggal_perolehan)::date + INTERVAL '1 month')::date
        FROM finance.t_asset a
        WHERE a.id = v_schedule.asset_id
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'PERIODE_BEFORE_ACQUISITION',
            'message', 'Periode penyusutan sebelum bulan setelah bulan perolehan aset. Depresiasi dimulai bulan berikutnya setelah aset diperoleh.'
        );
    END IF;

    -- 2. Cegah duplicate posting
    IF v_schedule.is_posted THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ALREADY_POSTED',
            'message', 'Schedule ini sudah terposting.',
            'journal_id', v_schedule.journal_id
        );
    END IF;

    -- 3. Ambil data asset (COA ditentukan dari database, bukan frontend)
    SELECT a.* INTO v_asset
    FROM finance.t_asset a
    WHERE a.id = v_schedule.asset_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ASSET_NOT_FOUND',
            'message', 'Data aset tidak ditemukan.'
        );
    END IF;

    -- 4. Generate no_bukti dan keterangan
    v_no_bukti   := 'AST-DEP-' || v_asset.kode_aset || '-' || TO_CHAR(v_schedule.periode, 'YYYY-MM-DD');
    v_keterangan := 'Penyusutan Aset Tetap: ' || v_asset.nama_aset || ' - Periode ' || TO_CHAR(v_schedule.periode, 'YYYY-MM-DD');

    -- [FASE 8] 4b. Nomor jurnal JRN-MMYY-NNNNN, cari slot bebas (count-based)
    v_journal_id := gen_random_uuid();
    LOOP
        v_try := v_try + 1;
        v_journal_number := 'JRN-' || TO_CHAR(v_schedule.periode, 'MMYY') || '-'
                            || LPAD(v_try::TEXT, 5, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number
        );
    END LOOP;

    -- 5. INSERT jurnal header
    INSERT INTO finance.t_journal (id, tanggal, no_bukti, keterangan, journal_number)
    VALUES (v_journal_id, v_schedule.periode, v_no_bukti, v_keterangan, v_journal_number);

    -- 6. INSERT debit — Beban Penyusutan (coa_depr_expense_id)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_asset.coa_depr_expense_id, v_schedule.jumlah_penyusutan, 0);

    -- 7. INSERT kredit — Akumulasi Penyusutan (coa_depr_accumulation_id)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_asset.coa_depr_accumulation_id, 0, v_schedule.jumlah_penyusutan);

    -- 8. UPDATE schedule — tandai sudah terposting
    UPDATE finance.t_asset_depreciation_schedule
    SET is_posted = true,
        journal_id = v_journal_id,
        updated_at = NOW()
    WHERE id = p_schedule_id;

    -- 9. Return sukses
    RETURN jsonb_build_object(
        'success', true,
        'journal_id', v_journal_id,
        'message', 'Jurnal penyusutan berhasil diposting.'
    );
EXCEPTION WHEN OTHERS THEN
    -- Auto-rollback oleh PostgreSQL — return error
    RETURN jsonb_build_object(
        'success', false,
        'error_code', 'DB_ERROR',
        'message', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION finance.fn_post_depreciation_journal TO authenticated, service_role;

-- ============================================================================
-- 2. UNIQUE index anti-duplikat schedule (aman: live saat ini tanpa duplikat)
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS uq_asset_dep_schedule_periode
    ON finance.t_asset_depreciation_schedule (asset_id, periode);

-- ============================================================================
-- 3. Cleanup jurnal depresiasi yang terposting untuk periode masa depan
--    Batas = akhir bulan berjalan, dihitung DINAMIS (bukan hardcode tanggal).
--    Delete header t_journal -> item ter-cascade (ON DELETE CASCADE),
--    schedule.journal_id ter-set NULL (FK ON DELETE SET NULL).
--    is_posted di-reset hanya untuk schedule yang jurnalnya terhapus.
-- ============================================================================
DO $$
DECLARE
    v_batas DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date;
    v_deleted INTEGER;
BEGIN
    DELETE FROM finance.t_journal
    WHERE no_bukti LIKE 'AST-DEP-%'
      AND tanggal > v_batas;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;

    UPDATE finance.t_asset_depreciation_schedule
    SET is_posted = false,
        updated_at = NOW()
    WHERE is_posted = true
      AND journal_id IS NULL;

    RAISE NOTICE 'Cleanup selesai: % jurnal depresiasi masa depan (> %) dihapus, schedule di-reset.', v_deleted, v_batas;
END $$;

-- ============================================================================
-- Verifikasi: sisa jurnal depresiasi (harus hanya periode berjalan & sebelumnya)
-- ============================================================================
SELECT j.no_bukti, j.tanggal, COUNT(ji.id) AS item_count
FROM finance.t_journal j
LEFT JOIN finance.t_journal_item ji ON ji.journal_id = j.id
WHERE j.no_bukti LIKE 'AST-DEP-%'
GROUP BY j.no_bukti, j.tanggal
ORDER BY j.tanggal, j.no_bukti;
