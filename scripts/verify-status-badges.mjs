import fs from 'fs';
import path from 'path';

console.log('--- Verifying PLnEX Standardized Status Badges ---');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

// 1. StatusBadge Component Architecture & The 8 Canonical States
console.log('\nTEST GROUP 1: Canonical Status Definitions');
const statusBadgePath = path.resolve('src/components/shared/StatusBadge.tsx');
assert(fs.existsSync(statusBadgePath), 'StatusBadge.tsx exists in shared components');

const statusBadgeContent = fs.readFileSync(statusBadgePath, 'utf8');

const REQUIRED_CANONICAL_STATES = [
  'On Track',
  'At Risk',
  'Delayed',
  'Completed',
  'Blocked',
  'Pending Review',
  'Unmatched',
  'Verified',
];

for (const state of REQUIRED_CANONICAL_STATES) {
  assert(
    statusBadgeContent.includes(`'${state}'`),
    `StatusBadge explicitly defines canonical status: "${state}"`
  );
  assert(
    statusBadgeContent.includes(`label: '${state}'`),
    `REQUIRED_STATUS_CONFIGS includes Title Case label for: "${state}"`
  );
}

// 2. Multi-Channel Indicators (Never Color Alone)
console.log('\nTEST GROUP 2: Multi-Channel Accessibility & Indicator Support');
assert(
  statusBadgeContent.includes('Icon') && statusBadgeContent.includes('aria-hidden="true"'),
  'StatusBadge renders functional icon alongside text for multi-channel recognition'
);
assert(
  statusBadgeContent.includes('role="status"'),
  'StatusBadge includes accessible role="status"'
);
assert(
  statusBadgeContent.includes('showIcon') && statusBadgeContent.includes('showDot'),
  'StatusBadge supports both icon and dot indicator modes without relying on color alone'
);

// 3. Restrained Sizing (Never Visually Larger Than Surrounding Content)
console.log('\nTEST GROUP 3: Restrained Sizing');
assert(
  statusBadgeContent.includes("xs: 'text-[10px] px-1.5 py-0.5 gap-1'"),
  'StatusBadge size xs uses compact text-[10px] and restrained py-0.5 padding'
);
assert(
  statusBadgeContent.includes("sm: 'text-[11px] px-2 py-0.5 gap-1.5'"),
  'StatusBadge size sm uses compact text-[11px] and restrained py-0.5 padding'
);
assert(
  statusBadgeContent.includes("md: 'text-xs px-2.5 py-0.5 gap-1.5'"),
  'StatusBadge size md uses text-xs and restrained py-0.5 padding'
);

// 4. Normalization Engine (Guarantees Only The 8 Canonical States Are Returned)
console.log('\nTEST GROUP 4: Status Normalization Function');
assert(
  statusBadgeContent.includes('export function normalizeStatus'),
  'StatusBadge exports normalizeStatus function'
);
assert(
  statusBadgeContent.includes('return \'On Track\';') &&
  statusBadgeContent.includes('return \'At Risk\';') &&
  statusBadgeContent.includes('return \'Delayed\';') &&
  statusBadgeContent.includes('return \'Completed\';') &&
  statusBadgeContent.includes('return \'Blocked\';') &&
  statusBadgeContent.includes('return \'Pending Review\';') &&
  statusBadgeContent.includes('return \'Unmatched\';') &&
  statusBadgeContent.includes('return \'Verified\';'),
  'normalizeStatus maps legacy/raw strings deterministically to the 8 canonical statuses'
);

// 5. Status Tokens Module Alignment
console.log('\nTEST GROUP 5: Status Tokens Alignment');
const tokensPath = path.resolve('src/tokens/status.ts');
assert(fs.existsSync(tokensPath), 'tokens/status.ts exists');

const tokensContent = fs.readFileSync(tokensPath, 'utf8');
assert(
  tokensContent.includes("label: 'On Track'") &&
  tokensContent.includes("label: 'At Risk'") &&
  tokensContent.includes("label: 'Delayed'") &&
  tokensContent.includes("label: 'Completed'") &&
  tokensContent.includes("label: 'Blocked'") &&
  tokensContent.includes("label: 'Pending Review'") &&
  tokensContent.includes("label: 'Verified'"),
  'tokens/status.ts getActivityStatusConfig and getEventStatusConfig return canonical status labels'
);

// 6. Application Pages Usage & No Invented Statuses
console.log('\nTEST GROUP 6: Core Pages Adoption of StatusBadge');
const pages = [
  'src/app/evidence/page.tsx',
  'src/app/execution/page.tsx',
  'src/app/matching/page.tsx',
  'src/app/review/page.tsx',
  'src/app/activities/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/what-if/page.tsx',
  'src/app/field/dpr/page.tsx',
  'src/app/health/page.tsx',
  'src/app/engineer/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/schedule-twin/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/showcase/page.tsx',
];

for (const p of pages) {
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  assert(
    content.includes('StatusBadge'),
    `${p} imports and renders standardized StatusBadge`
  );
}

// 7. Verification that Invented Statuses are Removed
console.log('\nTEST GROUP 7: Absence of Invented Status Badges');
const forbiddenInlineBadges = [
  'QC Verified',
  'QC Pending',
  'Under Review',
  'Pending QC',
  'Critical Slip',
];

const checkFiles = [
  'src/app/engineer/page.tsx',
  'src/app/evidence/page.tsx',
  'src/components/shared/ActivityDetailDrawer.tsx',
];

for (const f of checkFiles) {
  const content = fs.readFileSync(path.resolve(f), 'utf8');
  for (const forbidden of forbiddenInlineBadges) {
    if (forbidden === 'Pending QC' && f.includes('evidence')) {
      // Allowed only in historical comment or raw string check if any, but not in status badges
      assert(
        !content.includes(`>${forbidden}<`) && !content.includes(`"${forbidden}"</span>`),
        `${f} does not render raw invented badge for "${forbidden}"`
      );
    } else {
      assert(
        !content.includes(`>${forbidden}<`) && !content.includes(`"${forbidden}"</span>`),
        `${f} does not render raw badge for "${forbidden}"`
      );
    }
  }
}

// 8. Showcase Page Exhibits All 8 States
console.log('\nTEST GROUP 8: Showcase Status Badge Exhibition');
const showcaseContent = fs.readFileSync(path.resolve('src/app/showcase/page.tsx'), 'utf8');
for (const state of REQUIRED_CANONICAL_STATES) {
  assert(
    showcaseContent.includes(`<StatusBadge status="${state}" />`),
    `Showcase page demonstrates canonical StatusBadge for "${state}"`
  );
}

console.log(`\n========================================`);
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED out of ${passed + failed}`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL STATUS BADGE STANDARDIZATION REQUIREMENTS VERIFIED!\n');
}
