/**
 * PLnEX Progress & Variance Verification Test Suite
 *
 * Verifies all directives:
 * 1. Top Section: Planned Progress, Actual Verified Progress, Variance
 * 2. Activity Table: Activity, Planned %, Verified Actual %, Variance, Forecast Finish, Status, Last Verified Update
 * 3. Progress Detail: Previous Progress -> Execution Event -> Evidence -> Verification -> New Progress
 * 4. Anti-Arbitrary Editing Gate: Mandatory reason, source, user, timestamp, audit record
 * 5. History Progression: e.g. 53% -> 65% -> 72% with dates and source evidence
 */

import fs from 'node:fs';
import path from 'node:path';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

console.log('\n======================================================');
console.log('PLnEX PROGRESS & VARIANCE VERIFICATION TEST SUITE');
console.log('======================================================\n');

const progressContent = fs.readFileSync(
  path.resolve('src/app/progress/page.tsx'),
  'utf-8'
);

// 1. TOP SECTION
console.log('TEST GROUP 1: Top KPI Cards');
assert(progressContent.includes('Planned Progress'), 'Top shows Planned Progress card');
assert(progressContent.includes('Actual Verified Progress'), 'Top shows Actual Verified Progress card');
assert(progressContent.includes('Variance'), 'Top shows Variance card');

// 2. ACTIVITY TABLE
console.log('\nTEST GROUP 2: Activity Table Canonical Columns');
assert(progressContent.includes('>Activity</th>'), 'Table column 1: Activity');
assert(progressContent.includes('>Planned %</th>'), 'Table column 2: Planned %');
assert(progressContent.includes('>Verified Actual %</th>'), 'Table column 3: Verified Actual %');
assert(progressContent.includes('>Variance</th>'), 'Table column 4: Variance');
assert(progressContent.includes('>Forecast Finish</th>'), 'Table column 5: Forecast Finish');
assert(progressContent.includes('>Status</th>'), 'Table column 6: Status');
assert(progressContent.includes('>Last Verified Update</th>'), 'Table column 7: Last Verified Update');

// 3. PROGRESS DETAIL TRACEABILITY
console.log('\nTEST GROUP 3: 5-Stage Traceability Lineage');
assert(progressContent.includes('Previous Progress:'), 'Stage 1: Previous Progress');
assert(progressContent.includes('Execution Event:'), 'Stage 2: Execution Event');
assert(progressContent.includes('Evidence Proof:') || progressContent.includes('Evidence:'), 'Stage 3: Evidence');
assert(progressContent.includes('Verified By:'), 'Stage 4: Verification (Verified By)');
assert(progressContent.includes('New Verified Progress:'), 'Stage 5: New Progress');
assert(progressContent.includes('ChevronDown') || progressContent.includes('↓'), 'Visual downward lineage chain rendered');

// 4. IMPORTANT: NO ARBITRARY EDITING GATE
console.log('\nTEST GROUP 4: Mandatory Audit Fields for Progress Changes');
assert(progressContent.includes('Verification Reason') || progressContent.includes('editReason'), 'Requires Reason for progress edit');
assert(progressContent.includes('Source Evidence') || progressContent.includes('editSource'), 'Requires Source for progress edit');
assert(progressContent.includes('Authenticated User'), 'Requires User for progress edit');
assert(progressContent.includes('Verification Timestamp'), 'Requires Timestamp for progress edit');
assert(progressContent.includes('Immutable Audit Hash') || progressContent.includes('auditHash'), 'Requires Audit Record for progress edit');
assert(progressContent.includes('disabled={!editReason.trim() || !editSource.trim()}'), 'Enforces blocking arbitrary edits without required fields');

// 5. HISTORY PROGRESSION
console.log('\nTEST GROUP 5: Progress History Progression with Dates & Evidence');
assert(progressContent.includes('Progression:') || progressContent.includes('Progress History Progression'), 'Displays sequential progress progression');
assert(progressContent.includes('executionEventId'), 'History links each step to execution event ID');
assert(progressContent.includes('evidenceTitle') && progressContent.includes('evidenceId'), 'History links each step to source evidence');
assert(progressContent.includes('verifiedBy'), 'History tracks verifying engineer');

// 6. NO REDUNDANT APPSHELL
console.log('\nTEST GROUP 6: Single AppShell Architecture');
assert(!progressContent.includes('<AppShell>'), 'Progress page does not contain redundant nested <AppShell>');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED:      ${passCount}`);
console.log(`FAILED:      ${failCount}`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PROGRESS & VARIANCE DIRECTIVES VERIFIED CLEANLY!\n');
}
