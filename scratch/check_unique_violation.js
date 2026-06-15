const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  // Ms. Inum's profile ID is f80ee564-a8f9-454a-9955-46dbc1c6b4b9.
  // Her employee ID is 4b81b136-51c1-46f0-a0f6-15154c24445d.
  // Rahmalia's employee ID is 1b1383bb-cd65-45ba-b6cb-512dc2d67b42.

  const penilaiProfileId = 'f80ee564-a8f9-454a-9955-46dbc1c6b4b9';
  const dinilaiEmployeeId = '1b1383bb-cd65-45ba-b6cb-512dc2d67b42';

  // 1. Resolve employee ID
  const { data: karyawanPenilai, error: penilaiErr } = await supabaseAdmin
    .schema('hr')
    .from('m_karyawan')
    .select('id')
    .eq('profile_id', penilaiProfileId)
    .single();

  if (penilaiErr || !karyawanPenilai) {
    console.error("Penilai resolve error:", penilaiErr);
    return;
  }

  console.log("Resolved penilai employee ID:", karyawanPenilai.id);

  // 2. Try inserting
  const { data, error } = await supabaseAdmin
    .schema('management')
    .from('penilaian_kerja')
    .insert({
      penilai: karyawanPenilai.id,
      dinilai: dinilaiEmployeeId,
      kepribadian_sikap: 3,
      teamwork: 3,
      pengetahuan_wawasan: 3,
      komunikasi_pemasaran: 3,
      networking_data: 3,
      produktivitas: 3,
      problem_solving: 3,
      leadership: 3,
      tanggal_penilaian: '2026-06-15'
    })
    .select()
    .single();

  if (error) {
    console.error("INSERT RESULT ERROR:", error);
  } else {
    console.log("INSERT RESULT SUCCESS:", data);
  }
}

run();
