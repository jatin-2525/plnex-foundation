import { execSync } from 'child_process';
import fs from 'fs';

const scripts = fs.readdirSync('scripts').filter((f) => f.startsWith('verify-') && f.endsWith('.mjs'));

console.log(`Found ${scripts.length} verification scripts to run.\n`);

let passed = 0;
let failed = 0;

for (const script of scripts) {
  try {
    process.stdout.write(`Running ${script}... `);
    execSync(`node scripts/${script}`, { stdio: 'pipe' });
    console.log('PASSED');
    passed++;
  } catch (err) {
    console.log('FAILED');
    console.error(err.stdout ? err.stdout.toString() : err.message);
    failed++;
  }
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED out of ${scripts.length}`);
console.log(`========================================`);

if (failed > 0) process.exit(1);
