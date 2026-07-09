-- ============================================================================
-- fn_dashboard_metrics — RPC untuk agregasi Dashboard Laporan Keuangan
--
-- Fungsi ini menggantikan query agregasi di endpoint dashboard.
-- Response endpoint tetap identik, hanya sumber data berubah dari query
-- langsung (supabaseAdmin.from().select()) menjadi RPC.
--
-- Cara deploy:
--   1. Jalankan di Supabase SQL Editor
--   2. Validasi hasil: panggil SELECT * FROM fn_dashboard_metrics('2026-01-01', '2026-12-31');
--
-- Migration bersifat idempotent (CREATE OR REPLACE).
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
    -- Total Pendapatan dari cashflow income
    SELECT COALESCE(SUM(amount), 0) INTO v_pendapatan
    FROM finance.t_cashflow
    WHERE tipe = 'income'
      AND created_at::date >= p_start_date
      AND created_at::date <= p_end_date;

    -- Total Pengeluaran dari cashflow expense
    SELECT COALESCE(SUM(amount), 0) INTO v_pengeluaran
    FROM finance.t_cashflow
    WHERE tipe = 'expense'
      AND created_at::date >= p_start_date
      AND created_at::date <= p_end_date;

    -- Total Budget yang sudah disetujui
    SELECT COALESCE(SUM(amount), 0) INTO v_budget
    FROM management.t_budget_request
    WHERE status = 'approved';

    -- Total Payroll periode
    SELECT COALESCE(SUM(total), 0) INTO v_payroll
    FROM finance.t_payroll_history
    WHERE bulan >= p_start_date
      AND bulan <= p_end_date;

    -- Total Aset aktif
    SELECT COALESCE(SUM(nilai_perolehan), 0) INTO v_aset
    FROM finance.t_asset
    WHERE status = 'active';

    -- Total Piutang belum lunas
    SELECT COALESCE(SUM(nominal), 0) INTO v_piutang
    FROM finance.t_utang_piutang
    WHERE tipe = 'piutang'
      AND kas = 'tidak';

    -- Total Utang belum lunas
    SELECT COALESCE(SUM(nominal), 0) INTO v_utang
    FROM finance.t_utang_piutang
    WHERE tipe = 'utang'
      AND kas = 'tidak';

    -- Total Kasbon belum lunas
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

-- Grant permission ke role yang membutuhkan
GRANT EXECUTE ON FUNCTION public.fn_dashboard_metrics TO authenticated, service_role;

-- ============================================================================
-- Cara refactor endpoint dashboard setelah RPC tervalidasi:
--
-- BEFORE (Phase 2 — query langsung):
--   const data = await getDashboardMetrics(startDate, endDate);
--
-- AFTER (Phase 5 — via RPC):
--   const { data, error } = await supabaseAdmin.rpc("fn_dashboard_metrics", {
--     p_start_date: startDate,
--     p_end_date: endDate,
--   });
--   const metrics = (data ?? [])[0] || {};
--   const response = { ...metrics };
-- ============================================================================
