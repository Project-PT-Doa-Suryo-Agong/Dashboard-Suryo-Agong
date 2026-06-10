import { readFileSync, writeFileSync } from 'fs';
const envFile = readFileSync('.env', 'utf-8');
const envUrl = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const envKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

async function check() {
  const res = await fetch(envUrl + '/rest/v1/?apikey=' + envKey, { headers: { 'Accept-Profile': 'sales' } });
  const schema = await res.json();
  writeFileSync('openapi_sales.json', JSON.stringify(schema, null, 2));
}
check();
