const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

let envStr = '';
try {
  envStr = fs.readFileSync('.env', 'utf8');
} catch (e) {
  envStr = fs.readFileSync('.env.local', 'utf8');
}

const env = {};
envStr.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.schema('core').from('profiles').select('*').limit(1);
  console.log("data:", data, "error:", error);
}
run();
