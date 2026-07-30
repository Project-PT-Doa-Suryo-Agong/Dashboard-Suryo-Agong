-- ============================================================================
-- fn_post_depreciation_journal — Atomic & Recovery-Aware posting jurnal penyusutan aset tetap
--
-- Semua operasi (check schedule → create/recover journal → create items → update
-- schedule) dilakukan dalam 1 transaction PostgreSQL melalui RPC.
-- Jika salah satu gagal, seluruh operasi di-rollback.
--
-- Security: SECURITY DEFINER agar bisa INSERT/UPDATE ke t_journal / t_journal_item
--           tanpa terhalang RLS. Auth diverifikasi oleh API route sebelum panggil RPC.
-- ============================================================================

CREATE OR REPLACE FUNCTION finance.fn_post_depreciation_journal(
    p_schedule_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'core', 'public'
AS $$
DECLARE
    v_schedule        RECORD;
    v_asset           RECORD;
    v_existing_journal RECORD;
    v_journal_id      UUID;
    v_no_bukti        TEXT;
    v_keterangan      TEXT;
    
    v_debit_count     INT;
    v_kredit_count    INT;
    v_total_debit     NUMERIC;
    v_total_kredit    NUMERIC;
    v_valid_debit_coa INT;
    v_valid_kredit_coa INT;
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

    -- 2. Cegah duplicate posting jika schedule sudah terposting
    IF v_schedule.is_posted THEN
        RETURN jsonb_build_object(
            'success', true,
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

    -- 5. CARI existing journal berdasarkan no_bukti
    SELECT j.* INTO v_existing_journal
    FROM finance.t_journal j
    WHERE j.no_bukti = v_no_bukti;

    IF FOUND THEN
        -- Validasi jurnal existing:
        -- - debit item count > 0 & kredit item count > 0
        -- - total debit = jumlah_penyusutan
        -- - total kredit = jumlah_penyusutan
        -- - debit item COA = asset coa_depr_expense_id
        -- - kredit item COA = asset coa_depr_accumulation_id
        SELECT 
            COALESCE(SUM(debit), 0),
            COALESCE(SUM(kredit), 0),
            COUNT(CASE WHEN debit > 0 THEN 1 END),
            COUNT(CASE WHEN kredit > 0 THEN 1 END),
            COUNT(CASE WHEN debit > 0 AND coa_id = v_asset.coa_depr_expense_id THEN 1 END),
            COUNT(CASE WHEN kredit > 0 AND coa_id = v_asset.coa_depr_accumulation_id THEN 1 END)
        INTO 
            v_total_debit,
            v_total_kredit,
            v_debit_count,
            v_kredit_count,
            v_valid_debit_coa,
            v_valid_kredit_coa
        FROM finance.t_journal_item
        WHERE journal_id = v_existing_journal.id;

        IF v_debit_count > 0 
           AND v_kredit_count > 0 
           AND v_total_debit = v_schedule.jumlah_penyusutan 
           AND v_total_kredit = v_schedule.jumlah_penyusutan
           AND v_valid_debit_coa > 0
           AND v_valid_kredit_coa > 0 THEN
            
            -- Recovery: hubungkan schedule ke jurnal existing
            UPDATE finance.t_asset_depreciation_schedule
            SET is_posted = true,
                journal_id = v_existing_journal.id,
                updated_at = NOW()
            WHERE id = p_schedule_id;

            RETURN jsonb_build_object(
                'success', true,
                'error_code', 'RECOVERED_EXISTING_JOURNAL',
                'journal_id', v_existing_journal.id,
                'message', 'Jurnal penyusutan berhasil dipulihkan dan dikaitkan ke schedule.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'error_code', 'INVALID_EXISTING_JOURNAL',
                'message', 'Jurnal existing ditemukan tetapi strukturnya tidak valid.'
            );
        END IF;
    END IF;

    -- 6. Jika jurnal TIDAK ditemukan: INSERT jurnal header baru
    INSERT INTO finance.t_journal (tanggal, no_bukti, keterangan)
    VALUES (v_schedule.periode, v_no_bukti, v_keterangan)
    RETURNING id INTO v_journal_id;

    -- 7. INSERT debit — Beban Penyusutan (coa_depr_expense_id)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_asset.coa_depr_expense_id, v_schedule.jumlah_penyusutan, 0);

    -- 8. INSERT kredit — Akumulasi Penyusutan (coa_depr_accumulation_id)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_asset.coa_depr_accumulation_id, 0, v_schedule.jumlah_penyusutan);

    -- 9. UPDATE schedule — tandai sudah terposting
    UPDATE finance.t_asset_depreciation_schedule
    SET is_posted = true,
        journal_id = v_journal_id,
        updated_at = NOW()
    WHERE id = p_schedule_id;

    -- 10. Return sukses
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

-- Grant execute sesuai convention project
GRANT EXECUTE ON FUNCTION finance.fn_post_depreciation_journal TO authenticated, service_role;