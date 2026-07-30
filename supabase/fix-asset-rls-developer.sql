-- 1. finance.t_asset
DROP POLICY IF EXISTS "Finance: Asset Developer access" ON finance.t_asset;

CREATE POLICY "Finance: Asset Developer access"
ON finance.t_asset
FOR ALL
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
)
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);

-- 2. finance.t_asset_depreciation_schedule
DROP POLICY IF EXISTS "Finance: Asset Depreciation Developer access" ON finance.t_asset_depreciation_schedule;

CREATE POLICY "Finance: Asset Depreciation Developer access"
ON finance.t_asset_depreciation_schedule
FOR ALL
TO authenticated
USING (
  core.get_user_role_safe() = 'Developer'::core.user_role
)
WITH CHECK (
  core.get_user_role_safe() = 'Developer'::core.user_role
);
