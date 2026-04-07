const fs = require('fs');
const path = require('path');

function walk(dir, acc=[]) {
  if (!fs.existsSync(dir)) return acc;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (full.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

const files = [
  ...walk(path.join(process.cwd(), 'app', 'api')),
  ...walk(path.join(process.cwd(), 'lib', 'guards')),
];

for (const file of files) {
  let txt = fs.readFileSync(file, 'utf8');
  const orig = txt;
  txt = txt.replace(/fail\(\s*"([A-Z_]+)"/g, (_, code) => {
    const mapped = code === 'BAD_REQUEST' ? 'INVALID_JSON' : code;
    return `fail(ErrorCode.${mapped}`;
  });

  if (txt.includes('fail(ErrorCode.')) {
    if (!txt.includes('from "@/lib/http/error-codes"') && !txt.includes("from '@/lib/http/error-codes'")) {
      const lines = txt.split(/\r?\n/);
      let idx = -1;
      for (let i = 0; i < lines.length; i++) if (/^import\s+/.test(lines[i])) idx = i;
      if (idx >= 0) lines.splice(idx + 1, 0, 'import { ErrorCode } from "@/lib/http/error-codes";');
      txt = lines.join('\n');
    }
  }

  if (txt !== orig) fs.writeFileSync(file, txt);
}
console.log('Done multiline fail migration.');
