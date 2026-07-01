# Fitur Generate PDF Global & Laporan Manajemen Aset

## 1. Utility Global PDF (`lib/utils/export-pdf.ts`)

Fungsi reusable untuk generate PDF dengan layout standar perusahaan di semua modul.

### Cara Pakai

```tsx
import { exportToPDF } from "@/lib/utils/export-pdf";

exportToPDF({
  title: "Judul Laporan",
  subtitle: "Subjudul (opsional)",
  headers: ["Kolom 1", "Kolom 2", "Kolom 3"],
  rows: [
    ["Data 1", "Data 2", "Data 3"],
    // ...
  ],
  columnStyles: {
    0: { cellWidth: 30 },
    2: { halign: "right" },
  },
  summary: [
    { label: "Total", value: "Rp 1.000.000" },
  ],
  footNotes: ["Catatan kaki"],
  fileName: "Laporan_Saya.pdf",
  orientation: "portrait", // atau "landscape"
});
```

### Parameter Lengkap

| Parameter | Type | Wajib | Keterangan |
|---|---|---|---|
| `title` | `string` | ✅ | Judul laporan |
| `subtitle` | `string` | ❌ | Subjudul di bawah title |
| `headers` | `string[]` | ✅ | Header kolom tabel |
| `rows` | `(string\|number)[][]` | ✅ | Data baris |
| `fileName` | `string` | ❌ | Nama file output (default: `Laporan_PT_Doa_Suryo_Agong.pdf`) |
| `orientation` | `"portrait" \| "landscape"` | ❌ | Orientasi kertas (default: `portrait`) |
| `columnStyles` | `Record<number, {cellWidth?, halign?}>` | ❌ | Styling per kolom |
| `summary` | `{label: string, value: string}[]` | ❌ | Ringkasan di bawah tabel |
| `footNotes` | `string[]` | ❌ | Catatan kaki (italic, abu-abu) |
| `startY` | `number` | ❌ | Posisi Y awal tabel (jika perlu custom) |

### Layout Standar

- **Header**: "PT Doa Suryo Agong" — bold 18pt, Navy `#1B365D`
- **Tanggal Cetak**: italic abu-abu, pojok kanan atas
- **Divider**: garis horizontal Navy tebal
- **Tabel**:
  - Header: background Navy, teks putih bold
  - Baris: zebra striping `#F9F9F9`
  - Border tipis `#C8C8C8`
- **Ringkasan**: label+value di bawah tabel (jika diisi)
- **Footer**: catatan kaki italic abu-abu (jika diisi)

---

## 2. Laporan Manajemen Aset (`app/finance/asset/page.tsx`)

### Fitur Baru

#### a. Kolom Divisi Pengguna
- Input **Divisi Pengguna** ditambahkan di form Registrasi/Edit Aset.
- Data divisi disimpan di field `keterangan` dengan format `[DIVISI: <value>]` agar tidak perlu migrasi database.
- Ditampilkan sebagai kolom baru di tabel daftar aset dan di PDF.
- Otomatis diekstrak saat edit form.

#### b. Tombol Cetak PDF
- Tombol "Cetak PDF" di pojok kanan atas header (sebelah tombol "Registrasi Aset Baru").
- Menggunakan utility global `exportToPDF()`.
- Kolom PDF: Kode Aset, Nama Aset, **Divisi Pengguna**, Tgl Perolehan, Nilai Aset (format Rupiah), Status Kondisi.
- Dilengkapi ringkasan: total aset, total nilai perolehan, jumlah aset aktif.

### File yang Dimodifikasi

| File | Perubahan |
|---|---|
| `lib/utils/export-pdf.ts` | **BARU** — Utility global PDF |
| `app/finance/asset/page.tsx` | Tambah field divisi, kolom tabel, tombol Cetak PDF, refactor ke utility |
| `app/finance/payroll/page.tsx` | Refactor PDF ke utility |
| `app/produksi/orders/page.tsx` | Contoh implementasi PDF di modul lain |

### Cara Akses di Aplikasi

1. Buka sidebar → **Finance** → **Pengelolaan Aset Tetap**
2. Tombol **Cetak PDF** di pojok kanan atas
3. Tombol **Registrasi Aset Baru** → form sekarang ada input **Divisi Pengguna**
