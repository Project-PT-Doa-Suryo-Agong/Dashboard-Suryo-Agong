# Backend Endpoint Matrix

Dokumen ini merangkum endpoint internal Next.js App Router di folder `app/api`, termasuk method, guard auth, status endpoint, dan catatan penggunaan admin key.

## Legend

- `public`: tidak memakai `requireAuth/requireLevel`
- `auth`: memakai `requireAuth()`
- `level(...)`: memakai `requireLevel(...)`
- `deprecated`: endpoint tetap ada untuk kompatibilitas, tapi sudah tidak dipakai (HTTP 410)

## Access, Auth, Health

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/health | GET | public | active | Health check service |
| /api/access/catalog | GET | public | active | Mengembalikan menu catalog + mapping level |
| /api/access/me | GET | auth | active | Ringkasan level akses user saat ini |
| /api/access/check | GET | auth | active | Validasi akses cluster/menu |
| /api/auth/login | OPTIONS, POST | public | active | Login Supabase + CORS + redirect tenant |
| /api/auth/logout | POST | public | active | Sign out + clear auth cookies |
| /api/auth/me | GET | public (cek session internal) | active | Return info user + access summary |
| /api/dashboard/metrics | GET | auth | active | Aggregation lintas schema untuk KPI dashboard |

## Profile

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/profile/me | GET, PUT | public (cek session internal) | active | Profil user login sendiri |
| /api/profiles | GET | level(strategic, managerial, operational) | active | List profile |
| /api/profiles | POST | level(strategic, managerial) | active | Create profile (admin use-case) |
| /api/profiles/[id] | GET | level(strategic, managerial) | active | Detail profile by id |
| /api/profiles/[id] | PATCH | level(strategic, managerial) | active | Update profile by id |
| /api/profiles/[id] | DELETE | level(strategic) | active | Delete profile by id |

## Core Master Data

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/core/products | GET, POST | level(strategic, managerial, operational, support) | active | CRUD master produk |
| /api/core/products/[id] | PATCH, DELETE | level(strategic, managerial, operational, support) | active | CRUD master produk |
| /api/core/variants | GET, POST | level(strategic, managerial, operational, support) | active | CRUD varian |
| /api/core/variants/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | CRUD varian by id |
| /api/core/vendors | GET, POST | level(strategic, managerial, operational, support) | active | CRUD vendor |
| /api/core/vendors/[id] | PATCH, DELETE | level(strategic, managerial, operational, support) | active | CRUD vendor by id |

## HR

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/hr/roles | GET | level(strategic, managerial, operational, support) | active | Referensi role/divisi frontend |
| /api/hr/employees | GET, POST | level(strategic, managerial, operational) | active | Endpoint utama karyawan |
| /api/hr/employees/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Update/delete karyawan |
| /api/hr/karyawan | GET, POST | same as /hr/employees | active (alias) | Re-export dari endpoint employees |
| /api/hr/karyawan/[id] | PATCH, DELETE | same as /hr/employees/[id] | active (alias) | Re-export dari endpoint employees/[id] |
| /api/hr/attendance | GET, POST, PATCH, DELETE | level(strategic, managerial, operational) | active | Attendance collection endpoint |
| /api/hr/attendance/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Attendance by id |
| /api/hr/warnings | GET, POST | level(strategic, managerial, operational) | active | Employee warning |
| /api/hr/warnings/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Employee warning by id |

## Finance

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/finance/cashflow | GET, POST | level(strategic, managerial, operational) | active | Cashflow |
| /api/finance/cashflow/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Cashflow by id |
| /api/finance/payroll | GET, POST | level(strategic, managerial, operational) | active | Payroll |
| /api/finance/payroll/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Payroll by id |
| /api/finance/reimburse | GET, POST | level(strategic, managerial, operational) | active | Reimburse aktif |
| /api/finance/reimburse/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Reimburse by id |
| /api/finance/reimbursement | GET, POST | level(strategic, managerial, operational) | deprecated | Selalu balikan HTTP 410, pakai /reimburse |

## Logistics

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/logistics/manifest | GET, POST | level(strategic, managerial, operational) | active | Manifest; POST wajib `order_id` |
| /api/logistics/manifest/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Manifest by order/id |
| /api/logistics/packing | GET, POST | level(strategic, managerial, operational) | active | Packing; POST wajib `order_id` |
| /api/logistics/packing/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Packing by order/id |
| /api/logistics/returns | GET, POST | level(strategic, managerial, operational) | active | Return order; POST wajib `order_id` |
| /api/logistics/returns/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Return order by order/id |

## Sales

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/sales/orders | GET, POST | level(strategic, managerial, operational) | active | `total_price` dihitung backend |
| /api/sales/orders/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Sales order by id |
| /api/sales/affiliates | GET, POST | level(strategic, managerial, operational) | active | Affiliator |
| /api/sales/affiliates/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Affiliator by id |
| /api/sales/content | GET, POST | level(strategic, managerial, operational) | active | Content planner |
| /api/sales/content/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Content by id |
| /api/sales/live | GET, POST | level(strategic, managerial, operational) | active | Live performance |
| /api/sales/live/[id] | PATCH, DELETE | level(strategic, managerial, operational) | active | Live performance by id |

## Production

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/production/orders | GET, POST | level(strategic, managerial, operational) | active | Produksi order |
| /api/production/orders/[id] | GET, PATCH, DELETE | level(strategic, managerial, operational) | active | Produksi order by id |
| /api/production/qc-inbound | GET, POST | level(strategic, managerial, operational) | active | QC inbound |
| /api/production/qc-inbound/[id] | PATCH | level(strategic, managerial, operational) | active | QC inbound by id |
| /api/production/qc-inbound/[id] | DELETE | level(strategic, managerial) | active | Delete dibatasi managerial+ |
| /api/production/qc-outbound | GET, POST | level(strategic, managerial, operational) | active | QC outbound |
| /api/production/qc-outbound/[id] | PATCH | level(strategic, managerial, operational) | active | QC outbound by id |
| /api/production/qc-outbound/[id] | DELETE | level(strategic, managerial) | active | Delete dibatasi managerial+ |

## Management

| Endpoint | Methods | Guard | Status | Catatan |
|---|---|---|---|---|
| /api/management/budget | GET | level(strategic, managerial) | active | List budget request (approval view) |
| /api/management/budget | POST | level(strategic, managerial, operational) | active | Submit budget request |
| /api/management/budget/[id] | PATCH, DELETE | level(strategic, managerial) | active | Approval/update/delete budget |
| /api/management/kpi | GET, POST | level(strategic, managerial, operational) | active | KPI weekly |
| /api/management/kpi/[id] | PATCH | level(strategic, managerial, operational) | active | KPI by id |
| /api/management/kpi/[id] | DELETE | level(strategic, managerial) | active | Delete dibatasi managerial+ |

## Supabase Admin Key Usage

Pemakaian `supabaseAdmin` saat ini di:

- `/api/finance/reimburse` (upload bukti reimburse ke storage private)
- `/api/finance/reimburse/[id]` (update/upload ulang bukti reimburse)

Endpoint lain berjalan lewat supabase server client berbasis cookie session user (RLS tetap berlaku), kecuali service tertentu yang melakukan enrichment lintas schema di layer service.

## Source of Truth

- Routing: `app/api/**/route.ts`
- Guard: `lib/guards/auth.guard.ts`
- Response wrapper: `lib/http/response.ts`
- Access policy: `lib/access/policy.ts`
- Middleware/subdomain ACL: `proxy.ts`
