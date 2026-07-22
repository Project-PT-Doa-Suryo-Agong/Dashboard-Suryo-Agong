-- ==========================================
-- CHART OF ACCOUNTS (COA) SEED
-- Schema : finance
-- ==========================================
-- Gabungan dari template-sql/template-coa.sql
-- + tambahan COA untuk Payroll, Budget, Reimburse
-- ==========================================

-- =========================
-- HEADER
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account)
VALUES
('1000', 'Aset', 'Aset', false),
('2000', 'KEWAJIBAN', 'Liabilitas', false),
('3000', 'MODAL', 'Ekuitas', false),
('4000', 'PENDAPATAN', 'Pendapatan', false),
('5000', 'HARGA POKOK PENJUALAN', 'Beban', false),
('6000', 'BEBAN OPERASIONAL', 'Beban', false)
ON CONFLICT (kode_akun) DO NOTHING;

-- =========================
-- Aset
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1100',
    'Kas dan Bank',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1101',
    'Kas Kecil',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1102',
    'Kas Operasional',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1103',
    'Bank BCA',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1200',
    'Piutang',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1201',
    'Piutang Usaha',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1200';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1300',
    'Persediaan',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1301',
    'Persediaan Barang Dagang',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1300';

-- =========================
-- KEWAJIBAN
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '2100',
    'Hutang Jangka Pendek',
    'Liabilitas',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '2000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '2101',
    'Hutang Usaha',
    'Liabilitas',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '2100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '2102',
    'Hutang Pajak',
    'Liabilitas',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '2100';

-- =========================
-- MODAL
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '3100',
    'Modal Pemilik',
    'Ekuitas',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '3000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '3200',
    'Prive',
    'Ekuitas',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '3000';

-- =========================
-- PENDAPATAN
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '4100',
    'Pendapatan Jasa',
    'Pendapatan',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '4101',
    'Pendapatan SaaS',
    'Pendapatan',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '4102',
    'Pendapatan AI Consulting',
    'Pendapatan',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

-- =========================
-- BEBAN OPERASIONAL (6xxx)
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6100',
    'Beban Hosting',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6101',
    'Beban Domain',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6102',
    'Beban OpenAI API',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6103',
    'Beban Supabase',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6104',
    'Beban N8N',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

-- =========================
-- TAMBAHAN COA UNTUK PAYROLL, BUDGET, REIMBURSE
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT '5101', 'Beban Gaji & Upah', 'Beban', true, id
FROM finance.m_coa WHERE kode_akun = '5000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT '5102', 'Beban Operasional', 'Beban', true, id
FROM finance.m_coa WHERE kode_akun = '5000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT '5103', 'Beban Reimbursement', 'Beban', true, id
FROM finance.m_coa WHERE kode_akun = '5000';
