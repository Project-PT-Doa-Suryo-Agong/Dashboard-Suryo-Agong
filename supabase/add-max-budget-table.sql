-- ============================================================================
-- Max Budget (Saldo Perusahaan)
-- 
-- Menyimpan batas maksimal budget perusahaan secara global.
-- Menggunakan mekanisme is_active agar riwayat perubahan tetap tersedia.
--
-- Cara pakai:
--   1. Jalankan script ini di Supabase SQL Editor
--   2. Atur Max Budget via UI Management → Budget → "Atur Max Budget"
-- ============================================================================

BEGIN;

-- ================================================================
-- DEPENDENCY: Helper function used by RLS policies di bawah.
-- Jika function ini sudah ada (dari rls-policies.sql), akan di-skip.
-- ================================================================

CREATE OR REPLACE FUNCTION core.is_strategic()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Developer', 'Super Admin', 'Admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION core.is_strategic() TO authenticated, service_role;

-- 1. TABLE: management.t_max_budget 
CREATE TABLE IF NOT EXISTS management.t_max_budget (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    max_amount numeric NOT NULL CHECK (max_amount >= 0),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    CONSTRAINT t_max_budget_pkey PRIMARY KEY (id)
);

ALTER TABLE management.t_max_budget OWNER TO postgres;

-- 2. ROW LEVEL SECURITY 
ALTER TABLE management.t_max_budget ENABLE ROW LEVEL SECURITY;

-- Idempotent: hapus policy lama sebelum create
DROP POLICY IF EXISTS "Authenticated users can read max budget" ON management.t_max_budget;
DROP POLICY IF EXISTS "Strategic can insert max budget" ON management.t_max_budget;
DROP POLICY IF EXISTS "Strategic can update max budget" ON management.t_max_budget;

-- Semua authenticated user bisa membaca (untuk validasi budget)
CREATE POLICY "Authenticated users can read max budget"
ON management.t_max_budget FOR SELECT
TO authenticated
USING (true);

-- Hanya strategic (Super Admin, Admin, Developer) yang bisa insert
CREATE POLICY "Strategic can insert max budget"
ON management.t_max_budget FOR INSERT
TO authenticated
WITH CHECK (core.is_strategic());

-- Hanya strategic yang bisa update (deactivate)
CREATE POLICY "Strategic can update max budget"
ON management.t_max_budget FOR UPDATE
TO authenticated
USING (core.is_strategic())
WITH CHECK (core.is_strategic());

-- 3. FUNCTION: public.set_max_budget 
-- Mengganti max budget secara atomik: deactivate old, insert new
-- Ditaruh di schema public agar konsisten dengan RPC functions lain.
CREATE OR REPLACE FUNCTION public.set_max_budget(
    p_amount numeric,
    p_updated_by uuid
) RETURNS management.t_max_budget
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'management', 'core'
    AS $$
DECLARE
    v_row management.t_max_budget;
BEGIN
    IF p_amount < 0 THEN
        RAISE EXCEPTION 'Max budget tidak boleh negatif.';
    END IF;

    UPDATE management.t_max_budget
    SET is_active = false
    WHERE is_active = true;

    INSERT INTO management.t_max_budget (max_amount, updated_by)
    VALUES (p_amount, p_updated_by)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;
    
ALTER FUNCTION public.set_max_budget OWNER TO postgres;

-- 4. GRANTS 
GRANT USAGE ON SCHEMA management TO service_role;
GRANT ALL ON TABLE management.t_max_budget TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_max_budget TO authenticated, service_role;

COMMIT;
