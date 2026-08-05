CREATE OR REPLACE FUNCTION finance.fn_create_monetization_journal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = finance, sales, core, public
AS $$
DECLARE
    v_journal_id uuid;
    v_coa_kas_bank uuid;
    v_coa_pendapatan_monetasi uuid;
    v_no_bukti varchar;
BEGIN
    -- 1. VALIDASI: Hanya proses jika nilai monetasi > 0
    IF (NEW.monetasi IS NULL OR NEW.monetasi <= 0) THEN
        RETURN NEW;
    END IF;

    -- 1b. ANTI-DUPLIKASI: Jurnal monetasi untuk content statistic ini sudah ada?
    --     (no_bukti = 'MON-' || NEW.id || '-<tanggal>' bersifat UNIQUE di
    --     t_journal, sehingga trigger yang menyala ulang saat EDIT akan kena
    --     constraint t_journal_no_bukti_key / 23505.)
    IF EXISTS (SELECT 1 FROM finance.t_journal WHERE referensi_id = NEW.id) THEN
        RAISE WARNING 'Jurnal monetasi sudah ada untuk content statistic %; lewati pembuatan jurnal.', NEW.id;
        RETURN NEW;
    END IF;

    -- 2. Ambil ID COA dengan pengaman (akun EXISTING: 1101 Kas Kecil, 4101 Pendapatan SaaS)
    SELECT id INTO v_coa_kas_bank FROM finance.m_coa WHERE kode_akun = '1101';
    SELECT id INTO v_coa_pendapatan_monetasi FROM finance.m_coa WHERE kode_akun = '4101';

    -- 3. VALIDASI COA: Jika salah satu COA tidak ditemukan, batalkan proses agar tidak error 23502
    IF (v_coa_kas_bank IS NULL OR v_coa_pendapatan_monetasi IS NULL) THEN
        RAISE WARNING 'Jurnal tidak terbentuk karena Kode Akun 1101 atau 4101 tidak ditemukan di finance.m_coa';
        RETURN NEW;
    END IF;

    -- 4. Persiapan No Bukti
    v_no_bukti := 'MON-' || NEW.id || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- 5. Insert Header Jurnal
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id)
    VALUES (v_no_bukti, CURRENT_DATE, 'Auto-journal Monetasi Konten: ' || NEW.id, NEW.id)
    RETURNING id INTO v_journal_id;

    -- 6. Insert Detail Jurnal (Debit: Kas/Bank)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_coa_kas_bank, NEW.monetasi, 0);

    -- 7. Insert Detail Jurnal (Kredit: Pendapatan)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES (v_journal_id, v_coa_pendapatan_monetasi, 0, NEW.monetasi);

    -- 8. Insert ke Cashflow
    INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id)
    VALUES (
        'income'::finance.cashflow_type,
        NEW.monetasi,
        'Pendapatan Monetasi Konten ID: ' || NEW.id,
        v_journal_id
    );

    RETURN NEW;
END;
$$;

ALTER FUNCTION finance.fn_create_monetization_journal() OWNER TO postgres;
