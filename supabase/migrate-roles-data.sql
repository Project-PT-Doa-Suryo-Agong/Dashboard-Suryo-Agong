-- ============================================================================
-- SQL: MIGRASI DATA ROLE LAMA KE ROLE BARU (STANDARISASI)
-- ============================================================================
-- 
-- INSTRUKSI:
-- Karena kita telah mengecilkan / menyederhanakan `CoreUserRole` di sistem
-- menjadi hanya 8 role lowercase (developer, management, finance, hr, 
-- produksi, logistik, creative, office), maka data yang sudah tersimpan
-- di database sebelumnya (seperti "CEO", "Management & Strategy", dll) 
-- HARUS diperbarui secara paksa agar selaras dengan TypeScript dan RLS baru.
--
-- Jalankan Query ini di Menu SQL Editor Supabase!
-- ============================================================================

UPDATE core.profiles
SET role = CASE 
    WHEN role ILIKE '%Developer%' THEN 'developer'
    WHEN role ILIKE '%Management%' OR role ILIKE '%CEO%' OR role ILIKE '%Director%' THEN 'management'
    WHEN role ILIKE '%Finance%' THEN 'finance'
    WHEN role ILIKE '%HR%' OR role ILIKE '%Human Resource%' THEN 'hr'
    WHEN role ILIKE '%Produksi%' OR role ILIKE '%Production%' THEN 'produksi'
    WHEN role ILIKE '%Logistik%' OR role ILIKE '%Logistics%' THEN 'logistik'
    WHEN role ILIKE '%Creative%' OR role ILIKE '%Sales%' THEN 'creative'
    WHEN role ILIKE '%Office%' OR role ILIKE '%Support%' THEN 'office'
    ELSE LOWER(TRIM(role)) -- fallback
END;
