DROP POLICY IF EXISTS "Developer can insert attendance"
ON hr.t_attendance;

CREATE POLICY "Developer can insert attendance"
ON hr.t_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);


DROP POLICY IF EXISTS "Developer can update attendance"
ON hr.t_attendance;

CREATE POLICY "Developer can update attendance"
ON hr.t_attendance
FOR UPDATE
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
)
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);
DROP POLICY IF EXISTS "Developer can delete attendance"
ON hr.t_attendance;

CREATE POLICY "Developer can delete attendance"
ON hr.t_attendance
FOR DELETE
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
);