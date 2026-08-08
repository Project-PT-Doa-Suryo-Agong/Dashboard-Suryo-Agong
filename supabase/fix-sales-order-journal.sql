-- ============================================================================
-- FIX: Sales Order -> Jurnal Finance
-- ----------------------------------------------------------------------------
-- [FASE 8 AMEND] Baris piutang dari Sales Order ditulis dengan kas = 'tidak'
-- (sebelumnya NULL). Tujuan:
--   - Dashboard RPC menghitung piutang via kas = 'tidak' (baris kas NULL tak
--     terlihat) -> piutang kredit sales tetap terpantau.
--   - Trigger fase-4 tetap meng-skip baris ini (guard deskripsi
--     'Piutang dari Sales Order:%' tidak berubah) -> tidak ada jurnal ganda.
--   - Pelunasan piutang sales (kas 'tidak' -> 'kas tunai') tetap memicu
--     jurnal pelunasan + cashflow dari trigger fase-4.
-- 1. sales.handle_sales_order_to_journal():
--    - Tanggal jurnal = tanggal transaksi Sales Order (created_at, WIB),
--      bukan CURRENT_DATE, agar histori laporan tetap benar.
--    - Resolusi COA dengan fallback ke akun EXISTING:
--        cash     -> NEW.coa_cash_id  ?? 1102 "Kas Operasional"   ?? anak 1100
--        piutang  -> NEW.coa_credit_id ?? 1201 "Piutang Usaha"    ?? anak 1200
--        pendapatan -> 4100 "Pendapatan Jasa" ?? prefix 41
--    - RAISE EXCEPTION jika COA tetap tidak ditemukan (tidak pernah gagal
--      diam-diam).
--    - Guard idempotency: skip jika jurnal dengan no_bukti = order_number
--      sudah ada.
-- 2. sales.handle_sales_order_to_cashflow():
--    - Income hanya jumlah_cash (bukan cash + piutang) agar Arus Kas tidak
--      menggelembung pada penjualan kredit. Baris 0 tidak lagi dibuat.
-- 3. Trigger CONSTRAINT terpasang ulang (DROP + CREATE, idempotent).
--
-- Cara pakai: jalankan di Supabase SQL Editor. Aman dijalankan ulang.
-- ============================================================================

CREATE OR REPLACE FUNCTION sales.handle_sales_order_to_journal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = finance, sales, core, public
AS $$
DECLARE
    v_journal_id       UUID;
    v_journal_number   TEXT;
    v_tanggal_jurnal   DATE;
    v_coa_cash_id      UUID;
    v_coa_piutang_id   UUID;
    v_coa_pendapatan_id UUID;
    v_total_debit      NUMERIC := 0;
    v_nama_pelanggan   TEXT;
    v_try              INTEGER := 0;
BEGIN
    -- Skip jika tidak ada nominal yang perlu dicatat (hindari jurnal kosong)
    IF (COALESCE(NEW.jumlah_cash, 0) + COALESCE(NEW.jumlah_piutang, 0)) <= 0 THEN
        RETURN NULL;
    END IF;

    -- Idempotency: jurnal untuk order ini sudah pernah dibuat
    IF EXISTS (SELECT 1 FROM finance.t_journal WHERE no_bukti = NEW.order_number) THEN
        RETURN NULL;
    END IF;

    -- Tanggal jurnal = tanggal transaksi Sales Order (zona Asia/Jakarta),
    -- bukan CURRENT_DATE, agar histori laporan tetap benar.
    v_tanggal_jurnal := (NEW.created_at AT TIME ZONE 'Asia/Jakarta')::date;

    -- ========================================================================
    -- 1. Resolusi COA DEBIT TUNAI (hanya jika jumlah_cash > 0)
    -- ========================================================================
    IF COALESCE(NEW.jumlah_cash, 0) > 0 THEN
        v_coa_cash_id := NEW.coa_cash_id;

        IF v_coa_cash_id IS NULL THEN
            SELECT c.id INTO v_coa_cash_id
            FROM finance.m_coa c
            WHERE c.kode_akun = '1102'
            LIMIT 1;
        END IF;

        IF v_coa_cash_id IS NULL THEN
            SELECT c.id INTO v_coa_cash_id
            FROM finance.m_coa c
            WHERE c.nama_akun ILIKE '%Kas Operasional%'
            LIMIT 1;
        END IF;

        IF v_coa_cash_id IS NULL THEN
            SELECT c.id INTO v_coa_cash_id
            FROM finance.m_coa c
            WHERE c.parent_id = (SELECT p.id FROM finance.m_coa p WHERE p.kode_akun = '1100' LIMIT 1)
            ORDER BY c.kode_akun
            LIMIT 1;
        END IF;

        IF v_coa_cash_id IS NULL THEN
            RAISE EXCEPTION 'COA kas tidak ditemukan untuk Sales Order % (jumlah_cash = %)',
                NEW.order_number, NEW.jumlah_cash;
        END IF;

        v_total_debit := v_total_debit + NEW.jumlah_cash;
    END IF;

    -- ========================================================================
    -- 2. Resolusi COA DEBIT PIUTANG (hanya jika jumlah_piutang > 0)
    -- ========================================================================
    IF COALESCE(NEW.jumlah_piutang, 0) > 0 THEN
        v_coa_piutang_id := NEW.coa_credit_id;

        IF v_coa_piutang_id IS NULL THEN
            SELECT c.id INTO v_coa_piutang_id
            FROM finance.m_coa c
            WHERE c.kode_akun = '1201'
            LIMIT 1;
        END IF;

        IF v_coa_piutang_id IS NULL THEN
            SELECT c.id INTO v_coa_piutang_id
            FROM finance.m_coa c
            WHERE c.nama_akun ILIKE '%Piutang Usaha%'
            LIMIT 1;
        END IF;

        IF v_coa_piutang_id IS NULL THEN
            SELECT c.id INTO v_coa_piutang_id
            FROM finance.m_coa c
            WHERE c.parent_id = (SELECT p.id FROM finance.m_coa p WHERE p.kode_akun = '1200' LIMIT 1)
            ORDER BY c.kode_akun
            LIMIT 1;
        END IF;

        IF v_coa_piutang_id IS NULL THEN
            RAISE EXCEPTION 'COA piutang tidak ditemukan untuk Sales Order % (jumlah_piutang = %)',
                NEW.order_number, NEW.jumlah_piutang;
        END IF;

        v_total_debit := v_total_debit + NEW.jumlah_piutang;
    END IF;

    -- ========================================================================
    -- 3. Resolusi akun PENDAPATAN (akun EXISTING saja, tanpa hardcode 4001)
    -- ========================================================================
    SELECT c.id INTO v_coa_pendapatan_id
    FROM finance.m_coa c
    WHERE c.kode_akun = '4100'
    LIMIT 1;

    IF v_coa_pendapatan_id IS NULL THEN
        SELECT c.id INTO v_coa_pendapatan_id
        FROM finance.m_coa c
        WHERE c.nama_akun ILIKE '%Pendapatan Jasa%'
        LIMIT 1;
    END IF;

    IF v_coa_pendapatan_id IS NULL THEN
        SELECT c.id INTO v_coa_pendapatan_id
        FROM finance.m_coa c
        WHERE c.kode_akun LIKE '41%'
        ORDER BY c.kode_akun
        LIMIT 1;
    END IF;

    IF v_coa_pendapatan_id IS NULL THEN
        RAISE EXCEPTION 'Akun pendapatan (4100) tidak ditemukan di finance.m_coa';
    END IF;

    -- ========================================================================
    -- 4. Nomor jurnal: JRN-MMYY-NNNNN, cari slot bebas (count-based)
    -- ========================================================================
    v_journal_id := gen_random_uuid();

    LOOP
        v_try := v_try + 1;
        v_journal_number := 'JRN-' || TO_CHAR(v_tanggal_jurnal, 'MMYY') || '-'
                            || LPAD(v_try::TEXT, 5, '0');
        EXIT WHEN NOT EXISTS (
            SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number
        );
    END LOOP;

    -- ========================================================================
    -- 5. Insert header jurnal
    -- ========================================================================
    INSERT INTO finance.t_journal (
        id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
    ) VALUES (
        v_journal_id,
        NEW.order_number,
        v_tanggal_jurnal,
        'Pencatatan otomatis atas Sales Order: ' || NEW.order_number,
        NEW.id,
        v_journal_number,
        NEW.created_at,
        NEW.created_at
    );

    -- ========================================================================
    -- 6. Insert line item DEBIT (1): Cash / Tunai
    -- ========================================================================
    IF COALESCE(NEW.jumlah_cash, 0) > 0 THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            v_coa_cash_id,
            NEW.jumlah_cash,
            0,
            NEW.created_at,
            NEW.created_at
        );
    END IF;

    -- ========================================================================
    -- 7. Insert line item DEBIT (2): Piutang + tabel t_utang_piutang
    -- ========================================================================
    IF COALESCE(NEW.jumlah_piutang, 0) > 0 THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            v_coa_piutang_id,
            NEW.jumlah_piutang,
            0,
            NEW.created_at,
            NEW.created_at
        );

        SELECT nama INTO v_nama_pelanggan
        FROM sales.t_membership
        WHERE id = NEW.id_pelanggan;

        IF v_nama_pelanggan IS NULL THEN
            v_nama_pelanggan := 'Pelanggan Umum';
        END IF;

        INSERT INTO finance.t_utang_piutang (
            id,
            tanggal_awal,
            jatuh_tempo,
            nominal,
            klien,
            deskripsi,
            kas,
            coa,
            tipe,
            overdue
        ) VALUES (
            gen_random_uuid(),
            v_tanggal_jurnal,
            v_tanggal_jurnal + (COALESCE(NEW.terms_of_payment, 0) || ' days')::INTERVAL,
            NEW.jumlah_piutang,
            v_nama_pelanggan,
            'Piutang dari Sales Order: ' || NEW.order_number,
            'tidak', -- [FASE 8] kas = 'tidak' (bukan NULL): terhitung di dashboard & tetap di-skip fase-4
            v_coa_piutang_id,
            'piutang',
            0
        );
    END IF;

    -- ========================================================================
    -- 8. Insert line item KREDIT: Pendapatan Penjualan
    -- ========================================================================
    INSERT INTO finance.t_journal_item (
        id, journal_id, coa_id, debit, kredit, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_journal_id,
        v_coa_pendapatan_id,
        0,
        v_total_debit,
        NEW.created_at,
        NEW.created_at
    );

    RAISE NOTICE 'Jurnal Sales Order % dibuat (tanggal %, debit %)',
        NEW.order_number, v_tanggal_jurnal, v_total_debit;

    RETURN NULL;
END;
$$;

ALTER FUNCTION sales.handle_sales_order_to_journal() OWNER TO postgres;

-- ============================================================================
-- Trigger cashflow: income hanya jumlah_cash (penjualan tunai riil)
-- ============================================================================
CREATE OR REPLACE FUNCTION sales.handle_sales_order_to_cashflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = finance, sales, core, public
AS $$
DECLARE
    v_actual_amount NUMERIC;
    v_target_coa_id UUID;
BEGIN
    -- Hanya tunai yang merupakan penerimaan kas riil (piutang bukan kas masuk)
    v_actual_amount := ABS(COALESCE(NEW.jumlah_cash, 0));

    IF v_actual_amount <= 0 THEN
        RETURN NULL;
    END IF;

    -- Target COA: coa_cash_id -> coa_credit_id -> default 1102 (existing)
    v_target_coa_id := COALESCE(NEW.coa_cash_id, NEW.coa_credit_id);

    IF v_target_coa_id IS NULL THEN
        SELECT c.id INTO v_target_coa_id
        FROM finance.m_coa c
        WHERE c.kode_akun = '1102'
        LIMIT 1;
    END IF;

    INSERT INTO finance.t_cashflow (
        id,
        tipe,
        amount,
        keterangan,
        created_at,
        updated_at,
        journal_id,
        coa_id,
        tipe_kas
    ) VALUES (
        gen_random_uuid(),
        'income',
        v_actual_amount,
        'Penerimaan kas otomatis dari Order: ' || COALESCE(NEW.order_number, 'Tanpa Nomor'),
        NOW(),
        NOW(),
        NULL,
        v_target_coa_id,
        'besar'
    );

    RETURN NULL;
END;
$$;

ALTER FUNCTION sales.handle_sales_order_to_cashflow() OWNER TO postgres;

-- ============================================================================
-- Pasang ulang trigger (DROP + CREATE agar idempotent & re-run aman)
-- trg_sales_to_cashflow (finance.fn_sales_to_cashflow) ikut dihapus secara
-- defensif: trigger lama dari automation-cashflow-trigger.sql /
-- fix-sales-order-finance-trigger-permissions.sql bisa menyebabkan
-- DOUBLE POSTING cashflow jika pernah ter-deploy.
-- ============================================================================
DROP TRIGGER IF EXISTS trg_sales_to_cashflow ON sales.t_sales_order;
DROP TRIGGER IF EXISTS trigger_sales_order_to_journal ON sales.t_sales_order;
DROP TRIGGER IF EXISTS trigger_sales_order_to_cashflow ON sales.t_sales_order;

CREATE CONSTRAINT TRIGGER trigger_sales_order_to_journal
    AFTER INSERT ON sales.t_sales_order
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION sales.handle_sales_order_to_journal();

CREATE CONSTRAINT TRIGGER trigger_sales_order_to_cashflow
    AFTER INSERT ON sales.t_sales_order
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION sales.handle_sales_order_to_cashflow();
