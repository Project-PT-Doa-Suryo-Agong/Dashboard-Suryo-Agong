BEGIN;

-- ============================================================================
-- finance.t_cashflow
-- ============================================================================

-- Filter: WHERE tipe = 'income'/'expense' AND created_at BETWEEN
CREATE INDEX IF NOT EXISTS idx_cashflow_tipe_created
    ON finance.t_cashflow(tipe, created_at)

-- Filter: WHERE created_at BETWEEN (pencarian berdasarkan tanggal)
CREATE INDEX IF NOT EXISTS idx_cashflow_created_at
    ON finance.t_cashflow(created_at);

-- ============================================================================
-- finance.t_journal
-- ============================================================================

-- Filter: WHERE tanggal BETWEEN (pencarian berdasarkan periode)
CREATE INDEX IF NOT EXISTS idx_journal_tanggal
    ON finance.t_journal(tanggal);

-- ORDER BY: ORDER BY tanggal DESC (pagination jurnal umum)
CREATE INDEX IF NOT EXISTS idx_journal_tanggal_desc
    ON finance.t_journal(tanggal DESC);

-- ============================================================================
-- finance.t_journal_item
-- ============================================================================

-- JOIN: t_journal_item.coa_id -> m_coa.id
CREATE INDEX IF NOT EXISTS idx_journal_item_coa_id
    ON finance.t_journal_item(coa_id);

-- JOIN: t_journal_item.journal_id -> t_journal.id
CREATE INDEX IF NOT EXISTS idx_journal_item_journal_id
    ON finance.t_journal_item(journal_id);

-- ============================================================================
-- finance.t_utang_piutang
-- ============================================================================

-- Filter: WHERE tipe = 'piutang'/'utang'/'kasbon' AND kas = 'tidak'
CREATE INDEX IF NOT EXISTS idx_utang_piutang_tipe_kas
    ON finance.t_utang_piutang(tipe, kas);

-- ============================================================================
-- finance.t_payroll_history
-- ============================================================================

-- Filter: WHERE bulan BETWEEN
CREATE INDEX IF NOT EXISTS idx_payroll_bulan
    ON finance.t_payroll_history(bulan);

-- ============================================================================
-- finance.t_asset
-- ============================================================================

-- Filter: WHERE status = 'active'
CREATE INDEX IF NOT EXISTS idx_asset_status
    ON finance.t_asset(status);

-- ============================================================================
-- management.t_budget_request
-- ============================================================================

-- Filter: WHERE status = 'approved'
CREATE INDEX IF NOT EXISTS idx_budget_request_status
    ON management.t_budget_request(status);

-- Filter: WHERE created_at BETWEEN
CREATE INDEX IF NOT EXISTS idx_budget_request_created
    ON management.t_budget_request(created_at);

COMMIT;
