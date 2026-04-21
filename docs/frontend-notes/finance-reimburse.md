# Finance - Reimburse Bukti

## Status
Pending frontend adjustment.

## Kebutuhan
- Upload file bukti dari UI, lalu kirim path atau URL lewat field bukti ke endpoint reimburse.
- Manfaatkan field bukti_url dari GET /api/finance/reimburse untuk preview file private tanpa generate signed URL manual di frontend.

## Catatan
- Jika kolom DB belum lengkap, jalankan SQL di supabase/add_kolom_reimburse.sql.
