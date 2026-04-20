-- Migration: Add COA, Jurnal, and Jurnal Item to finance schema

-- Type and table for COA (Chart of Account)
CREATE TYPE finance.coa_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

CREATE TABLE finance.m_coa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  type finance.coa_type NOT NULL,
  balance NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Type and table for Jurnal
CREATE TYPE finance.jurnal_status AS ENUM ('draft', 'posted');

CREATE TABLE finance.t_jurnal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference VARCHAR UNIQUE,
  date DATE NOT NULL,
  description TEXT,
  status finance.jurnal_status DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table for Jurnal Item
CREATE TABLE finance.t_jurnal_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurnal_id UUID REFERENCES finance.t_jurnal(id) ON DELETE CASCADE,
  coa_id UUID REFERENCES finance.m_coa(id) ON DELETE RESTRICT,
  debit NUMERIC(15,2) DEFAULT 0,
  credit NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Note: RLS policies can be added depending on exact schema constraints
ALTER TABLE finance.m_coa ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.t_jurnal ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance.t_jurnal_item ENABLE ROW LEVEL SECURITY;

-- Optional: Create basic RLS policies for auth users
CREATE POLICY "Enable read access for authenticated users" ON finance.m_coa FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for authenticated users" ON finance.m_coa FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON finance.t_jurnal FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for authenticated users" ON finance.t_jurnal FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON finance.t_jurnal_item FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable full access for authenticated users" ON finance.t_jurnal_item FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
