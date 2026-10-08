import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('====================================================');
console.log('AUDIT: Frontend Error States Verification');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function check(desc, fn) {
  try {
    fn();
    console.log(`[PASS] ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`[FAIL] ${desc}: ${err.message}`);
    failCount++;
  }
}

// 1. ErrorState component inspection
check('ErrorState.tsx exists and is accessible', () => {
  const p = path.resolve('src/components/shared/ErrorState.tsx');
  assert(fs.existsSync(p), 'ErrorState.tsx must exist');
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('role="alert"'), 'Must have role="alert" for accessibility');
  assert(content.includes('Schedule could not be displayed.'), 'Must provide canonical what happened title');
  assert(content.includes('The schedule data is temporarily unavailable.'), 'Must explain situation to the user');
  assert(content.includes('Retry'), 'Must provide Retry recovery action');
  assert(content.includes('RotateCcw'), 'Must include restrained recovery icon');
  assert(content.includes('Diagnostic Code:'), 'Must support diagnostic code');
});

// 2. StateWrapper route-aware error resolution
check('StateWrapper.tsx provides route-aware error states', () => {
  const p = path.resolve('src/components/shared/StateWrapper.tsx');
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('resolvedErrorTitle'), 'Must compute resolvedErrorTitle');
  assert(content.includes('resolvedErrorMessage'), 'Must compute resolvedErrorMessage');
  assert(content.includes('resolvedErrorCode'), 'Must compute resolvedErrorCode');
  assert(content.includes('could not be displayed'), 'Must use could not be displayed format');
  assert(content.includes('temporarily unavailable'), 'Must explain temporarily unavailable situation');
});

// 3. Global App Router error boundary
check('App Router error.tsx boundary exists and uses ErrorState', () => {
  const p = path.resolve('src/app/error.tsx');
  assert(fs.existsSync(p), 'src/app/error.tsx must exist');
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('<ErrorState'), 'Must render ErrorState');
  assert(content.includes('Page could not be displayed.'), 'Must explain what happened');
  assert(content.includes('reset'), 'Must pass reset function to retry action');
});

// 4. App Router not-found.tsx
check('App Router not-found.tsx exists with clear explanation and action', () => {
  const p = path.resolve('src/app/not-found.tsx');
  assert(fs.existsSync(p), 'src/app/not-found.tsx must exist');
  const content = fs.readFileSync(p, 'utf8');
  assert(content.includes('Page could not be found.'), 'Must explain what happened');
  assert(content.includes('Return to Dashboard'), 'Must provide recovery action');
});

// 5. Global Search error states
check('GlobalSearch and GlobalSearchPanel provide explanation + retry', () => {
  const p1 = path.resolve('src/components/shared/GlobalSearchPanel.tsx');
  const p2 = path.resolve('src/components/shell/GlobalSearch.tsx');
  const c1 = fs.readFileSync(p1, 'utf8');
  const c2 = fs.readFileSync(p2, 'utf8');
  assert(c1.includes('Search could not be completed.'), 'GlobalSearchPanel must explain what happened');
  assert(c1.includes('Retry Search'), 'GlobalSearchPanel must have retry action');
  assert(c2.includes('Search could not be completed.'), 'GlobalSearch must explain what happened');
  assert(c2.includes('Retry Search'), 'GlobalSearch must have retry action');
});

// 6. Check for giant red screens or dramatic illustrations
check('Zero giant red screens across codebase', () => {
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
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8');
    assert(!c.includes('bg-red-600 min-h-screen'), `Giant red screen forbidden in ${f}`);
    assert(!c.includes('bg-red-500 min-h-screen'), `Giant red screen forbidden in ${f}`);
    assert(!c.includes('bg-[#B5473C] min-h-screen'), `Giant red screen forbidden in ${f}`);
  }
});

console.log('\n----------------------------------------------------');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('----------------------------------------------------');

if (failCount > 0) {
  process.exit(1);
}
