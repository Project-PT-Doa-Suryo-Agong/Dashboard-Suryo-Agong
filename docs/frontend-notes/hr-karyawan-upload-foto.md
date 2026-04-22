# HR - Karyawan Upload Foto ke Supabase

## Status
Done

## Ringkasan
- Form HR Karyawan sudah mendukung upload 3 dokumen foto:
  - foto_perorangan
  - foto_ktp
  - foto_kk
- Frontend kirim file via multipart/form-data ke endpoint internal backend, bukan upload langsung dari browser ke Supabase.
- Bucket tujuan untuk penyimpanan dokumen karyawan: employee_documents.

## Alur Frontend
1. User isi form tambah/edit karyawan.
2. User pilih file foto (opsional, maksimal 1 file per field foto).
3. Saat submit:
   - Frontend simpan data karyawan dulu (create/update).
   - Setelah dapat employee_id, frontend panggil endpoint upload foto.
4. Backend upload file ke Supabase Storage dan update kolom URL di tabel hr.m_karyawan.
5. Frontend refresh data untuk menampilkan URL terbaru.

## Endpoint yang Dipakai Frontend
- POST /api/hr/employees/[id]/upload-photos
- Alias: POST /api/hr/karyawan/[id]/upload-photos

## Field Multipart yang Dikirim
- foto_perorangan
- foto_ktp
- foto_kk

## Mapping Kolom DB
- foto_perorangan -> foto_perorangan_url
- foto_ktp -> foto_ktp_url
- foto_kk -> foto_kk_url

## Validasi dari Backend
- Minimal kirim 1 file.
- Maksimal 1 file untuk tiap field: foto_perorangan, foto_ktp, foto_kk.
- Semua file harus image/*.
- Batas ukuran tiap file: 5MB.

## Catatan Teknis
- Penamaan file dibedakan per jenis dokumen agar tidak bentrok dalam satu bucket.
- Backend menyimpan URL publik hasil upload ke kolom yang sesuai di hr.m_karyawan.
- Jika ada file lama di kolom yang sama, backend akan menghapus file lama setelah upload baru berhasil.
