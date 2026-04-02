import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      walk(path.join(dir, file), fileList);
    } else if (file === 'route.ts') {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const apiDir = path.join(__dirname, 'app', 'api');
const routes = walk(apiDir);

const results: any[] = [];

for (const route of routes) {
  const code = fs.readFileSync(route, 'utf-8');
  const lines = code.split('\n');
  const methods = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
  
  let currentMethod = '';
  
  for (const line of lines) {
    for (const m of methods) {
      if (line.includes(`export async function ${m}`)) {
        currentMethod = m;
      }
    }
    
    if (line.includes('requireLevel(')) {
      const match = line.match(/requireLevel\((.*?)\)/);
      if (match) {
        const reqs = match[1].replace(/['"]/g, '').split(',').map(s => s.trim());
        results.push({
          file: route.replace(apiDir, '').replace(/\\/g, '/'),
          method: currentMethod,
          levels: reqs
        });
      }
    }
  }
}

fs.writeFileSync('audit_result.json', JSON.stringify(results, null, 2), 'utf-8');
