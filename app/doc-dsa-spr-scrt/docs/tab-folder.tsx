"use client";

import { Table } from "./components";

export default function TabFolder() {
  return (
    <>
      <h1 className="docs-title">Dokumentasi Struktur Folder & File</h1>

      {/* ── 1. STRUKTUR UTAMA ────────────────────────────────────── */}
      <h2 className="docs-h2">1. Gambaran Umum Struktur Folder</h2>
      <p className="docs-p">
        Proyek ini dibangun menggunakan <strong>Next.js (App Router)</strong> dengan arsitektur modular. Berikut adalah struktur direktori utama dalam proyek:
      </p>
      <pre className="docs-code" style={{ padding: "1rem", lineHeight: "1.5" }}>
{`Dashboard-Suryo-Agung/
├── app/                  # Routing Next.js & Halaman per Divisi
│   ├── api/              # API Routes (Bussiness Logic di Server)
│   ├── auth/             # Modul Otentikasi (Login)
│   ├── [divisi]/         # Halaman Dashboard Divisi (Finance, HR, Logistik, dll.)
│   └── ...
├── components/           # Komponen UI Reusable
│   ├── auth/             # Proteksi / Auth Guards Client
│   ├── layouts/          # Layout Dashboard per Divisi
│   └── ui/               # Reusable UI Core Components (Modal, Table, dll.)
├── hooks/                # Custom React Hooks Global
├── lib/                  # Logika Bisnis & Integrasi Supabase / Utilitas
│   ├── access/           # Katalog Menu & Kebijakan Hak Akses (Access Control)
│   ├── guards/           # Route Guard Server-Side
│   ├── http/             # HTTP Helper & Error Codes
│   ├── services/         # Service Layer untuk Berinteraksi dengan Database
│   ├── supabase/         # Inisialisasi Klien & Generic Hooks Supabase
│   ├── utils/            # Helper File Upload & Utilitas Lainnya
│   └── validation/       # Zod Schema & Validasi Request
├── supabase/             # Skrip Konfigurasi Database (RLS & Migrasi)
└── types/                # Definisi Type TypeScript Global`}
      </pre>

      {/* ── 2. DAFTAR FOLDER PENTING ────────────────────────────── */}
      <h2 className="docs-h2">2. Daftar Folder Penting & Fungsinya</h2>
      <p className="docs-p">
        Berikut adalah penjelasan fungsi detail dari setiap direktori utama dalam sistem ini:
      </p>
      <Table
        headers={["Nama Folder", "Isi Utama", "Fungsi / Peran dalam Sistem"]}
        rows={[
          [
            "<code>app/</code>",
            "Next.js Page & API route handlers.",
            "Mengelola routing aplikasi (App Router). Folder di dalamnya menentukan path URL halaman dashboard divisi (seperti <code>finance</code>, <code>hr</code>, <code>logistik</code>) serta endpoint REST API di <code>app/api</code>.",
          ],
          [
            "<code>components/</code>",
            "Reusable React Components, Layout, Chart.",
            "Menampung komponen UI agar tidak duplikasi. Menyediakan layout halaman per divisi (<code>layouts</code>), grafik dashboard (<code>charts</code>), komponen reusable (<code>ui</code>), dan pelindung rute client (<code>auth</code>).",
          ],
          [
            "<code>lib/access/</code>",
            "Konfigurasi Menu & Policy Hak Akses.",
            "Menentukan daftar menu yang tersedia untuk masing-masing role pengguna (CEO, HR, Finance, dll.) dan memverifikasi izin akses menu tersebut.",
          ],
          [
            "<code>lib/services/</code>",
            "Logic querying / manipulasi data database.",
            "Service layer yang digunakan oleh Next.js API Routes. Berisi logika query multi-tabel, transaksi database, dan pemanggilan modul eksternal.",
          ],
          [
            "<code>lib/supabase/</code>",
            "Koneksi Supabase & React Hooks.",
            "Menginisialisasi klien Supabase (browser/server/admin) serta menyediakan generic hooks (<code>useTable</code>, <code>useRow</code>, dll) untuk operasi CRUD langsung dari client.",
          ],
          [
            "<code>lib/validation/</code>",
            "Validasi skema data masukan.",
            "Menggunakan pustaka validasi untuk memastikan data payload yang dikirim ke API aman, bertipe benar, dan lengkap sebelum diproses oleh database.",
          ],
          [
            "<code>types/</code>",
            "Type definitions & Interface TypeScript.",
            "Definisi type global, termasuk tipe data yang di-generate otomatis dari skema database Supabase PostgreSQL.",
          ],
        ]}
      />

      {/* ── 3. FUNGSI FILE TIAP FOLDER ──────────────────────────── */}
      <h2 className="docs-h2">3. Fungsi File Penting per Folder</h2>
      <p className="docs-p">
        Untuk memahami alur kode, berikut adalah daftar file kunci di dalam folder-folder penting beserta fungsi spesifiknya:
      </p>

      <h3 className="docs-h3">Folder: <code>lib/access/</code></h3>
      <Table
        headers={["Nama File", "Fungsi Spesifik"]}
        rows={[
          [
            "<code>catalog.ts</code>",
            "Menyimpan master data menu navigasi (sidebar) lengkap dengan nama cluster, path, ikon, dan filter level akses untuk setiap divisi.",
          ],
          [
            "<code>policy.ts</code>",
            "Menyediakan fungsi pengecekan izin (seperti <code>hasAccessToMenu</code> atau <code>getVisibleMenuCatalog</code>) berdasarkan role pengguna saat ini.",
          ],
        ]}
      />

      <h3 className="docs-h3">Folder: <code>lib/supabase/</code></h3>
      <Table
        headers={["Nama File", "Fungsi Spesifik"]}
        rows={[
          [
            "<code>browser.ts</code>",
            "Menginisialisasi Supabase client khusus untuk lingkungan browser (client-side) menggunakan variable anon public key.",
          ],
          [
            "<code>server.ts</code>",
            "Menginisialisasi Supabase client khusus untuk SSR / API Routes (server-side) dengan penanganan cookies otomatis.",
          ],
          [
            "<code>admin.ts</code>",
            "Menginisialisasi Supabase Admin client menggunakan <code>SUPABASE_SERVICE_ROLE_KEY</code> untuk melakukan aksi bypass RLS / manajemen user.",
          ],
          [
            "<code>auth-context.tsx</code>",
            "Context provider React untuk melacak status login user secara global di aplikasi client-side (session, profile, loading).",
          ],
          [
            "<code>hooks.ts</code>",
            "Kumpulan generic React hooks seperti <code>useTable</code> (ambil list data berhalaman), <code>useRow</code> (ambil satu data), <code>useInsert</code>, <code>useUpdate</code>, dan <code>useDelete</code>.",
          ],
        ]}
      />

      <h3 className="docs-h3">Folder: <code>lib/services/</code> (Logika Bisnis Server)</h3>
      <Table
        headers={["Nama File", "Fungsi Spesifik"]}
        rows={[
          [
            "<code>core.service.ts</code>",
            "Mengelola data master inti platform seperti produk, varian, dan vendor.",
          ],
          [
            "<code>finance.service.ts</code>",
            "Menangani proses penggajian (payroll), persetujuan reimbursement, pencatatan kas kecil/besar, dan pelunasan utang-piutang.",
          ],
          [
            "<code>hr.service.ts</code>",
            "Mengelola data karyawan, rekap kehadiran (attendance), penerbitan surat peringatan (SP), dan kontrak kerja PKWT.",
          ],
          [
            "<code>logistics.service.ts</code>",
            "Menangani proses antrean packing logistik, manifest pengiriman kurir, dan verifikasi return order barang retur.",
          ],
          [
            "<code>production.service.ts</code>",
            "Mengelola alur surat perintah kerja (SPK) produksi, serta validasi QC inbound dan QC outbound.",
          ],
          [
            "<code>sales.service.ts</code>",
            "Menyimpan logika integrasi content planner afiliasi, live streaming performance harian, membership pelanggan, dan order penjualan.",
          ],
        ]}
      />

      <h3 className="docs-h3">Folder: <code>components/auth/</code> & <code>lib/guards/</code></h3>
      <Table
        headers={["Nama File", "Fungsi Spesifik"]}
        rows={[
          [
            "<code>AuthGuard.tsx</code> (components)",
            "Melindungi halaman di sisi browser. Mengecek session aktif dan mencocokkan level role pengguna dengan rute yang coba diakses. Jika tidak diizinkan, akan di-redirect ke halaman login/unauthorized.",
          ],
          [
            "<code>auth.guard.ts</code> (lib/guards)",
            "Middleware / guard di sisi server Next.js API Routes. Mencegah pemanggilan API ilegal dengan memvalidasi Bearer Token JWT / session sebelum mengeksekusi service logic.",
          ],
        ]}
      />

      <h3 className="docs-h3">Folder: <code>types/</code></h3>
      <Table
        headers={["Nama File", "Fungsi Spesifik"]}
        rows={[
          [
            "<code>supabase.ts</code>",
            "Definisi type otomatis yang digenerate oleh Supabase CLI dari PostgreSQL. Berisi definisi skema kolom tabel secara presisi.",
          ],
          [
            "<code>access.ts</code>",
            "Mendefinisikan tipe data navigasi, role tingkat pengguna (Super Admin, Developer, CEO, dll), dan cluster menu.",
          ],
        ]}
      />
    </>
  );
}
