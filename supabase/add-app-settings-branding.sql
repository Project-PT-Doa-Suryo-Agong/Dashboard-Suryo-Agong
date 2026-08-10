BEGIN;

-- ── 1. Helper: hanya role Developer ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION core.is_developer()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM core.profiles
    WHERE id = auth.uid()
    AND role = 'Developer'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION core.is_developer() TO authenticated, service_role;

-- ── 2. TABLE: core.app_settings (single row) ────────────────────────────────
CREATE TABLE IF NOT EXISTS core.app_settings (
    id integer DEFAULT 1 NOT NULL,
    company_name text,
    app_name text,
    primary_color text,
    secondary_color text,
    logo_url text,
    favicon_url text,
    updated_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT app_settings_pkey PRIMARY KEY (id),
    CONSTRAINT app_settings_single_row CHECK (id = 1)
);

ALTER TABLE core.app_settings OWNER TO postgres;

-- Seed baris default (no-op jika sudah ada)
INSERT INTO core.app_settings (id, company_name, app_name, primary_color, secondary_color, logo_url, favicon_url)
VALUES (1, 'PT Doa Suryo Agong', 'Suryo Agong', '#BC934B', '#1e293b', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ── 3. ROW LEVEL SECURITY ────────────────────────────────────────────────────
ALTER TABLE core.app_settings ENABLE ROW LEVEL SECURITY;

-- Idempotent: hapus policy lama sebelum create
DROP POLICY IF EXISTS "App settings readable by all authenticated" ON core.app_settings;
DROP POLICY IF EXISTS "App settings writable only by Developer" ON core.app_settings;

-- Semua authenticated user boleh membaca (single source of truth untuk UI)
CREATE POLICY "App settings readable by all authenticated"
ON core.app_settings FOR SELECT
TO authenticated
USING (true);

-- Hanya role Developer yang boleh INSERT/UPDATE/DELETE.
-- API route juga menggunakan service_role (bypass RLS) — policy ini defense-in-depth.
CREATE POLICY "App settings writable only by Developer"
ON core.app_settings FOR ALL
TO authenticated
USING (core.is_developer())
WITH CHECK (core.is_developer());

-- ── 4. GRANTS ────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA core TO service_role;
GRANT ALL ON TABLE core.app_settings TO authenticated, service_role;

-- ── 5. STORAGE BUCKET: branding (public) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'branding',
    'branding',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies untuk storage.objects pada bucket 'branding'
DROP POLICY IF EXISTS "Branding objects are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Branding objects writable only by Developer" ON storage.objects;

-- Public read (logo/favicon harus tampil di halaman publik: login, landing, buku tamu)
CREATE POLICY "Branding objects are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'branding');

-- Upload/hapus hanya oleh Developer (service_role bypass RLS untuk API)
CREATE POLICY "Branding objects writable only by Developer"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'branding' AND core.is_developer())
WITH CHECK (bucket_id = 'branding' AND core.is_developer());

COMMIT;
