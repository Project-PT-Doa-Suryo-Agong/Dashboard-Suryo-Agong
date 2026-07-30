-- 1. Aset Tetap (parent: 1000 - Aset)
INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1400',
    'Aset Tetap',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1000'
ON CONFLICT (kode_akun) DO NOTHING;

-- 2. Akumulasi Penyusutan Aset Tetap (parent: 1400 - Aset Tetap)
INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '1401',
    'Akumulasi Penyusutan Aset Tetap',
    'Aset',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '1400'
ON CONFLICT (kode_akun) DO NOTHING;

-- 3. Beban Penyusutan Aset Tetap (parent: 6000 - BEBAN OPERASIONAL)
INSERT INTO finance.m_coa
(kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT
    '6200',
    'Beban Penyusutan Aset Tetap',
    'Beban',
    true,
    id
FROM finance.m_coa
WHERE kode_akun = '6000'
ON CONFLICT (kode_akun) DO NOTHING;
