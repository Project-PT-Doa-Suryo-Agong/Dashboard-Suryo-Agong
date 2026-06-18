"use client";

import { CodeBlock, Table } from "./components";

export default function TabDatabase() {
  return (
    <>
      <h1 className="docs-title">Dokumentasi Migrasi & Struktur Database</h1>

      {/* ── 1. SCHEMA ───────────────────────────────────────────── */}
      <h2 className="docs-h2">1. Skema Database (Schemas)</h2>
      <p className="docs-p">
        Database PostgreSQL dirancang dengan arsitektur multi-skema modular untuk mengisolasi fungsionalitas
        berdasarkan modul divisi perusahaan:
      </p>
      <Table
        headers={["Skema", "Deskripsi", "Fokus Modul"]}
        rows={[
          ["<code>core</code>", "Data inti platform, konfigurasi admin, master produk/vendor, dan profil pengguna.", "Pondasi Platform & Master Data"],
          ["<code>finance</code>", "Pencatatan kas kecil/besar, invoice, jurnal akuntansi, payroll, reimbursement, utang-piutang, serta depresiasi aset.", "Keuangan, Akuntansi & Kasir"],
          ["<code>hr</code>", "Manajemen staf karyawan, kontrak PKWT, surat peringatan, SOP kerja, dan absensi harian.", "Sumber Daya Manusia (HRD)"],
          ["<code>logistics</code>", "Pengelolaan pengemasan barang, manifest ekspedisi pengiriman, dan klaim retur pelanggan.", "Gudang & Logistik Distribusi"],
          ["<code>management</code>", "Pengajuan anggaran (budget request) bulanan divisi dan penilaian kinerja (KPI/penilaian kerja) mingguan.", "Eksekutif & Rencana Kerja"],
          ["<code>production</code>", "Pencatatan Surat Perintah Kerja (SPK) produksi, QC bahan baku (inbound), dan QC produk jadi (outbound).", "Manufaktur & Quality Control"],
          ["<code>sales</code>", "Manajemen affiliator, rancangan planner konten kreatif, integrasi status sales order, serta log keanggotaan.", "Pemasaran & Penjualan"],
          ["<code>public</code>", "Skema publik standar untuk fitur tamu seperti buku tamu kantor.", "Fitur Terbuka Umum"],
        ]}
      />

      {/* ── 2. BUCKET STORAGE ─────────────────────────────────────── */}
      <h2 className="docs-h2">2. Supabase Storage Buckets</h2>
      <p className="docs-p">
        Dashboard terintegrasi dengan <strong>Supabase Storage</strong> untuk menampung file aset fisik dan bukti dokumen pendukung.
        Berikut adalah daftar bucket yang digunakan beserta kebijakan aksesnya:
      </p>
      <Table
        headers={["Nama Bucket", "Deskripsi File", "Format File", "Kebijakan Akses (RLS Bucket)"]}
        rows={[
          ["<code>products</code>", "Foto/gambar utama untuk katalog produk.", "JPEG, PNG, WebP", "Public Read, Write terbatas untuk admin/staf produksi."],
          ["<code>employee_documents</code>", "Dokumen kelengkapan profil karyawan (Foto perorangan, KTP, Kartu Keluarga).", "JPEG, PNG, PDF", "Private Read (hanya HR & Super Admin), Write terbatas untuk HR."],
          ["<code>reimbursements</code>", "Bukti fisik nota/kuitansi pengeluaran reimbursement staf.", "JPEG, PNG, PDF", "Private Read (hanya HR, Finance, & Pemilik), Write untuk semua staf berizin."],
          ["<code>returns</code>", "Foto bukti fisik produk cacat/rusak untuk pengajuan retur barang logistik.", "JPEG, PNG", "Public Read (untuk kurir/CS), Write terbatas untuk tim logistik."],
        ]}
      />

      {/* ── 3. TABLE DATA ────────────────────────────────────────── */}
      <h2 className="docs-h2">3. Struktur Tabel Data (Tables Grouped by Schema)</h2>
      <p className="docs-p">
        Berikut adalah daftar lengkap tabel data (total 37 tabel) yang terorganisasi di dalam masing-masing skema modul:
      </p>
      
      <h3 className="docs-h3">Skema: core</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>profiles</code>", "Data profil pengguna dashboard (nama lengkap, role, email, dsb) terhubung ke Supabase Auth."],
          ["<code>m_produk</code>", "Master data produk yang terdaftar di sistem."],
          ["<code>m_varian</code>", "Varian produk spesifik (warna, ukuran, SKU)."],
          ["<code>m_vendor</code>", "Master data vendor / supplier penyuplai bahan baku."],
        ]}
      />

      <h3 className="docs-h3">Skema: finance</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>t_cashflow</code>", "Arus kas riil (pemasukan dan pengeluaran) baik Kas Besar maupun Kas Kecil."],
          ["<code>t_invoice</code>", "Data invoice transaksi penjualan atau tagihan masuk."],
          ["<code>t_invoice_item</code>", "Rincian detail item barang/order di dalam invoice."],
          ["<code>t_journal</code>", "Buku jurnal akuntansi (Header transaksi jurnal keuangan)."],
          ["<code>t_journal_item</code>", "Ledger jurnal debet/kredit yang memetakan saldo ke kode akun (COA)."],
          ["<code>m_coa</code>", "Chart of Accounts (Daftar Kode Akun Akuntansi perusahaan)."],
          ["<code>t_payroll_history</code>", "Riwayat penggajian bulanan staf (terikat ke karyawan dan COA beban gaji)."],
          ["<code>t_reimbursement</code>", "Catatan pengajuan klaim pengembalian dana belanja operational."],
          ["<code>t_utang_piutang</code>", "Pencatatan kartu utang kepada vendor dan kartu piutang pelanggan."],
          ["<code>t_asset</code>", "Daftar aset tetap perusahaan beserta metode penyusutannya."],
          ["<code>t_asset_depreciation_schedule</code>", "Jadwal dan nominal depresiasi berkala otomatis dari aset tetap."],
        ]}
      />

      <h3 className="docs-h3">Skema: hr</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>m_karyawan</code>", "Master database profil karyawan lengkap dengan info gaji pokok, data bank, dan alamat."],
          ["<code>t_attendance</code>", "Pencatatan presensi harian karyawan (jam masuk, jam keluar, status kehadiran, laporan harian)."],
          ["<code>t_employee_warning</code>", "Catatan penerbitan surat peringatan karyawan (SP 1, SP 2, SP 3)."],
          ["<code>m_sop</code>", "Dokumentasi Standard Operating Procedure (SOP) divisi."],
          ["<code>t_pkwt</code>", "Dokumentasi kontrak kerja karyawan (PKWT atau PKWTP)."],
        ]}
      />

      <h3 className="docs-h3">Skema: logistics</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>t_packing</code>", "Daftar antrean pengemasan barang pesanan (packing status)."],
          ["<code>t_logistik_manifest</code>", "Data manifest pengiriman barang pesanan serta pelacakan resi ekspedisi."],
          ["<code>t_return_order</code>", "Pencatatan klaim retur barang dari pembeli beserta foto bukti fisik."],
        ]}
      />

      <h3 className="docs-h3">Skema: management</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>t_budget_request</code>", "Pengajuan anggaran operasional bulanan antar divisi."],
          ["<code>t_kpi_weekly</code>", "Penilaian performa divisi mingguan (target vs realisasi)."],
          ["<code>penilaian_kerja</code>", "Catatan evaluasi kerja karyawan secara berkala."],
        ]}
      />

      <h3 className="docs-h3">Skema: production</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>t_produksi_order</code>", "Surat Perintah Kerja (SPK) manufaktur produk."],
          ["<code>t_qc_inbound</code>", "Quality Control untuk bahan baku yang diterima dari supplier."],
          ["<code>t_qc_outbound</code>", "Quality Control produk jadi sebelum dimasukkan ke gudang pengiriman."],
        ]}
      />

      <h3 className="docs-h3">Skema: sales</h3>
      <Table
        headers={["Nama Tabel", "Deskripsi Data"]}
        rows={[
          ["<code>t_sales_order</code>", "Data pesanan penjualan produk (jumlah bayar cash, piutang, diskon, dsb)."],
          ["<code>m_affiliator</code>", "Master data afiliasi pemasaran."],
          ["<code>t_content_planner</code>", "Perencanaan jadwal live streaming / pembuatan konten di platform media sosial."],
          ["<code>t_content_statistic</code>", "Statistik monetisasi dan performa konten planner (viewer, link, dsb)."],
          ["<code>t_live_performance</code>", "Riwayat data pendapatan harian dari siaran live streaming."],
          ["<code>t_membership</code>", "Data keanggotaan pelanggan (loyalty program)."],
          ["<code>t_item</code>", "Master item barang siap jual."],
        ]}
      />

      {/* ── 4. RLS ──────────────────────────────────────────────── */}
      <h2 className="docs-h2">4. Row Level Security (RLS)</h2>
      <p className="docs-p">
        Keamanan data dijaga secara ketat langsung di level PostgreSQL database menggunakan kebijakan RLS.
        Sebanyak <strong>37 tabel</strong> telah mengaktifkan RLS (<code className="docs-inline">ENABLE ROW LEVEL SECURITY</code>).
      </p>
      <p className="docs-p">
        Kebijakan akses (*policies*) didasarkan pada role aktif pengguna yang tersimpan di profil akun mereka.
        Berikut adalah ringkasan skenario policy RLS yang diterapkan di database:
      </p>
      <Table
        headers={["Jenis Operasi", "Tingkat Keamanan", "Deskripsi Kebijakan"]}
        rows={[
          [
            '<span class="docs-badge docs-badge-green">SELECT (Read)</span>',
            "Public / Authenticated",
            "Tabel katalog master seperti <code>m_produk</code>, <code>m_varian</code>, dan <code>m_vendor</code> dapat dibaca oleh seluruh user terautentikasi dan anonim demi kelancaran penjualan.",
          ],
          [
            '<span class="docs-badge docs-badge-red">ALL (Write)</span>',
            "Role Restricted",
            "Operasi INSERT, UPDATE, dan DELETE pada modul tertentu dibatasi ketat berdasarkan divisi user (misal: hanya tim HRD yang bisa menulis tabel <code>t_attendance</code>, dan hanya tim Finance yang bisa mengedit <code>t_journal</code>).",
          ],
          [
            '<span class="docs-badge docs-badge-red">Super-Admin</span>',
            "Global Bypass",
            "Super-admin terkonfigurasi memiliki hak akses global bypass RLS untuk melakukan debugging atau override data pada seluruh modul di semua skema.",
          ],
        ]}
      />

      {/* ── 5. FUNCTIONS ────────────────────────────────────────── */}
      <h2 className="docs-h2">5. Database Functions</h2>
      <p className="docs-p">
        Database menggunakan fungsi tersimpan (Stored Procedures / Functions) untuk mengekstrak metadata user session secara aman
        dan melakukan validasi logic internal PostgreSQL:
      </p>
      <Table
        headers={["Nama Fungsi", "Skema", "Tipe Return", "Tujuan / Fungsionalitas"]}
        rows={[
          ["<code>get_user_role()</code>", "<code>core</code>", "<code>user_role</code>", "Mengambil data metadata dari jwt token auth yang sedang aktif untuk menentukan role user saat ini secara real-time."],
          ["<code>is_admin()</code>", "<code>core</code>", "<code>boolean</code>", "Memeriksa apakah user yang sedang masuk memiliki hak akses admin global (Super Admin atau Admin)."],
          ["<code>prevent_role_escalation()</code>", "<code>core</code>", "<code>trigger</code>", "Fungsi trigger keamanan untuk mencegah user mengubah role mereka sendiri ke tingkat yang lebih tinggi."],
          ["<code>update_timestamp()</code>", "<code>core</code>", "<code>trigger</code>", "Mengotomatisasi pembaruan kolom <code>updated_at</code> di setiap tabel saat record mengalami modifikasi."],
        ]}
      />

      {/* ── 6. TRIGGERS ─────────────────────────────────────────── */}
      <h2 className="docs-h2">6. Database Triggers (Cross-Module Automation)</h2>
      <p className="docs-p">
        Otomatisasi bisnis antar divisi dijalankan secara real-time menggunakan database triggers. Ketika data disimpan pada satu modul,
        trigger akan otomatis mengeksekusi fungsi pencatatan di modul keuangan (Finance):
      </p>
      <Table
        headers={["Fungsi Trigger", "Pemicu Transaksi", "Hasil Otomatisasi (Modul Finance)"]}
        rows={[
          [
            "<code>fn_auto_generate_asset_schedules</code>",
            "Aset baru ditambahkan di <code>t_asset</code>",
            "Menghitung otomatis nominal depresiasi bulanan dan memasukkannya ke tabel <code>t_asset_depreciation_schedule</code>.",
          ],
          [
            "<code>fn_payroll_to_cashflow</code>",
            "Eksekusi penggajian di <code>t_payroll_history</code>",
            "Otomatis mencatat pengeluaran gaji ke kas besar/kecil di tabel <code>t_cashflow</code> dengan keterangan detail gaji.",
          ],
          [
            "<code>fn_reimburse_to_cashflow</code>",
            "Status reimbursement berubah menjadi disetujui",
            "Otomatis memotong/mencatat pengeluaran dana ke tabel <code>t_cashflow</code> sesuai nominal persetujuan.",
          ],
          [
            "<code>handle_pelunasan_piutang_to_journal</code>",
            "Pembayaran piutang diubah / ditambahkan",
            "Mendeteksi perubahan status piutang dan otomatis menghasilkan entri penjurnalan debet/kredit pada <code>t_journal</code> & <code>t_journal_item</code>.",
          ],
          [
            "<code>handle_sales_order_to_cashflow</code>",
            "Sales order baru dicatat di <code>t_sales_order</code>",
            "Mencatat otomatis nominal uang masuk (cash) ke tabel <code>t_cashflow</code>.",
          ],
          [
            "<code>handle_sales_order_to_journal</code>",
            "Sales order baru dicatat di <code>t_sales_order</code>",
            "Otomatis memetakan nilai transaksi penjualan ke buku besar akuntansi sebagai pendapatan.",
          ],
          [
            "<code>fn_auto_insert_manifest</code> & <code>fn_auto_insert_packing</code>",
            "Sales order dicatat / divalidasi",
            "Otomatis menambahkan antrean pengemasan di tabel <code>t_packing</code> serta rancangan manifes pengiriman di <code>t_logistik_manifest</code>.",
          ],
        ]}
      />
    </>
  );
}
