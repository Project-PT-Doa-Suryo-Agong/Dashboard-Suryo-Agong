-- FASE 4: REALTIME & STORAGE POLICIES

-- 
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase Dashboard → SQL Editor
-- 2. Pastikan `core.get_user_role()` dan `core.is_strategic()` dari fase 1 sudah ada.
-- 3. Script ini akan mengaktifkan Supabase Realtime untuk tabel tertentu,
--    serta membuat bucket Storage dan RLS policy-nya.


-- 1. SETUP REALTIME 

-- Aktifkan replikasi realtime untuk tabel yang butuh live update di frontend
BEGIN;

-- Contoh: t_packing untuk update status resi/pengiriman secara live
ALTER PUBLICATION supabase_realtime ADD TABLE logistics.t_packing;

-- Contoh: t_reimbursement untuk live update status approval
ALTER PUBLICATION supabase_realtime ADD TABLE finance.t_reimbursement;

-- Contoh: t_produksi_order untuk live tracking status produksi
ALTER PUBLICATION supabase_realtime ADD TABLE production.t_produksi_order;

COMMIT;

-- 2. SETUP STORAGE BUCKETS 

-- Buat bucket untuk bukti reimbursement (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reimbursements', 'reimbursements', false)
ON CONFLICT (id) DO NOTHING;

-- Buat bucket untuk foto produk (Public)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 3. STORAGE RLS POLICIES 

-- Enable RLS (di database Supabase defaultnya RLS aktif untuk tabel storage.objects, 
-- tapi tidak ada salahnya memastikan policy kita sesuai).

-- A. Bucket "reimbursements" (Private)

-- Semua authenticated user bisa upload bukti reimbursement mereka
CREATE POLICY "Authenticated users can upload reimbursement proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reimbursements');

-- Hanya pemilik (owner) atau user dengan role Finance/Strategic yang bisa melihat file
CREATE POLICY "Users can read own reimbursement proofs or Finance/Strategic can read all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'reimbursements' AND
  (
    auth.uid() = owner OR
    (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Finance & Administration')
  )
);

-- Hanya pemilik yang bisa menghapus bukti reimbursement miliknya
-- (atau bisa dibatasi jika status sudah approved tidak boleh dihapus, namun untuk kemudahan ini contoh)
CREATE POLICY "Users can delete own reimbursement proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'reimbursements' AND auth.uid() = owner);


-- B. Bucket "products" (Public Read)

-- Semua orang (termasuk anon/public) bisa melihat foto produk (karena public bucket)
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Hanya role tertentu yang bisa upload foto produk
CREATE POLICY "Logistik, Produksi, Strategic can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'products' AND
  (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Logistics & Packing', 'Produksi & Quality Control')
);

-- Update foto produk terbatas untuk role terkait
CREATE POLICY "Logistik, Produksi, Strategic can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'products' AND
  (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Logistics & Packing', 'Produksi & Quality Control')
);

-- Hanya Strategic yang bisa menghapus foto secara permanen
CREATE POLICY "Strategic can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'products' AND
  (SELECT core.is_strategic())
);

-- C. Bucket "returns" (Private)

-- Buat bucket untuk bukti return order (Private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('returns', 'returns', false)
ON CONFLICT (id) DO NOTHING;

-- Logistik bisa upload bukti return
CREATE POLICY "Logistik can upload return proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'returns' AND
  (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Logistics & Packing')
);

-- Logistik dan Produksi bisa lihat bukti return
CREATE POLICY "Logistik and Produksi can read return proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'returns' AND
  (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Logistics & Packing', 'Produksi & Quality Control')
);

-- Hanya Logistik/Strategic yang bisa mengupdate
CREATE POLICY "Logistik can update return proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'returns' AND
  (SELECT core.get_user_role()) IN ('Developer', 'Management & Strategy', 'Logistics & Packing')
);

-- Hanya Strategic yang bisa menghapus foto return secara permanen
CREATE POLICY "Strategic can delete return proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'returns' AND
  (SELECT core.is_strategic())
);
