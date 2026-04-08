
-- AUTOMATION TRIGGER FOR CASHFLOW

-- File ini membuat fungsi dan trigger PostgreSQL untuk mengotomatiskan
-- pencatatan kas (cashflow) dari 3 transaksi:
-- 1. Sales Order (Income)
-- 2. Payroll (Expense)
-- 3. Reimbursement (Expense - saat status 'approved')


-- 1. TRIGGER SALES ORDER -> CASHFLOW (INCOME)

CREATE OR REPLACE FUNCTION finance.fn_sales_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
  VALUES (
    'income', 
    NEW.total_price, 
    'Pemasukan dari Sales Order ID: ' || NEW.id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sales_to_cashflow ON sales.t_sales_order;
CREATE TRIGGER trg_sales_to_cashflow
AFTER INSERT ON sales.t_sales_order
FOR EACH ROW
EXECUTE FUNCTION finance.fn_sales_to_cashflow();


-- 2. TRIGGER PAYROLL -> CASHFLOW (EXPENSE)

CREATE OR REPLACE FUNCTION finance.fn_payroll_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
  VALUES (
    'expense', 
    NEW.total, 
    'Pengeluaran Payroll Bulan: ' || NEW.bulan || ' - Employee ID: ' || NEW.employee_id,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payroll_to_cashflow ON finance.t_payroll_history;
CREATE TRIGGER trg_payroll_to_cashflow
AFTER INSERT ON finance.t_payroll_history
FOR EACH ROW
EXECUTE FUNCTION finance.fn_payroll_to_cashflow();


-- 3. TRIGGER REIMBURSEMENT -> CASHFLOW (EXPENSE) 
-- Catatan: Hanya terekap jika statusnya 'approved'

CREATE OR REPLACE FUNCTION finance.fn_reimburse_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Lakukan Insert ke cashflow HANYA jika reimbursement baru disetujui
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
     
     INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
     VALUES (
       'expense', 
       NEW.amount, 
       'Pengeluaran Reimbursement ID: ' || NEW.id || ' - Employee ID: ' || NEW.employee_id,
       NOW(),
       NOW()
     );
     
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reimburse_to_cashflow ON finance.t_reimbursement;
CREATE TRIGGER trg_reimburse_to_cashflow
AFTER INSERT OR UPDATE ON finance.t_reimbursement
FOR EACH ROW
EXECUTE FUNCTION finance.fn_reimburse_to_cashflow();

-- 4. TRIGGER BUDGET REQUEST -> CASHFLOW (EXPENSE) 
-- Catatan: Hanya terekap jika statusnya 'approved'

CREATE OR REPLACE FUNCTION finance.fn_budget_to_cashflow()
RETURNS TRIGGER AS $$
BEGIN
  -- Lakukan Insert ke cashflow HANYA jika budget request baru disetujui
  IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
     (TG_OP = 'UPDATE' AND OLD.status != 'approved' AND NEW.status = 'approved') THEN
     
     INSERT INTO finance.t_cashflow (tipe, amount, keterangan, created_at, updated_at)
     VALUES (
       'expense', 
       NEW.amount, 
       'Pengeluaran Pengajuan Anggaran (Divisi: ' || NEW.divisi || ')',
       NOW(),
       NOW()
     );
     
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_budget_to_cashflow ON management.t_budget_request;
CREATE TRIGGER trg_budget_to_cashflow
AFTER INSERT OR UPDATE ON management.t_budget_request
FOR EACH ROW
EXECUTE FUNCTION finance.fn_budget_to_cashflow();
