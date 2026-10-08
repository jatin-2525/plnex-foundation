import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = walk('src');

console.log('=== LOADING INDICATORS / SPINNERS / LOADING TEXT SCAN ===\n');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('animate-spin') ||
      line.includes('Loader2') ||
      line.includes('LoadingState') ||
      line.includes('ProcessingState') ||
      line.includes('isLoading') ||
      line.includes('Loading ') ||
      line.includes('loading ') ||
      line.includes('Preparing ') ||
      line.includes('animate-pulse')
    ) {
      if (!line.includes('import ') && !line.includes('//') && !line.includes('export interface')) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
