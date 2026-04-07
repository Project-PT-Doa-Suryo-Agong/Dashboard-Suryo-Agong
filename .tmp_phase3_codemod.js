const fs = require('fs');
const path = require('path');

const roots = [
  path.join(process.cwd(), 'app', 'api'),
  path.join(process.cwd(), 'lib', 'guards')
].filter(fs.existsSync);

function walk(dir, acc=[]) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (full.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

const files = roots.flatMap(r => walk(r));

for (const file of files) {
  let txt = fs.readFileSync(file, 'utf8');
  const original = txt;

  txt = txt.replace(/fail\("([A-Z_]+)"/g, (_, code) => {
    const mapped = code === 'BAD_REQUEST' ? 'INVALID_JSON' : code;
    return `fail(ErrorCode.${mapped}`;
  });

  if (txt.includes('fail(ErrorCode.')) {
    const hasImport = /from\s+["']@\/lib\/http\/error-codes["']/.test(txt);
    if (!hasImport) {
      const lines = txt.split(/\r?\n/);
      let lastImport = -1;
      for (let i = 0; i < lines.length; i++) {
        if (/^import\s+/.test(lines[i])) lastImport = i;
      }
      if (lastImport >= 0) {
        lines.splice(lastImport + 1, 0, 'import { ErrorCode } from "@/lib/http/error-codes";');
        txt = lines.join('\n');
      }
    }
  }

  if (txt !== original) fs.writeFileSync(file, txt, 'utf8');
}

console.log(`Updated ${files.length} candidate files.`);
