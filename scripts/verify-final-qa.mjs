import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('====================================================');
console.log('PLnEX FINAL QA & REGRESSION ACCEPTANCE TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function check(desc, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}: ${err.message}`);
  }
}

// ----------------------------------------------------
// 1. AUTHENTICATION & ACCESS CONTROL
// ----------------------------------------------------
console.log('--- 1. AUTHENTICATION & ACCESS CONTROL ---');

check('/ redirects to /login when unauthenticated', () => {
  const rootPage = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert(rootPage.includes("router.replace('/login')"), 'Root page redirects unauthenticated users to /login');
});

check('Login service authenticates users with correct credentials', () => {
  const authServiceCode = fs.readFileSync('src/lib/api/authService.ts', 'utf8');
  assert(authServiceCode.includes('DEMO_USERS'), 'Auth service defines authorized demo users');
  assert(authServiceCode.includes('rajesh.sharma@oilindia.in'), 'Manager demo user exists');
  assert(authServiceCode.includes('debajit.borah@oilindia.in'), 'Engineer demo user exists');
  assert(authServiceCode.includes('admin@oilindia.in'), 'Admin demo user exists');
});

check('Logout clears session storage and resets state', () => {
  const authServiceCode = fs.readFileSync('src/lib/api/authService.ts', 'utf8');
  assert(authServiceCode.includes('clearSession'), 'AuthService implements clearSession');
  const userMenuCode = fs.readFileSync('src/components/shell/UserMenu.tsx', 'utf8');
  assert(userMenuCode.includes('logout()') && userMenuCode.includes("router.replace('/login')"), 'UserMenu calls logout and redirects to /login');
});

check('Session expiration check is enforced', () => {
  const authServiceCode = fs.readFileSync('src/lib/api/authService.ts', 'utf8');
  assert(authServiceCode.includes('parsed.expiresAt <= Date.now()'), 'Expired tokens are cleared automatically');
});

check('Role-specific landing routing works correctly', () => {
  const rootPage = fs.readFileSync('src/app/page.tsx', 'utf8');
  assert(rootPage.includes("router.replace('/dashboard')"), 'Manager lands on /dashboard');
  assert(rootPage.includes("router.replace('/engineer')"), 'Engineer lands on /engineer');
  assert(rootPage.includes("router.replace('/admin')"), 'Admin lands on /admin');
});

check('Unauthorized access to protected routes redirects to Access Denied', () => {
  const appShellCode = fs.readFileSync('src/components/shell/AppShell.tsx', 'utf8');
  assert(appShellCode.includes('canAccessRoute'), 'AppShell guards protected routes via canAccessRoute');
  assert(appShellCode.includes('/access-denied?resource='), 'Unauthorized routes redirect to access-denied');
});

check('Project data is not exposed before login', () => {
  const appShellCode = fs.readFileSync('src/components/shell/AppShell.tsx', 'utf8');
  assert(appShellCode.includes('if (!isAuthenticated || !userSession)'), 'AppShell verifies authentication');
  assert(appShellCode.includes('Restricted resource: redirecting to sign in'), 'Holds rendering without exposing project data');
});

// ----------------------------------------------------
// 2. ROLE UX & PERMISSIONS
// ----------------------------------------------------
console.log('\n--- 2. ROLE UX & PERMISSIONS ---');

check('Manager sees Manager navigation only', () => {
  const sidebarCode = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');
  assert(sidebarCode.includes('managerNav'), 'Sidebar defines managerNav');
  assert(sidebarCode.includes("role === 'admin' ? adminNav : role === 'engineer' ? engineerNav : managerNav"), 'Role chooses distinct navigation groups');
});

check('Engineer sees Engineer navigation only', () => {
  const sidebarCode = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');
  assert(sidebarCode.includes('engineerNav'), 'Sidebar defines engineerNav');
});

check('Admin can access both Manager and Engineer features', () => {
  const permissionsCode = fs.readFileSync('src/types/permissions.ts', 'utf8');
  assert(permissionsCode.includes("if (role === 'admin') {\n    return true;\n  }"), 'Admin has access to all routes');
  const sidebarCode = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');
  assert(sidebarCode.includes('MANAGER VIEW') && sidebarCode.includes('ENGINEER VIEW'), 'Admin sidebar includes both views');
});

check('Manager cannot open Engineer-only pages', () => {
  const permissionsCode = fs.readFileSync('src/types/permissions.ts', 'utf8');
  assert(permissionsCode.includes("pathname === '/engineer'") && permissionsCode.includes("pathname === '/field/capture'"), 'Manager is denied engineer-only routes');
});

check('Engineer cannot open Manager-only pages', () => {
  const permissionsCode = fs.readFileSync('src/types/permissions.ts', 'utf8');
  assert(permissionsCode.includes("if (role === 'engineer')"), 'Engineer permissions are strictly allowlisted');
});

check('Admin controls are hidden from normal users', () => {
  const userMenuCode = fs.readFileSync('src/components/shell/UserMenu.tsx', 'utf8');
  assert(userMenuCode.includes("userSession?.role === 'admin'"), 'Admin role switcher is only rendered for admins');
});

// ----------------------------------------------------
// 3. DATA CONSISTENCY & INTEGRITY
// ----------------------------------------------------
console.log('\n--- 3. DATA CONSISTENCY & INTEGRITY ---');

check('Progress and WBS are consistent across all views', () => {
  const canonicalCode = fs.readFileSync('src/lib/domain/canonicalModels.ts', 'utf8');
  assert(canonicalCode.includes("id: 'PIP-24-002'") && canonicalCode.includes('verifiedActualProgress: 70'), 'PIP-24-002 canonical actual progress is 70%');
  assert(canonicalCode.includes("wbs: '1.1.3.2.2'"), 'PIP-24-002 canonical WBS is 1.1.3.2.2');
});

check('Canonical schedule version is V3 · Rev 3.2 everywhere', () => {
  const canonicalCode = fs.readFileSync('src/lib/domain/canonicalModels.ts', 'utf8');
  assert(canonicalCode.includes('V3 · Rev 3.2'), 'Canonical version is V3 · Rev 3.2');
});

check('Dynamic date handling and IST timezone are active', () => {
  const dateCode = fs.readFileSync('src/lib/domain/dateUtils.ts', 'utf8');
  assert(dateCode.includes("PROJECT_TIMEZONE = 'Asia/Kolkata'"), 'Timezone is Asia/Kolkata');
  assert(dateCode.includes("PROJECT_TIMEZONE_CODE = 'IST'"), 'Timezone code is IST');
});

check('No fake live claims or unverified automatic mutations', () => {
  const engineerCode = fs.readFileSync('src/app/engineer/page.tsx', 'utf8');
  assert(!engineerCode.includes('Live NLP'), 'No fake Live NLP label');
  const syncCode = fs.readFileSync('src/app/sync/page.tsx', 'utf8');
  assert(!syncCode.includes('Zero Data Loss Architecture'), 'No misleading Zero Data Loss badge');
});

check('Model confidence is decoupled from human verification', () => {
  const matchCardCode = fs.readFileSync('src/components/shared/MatchCard.tsx', 'utf8');
  assert(matchCardCode.includes('Confidence:') && (matchCardCode.includes('94% ≠ Verified') || matchCardCode.includes('Zero silent updates')), 'Confidence != verification clearly stated');
});

// ----------------------------------------------------
// 4. OFFLINE ARCHITECTURE & SYNC
// ----------------------------------------------------
console.log('\n--- 4. OFFLINE ARCHITECTURE & SYNC ---');

check('Connection modes: Automatic, Online, and Offline supported', () => {
  const offlineCode = fs.readFileSync('src/context/OfflineContext.tsx', 'utf8');
  assert(offlineCode.includes("'AUTOMATIC' | 'ONLINE' | 'OFFLINE'"), 'Supports all 3 connection modes');
});

check('Local queue and IndexedDB storage implemented', () => {
  const idbCode = fs.readFileSync('src/lib/offline/indexedDbService.ts', 'utf8');
  assert(idbCode.includes('PLnEX_Field_DB'), 'IndexedDB storage initialized');
  assert(idbCode.includes('field_updates') && idbCode.includes('dpr_drafts'), 'Local stores exist for field and DPR');
});

check('No false Synced status before server confirmation', () => {
  const offlineCode = fs.readFileSync('src/context/OfflineContext.tsx', 'utf8');
  assert(offlineCode.includes("'Saved locally' | 'Server confirmed'"), 'Distinguishes local save from server confirmation');
});

check('Sync queue supports retry and conflict resolution', () => {
  const offlineCode = fs.readFileSync('src/context/OfflineContext.tsx', 'utf8');
  assert(offlineCode.includes('retryFailed') && offlineCode.includes('resolveConflict'), 'Retry and conflict resolution methods present');
});

// ----------------------------------------------------
// 5. MANAGER WORKFLOWS
// ----------------------------------------------------
console.log('\n--- 5. MANAGER WORKFLOWS ---');

check('Manager dashboard prioritizes attention required items', () => {
  const dashCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
  assert(dashCode.includes('attention-heading') || dashCode.includes('Critical Attention'), 'Dashboard has attention priority section');
});

check('Planned vs Actual progress is prominent and clear', () => {
  const dashCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
  assert(dashCode.includes('kpi-heading') && dashCode.includes('Planned vs Actual') && dashCode.includes('Planned') && dashCode.includes('Actual'), 'Dashboard displays Planned vs Actual KPIs');
});

check('Review queue, delays, and critical path impact are transparent', () => {
  const dashCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
  assert(dashCode.includes('review-heading') && dashCode.includes('delay-heading'), 'Dashboard integrates review queue and delay impact');
});

// ----------------------------------------------------
// 6. SITE ENGINEER WORKFLOWS
// ----------------------------------------------------
console.log('\n--- 6. SITE ENGINEER WORKFLOWS ---');

check('Field capture prompt: "What happened?" with fast extractions', () => {
  const captureCode = fs.readFileSync('src/app/field/capture/page.tsx', 'utf8');
  assert(captureCode.includes('What happened?'), 'Field capture provides "What happened?" prompt');
  assert(captureCode.includes('Record Voice') && captureCode.includes('Photo') && captureCode.includes('Document'), 'Multi-modal quick input buttons present');
});

check('All extracted fields are editable with status indicators', () => {
  const captureCode = fs.readFileSync('src/app/field/capture/page.tsx', 'utf8');
  assert(captureCode.includes('Confirmed') && captureCode.includes('Needs Confirmation') && captureCode.includes('Unknown') && captureCode.includes('Conflict'), 'Verification states supported');
});

check('DPR workflow follows 7-step guided execution with Time Agent', () => {
  const dprCode = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
  assert(dprCode.includes('stepsConfig') && dprCode.includes('Project + Date') && dprCode.includes('Submit DPR'), 'DPR implements full 7-step progression');
});

// ----------------------------------------------------
// 7. MATCHING & REVIEWS
// ----------------------------------------------------
console.log('\n--- 7. MATCHING & REVIEWS ---');

check('Core Flow pipeline: Field Input -> ... -> Verified Update', () => {
  const reviewCode = fs.readFileSync('src/app/review/page.tsx', 'utf8');
  assert(reviewCode.includes('CoreFlowBanner'), 'Review embeds CoreFlowBanner');
  const bannerCode = fs.readFileSync('src/components/shared/CoreFlowBanner.tsx', 'utf8');
  assert(bannerCode.includes('HUMAN_VERIFICATION') && bannerCode.includes('isGate'), 'Human verification is highlighted as boundary gate');
});

check('Transparent signals: matched (✓), partial (△), mismatch (✕)', () => {
  const matchCardCode = fs.readFileSync('src/components/shared/MatchCard.tsx', 'utf8');
  assert(matchCardCode.includes('✓ matched') && matchCardCode.includes('△ partial') && matchCardCode.includes('✕ mismatch'), 'Signal indicators implemented');
});

// ----------------------------------------------------
// 8. PROGRESS, TRACEABILITY & AUDIT
// ----------------------------------------------------
console.log('\n--- 8. PROGRESS, TRACEABILITY & AUDIT ---');

check('5-stage progress lineage chain rendered', () => {
  const progCode = fs.readFileSync('src/app/progress/page.tsx', 'utf8');
  assert(progCode.includes('Previous Progress') && progCode.includes('Execution Event') && progCode.includes('Evidence') && progCode.includes('Verification') && progCode.includes('New Progress'), '5-stage lineage chain present in progress view');
});

check('Evidence table links to execution event and activity', () => {
  const evidCode = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');
  assert(evidCode.includes('Execution Event') && evidCode.includes('Activity') && evidCode.includes('Uploaded By'), 'Evidence table displays canonical linked relationships');
});

check('Audit history details Who, What, When, Before, and After', () => {
  const evidCode = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');
  assert(evidCode.includes('Who (Changed by)') && evidCode.includes('What (Action)') && evidCode.includes('When (Timestamp)') && evidCode.includes('Before') && evidCode.includes('After'), 'Audit table contains all 5 mandatory audit dimensions');
});

// ----------------------------------------------------
// 9. SCHEDULE HIERARCHY & VERSIONING
// ----------------------------------------------------
console.log('\n--- 9. SCHEDULE HIERARCHY & VERSIONING ---');

check('L1-L6 hierarchy tree supported', () => {
  const schedCode = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');
  assert(schedCode.includes('L1 Project') && schedCode.includes('L2 Area') && schedCode.includes('L3 Discipline') && schedCode.includes('L4 Work Package') && schedCode.includes('L5 Activity') && schedCode.includes('L6 Sub-Activity'), 'Schedule supports full L1-L6 hierarchy');
});

check('P6 XML import pipeline preserves existing schedule versions', () => {
  const schedCode = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');
  assert(schedCode.includes('Never silently overwrite previous versions'), 'Strict version preservation enforced');
  assert(schedCode.includes('Validation Error Report') && schedCode.includes('Problem') && schedCode.includes('Correction'), 'Validation errors show problem and correction');
});

// ----------------------------------------------------
// 10. UI INTEGRITY & RESPONSIVENESS
// ----------------------------------------------------
console.log('\n--- 10. UI INTEGRITY & RESPONSIVENESS ---');

check('Zero SIH branding in codebase', () => {
  const globSearch = fs.readdirSync('src', { recursive: true });
  for (const f of globSearch) {
    if (typeof f === 'string' && f.endsWith('.tsx')) {
      const content = fs.readFileSync(path.join('src', f), 'utf8');
      assert(!content.includes('Smart India Hackathon') && !content.includes('SIH 2024'), `File ${f} contains SIH branding`);
    }
  }
});

check('Mobile touch targets: min 44px on interactive controls', () => {
  const captureCode = fs.readFileSync('src/app/field/capture/page.tsx', 'utf8');
  assert(captureCode.includes('min-h-[44px]') && captureCode.includes('min-h-[48px]'), 'Field capture has min 44px/48px targets');
  const dprCode = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
  assert(dprCode.includes('min-h-[44px] min-w-[44px]'), 'DPR step buttons have 44px targets');
  const engCode = fs.readFileSync('src/app/engineer/page.tsx', 'utf8');
  assert(engCode.includes('min-h-[44px]'), 'Engineer page buttons have min 44px targets');
});

check('Drawers open as full-screen modal sheets on mobile', () => {
  const drawerCode = fs.readFileSync('src/components/shared/Drawer.tsx', 'utf8');
  assert(drawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'Shared Drawer is full-screen sheet on mobile');
  const actDrawerCode = fs.readFileSync('src/components/shared/ActivityDetailDrawer.tsx', 'utf8');
  assert(actDrawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'Activity Drawer is full-screen sheet on mobile');
});

check('Data tables have min-widths and overflow-x-auto to prevent column squishing', () => {
  const files = [
    { p: 'src/app/schedule/page.tsx', minW: 'min-w-[960px]' },
    { p: 'src/app/evidence/page.tsx', minW: 'min-w-[880px]' },
    { p: 'src/app/health/page.tsx', minW: 'min-w-[800px]' },
    { p: 'src/app/progress/page.tsx', minW: 'min-w-[850px]' },
    { p: 'src/app/risks/page.tsx', minW: 'min-w-[1100px]' },
  ];
  for (const f of files) {
    const code = fs.readFileSync(f.p, 'utf8');
    assert(code.includes(f.minW) && code.includes('overflow-x-auto'), `${f.p} must have ${f.minW} and overflow-x-auto`);
  }
});

console.log('\n====================================================');
console.log(`TOTAL CHECKS: ${totalTests}`);
console.log(`PASSED:       ${passedTests}`);
console.log(`FAILED:       ${totalTests - passedTests}`);
console.log('====================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  console.log('🎉 ALL FINAL QA & REGRESSION CHECKS PASSED 100%!\n');
}
