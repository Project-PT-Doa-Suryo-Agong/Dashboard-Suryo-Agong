-- 1. SALES ORDER -> JOURNAL ---------------------------------------------------
CREATE OR REPLACE FUNCTION "sales"."handle_sales_order_to_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_journal_id UUID;
    v_journal_number TEXT;
    v_coa_pendapatan_id UUID;
    v_keterangan_jurnal TEXT;
    v_total_debit_tercatat NUMERIC := 0;
    v_nama_pelanggan TEXT;
BEGIN
    -- Hanya jalankan jika total_bayar lebih besar dari 0 untuk menghindari jurnal kosong
    IF COALESCE(NEW.total_bayar, 0) <= 0 THEN
        RETURN NULL;
    END IF;

    -- 1. Validasi awal: Cek apakah ada minimal satu COA Debit yang valid untuk dicatat
    IF (COALESCE(NEW.jumlah_cash, 0) > 0 AND NEW.coa_cash_id IS NOT NULL) THEN
        v_total_debit_tercatat := v_total_debit_tercatat + NEW.jumlah_cash;
    END IF;

    IF (COALESCE(NEW.jumlah_piutang, 0) > 0 AND NEW.coa_credit_id IS NOT NULL) THEN
        v_total_debit_tercatat := v_total_debit_tercatat + NEW.jumlah_piutang;
    END IF;

    -- Jika tidak ada akun debit yang bisa dicatat, lewati pembuatan jurnal sepenuhnya
    IF v_total_debit_tercatat <= 0 THEN
        RETURN NULL;
    END IF;

    -- 1b. Siapkan akun pendapatan dari COA EXISTING (4100 Pendapatan Jasa).
    --     Jika tidak ditemukan, batalkan agar jurnal tidak pernah tidak balance
    --     (hapus fallback lama yang memakai coa kas/piutang).
    SELECT id INTO v_coa_pendapatan_id
    FROM finance.m_coa
    WHERE kode_akun = '4100'
    LIMIT 1;

    IF v_coa_pendapatan_id IS NULL THEN
        RAISE WARNING 'Jurnal sales order tidak dibuat karena akun pendapatan 4100 tidak ditemukan di finance.m_coa.';
        RETURN NULL;
    END IF;

    -- 2. Siapkan data ID dan nomor jurnal
    v_journal_id := gen_random_uuid();
    v_journal_number := 'JRN-' || TO_CHAR(CURRENT_DATE, 'MMYY') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    v_keterangan_jurnal := 'Pencatatan otomatis atas Sales Order: ' || NEW.order_number;

    -- 3. UTAMA: Insert ke table Header (finance.t_journal) terlebih dahulu
    INSERT INTO finance.t_journal (
        id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
    ) VALUES (
        v_journal_id,
        NEW.order_number,
        CURRENT_DATE,
        v_keterangan_jurnal,
        NEW.id,
        v_journal_number,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    -- 4. INSERT LINE ITEM DEBIT (1): Cash / Tunai
    IF COALESCE(NEW.jumlah_cash, 0) > 0 AND NEW.coa_cash_id IS NOT NULL THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            NEW.coa_cash_id,
            NEW.jumlah_cash,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );
    END IF;

    -- 5. INSERT LINE ITEM DEBIT (2): Piutang
    IF COALESCE(NEW.jumlah_piutang, 0) > 0 AND NEW.coa_credit_id IS NOT NULL THEN
        INSERT INTO finance.t_journal_item (
            id, journal_id, coa_id, debit, kredit, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            v_journal_id,
            NEW.coa_credit_id,
            NEW.jumlah_piutang,
            0,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        );

        -- =========================================================================
        -- LOGIKA BARU: PENCATATAN KE TABEL UTANG PIUTANG
        -- =========================================================================

        -- Ambil nama pelanggan dari tabel membership
        SELECT nama INTO v_nama_pelanggan FROM sales.t_membership WHERE id = NEW.id_pelanggan;
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
            kas,            -- Menggunakan tipe_kas dari enum/informasi kas jika ada
            coa,            -- FK ke m_coa.id (menggunakan coa_credit_id dari order)
            tipe,           -- Diisi 'piutang' sesuai kebutuhan bisnis
            overdue         -- Default jumlah hari overdue awal (0)
        ) VALUES (
            gen_random_uuid(),
            CURRENT_DATE,
            CURRENT_DATE + (COALESCE(NEW.terms_of_payment, 0) || ' days')::INTERVAL,
            NEW.jumlah_piutang,
            v_nama_pelanggan,
            'Piutang dari Sales Order: ' || NEW.order_number,
            NULL,           -- Kosong karena ini transaksi piutang non-tunai, bukan kas langsung
            NEW.coa_credit_id,
            'piutang',      -- Menandakan baris data ini adalah piutang (bukan utang)
            0
        );
        -- =========================================================================
    END IF;

    -- 6. INSERT LINE ITEM KREDIT: Pendapatan (4100 Pendapatan Jasa)
    INSERT INTO finance.t_journal_item (
        id, journal_id, coa_id, debit, kredit, created_at, updated_at
    ) VALUES (
        gen_random_uuid(),
        v_journal_id,
        v_coa_pendapatan_id,
        0,
        v_total_debit_tercatat,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    RETURN NULL;
END;
$$;

ALTER FUNCTION "sales"."handle_sales_order_to_journal"() OWNER TO "postgres";


-- 2. MONETASI KONTEN -> JOURNAL ----------------------------------------------
CREATE OR REPLACE FUNCTION "finance"."fn_create_monetization_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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

ALTER FUNCTION "finance"."fn_create_monetization_journal"() OWNER TO "postgres";


-- 3. PELUNASAN PIUTANG -> JOURNAL --------------------------------------------
CREATE OR REPLACE FUNCTION "finance"."handle_pelunasan_piutang_to_journal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_journal_id UUID;
    v_journal_number TEXT;
    v_coa_kas_id UUID;
    v_keterangan_jurnal TEXT;
    v_is_exists BOOLEAN;
    v_no_bukti_clean TEXT;
BEGIN
    -- TRIGGER CONDITION: Hanya jalan jika kolom 'kas' berubah dari NULL menjadi ada isinya
    IF OLD.kas IS NULL AND NEW.kas IS NOT NULL THEN

        -- Anti-Duplikasi: Pastikan jurnal untuk pelunasan piutang ini belum pernah dibuat sebelumnya
        SELECT EXISTS(
            SELECT 1 FROM finance.t_journal WHERE referensi_id = NEW.id AND keterangan LIKE 'Pelunasan otomatis%'
        ) INTO v_is_exists;

        IF v_is_exists THEN
            RETURN NEW;
        END IF;

        -- 1. Tentukan ID Akun Kas berdasarkan mapping EKSPLISIT ke akun existing
        --    (enum tipe_kas hanya berisi 'tidak' dan 'kas tunai'; hapus lookup nama
        --    ILIKE '%kas tunai%' yang tidak pernah match).
        IF NEW.kas = 'kas tunai' THEN
            SELECT id INTO v_coa_kas_id FROM finance.m_coa WHERE kode_akun = '1102';
        ELSE
            v_coa_kas_id := NULL;
        END IF;

        -- Jika akun kas tidak ditemukan di master COA, batalkan agar tidak terjadi error balance
        IF v_coa_kas_id IS NULL THEN
            RAISE WARNING 'Jurnal pelunasan tidak dapat dibuat karena akun COA untuk kas % tidak ditemukan.', NEW.kas;
            RETURN NEW;
        END IF;

        -- 2. Siapkan data header jurnal pelunasan
        v_journal_id := gen_random_uuid();

        -- Amankan journal_number (di-cut maksimal 30 karakter agar muat di VARCHAR terkecil)
        v_journal_number := LEFT('JRN-' || TO_CHAR(CURRENT_DATE, 'MMYY') || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 5), 30);

        v_keterangan_jurnal := 'Pelunasan otomatis atas piutang klien: ' || COALESCE(NEW.klien, 'Pelanggan Umum');

        -- Amankan no_bukti (Di-potong tegas menggunakan LEFT agar total string maks 50 karakter)
        v_no_bukti_clean := LEFT(COALESCE(NEW.deskripsi, 'Lunas'), 35) || '-' || SUBSTRING(NEW.id::TEXT FROM 1 FOR 4);

        -- 3. INSERT HEADER: finance.t_journal
        INSERT INTO finance.t_journal (
            id, no_bukti, tanggal, keterangan, referensi_id, journal_number, created_at, updated_at
        ) VALUES (
            v_journal_id,
            v_no_bukti_clean, -- Menggunakan teks yang sudah di-trim/dipotong aman
            CURRENT_DATE,
            v_keterangan_jurnal,
            NEW.id,
            v_journal_number,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        )
        ON CONFLICT (id) DO NOTHING;

        -- Memastikan baris header berhasil masuk sebelum membuat itemnya
        IF FOUND THEN
            -- 4. INSERT LINE ITEM DEBIT: Kas Penjualan
            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                v_journal_id,
                v_coa_kas_id,
                NEW.nominal,
                0,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );

            -- 5. INSERT LINE ITEM KREDIT: Piutang Usaha
            INSERT INTO finance.t_journal_item (
                id, journal_id, coa_id, debit, kredit, created_at, updated_at
            ) VALUES (
                gen_random_uuid(),
                v_journal_id,
                NEW.coa,
                0,
                NEW.nominal,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;

    END IF;

    RETURN NEW;
END;
$$;

ALTER FUNCTION "finance"."handle_pelunasan_piutang_to_journal"() OWNER TO "postgres";