BEGIN;


ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS landing_background   text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS landing_primary      text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS landing_secondary    text;

ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS login_background     text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS login_primary        text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS login_secondary      text;

ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS dashboard_background text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS dashboard_primary    text;
ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS dashboard_secondary  text;

ALTER TABLE core.app_settings ADD COLUMN IF NOT EXISTS sidebar_background   text;

COMMIT;
