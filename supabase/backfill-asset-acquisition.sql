DO $$
DECLARE
    v_asset      RECORD;
    v_coa_kas_id UUID;
    v_result     JSONB;
    v_count      INTEGER := 0;
BEGIN
    -- ------------------------------------------------------------------------
    -- Resolusi akun kas default (fallback bertingkat, tanpa hardcode id)
    -- ------------------------------------------------------------------------
    SELECT c.id INTO v_coa_kas_id
    FROM finance.m_coa c
    WHERE c.kode_akun = '1102'
    LIMIT 1;

    IF v_coa_kas_id IS NULL THEN
        SELECT c.id INTO v_coa_kas_id
        FROM finance.m_coa c
        WHERE c.nama_akun ILIKE '%Kas Operasional%'
        LIMIT 1;
    END IF;

    IF v_coa_kas_id IS NULL THEN
        SELECT c.id INTO v_coa_kas_id
        FROM finance.m_coa c
        WHERE c.parent_id = (SELECT p.id FROM finance.m_coa p WHERE p.kode_akun = '1100' LIMIT 1)
        ORDER BY c.kode_akun
        LIMIT 1;
    END IF;

    IF v_coa_kas_id IS NULL THEN
        RAISE EXCEPTION 'Backfill dibatalkan: akun kas default tidak ditemukan (1102 / Kas Operasional / anak 1100).';
    END IF;

    -- ------------------------------------------------------------------------
    -- Loop aset aktif dengan nilai perolehan > 0 yang belum punya jurnal
    -- ------------------------------------------------------------------------
    FOR v_asset IN
        SELECT a.id, a.kode_aset, a.nama_aset, a.nilai_perolehan
        FROM finance.t_asset a
        WHERE a.status = 'active'
          AND COALESCE(a.nilai_perolehan, 0) > 0
          AND a.journal_id IS NULL
        ORDER BY a.tanggal_perolehan, a.kode_aset
    LOOP
        SELECT finance.fn_post_asset_acquisition_journal(v_asset.id, v_coa_kas_id)
        INTO v_result;

        IF (v_result->>'success')::boolean THEN
            v_count := v_count + 1;
            RAISE NOTICE 'Backfill akuisisi: % (% %) -> jurnal %',
                v_asset.kode_aset, v_asset.nama_aset, v_asset.nilai_perolehan,
                v_result->>'journal_id';
        ELSE
            RAISE WARNING 'Backfill akuisisi GAGAL: % - %', v_asset.kode_aset, v_result->>'message';
        END IF;
    END LOOP;

    RAISE NOTICE 'Backfill akuisisi selesai: % aset diproses dengan akun kas %', v_count, v_coa_kas_id;
END $$;
