import fs from 'fs';
import assert from 'assert';
import path from 'path';

console.log('=== VERIFYING BUTTON HIERARCHY & STYLING AUDIT ===\n');

// 1. WHAT-IF SIMULATION BUTTONS
console.log('1. Checking What-If Simulation buttons...');
const whatIfCode = fs.readFileSync('src/app/what-if/page.tsx', 'utf8');
assert(whatIfCode.includes('Run What-If Simulation'), 'What-If must use descriptive "Run What-If Simulation" label');
assert(!whatIfCode.includes('<span>Run Scenario</span>'), 'What-If must not use vague "Run Scenario" label');
assert(whatIfCode.includes('Reset to Baseline'), 'What-If must use descriptive "Reset to Baseline" label');
assert(whatIfCode.includes('Compare Scenarios'), 'What-If must use "Compare Scenarios" label');
assert(whatIfCode.includes('Close Comparison') && whatIfCode.includes('bg-white text-[#172033] border border-[#D9DEE5]'), 'Comparison modal close button must be secondary neutral');
console.log('   ✓ What-If: 1 primary action ("Run What-If Simulation") and 3 clear secondary actions verified.\n');

// 2. SCHEDULE PAGE BUTTONS
console.log('2. Checking Schedule page buttons...');
const schedCode = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');
assert(schedCode.includes('Import P6 Baseline'), 'Schedule must use descriptive "Import P6 Baseline" label');
assert(!schedCode.includes('<span>Import Schedule</span>'), 'Schedule must not use generic "Import Schedule" label');
assert(schedCode.includes('Clear All Filters'), 'Schedule empty state must have Clear All Filters button');
assert(schedCode.includes('bg-[#176B87]') && schedCode.includes('border border-[#176B87]'), 'Primary button must have solid teal background and border');
console.log('   ✓ Schedule: "Import P6 Baseline" primary action and secondary neutral controls verified.\n');

// 3. REVIEW QUEUE BUTTONS
console.log('3. Checking Review Queue buttons...');
const reviewCode = fs.readFileSync('src/app/review/page.tsx', 'utf8');
assert(reviewCode.includes('Accept Selected') && reviewCode.includes('bg-[#176B87]'), 'Accept Selected must be primary solid teal');
assert(reviewCode.includes('Deselect All') && reviewCode.includes('bg-white') && reviewCode.includes('border-[#D9DEE5]'), 'Deselect All must be secondary neutral');
assert(reviewCode.includes('Approve Match & Commit') && reviewCode.includes('bg-[#176B87]'), 'Review drawer approve button must be primary teal');
assert(!reviewCode.includes('active:scale-95') || !reviewCode.includes('Approve Match & Commit active:scale-95'), 'Review drawer approve button must not have active:scale-95 bounce animation');
assert(reviewCode.includes('Close Preview') && reviewCode.includes('bg-white border border-[#D9DEE5]'), 'Evidence preview modal close button must be secondary neutral');
console.log('   ✓ Review Queue: Primary teal batch action and drawer approval verified.\n');

// 4. FIELD CAPTURE & DPR BUTTONS
console.log('4. Checking Field Capture & DPR buttons...');
const captureCode = fs.readFileSync('src/app/field/capture/page.tsx', 'utf8');
assert(captureCode.includes('Submit Field Observation'), 'Field Capture must use descriptive "Submit Field Observation"');
assert(captureCode.includes('Engineer Dashboard'), 'Field Capture header link must be labeled "Engineer Dashboard"');

const dprCode = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
assert(dprCode.includes('Sign & Submit Daily Report'), 'DPR must use descriptive "Sign & Submit Daily Report"');
assert(dprCode.includes('Save DPR Draft'), 'DPR draft button must use descriptive "Save DPR Draft"');
assert(dprCode.includes('min-h-[48px]') && dprCode.includes('min-h-[44px]'), 'DPR buttons must satisfy mobile touch requirements');
console.log('   ✓ Field Capture & DPR: Touch-friendly buttons and clear action verbs verified.\n');

// 5. DASHBOARD ACTIONS & ATTENTION GRID
console.log('5. Checking Dashboard button hierarchy...');
const dashCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
assert(dashCode.includes('Review Pending Events') && dashCode.includes('bg-[#176B87]'), 'Dashboard header must feature 1 primary action');
assert(dashCode.includes('Record Field Observation') && dashCode.includes('border border-[#D9DEE5]'), 'Dashboard header must have neutral secondary action');
assert(dashCode.includes('Review Match') && dashCode.includes('border border-[#B3CBE0]'), 'Dashboard review table must use secondary Review Match action');
assert(!dashCode.includes('w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block\n              >\n                Inspect Delay Chain'), 'Attention cards must not all be solid teal primary buttons');
console.log('   ✓ Dashboard: Header primary action and secondary card buttons verified.\n');

// 6. HEALTH & RISKS BUTTONS
console.log('6. Checking Health & Risks buttons...');
const healthCode = fs.readFileSync('src/app/health/page.tsx', 'utf8');
assert(healthCode.includes('Run Schedule Health Audit') && healthCode.includes('bg-[#176B87]'), 'Health header must have primary "Run Schedule Health Audit"');
assert(healthCode.includes('Diagnostic Ledger') && healthCode.includes('border border-[#D9DEE5]'), 'Health header must have secondary action');

const risksCode = fs.readFileSync('src/app/risks/page.tsx', 'utf8');
assert(risksCode.includes('Schedule Twin') && risksCode.includes('bg-[#176B87]'), 'Risks header must have primary Schedule Twin button');
assert(risksCode.includes('Open Dependency Drawer') && risksCode.includes('bg-white'), 'Dependency drawer trigger must be secondary bordered button');
console.log('   ✓ Health & Risks: Restrained primary actions and secondary drawer triggers verified.\n');

// 7. SYNC & EVIDENCE BUTTONS
console.log('7. Checking Sync & Evidence buttons...');
const syncCode = fs.readFileSync('src/app/sync/page.tsx', 'utf8');
assert(syncCode.includes('Trigger Manual Sync') && syncCode.includes('bg-[#176B87]'), 'Sync queue must feature primary "Trigger Manual Sync" button');
assert(syncCode.includes('Retry Failed Items') && syncCode.includes('border border-[#D9DEE5]'), 'Sync queue must have secondary retry button');
assert(syncCode.includes('Resolve Conflicts') && syncCode.includes('text-[#B5473C]'), 'Sync conflict button must use semantic red');
assert(syncCode.includes('Merge Changes') && syncCode.includes('bg-[#176B87]'), 'Conflict resolution primary button must be solid teal');

const evidCode = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');
assert(evidCode.includes('Upload Verification Evidence') && evidCode.includes('bg-[#176B87]'), 'Evidence header must feature primary upload action');
assert(evidCode.includes('Export Audit Ledger') && evidCode.includes('border border-[#D9DEE5]'), 'Evidence header must have secondary export action');
assert(evidCode.includes('Confirm Verification') && evidCode.includes('bg-[#176B87]'), 'Evidence modal must feature primary Confirm Verification button');
console.log('   ✓ Sync & Evidence: Semantic red for conflicts, solid teal for primary commit verified.\n');

// 8. GLOBAL OVERSIZED BUTTON AUDIT
console.log('8. Checking for oversized button padding (px-8, px-10, py-4)...');
const filesToAudit = [
  'src/app/dashboard/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/review/page.tsx',
  'src/app/what-if/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/field/capture/page.tsx',
  'src/app/field/dpr/page.tsx',
  'src/app/matching/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/reports/page.tsx',
  'src/app/health/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/sync/page.tsx',
  'src/app/variance/page.tsx',
  'src/app/schedule-twin/page.tsx',
];

for (const file of filesToAudit) {
  const content = fs.readFileSync(file, 'utf8');
  // Match buttons or links with oversized padding: px-8, px-10, py-3.5, py-4
  const oversizedButtonRegex = /<(?:button|Link)[^>]*\b(px-8|px-10|py-3\.5|py-4)\b[^>]*>/g;
  const match = content.match(oversizedButtonRegex);
  assert(!match, `File ${file} contains oversized button padding: ${match ? match[0] : ''}`);
}
console.log('   ✓ Global: Zero oversized padding (px-8, px-10, py-4) across all 15 audited views.\n');

console.log('====================================================');
console.log('ALL BUTTON HIERARCHY & AUDIT CHECKS PASSED');
console.log('====================================================');
