SET statement_timeout = '120s';


BEGIN;

-- ============================================================================
-- 1. HELPERS: core.is_strategic() & core.is_admin()
-- ============================================================================
CREATE OR REPLACE FUNCTION core.is_strategic()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND role IN ('Developer', 'Super Admin', 'Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION core.is_admin()
RETURNS BOOLEAN AS $$
  SELECT core.get_user_role() IN ('Developer', 'Management & Strategy', 'Admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 2. TABLE: management.t_max_budget
-- ============================================================================
CREATE TABLE IF NOT EXISTS management.t_max_budget (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    max_amount numeric NOT NULL CHECK (max_amount >= 0),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    CONSTRAINT t_max_budget_pkey PRIMARY KEY (id)
);

ALTER TABLE management.t_max_budget ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read max budget" ON management.t_max_budget;
DROP POLICY IF EXISTS "Strategic can insert max budget" ON management.t_max_budget;
DROP POLICY IF EXISTS "Strategic can update max budget" ON management.t_max_budget;

CREATE POLICY "Authenticated users can read max budget"
ON management.t_max_budget FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Strategic can insert max budget"
ON management.t_max_budget FOR INSERT
TO authenticated
WITH CHECK (core.is_strategic());

CREATE POLICY "Strategic can update max budget"
ON management.t_max_budget FOR UPDATE
TO authenticated
USING (core.is_strategic())
WITH CHECK (core.is_strategic());

-- ============================================================================
-- 3. FUNCTION: public.set_max_budget (RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_max_budget(
    p_amount numeric,
    p_updated_by uuid
) RETURNS management.t_max_budget
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'management', 'core'
    AS $$
DECLARE
    v_row management.t_max_budget;
BEGIN
    IF p_amount < 0 THEN
        RAISE EXCEPTION 'Max budget tidak boleh negatif.';
    END IF;

    UPDATE management.t_max_budget
    SET is_active = false
    WHERE is_active = true;

    INSERT INTO management.t_max_budget (max_amount, updated_by)
    VALUES (p_amount, p_updated_by)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

-- ============================================================================
-- 4. RLS: management.t_budget_request — 4 policies spesifik per command
-- ============================================================================
-- Hapus policy lama (jika ada dari remote schema)
DROP POLICY IF EXISTS "Allow Public Read Access" ON management.t_budget_request;
DROP POLICY IF EXISTS "Mgmt: Budget admin/finance" ON management.t_budget_request;

-- Policy baru — SELECT untuk strategic + managerial roles
CREATE POLICY "Strategic and finance can read budget requests"
ON management.t_budget_request FOR SELECT
TO authenticated
USING (
  core.is_admin()
  OR core.get_user_role() IN ('Management & Strategy', 'Super Admin', 'Finance & Administration')
);

-- Semua authenticated user bisa submit (INSERT)
CREATE POLICY "Authenticated users can submit budget request"
ON management.t_budget_request FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: strategic + managerial (mengikuti authorization API)
CREATE POLICY "Strategic and managerial can update budget requests"
ON management.t_budget_request FOR UPDATE
TO authenticated
USING (
  core.is_admin()
  OR core.get_user_role() IN ('Management & Strategy', 'Super Admin', 'Finance & Administration')
);

-- DELETE: strategic + managerial (mengikuti authorization API)
CREATE POLICY "Strategic and managerial can delete budget requests"
ON management.t_budget_request FOR DELETE
TO authenticated
USING (
  core.is_admin()
  OR core.get_user_role() IN ('Management & Strategy', 'Super Admin', 'Finance & Administration')
);

-- ============================================================================
-- 5. SCHEMA GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA management TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA management TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA management TO service_role;
GRANT EXECUTE ON FUNCTION core.is_strategic() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core.is_admin() TO authenticated, service_role;
GRANT ALL ON TABLE management.t_max_budget TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_max_budget TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA management GRANT ALL ON TABLES TO authenticated, service_role;

-- ============================================================================
-- 6. FUNCTION: finance.fn_create_journal_entry() — SECURITY DEFINER
--    Versi terbaru: mengisi journal_number otomatis (JRN-MMYY-NNNNN)
--    dan memiliki idempotency check untuk mencegah jurnal duplikat
-- ============================================================================
CREATE OR REPLACE FUNCTION finance.fn_create_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'management', 'core', 'public'
AS $$
DECLARE
    v_journal_id     uuid;
    v_coa_debit      uuid;
    v_coa_kredit     uuid;
    v_no_bukti       varchar;
    v_amount         numeric;
    v_ref_id         uuid;
    v_journal_number text;
    v_seq            bigint;
    v_mm             text;
    v_yy             text;
    v_start_month    timestamptz;
    v_next_month     timestamptz;
BEGIN

    -- STEP 1: Tentukan no_bukti, coa, amount, ref_id berdasarkan tabel sumber
    IF (TG_TABLE_NAME = 't_payroll_history') THEN
        v_no_bukti   := 'PAY-' || NEW.employee_id || '-' || TO_CHAR(NEW.bulan, 'YYYYMM');
        v_coa_debit  := NEW.coa_id;
        v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
        v_amount     := NEW.total;
        v_ref_id     := NEW.employee_id;

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

    -- STEP 2: Safety check — skip jika no_bukti tidak tersedia
    IF v_no_bukti IS NULL THEN
        RETURN NEW;
    END IF;

    -- STEP 3: Idempotency check — jika jurnal dengan no_bukti ini sudah ada,
    --         jangan buat ulang (mencegah duplikasi saat UPDATE berulang)
    IF EXISTS (
        SELECT 1 FROM finance.t_journal WHERE no_bukti = v_no_bukti
    ) THEN
        RETURN NEW;
    END IF;

    -- STEP 4: Safety check — skip jika COA NULL
    IF v_coa_debit IS NULL OR v_coa_kredit IS NULL THEN
        RETURN NEW;
    END IF;

    -- STEP 5: Auto-generate journal_number — format: JRN-MMYY-NNNNN
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

    -- Fallback jika journal_number sudah dipakai (race condition)
    IF EXISTS (SELECT 1 FROM finance.t_journal WHERE journal_number = v_journal_number) THEN
        v_journal_number := 'JRN-' || v_mm || v_yy || '-' || LPAD(FLOOR(RANDOM() * 99999 + 1)::text, 5, '0');
    END IF;

    -- STEP 6: Insert jurnal header dengan journal_number
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id, journal_number)
    VALUES (
        v_no_bukti,
        CURRENT_DATE,
        'Auto-journal from ' || TG_TABLE_NAME,
        v_ref_id,
        v_journal_number
    )
    RETURNING id INTO v_journal_id;

    -- STEP 7: Insert jurnal item (debit/kredit)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES
        (v_journal_id, v_coa_debit,  v_amount, 0),
        (v_journal_id, v_coa_kredit, 0, v_amount);

    -- STEP 8: Insert cashflow otomatis
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
-- 7. FUNCTION: public.fn_dashboard_metrics (RPC)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_dashboard_metrics(
    p_start_date date,
    p_end_date date
) RETURNS TABLE(
    total_pendapatan   numeric,
    total_pengeluaran  numeric,
    saldo_bersih       numeric,
    total_budget       numeric,
    budget_terserap    numeric,
    budget_percentage  numeric,
    total_payroll      numeric,
    total_aset         numeric,
    total_piutang      numeric,
    total_utang        numeric,
    total_kasbon       numeric
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'finance', 'management', 'public'
AS $$
DECLARE
    v_pendapatan  numeric;
    v_pengeluaran numeric;
    v_budget      numeric;
    v_payroll     numeric;
    v_aset        numeric;
    v_piutang     numeric;
    v_utang       numeric;
    v_kasbon      numeric;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_pendapatan
    FROM finance.t_cashflow
    WHERE tipe = 'income'
      AND created_at::date >= p_start_date
      AND created_at::date <= p_end_date;

    SELECT COALESCE(SUM(amount), 0) INTO v_pengeluaran
    FROM finance.t_cashflow
    WHERE tipe = 'expense'
      AND created_at::date >= p_start_date
      AND created_at::date <= p_end_date;

    SELECT COALESCE(SUM(amount), 0) INTO v_budget
    FROM management.t_budget_request
    WHERE status = 'approved';

    SELECT COALESCE(SUM(total), 0) INTO v_payroll
    FROM finance.t_payroll_history
    WHERE bulan >= p_start_date
      AND bulan <= p_end_date;

    SELECT COALESCE(SUM(nilai_perolehan), 0) INTO v_aset
    FROM finance.t_asset
    WHERE status = 'active';

    SELECT COALESCE(SUM(nominal), 0) INTO v_piutang
    FROM finance.t_utang_piutang
    WHERE tipe = 'piutang'
      AND kas = 'tidak';

    SELECT COALESCE(SUM(nominal), 0) INTO v_utang
    FROM finance.t_utang_piutang
    WHERE tipe = 'utang'
      AND kas = 'tidak';

    SELECT COALESCE(SUM(nominal), 0) INTO v_kasbon
    FROM finance.t_utang_piutang
    WHERE tipe = 'kasbon'
      AND kas = 'tidak';

    RETURN QUERY
    SELECT
        v_pendapatan,
        v_pengeluaran,
        v_pendapatan - v_pengeluaran,
        v_budget,
        v_pengeluaran,
        CASE WHEN v_budget > 0 THEN ROUND((v_pengeluaran / v_budget) * 100, 2) ELSE 0 END,
        v_payroll,
        v_aset,
        v_piutang,
        v_utang,
        v_kasbon;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_dashboard_metrics TO authenticated, service_role;

COMMIT;
