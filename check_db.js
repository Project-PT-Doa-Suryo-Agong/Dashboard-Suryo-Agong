const fs = require('fs');
const https = require('https');

let supabaseUrl, supabaseKey;
try {
  const envContent = fs.readFileSync('.env', 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
    if (key === 'SUPABASE_SERVICE_ROLE_KEY') supabaseKey = val;
  }
} catch (e) {
  console.error("Error reading .env file:", e);
}

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing credentials");
  process.exit(1);
}

const url = `${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`;

https.get(url, {
  headers: {
    'Accept-Profile': 'sales'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const spec = JSON.parse(data);
      console.log("Available tables under 'sales' schema in OpenAPI spec:");
      console.log(Object.keys(spec.definitions || {}));
      
      if (spec.definitions && spec.definitions.t_sales_order) {
        console.log("\nt_sales_order properties:");
        console.log(spec.definitions.t_sales_order.properties);
      }
      
      if (spec.definitions && spec.definitions.t_membership) {
        console.log("\nt_membership properties:");
        console.log(spec.definitions.t_membership.properties);
      }
      
      if (spec.definitions && spec.definitions.t_item) {
        console.log("\nt_item properties:");
        console.log(spec.definitions.t_item.properties);
      }
    } catch (e) {
      console.error("Error parsing response:", e.message);
      console.log("Raw response snippet:", data.slice(0, 1000));
    }
  });
}).on('error', (e) => {
  console.error("HTTP error:", e.message);
});
