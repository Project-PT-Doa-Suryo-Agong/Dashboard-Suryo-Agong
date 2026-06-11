-- ── Create Buku Tamu (public.buku_tamu) Table ──
-- Run this script in the Supabase SQL Editor to initialize the table.

CREATE TABLE IF NOT EXISTS public.buku_tamu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kamu VARCHAR(255) NOT NULL,
  nomor_telepon VARCHAR(50) NOT NULL,
  alamat TEXT,
  keperluan TEXT NOT NULL,
  asal_instansi VARCHAR(255),
  tau_utero_darimana VARCHAR(255) NOT NULL,
  kritik_saran TEXT,
  status_hello VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.buku_tamu ENABLE ROW LEVEL SECURITY;

-- ── RLS Policies ──

-- 1. Allow public anonymous visitors to register (INSERT)
DROP POLICY IF EXISTS "Allow public anonymous insert to buku_tamu" ON public.buku_tamu;
CREATE POLICY "Allow public anonymous insert to buku_tamu"
ON public.buku_tamu FOR INSERT
TO public
WITH CHECK (true);

-- 2. Allow authenticated enterprise users to view (SELECT) guest logs
DROP POLICY IF EXISTS "Allow authenticated users to select buku_tamu" ON public.buku_tamu;
CREATE POLICY "Allow authenticated users to select buku_tamu"
ON public.buku_tamu FOR SELECT
TO authenticated
USING (true);

-- 3. Allow authenticated enterprise users to modify (UPDATE) guest records
DROP POLICY IF EXISTS "Allow authenticated users to update buku_tamu" ON public.buku_tamu;
CREATE POLICY "Allow authenticated users to update buku_tamu"
ON public.buku_tamu FOR UPDATE
TO authenticated
USING (true);

-- 4. Allow authenticated enterprise users to delete (DELETE) guest records
DROP POLICY IF EXISTS "Allow authenticated users to delete buku_tamu" ON public.buku_tamu;
CREATE POLICY "Allow authenticated users to delete buku_tamu"
ON public.buku_tamu FOR DELETE
TO authenticated
USING (true);

-- ── Grant Roles Permissions ──
GRANT ALL ON public.buku_tamu TO postgres;
GRANT ALL ON public.buku_tamu TO service_role;
GRANT INSERT ON public.buku_tamu TO anon;
GRANT ALL ON public.buku_tamu TO authenticated;
