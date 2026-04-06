import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.schema('core').from('profiles').select('role');
  if (error) {
    console.error('Error fetching roles:', error);
    return;
  }
  const roles = [...new Set(data.map((d: any) => d.role))];
  console.log('Distinct roles in DB:', roles);
}

main();
