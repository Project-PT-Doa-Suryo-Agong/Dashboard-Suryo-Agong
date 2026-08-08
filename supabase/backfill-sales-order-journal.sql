DO $$
DECLARE
    v_order            RECORD;
    v_journal_id       UUID;
    v_journal_number   TEXT;
    v_tanggal_jurnal   DATE;
    v_coa_cash_id      UUID;
    v_coa_piutang_id   UUID;
    v_coa_pendapatan_id UUID;
    v_total_debit      NUMERIC;
    v_nama_pelanggan   TEXT;
    v_try              INTEGER;
    v_count_backfilled INTEGER := 0;
BEGIN
    -- ------------------------------------------------------------------------
    -- Resolusi COA (fallback bertingkat, akun EXISTING saja)
    -- ------------------------------------------------------------------------
    SELECT c.id INTO v_coa_cash_id FROM finance.m_coa c WHERE c.kode_akun = '1102' LIMIT 1;
    IF v_coa_cash_id IS NULL THEN
        SELECT c.id INTO v_coa_cash_id FROM finance.m_coa c WHERE c.nama_akun ILIKE '%Kas Operasional%' LIMIT 1;
    END IF;
    IF v_coa_cash_id IS NULL THEN
        SELECT c.id INTO v_coa_cash_id FROM finance.m_coa c
        WHERE c.parent_id = (SELECT p.id FROM finance.m_coa p WHERE p.kode_akun = '1100' LIMIT 1)
        ORDER BY c.kode_akun LIMIT 1;
    END IF;
    IF v_coa_cash_id IS NULL THEN
        RAISE EXCEPTION 'Backfill dibatalkan: COA kas (1102) tidak ditemukan di finance.m_coa';
    END IF;

    SELECT c.id INTO v_coa_piutang_id FROM finance.m_coa c WHERE c.kode_akun = '1201' LIMIT 1;
    IF v_coa_piutang_id IS NULL THEN
        SELECT c.id INTO v_coa_piutang_id FROM finance.m_coa c WHERE c.nama_akun ILIKE '%Piutang Usaha%' LIMIT 1;
    END IF;
    IF v_coa_piutang_id IS NULL THEN
        SELECT c.id INTO v_coa_piutang_id FROM finance.m_coa c
        WHERE c.parent_id = (SELECT p.id FROM finance.m_coa p WHERE p.kode_akun = '1200' LIMIT 1)
        ORDER BY c.kode_akun LIMIT 1;
    END IF;

    SELECT c.id INTO v_coa_pendapatan_id FROM finance.m_coa c WHERE c.kode_akun = '4100' LIMIT 1;
    IF v_coa_pendapatan_id IS NULL THEN
        SELECT c.id INTO v_coa_pendapatan_id FROM finance.m_coa c WHERE c.nama_akun ILIKE '%Pendapatan Jasa%' LIMIT 1;
    END IF;
    IF v_coa_pendapatan_id IS NULL THEN
        SELECT c.id INTO v_coa_pendapatan_id FROM finance.m_coa c WHERE c.kode_akun LIKE '41%' ORDER BY c.kode_akun LIMIT 1;
    END IF;
    IF v_coa_pendapatan_id IS NULL THEN
        RAISE EXCEPTION 'Backfill dibatalkan: akun pendapatan (4100) tidak ditemukan di finance.m_coa';
    END IF;

    -- ------------------------------------------------------------------------
    -- Loop order yang memiliki nominal dan BELUM punya jurnal
    -- Guard 1 (query): referensi_id belum dipakai jurnal mana pun
    -- Guard 2 (loop): no_bukti = order_number belum ada (anti jurnal ganda)
    -- ------------------------------------------------------------------------
    FOR v_order IN
        SELECT *
        FROM sales.t_sales_order o
        WHERE (COALESCE(o.jumlah_cash, 0) > 0 OR COALESCE(o.jumlah_piutang, 0) > 0)
          AND NOT EXISTS (
              SELECT 1 FROM finance.t_journal j
              WHERE j.referensi_id = o.id OR j.no_bukti = o.order_number
          )
        ORDER BY o.created_at
    LOOP
        v_total_debit := COALESCE(v_order.jumlah_cash, 0) + COALESCE(v_order.jumlah_piutang, 0);
        v_tanggal_jurnal := (v_order.created_at AT TIME ZONE 'Asia/Jakarta')::date;

        -- Nomor jurnal: JRN-MMYY-NNNNN, cari slot bebas
        v_journal_id := gen_random_uuid();
        v_try := 0;
        LOOP
            v_try := v_try + 1;
            v_journal_number := 'JRN-' || TO_CHAR(v_tanggal_jurnal, 'MMYY') || '-'
                                || LPAD(v_try::TEXT, 5, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number
            );
        END LOOP;

        INSERT INTO finance.t_journal (
            id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
        ) VALUES (
            v_journal_id,
            v_order.order_number,
            v_tanggal_jurnal,
            'Pencatatan otomatis atas Sales Order: ' || v_order.order_number,
            v_order.id,
            v_journal_number,
            v_order.created_at,
            v_order.created_at
        );

        IF COALESCE(v_order.jumlah_cash, 0) > 0 THEN
            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_journal_id, v_coa_cash_id,
                v_order.jumlah_cash, 0, v_order.created_at, v_order.created_at
            );
        END IF;

        IF COALESCE(v_order.jumlah_piutang, 0) > 0 THEN
            IF v_coa_piutang_id IS NULL THEN
                RAISE EXCEPTION 'Backfill dibatalkan: order % memiliki piutang tetapi COA piutang (1201) tidak ditemukan', v_order.order_number;
            END IF;

            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), v_journal_id, v_coa_piutang_id,
                v_order.jumlah_piutang, 0, v_order.created_at, v_order.created_at
            );

            SELECT nama INTO v_nama_pelanggan
            FROM sales.t_membership
            WHERE id = v_order.id_pelanggan;

            IF v_nama_pelanggan IS NULL THEN
                v_nama_pelanggan := 'Pelanggan Umum';
            END IF;

            INSERT INTO finance.t_utang_piutang (
                id, tanggal_awal, jatuh_tempo, nominal, klien, deskripsi,
                kas, coa, tipe, overdue
            ) VALUES (
                gen_random_uuid(),
                v_tanggal_jurnal,
                v_tanggal_jurnal + (COALESCE(v_order.terms_of_payment, 0) || ' days')::INTERVAL,
                v_order.jumlah_piutang,
                v_nama_pelanggan,
                'Piutang dari Sales Order: ' || v_order.order_number,
                NULL,
                v_coa_piutang_id,
                'piutang',
                0
            );
        END IF;

        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), v_journal_id, v_coa_pendapatan_id,
            0, v_total_debit, v_order.created_at, v_order.created_at
        );

        v_count_backfilled := v_count_backfilled + 1;
        RAISE NOTICE 'Backfill: % (tanggal %, debit %) -> jurnal %',
            v_order.order_number, v_tanggal_jurnal, v_total_debit, v_journal_number;
    END LOOP;

    RAISE NOTICE 'Backfill selesai: % Sales Order diproses.', v_count_backfilled;
END $$;
