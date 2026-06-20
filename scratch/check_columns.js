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
  // Try querying sales.t_sales_order
  const { data: orderData, error: orderError } = await supabase
    .schema('sales')
    .from('t_sales_order')
    .select('*')
    .limit(1);
  console.log("--- t_sales_order sample row ---");
  console.log("data:", orderData);
  console.log("error:", orderError);

  // Try querying sales.t_item
  const { data: itemData, error: itemError } = await supabase
    .schema('sales')
    .from('t_item')
    .select('*')
    .limit(3);
  console.log("\n--- t_item sample rows ---");
  console.log("data:", itemData);
  console.log("error:", itemError);
}
run();
