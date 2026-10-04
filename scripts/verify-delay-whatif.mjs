import fs from 'fs';
import path from 'path';
import assert from 'assert';

const ROOT = process.cwd();
console.log('--- RUNNING DELAY & DEPENDENCY IMPACT + WHAT-IF VERIFICATION SUITE ---');

// 1. Verify Delay & Dependency Impact (src/app/risks/page.tsx)
const risksPath = path.join(ROOT, 'src/app/risks/page.tsx');
assert(fs.existsSync(risksPath), 'src/app/risks/page.tsx must exist');
const risksContent = fs.readFileSync(risksPath, 'utf8');

// A. Must use StateWrapper, not AppShell
assert(!risksContent.includes('<AppShell>'), 'src/app/risks/page.tsx must NOT wrap itself in <AppShell>');
assert(risksContent.includes('<StateWrapper>'), 'src/app/risks/page.tsx must wrap in <StateWrapper>');

// B. Header title must be Delay & Dependency Impact
assert(risksContent.includes('Delay & Dependency Impact'), 'Must contain heading "Delay & Dependency Impact"');

// C. Jargon eliminated from top-level badges, placed into Calculation Details
assert(risksContent.includes('Calculation Details'), 'Must contain collapsible "Calculation Details" section');
assert(risksContent.includes('<details') && risksContent.includes('</details>'), 'Calculation Details must use collapsible <details>');
// Ensure the bad top-level badge string is not rendered as an alert badge
assert(!risksContent.includes('Deterministic Delay Propagation</span>'), 'Must not render "Deterministic Delay Propagation" as top-level badge');

// D. 8 Canonical fields in Delay & Impact
const requiredFields = [
  'Source Activity',
  'Actual Delay',
  'Cause',
  'Evidence',
  'Affected Activities',
  'Dependency',
  'Current Impact',
  'Recommended Action',
];
for (const field of requiredFields) {
  assert(risksContent.includes(field), `Delay & Impact must display field "${field}"`);
}

// E. Canonical example: Foundation Block A (+5 days, Column Installation, Equipment Installation)
assert(risksContent.includes('Foundation Block A'), 'Must include Foundation Block A');
assert(risksContent.includes('+5 days') || risksContent.includes('5.0'), 'Must include +5 days actual delay');
assert(risksContent.includes('Column Installation'), 'Must include Column Installation');
assert(risksContent.includes('Equipment Installation'), 'Must include Equipment Installation');

// F. Visual Dependency chain: Activity A ↓ Activity B ↓ Activity C
assert(risksContent.includes('Activity A'), 'Must display Activity A node in dependency chain');
assert(risksContent.includes('Activity B'), 'Must display Activity B node in dependency chain');
assert(risksContent.includes('Activity C'), 'Must display Activity C node in dependency chain');
assert(risksContent.includes('ArrowDown'), 'Must render downward arrows in dependency chain');

console.log('✓ PASS: src/app/risks/page.tsx satisfies all Delay & Dependency Impact requirements');

// 2. Verify What-if Simulator (src/app/what-if/page.tsx)
const whatIfPath = path.join(ROOT, 'src/app/what-if/page.tsx');
assert(fs.existsSync(whatIfPath), 'src/app/what-if/page.tsx must exist');
const whatIfContent = fs.readFileSync(whatIfPath, 'utf8');

// A. Must use StateWrapper, not AppShell
assert(!whatIfContent.includes('<AppShell>'), 'src/app/what-if/page.tsx must NOT wrap itself in <AppShell>');
assert(whatIfContent.includes('<StateWrapper>'), 'src/app/what-if/page.tsx must wrap in <StateWrapper>');

// B. Prominent SIMULATION badge / isolation
assert(whatIfContent.includes('SIMULATION'), 'Must contain prominent SIMULATION label');
assert(
  whatIfContent.includes('NEVER') && whatIfContent.includes('baseline'),
  'Must state non-destructive isolation guarantee (never modifies baseline)'
);

// C. Exact comparison card elements
assert(whatIfContent.includes('Current'), 'Must display "Current" in simulation comparison');
assert(whatIfContent.includes('Scenario'), 'Must display "Scenario" in simulation comparison');
assert(whatIfContent.includes('Simulated'), 'Must display "Simulated" in simulation comparison');
assert(whatIfContent.includes('Affected activities'), 'Must display "Affected activities" in simulation comparison');

// D. 4 Canonical Actions
const actions = ['Run Scenario', 'Save Scenario', 'Compare Scenario', 'Reset'];
for (const act of actions) {
  assert(whatIfContent.includes(act), `Must include action button "${act}"`);
}

console.log('✓ PASS: src/app/what-if/page.tsx satisfies all What-if Simulator requirements');

// 3. Verify whatIfEngine data model and simulation execution
const enginePath = path.join(ROOT, 'src/lib/domain/whatIfEngine.ts');
assert(fs.existsSync(enginePath), 'src/lib/domain/whatIfEngine.ts must exist');
const engineContent = fs.readFileSync(enginePath, 'utf8');

assert(engineContent.includes('CIV-11-001'), 'Must include CIV-11-001');
assert(engineContent.includes('STR-02-004'), 'Must include STR-02-004 (Column Installation)');
assert(engineContent.includes('MEC-03-010'), 'Must include MEC-03-010 (Equipment Installation)');
assert(engineContent.includes('formatShortDate'), 'Must export formatShortDate');

console.log('✓ PASS: src/lib/domain/whatIfEngine.ts contains required activities and helpers');
console.log('--- ALL DELAY & WHAT-IF VERIFICATION CHECKS PASSED SUCCESSFULLY ---');
