# Dashboard PT. Doa Suryo Agong

Unified Enterprise Dashboard untuk mengelola seluruh divisi perusahaan dalam satu ekosistem.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database & Auth:** Supabase (PostgreSQL + Auth + RLS)
- **Icons:** Lucide React

## Arsitektur Backend — Hybrid

Dashboard ini menggunakan arsitektur **hybrid backend** dimana beban server dibagi antara Supabase (direct) dan Next.js API Routes:

```
Browser ──→ Supabase Direct    (auth, CRUD ringan — dijaga RLS)
Browser ──→ Next.js API Route  (business logic kompleks)
```

### Supabase Direct (tanpa lewat Next.js API)

Fitur-fitur berikut diakses langsung dari browser ke Supabase, diamankan oleh Row Level Security (RLS) di level database:

| Fitur | Cara Akses |
|-------|------------|
| Authentication (login/logout/session) | `useAuth()` hook via Supabase Auth |
| CRUD Produk, Varian, Vendor | `useTable("core", "m_produk")` |
| CRUD Karyawan, Attendance, Warning | `useTable("hr", "m_karyawan")` |
| CRUD Cashflow | `useTable("finance", "t_cashflow")` |
| CRUD Packing, Manifest, Returns | `useTable("logistics", ...)` |
| CRUD Affiliator, Content, Live, Orders | `useTable("sales", ...)` |
| CRUD KPI Weekly | `useTable("management", "t_kpi_weekly")` |

### Next.js API Routes (business logic)

Endpoint berikut tetap berjalan di server karena membutuhkan logic yang tidak bisa dilakukan di client:

| Endpoint | Fungsi |
|----------|--------|
| `GET /api/access/catalog` | Mendapatkan daftar menu berdasarkan access level |
| `GET /api/access/check` | Cek apakah user punya akses ke cluster/menu tertentu |
| `GET /api/access/me` | Gabungan auth + profile + access summary |
| `GET /api/dashboard/metrics` | Aggregation data lintas schema untuk dashboard |
| `GET /api/health` | Server health check |
| `GET/POST /api/profiles` | List & create profile (butuh Supabase Admin API) |
| `GET/PUT/DELETE /api/profiles/[id]` | Manage profile by ID (butuh Supabase Admin API) |
| `GET/PUT /api/profile/me` | Read & update own profile |
| `GET/POST /api/finance/reimburse` | Reimbursement dengan approval workflow |
| `PUT /api/finance/reimburse/[id]` | Approval: pending → approved/rejected |
| `GET/POST /api/finance/payroll` | Perhitungan gaji lintas tabel |
| `GET/POST /api/management/budget` | Budget request dengan approval workflow |
| `PUT /api/management/budget/[id]` | Approval: pending → approved/rejected |

### Alasan Pembagian

| Supabase Direct | Next.js API |
|-----------------|-------------|
| CRUD standar (simple read/write) | Orchestrasi multi-tabel |
| Data yang diproteksi RLS | Supabase Admin API (service_role_key) |
| Operasi yang tidak butuh logic server | Approval workflows |
| Realtime subscriptions | Aggregation query lintas schema |

## Struktur Database (Supabase)

Database menggunakan multi-schema PostgreSQL:

| Schema | Tabel | Deskripsi |
|--------|-------|-----------|
| `core` | `profiles`, `m_produk`, `m_varian`, `m_vendor` | Data master & user profile |
| `hr` | `m_karyawan`, `t_attendance`, `t_employee_warning` | SDM & kehadiran |
| `finance` | `t_cashflow`, `t_payroll_history`, `t_reimbursement` | Keuangan |
| `production` | `t_produksi_order`, `t_qc_inbound`, `t_qc_outbound` | Produksi & QC |
| `logistics` | `t_packing`, `t_logistik_manifest`, `t_return_order` | Logistik |
| `sales` | `m_affiliator`, `t_content_planner`, `t_live_performance`, `t_sales_order` | Penjualan |
| `management` | `t_budget_request`, `t_kpi_weekly` | Manajemen strategis |

## Keamanan

- **Authentication:** Supabase Auth (email + password)
- **Authorization:** Row Level Security (RLS) per tabel berdasarkan role user
- **Role Matrix:**
  - `Developer`, `CEO` → Strategic (akses penuh)
  - `Finance`, `HR`, `Produksi`, `Logistik`, `Creative` → Operational (sesuai divisi)
  - `Office` → Support (akses terbatas)
- **RLS Policies:** Didefinisikan di `supabase/rls-policies.sql`

## Struktur Folder

```
app/
├── api/                  # Next.js API Routes (business logic)
│   ├── access/           # Access control & policy
│   ├── auth/             # Auth callback
│   ├── dashboard/        # Dashboard metrics
│   ├── finance/          # Payroll, reimburse (approval)
│   ├── management/       # Budget (approval)
│   ├── profiles/         # Admin user management
│   └── ...
├── auth/                 # Halaman login
├── creative/             # Dashboard Creative & Sales
├── developer/            # Dashboard Developer
├── finance/              # Dashboard Finance
├── hr/                   # Dashboard HR
├── logistik/             # Dashboard Logistik
├── management/           # Dashboard Management
├── office/               # Dashboard Office Support
└── produksi/             # Dashboard Produksi

components/
├── auth/
│   └── AuthGuard.tsx     # Proteksi halaman berdasarkan role
├── sidebar.tsx
├── topbar.tsx
└── ui/                   # Reusable UI components

lib/
├── access/               # Policy engine & menu catalog
├── guards/               # Server-side auth guard (untuk API routes)
├── http/                 # HTTP client & response helpers
├── services/             # Service layer (untuk API routes)
├── supabase/
│   ├── admin.ts          # Supabase Admin client (service_role_key)
│   ├── auth-context.tsx  # AuthProvider (client-side auth state)
│   ├── browser.ts        # Supabase Browser client
│   ├── hooks.ts          # Generic CRUD hooks (useTable, useInsert, etc.)
│   └── server.ts         # Supabase Server client (SSR)
└── validation/           # Input validation schemas

supabase/
└── rls-policies.sql      # RLS policies untuk semua tabel

types/
├── access.ts             # Access level & menu types
├── api.ts                # API response types
├── profile.ts            # Profile input types
└── supabase.ts           # Auto-generated database types
```

## Migration Note: Phase 2 Hybrid Backend (April 2026)

Sebuah inisiatif sedang berlangsung untuk memigrasikan endpoint CRUD konvensional yang membebani Next.js server (`/api/*`) menuju komunikasi akses langsung **Supabase Hooks** lewat folder `lib/supabase/hooks/` untuk meningkatkan skalabilitas dan mengurangi beban server.

### Status hooks:
Hook internal telah dibuat untuk domain logika berikut: `finance`, `logistics`, `management`, `production`, `sales`. 
File service server-side di folder `lib/services/*.ts` telah ditandai `@deprecated`.

### Menunggu Refactor UI/Frontend:
Untuk menyelesaikan migrasi ini, halaman-halaman _frontend_ berikut harus direfactor agar berhenti memanggil fungsi `fetch('/api/...')` dan menggantinya dengan memanggil custom hooks yang telah dibuat.
**Daftar halaman yang perlu disesuaikan (untuk CRUD langsung):**
1. **Core / HR:** `app/hr/attendance/page.tsx`, `app/hr/warnings/page.tsx`, dsb (sudah dibuat sebagian).
2. **Logistik:** `app/logistik/manifest/page.tsx`, `app/logistik/packing/page.tsx`, `app/logistik/returns/page.tsx` 
3. **Sales/Creative:** `app/creative/content/page.tsx`, jadwal live, affiliator (**CATATAN: Sales Order tetap via Next.js API**)
4. **Finance:** `app/finance/cashflow/page.tsx` (**CATATAN: Payroll & Reimburse tetap via Next.js API**)
5. **Management:** `app/management/kpi/page.tsx` (**CATATAN: Budget request tetap via Next.js API**)
6. **Produksi:** **Semua operasi produksi (QC, Pesanan) tetap via Next.js API untuk orkestrasi.**

Setelah semua komponen ini di-refactor menggunakan Supabase hooks (_misal:_ `useManifest()`), maka direktori API rute CRUD murni di `app/api/...` dan file deprecated di `lib/services/...` dapat dihapus seluruhnya.

## Getting Started

### Prerequisites

- Node.js 18+
- Akun Supabase dengan project yang sudah dikonfigurasi

### Environment Variables

Buat file `.env` di root project:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Setup RLS

Jalankan script RLS di Supabase Dashboard → SQL Editor:

```
supabase/rls-policies.sql
```

### Run Development Server

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Setiap divisi diakses melalui subdomain:
- `http://finance.localhost:3000`
- `http://hr.localhost:3000`
- `http://produksi.localhost:3000`
- dst.
