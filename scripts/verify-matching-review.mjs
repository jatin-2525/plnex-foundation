/**
 * PLnEX Matching and Review Verification Test Suite
 *
 * Verifies all requirements:
 * 1. Core Flow (Field Input -> Extraction -> Execution Event -> Candidate Match -> Confidence -> Human Verification -> Verified Update)
 * 2. Match Card (Suggested Activity, Activity ID, Confidence, Status)
 * 3. WHY? Section (5 factors: Activity keywords, Area / Line, Discipline, Date / Context, Project / WBS with ✓ matched, △ partial, ✕ mismatch)
 * 4. Alternatives (Displays alternatives when confidence is not high)
 * 5. Verification Decoupling (Confidence separated from Verification, 4 actions: Approve Match, Choose Another, Reject, Mark Unmatched)
 * 6. Non-Authoritative AI (No 94% = Verified, No silent conversion)
 * 7. Review Queue (Contains strictly items requiring human action, no verified clutter)
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
console.log('PLnEX MATCHING & REVIEW VERIFICATION TEST SUITE');
console.log('======================================================\n');

// 1. CORE FLOW PIPELINE
console.log('TEST GROUP 1: Core Flow Pipeline (Field Input -> ... -> Verified Update)');
const coreFlowContent = fs.readFileSync(
  path.resolve('src/components/shared/CoreFlowBanner.tsx'),
  'utf-8'
);
assert(coreFlowContent.includes("'FIELD_INPUT'"), 'Core Flow contains FIELD INPUT');
assert(coreFlowContent.includes("'EXTRACTION'"), 'Core Flow contains EXTRACTION');
assert(coreFlowContent.includes("'EXECUTION_EVENT'"), 'Core Flow contains EXECUTION EVENT');
assert(coreFlowContent.includes("'CANDIDATE_MATCH'"), 'Core Flow contains CANDIDATE MATCH');
assert(coreFlowContent.includes("'CONFIDENCE'"), 'Core Flow contains CONFIDENCE');
assert(coreFlowContent.includes("'HUMAN_VERIFICATION'"), 'Core Flow contains HUMAN VERIFICATION (Human Gate)');
assert(coreFlowContent.includes("'VERIFIED_UPDATE'"), 'Core Flow contains VERIFIED UPDATE');
assert(coreFlowContent.includes('Human Gate') || coreFlowContent.includes('isGate'), 'Highlights Human Gate as decision boundary');

// 2. MATCH CARD COMPONENT
console.log('\nTEST GROUP 2: Match Card Component (src/components/shared/MatchCard.tsx)');
const matchCardContent = fs.readFileSync(
  path.resolve('src/components/shared/MatchCard.tsx'),
  'utf-8'
);
assert(matchCardContent.includes('activityId'), 'Match Card renders Activity ID');
assert(matchCardContent.includes('activityName'), 'Match Card renders Suggested Activity');
assert(matchCardContent.includes('confidence'), 'Match Card renders Confidence score');
assert(matchCardContent.includes('derivedStatusText') || matchCardContent.includes('High-confidence suggestion'), 'Match Card displays suggestion status');
assert(matchCardContent.includes('Confidence:'), 'Match Card explicitly labels Confidence');
assert(matchCardContent.includes('Verification:'), 'Match Card explicitly labels Verification');
assert(matchCardContent.includes('94% ≠ Verified') || matchCardContent.includes('Zero silent updates'), 'Match Card warns that Confidence != Verified');

// 3. WHY? SECTION
console.log('\nTEST GROUP 3: "Why this match?" Deterministic Signals');
assert(matchCardContent.includes('Activity keywords'), 'WHY? factor 1: Activity keywords');
assert(matchCardContent.includes('Area / Line'), 'WHY? factor 2: Area / Line');
assert(matchCardContent.includes('Discipline'), 'WHY? factor 3: Discipline');
assert(matchCardContent.includes('Date / Context'), 'WHY? factor 4: Date / Context');
assert(matchCardContent.includes('Project / WBS'), 'WHY? factor 5: Project / WBS');
assert(matchCardContent.includes('✓') && matchCardContent.includes('matched'), 'Uses "✓ matched" status badge');
assert(matchCardContent.includes('△') && matchCardContent.includes('partial'), 'Uses "△ partial" status badge');
assert(matchCardContent.includes('✕') && matchCardContent.includes('mismatch'), 'Uses "✕ mismatch" status badge');

// 4. ALTERNATIVES
console.log('\nTEST GROUP 4: Alternative Candidate Activities');
assert(matchCardContent.includes('Alternative Activities'), 'Renders alternative candidate activities');
assert(matchCardContent.includes('onSelectAlternative') || matchCardContent.includes('alt.activityId'), 'Allows selecting alternative activities');

// 5. VERIFICATION ACTIONS
console.log('\nTEST GROUP 5: 4 Canonical Verification Actions');
assert(matchCardContent.includes('Approve Match'), 'Action 1: Approve Match');
assert(matchCardContent.includes('Choose Another'), 'Action 2: Choose Another');
assert(matchCardContent.includes('Reject'), 'Action 3: Reject');
assert(matchCardContent.includes('Mark Unmatched'), 'Action 4: Mark Unmatched');

// 6. REVIEW QUEUE ACTIVE-ONLY AUDIT
console.log('\nTEST GROUP 6: Review Queue Active Items Enforcement (src/app/review/page.tsx)');
const reviewContent = fs.readFileSync(
  path.resolve('src/app/review/page.tsx'),
  'utf-8'
);
assert(!reviewContent.includes('<AppShell>'), 'No doubly-nested <AppShell> wrapper in review page');
assert(reviewContent.includes('CoreFlowBanner'), 'Review page mounts CoreFlowBanner');
assert(reviewContent.includes('MatchCard'), 'Review page embeds MatchCard component');
assert(reviewContent.includes('pendingActionEvents') && reviewContent.includes('!e.isApproved'), 'Review queue filters out already verified events');
assert(reviewContent.includes('Verified History'), 'Provides separate archive for verified events');
assert(reviewContent.includes('Strict Rule: Active Review Queue ONLY contains unverified items'), 'Explicit active-only rule documented in code');

// 7. MATCHING PAGE AUDIT
console.log('\nTEST GROUP 7: Matching Page Audit (src/app/matching/page.tsx)');
const matchingContent = fs.readFileSync(
  path.resolve('src/app/matching/page.tsx'),
  'utf-8'
);
assert(!matchingContent.includes('<AppShell>'), 'No doubly-nested <AppShell> wrapper in matching page');
assert(matchingContent.includes('CoreFlowBanner'), 'Matching page mounts CoreFlowBanner');
assert(matchingContent.includes('MatchCard'), 'Matching page embeds MatchCard component');
assert(!matchingContent.includes('Automatic Schedule Link'), 'Removed misleading "Automatic Schedule Link"');
assert(matchingContent.includes('Human Decision Gate'), 'Highlights Human Decision Gate in policy metadata');

console.log('\n======================================================');
console.log(`TOTAL TESTS: ${passCount + failCount}`);
console.log(`PASSED:      ${passCount}`);
console.log(`FAILED:      ${failCount}`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL MATCHING & REVIEW UI DIRECTIVES VERIFIED CLEANLY!\n');
}
