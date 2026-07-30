DROP POLICY IF EXISTS "Prod: Developer access" ON production.t_produksi_order;

CREATE POLICY "Prod: Developer access"
ON production.t_produksi_order
FOR ALL
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
)
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);
