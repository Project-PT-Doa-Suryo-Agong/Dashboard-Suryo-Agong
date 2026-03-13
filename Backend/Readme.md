# Dashboard PT. Doa Suryo Agong — Backend

Backend service untuk dashboard internal PT. Doa Suryo Agong.

## Fokus Pengembangan

Proyek ini fokus pada backend:
- API endpoint (Next.js Route Handlers)
- Integrasi Supabase multi-schema
- Autentikasi dan validasi request
- Service layer dan business logic per domain SOP

## Aturan Database (WAJIB)

Struktur database sudah final, jadi:
- Jangan ubah skema database existing
- Jangan tambah/hapus/rename tabel, kolom, relasi, atau constraint
- Jangan jalankan migration yang mengubah struktur DB

## Struktur Kolom Database (Ground Truth)

| Schema | Tabel | Kolom |
|--------|-------|-------|
| `core` | `profiles` | `id`, `nama`, `role`, `phone`, `created_at`, `updated_at` |
| `core` | `m_produk` | `id`, `nama_produk`, `kategori`, `created_at`, `updated_at` |
| `core` | `m_varian` | `id`, `product_id`, `nama_varian`, `sku`, `harga`, `created_at`, `updated_at` |
| `core` | `m_vendor` | `id`, `nama_vendor`, `kontak`, `created_at`, `updated_at` |
| `hr` | `m_karyawan` | `id`, `profile_id`, `nama`, `posisi`, `divisi`, `status`, `gaji_pokok`, `created_at`, `updated_at` |
| `hr` | `t_attendance` | `id`, `employee_id`, `tanggal`, `status`, `created_at` |
| `hr` | `t_employee_warning` | `id`, `employee_id`, `level`, `alasan`, `created_at` |
| `finance` | `t_cashflow` | `id`, `tipe`, `amount`, `keterangan`, `created_at`, `updated_at` |
| `finance` | `t_payroll_history` | `id`, `employee_id`, `bulan`, `total`, `created_at` |
| `finance` | `t_reimbursement` | `id`, `employee_id`, `amount`, `status`, `created_at` |
| `production` | `t_produksi_order` | `id`, `vendor_id`, `product_id`, `quantity`, `status`, `created_at` |
| `production` | `t_qc_inbound` | `id`, `produksi_order_id`, `hasil`, `created_at` |
| `production` | `t_qc_outbound` | `id`, `produksi_order_id`, `hasil`, `created_at` |
| `logistics` | `t_packing` | `id`, `order_id`, `status`, `created_at` |
| `logistics` | `t_logistik_manifest` | `id`, `order_id`, `resi`, `created_at` |
| `logistics` | `t_return_order` | `id`, `order_id`, `alasan`, `created_at` |
| `sales` | `m_affiliator` | `id`, `nama`, `platform`, `created_at` |
| `sales` | `t_sales_order` | `id`, `varian_id`, `affiliator_id`, `quantity`, `total_price`, `created_at` |
| `sales` | `t_content_planner` | `id`, `judul`, `platform`, `created_at` |
| `sales` | `t_live_performance` | `id`, `platform`, `revenue`, `created_at` |
| `management` | `t_kpi_weekly` | `id`, `minggu`, `divisi`, `target`, `realisasi`, `created_at` |
| `management` | `t_budget_request` | `id`, `divisi`, `amount`, `status`, `created_at` |

## Setup Project

```bash
npm install
npm run dev
```

## Environment Variables

Salin `.env.example` ke `.env.local`, lalu isi nilainya:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Konsep Role/Level Akses

- Sistem satu dashboard terpadu.
- Hak akses ditentukan oleh `access level` (4 level: strategic, managerial, operational, support).
- User pada level yang sama memiliki hak menu yang sama.
- Pembeda antar user dalam level yang sama adalah `jabatan` (title), bukan scope hak akses.
- Level mapping:
  - `strategic` & `managerial` → akses semua 7 cluster
  - `operational` → cluster 2–6
  - `support` → cluster 7 saja

## Arsitektur Multi-Schema Supabase

Database menggunakan **7 custom PostgreSQL schema** (bukan `public`):

| Schema | Tabel | Domain |
|--------|-------|--------|
| `core` | `profiles`, `m_produk`, `m_varian`, `m_vendor` | Master data produk & user |
| `hr` | `m_karyawan`, `t_attendance`, `t_employee_warning` | SDM & kehadiran |
| `finance` | `t_cashflow`, `t_payroll_history`, `t_reimbursement` | Keuangan |
| `production` | `t_produksi_order`, `t_qc_inbound`, `t_qc_outbound` | Produksi & QC |
| `logistics` | `t_logistik_manifest`, `t_packing`, `t_return_order` | Logistik & packing |
| `sales` | `m_affiliator`, `t_content_planner`, `t_live_performance`, `t_sales_order` | Penjualan & konten |
| `management` | `t_budget_request`, `t_kpi_weekly` | Manajemen & KPI |

Pattern query: `(client as any).schema("schemaName").from("tableName")`

---

## Progress Backend

- [x] Setup fondasi project Next.js backend
- [x] Setup Supabase client (server/browser)
- [x] Standarisasi response helper (`ok` dan `fail`)
- [x] Endpoint health check
- [x] Endpoint auth (login/logout/me)
- [x] Endpoint profil user login (`GET/PUT /api/profile/me`)
- [x] Policy akses level + jabatan + endpoint akses menu
- [x] Tipe data lengkap semua 7 schema (`types/supabase.ts`)
- [x] Service layer per domain (7 service files, 21 tabel)
- [x] CRUD endpoint semua domain bisnis (40+ route handlers)

---

## Ringkasan Implementasi

### Fondasi Project

- **Next.js 14** (App Router, TypeScript strict mode) sebagai backend-only service
- **Supabase SSR** (`@supabase/ssr`) — dua client: `lib/supabase/server.ts` (cookie-based) dan `lib/supabase/browser.ts`
- Validasi environment variable di `lib/env.ts`
- Response helper di `lib/http/response.ts` — `ok()` dan `fail()`
- `middleware.ts` — enforce HTTPS di production

---

### Tipe Data

| File | Isi |
|------|-----|
| `types/supabase.ts` | Full Database type — 7 schema, 21 tabel, Row/Insert/Update types |
| `types/api.ts` | `ApiSuccess<T>`, `ApiError` — tipe response standar |
| `types/access.ts` | `AccessLevel`, `MenuItem`, `MenuCluster`, `AccessSummary` |
| `types/profile.ts` | Input types untuk operasi profil |

---

### Auth & Access Control

**Guards** (`lib/guards/auth.guard.ts`):
- `requireAuth()` — wajib login
- `requireRole()` — filter by role DB
- `requireLevel()` — filter by access level
- `requireClusterAccess()` — filter by cluster menu

**Policy** (`lib/access/policy.ts`):
- `inferAccessLevel()` — tentukan level dari `role` + `division`
- `resolveJabatan()` — tentukan jabatan/title berdasarkan data profil
- `buildAccessSummary()` — bangun ringkasan akses menu user
- `canAccessCluster()` / `canAccessMenu()` — cek izin akses spesifik

**Catalog** (`lib/access/catalog.ts`):
- Master menu dari 7 cluster SOP PT. Doa Suryo Agong

---

### Service Layer

| File | Tabel yang dilayani |
|------|---------------------|
| `lib/services/profile.service.ts` | `core.profiles` |
| `lib/services/core.service.ts` | `core.m_produk`, `m_varian`, `m_vendor` |
| `lib/services/hr.service.ts` | `hr.m_karyawan`, `t_attendance`, `t_employee_warning` |
| `lib/services/finance.service.ts` | `finance.t_cashflow`, `t_payroll_history`, `t_reimbursement` |
| `lib/services/production.service.ts` | `production.t_produksi_order`, `t_qc_inbound`, `t_qc_outbound` |
| `lib/services/logistics.service.ts` | `logistics.t_logistik_manifest`, `t_packing`, `t_return_order` |
| `lib/services/sales.service.ts` | `sales.m_affiliator`, `t_content_planner`, `t_live_performance`, `t_sales_order` |
| `lib/services/management.service.ts` | `management.t_budget_request`, `t_kpi_weekly` |

---

### Semua Endpoint API

#### Auth & Profil

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/health` | Public |
| `POST` | `/api/auth/login` | Public |
| `POST` | `/api/auth/logout` | Public |
| `GET` | `/api/auth/me` | Login |
| `GET` | `/api/profile/me` | Login |
| `PUT` | `/api/profile/me` | Login |
| `GET` | `/api/access/me` | Login |
| `GET` | `/api/access/catalog` | Public |
| `GET` | `/api/access/check?cluster=...&menu=...` | Login |
| `GET` | `/api/profiles` | Strategic/Managerial |
| `POST` | `/api/profiles` | Strategic/Managerial |
| `GET` | `/api/profiles/[id]` | Strategic/Managerial |
| `PATCH` | `/api/profiles/[id]` | Strategic/Managerial |
| `DELETE` | `/api/profiles/[id]` | Strategic |

#### Core — Master Data

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/core/products` | Semua level |
| `POST` | `/api/core/products` | Strategic/Managerial |
| `GET` | `/api/core/products/[id]` | Semua level |
| `PATCH` | `/api/core/products/[id]` | Strategic/Managerial |
| `DELETE` | `/api/core/products/[id]` | Strategic |
| `GET` | `/api/core/variants?produk_id=` | Semua level |
| `POST` | `/api/core/variants` | Strategic/Managerial |
| `GET` | `/api/core/variants/[id]` | Semua level |
| `PATCH` | `/api/core/variants/[id]` | Strategic/Managerial |
| `DELETE` | `/api/core/variants/[id]` | Strategic |
| `GET` | `/api/core/vendors` | Strategic/Managerial/Operational |
| `POST` | `/api/core/vendors` | Strategic/Managerial |
| `GET` | `/api/core/vendors/[id]` | Strategic/Managerial/Operational |
| `PATCH` | `/api/core/vendors/[id]` | Strategic/Managerial |
| `DELETE` | `/api/core/vendors/[id]` | Strategic |

#### HR

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/hr/karyawan` | Strategic/Managerial/Operational |
| `POST` | `/api/hr/karyawan` | Strategic/Managerial |
| `GET` | `/api/hr/karyawan/[id]` | Strategic/Managerial/Operational |
| `PATCH` | `/api/hr/karyawan/[id]` | Strategic/Managerial |
| `DELETE` | `/api/hr/karyawan/[id]` | Strategic |
| `GET` | `/api/hr/attendance?employee_id=` | Strategic/Managerial/Operational |
| `POST` | `/api/hr/attendance` | Strategic/Managerial/Operational |
| `GET` | `/api/hr/warnings` | Strategic/Managerial |
| `POST` | `/api/hr/warnings` | Strategic/Managerial |

#### Finance

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/finance/cashflow` | Strategic/Managerial |
| `POST` | `/api/finance/cashflow` | Strategic/Managerial |
| `GET` | `/api/finance/payroll?employee_id=` | Strategic/Managerial |
| `POST` | `/api/finance/payroll` | Strategic/Managerial |
| `GET` | `/api/finance/reimbursement?employee_id=` | Strategic/Managerial |
| `POST` | `/api/finance/reimbursement` | Strategic/Managerial/Operational |

#### Production

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/production/orders` | Strategic/Managerial/Operational |
| `POST` | `/api/production/orders` | Strategic/Managerial |
| `GET` | `/api/production/orders/[id]` | Strategic/Managerial/Operational |
| `PATCH` | `/api/production/orders/[id]` | Strategic/Managerial/Operational |
| `DELETE` | `/api/production/orders/[id]` | Strategic |
| `GET` | `/api/production/qc-inbound?produksi_order_id=` | Strategic/Managerial/Operational |
| `POST` | `/api/production/qc-inbound` | Strategic/Managerial/Operational |
| `GET` | `/api/production/qc-outbound` | Strategic/Managerial/Operational |
| `POST` | `/api/production/qc-outbound` | Strategic/Managerial/Operational |

#### Logistics

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/logistics/manifest` | Strategic/Managerial/Operational |
| `POST` | `/api/logistics/manifest` | Strategic/Managerial/Operational |
| `GET` | `/api/logistics/packing` | Strategic/Managerial/Operational |
| `POST` | `/api/logistics/packing` | Strategic/Managerial/Operational |
| `GET` | `/api/logistics/returns` | Strategic/Managerial/Operational |
| `POST` | `/api/logistics/returns` | Strategic/Managerial/Operational |

#### Sales

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/sales/orders` | Strategic/Managerial/Operational |
| `POST` | `/api/sales/orders` | Strategic/Managerial/Operational |
| `GET` | `/api/sales/affiliates` | Strategic/Managerial/Operational |
| `POST` | `/api/sales/affiliates` | Strategic/Managerial |
| `GET` | `/api/sales/content` | Strategic/Managerial/Operational |
| `POST` | `/api/sales/content` | Strategic/Managerial/Operational |
| `GET` | `/api/sales/live` | Strategic/Managerial/Operational |
| `POST` | `/api/sales/live` | Strategic/Managerial/Operational |

#### Management

| Method | Path | Akses |
|--------|------|-------|
| `GET` | `/api/management/budget` | Strategic/Managerial |
| `POST` | `/api/management/budget` | Strategic/Managerial/Operational |
| `GET` | `/api/management/kpi?divisi=` | Strategic/Managerial |
| `POST` | `/api/management/kpi` | Strategic/Managerial |

---

## Catatan Teknis

- **Query pattern**: `(client as any).schema("schemaName").from("tableName")` — diperlukan karena type incompatibility antara `@supabase/ssr` dan custom Database generic
- **Pagination**: semua list endpoint mendukung `?page=` dan `?limit=` query params