-- ==========================================
-- CHART OF ACCOUNTS (COA) TEMPLATE
-- Schema : finance
-- ==========================================

-- =========================
-- HEADER
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account)
VALUES
('1000', 'ASET', 'asset', false),
('2000', 'KEWAJIBAN', 'liability', false),
('3000', 'MODAL', 'equity', false),
('4000', 'PENDAPATAN', 'revenue', false),
('5000', 'HARGA POKOK PENJUALAN', 'expense', false),
('6000', 'BEBAN OPERASIONAL', 'expense', false)
ON CONFLICT (kode_akun) DO NOTHING;

-- =========================
-- ASET
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1100',
    'Kas dan Bank',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1101',
    'Kas Kecil',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1102',
    'Kas Operasional',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1103',
    'Bank BCA',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1200',
    'Piutang',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1201',
    'Piutang Usaha',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1200';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1300',
    'Persediaan',
    'asset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1301',
    'Persediaan Barang Dagang',
    'asset',
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
    'liability',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '2000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '2101',
    'Hutang Usaha',
    'liability',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '2100';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '2102',
    'Hutang Pajak',
    'liability',
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
    'equity',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '3000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '3200',
    'Prive',
    'equity',
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
    'revenue',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '4101',
    'Pendapatan SaaS',
    'revenue',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '4102',
    'Pendapatan AI Consulting',
    'revenue',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '4000';

-- =========================
-- BEBAN
-- =========================

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6100',
    'Beban Hosting',
    'expense',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6101',
    'Beban Domain',
    'expense',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6102',
    'Beban OpenAI API',
    'expense',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6103',
    'Beban Supabase',
    'expense',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';

INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6104',
    'Beban N8N',
    'expense',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000';