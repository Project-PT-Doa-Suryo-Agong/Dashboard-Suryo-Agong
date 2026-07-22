-- ============================================================================
-- Migration: Fix permission denied for management.t_budget_config
--              + Fix NULL coa_id crash in fn_create_journal_entry
--
-- Root Cause:
--   1. Table t_budget_config exists in live database but was created AFTER
--      GRANT ALL TABLES IN SCHEMA management was executed, so authenticated
--      and service_role have no permissions on it.
--   2. Trigger function finance.fn_create_journal_entry() is SECURITY INVOKER
--      (default), meaning it runs with the calling user's permissions.
--      When a trigger fires after INSERT/UPDATE on management.t_budget_request,
--      PostgreSQL checks the caller's permissions on every table the function
--      accesses — including t_budget_config (if referenced in live version).
--   3. The API (app/api/management/budget/route.ts:99) uses auth.ctx.supabase
--      (anon key client) for the INSERT, which enforces RLS. The trigger
--      inherits this restricted permission context.
--   4. When coa_id is NULL in source table, fn_create_journal_entry() tries
--      to INSERT NULL into t_journal_item.coa_id (which is NOT NULL),
--      causing transaction rollback.
--
-- Fix:
--   1. Add explicit GRANT for t_budget_config to authenticated & service_role
--      (idempotent with DO block if table doesn't exist yet)
--   2. Make fn_create_journal_entry() SECURITY DEFINER so trigger operations
--      (auto-journal, auto-cashflow) run as postgres owner, independent of
--      the calling user's permissions.
--   3. Set explicit search_path to prevent search-path injection.
--   4. Add NULL safety check: skip journal creation if coa_id is NULL
--      (prevents crash without changing business logic).
--   5. Ensure default privileges for new tables in management schema.
-- ============================================================================

BEGIN;

-- ================================================================
-- 1. SCHEMA USAGE GRANTS (idempotent)
-- ================================================================
GRANT USAGE ON SCHEMA management TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA finance TO authenticated, anon, service_role;

-- ================================================================
-- 2. GRANT akses ke management.t_budget_config
--    Aman: DO block mengecek keberadaan tabel sebelum GRANT.
--    Jika tabel belum ada, GRANT dilewati tanpa error.
-- ================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'management' AND tablename = 't_budget_config'
    ) THEN
        GRANT ALL ON TABLE management.t_budget_config TO authenticated, service_role;
        RAISE NOTICE 'GRANT ALL on management.t_budget_config applied to authenticated, service_role.';
    ELSE
        RAISE NOTICE 'management.t_budget_config does not exist yet; skipping GRANT.';
    END IF;
END;
$$;

-- ================================================================
-- 3. ALTER fn_create_journal_entry() → SECURITY DEFINER
--    Dengan search_path eksplisit untuk mencegah search-path injection.
--    + NULL safety check untuk coa_id.
-- ================================================================
CREATE OR REPLACE FUNCTION finance.fn_create_journal_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'finance', 'management', 'core', 'public'
AS $$
DECLARE
    v_journal_id uuid;
    v_coa_debit uuid;
    v_coa_kredit uuid;
    v_no_bukti varchar;
    v_amount numeric;
    v_ref_id uuid;
BEGIN

    IF (TG_TABLE_NAME = 't_payroll_history') THEN
        v_no_bukti := 'PAY-' || NEW.employee_id || '-' || TO_CHAR(NEW.bulan, 'YYYYMM');
        v_coa_debit := NEW.coa_id;
        v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
        v_amount := NEW.total;
        v_ref_id := NEW.employee_id;

    ELSIF (TG_TABLE_NAME = 't_reimbursement') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti := 'REI-' || NEW.id;
            v_coa_debit := NEW.coa_id;
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount := NEW.amount;
            v_ref_id := NEW.id;
        ELSE
            RETURN NEW;
        END IF;

    ELSIF (TG_TABLE_NAME = 't_budget_request') THEN
        IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR
           (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved') THEN
            v_no_bukti := 'BGT-' || NEW.id;
            v_coa_debit := NEW.coa_id;
            v_coa_kredit := (SELECT id FROM finance.m_coa WHERE kode_akun = '1101');
            v_amount := NEW.amount;
            v_ref_id := NEW.id;
        ELSE
            RETURN NEW;
        END IF;
    END IF;

    -- Safety check: skip if no_bukti not set (unmatched table or early return)
    IF v_no_bukti IS NULL THEN
        RETURN NEW;
    END IF;

    -- Safety check: skip journal creation if debit or kredit COA is NULL
    -- (mencegah error NOT NULL constraint pada t_journal_item.coa_id)
    IF v_coa_debit IS NULL OR v_coa_kredit IS NULL THEN
        RETURN NEW;
    END IF;

    -- Insert journal header
    INSERT INTO finance.t_journal (no_bukti, tanggal, keterangan, referensi_id)
    VALUES (v_no_bukti, CURRENT_DATE, 'Auto-journal from ' || TG_TABLE_NAME, v_ref_id)
    RETURNING id INTO v_journal_id;

    -- Insert journal items (debit/kredit)
    INSERT INTO finance.t_journal_item (journal_id, coa_id, debit, kredit)
    VALUES
        (v_journal_id, v_coa_debit, v_amount, 0),
        (v_journal_id, v_coa_kredit, 0, v_amount);

    -- Insert into cashflow
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

ALTER FUNCTION finance.fn_create_journal_entry() OWNER TO postgres;

-- ================================================================
-- 4. Default privileges untuk schema management
--    Memastikan tabel baru di management schema otomatis mendapat
--    GRANT untuk authenticated dan service_role.
-- ================================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA management
GRANT ALL ON TABLES TO authenticated, service_role;

COMMIT;
