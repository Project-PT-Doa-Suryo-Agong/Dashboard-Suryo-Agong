# Super Admin - Ubah Password User Lain

## Status
Pending frontend adjustment.

## Kebutuhan
- Aktifkan input password pada mode edit user di halaman super admin.
- Kirim field password hanya jika diisi.
- Validasi minimal 6 karakter sebelum submit.
- Tampilkan pesan error API saat status 403.
- Kosongkan field password setelah submit sukses.

## Endpoint
- PATCH /api/profiles/:id
