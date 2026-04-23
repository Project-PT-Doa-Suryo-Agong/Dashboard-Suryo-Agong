-- Fix permissions for core.profiles used by admin user management APIs
-- Run in Supabase SQL Editor

begin;

GRANT USAGE ON SCHEMA core TO authenticated, anon, service_role;

-- Ensure API roles can read/write the profiles table.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.profiles TO authenticated, service_role;

-- Keep future core tables usable by APIs that rely on server-side service_role writes.
ALTER DEFAULT PRIVILEGES IN SCHEMA core
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

commit;
