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
-- 6. FUNCTION: finance.fn_create_journal_entry()
--    Obsolete (v1.5) — tidak lagi didefinisikan di file ini.
--    fn_create_journal_entry is maintained by fix-journal-auto-number.sql
-- ============================================================================

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
