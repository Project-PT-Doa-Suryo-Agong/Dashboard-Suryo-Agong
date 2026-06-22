"use client";

import { Table } from "./components";

export default function TabFolder() {
  return (
    <>
      <h1 className="docs-title">Dokumentasi Detail Struktur Folder, File & Logika Program</h1>

      {/* ── 1. GAMBARAN UMUM ────────────────────────────────────── */}
      <h2 className="docs-h2">1. Peta Arsitektur Berkas (File Architecture Map)</h2>
      <p className="docs-p">
        Sistem enterprise ini menggunakan struktur modular untuk membagi tanggung jawab antara client-side, server-side (Next.js API), dan database schema. Berikut gambaran umum pohon direktori proyek:
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

      <h2 className="docs-h2">2. Daftar Folder Utama & Fungsinya</h2>
      <p className="docs-p">
        Berikut adalah penjelasan kegunaan dan peran dari setiap direktori utama dalam sistem ini:
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

      {/* ── 3. CARA KERJA BACKEND HYBRID ────────────────────────── */}
      <h2 className="docs-h2">3. Cara Kerja Backend & Supabase (Arsitektur Hybrid)</h2>
      <p className="docs-p">
        Aplikasi ini menggunakan pendekatan <strong>Hybrid Backend</strong>. Beban kerja dibagi secara efisien antara interaksi langsung ke Supabase (Client-to-Database) dan interaksi melalui Server Backend Next.js (Client-to-Server-to-Database):
      </p>
      <pre className="docs-code" style={{ padding: "1.2rem", lineHeight: "1.6", fontSize: "0.75rem" }}>
{`+--------------------------------------------------------+
|                        BROWSER                         |
+---------------+------------------------+---------------+
                |                        |
     (A) Direct CRUD Query      (B) Complex Service Request
    [useTable / Supabase SDK]      [fetch / Next.js API]
                |                        |
                v                        v
+------------------------+      +------------------------+
|    SUPABASE DIRECT     |      |     NEXT.JS SERVER     |
|   (PostgREST Engine)   |      |    (Route Handlers)    |
+---------------+--------+      +--------+---------------+
                |                        |
          RLS Validation          Admin / Service Role
         [get_user_role()]        [Bypass RLS check]
                |                        |
                v                        v
+--------------------------------------------------------+
|                 DATABASE (POSTGRESQL)                  |
+--------------------------------------------------------+`}
      </pre>

      <Table
        headers={["Mekanisme Alur", "Cara Kerja & Proses", "Keamanan & Validasi"]}
        rows={[
          [
            "<strong>(A) Supabase Direct Access</strong><br/>(Operasi CRUD Ringan)",
            "Browser berinteraksi langsung ke Supabase API menggunakan React Hooks (seperti <code>useTable</code> atau <code>useRow</code>). Klien browser menggunakan <em>anon_key</em> untuk mengambil data produk, kehadiran, logistik, dll.",
            "Keamanan dijamin penuh di level database menggunakan <strong>Row Level Security (RLS)</strong>. Database memeriksa JWT token user aktif dengan fungsi <code>get_user_role()</code> untuk membatasi hak akses baca/tulis."
          ],
          [
            "<strong>(B) Next.js API Routes</strong><br/>(Transaksi & Logika Kompleks)",
            "Browser mengirim HTTP Request (JSON) ke endpoint <code>/api/...</code>. Server Next.js menerima request, memanggil <code>body-validator</code>, lalu mengeksekusi logika di service layer (<code>lib/services/</code>) secara transaksional.",
            "Server divalidasi oleh <code>auth.guard.ts</code> di sisi server. Untuk menulis ke multi-tabel atau database lintas skema, server menggunakan <code>SUPABASE_SERVICE_ROLE_KEY</code> (bypassing RLS) demi integritas data."
          ]
        ]}
      />

      <h3 className="docs-h3">A. Daftar Fitur yang Menggunakan Supabase Direct API</h3>
      <p className="docs-p">
        Fitur-fitur CRUD standar yang langsung diakses dari browser ke database Supabase demi performa dan kemudahan sinkronisasi real-time:
      </p>
      <Table
        headers={["Kategori Fitur", "Data / Tabel yang Diakses", "Deskripsi Akses"]}
        rows={[
          ["Otentikasi Utama", "Supabase Auth", "Proses sign-in, sign-out, dan manajemen sesi login aktif di sisi klien."],
          ["Modul Core", "<code>m_produk</code>, <code>m_varian</code>, <code>m_vendor</code>", "Melihat katalog produk, variasi SKU, dan master supplier."],
          ["Modul HR (SDM)", "<code>m_karyawan</code>, <code>t_attendance</code>, <code>t_employee_warning</code>", "Input presensi harian karyawan, rekap absensi, dan data surat peringatan."],
          ["Modul Finance", "<code>t_cashflow</code>", "Pencatatan langsung transaksi pemasukan dan pengeluaran kas kecil/besar."],
          ["Modul Logistik", "<code>t_packing</code>, <code>t_logistik_manifest</code>, <code>t_return_order</code>", "Melihat antrean pengemasan barang dan manifest kurir."],
          ["Modul Sales / Penjualan", "<code>m_affiliator</code>, <code>t_content_planner</code>, <code>t_sales_order</code>", "Penjadwalan live streaming, data affiliator, serta pemantauan pesanan."],
          ["Modul Management", "<code>t_kpi_weekly</code>", "Pengisian penilaian performa mingguan divisi oleh manager."]
        ]}
      />

      <h3 className="docs-h3">B. Daftar Fitur yang Menggunakan Next.js API Routes (REST API)</h3>
      <p className="docs-p">
        Fitur-fitur transaksional yang memerlukan penanganan server backend untuk validasi, manipulasi multi-tabel, atau pemanggilan Supabase Admin API:
      </p>
      <Table
        headers={["Endpoint REST API", "Metode HTTP", "Logika Bisnis yang Dijalankan"]}
        rows={[
          ["<code>/api/access/catalog</code>", "<code>GET</code>", "Mendapatkan daftar navigasi menu sidebar yang sesuai dengan level akses / divisi user."],
          ["<code>/api/access/check</code>", "<code>GET</code>", "Memeriksa otorisasi apakah user berhak mengakses modul tertentu."],
          ["<code>/api/dashboard/metrics</code>", "<code>GET</code>", "Query agregasi berskala besar lintas skema untuk menghasilkan angka statistik dashboard."],
          ["<code>/api/profiles</code> dan <code>/api/profiles/[id]</code>", "<code>GET, POST, PUT, DELETE</code>", "Manajemen akun pengguna dashboard oleh admin (memerlukan hak Supabase Admin API)."],
          ["<code>/api/finance/reimburse</code>", "<code>GET, POST, PUT</code>", "Workflow pengajuan nota belanja operasional dan persetujuan (approval) oleh atasan."],
          ["<code>/api/finance/payroll</code>", "<code>GET, POST</code>", "Melakukan kalkulasi penggajian bulanan staf berdasarkan sanksi SP dan rekap kehadiran."],
          ["<code>/api/management/budget</code>", "<code>GET, POST, PUT</code>", "Workflow pengajuan anggaran belanja divisi bulanan beserta persetujuannya."]
        ]}
      />

      {/* ── 4. DETAIL FILE & LOGIKA ────────────────────────────── */}
      <h2 className="docs-h2">4. Rincian File, Isi, & Logika Fungsi per Folder</h2>
      <p className="docs-p">
        Berikut adalah daftar file kunci di dalam folder-folder penting beserta fungsi spesifik dan logika programnya:
      </p>

      <h3 className="docs-h3">Folder: <code>lib/services/</code></h3>
      <p className="docs-p">
        Folder ini berisi file-file service yang mendefinisikan logika bisnis kompleks di tingkat server. Service ini dipanggil oleh Next.js API Routes (<code>app/api/...</code>) untuk mengisolasi query database.
      </p>
      
      <Table
        headers={["Nama File", "Isi Berkas / Antarmuka (Interface)", "Logika Bisnis & Fungsi Utama"]}
        rows={[
          [
            "<code>finance.service.ts</code>",
            "Fungsi CRUD untuk cashflow, payroll history, reimbursement, COA (Chart of Accounts), journal entries, invoice, dan utang-piutang.",
            "<strong>Logika Payroll & Akuntansi:</strong> Menghitung total pengeluaran gaji karyawan, memetakan transaksi ke kode COA akuntansi yang sesuai, memicu entri jurnal double-entry otomatis (debit/kredit) pada <code>t_journal_item</code>, serta validasi status persetujuan reimbursement sebelum memotong dana kas."
          ],
          [
            "<code>hr.service.ts</code>",
            "Fungsi manajemen karyawan, attendance, warning, PKWT, serta pembuatan template dokumen legal.",
            "<strong>Logika Kehadiran & Kontrak:</strong> Menghitung persentase absensi bulanan, memproses sanksi SP (Surat Peringatan) secara bertahap (SP 1 ke SP 2), serta generate draf dokumen PKWT otomatis berdasarkan masa kontrak karyawan."
          ],
          [
            "<code>sales.service.ts</code>",
            "Fungsi pelacakan penjualan, content planner, live stream stats, affiliator, dan data order.",
            "<strong>Logika Afiliasi & Sales Order:</strong> Menghitung pembagian komisi untuk affiliator secara dinamis berdasarkan persentase penjualan produk, melacak efektivitas konten live streaming, serta memicu pembuatan otomatis antrean packing gudang saat status sales order divalidasi lunas."
          ],
          [
            "<code>logistics.service.ts</code>",
            "Fungsi packing barang, manifest logistik, dan pengelolaan return order.",
            "<strong>Logika Gudang & Ekspedisi:</strong> Mengelompokkan barang pesanan berdasarkan kurir/ekspedisi dalam satu manifes pengiriman, memperbarui status stok fisik produk setelah barang dikemas, serta memproses validasi foto bukti fisik barang cacat pada klaim retur."
          ],
          [
            "<code>production.service.ts</code>",
            "Fungsi order produksi (SPK) dan Quality Control (Inbound/Outbound).",
            "<strong>Logika SPK & QC:</strong> Memantau tahapan produksi (antre -> proses -> selesai), memvalidasi status kelayakan bahan baku masuk (inbound QC), serta memastikan produk jadi (outbound QC) memenuhi spesifikasi standar mutu sebelum dipindah ke gudang."
          ]
        ]}
      />

      {/* ── 3. LIB/SUPABASE/HOOKS ────────────────────────────────── */}
      <h2 className="docs-h2">3. Folder: <code>lib/supabase/hooks/</code> (Client-Side Hooks Khusus Entitas)</h2>
      <p className="docs-p">
        Dalam arsitektur hybrid, browser dapat melakukan query ringan secara langsung ke Supabase yang diamankan oleh RLS. Hooks ini membungkus query tersebut agar reaktif dalam React.
      </p>
      
      <Table
        headers={["Nama File Hooks", "Isi Berkas / State", "Kegunaan & Logika Reaktif Client"]}
        rows={[
          [
            "<code>use-products.ts</code>",
            "State: <code>products</code>, <code>loading</code>, <code>error</code>.<br/>Method: <code>fetchProducts()</code>, <code>addProduct()</code>, <code>editProduct()</code>.",
            "Menghubungkan visual UI katalog ke skema tabel <code>core.m_produk</code> secara real-time. Menyediakan fitur pencarian produk terintegrasi dengan filter kategori langsung di browser."
          ],
          [
            "<code>use-karyawan.ts</code>",
            "State: Karyawan list, pagination metadata.<br/>Method: CRUD karyawan, update status keaktifan.",
            "Menyajikan data list karyawan untuk kebutuhan divisi HRD secara langsung dari tabel <code>hr.m_karyawan</code> dengan filter instan berdasarkan status (aktif/kontrak habis)."
          ],
          [
            "<code>use-attendance.ts</code>",
            "State: Data kehadiran harian, detail jam kerja.<br/>Method: <code>clockIn()</code>, <code>clockOut()</code>.",
            "Mendapatkan koordinat lokasi absen serta jam masuk/pulang, mencocokkannya dengan toleransi waktu keterlambatan perusahaan, lalu menyimpannya ke tabel <code>hr.t_attendance</code>."
          ],
          [
            "<code>use-logistics.ts</code>",
            "State: List manifest, antrean packing.<br/>Method: Update status packing & manifest.",
            "Menyajikan daftar antrean kemasan barang pesanan (packing status) untuk staf gudang dan memicu update status pengiriman manifest kurir secara real-time."
          ],
          [
            "<code>use-variants.ts</code> & <code>use-vendors.ts</code>",
            "State: List varian SKU, data supplier.<br/>Method: CRUD varian & vendor.",
            "Mengurus relasi data produk dengan variasi spesifiknya (warna, ukuran) dan mengelola database kontak vendor penyuplai bahan baku utama."
          ]
        ]}
      />

      {/* ── 4. APP/API ──────────────────────────────────────────── */}
      <h2 className="docs-h2">4. Folder: <code>app/api/</code> (Server-Side Route Handlers / Endpoints)</h2>
      <p className="docs-p">
        API Routes berfungsi sebagai jembatan backend Next.js yang memproses validasi, otorisasi token JWT, dan mengontrol eksekusi service layer.
      </p>

      <Table
        headers={["Rute API / File", "Isi handler", "Logika Aliran Program (Flow Logic)"]}
        rows={[
          [
            "<code>api/finance/payroll/route.ts</code>",
            "Handler: <code>GET</code> (list payroll), <code>POST</code> (kalkulasi gaji bulanan).",
            "Menerima parameter bulan dan tahun. Memanggil <code>hr.service</code> untuk mengambil data kehadiran & potongan SP karyawan, memproses nominal gaji bersih, membuat record transaksi pengeluaran di <code>t_cashflow</code>, lalu menyimpannya ke <code>t_payroll_history</code>."
          ],
          [
            "<code>api/finance/reimburse/route.ts</code> &<br/><code>[id]/route.ts</code>",
            "Handler: <code>GET</code>, <code>POST</code> (pengajuan), <code>PUT</code> (approval status).",
            "Memvalidasi payload nota bukti fisik belanja. Jika status diubah menjadi <code>approved</code> oleh supervisor, route memicu transfer jurnal di modul akuntansi akrual dan memotong saldo COA Kas."
          ],
          [
            "<code>api/access/catalog/route.ts</code>",
            "Handler: <code>GET</code> (mengambil katalog menu).",
            "Membaca cookie session pengguna, memanggil policy engine di <code>lib/access/policy.ts</code>, dan merespons dengan daftar menu navigasi yang berhak dilihat sesuai role aktif (CEO, Finance, HR, dll.)."
          ],
          [
            "<code>api/dashboard/metrics/route.ts</code>",
            "Handler: <code>GET</code> (aggregation data dashboard).",
            "Melakukan query agregasi lintas schema (core, finance, hr, production) secara simultan menggunakan raw query di server untuk menyajikan data grafik omzet, performa KPI divisi, dan jumlah antrean QC ke dashboard eksekutif."
          ]
        ]}
      />

      {/* ── 5. LIB/VALIDATION ────────────────────────────────────── */}
      <h2 className="docs-h2">5. Folder: <code>lib/validation/</code> (Data Integrity / Zod Schemas)</h2>
      <p className="docs-p">
        Menampung berkas skema Zod untuk menjaga keamanan tipe data input sebelum masuk ke database, mencegah SQL injection atau payload korup.
      </p>

      <Table
        headers={["Nama File", "Skema Validasi (Zod Schema)", "Aturan Logika Validasi"]}
        rows={[
          [
            "<code>profiles-admin.ts</code>",
            "<code>CreateProfileSchema</code>, <code>UpdateProfileSchema</code>.",
            "Memastikan input nama lengkap minimal 3 karakter, format email valid, penetapan role harus sesuai dengan enum role resmi (CEO, Finance, HR, Staf, dll.), serta kata sandi memenuhi kriteria keamanan."
          ],
          [
            "<code>hr-admin.ts</code>",
            "<code>EmployeeSchema</code>, <code>AttendanceSchema</code>.",
            "Memvalidasi tipe data masukan karyawan seperti kecocokan format NIK (Nomor Induk Karyawan), nomor rekening bank, besaran gaji pokok (harus bernilai positif), dan kelengkapan dokumen pendukung."
          ],
          [
            "<code>body-validator.ts</code>",
            "Helper function: <code>validateBody()</code>.",
            "Helper generic yang memproses request body JSON dan mencocokkannya dengan skema Zod secara dinamis. Jika input tidak valid, secara otomatis membalas dengan status <code>400 Bad Request</code> beserta detail kolom yang error."
          ]
        ]}
      />
    </>
  );
}
