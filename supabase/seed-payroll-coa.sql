
INSERT INTO finance.m_coa (kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT '2103', 'Hutang BPJS', 'Liabilitas', true, id
FROM finance.m_coa
WHERE kode_akun = '2100'
ON CONFLICT (kode_akun) DO NOTHING;

INSERT INTO finance.m_coa (kode_akun, nama_akun, kategori, is_sub_account, parent_id)
SELECT '1202', 'Piutang Karyawan', 'Aset', true, id
FROM finance.m_coa
WHERE kode_akun = '1200'
ON CONFLICT (kode_akun) DO NOTHING;
