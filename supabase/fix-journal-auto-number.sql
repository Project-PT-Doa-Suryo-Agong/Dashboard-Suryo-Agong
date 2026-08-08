

BEGIN;

-- ============================================================================
-- 1. UPDATE: finance.fn_create_journal_entry()
--    Tambah auto-generate journal_number dengan format JRN-MMYY-NNNNN
--    dan idempotency check (skip jika jurnal referensi_id sudah ada)
-- [FASE 8 AMEND] Payroll: split bruto/neto kasbon.
--    Beban gaji dicatat BRUTO (total + potongan_kasbon), kas keluar NETO
--    (total), dan potongan kasbon di-kredit ke COA 1202 Piutang Karyawan
--    (menutup jurnal pencairan kasbon). Cashflow tetap jumlah neto.
--    Bila COA 1202 tidak ditemukan, fallback ke jurnal neto (perilaku lama).
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.fn_create_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'management', 'core', 'public'
AS $$
DECLARE
    v_journal_id    uuid;
    v_coa_debit     uuid;
    v_coa_kredit    uuid;
    v_no_bukti      varchar;
    v_amount        numeric;
    v_ref_id        uuid;
    v_journal_number text;
    v_seq           bigint;
    v_mm            text;
    v_yy            text;
    v_start_month   timestamptz;
    v_next_month    timestamptz;
    -- [FASE 8] Split bruto/neto kasbon payroll
    v_potongan_kasbon numeric;
    v_coa_kasbon      uuid;
BEGIN

    -- -----------------------------------------------------------------------
    -- STEP 1: Tentukan no_bukti, coa, amount, ref_id berdasarkan tabel sumber
    -- -----------------------------------------------------------------------
    IF (TG_TABLE_NAME = 't_payroll_history') THEN
        v_no_bukti   := 'PAY-' || NEW.employee_id || '-' || TO_CHAR(NEW.bulan, 'YYYYMM');
        v_coa_debit  := NEW.coa_id;
        v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
        v_amount     := NEW.total;
        v_ref_id     := NEW.employee_id;
        -- [FASE 8] Split bruto/neto: beban = total + potongan kasbon
        v_potongan_kasbon := COALESCE(NEW.potongan_kasbon, 0);
        v_coa_kasbon      := (SELECT id FROM finance.m_coa WHERE kode_akun = '1202');

    ELSIF (TG_TABLE_NAME = 't_reimbursement') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti   := 'REI-' || NEW.id;
            v_coa_debit  := NEW.coa_id;
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount     := NEW.amount;
            v_ref_id     := NEW.id;
        ELSE
            RETURN NEW;
        END IF;

    ELSIF (TG_TABLE_NAME = 't_budget_request') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti   := 'BGT-' || NEW.id;
            v_coa_debit  := NEW.coa_id;
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount     := NEW.amount;
            v_ref_id     := NEW.id;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 2: Safety check — skip jika no_bukti tidak tersedia
    -- -----------------------------------------------------------------------
    IF v_no_bukti IS NULL THEN
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 3: Idempotency check — jika jurnal dengan no_bukti ini sudah ada,
    --         jangan buat ulang (mencegah duplikasi saat UPDATE berulang)
    -- -----------------------------------------------------------------------
    IF EXISTS (
        SELECT 1 FROM finance.t_journal WHERE no_bukti = v_no_bukti
    ) THEN
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 4: Safety check — skip jika COA debit atau kredit NULL
    -- -----------------------------------------------------------------------
    IF v_coa_debit IS NULL OR v_coa_kredit IS NULL THEN
        RETURN NEW;
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 5: Auto-generate journal_number — format: JRN-MMYY-NNNNN
    --         Hitung jumlah jurnal yang sudah dibuat bulan ini untuk seq
    -- -----------------------------------------------------------------------
    v_mm          := TO_CHAR(CURRENT_DATE, 'MM');
    v_yy          := TO_CHAR(CURRENT_DATE, 'YY');
    v_start_month := DATE_TRUNC('month', NOW())::timestamptz;
    v_next_month  := (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::timestamptz;

    SELECT COUNT(*) + 1
    INTO v_seq
    FROM finance.t_journal
    WHERE created_at >= v_start_month
      AND created_at  < v_next_month;

    v_journal_number := 'JRN-' || v_mm || v_yy || '-' || LPAD(v_seq::text, 5, '0');

    -- Jika journal_number sudah dipakai (race condition), gunakan uuid suffix
    IF EXISTS (SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number) THEN
        v_journal_number := 'JRN-' || v_mm || v_yy || '-' || LPAD(FLOOR(RANDOM() * 99999 + 1)::text, 5, '0');
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 6: Insert jurnal header dengan journal_number
    -- -----------------------------------------------------------------------
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
    VALUES (
        v_no_bukti,
        CURRENT_DATE,
        'Auto-journal from ' || TG_TABLE_NAME,
        v_ref_id,
        v_journal_number
    )
    RETURNING id INTO v_journal_id;

    -- -----------------------------------------------------------------------
    -- STEP 7: Insert jurnal item (debit/kredit)
    --         [FASE 8] Payroll berpotongan kasbon: Dr beban BRUTO,
    --         Cr kas NETO, Cr 1202 potongan kasbon (menutup pencairan kasbon).
    -- -----------------------------------------------------------------------
    IF TG_TABLE_NAME = 't_payroll_history'
       AND COALESCE(v_potongan_kasbon, 0) > 0
       AND v_coa_kasbon IS NOT NULL THEN
        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_journal_id, v_coa_debit,   v_amount + v_potongan_kasbon, 0),
            (v_journal_id, v_coa_kredit,  0, v_amount),
            (v_journal_id, v_coa_kasbon,  0, v_potongan_kasbon);
    ELSE
        INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
        VALUES
            (v_journal_id, v_coa_debit,  v_amount, 0),
            (v_journal_id, v_coa_kredit, 0, v_amount);
    END IF;

    -- -----------------------------------------------------------------------
    -- STEP 8: Insert cashflow otomatis
    -- -----------------------------------------------------------------------
    INSERT INTO finance.t_cashflow (tipe, amount, keterangan, journal_id)
    VALUES (
        CASE
            WHEN TG_TABLE_NAME = 't_sales_order' THEN 'income'::finance.cashflow_type
            ELSE 'expense'::finance.cashflow_type
        END,
        v_amount,
        'Otomatis: ' || v_no_bukti,
        v_journal_id
    );

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. PASTIKAN TRIGGER YANG BENAR SUDAH TERPASANG
--    (idempoten — aman dijalankan ulang)
-- ============================================================================

-- Trigger untuk payroll → jurnal
DROP TRIGGER IF EXISTS trg_auto_journal_payroll ON finance.t_payroll_history;
CREATE TRIGGER trg_auto_journal_payroll
AFTER INSERT ON finance.t_payroll_history
FOR EACH ROW
EXECUTE FUNCTION finance.fn_create_journal_entry();

-- Trigger untuk reimbursement → jurnal (hanya jika approved)
DROP TRIGGER IF EXISTS trg_auto_journal_reimburse ON finance.t_reimbursement;
CREATE TRIGGER trg_auto_journal_reimburse
AFTER INSERT OR UPDATE ON finance.t_reimbursement
FOR EACH ROW
EXECUTE FUNCTION finance.fn_create_journal_entry();

-- Trigger untuk budget request → jurnal (hanya jika approved)
DROP TRIGGER IF EXISTS trg_auto_journal_budget ON management.t_budget_request;
CREATE TRIGGER trg_auto_journal_budget
AFTER INSERT OR UPDATE ON management.t_budget_request
FOR EACH ROW
EXECUTE FUNCTION finance.fn_create_journal_entry();

-- ============================================================================
-- 3. GRANT (idempoten)
-- ============================================================================
GRANT EXECUTE ON FUNCTION finance.fn_create_journal_entry() TO authenticated, service_role;

COMMIT;
