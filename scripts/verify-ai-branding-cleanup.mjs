/**
 * PLnEX AI Branding Cleanup Verification Suite
 *
 * Verifies that PLnEX feels like engineering software using intelligent processing:
 * 1. Zero occurrences of unnecessary AI marketing buzzwords:
 *    - "AI Powered"
 *    - "AI Engine"
 *    - "Gen AI"
 *    - "Smart AI"
 *    - "AI Magic"
 *    - "AI Intelligence"
 *    - "AI Match Suggestion"
 * 2. Task-oriented engineering language used in primary visual hierarchy:
 *    - "Suggested Match" instead of "AI Match Suggestion"
 *    - "Confidence" instead of "AI Confidence"
 *    - "Extracted"
 *    - "Needs Review"
 *    - "Verified"
 * 3. Zero futuristic sparkles/magic icons (Sparkles from lucide-react eliminated)
 * 4. Zero AI avatars or robot icons
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
console.log('PLnEX AI BRANDING CLEANUP VERIFICATION');
console.log('======================================================\n');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = walk('src');

// 1. Scan for forbidden marketing buzzwords
console.log('TEST GROUP 1: Marketing Buzzword Elimination');
const forbiddenPatterns = [
  /\bAI Powered\b/i,
  /\bAI Engine\b/i,
  /\bGen AI\b/i,
  /\bSmart AI\b/i,
  /\bAI Magic\b/i,
  /\bAI Intelligence\b/i,
  /\bAI Match Suggestion\b/i,
  /\bAI Confidence\b/i,
];

let buzzwordMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(line)) {
        buzzwordMatches.push(`${file}:${idx + 1}: ${line.trim()}`);
      }
    }
  });
}
assert(
  buzzwordMatches.length === 0,
  `Zero forbidden AI buzzwords found in UI components (found: ${buzzwordMatches.length})`
);

// 2. Scan for Sparkles icon
console.log('\nTEST GROUP 2: Sparkles Icon Elimination');
let sparklesMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('Sparkles')) {
    sparklesMatches.push(file);
  }
}
assert(
  sparklesMatches.length === 0,
  `Zero Sparkles icons found across codebase (found: ${sparklesMatches.length})`
);

// 3. Scan for Robot/Bot icons
console.log('\nTEST GROUP 3: Robot / Bot Avatar Elimination');
let botMatches = [];
for (const file of sourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (/\bBot\b|\bRobot\b/.test(content)) {
    // Check if it's an imported lucide icon
    if (/import.*(Bot|Robot).*from 'lucide-react'/.test(content)) {
      botMatches.push(file);
    }
  }
}
assert(
  botMatches.length === 0,
  `Zero Bot or Robot icons found in imports (found: ${botMatches.length})`
);

// 4. Verify Task-Oriented Language in MatchCard
console.log('\nTEST GROUP 4: Task-Oriented Language in MatchCard');
const matchCardContent = fs.readFileSync(path.resolve('src/components/shared/MatchCard.tsx'), 'utf8');
assert(
  matchCardContent.includes('Suggested Match'),
  'MatchCard displays task-oriented "Suggested Match"'
);
assert(
  !matchCardContent.includes('AI Match Suggestion'),
  'MatchCard does not display "AI Match Suggestion"'
);

// 5. Verify Matching Page headers
console.log('\nTEST GROUP 5: Matching Page Standards');
const matchingPageContent = fs.readFileSync(path.resolve('src/app/matching/page.tsx'), 'utf8');
assert(
  matchingPageContent.includes("header: 'Confidence'"),
  'Matching page table uses "Confidence" header'
);
assert(
  !matchingPageContent.includes("header: 'AI Confidence'"),
  'Matching page table does not use "AI Confidence" header'
);

// 6. Verify CoreFlowBanner terminology
console.log('\nTEST GROUP 6: CoreFlowBanner Terminology');
const coreFlowContent = fs.readFileSync(path.resolve('src/components/shared/CoreFlowBanner.tsx'), 'utf8');
assert(
  coreFlowContent.includes('Candidate Match ≠ Final Authority'),
  'CoreFlowBanner uses engineering boundary policy "Candidate Match ≠ Final Authority"'
);

// 7. Verify Review Page terminology
console.log('\nTEST GROUP 7: Review Page Governance Language');
const reviewPageContent = fs.readFileSync(path.resolve('src/app/review/page.tsx'), 'utf8');
assert(
  reviewPageContent.includes('Suggested candidate matches are assistive only'),
  'Review page uses "Suggested candidate matches are assistive only"'
);

console.log('\n======================================================');
console.log(`CLEANUP RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
}
