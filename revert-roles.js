const fs = require('fs');

const fileOptions = { encoding: 'utf8' };

function updateFile(path, replaceFn) {
  if (fs.existsSync(path)) {
    let content = fs.readFileSync(path, fileOptions);
    let newContent = replaceFn(content);
    if (content !== newContent) {
      fs.writeFileSync(path, newContent, fileOptions);
      console.log('Updated ' + path);
    } else {
      console.log('No changes needed in ' + path);
    }
  } else {
    console.log('File not found: ' + path);
  }
}

// 1. types/supabase.ts
updateFile('./types/supabase.ts', c => {
  const newEnum = `export type CoreUserRole =
  | "Developer"
  | "Management & Strategy"
  | "Finance & Administration"
  | "HR & Operation Manager"
  | "Produksi & Quality Control"
  | "Logistics & Packing"
  | "Creative & Sales"
  | "Office Support";`;
  return c.replace(/export type CoreUserRole =[\s\S]+?;/, newEnum);
});

// 2. lib/access/policy.ts
updateFile('./lib/access/policy.ts', c => {
  let updated = c.replace(/'developer'/g, "'Developer'")
                 .replace(/'management'/g, "'Management & Strategy'")
                 .replace(/'finance'/g, "'Finance & Administration'")
                 .replace(/'hr'/g, "'HR & Operation Manager'")
                 .replace(/'produksi'/g, "'Produksi & Quality Control'")
                 .replace(/'logistik'/g, "'Logistics & Packing'")
                 .replace(/'creative'/g, "'Creative & Sales'")
                 .replace(/'office'/g, "'Office Support'");
  return updated;
});

// 3. lib/validation/profiles-admin.ts
updateFile('./lib/validation/profiles-admin.ts', c => {
  let updated = c.replace(/"developer"/g, '"Developer"')
                 .replace(/"management"/g, '"Management & Strategy"')
                 .replace(/"finance"/g, '"Finance & Administration"')
                 .replace(/"hr"/g, '"HR & Operation Manager"')
                 .replace(/"produksi"/g, '"Produksi & Quality Control"')
                 .replace(/"logistik"/g, '"Logistics & Packing"')
                 .replace(/"creative"/g, '"Creative & Sales"')
                 .replace(/"office"/g, '"Office Support"');
  return updated;
});

// 4. supabase/rls-policies.sql
updateFile('./supabase/rls-policies.sql', c => {
  return c.replace(/'developer'/g, "'Developer'")
          .replace(/'management'/g, "'Management & Strategy'")
          .replace(/'finance'/g, "'Finance & Administration'")
          .replace(/'hr'/g, "'HR & Operation Manager'")
          .replace(/'produksi'/g, "'Produksi & Quality Control'")
          .replace(/'logistik'/g, "'Logistics & Packing'")
          .replace(/'creative'/g, "'Creative & Sales'")
          .replace(/'office'/g, "'Office Support'");
});

// 5. supabase/fix-auth-logic.sql
updateFile('./supabase/fix-auth-logic.sql', c => {
  return c.replace(/'developer', 'management', 'finance', 'hr', 'produksi', 'logistik', 'creative', 'office'/, "'Developer', 'Management & Strategy', 'Finance & Administration', 'HR & Operation Manager', 'Produksi & Quality Control', 'Logistics & Packing', 'Creative & Sales', 'Office Support'");
});

// 6. supabase/phase4-realtime-storage.sql
updateFile('./supabase/phase4-realtime-storage.sql', c => {
  return c.replace(/'developer', 'management', 'finance'/g, "'Developer', 'Management & Strategy', 'Finance & Administration'")
          .replace(/'developer', 'management', 'logistik', 'produksi'/g, "'Developer', 'Management & Strategy', 'Logistics & Packing', 'Produksi & Quality Control'");
});

// 7. README.md
updateFile('./README.md', c => {
  let res = c.replace(
    /developer, management, finance, hr, produksi, logistik, creative, office/g,
    "Developer, Management & Strategy, Finance & Administration, HR & Operation Manager, Produksi & Quality Control, Logistics & Packing, Creative & Sales, Office Support"
  );

  // update instruction – replace the old role string with the new, human‑readable version
  res = res.replace(
    /Gunakan role === 'management'/g,
    "Gunakan role === 'Management & Strategy'"
  );

  return res;
});
