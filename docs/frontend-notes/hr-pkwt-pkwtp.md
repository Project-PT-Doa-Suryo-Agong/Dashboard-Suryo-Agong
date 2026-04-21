# Human Resources - Editor Surat PKWT/PKWTP

## Status
Belum terintegrasi di frontend.

## Kebutuhan Halaman
- Tambah menu HR baru untuk editor surat PKWT/PKWTP.
- UI minimal memiliki:
  - Pemilihan tipe template (pkwt atau pkwtp)
  - Form informasi karyawan
  - Editor isi template
  - Tombol generate draft surat

## Endpoint
- GET /api/hr/contracts/templates
- GET /api/hr/contracts/templates/:type
- PUT /api/hr/contracts/templates/:type
- POST /api/hr/contracts/generate

## Payload Generate
- templateType: pkwt atau pkwtp
- employee:
  - employee_name
  - employee_nik
  - employee_identity_number
  - employee_address
  - employee_position
  - employee_department
  - contract_number
  - contract_start_date
  - contract_end_date (wajib untuk pkwt)
  - probation_months (wajib untuk pkwtp)
  - probation_end_date (wajib untuk pkwtp)

## Sumber Template
- Template backend ada di data/hr-contract-templates.json.
