-- ============================================================
-- Langkah 1: Lihat nilai enum return_status yang saat ini ada
-- Jalankan query ini dulu untuk mengetahui nilai aktual
-- ============================================================
SELECT enumlabel
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'logistics'
  AND t.typname = 'return_status'
ORDER BY e.enumsortorder;

-- ============================================================
-- Langkah 2: Buat RPC function agar backend bisa query enum
-- Jalankan ini di Supabase SQL Editor
-- ============================================================
CREATE OR REPLACE FUNCTION get_return_status_enum_values()
RETURNS TEXT[] AS $$
  SELECT ARRAY(
    SELECT enumlabel::TEXT
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'logistics'
      AND t.typname = 'return_status'
    ORDER BY e.enumsortorder
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_return_status_enum_values() TO authenticated, service_role;

-- ============================================================
-- Langkah 3 (OPSIONAL): Jika enum tidak punya nilai yang kamu butuhkan,
-- tambahkan nilai baru. Contoh menambah "diproses" dan "selesai":
-- ============================================================
-- ALTER TYPE logistics.return_status ADD VALUE IF NOT EXISTS 'diproses';
-- ALTER TYPE logistics.return_status ADD VALUE IF NOT EXISTS 'selesai';

-- ============================================================
-- Langkah 4 (OPSIONAL): Jika ingin ganti nama nilai lama
-- (misalnya "inprogress" → "diproses"), lakukan via:
-- ============================================================
-- UPDATE logistics.t_return_order
--   SET status = 'diproses'::logistics.return_status
--   WHERE status::text = 'inprogress';
--
-- Catatan: PostgreSQL tidak support RENAME ENUM VALUE sebelum v10,
-- dan ALTER TYPE ... RENAME VALUE baru ada di PostgreSQL 10+.
-- ALTER TYPE logistics.return_status RENAME VALUE 'inprogress' TO 'diproses';
