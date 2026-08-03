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

    -- 5. INSERT jurnal header
    INSERT INTO finance.t_journal (tanggal, no_bukti, keterangan)
    VALUES (v_schedule.periode, v_no_bukti, v_keterangan)
    RETURNING id INTO v_journal_id;

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

-- Grant execute sesuai convention project
GRANT EXECUTE ON FUNCTION finance.fn_post_depreciation_journal TO authenticated, service_role;