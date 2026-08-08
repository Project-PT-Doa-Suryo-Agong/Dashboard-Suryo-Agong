CREATE OR REPLACE FUNCTION finance.fn_post_asset_acquisition_journal(
    p_asset_id UUID,
    p_coa_kas_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'core', 'public'
AS $$
DECLARE
    v_asset          RECORD;
    v_coa_kas_exists BOOLEAN;
    v_journal_id     UUID;
    v_journal_number TEXT;
    v_try            INTEGER := 0;
BEGIN
    -- 1. Validasi aset
    SELECT a.* INTO v_asset
    FROM finance.t_asset a
    WHERE a.id = p_asset_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ASSET_NOT_FOUND',
            'message', 'Data aset tidak ditemukan.'
        );
    END IF;

    -- 2. Cegah duplicate posting (idempotent)
    IF v_asset.journal_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ALREADY_POSTED',
            'message', 'Aset ini sudah memiliki jurnal akuisisi.',
            'journal_id', v_asset.journal_id
        );
    END IF;

    -- 3. Validasi nominal & COA aset
    IF COALESCE(v_asset.nilai_perolehan, 0) <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'INVALID_AMOUNT',
            'message', 'Nilai perolehan aset harus lebih besar dari 0.'
        );
    END IF;

    IF v_asset.coa_asset_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'ASSET_COA_MISSING',
            'message', 'Aset belum memiliki akun aset (coa_asset_id).'
        );
    END IF;

    -- 4. Validasi akun kas yang dipilih
    SELECT EXISTS (
        SELECT 1 FROM finance.m_coa c WHERE c.id = p_coa_kas_id
    ) INTO v_coa_kas_exists;

    IF NOT v_coa_kas_exists THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_code', 'COA_NOT_FOUND',
            'message', 'Akun kas yang dipilih tidak ditemukan di chart of accounts.'
        );
    END IF;

    -- 5. Nomor jurnal: JRN-MMYY-NNNNN, cari slot bebas (count-based)
    v_journal_id := gen_random_uuid();

    LOOP
        v_try := v_try + 1;
        v_journal_number := 'JRN-' || TO_CHAR(v_asset.tanggal_perolehan, 'MMYY') || '-'
                            || LPAD(v_try::TEXT, 5, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number
        );
    END LOOP;

    -- 6. Insert header jurnal
    INSERT INTO finance.t_journal (
        id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
    ) VALUES (
        v_journal_id,
        'AST-AKQ-' || v_asset.kode_aset,
        v_asset.tanggal_perolehan,
        'Akuisisi Aset Tetap: ' || v_asset.nama_aset || ' (' || v_asset.kode_aset || ')',
        v_asset.id,
        v_journal_number,
        NOW(),
        NOW()
    );

    -- 7. Insert item DEBIT: Aset Tetap
    INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
    VALUES (gen_random_uuid(), v_journal_id, v_asset.coa_asset_id, v_asset.nilai_perolehan, 0, NOW(), NOW());

    -- 8. Insert item KREDIT: Kas
    INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
    VALUES (gen_random_uuid(), v_journal_id, p_coa_kas_id, 0, v_asset.nilai_perolehan, NOW(), NOW());

    -- 9. Tandai aset sudah terposting
    UPDATE finance.t_asset
    SET journal_id = v_journal_id,
        updated_at = NOW()
    WHERE id = p_asset_id;

    -- 10. Return sukses
    RETURN jsonb_build_object(
        'success', true,
        'journal_id', v_journal_id,
        'message', 'Jurnal akuisisi aset berhasil diposting.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error_code', 'DB_ERROR',
        'message', SQLERRM
    );
END;
$$;

-- Grant execute sesuai convention project
GRANT EXECUTE ON FUNCTION finance.fn_post_asset_acquisition_journal TO authenticated, service_role;
