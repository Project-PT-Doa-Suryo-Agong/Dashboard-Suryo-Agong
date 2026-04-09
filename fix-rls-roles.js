const fs = require('fs');

let content = fs.readFileSync('supabase/rls-policies.sql', 'utf-8');

const map = {
  'Developer': 'Developer',
  'CEO': 'Management & Strategy',
  'Finance': 'Finance & Administration',
  'HR': 'HR & Operation Manager',
  'Produksi': 'Produksi & Quality Control',
  'Logistik': 'Logistics & Packing',
  'Creative': 'Creative & Sales',
  'Office': 'Office Support'
};

// Replace exact matches in IN (...) or = '...' without messing up other words
for (const [shortRole, longRole] of Object.entries(map)) {
  const regex = new RegExp('', 'g');
  content = content.replace(regex, '');
}

fs.writeFileSync('supabase/rls-policies.sql', content, 'utf-8');
console.log('Fixed RLS in rls-policies.sql');
