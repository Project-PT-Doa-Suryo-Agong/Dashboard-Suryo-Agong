# Full-Stack Gap Analysis vs database.md

Tanggal audit: 2026-03-30
Ruang lingkup scan: Frontend/app, Frontend/types, Frontend/lib
Sumber skema: [database.md](database.md)

## 1. ✅ YANG SUDAH BENAR (Fully Aligned)

Berikut mapping yang sudah selaras secara struktur inti tabel-kolom dan alur UI.

| Tabel DB | Status | Bukti UI/Type | Catatan |
|---|---|---|---|
| core.m_produk | Aligned | [app/developer/master-data/produk/page.tsx](app/developer/master-data/produk/page.tsx#L16), [app/developer/master-data/produk/page.tsx](app/developer/master-data/produk/page.tsx#L177), [database.md](database.md#L93) | Kolom utama nama_produk, kategori, created_at sudah terpetakan. |
| core.m_varian | Aligned | [app/developer/master-data/varian/page.tsx](app/developer/master-data/varian/page.tsx#L23), [app/developer/master-data/varian/page.tsx](app/developer/master-data/varian/page.tsx#L25), [database.md](database.md#L101) | FK product_id, nama_varian, sku, harga sudah ada di form/state. |
| core.m_vendor | Aligned | [app/developer/master-data/vendor/page.tsx](app/developer/master-data/vendor/page.tsx#L7), [app/developer/master-data/vendor/page.tsx](app/developer/master-data/vendor/page.tsx#L9), [database.md](database.md#L111) | nama_vendor, kontak, created_at sudah ada pada UI table/form. |
| finance.t_cashflow | Aligned | [app/finance/cashflow/page.tsx](app/finance/cashflow/page.tsx#L10), [app/finance/cashflow/page.tsx](app/finance/cashflow/page.tsx#L12), [database.md](database.md#L155) | tipe income/expense, amount, keterangan, createdAt sudah konsisten. |
| sales.t_sales_order | Aligned | [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L8), [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L9), [database.md](database.md#L243) | varian_id, affiliator_id, quantity, total_price sudah terwakili di form. |
| sales.t_content_planner | Aligned | [app/creative/content/page.tsx](app/creative/content/page.tsx#L17), [app/creative/content/page.tsx](app/creative/content/page.tsx#L19), [database.md](database.md#L252) | judul, platform, createdAt sudah tersedia. |
| sales.t_live_performance | Aligned | [app/creative/live-perf/page.tsx](app/creative/live-perf/page.tsx#L8), [app/creative/live-perf/page.tsx](app/creative/live-perf/page.tsx#L9), [database.md](database.md#L259) | platform dan revenue tersedia di form input. |

## 2. ⚠️ YANG KURANG ATAU TIDAK MATCH (The Gaps)

### A. Missing Tables (UI belum ada)

| Tabel DB | Temuan | Bukti |
|---|---|---|
| sales.m_affiliator | Tidak ada halaman CRUD UI khusus untuk master affiliator. Saat ini hanya dipakai sebagai dropdown statis di sales order. | [database.md](database.md#L236), [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L55), [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L60), [app/api/sales/affiliates/route.ts](app/api/sales/affiliates/route.ts#L3) |

### B. Missing Columns / Relasi tidak dipetakan dengan benar

| Tabel DB | Gap | Bukti |
|---|---|---|
| core.profiles | Enum role DB memakai CEO, UI memakai Management. | [database.md](database.md#L23), [database.md](database.md#L25), [app/developer/users/page.tsx](app/developer/users/page.tsx#L8), [app/auth/page.tsx](app/auth/page.tsx#L18) |
| hr.m_karyawan | Kolom profile_id belum dipakai di UI form/state. | [database.md](database.md#L123), [app/hr/karyawan/page.tsx](app/hr/karyawan/page.tsx#L8) |
| hr.t_attendance | DB butuh employee_id (FK), UI menyimpan employeeName/divisi sebagai string tampilan. | [database.md](database.md#L135), [app/hr/attendance/page.tsx](app/hr/attendance/page.tsx#L12), [app/hr/attendance/page.tsx](app/hr/attendance/page.tsx#L112), [app/hr/attendance/page.tsx](app/hr/attendance/page.tsx#L198) |
| hr.t_employee_warning | DB butuh employee_id, level, alasan. UI memakai employeeName/posisi/createdAt display-centric. | [database.md](database.md#L143), [app/hr/warnings/page.tsx](app/hr/warnings/page.tsx#L10), [app/hr/warnings/page.tsx](app/hr/warnings/page.tsx#L92), [app/hr/warnings/page.tsx](app/hr/warnings/page.tsx#L171) |
| finance.t_payroll_history | DB butuh employee_id, UI hanya employeeName string (tanpa FK). | [database.md](database.md#L164), [app/finance/payroll/page.tsx](app/finance/payroll/page.tsx#L8) |
| finance.t_reimbursement | DB butuh employee_id, UI memakai employeeName/divisi string. | [database.md](database.md#L172), [app/finance/reimburse/page.tsx](app/finance/reimburse/page.tsx#L12), [app/finance/reimburse/page.tsx](app/finance/reimburse/page.tsx#L13) |
| production.t_produksi_order | DB: vendor_id, product_id, quantity, status. UI: product_name, target_qty, pic, start_date, deadline. FK inti tidak dipakai. | [database.md](database.md#L184), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L9), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L11), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L12) |
| production.t_qc_inbound | DB hanya produksi_order_id + hasil. UI menambah po_number, material_name, qty_received, inspector_name, note. | [database.md](database.md#L193), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L11), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L12), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L13) |
| production.t_qc_outbound | DB hanya produksi_order_id + hasil. UI menambah batch_id, product_name, qty_produced, inspector_name, notes. | [database.md](database.md#L200), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L11), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L12), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L13) |
| logistics.t_packing | DB: order_id + status. UI menambah picker_name (kolom tidak ada di DB). | [database.md](database.md#L211), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L14) |
| logistics.t_logistik_manifest | DB: order_id, resi, created_at. UI menambah driver_name, vehicle_number, destination, status. | [database.md](database.md#L218), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L14), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L15), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L16), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L17) |
| logistics.t_return_order | DB: order_id, alasan, created_at. UI menambah customer_name, product_name, reason, status. | [database.md](database.md#L225), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L13), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L14), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L15), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L16) |
| management.t_kpi_weekly | DB minggu bertipe date, UI memakai label string Week 1 - Mar 2026 dan kolom score turunan. | [database.md](database.md#L270), [app/management/kpi/page.tsx](app/management/kpi/page.tsx#L14), [app/management/kpi/page.tsx](app/management/kpi/page.tsx#L18), [app/management/kpi/page.tsx](app/management/kpi/page.tsx#L21) |
| management.t_budget_request | DB tidak punya kolom keterangan, tetapi UI menambah keterangan sebagai data utama. | [database.md](database.md#L279), [app/management/budget/page.tsx](app/management/budget/page.tsx#L14), [app/management/budget/page.tsx](app/management/budget/page.tsx#L232) |

### C. Enum Mismatches

| Domain | DB Enum | UI Enum | Bukti |
|---|---|---|---|
| core.user_role | Developer, CEO, Finance, HR, Produksi, Logistik, Creative, Office | Management dipakai sebagai role | [database.md](database.md#L23), [database.md](database.md#L25), [app/developer/users/page.tsx](app/developer/users/page.tsx#L8), [app/auth/page.tsx](app/auth/page.tsx#L18) |
| production.production_status | draft, ongoing, done | pending, in_progress, completed, cancelled | [database.md](database.md#L57), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L7) |
| production.qc_result | pass, reject | inbound: pending/approved/rejected/partial, outbound: pending/passed/failed/rework | [database.md](database.md#L63), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L7), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L7) |
| logistics.packing_status | pending, packed, shipped | pending, proses, selesai (mapping manual) | [database.md](database.md#L68), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L8), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L70), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L76) |
| logistics.return/manifest | Tidak ada enum status di tabel DB | UI membuat enum status sendiri | [database.md](database.md#L218), [database.md](database.md#L225), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L7), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L7) |

### D. Type Issues

| Area | Issue | Bukti |
|---|---|---|
| types/supabase | Enum di type generator belum dipetakan; banyak kolom status/role masih string umum. | [types/supabase.ts](types/supabase.ts#L124), [types/supabase.ts](types/supabase.ts#L24), [types/supabase.ts](types/supabase.ts#L225), [types/supabase.ts](types/supabase.ts#L551) |
| Form numeric | Banyak input numeric disimpan sebagai string state lalu cast Number di submit. | [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L10), [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L11), [app/finance/cashflow/page.tsx](app/finance/cashflow/page.tsx#L79), [app/developer/master-data/varian/page.tsx](app/developer/master-data/varian/page.tsx#L40) |
| ID format dummy | Banyak data dummy pakai format non-uuid padahal tabel DB uuid. | [database.md](database.md#L93), [app/developer/master-data/produk/page.tsx](app/developer/master-data/produk/page.tsx#L34), [app/finance/reimburse/page.tsx](app/finance/reimburse/page.tsx#L22), [app/management/budget/page.tsx](app/management/budget/page.tsx#L21) |
| Filter kategori office/products | Data punya kategori Concentrate, tetapi tipe filter tidak mengizinkan Concentrate. | [app/office/products/page.tsx](app/office/products/page.tsx#L21), [app/office/products/page.tsx](app/office/products/page.tsx#L34) |

## 3. 📋 REKOMENDASI ACTION PLAN (Next Steps)

Prioritas diurutkan berdasarkan dampak ke readiness integrasi Supabase API.

1. Kunci kontrak enum dan role terlebih dahulu.
   File utama refactor: [types/supabase.ts](types/supabase.ts#L24), [app/developer/users/page.tsx](app/developer/users/page.tsx#L6), [app/auth/page.tsx](app/auth/page.tsx#L16), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L7), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L7), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L7), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L8).

2. Benahi relasi FK di semua form transaksi.
   Wajib ubah field display string menjadi id FK: employee_id, product_id, vendor_id, produksi_order_id, affiliator_id.
   File target: [app/hr/attendance/page.tsx](app/hr/attendance/page.tsx#L112), [app/hr/warnings/page.tsx](app/hr/warnings/page.tsx#L92), [app/finance/payroll/page.tsx](app/finance/payroll/page.tsx#L8), [app/finance/reimburse/page.tsx](app/finance/reimburse/page.tsx#L12), [app/produksi/orders/page.tsx](app/produksi/orders/page.tsx#L9), [app/produksi/qc/inbound/page.tsx](app/produksi/qc/inbound/page.tsx#L11), [app/produksi/qc/outbound/page.tsx](app/produksi/qc/outbound/page.tsx#L11).

3. Selesaikan gap struktur tabel logistik.
   Pilih salah satu: menyederhanakan UI mengikuti tabel sekarang, atau perluas skema DB.
   Gap terbesar ada di: [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L10), [app/logistik/returns/page.tsx](app/logistik/returns/page.tsx#L10), [app/logistik/packing/page.tsx](app/logistik/packing/page.tsx#L14).

4. Buat halaman CRUD khusus sales.m_affiliator.
   API service sudah ada, tinggal hubungkan UI.
   Referensi: [lib/services/sales.service.ts](lib/services/sales.service.ts#L10), [app/api/sales/affiliates/route.ts](app/api/sales/affiliates/route.ts#L3), [database.md](database.md#L236).

5. Rapikan tipe tanggal dan angka untuk payload Supabase.
   Gunakan date ISO untuk kolom date/timestamptz dan number murni untuk numeric/int sejak state form.
   File prioritas: [app/management/kpi/page.tsx](app/management/kpi/page.tsx#L14), [app/creative/sales-order/page.tsx](app/creative/sales-order/page.tsx#L10), [app/creative/live-perf/page.tsx](app/creative/live-perf/page.tsx#L9), [app/developer/master-data/varian/page.tsx](app/developer/master-data/varian/page.tsx#L40).

6. Tetapkan keputusan untuk kolom UI tambahan yang belum ada di DB.
   Kolom seperti keterangan pada budget request atau driver_name pada manifest harus diputuskan: ditambah ke DB atau dihapus dari UI.
   Referensi: [app/management/budget/page.tsx](app/management/budget/page.tsx#L14), [app/logistik/manifest/page.tsx](app/logistik/manifest/page.tsx#L14), [database.md](database.md#L279), [database.md](database.md#L218).

7. Setelah refactor tipe, satukan kontrak request payload per endpoint.
   Konsolidasikan payload type untuk create/update berdasarkan tabel Supabase agar komponen UI dan API route tidak divergen.
   Referensi: [types/supabase.ts](types/supabase.ts), [app/api](app/api), [lib/services](lib/services).

## Ringkasan Singkat

Jumlah tabel di database.md: 20
Tabel dengan UI yang bisa diakses langsung: 19
Tabel yang belum punya UI dedicated: 1 (sales.m_affiliator)
Gap terbesar: modul produksi dan logistik (status enum, relasi FK, dan struktur kolom yang belum sinkron dengan skema DB).
