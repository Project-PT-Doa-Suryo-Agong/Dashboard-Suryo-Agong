DROP POLICY IF EXISTS "Sales: Staff access content statistic"
ON sales.t_content_statistic;

CREATE POLICY "Sales: Staff access content statistic"
ON sales.t_content_statistic
USING (
  core.is_admin()
  OR core.get_user_role() = ANY (
    ARRAY[
      'Super Admin'::core.user_role,
      'Management & Strategy'::core.user_role,
      'Finance & Administration'::core.user_role,
      'HR & Operation Manager'::core.user_role,
      'Produksi & Quality Control'::core.user_role,
      'Logistics & Packing'::core.user_role,
      'Creative & Sales'::core.user_role
    ]
  )
)
WITH CHECK (
  core.is_admin()
  OR core.get_user_role() = ANY (
    ARRAY[
      'Super Admin'::core.user_role,
      'Management & Strategy'::core.user_role,
      'Finance & Administration'::core.user_role,
      'HR & Operation Manager'::core.user_role,
      'Produksi & Quality Control'::core.user_role,
      'Logistics & Packing'::core.user_role,
      'Creative & Sales'::core.user_role
    ]
  )
);
