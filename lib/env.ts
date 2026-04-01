/**
 * Environment variables.
 *
 * IMPORTANT: Next.js only inlines `process.env.NEXT_PUBLIC_*` on the client
 * when the full env-var name appears literally (e.g. process.env.NEXT_PUBLIC_FOO).
 * A dynamic lookup like `process.env[name]` is NOT inlined and will be
 * `undefined` in the browser bundle. That's why we reference each variable
 * by its full literal name below.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    "NEXT_PUBLIC_SUPABASE_URL"
  ),
  supabaseAnonKey: required(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  ),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};
