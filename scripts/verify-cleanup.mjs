import fs from 'fs';
import path from 'path';

console.log('--- Verifying Final PLnEX UI/UX Cleanup ---');

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

// 1. SIDEBAR
const sidebarPath = path.resolve('src/components/shell/Sidebar.tsx');
const appShellPath = path.resolve('src/components/shell/AppShell.tsx');
assert(fs.existsSync(sidebarPath), 'Sidebar.tsx exists');
assert(fs.existsSync(appShellPath), 'AppShell.tsx exists');

const sidebarContent = fs.readFileSync(sidebarPath, 'utf8');
const appShellContent = fs.readFileSync(appShellPath, 'utf8');

assert(sidebarContent.includes("collapsed ? 'w-16' : 'w-64'"), 'Sidebar has consistent width: w-64 when expanded, w-16 when collapsed');
assert(appShellContent.includes("sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'"), 'AppShell margin matches sidebar w-64');
assert(sidebarContent.includes('managerNav') && sidebarContent.includes('engineerNav') && sidebarContent.includes('adminNav'), 'Sidebar provides role-specific navigation');
assert(sidebarContent.includes('bg-[#EDF5F8]') && sidebarContent.includes('text-[#176B87]') && sidebarContent.includes('w-1 bg-[#176B87]'), 'Sidebar has active route highlight with accent bar');

// Check no text concatenation for Review Queue badge and stacked Live for Execution Intelligence
assert(sidebarContent.includes('Review Queue') && sidebarContent.includes('ml-auto pl-3'), 'Sidebar aligns badge properly without text concatenation (Review Queue       6)');
assert(sidebarContent.includes('Execution Intelligence') && sidebarContent.includes('animate-pulse') && sidebarContent.includes('Live'), 'Sidebar displays Execution Intelligence with stacked ● Live indicator');

// 2. HEADER
const topHeaderPath = path.resolve('src/components/shell/TopHeader.tsx');
const userMenuPath = path.resolve('src/components/shell/UserMenu.tsx');
assert(fs.existsSync(topHeaderPath), 'TopHeader.tsx exists');
assert(fs.existsSync(userMenuPath), 'UserMenu.tsx exists');

const topHeaderContent = fs.readFileSync(topHeaderPath, 'utf8');
const userMenuContent = fs.readFileSync(userMenuPath, 'utf8');

assert(topHeaderContent.includes('<ProjectSelector'), 'Header displays Project');
assert(topHeaderContent.includes('<ConnectionStatusControl'), 'Header displays Connection');
assert(userMenuContent.includes('displayName'), 'Header displays User');
assert(userMenuContent.includes('displayRole'), 'Header displays Role');
assert(!topHeaderContent.includes('18 Sep 2026, 17:30 IST'), 'Header removes unexplained cutoff timestamp value');

// 3. TYPOGRAPHY
const pageHeaderPath = path.resolve('src/components/shared/PageHeader.tsx');
assert(fs.existsSync(pageHeaderPath), 'PageHeader.tsx exists');
const pageHeaderContent = fs.readFileSync(pageHeaderPath, 'utf8');

assert(pageHeaderContent.includes('text-[28px] sm:text-3xl'), 'PageHeader uses 28–32px page title');
assert(pageHeaderContent.includes('text-sm md:text-base'), 'PageHeader uses 14–16px body');
assert(pageHeaderContent.includes('text-xs md:text-[13px]'), 'PageHeader uses 12–13px metadata');

// Check major pages have 28–32px titles
const pagesToCheck = [
  'src/app/dashboard/page.tsx',
  'src/app/engineer/page.tsx',
  'src/app/schedule/page.tsx',
  'src/app/evidence/page.tsx',
  'src/app/health/page.tsx',
  'src/app/reports/page.tsx',
  'src/app/progress/page.tsx',
  'src/app/risks/page.tsx',
  'src/app/what-if/page.tsx',
  'src/app/review/page.tsx',
  'src/app/field/capture/page.tsx',
  'src/app/field/dpr/page.tsx',
];

for (const p of pagesToCheck) {
  const content = fs.readFileSync(path.resolve(p), 'utf8');
  assert(
    content.includes('text-[28px]') || content.includes('text-3xl') || content.includes('<PageHeader'),
    `${p} uses 28–32px page title`
  );
}

// 4. BUTTONS
const buttonPath = path.resolve('src/components/shared/Button.tsx');
assert(fs.existsSync(buttonPath), 'Button.tsx exists');
const buttonContent = fs.readFileSync(buttonPath, 'utf8');

assert(buttonContent.includes('primary:'), 'Button includes Primary variant');
assert(buttonContent.includes('secondary:'), 'Button includes Secondary variant');
assert(buttonContent.includes('tertiary:'), 'Button includes Tertiary variant');
assert(buttonContent.includes('danger:'), 'Button includes Danger variant');

// 5. STATUS
const statusBadgePath = path.resolve('src/components/shared/StatusBadge.tsx');
assert(fs.existsSync(statusBadgePath), 'StatusBadge.tsx exists');
const statusBadgeContent = fs.readFileSync(statusBadgePath, 'utf8');

const standardizedStatuses = [
  'Verified',
  'Pending Review',
  'Unmatched',
  'Conflict',
  'Duplicate',
  'Stale',
  'Processing',
  'Failed',
  'Offline',
  'Queued',
  'Server Confirmed',
];

for (const st of standardizedStatuses) {
  assert(statusBadgeContent.includes(`'${st}'`), `StatusBadge supports standardized status: "${st}"`);
}

const canonicalStateBadgePath = path.resolve('src/components/shared/CanonicalStateBadge.tsx');
const canonicalStateBadgeContent = fs.readFileSync(canonicalStateBadgePath, 'utf8');
assert(
  canonicalStateBadgeContent.includes('<StatusBadge'),
  'CanonicalStateBadge reuses single shared StatusBadge component'
);

// 6. EMPTY STATES
const emptyStatePath = path.resolve('src/components/shared/EmptyState.tsx');
assert(fs.existsSync(emptyStatePath), 'EmptyState.tsx exists');
const reviewPagePath = path.resolve('src/app/review/page.tsx');
const reviewPageContent = fs.readFileSync(reviewPagePath, 'utf8');

assert(reviewPageContent.includes('No review items'), 'Review page includes "No review items" empty state title');
assert(reviewPageContent.includes('Nothing requires your attention right now'), 'Review page includes "Nothing requires your attention right now" empty state description');

// 7. LOADING STATES
const loadingStatePath = path.resolve('src/components/shared/LoadingState.tsx');
assert(fs.existsSync(loadingStatePath), 'LoadingState.tsx exists');
const loadingStateContent = fs.readFileSync(loadingStatePath, 'utf8');
assert(loadingStateContent.includes('skeleton') && loadingStateContent.includes('spinner'), 'LoadingState provides skeleton and spinner states');

// 8. ERROR STATES
const errorStatePath = path.resolve('src/components/shared/ErrorState.tsx');
assert(fs.existsSync(errorStatePath), 'ErrorState.tsx exists');
const errorStateContent = fs.readFileSync(errorStatePath, 'utf8');
assert(errorStateContent.includes('Unable to load schedule.'), 'ErrorState provides clear what happened message');
assert(errorStateContent.includes('Retry'), 'ErrorState provides Retry recovery action');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('All PLnEX Final UI/UX Cleanup requirements verified successfully!');
} else {
  process.exit(1);
}
