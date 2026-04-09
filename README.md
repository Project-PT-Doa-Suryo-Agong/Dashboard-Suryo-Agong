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


## Catatan Migrasi Hybrid Backend (Menunggu Penyesuaian Frontend)

Saat ini, migrasi arsitektur *Hybrid* (Fase 1 hingga Fase 4) di sisi server/backend telah **mencapai 100%**. Namun untuk mewujudkan perampingan ini sepenuhnya, pihak Frontend wajib menyelesaikan transisi pemanggilan data dengan rincian berikut:

### 1. Refactor API Call (Migrasi ke supabase.schema().from())
**Konteks Fase 2 & 3**: Hampir seluruh endpoint app/api/... konvensional (untuk operasi CRUD sederhana) dan layer service-nya telah **dihapus**. 
**Tindakan Frontend**: Gantikan fetch('/api/...') dengan memanggil langsung via client Supabase. Modul-modul UI yang harus disesuaikan:
- **Core / HR:** app/hr/attendance/page.tsx, app/hr/warnings/page.tsx
- **Logistik:** app/logistik/manifest/page.tsx, app/logistik/packing/page.tsx, app/logistik/returns/page.tsx
- **Sales/Creative:** Halaman content, jadwal live, affiliator. *(Catatan: Sales Order tetap via Next.js API).*
- **Finance:** app/finance/cashflow/page.tsx. *(Catatan: Payroll & Reimburse tetap via Next.js API).*
- **Management:** app/management/kpi/page.tsx. *(Catatan: Budget request tetap via Next.js API).*
- **Produksi:** Semua operasi produksi (QC, Pesanan) tetap via Next.js API untuk orkestrasi workflow.

### 2. Penyesuaian Auth Endpoints (Migrasi Fase 1)
**Konteks Fase 1**: Folder app/api/auth (yang melayani rute login, logout, dan session) dinilai berlebihan dan telah **dihapus**.
**Tindakan Frontend**: Rute autentikasi mandiri (seperti di page.tsx login) kini wajib langsung berhubungan dengan Supabase API (supabase.auth.signInWithPassword(...)).

### 3. Standarisasi Tipe Role Backend (Cleanup Kritis)
**Konteks Audit Akhir**: RLS dan sistem keamanan telah dirampingkan. Role CEO, Human Resource, Management & Strategy, dsb. sudah tidak dikenali oleh guard JWT di Backend.
**Tindakan Frontend**: Pastikan state UI anda hanya merujuk pada standar baku 8 lowercase ini: developer, management, finance, hr, produksi, logistik, creative, office. Ubah seluruh kode kondisi seperti if (role === 'CEO') menjadi if (role === 'Management & Strategy').

### 4. Instalasi Supabase Realtime (Fitur Fase 4)
**Konteks Fase 4**: Agar panel dashboard terasa kekinian, Publication Realtime telah diaktifkan di database backend untuk tabel antrean dinamis.
**Tindakan Frontend**: Tim frontend kini bisa menulis *custom hooks* (menggunakan supabase.channel('...').on('postgres_changes', ...).subscribe()) untuk merefleksikan pembaruan *live* di tabel:
   - logistics.t_packing
   - finance.t_reimbursement
   - production.t_produksi_order

### 5. Adaptasi Direct Upload Storage (Fitur Fase 4)
**Konteks Fase 4**: File gambar/dokumen tidak perlu transit merepotkan server utama. Bucket storage reimbursements (private) dan products (public) telah dikonfigurasi lengkap dengan perisai RLS-nya.
**Tindakan Frontend**: Hapus fungsi *form-data api upload* lama, gantikan dengan mengeksekusi langsung await supabase.storage.from('products').upload(...) dari browser.

### 6. Catatan Pembaruan Backend (Finance & Sales Logic)
**Konteks Pembaruan**: Seluruh business logic, perbaikan error CRUD, parameter perhitungan biaya, dropdown relasi, serta otomatisasi trigger telah diselesaikan di Backend.
**Tindakan Frontend**:
1. **Total Price Otomatis (Sales)**: Saat *Insert Sales Order*, `total_price` tidak lagi wajib dikirim/dihitung oleh frontend. Backend otomatis menghitung `Harga Varian × QTY`.
2. **Otomatisasi Gaji Pokok (Payroll)**: Saat input Payroll, jika nominal `total` dibiarkan kosong/0, backend akan otomatis mengambil `gaji_pokok` berdasarkan karyawan yang dipilih.
3. **Perbaikan Relasi Karyawan**: RLS telah diperbaiki. Halaman Finance (*Payroll/Reimburse*) sekarang dijamin dapat me-load karyawan HR tanpa error.
4. **Trigger Otomatis Anggaran (Budget)**: Jika Budget di-*approve*, data *Cashflow* akan tercipta otomatis. Frontend dilarang memanggil API POST `/api/finance/cashflow` secara implisit/ganda saat menyetujui anggaran.
5. **Keamanan Payload API Finance**: Parameter `...input` yang disebar sembarangan telah difilter ketat di API. Jika ada form field frontend yang berlebihan, backend akan otomatis membuangnya.

### 7. Catatan Pembaruan Backend (HR & Produksi)
**Konteks Pembaruan**: RLS Produksi dan HR Attendance, perbaikan endpoint Order (Crash 500), serta logika Create M_Karyawan yang terstruktur telah rampung.
**Tindakan Frontend**:
1. **Alur Create Karyawan Baru (Sangat Penting)**: Halaman `app/hr/karyawan/page.tsx` saat ini di-hardcode dengan `useInsertKaryawan` (Supabase Direct) dan `<select>` "Profile_id". **Harap ubah ini.** Penambahan Karyawan *wajib* memanggil API endpoint via **POST `/api/hr/employees`** dengan payload: `{ email, password, nama, role, posisi, divisi, status, gaji_pokok, phone }`. Ini diwajibkan karena backend bertugas menyiapkan akun (auth) secara terpusat! Update dan Delete boleh tetap dengan direct API, namun Insert wajib via endpoint.
2. **Perbaikan RLS Delete/Update HR (Attendance)**: Role 'HR & Operation Manager' tidak lagi tertolak saat ingin mengupdate atau mendelete *Attendance* berkat penyetelan nama role RLS yang diselaraskan dengan backend policy terbaru.
3. **Unexpected JSON Token (Crash Server Order)**: Endpoint `/api/production/orders` dan QC telah direvisi total. Backend tak lagi crash bila Frontend menyisipkan ekstra-parameter. `...input` telah kami potong ke model *strict map constraint*.
4. **RLS Issue Add/Delete Order (Produksi)**: Sistem sekarang dapat memproses CRUD dan *Add Sales Order* dari role 'Produksi' dan 'Produksi & Quality Control'. *Security Guards* di API level Next.js (`requireLevel`) juga diekstensikan mencakup role kelas `operational` yang sebelumnya dilupakan untuk Produksi.
5. **Reimbursement Bukti Upload**: File SQL `supabase/add_kolom_reimburse.sql` telah dibuat. **Penting:** Jalankan script ini di menu SQL Editor Supabase Anda untuk menyuntikkan kolom `bukti` dan `keterangan` ke tabel `t_reimbursement`. Untuk alur Frontend: upload bukti ke `supabase.storage`, lalu ambil URL/Path nya. Lempar path tersebut via Fetch `POST /api/finance/reimburse` (field JSON: `"bukti": "url..."`) menuju Backend, *bukan di-insert secara direct dari browser*.

*(Silakan hapus poin catatan 6 & 7 ini jika penyesuaian UX/UI frontend & testing sudah diselesaikan).*

## Getting Started

### Prerequisites

- Node.js 18+
- Akun Supabase dengan project yang sudah dikonfigurasi

### Environment Variables

Buat file .env di root project:

`env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
`

### Setup RLS

Jalankan script RLS di Supabase Dashboard ? SQL Editor:

`
supabase/rls-policies.sql
`

### Run Development Server

`bash
npm install
npm run dev
`

Buka [http://localhost:3000](http://localhost:3000).

Setiap divisi diakses melalui subdomain:
- http://finance.localhost:3000
- http://hr.localhost:3000
- http://produksi.localhost:3000
- dst.
