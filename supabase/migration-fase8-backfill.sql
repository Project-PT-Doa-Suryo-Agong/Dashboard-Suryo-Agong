BEGIN;

-- ============================================================================
-- A. KASBON a62a7b43 -> jurnal + cashflow (guard: no_bukti / referensi_id)
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_kasbon_id uuid := 'a62a7b43-2d4d-4a71-8f92-efbb5515f714';
    v_coa_karyawan uuid;
    v_coa_kas      uuid;
BEGIN
    SELECT c.id INTO v_coa_karyawan FROM finance.m_coa c WHERE c.kode_akun = '1202';
    SELECT c.id INTO v_coa_kas      FROM finance.m_coa c WHERE c.kode_akun = '1102';

    IF v_coa_karyawan IS NULL OR v_coa_kas IS NULL THEN
        RAISE NOTICE 'A-SKIP: COA 1202/1102 tidak ditemukan.';
        RETURN;
    END IF;

    -- Perbaiki coa kasbon yang menunjuk akun induk 1200 -> 1202
    UPDATE finance.t_utang_piutang
    SET coa = v_coa_karyawan
    WHERE id = v_kasbon_id
      AND coa IS DISTINCT FROM v_coa_karyawan;

    IF NOT EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = 'UP-' || v_kasbon_id) THEN
        INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
        VALUES (
            'UP-' || v_kasbon_id,
            DATE '2026-07-27',
            'Pencatatan otomatis kasbon - amilil gantenk',
            v_kasbon_id,
            NULL
        )
        RETURNING id INTO v_jid;

        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_jid, v_coa_karyawan, 500000, 0),
            (v_jid, v_coa_kas,      0,      500000);

        IF NOT EXISTS (SELECT 1 FROM finance.t_cashflow WHERE journal_id = v_jid) THEN
            INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, coa_id, tipe_kas, created_at, updated_at)
            VALUES (
                'expense'::finance.cashflow_type,
                500000,
                'Otomatis kasbon - amilil gantenk',
                v_jid,
                v_coa_kas,
                'besar',
                DATE '2026-07-27'::timestamptz + INTERVAL '12 hours',
                NOW()
            );
        END IF;
        RAISE NOTICE 'A-OK: jurnal kasbon dibuat.';
    ELSE
        RAISE NOTICE 'A-SKIP: jurnal kasbon sudah ada.';
    END IF;
END $$;

-- ============================================================================
-- B. PIUTANG c2782584 -> jurnal (guard: no_bukti)
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_piutang_id uuid := 'c2782584-ab7b-4efd-acad-77bc6dab7138';
    v_coa_piutang uuid;
    v_coa_pendapatan uuid;
BEGIN
    SELECT c.id INTO v_coa_piutang    FROM finance.m_coa c WHERE c.kode_akun = '1201';
    SELECT c.id INTO v_coa_pendapatan FROM finance.m_coa c WHERE c.kode_akun = '4100';

    IF v_coa_piutang IS NULL OR v_coa_pendapatan IS NULL THEN
        RAISE NOTICE 'B-SKIP: COA 1201/4100 tidak ditemukan.';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = 'UP-' || v_piutang_id) THEN
        INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
        VALUES (
            'UP-' || v_piutang_id,
            DATE '2026-08-04',
            'Pencatatan otomatis piutang - PT SURYA KENCANA',
            v_piutang_id,
            NULL
        )
        RETURNING id INTO v_jid;

        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_jid, v_coa_piutang,    50000, 0),
            (v_jid, v_coa_pendapatan, 0,     50000);

        RAISE NOTICE 'B-OK: jurnal piutang dibuat.';
    ELSE
        RAISE NOTICE 'B-SKIP: jurnal piutang sudah ada.';
    END IF;
END $$;

-- ============================================================================
-- C. UTANG 1cc29756 -> jurnal (guard: no_bukti)
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_utang_id uuid := '1cc29756-accf-4f91-8c5b-0f5c674540eb';
    v_coa_beban uuid;
    v_coa_utang uuid;
BEGIN
    SELECT c.id INTO v_coa_beban FROM finance.m_coa c WHERE c.kode_akun = '5102';
    SELECT c.id INTO v_coa_utang FROM finance.m_coa c WHERE c.kode_akun = '2101';

    IF v_coa_beban IS NULL OR v_coa_utang IS NULL THEN
        RAISE NOTICE 'C-SKIP: COA 5102/2101 tidak ditemukan.';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = 'UP-' || v_utang_id) THEN
        INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
        VALUES (
            'UP-' || v_utang_id,
            DATE '2026-08-04',
            'Pencatatan otomatis utang - AZIZ',
            v_utang_id,
            NULL
        )
        RETURNING id INTO v_jid;

        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_jid, v_coa_beban, 500000, 0),
            (v_jid, v_coa_utang, 0,      500000);

        RAISE NOTICE 'C-OK: jurnal utang dibuat.';
    ELSE
        RAISE NOTICE 'C-SKIP: jurnal utang sudah ada.';
    END IF;
END $$;

-- ============================================================================
-- D. BUDGET 9cb25f6c (approved, tanpa COA) -> jurnal + cashflow
--    Keputusan bisnis: Dr 5102 Beban Operasional / Cr 1101
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_budget_id uuid := '9cb25f6c-8d26-49ba-a866-f1fcc1ddfcfc';
    v_coa_beban uuid;
    v_coa_kas   uuid;
BEGIN
    SELECT c.id INTO v_coa_beban FROM finance.m_coa c WHERE c.kode_akun = '5102';
    SELECT c.id INTO v_coa_kas   FROM finance.m_coa c WHERE c.kode_akun = '1101';

    IF v_coa_beban IS NULL OR v_coa_kas IS NULL THEN
        RAISE NOTICE 'D-SKIP: COA 5102/1101 tidak ditemukan.';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = 'BGT-' || v_budget_id) THEN
        INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
        VALUES (
            'BGT-' || v_budget_id,
            DATE '2026-07-21',
            'Auto-journal from t_budget_request',
            v_budget_id,
            NULL
        )
        RETURNING id INTO v_jid;

        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_jid, v_coa_beban, 150000, 0),
            (v_jid, v_coa_kas,   0,      150000);

        IF NOT EXISTS (SELECT 1 FROM finance.t_cashflow WHERE journal_id = v_jid) THEN
            INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, coa_id, tipe_kas, created_at, updated_at)
            VALUES (
                'expense'::finance.cashflow_type,
                150000,
                'Otomatis: BGT-' || v_budget_id,
                v_jid,
                v_coa_kas,
                'besar',
                DATE '2026-07-21'::timestamptz + INTERVAL '12 hours',
                NOW()
            );
        END IF;
        RAISE NOTICE 'D-OK: jurnal budget tanpa COA dibuat.';
    ELSE
        RAISE NOTICE 'D-SKIP: jurnal budget sudah ada.';
    END IF;
END $$;

-- ============================================================================
-- E. RECLASS jurnal budget: item debit -> 5102 Beban Operasional
--    (sebelumnya terposting ke 1102 Kas Operasional dan 3000 MODAL)
-- ============================================================================
DO $$
DECLARE
    v_coa_beban uuid;
BEGIN
    SELECT c.id INTO v_coa_beban FROM finance.m_coa c WHERE c.kode_akun = '5102';
    IF v_coa_beban IS NULL THEN
        RAISE NOTICE 'E-SKIP: COA 5102 tidak ditemukan.';
        RETURN;
    END IF;

    -- BGT-12c408f0 (150rb): item debit sebelumnya Dr 1102 Kas Operasional
    UPDATE finance.t_journal_item ji
    SET coa_id = v_coa_beban
    FROM finance.t_journal j
    WHERE j.id = ji.journal_id
      AND j.no_bukti LIKE 'BGT-12c408f0%'
      AND ji.debit = 150000
      AND ji.coa_id = (SELECT c.id FROM finance.m_coa c WHERE c.kode_akun = '1102');

    -- BGT-4db0cf42 (200rb): item debit sebelumnya Dr 3000 MODAL
    UPDATE finance.t_journal_item ji
    SET coa_id = v_coa_beban
    FROM finance.t_journal j
    WHERE j.id = ji.journal_id
      AND j.no_bukti LIKE 'BGT-4db0cf42%'
      AND ji.debit = 200000
      AND ji.coa_id = (SELECT c.id FROM finance.m_coa c WHERE c.kode_akun = '3000');

    RAISE NOTICE 'E-OK: reclass jurnal BGT selesai (idempotent).';
END $$;

-- ============================================================================
-- F. ORD-0726-00002 (280rb, order terhapus) -> jurnal + link cashflow
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_coa_kas uuid;
    v_coa_pendapatan uuid;
BEGIN
    SELECT c.id INTO v_coa_kas         FROM finance.m_coa c WHERE c.kode_akun = '1102';
    SELECT c.id INTO v_coa_pendapatan  FROM finance.m_coa c WHERE c.kode_akun = '4100';

    IF v_coa_kas IS NULL OR v_coa_pendapatan IS NULL THEN
        RAISE NOTICE 'F-SKIP: COA 1102/4100 tidak ditemukan.';
        RETURN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = 'ORD-0726-00002') THEN
        INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
        VALUES (
            'ORD-0726-00002',
            DATE '2026-07-29',
            'Koreksi pendapatan Sales Order ORD-0726-00002 (order terhapus)',
            NULL,
            NULL
        )
        RETURNING id INTO v_jid;

        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_jid, v_coa_kas,        280000, 0),
            (v_jid, v_coa_pendapatan, 0,      280000);

        -- Link cashflow orphan (sudah ada, amount 280000) ke jurnal
        UPDATE finance.t_cashflow
        SET journal_id = v_jid,
            updated_at = NOW()
        WHERE id = 'f51f42bf-0435-4902-9d64-a584555b9676'
          AND journal_id IS NULL;

        RAISE NOTICE 'F-OK: jurnal ORD-0726-00002 dibuat & cashflow di-link.';
    ELSE
        RAISE NOTICE 'F-SKIP: jurnal ORD-0726-00002 sudah ada.';
    END IF;
END $$;

-- ============================================================================
-- G. SPLIT PAYROLL bruto/neto kasbon (PAY-c5dd5cab-...-202607)
--    Dr 5101 3.000.000 -> 3.500.000 + item baru Cr 1202 500.000
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_coa_gaji uuid;
    v_coa_karyawan uuid;
BEGIN
    SELECT c.id INTO v_coa_gaji      FROM finance.m_coa c WHERE c.kode_akun = '5101';
    SELECT c.id INTO v_coa_karyawan  FROM finance.m_coa c WHERE c.kode_akun = '1202';

    IF v_coa_gaji IS NULL OR v_coa_karyawan IS NULL THEN
        RAISE NOTICE 'G-SKIP: COA 5101/1202 tidak ditemukan.';
        RETURN;
    END IF;

    SELECT j.id INTO v_jid
    FROM finance.t_journal j
    WHERE j.no_bukti = 'PAY-c5dd5cab-490f-479e-80e6-f575e98d6998-202607';

    IF v_jid IS NULL THEN
        RAISE NOTICE 'G-SKIP: jurnal payroll 202607 tidak ditemukan.';
        RETURN;
    END IF;

    -- 1) Naikkan beban gaji dari neto (3.000.000) ke bruto (3.500.000)
    UPDATE finance.t_journal_item
    SET debit = 3500000
    WHERE journal_id = v_jid
      AND coa_id = v_coa_gaji
      AND debit = 3000000;

    -- 2) Kredit 1202 atas potongan kasbon (anti-duplikasi)
    IF NOT EXISTS (
        SELECT 1 FROM finance.t_journal_item
        WHERE journal_id = v_jid AND coa_id = v_coa_karyawan AND kredit = 500000
    ) THEN
        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES (v_jid, v_coa_karyawan, 0, 500000);
    END IF;

    RAISE NOTICE 'G-OK: split payroll bruto/neto selesai (idempotent).';
END $$;

-- ============================================================================
-- H. HAPUS DEPRESIASI JULI (2 jurnal AST-DEP 2026-07-01 + 2 schedule)
--    Item ter-cascade, schedule.journal_id ter-set NULL, lalu schedule dihapus.
-- ============================================================================
DO $$
DECLARE
    v_deleted_journal INTEGER;
    v_deleted_sched   INTEGER;
BEGIN
    DELETE FROM finance.t_journal
    WHERE no_bukti LIKE 'AST-DEP-%'
      AND tanggal = DATE '2026-07-01';

    GET DIAGNOSTICS v_deleted_journal = ROW_COUNT;

    DELETE FROM finance.t_asset_depreciation_schedule
    WHERE periode = DATE '2026-07-01';

    GET DIAGNOSTICS v_deleted_sched = ROW_COUNT;

    RAISE NOTICE 'H-OK: % jurnal AST-DEP Juli & % schedule Juli dihapus.', v_deleted_journal, v_deleted_sched;
END $$;

-- ============================================================================
-- I. CLEANUP cashflow amount = 0 (5 baris sales order cash 0)
-- ============================================================================
DO $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM finance.t_cashflow
    WHERE amount = 0
      AND keterangan LIKE 'Penerimaan kas otomatis dari Order:%';

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RAISE NOTICE 'I-OK: % baris cashflow amount 0 dihapus.', v_deleted;
END $$;

-- ============================================================================
-- J. CASHFLOW AKUISISI ASET yang hilang (Laptop 48jt & Meja 10jt)
-- ============================================================================
DO $$
DECLARE
    v_jid uuid;
    v_coa_kas uuid;
BEGIN
    SELECT c.id INTO v_coa_kas FROM finance.m_coa c WHERE c.kode_akun = '1102';
    IF v_coa_kas IS NULL THEN
        RAISE NOTICE 'J-SKIP: COA 1102 tidak ditemukan.';
        RETURN;
    END IF;

    -- Laptop Asus (48jt) -> jurnal 8c9c11eb
    v_jid := '8c9c11eb-4676-4bd5-abbf-bacd4a9febea';
    IF NOT EXISTS (SELECT 1 FROM finance.t_cashflow WHERE journal_id = v_jid) THEN
        INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, coa_id, tipe_kas, created_at, updated_at)
        VALUES (
            'expense'::finance.cashflow_type,
            48000000,
            'Akuisisi Aset Tetap: Laptop Asus (AST-2607-0001)',
            v_jid,
            v_coa_kas,
            'besar',
            DATE '2026-07-28'::timestamptz + INTERVAL '12 hours',
            NOW()
        );
    END IF;

    -- Meja Kantor (10jt) -> jurnal 1a7899f2
    v_jid := '1a7899f2-5ea5-4816-bccb-b4d53b1e04d8';
    IF NOT EXISTS (SELECT 1 FROM finance.t_cashflow WHERE journal_id = v_jid) THEN
        INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, coa_id, tipe_kas, created_at, updated_at)
        VALUES (
            'expense'::finance.cashflow_type,
            10000000,
            'Akuisisi Aset Tetap: Meja Kantor (AST-2607-0002)',
            v_jid,
            v_coa_kas,
            'besar',
            DATE '2026-07-28'::timestamptz + INTERVAL '12 hours',
            NOW()
        );
    END IF;

    RAISE NOTICE 'J-OK: cashflow akuisisi aset selesai (idempotent).';
END $$;

-- ============================================================================
-- K. ISI journal_number untuk jurnal yang masih NULL (JRN-MMYY-NNNNN)
-- ============================================================================
DO $$
DECLARE
    r RECORD;
    v_num TEXT;
    v_seq INTEGER;
BEGIN
    FOR r IN
        SELECT id, tanggal
        FROM finance.t_journal
        WHERE journal_number IS NULL OR journal_number = ''
        ORDER BY tanggal, created_at
    LOOP
        v_seq := 0;
        LOOP
            v_seq := v_seq + 1;
            v_num := 'JRN-' || TO_CHAR(r.tanggal, 'MMYY') || '-' || LPAD(v_seq::TEXT, 5, '0');
            EXIT WHEN NOT EXISTS (
                SELECT 1 FROM finance.t_journal
                WHERE journal_number = v_num AND id <> r.id
            );
        END LOOP;

        UPDATE finance.t_journal
        SET journal_number = v_num,
            updated_at = NOW()
        WHERE id = r.id;
    END LOOP;

    RAISE NOTICE 'K-OK: journal_number kosong diisi (idempotent).';
END $$;

COMMIT;

-- ============================================================================
-- VERIFIKASI CEPAT
-- ============================================================================
SELECT
    (SELECT COUNT(*) FROM finance.t_journal)                                  AS total_jurnal,
    (SELECT COUNT(*) FROM finance.t_journal WHERE journal_number IS NULL)     AS jurnal_tanpa_nomor,
    (SELECT COUNT(*) FROM finance.t_journal_item)                             AS total_item,
    (SELECT COUNT(*) FROM finance.t_cashflow)                                 AS total_cashflow,
    (SELECT COUNT(*) FROM finance.t_cashflow WHERE amount = 0)                AS cashflow_amount_0,
    (SELECT COUNT(*) FROM finance.t_asset_depreciation_schedule)              AS total_schedule_dep;
