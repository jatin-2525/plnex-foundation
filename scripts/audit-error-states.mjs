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

console.log('=== ERROR STATE COMPONENTS & OCCURRENCES ===\n');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (
      line.includes('ErrorState') ||
      line.includes('ErrorBoundary') ||
      line.includes('hasError') ||
      line.includes('isError') ||
      line.includes('errorState') ||
      line.includes('role="alert"') ||
      line.includes("role='alert'") ||
      file.includes('error.tsx')
    ) {
      if (!line.includes('import ') && !line.includes('//') && !line.includes('export interface')) {
        console.log(`${file}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
