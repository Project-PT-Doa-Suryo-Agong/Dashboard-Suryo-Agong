const fs = require('fs');

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Perform case insensitive replace for exact strings inside quotes
  content = content.replace(/'Developer'/gi, "'developer'");
  content = content.replace(/'CEO'/gi, "'management'");
  content = content.replace(/'Finance'/gi, "'finance'");
  content = content.replace(/'HR'/gi, "'hr'");
  content = content.replace(/'Logistik'/gi, "'logistik'");
  content = content.replace(/'Produksi'/gi, "'produksi'");
  content = content.replace(/'Creative'/gi, "'creative'");
  content = content.replace(/'Office'/gi, "'office'");

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Updated ${filePath}`);
}

updateFile('./supabase/rls-policies.sql');
updateFile('./supabase/phase4-realtime-storage.sql');
updateFile('./supabase/fix-auth-logic.sql');
