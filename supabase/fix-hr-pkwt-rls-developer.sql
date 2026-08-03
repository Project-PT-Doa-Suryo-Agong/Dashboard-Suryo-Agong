DROP POLICY IF EXISTS "Developer can insert pkwt"
ON hr.t_pkwt;

CREATE POLICY "Developer can insert pkwt"
ON hr.t_pkwt
FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);

-- ==========================================
-- POLICY: Developer SELECT
-- Diperlukan oleh: GET /api/hr/pkwt (list),
--   GET /api/hr/pkwt/[id] (detail)
-- ==========================================

DROP POLICY IF EXISTS "Developer can select pkwt"
ON hr.t_pkwt;

CREATE POLICY "Developer can select pkwt"
ON hr.t_pkwt
FOR SELECT
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
);

-- ==========================================
-- POLICY: Developer DELETE
-- Diperlukan oleh: DELETE /api/hr/pkwt/[id]
-- ==========================================

DROP POLICY IF EXISTS "Developer can delete pkwt"
ON hr.t_pkwt;

CREATE POLICY "Developer can delete pkwt"
ON hr.t_pkwt
FOR DELETE
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
);

-- ==========================================
-- GRANT: service_role privilege
-- Diperlukan oleh: fallback supabaseAdmin
--   pada POST /api/hr/pkwt
-- ==========================================

GRANT SELECT, INSERT, DELETE ON TABLE hr.t_pkwt TO service_role;
