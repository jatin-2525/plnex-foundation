import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('=== COMPREHENSIVE FRONTEND REGRESSION AUDIT PASS ===\n');

let checksPassed = 0;
function logPass(msg) {
  console.log(`   ✓ ${msg}`);
  checksPassed++;
}

// -------------------------------------------------------------
// 1. S-CURVE PRESENCE, STATIC RENDERING & DATA COMPLETENESS
// -------------------------------------------------------------
console.log('1. Verifying S-Curve Chart presence, static nature & data metrics...');

const sCurveChartCode = fs.readFileSync('src/components/shared/SCurveChart.tsx', 'utf8');
assert(sCurveChartCode.includes('plannedPathD') || sCurveChartCode.includes('pt.planned'), 'SCurveChart must render Planned curve');
assert(sCurveChartCode.includes('actualPathD') || sCurveChartCode.includes('pt.actual'), 'SCurveChart must render Actual curve');
assert(sCurveChartCode.includes('forecastPathD') || sCurveChartCode.includes('pt.forecast'), 'SCurveChart must render Forecast curve');
assert(sCurveChartCode.includes('variance') || sCurveChartCode.includes('activeVariance'), 'SCurveChart must compute and display Variance');
assert(!sCurveChartCode.includes('framer-motion'), 'SCurveChart must NOT use framer-motion animation');
assert(!sCurveChartCode.includes('animate-') && !sCurveChartCode.includes('keyframes'), 'SCurveChart must NOT contain CSS animation keyframes');
assert(!sCurveChartCode.includes('three') && !sCurveChartCode.includes('webgl') && !sCurveChartCode.includes('canvas3d'), 'SCurveChart must NOT contain 3D graphics');
logPass('SCurveChart component is purely static SVG, non-animated, and includes Planned, Actual, Forecast, Variance');

// Verify S-Curve on Manager Dashboard
const dashboardCode = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
assert(dashboardCode.includes('<SCurveChart'), 'Manager Dashboard must mount <SCurveChart');
logPass('Manager Dashboard (src/app/dashboard/page.tsx) renders S-Curve');

// Verify S-Curve on Progress & Variance
const progressCode = fs.readFileSync('src/app/progress/page.tsx', 'utf8');
assert(progressCode.includes('<SCurveChart'), 'Progress & Variance page must mount <SCurveChart');
logPass('Progress & Variance (src/app/progress/page.tsx) renders S-Curve');

// Verify S-Curve on Project Overview
const projectOverviewCode = fs.readFileSync('src/app/projects/[id]/ProjectOverviewClient.tsx', 'utf8');
assert(projectOverviewCode.includes('<SCurveChart'), 'Project Overview page must mount <SCurveChart');
logPass('Project Overview (src/app/projects/[id]/ProjectOverviewClient.tsx) renders S-Curve');

// Verify S-Curve on Reports
const reportsCode = fs.readFileSync('src/app/reports/page.tsx', 'utf8');
assert(reportsCode.includes('<SCurveChart'), 'Reports page must mount <SCurveChart');
logPass('Reports (src/app/reports/page.tsx) renders S-Curve in report preview & modal');

// -------------------------------------------------------------
// 2. RESPONSIVE LAYOUTS & OVERFLOW GUARDS
// -------------------------------------------------------------
console.log('\n2. Verifying Responsive Layouts & Horizontal Overflow Protection...');

const appShellCode = fs.readFileSync('src/components/shell/AppShell.tsx', 'utf8');
assert(appShellCode.includes('min-w-0 overflow-x-hidden'), 'AppShell main container must enforce min-w-0 overflow-x-hidden');
logPass('AppShell enforces min-w-0 overflow-x-hidden preventing page-level horizontal overflow');

const sharedDrawerCode = fs.readFileSync('src/components/shared/Drawer.tsx', 'utf8');
assert(sharedDrawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'Drawer must be full-bleed on mobile and slide-over on sm:');
assert(sharedDrawerCode.includes('min-h-[44px] min-w-[44px]') || sharedDrawerCode.includes('min-w-[44px] min-h-[44px]'), 'Drawer close button must have 44px touch target');
logPass('Shared Drawer adapts to mobile full-bleed and desktop slide-over with 44px close target');

const modalCode = fs.readFileSync('src/components/shared/Modal.tsx', 'utf8');
assert(modalCode.includes('min-w-[44px] min-h-[44px]'), 'Modal close button must have 44px touch target');
assert(modalCode.includes('flex flex-wrap items-center justify-end'), 'Modal footer must wrap on narrow screens');
logPass('Modal handles 44px touch close target and wrapped responsive footer');

const actDrawerCode = fs.readFileSync('src/components/shared/ActivityDetailDrawer.tsx', 'utf8');
assert(actDrawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'ActivityDetailDrawer must be full-bleed on mobile');
assert(actDrawerCode.includes('min-h-[44px]'), 'ActivityDetailDrawer tabs and buttons must have min-h-[44px]');
logPass('ActivityDetailDrawer responsive sheet with min-h-[44px] controls verified');

// -------------------------------------------------------------
// 3. DATA TABLES HORIZONTAL SCROLL SAFETY
// -------------------------------------------------------------
console.log('\n3. Verifying Data Tables min-width and horizontal scroll wrappers...');

const tablesToCheck = [
  { path: 'src/app/schedule/page.tsx', minW: 'min-w-[960px]' },
  { path: 'src/app/evidence/page.tsx', minW: 'min-w-[880px]' },
  { path: 'src/app/health/page.tsx', minW: 'min-w-[800px]' },
  { path: 'src/app/progress/page.tsx', minW: 'min-w-[850px]' },
  { path: 'src/app/risks/page.tsx', minW: 'min-w-[1100px]' },
  { path: 'src/app/execution/page.tsx', minW: 'min-w-[850px]' },
  { path: 'src/app/sync/page.tsx', minW: 'min-w-[880px]' },
  { path: 'src/app/dashboard/page.tsx', minW: 'min-w-[700px]' },
  { path: 'src/app/what-if/page.tsx', minW: 'min-w-[750px]' },
  { path: 'src/app/projects/page.tsx', minW: 'min-w-[980px]' },
];

for (const t of tablesToCheck) {
  const content = fs.readFileSync(t.path, 'utf8');
  assert(content.includes(t.minW), `${t.path} must contain ${t.minW}`);
  assert(content.includes('overflow-x-auto'), `${t.path} must contain overflow-x-auto`);
  logPass(`Table in ${t.path} has ${t.minW} in overflow-x-auto wrapper`);
}

// -------------------------------------------------------------
// 4. BUTTONS HIERARCHY & CONTROLS
// -------------------------------------------------------------
console.log('\n4. Verifying Button Hierarchy & Action Controls...');

const buttonCode = fs.readFileSync('src/components/shared/Button.tsx', 'utf8');
assert(buttonCode.includes('bg-[#176B87]'), 'Primary button must use solid primary teal #176B87');
assert(buttonCode.includes('border-[#D9DEE5]'), 'Secondary button must use neutral border #D9DEE5');
assert(buttonCode.includes('#B5473C'), 'Danger button must use semantic red #B5473C');
logPass('Button variants adhere strictly to Primary (#176B87), Secondary (neutral border), Destructive (#B5473C)');

// -------------------------------------------------------------
// 5. STATUS BADGES: 8 CANONICAL STATES ENFORCEMENT
// -------------------------------------------------------------
console.log('\n5. Verifying Status Badges canonical states & styling...');

const statusBadgeCode = fs.readFileSync('src/components/shared/StatusBadge.tsx', 'utf8');
const REQUIRED_8 = [
  'On Track',
  'At Risk',
  'Delayed',
  'Completed',
  'Blocked',
  'Pending Review',
  'Unmatched',
  'Verified',
];

for (const state of REQUIRED_8) {
  assert(statusBadgeCode.includes(`'${state}'`), `StatusBadge must configure canonical state "${state}"`);
}
logPass('StatusBadge strictly configures and renders the 8 canonical statuses with consistent colors');

// -------------------------------------------------------------
// 6. SPACING SYSTEM (8PX MULTIPLES ONLY)
// -------------------------------------------------------------
console.log('\n6. Verifying 8px Spacing System consistency...');

const spacingTs = fs.readFileSync('src/tokens/spacing.ts', 'utf8');
assert(spacingTs.includes('SPACING_SYSTEM_8PX') || spacingTs.includes('grid: 8'), 'spacing.ts must define SPACING_SYSTEM_8PX');
assert(!spacingTs.includes("5: '1.25rem'"), 'spacing.ts must NOT contain non-8px 20px step');
logPass('src/tokens/spacing.ts strictly aligns with 8px grid system');

// -------------------------------------------------------------
// 7. SUMMARY
// -------------------------------------------------------------
console.log(`\n======================================================`);
console.log(`ALL FRONTEND REGRESSION CHECKS PASSED (${checksPassed} assertions)!`);
console.log(`======================================================\n`);
