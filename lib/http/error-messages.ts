export const ErrorMessage = {
  UNAUTHORIZED: "Sesi tidak valid. Silakan login kembali.",
  FORBIDDEN: "Akses ditolak. Anda tidak memiliki izin.",
  NOT_FOUND: (resource: string) => `${resource} tidak ditemukan.`,
  DB_ERROR: "Terjadi kesalahan pada database.",
  INTERNAL_ERROR: "Terjadi kesalahan internal server.",
  INVALID_JSON: "Format request tidak valid. Pastikan body berupa JSON.",
  EMPTY_UPDATE: "Tidak ada field yang diupdate.",
  MISSING_ID: "ID tidak boleh kosong.",
} as const;
