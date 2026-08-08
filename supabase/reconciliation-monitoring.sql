-- ============================================================================
-- FASE 8 - RECONCILIATION / MONITORING QUERY
-- ----------------------------------------------------------------------------
-- Query verifikasi konsistensi modul finance setelah implementasi Fase 8.
-- Dijalankan dari Supabase SQL Editor atau psql. Baca saja (READ ONLY).
-- ============================================================================

-- 1. JURNAL TIDAK SEIMBANG (harus 0 baris)
SELECT j.id, j.no_bukti, j.tanggal,
       COALESCE(SUM(ji.debit), 0)  AS total_debit,
       COALESCE(SUM(ji.kredit), 0) AS total_kredit
FROM finance.t_journal j
LEFT JOIN finance.t_journal_item ji ON ji.journal_id = j.id
GROUP BY j.id, j.no_bukti, j.tanggal
HAVING COALESCE(SUM(ji.debit), 0) <> COALESCE(SUM(ji.kredit), 0)
ORDER BY j.tanggal;

-- 2. JURNAL TANPA journal_number (harus 0 baris)
SELECT id, no_bukti, tanggal
FROM finance.t_journal
WHERE journal_number IS NULL OR journal_number = ''
ORDER BY tanggal;

-- 3. CASHFLOW amount = 0 atau orphan tanpa journal (harus 0 baris)
SELECT id, tipe, amount, keterangan, journal_id
FROM finance.t_cashflow
WHERE amount = 0
   OR (journal_id IS NULL AND keterangan LIKE 'Penerimaan kas otomatis dari Order:%')
ORDER BY created_at;

-- 4. UTANG/PIUTANG/KASBON TANPA JURNAL (kas = 'tidak' -> harus sudah ada jurnal)
SELECT u.id, u.tipe, u.nominal, u.kas, u.klien, u.tanggal_awal
FROM finance.t_utang_piutang u
WHERE u.kas = 'tidak'
  AND NOT EXISTS (
      SELECT 1 FROM finance.t_journal j
      WHERE j.referensi_id = u.id
  )
ORDER BY u.tanggal_awal;

-- 5. ASET AKTIF TANPA CASHFLOW AKUISISI (harus 0 baris)
SELECT a.kode_aset, a.nama_aset, a.nilai_perolehan, a.journal_id
FROM finance.t_asset a
WHERE a.status = 'active'
  AND a.journal_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM finance.t_cashflow cf
      WHERE cf.journal_id = a.journal_id
  )
ORDER BY a.kode_aset;

-- 6. PAYROLL BER-POTONGAN KASBON TANPA SPLIT BRUTO (harus 0 baris)
SELECT ph.employee_id, ph.bulan, ph.total, ph.potongan_kasbon
FROM finance.t_payroll_history ph
WHERE COALESCE(ph.potongan_kasbon, 0) > 0
  AND NOT EXISTS (
      SELECT 1
      FROM finance.t_journal j
      JOIN finance.t_journal_item ji_kasbon ON ji_kasbon.journal_id = j.id
      JOIN finance.m_coa c ON c.id = ji_kasbon.coa_id
      WHERE j.no_bukti = 'PAY-' || ph.employee_id || '-' || TO_CHAR(ph.bulan, 'YYYYMM')
        AND ji_kasbon.kredit = ph.potongan_kasbon
        AND c.kode_akun = '1202'
  );

-- 7. SALDO NERACA (total debit = total kredit, harus sama)
SELECT
    COALESCE(SUM(ji.debit), 0)  AS total_debit,
    COALESCE(SUM(ji.kredit), 0) AS total_kredit,
    COALESCE(SUM(ji.debit), 0) - COALESCE(SUM(ji.kredit), 0) AS selisih
FROM finance.t_journal_item ji;

-- 8. NERACA vs DASHBOARD: aset nilai buku (1400 debit - 1401 kredit)
SELECT
    (SELECT COALESCE(SUM(ji.debit), 0) FROM finance.t_journal_item ji
     JOIN finance.m_coa c ON c.id = ji.coa_id WHERE c.kode_akun = '1400')
    -
    (SELECT COALESCE(SUM(ji.kredit), 0) FROM finance.t_journal_item ji
     JOIN finance.m_coa c ON c.id = ji.coa_id WHERE c.kode_akun = '1401')
    AS total_aset_nilai_buku;

-- 9. P&L vs ARUS KAS (ringkasan; perbedaan wajar = selisih akrual vs kas)
SELECT
    (SELECT COALESCE(SUM(ji.kredit - ji.debit), 0) FROM finance.t_journal_item ji
     JOIN finance.m_coa c ON c.id = ji.coa_id WHERE c.kategori IN ('Pendapatan', 'Pendapatan Lain-lain'))  AS pendapatan_akrual,
    (SELECT COALESCE(SUM(ji.debit - ji.kredit), 0) FROM finance.t_journal_item ji
     JOIN finance.m_coa c ON c.id = ji.coa_id WHERE c.kategori IN ('Beban', 'Beban Lain-lain'))       AS beban_akrual,
    (SELECT COALESCE(SUM(amount), 0) FROM finance.t_cashflow WHERE tipe = 'income')  AS income_kas,
    (SELECT COALESCE(SUM(amount), 0) FROM finance.t_cashflow WHERE tipe = 'expense') AS expense_kas;

-- 10. CASHFLOW PER tipe_kas (besar/kecil)
SELECT tipe_kas, tipe, COUNT(*) AS jumlah, COALESCE(SUM(amount), 0) AS total
FROM finance.t_cashflow
GROUP BY tipe_kas, tipe
ORDER BY tipe_kas, tipe;
