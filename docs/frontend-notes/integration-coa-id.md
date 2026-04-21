# Integrasi Kolom COA (coa_id)

## Status
Belum terintegrasi penuh di frontend.

## Kebutuhan
- Tambahkan input coa_id pada form:
  - Reimbursement (Finance)
  - Payroll History (Finance)
  - Sales Order (Sales)
  - Budget Request (Management)
- Sumber opsi COA diambil dari endpoint GET /api/finance/coa.
- Tampilkan relasi COA di tabel/listing terkait.

## Catatan
- Jika kolom coa_id di sales.t_sales_order dan management.t_budget_request belum ada, tambahkan dulu di DB sebelum test FE.
