const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function getEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return env;
}

async function run() {
  const env = getEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data, error } = await supabase
    .rpc('get_enum_values', { enum_type: 'tipe_kas' });

  if (error) {
    // If RPC doesn't exist, execute SQL query via a custom select
    console.error('RPC error:', error);
    // Let's run a raw query using pg or query table definitions
    const { data: enumData, error: enumError } = await supabase
      .from('pg_type')
      .select('typname')
      .eq('typname', 'tipe_kas');
    console.log('typname:', enumData, enumError);
  } else {
    console.log('Enum values:', data);
  }
}

run();
