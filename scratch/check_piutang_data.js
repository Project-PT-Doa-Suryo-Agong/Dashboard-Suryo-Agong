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

const url = `${supabaseUrl}/rest/v1/t_utang_piutang?select=*&apikey=${supabaseKey}`;

const req = https.get(url, {
  headers: {
    'Accept-Profile': 'finance'
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const rows = JSON.parse(data);
      console.log("Database rows in t_utang_piutang:", rows);
    } catch (e) {
      console.error("Error parsing response:", e.message);
    }
  });
});
req.on('error', (e) => {
  console.error("HTTP error:", e.message);
});
