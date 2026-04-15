-- RLS (Row Level Security) Policies for Dashboard Suryo Agung

-- 
-- INSTRUKSI:
-- 1. Jalankan script ini di Supabase Dashboard → SQL Editor
-- 2. Jalankan per-section untuk memudahkan debugging
-- 3. Pastikan semua tabel di Supabase sudah sesuai schema types/supabase.ts
--
-- ROLE MATRIX:
-- Developer, CEO          → Strategic (akses penuh)
-- Finance, HR, Produksi,
-- Logistik, Creative      → Operational (sesuai divisi)
-- Office                  → Support (akses terbatas)


--  Helper Function: Get Current User's Role 
-- Supabase RLS sering butuh cek role user. Buat function reusable.

CREATE OR REPLACE FUNCTION core.get_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM core.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

--  Helper Function: Check if user has strategic access 

CREATE OR REPLACE FUNCTION core.is_strategic()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.profiles 
    WHERE id = auth.uid() 
    AND role IN ('Developer', 'CEO')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- SCHEMA: core

--  core.profiles 

ALTER TABLE core.profiles ENABLE ROW LEVEL SECURITY;

-- User bisa baca profile sendiri
CREATE POLICY "Users can read own profile"
ON core.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Strategic (Developer/CEO) bisa baca semua profile
CREATE POLICY "Strategic can read all profiles"
ON core.profiles FOR SELECT
TO authenticated
USING (core.is_strategic());

-- HR bisa baca semua profile (untuk manajemen karyawan)
CREATE POLICY "HR can read all profiles"
ON core.profiles FOR SELECT
TO authenticated
USING (core.get_user_role() = 'HR');

-- User bisa update profile sendiri (nama, phone saja — role diproteksi di backend)
CREATE POLICY "Users can update own profile"
ON core.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- INSERT dan DELETE tetap via backend (karena perlu orchestrasi Supabase Admin API)
-- Tidak perlu RLS policy untuk insert/delete di sisi client

--  core.m_produk 

ALTER TABLE core.m_produk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
ON core.m_produk FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized roles can insert products"
ON core.m_produk FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Authorized roles can update products"
ON core.m_produk FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Strategic can delete products"
ON core.m_produk FOR DELETE
TO authenticated
USING (core.is_strategic());

--  core.m_varian 

ALTER TABLE core.m_varian ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read variants"
ON core.m_varian FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized roles can insert variants"
ON core.m_varian FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Authorized roles can update variants"
ON core.m_varian FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Strategic can delete variants"
ON core.m_varian FOR DELETE
TO authenticated
USING (core.is_strategic());

--  core.m_vendor 

ALTER TABLE core.m_vendor ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vendors"
ON core.m_vendor FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authorized roles can insert vendors"
ON core.m_vendor FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Authorized roles can update vendors"
ON core.m_vendor FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Strategic can delete vendors"
ON core.m_vendor FOR DELETE
TO authenticated
USING (core.is_strategic());


-- SCHEMA: hr

--  hr.m_karyawan 

ALTER TABLE hr.m_karyawan ENABLE ROW LEVEL SECURITY;

-- HR, CEO, Developer, Finance bisa baca semua karyawan  
CREATE POLICY "HR and strategic can read all employees"
ON hr.m_karyawan FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR', 'Finance')
);

-- Karyawan bisa baca data sendiri (via profile_id)
CREATE POLICY "Employee can read own data"
ON hr.m_karyawan FOR SELECT
TO authenticated
USING (profile_id = auth.uid());

CREATE POLICY "HR and strategic can insert employees"
ON hr.m_karyawan FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "HR and strategic can update employees"
ON hr.m_karyawan FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "Strategic can delete employees"
ON hr.m_karyawan FOR DELETE
TO authenticated
USING (core.is_strategic());

--  hr.t_attendance 

ALTER TABLE hr.t_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and strategic can read all attendance"
ON hr.t_attendance FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

-- Karyawan bisa lihat attendance sendiri
CREATE POLICY "Employee can read own attendance"
ON hr.t_attendance FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM hr.m_karyawan WHERE profile_id = auth.uid()
  )
);

CREATE POLICY "HR and strategic can insert attendance"
ON hr.t_attendance FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "HR and strategic can update attendance"
ON hr.t_attendance FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR', 'HR & Operation Manager')
);

CREATE POLICY "Strategic can delete attendance"
ON hr.t_attendance FOR DELETE
TO authenticated
USING (
  core.is_strategic() OR core.get_user_role() IN ('HR', 'HR & Operation Manager')
);

--  hr.t_employee_warning 

ALTER TABLE hr.t_employee_warning ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR and strategic can read warnings"
ON hr.t_employee_warning FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "HR and strategic can insert warnings"
ON hr.t_employee_warning FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "HR and strategic can update warnings"
ON hr.t_employee_warning FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'HR')
);

CREATE POLICY "Strategic can delete warnings"
ON hr.t_employee_warning FOR DELETE
TO authenticated
USING (core.is_strategic());


-- SCHEMA: finance

--  finance.t_cashflow 

ALTER TABLE finance.t_cashflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and strategic can read cashflow"
ON finance.t_cashflow FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

CREATE POLICY "Finance and strategic can insert cashflow"
ON finance.t_cashflow FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

CREATE POLICY "Finance and strategic can update cashflow"
ON finance.t_cashflow FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

CREATE POLICY "Strategic can delete cashflow"
ON finance.t_cashflow FOR DELETE
TO authenticated
USING (core.is_strategic());

--  finance.t_payroll_history 
-- NOTE: Tetap digunakan oleh API untuk calculation, tapi bisa dibaca via RLS

ALTER TABLE finance.t_payroll_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and strategic can read payroll"
ON finance.t_payroll_history FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance', 'HR')
);

-- INSERT/UPDATE/DELETE tetap via API (calculation logic)
CREATE POLICY "Strategic can manage payroll"
ON finance.t_payroll_history FOR ALL
TO authenticated
USING (core.is_strategic());

--  finance.t_reimbursement 
-- NOTE: Approval workflow tetap via API, tapi CRUD biasa bisa langsung

ALTER TABLE finance.t_reimbursement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and strategic can read all reimbursements"
ON finance.t_reimbursement FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

-- Employee bisa lihat reimbursement sendiri
CREATE POLICY "Employee can read own reimbursements"
ON finance.t_reimbursement FOR SELECT
TO authenticated
USING (
  employee_id IN (
    SELECT id FROM hr.m_karyawan WHERE profile_id = auth.uid()
  )
);

-- Semua authenticated user bisa submit reimbursement (insert)
CREATE POLICY "Authenticated users can submit reimbursement"
ON finance.t_reimbursement FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE (approval) hanya Finance/Strategic — tetap via API untuk workflow
CREATE POLICY "Finance can update reimbursements"
ON finance.t_reimbursement FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

CREATE POLICY "Strategic can delete reimbursements"
ON finance.t_reimbursement FOR DELETE
TO authenticated
USING (core.is_strategic());


--  SCHEMA: production

--  production.t_produksi_order 

ALTER TABLE production.t_produksi_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produksi and strategic can read production orders"
ON production.t_produksi_order FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control', 'Logistik', 'Logistics & Packing')
);

CREATE POLICY "Produksi and strategic can insert production orders"
ON production.t_produksi_order FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Produksi and strategic can update production orders"
ON production.t_produksi_order FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Produksi and strategic can delete production orders"
ON production.t_produksi_order FOR DELETE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

--  production.t_qc_inbound 

ALTER TABLE production.t_qc_inbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produksi and strategic can read QC inbound"
ON production.t_qc_inbound FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control', 'Logistik', 'Logistics & Packing')
);

CREATE POLICY "Produksi and strategic can insert QC inbound"
ON production.t_qc_inbound FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Produksi and strategic can update QC inbound"
ON production.t_qc_inbound FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Strategic can delete QC inbound"
ON production.t_qc_inbound FOR DELETE
TO authenticated
USING (core.is_strategic());

--  production.t_qc_outbound 

ALTER TABLE production.t_qc_outbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produksi and strategic can read QC outbound"
ON production.t_qc_outbound FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control', 'Logistik', 'Logistics & Packing')
);

CREATE POLICY "Produksi and strategic can insert QC outbound"
ON production.t_qc_outbound FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Produksi and strategic can update QC outbound"
ON production.t_qc_outbound FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Produksi', 'Produksi & Quality Control')
);

CREATE POLICY "Strategic can delete QC outbound"
ON production.t_qc_outbound FOR DELETE
TO authenticated
USING (core.is_strategic());


--  SCHEMA: logistics

--  logistics.t_packing 

ALTER TABLE logistics.t_packing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logistik and strategic can read packing"
ON logistics.t_packing FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can insert packing"
ON logistics.t_packing FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can update packing"
ON logistics.t_packing FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can delete packing"
ON logistics.t_packing FOR DELETE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

--  logistics.t_logistik_manifest 

ALTER TABLE logistics.t_logistik_manifest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logistik and strategic can read manifests"
ON logistics.t_logistik_manifest FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Finance')
);

CREATE POLICY "Logistik and strategic can insert manifests"
ON logistics.t_logistik_manifest FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Logistik and strategic can update manifests"
ON logistics.t_logistik_manifest FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Strategic can delete manifests"
ON logistics.t_logistik_manifest FOR DELETE
TO authenticated
USING (core.is_strategic());

--  logistics.t_return_order 

ALTER TABLE logistics.t_return_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logistik and strategic can read returns"
ON logistics.t_return_order FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik', 'Produksi')
);

CREATE POLICY "Logistik and strategic can insert returns"
ON logistics.t_return_order FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Logistik and strategic can update returns"
ON logistics.t_return_order FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Logistik')
);

CREATE POLICY "Strategic can delete returns"
ON logistics.t_return_order FOR DELETE
TO authenticated
USING (core.is_strategic());


--  SCHEMA: sales

--  sales.m_affiliator 

ALTER TABLE sales.m_affiliator ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creative and strategic can read affiliators"
ON sales.m_affiliator FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can insert affiliators"
ON sales.m_affiliator FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can update affiliators"
ON sales.m_affiliator FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Strategic can delete affiliators"
ON sales.m_affiliator FOR DELETE
TO authenticated
USING (core.is_strategic());

--  sales.t_content_planner 

ALTER TABLE sales.t_content_planner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creative and strategic can read content"
ON sales.t_content_planner FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can insert content"
ON sales.t_content_planner FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can update content"
ON sales.t_content_planner FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Strategic can delete content"
ON sales.t_content_planner FOR DELETE
TO authenticated
USING (core.is_strategic());

--  sales.t_live_performance 

ALTER TABLE sales.t_live_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creative and strategic can read live performance"
ON sales.t_live_performance FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can insert live performance"
ON sales.t_live_performance FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can update live performance"
ON sales.t_live_performance FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Strategic can delete live performance"
ON sales.t_live_performance FOR DELETE
TO authenticated
USING (core.is_strategic());

--  sales.t_sales_order 

ALTER TABLE sales.t_sales_order ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sales-related roles can read orders"
ON sales.t_sales_order FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative', 'Finance', 'Logistik')
);

CREATE POLICY "Creative and strategic can insert orders"
ON sales.t_sales_order FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Creative and strategic can update orders"
ON sales.t_sales_order FOR UPDATE
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Creative')
);

CREATE POLICY "Strategic can delete orders"
ON sales.t_sales_order FOR DELETE
TO authenticated
USING (core.is_strategic());


--  SCHEMA: management

--  management.t_budget_request 

ALTER TABLE management.t_budget_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strategic and finance can read budget requests"
ON management.t_budget_request FOR SELECT
TO authenticated
USING (
  core.get_user_role() IN ('Developer', 'CEO', 'Finance')
);

-- Semua divisi bisa submit budget request
CREATE POLICY "Authenticated users can submit budget request"
ON management.t_budget_request FOR INSERT
TO authenticated
WITH CHECK (true);

-- Approval hanya strategic
CREATE POLICY "Strategic can update budget requests"
ON management.t_budget_request FOR UPDATE
TO authenticated
USING (core.is_strategic());

CREATE POLICY "Strategic can delete budget requests"
ON management.t_budget_request FOR DELETE
TO authenticated
USING (core.is_strategic());

--  management.t_kpi_weekly 

ALTER TABLE management.t_kpi_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Strategic can read all KPI"
ON management.t_kpi_weekly FOR SELECT
TO authenticated
USING (core.is_strategic());

-- Semua bisa lihat KPI divisi sendiri
CREATE POLICY "Users can read own division KPI"
ON management.t_kpi_weekly FOR SELECT
TO authenticated
USING (divisi = core.get_user_role());

CREATE POLICY "Strategic can insert KPI"
ON management.t_kpi_weekly FOR INSERT
TO authenticated
WITH CHECK (core.is_strategic());

CREATE POLICY "Strategic can update KPI"
ON management.t_kpi_weekly FOR UPDATE
TO authenticated
USING (core.is_strategic());

CREATE POLICY "Strategic can delete KPI"
ON management.t_kpi_weekly FOR DELETE
TO authenticated
USING (core.is_strategic());


--  GRANT schema usage to authenticated users (penting untuk multi-schema!)

GRANT USAGE ON SCHEMA core TO authenticated, anon;
GRANT USAGE ON SCHEMA hr TO authenticated, anon;
GRANT USAGE ON SCHEMA finance TO authenticated, anon;
GRANT USAGE ON SCHEMA production TO authenticated, anon;
GRANT USAGE ON SCHEMA logistics TO authenticated, anon;
GRANT USAGE ON SCHEMA sales TO authenticated, anon;
GRANT USAGE ON SCHEMA management TO authenticated, anon;

-- Grant SELECT/INSERT/UPDATE/DELETE pada semua tabel ke authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA core TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hr TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA finance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA production TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA logistics TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA sales TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA management TO authenticated;

-- Grant execute pada helper functions
GRANT EXECUTE ON FUNCTION core.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION core.is_strategic() TO authenticated;
