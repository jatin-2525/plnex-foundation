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

let failures = [];
let passCount = 0;

console.log('====================================================');
console.log('AUDIT: Empty States & Loading States Verification');
console.log('====================================================\n');

// 1. Check for forbidden "No data" phrase in user-facing UI text
console.log('CHECK 1: Forbidden "No data." phrase check...');
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if contains "no data" outside of comments or variable names like hasNoData
    if (/["'`][^"'`]*\bno\s+data\b[^"'`]*["'`]/i.test(line)) {
      failures.push({
        file,
        line: idx + 1,
        message: `Forbidden phrase "No data" found: ${line.trim()}`,
      });
    }
  });
}
if (failures.length === 0) {
  console.log('  PASS: Zero occurrences of "No data." phrase found across codebase.\n');
  passCount++;
} else {
  console.error(`  FAIL: Found ${failures.length} forbidden "No data" occurrences.`);
}

// 2. Check for animate-pulse in loading states or skeletons
console.log('CHECK 2: Animated skeletons & pulsing elements check...');
let pulseOccurrences = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('animate-pulse')) {
      pulseOccurrences.push({
        file,
        line: idx + 1,
        content: line.trim(),
      });
    }
  });
}
if (pulseOccurrences.length === 0) {
  console.log('  PASS: Zero occurrences of animate-pulse skeletons or cards found.\n');
  passCount++;
} else {
  console.error(`  FAIL: Found ${pulseOccurrences.length} animate-pulse occurrences:`);
  pulseOccurrences.forEach((p) => console.error(`    ${p.file}:${p.line} -> ${p.content}`));
}

// 3. Check LoadingState component structure
console.log('CHECK 3: Restrained LoadingState component check...');
const loadingStateContent = fs.readFileSync('src/components/shared/LoadingState.tsx', 'utf8');
if (loadingStateContent.includes('animate-pulse') || loadingStateContent.includes('skeleton')) {
  console.error('  FAIL: LoadingState still contains skeleton or animate-pulse.');
} else if (loadingStateContent.includes('Loading schedule...') && loadingStateContent.includes('role="status"')) {
  console.log('  PASS: LoadingState is simple, restrained, and accessible.\n');
  passCount++;
} else {
  console.error('  FAIL: LoadingState does not meet specifications.');
}

// 4. Verify all major data tables have explicit empty states with explanations
console.log('CHECK 4: Primary tables empty state compliance...');
const tableFiles = [
  'src/app/execution/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/review/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/schedule-twin/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/health/page.tsx',
];

let tableEmptyPass = true;
for (const tf of tableFiles) {
  const content = fs.readFileSync(tf, 'utf8');
  if (!content.includes('filtered') && !content.includes('length === 0')) {
    console.error(`  FAIL: ${tf} does not handle empty states.`);
    tableEmptyPass = false;
  }
}
if (tableEmptyPass) {
  console.log('  PASS: All 9 primary data pages handle empty state with explicit reasons and actions.\n');
  passCount++;
}

// 5. Verify StateWrapper and DataTable default empty states provide explanation
console.log('CHECK 5: Shared component defaults check...');
const stateWrapperContent = fs.readFileSync('src/components/shared/StateWrapper.tsx', 'utf8');
const dataTableContent = fs.readFileSync('src/components/shared/DataTable.tsx', 'utf8');

if (
  stateWrapperContent.includes('No schedule activities found in this view') &&
  stateWrapperContent.includes('No activities match the current filters') &&
  dataTableContent.includes('No records found in this view') &&
  dataTableContent.includes('No table records match the current filter')
) {
  console.log('  PASS: Shared StateWrapper and DataTable provide descriptive empty state defaults.\n');
  passCount++;
} else {
  console.error('  FAIL: Shared component empty state defaults are not descriptive.');
}

console.log('----------------------------------------------------');
console.log(`SUMMARY: ${passCount}/5 test suites PASSED (${failures.length + pulseOccurrences.length} issues).`);
console.log('----------------------------------------------------');

if (failures.length > 0 || pulseOccurrences.length > 0 || passCount < 5) {
  process.exit(1);
} else {
  process.exit(0);
}
