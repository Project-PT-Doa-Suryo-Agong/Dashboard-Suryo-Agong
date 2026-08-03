DROP POLICY IF EXISTS "Logistics: Manage returns" ON logistics.t_return_order;

CREATE POLICY "Logistics: Manage returns"
ON logistics.t_return_order
USING (
  core.is_admin()
  OR core.get_user_role() = ANY (
    ARRAY[
      'Logistics & Packing'::core.user_role,
      'Super Admin'::core.user_role,
      'Finance & Administration'::core.user_role
    ]
  )
);
