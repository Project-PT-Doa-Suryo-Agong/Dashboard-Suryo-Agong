"use client";

import { Table } from "./components";

export default function TabBacklog() {
  return (
    <>
      <h1 className="docs-title">BACKLOG PENGEMBANGAN WEBSITE DOA SURYO AGUNG</h1>
      <div className="docs-banner">
        Hasil Konsolidasi Notulen Meeting (19 Juni 2026) dan Masukan Tambahan User
      </div>

      <h2 className="docs-h2">DAFTAR UTAMA (KONSOLIDASI)</h2>

      <h3 className="docs-h3">1. Modul Keuangan, Budget, & Akuntansi</h3>
      <ul className="docs-list">
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan pengaturan max budget (saldo perusahaan) sebagai batas kontrol budget global.
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan validasi dan notifikasi peringatan (warning) otomatis apabila nilai anggaran yang diinput melebihi batas maksimal yang telah ditentukan.
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan fitur otomatisasi Pembuatan Kode Jurnal (auto-generate kode jurnal).
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan modul dan fitur <em>Laporan Keuangan</em> lengkap.
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan fitur ekspor (export) data budget ke format Microsoft Excel.
        </li>
      </ul>

      <h3 className="docs-h3">2. Modul Payroll & Kasbon Karyawan</h3>
      <ul className="docs-list">
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Integrasikan sistem Kasbon langsung ke Payroll (Pengurangan kasbon secara otomatis memotong gaji karyawan saja tanpa perlu input manual terpisah).
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan fitur cetak slip payroll / slip gaji per karyawan secara individu (perorangan).
        </li>
      </ul>

      <h3 className="docs-h3">3. Modul Manajemen SDM / HR</h3>
      <ul className="docs-list">
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[BUG FIX]</strong> Perbaiki kendala pada menu <em>PKWT/PKWTP</em>: Tombol/fitur sudah ada, tetapi tidak bisa digunakan untuk menambahkan data baru.
        </li>
      </ul>

      <h3 className="docs-h3">4. Modul Produksi & Manajemen Aset</h3>
      <ul className="docs-list">
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan pencatatan, pelacakan, dan manajemen alokasi <em>Bahan Baku</em> di bagian produksi.
        </li>
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Tambahkan fitur generate PDF khusus untuk laporan manajemen aset.
        </li>
      </ul>

      <h3 className="docs-h3">5. Fitur Global & Sistem Pelaporan</h3>
      <ul className="docs-list">
        <li>
          <input type="checkbox" disabled style={{ marginRight: "0.5rem" }} />
          <strong>[To-Do]</strong> Terapkan fungsi <em>Generate PDF</em> di seluruh fitur dan modul laporan yang ada untuk mempermudah proses cetak dan dokumentasi fisik.
        </li>
      </ul>

      <h2 className="docs-h2">RENCANA TINDAK LANJUT (ACTION PLAN)</h2>
      <Table
        headers={["No", "Tindak Lanjut / Langkah Kerja", "Kategori", "PIC", "Prioritas", "Status"]}
        rows={[
          [
            "1",
            "Perbaikan Bug Input Data PKWT/PKWTP",
            '<span class="docs-badge docs-badge-red">Bug Fix</span>',
            "Tim Developer",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "2",
            "Pengembangan Logika Kontrol Max Budget & Validasi",
            '<span class="docs-badge docs-badge-blue">Fitur Baru</span>',
            "Tim Developer",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "3",
            "Integrasi Otomatisasi Potongan Kasbon ke Slip Gaji",
            '<span class="docs-badge docs-badge-blue">Fitur Baru</span>',
            "Tim Developer",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "4",
            "Pembuatan Skema Auto-Generate Kode Jurnal",
            '<span class="docs-badge docs-badge-blue">Fitur Baru</span>',
            "Tim Developer",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "5",
            "Pengembangan Modul Laporan Keuangan & Bahan Baku",
            '<span class="docs-badge docs-badge-blue">Fitur Baru</span>',
            "Tim Developer",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "6",
            "Implementasi Mesin Cetak PDF Global (All Features)",
            '<span class="docs-badge docs-badge-blue">Fitur Baru</span>',
            "Tim Developer",
            "Sedang",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "7",
            "Pengujian Internal Seluruh Komponen Sistem",
            '<span class="docs-badge docs-badge-gray">Testing</span>',
            "Dev & User",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ],
          [
            "8",
            "Sesi User Acceptance Test (UAT) Bersama Klien",
            '<span class="docs-badge docs-badge-gray">Evaluasi</span>',
            "Tim Project",
            "<strong>Tinggi</strong>",
            '<span class="docs-badge docs-badge-amber">Pending</span>'
          ]
        ]}
      />
    </>
  );
}
