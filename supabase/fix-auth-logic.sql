-- ============================================================================
-- FIX: PRIVILEGE ESCALATION VULNERABILITY DI PROFILES
-- ============================================================================

-- Karena user bisa update profile-nya sendiri (nama, telepon), ada celah di mana 
-- user nakal bisa mengupdate kolom `role` mereka menjadi 'management' karena RLS 
-- secara default tidak membatasi kolom apa yang di-update.

-- Solusi terbaik adalah membuat trigger yang memaksa `role` tidak berubah 
-- saat user melakukan update dari client, KECUALI yang melakukan update adalah super admin (service role).
-- Karena kita pakai RLS API, user biasa selalu punya session.

CREATE OR REPLACE FUNCTION core.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Selalu kembalikan role ke nilai lama (OLD.role) agar tidak bisa diubah sembarangan
  -- melalui operasi UPDATE dari client
  NEW.role = OLD.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger jika sudah ada
DROP TRIGGER IF EXISTS tr_prevent_role_escalation ON core.profiles;

-- Pasang trigger di tabel profiles
CREATE TRIGGER tr_prevent_role_escalation
BEFORE UPDATE ON core.profiles
FOR EACH ROW
EXECUTE FUNCTION core.prevent_role_escalation();
