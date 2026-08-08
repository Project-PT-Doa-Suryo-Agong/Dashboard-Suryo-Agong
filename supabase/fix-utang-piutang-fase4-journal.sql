-- ============================================================================
-- FASE 4 - JURNAL OTOMATIS UTANG/PIUTANG (UTANG-PIUTANG MODULE)
-- ----------------------------------------------------------------------------
-- 1. Trigger INSERT finance.t_utang_piutang:
--      piutang / utang / kasbon  -> jurnal + journal_item (+cashflow bila transaksi kas)
--    Guard biar piutang yang digenerate otomatis dari Sales Order TIDAK
--    membuat jurnal kedua (kas IS NULL DAN/ATAU deskripsi dari sales trigger).
-- 2. Trigger UPDATE (pelunasan):
--      KONDISI BARU: OLD.kas IS DISTINCT FROM NEW.kas AND NEW.kas = 'kas tunai'
--      (hanya berjalan saat status kas benar-benar berubah MENJADI lunas).
--      Buat jurnal + item + cashflow di transaksi yang sama.
--      Tipe "kasbon" di-SKIP (settlement lewat potongan payroll, bukan kas masuk).
-- 3. Idempotent: DROP TRIGGER IF EXISTS + CREATE OR REPLACE FUNCTION.
-- 4. Semua fungsi SECURITY DEFINER mengikuti pola Sales/Monetization journal.
-- [FASE 8 AMEND]
--   a. Kasbon yang dicatat langsung lunas (kas = 'kas tunai') TETAP membuat
--      jurnal + cashflow: uang sudah keluar saat pencairan, pelunasan lewat
--      potongan payroll (trigger pelunasan tetap skip kasbon).
--   b. Fallback COA kasbon = 1202 Piutang Karyawan (bukan 1201 Piutang Usaha).
-- ============================================================================

-- ============================================================================
-- 1) TRIGGER INSERT --- finance.fn_create_utang_piutang_journal()
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.fn_create_utang_piutang_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO finance, core, public
AS $$
DECLARE
    v_journal_id uuid;
    v_journal_number text;
    v_no_bukti text;
    v_coa_debit uuid;
    v_coa_kredit uuid;
    v_has_cashflow boolean := false;
    v_cashflow_tipe finance.cashflow_type;
BEGIN
    -- Guard nominal: hindari jurnal kosong (t_journal_item chk_balance).
    IF COALESCE(NEW.nominal, 0) <= 0 THEN
        RETURN NEW;
    END IF;

    -- ── GUARD SUMBER SALES ORDER ─────────────────────────────────────────
    -- Piutang yang dibuat oleh sales.handle_sales_order_to_journal() selalu
    -- berupa kas = NULL dan deskripsi 'Piutang dari Sales Order: <no>' PLUS
    -- jurnal penjualan (Dr. Piutang / Cr. Pendapatan) sudah dibuat oleh
    -- sales trigger. Jangan buat jurnal kedua untuk baris ini.
    IF NEW.kas IS NULL
        OR NEW.deskripsi LIKE 'Piutang dari Sales Order:%'
    THEN
        RETURN NEW;
    END IF;

    -- Anti-duplikasi: jurnal utk record ini sudah pernah dibuat
    IF EXISTS (SELECT 1 FROM finance.t_journal WHERE referensi_id = NEW.id) THEN
        RETURN NEW;
    END IF;

    -- [FASE 8] Kasbon langsung lunas tetap di-jurnal: kas sudah keluar saat
    -- pencairan (Dr Piutang Karyawan / Cr Kas) + cashflow. Settlement lewat
    -- potongan payroll di-handle trigger pelunasan (yang skip kasbon) dan
    -- trigger payroll (split bruto/neto).

    -- ── Resolusi COA per tipe ─────────────────────────────────────────────
    IF NEW.tipe = 'piutang' THEN
        SELECT c.id INTO v_coa_debit   FROM finance.m_coa c WHERE c.id = NEW.coa;
        IF v_coa_debit IS NULL THEN
            SELECT c.id INTO v_coa_debit FROM finance.m_coa c WHERE c.kode_akun = '1201' LIMIT 1;
        END IF;
        SELECT c.id INTO v_coa_kredit FROM finance.m_coa c WHERE c.kode_akun = '4100' LIMIT 1;

        IF NEW.kas = 'kas tunai' THEN
            -- sudah lunas sejak input (penjualan langsung) → Dr Kas / Cr Pendapatan
            SELECT c.id INTO v_coa_debit FROM finance.m_coa c WHERE c.kode_akun = '1102' LIMIT 1;
            v_has_cashflow := true;
            v_cashflow_tipe := 'income'::finance.cashflow_type;
        END IF;

    ELSIF NEW.tipe = 'utang' THEN
        SELECT c.id INTO v_coa_kredit FROM finance.m_coa c WHERE c.id = NEW.coa;
        IF v_coa_kredit IS NULL THEN
            SELECT c.id INTO v_coa_kredit FROM finance.m_coa c WHERE c.kode_akun = '2101' LIMIT 1;
        END IF;
        -- Keputusan user: default debit utang = 5102 Beban Operasional
        SELECT c.id INTO v_coa_debit FROM finance.m_coa c WHERE c.kode_akun = '5102' LIMIT 1;

        IF NEW.kas = 'kas tunai' THEN
            -- dibayar saat pencatatan → Dr Beban / Cr Kas
            SELECT c.id INTO v_coa_kredit FROM finance.m_coa c WHERE c.kode_akun = '1102' LIMIT 1;
            v_has_cashflow := true;
            v_cashflow_tipe := 'expense'::finance.cashflow_type;
        END IF;

    ELSIF NEW.tipe = 'kasbon' THEN
        -- Uang keluar ke karyawan → Dr (Kasbon via coa/1202) / Cr Kas (1102)
        SELECT c.id INTO v_coa_debit FROM finance.m_coa c WHERE c.id = NEW.coa;
        IF v_coa_debit IS NULL THEN
            -- [FASE 8] Fallback 1202 Piutang Karyawan (bukan 1201)
            SELECT c.id INTO v_coa_debit FROM finance.m_coa c WHERE c.kode_akun = '1202' LIMIT 1;
        END IF;
        SELECT c.id INTO v_coa_kredit FROM finance.m_coa c WHERE c.kode_akun = '1102' LIMIT 1;
        v_has_cashflow := true;
        v_cashflow_tipe := 'expense'::finance.cashflow_type;
    END IF;

    -- Validasi COA — jangan bentrok transaksi bila akun tidak terdaftar
    IF v_coa_debit IS NULL OR v_coa_kredit IS NULL THEN
        RAISE WARNING 'Fase4-INSERT-UP: jurnal % (klien %) tdk dibuat karena COA tidak ditemukan.', NEW.tipe, NEW.klien;
        RETURN NEW;
    END IF;

    -- ── Header journal ────────────────────────────────────────────────────
    v_journal_id := gen_random_uuid();
    v_journal_number := LEFT('JRN-' || TO_CHAR(NEW.tanggal_awal, 'MMYY') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 5), 24);
    v_no_bukti := LEFT('UP-' || NEW.id::TEXT, 50);

    INSERT INTO finance.t_journal (id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at)
    VALUES (
        v_journal_id,
        v_no_bukti,
        NEW.tanggal_awal,
        'Pencatatan otomatis ' || NEW.tipe || ' - ' || COALESCE(NEW.klien, '-'),
        NEW.id,
        v_journal_number,
        NOW(),
        NOW()
    );

    -- ── Jurnal item ───────────────────────────────────────────────────────
    INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
    VALUES (gen_random_uuid(), v_journal_id, v_coa_debit,  NEW.nominal, 0,          NOW(), NOW()),
           (gen_random_uuid(), v_journal_id, v_coa_kredit, 0,          NEW.nominal, NOW(), NOW());

    -- ── Cashflow (transaksi bersama dalam trigger yg sama) ────────────────
    IF v_has_cashflow THEN
        INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, created_at, updated_at)
        VALUES (v_cashflow_tipe, NEW.nominal, 'Otomatis ' || NEW.tipe || ' - ' || COALESCE(NEW.klien, '-'), v_journal_id, NOW(), NOW());
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION finance.fn_create_utang_piutang_journal() OWNER TO postgres;

-- ============================================================================
-- 2) TRIGGER UPDATE (PELUNASAN) --- finance.handle_pelunasan_piutang_to_journal()
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.handle_pelunasan_piutang_to_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO finance, core, public
AS $$
DECLARE
    v_journal_id uuid;
    v_journal_number text;
    v_no_bukti text;
    v_coa_kas uuid;
    v_coa_lawan uuid;
    v_keterangan text;
    v_exists boolean;
    v_cashflow_tipe finance.cashflow_type;
BEGIN
    -- Kondisi baru: kas BERUBAH (OLD IS DISTINCT FROM NEW) DAN berubah menjadi lunas
    IF OLD.kas IS DISTINCT FROM NEW.kas AND NEW.kas = 'kas tunai' THEN

        -- Kasbon diselesaikan lewat potongan payroll → TIDAK boleh membuat
        -- jurnal penerimaan kas / cashflow tambahan.
        IF NEW.tipe = 'kasbon' THEN
            RETURN NEW;
        END IF;

        -- Anti-duplikasi
        SELECT EXISTS (
            SELECT 1 FROM finance.t_journal
            WHERE referensi_id = NEW.id AND keterangan LIKE 'Pelunasan otomatis %'
        ) INTO v_exists;
        IF v_exists THEN
            RETURN NEW;
        END IF;

        -- Akun lawan: piutang atau utang sesuai tipe
        IF NEW.tipe = 'utang' THEN
            v_cashflow_tipe := 'expense'::finance.cashflow_type;
            v_keterangan    := 'Pelunasan otomatis atas utang kepada: ' || COALESCE(NEW.klien, '-');
        ELSE
            v_cashflow_tipe := 'income'::finance.cashflow_type;
            v_keterangan    := 'Pelunasan otomatis atas piutang klien: ' || COALESCE(NEW.klien, 'Pelanggan Umum');
        END IF;

        -- Kas / lawan utang atau piutang menyusun COA, pakai fallback deterministik
        SELECT c.id INTO v_coa_kas FROM finance.m_coa c WHERE c.kode_akun = '1102' LIMIT 1;

        SELECT c.id INTO v_coa_lawan FROM finance.m_coa c WHERE c.id = NEW.coa;
        IF v_coa_lawan IS NULL THEN
            IF NEW.tipe = 'utang' THEN
                SELECT c.id INTO v_coa_lawan FROM finance.m_coa c WHERE c.kode_akun = '2101' LIMIT 1;
            ELSE
                SELECT c.id INTO v_coa_lawan FROM finance.m_coa c WHERE c.kode_akun = '1201' LIMIT 1;
            END IF;
        END IF;

        IF v_coa_kas IS NULL OR v_coa_lawan IS NULL THEN
            RAISE WARNING 'Pelunasan otomatis (id %) lemah karena COA kas/lawan tidak ditemukan.', NEW.id;
            RETURN NEW;
        END IF;

        v_journal_id := gen_random_uuid();
        v_journal_number := LEFT('JRN-' || TO_CHAR(CURRENT_DATE, 'MMYY') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 5), 30);
        v_no_bukti := LEFT(COALESCE(NEW.deskripsi, 'Lunas'), 45) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 4);

        INSERT INTO finance.t_journal (id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at)
        VALUES (
            v_journal_id,
            v_no_bukti,
            CURRENT_DATE,
            v_keterangan,
            NEW.id,
            v_journal_number,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;

        IF FOUND THEN
            IF NEW.tipe = 'utang' THEN
                -- Pembayaran utang → Dr Utang / Cr Kas
                INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
                VALUES (gen_random_uuid(), v_journal_id, v_coa_lawan, NEW.nominal, 0,          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
                VALUES (gen_random_uuid(), v_journal_id, v_coa_kas,   0,          NEW.nominal, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            ELSE
                -- Penerimaan piutang → Dr Kas / Cr Piutang
                INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
                VALUES (gen_random_uuid(), v_journal_id, v_coa_kas,   NEW.nominal, 0,          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
                INSERT INTO finance.t_journal_item (id, journal_id, coa_id, debit, kredit, created_at, updated_at)
                VALUES (gen_random_uuid(), v_journal_id, v_coa_lawan, 0,          NEW.nominal, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            END IF;

            -- Cashflow dalam transaksi yang sama
            IF COALESCE(NEW.nominal, 0) > 0 THEN
                INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id, created_at, updated_at)
                VALUES (v_cashflow_tipe, NEW.nominal, v_keterangan, v_journal_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION finance.handle_pelunasan_piutang_to_journal() OWNER TO postgres;

-- ============================================================================
-- 3) PASANG TRIGGER (idempotent)
-- ============================================================================
DROP TRIGGER IF EXISTS trg_create_utang_piutang_journal ON finance.t_utang_piutang;
CREATE TRIGGER trg_create_utang_piutang_journal
    AFTER INSERT ON finance.t_utang_piutang
    FOR EACH ROW
    EXECUTE FUNCTION finance.fn_create_utang_piutang_journal();

DROP TRIGGER IF EXISTS trigger_pelunasan_piutang_to_journal ON finance.t_utang_piutang;
CREATE TRIGGER trigger_pelunasan_piutang_to_journal
    AFTER UPDATE ON finance.t_utang_piutang
    FOR EACH ROW
    EXECUTE FUNCTION finance.handle_pelunasan_piutang_to_journal();

-- ============================================================================
-- 4) GRANT
-- ============================================================================
GRANT EXECUTE ON FUNCTION finance.fn_create_utang_piutang_journal() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION finance.handle_pelunasan_piutang_to_journal() TO authenticated, service_role;