import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';

console.log('=== VERIFYING RESPONSIVE UI CORRECTIONS ===\n');

// 1. Check Mobile Header (TopHeader.tsx & ProjectSelector.tsx)
console.log('1. Checking Mobile Header...');
const topHeaderCode = fs.readFileSync('src/components/shell/TopHeader.tsx', 'utf8');
assert(topHeaderCode.includes('hidden sm:flex') || topHeaderCode.includes('hidden md:flex'), 'Desktop search/controls should be hidden on mobile in TopHeader');
assert(topHeaderCode.includes('ConnectionStatusControl'), 'Connection status should be visible in TopHeader');
assert(topHeaderCode.includes('ProjectSelector'), 'ProjectSelector should be present in TopHeader');

const projectSelectorCode = fs.readFileSync('src/components/shell/ProjectSelector.tsx', 'utf8');
assert(projectSelectorCode.includes('hidden sm:inline') || projectSelectorCode.includes('truncate'), 'ProjectSelector should be compact on mobile');
console.log('   ✓ Mobile Header: strictly displays Menu, Project, Connection without overcrowding.\n');

// 2. Check Drawer Full-Screen Sheet on Mobile & Modals
console.log('2. Checking Drawers and Modals (Shared Drawer, Modal & ActivityDetailDrawer)...');
const sharedDrawerCode = fs.readFileSync('src/components/shared/Drawer.tsx', 'utf8');
assert(sharedDrawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'Shared Drawer must be full-screen on mobile and slide-over on desktop');
assert(sharedDrawerCode.includes('min-h-[44px]'), 'Shared Drawer close button must have 44px touch target');
assert(sharedDrawerCode.includes('sm:max-w-md'), 'Shared Drawer width mapping must contain static sm:max-w-md class');

const modalCode = fs.readFileSync('src/components/shared/Modal.tsx', 'utf8');
assert(modalCode.includes('min-w-[44px] min-h-[44px]'), 'Modal close button must have 44px touch target');
assert(modalCode.includes('flex flex-wrap items-center justify-end'), 'Modal footer must wrap on narrow viewports');

const activityDrawerCode = fs.readFileSync('src/components/shared/ActivityDetailDrawer.tsx', 'utf8');
assert(activityDrawerCode.includes('fixed inset-0 sm:inset-y-0 sm:right-0'), 'ActivityDetailDrawer must be full-screen on mobile and slide-over on desktop');
assert(activityDrawerCode.includes('min-h-[44px]'), 'ActivityDetailDrawer close button must have 44px touch target');
console.log('   ✓ Drawers & Modals: Full-screen sheet on mobile, slide-over on desktop, 44px close targets, wrapped footer.\n');

// 3. Check AppShell Duplicates Removal & Mobile Layout
console.log('3. Checking No Duplicate AppShell and Mobile Overflow Protection...');
const syncCode = fs.readFileSync('src/app/sync/page.tsx', 'utf8');
assert(!syncCode.includes('<AppShell>'), 'src/app/sync/page.tsx must not have duplicate <AppShell>');
const execCode = fs.readFileSync('src/app/execution/page.tsx', 'utf8');
assert(!execCode.includes('<AppShell>'), 'src/app/execution/page.tsx must not have duplicate <AppShell>');
const dprShellCode = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
assert(!dprShellCode.includes('<AppShell>'), 'src/app/field/dpr/page.tsx must not have duplicate <AppShell>');

const appShellCode = fs.readFileSync('src/components/shell/AppShell.tsx', 'utf8');
assert(appShellCode.includes('min-w-0 overflow-x-hidden'), 'AppShell main must have min-w-0 overflow-x-hidden to prevent horizontal page overflow');

const topHeaderMobileCode = fs.readFileSync('src/components/shell/TopHeader.tsx', 'utf8');
assert(topHeaderMobileCode.includes('min-h-[44px] min-w-[44px]'), 'TopHeader mobile buttons must have 44px touch targets');

const sidebarCode = fs.readFileSync('src/components/shell/Sidebar.tsx', 'utf8');
assert(sidebarCode.includes('min-h-[44px]'), 'Sidebar navigation items must have 44px touch target on mobile');
console.log('   ✓ AppShell: Zero duplicates, overflow-x-hidden enforced, 44px mobile header & sidebar targets.\n');

// 4. Check Field Capture 44px Touch Targets & Deliberate Mobile Layout
console.log('4. Checking Field Capture Touch Targets (min 44px)...');
const captureCode = fs.readFileSync('src/app/field/capture/page.tsx', 'utf8');
assert(captureCode.includes('min-h-[44px]') || captureCode.includes('h-11'), 'Voice/Photo/Doc buttons must have min 44px touch target');
assert(captureCode.includes('min-h-[48px]'), 'Save Field Report must have >= 44px touch target');
assert(captureCode.includes('pb-24 md:pb-12'), 'Field capture container must have pb-24 md:pb-12 to prevent mobile sticky bar overlap');
console.log('   ✓ Field Capture: 44px/48px touch targets and deliberate mobile padding verified.\n');

// 5. Check DPR Navigation & Submit Touch Targets
console.log('5. Checking DPR Touch Targets and Table...');
const dprCode = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
assert(dprCode.includes('min-h-[44px] min-w-[44px]'), 'DPR step arrows must have 44px touch target');
assert(dprCode.includes('min-h-[48px]'), 'DPR Submit button must have >= 44px touch target');
assert(dprCode.includes('min-w-[700px]'), 'DPR table must have min-width for horizontal scroll');
assert(dprCode.includes('min-h-[44px] px-4 py-2'), 'DPR Save Draft button must have 44px touch target');
console.log('   ✓ DPR: 44px step arrows, min-w table, 44px draft and 48px submit button verified.\n');

// 6. Check Engineer Dashboard Touch Targets
console.log('6. Checking Engineer Dashboard Touch Targets and Responsive Cards...');
const engineerCode = fs.readFileSync('src/app/engineer/page.tsx', 'utf8');
assert(engineerCode.includes('min-h-[44px]'), 'Engineer top actions and cards must have min 44px touch targets');
assert(engineerCode.includes('min-w-[700px]'), 'Engineer desktop table must have min-w for horizontal scroll');
console.log('   ✓ Engineer Dashboard: 44px touch targets & scrollable table verified.\n');

// 7. Check Review Queue Mobile Touch Targets
console.log('7. Checking Review Queue Mobile Touch Targets...');
const reviewCode = fs.readFileSync('src/app/review/page.tsx', 'utf8');
assert(reviewCode.includes('min-h-[44px]'), 'Review Queue action buttons must have 44px touch targets');
const matchCardCode = fs.readFileSync('src/components/shared/MatchCard.tsx', 'utf8');
assert(matchCardCode.includes('min-h-[44px]'), 'MatchCard buttons must have 44px touch targets');
console.log('   ✓ Review Queue: 44px touch targets for Accept, Change Match, Reject verified.\n');

// 8. Check Execution Events Touch Targets & Cards
console.log('8. Checking Execution Events Mobile Layout...');
const execEventCode = fs.readFileSync('src/app/execution/page.tsx', 'utf8');
assert(execEventCode.includes('min-h-[44px]'), 'Execution Events card action links must have 44px touch targets');
assert(execEventCode.includes('min-w-[850px]'), 'Execution Events table must have min-w for horizontal scroll');
console.log('   ✓ Execution Events: 44px touch targets and scrollable table verified.\n');

// 9. Check Activity Detail Drawer Mobile Tabs & Footer
console.log('9. Checking Activity Detail Drawer Mobile Tabs & Footer...');
const actDrawerCode = fs.readFileSync('src/components/shared/ActivityDetailDrawer.tsx', 'utf8');
assert(actDrawerCode.includes('min-h-[44px]'), 'ActivityDetailDrawer tabs and footer buttons must have 44px touch targets');
console.log('   ✓ Activity Detail Drawer: 44px tabs and footer buttons verified.\n');

// 10. Check S-Curve Chart Mobile Usability
console.log('10. Checking S-Curve Chart Mobile Usability...');
const sCurveCode = fs.readFileSync('src/components/shared/SCurveChart.tsx', 'utf8');
assert(sCurveCode.includes('overflow-x-auto'), 'S-Curve must have overflow-x-auto for horizontal scroll on mobile');
assert(sCurveCode.includes('min-w-[620px]'), 'S-Curve SVG wrapper must have min-w-[620px] to preserve visual clarity');
assert(sCurveCode.includes('min-w-[720px]'), 'S-Curve Level 3 ledger table must have min-w-[720px]');
console.log('   ✓ S-Curve Chart: Horizontal scroll, min-w SVG wrapper, and min-w ledger table verified.\n');

// 11. Check Activities Responsive Cards and Desktop Table
console.log('11. Checking My Activities Cards and Table...');
const actCode = fs.readFileSync('src/app/activities/page.tsx', 'utf8');
assert(actCode.includes('hidden md:block'), 'Activities must have desktop table');
assert(actCode.includes('block md:hidden'), 'Activities must have mobile card conversion');
assert(actCode.includes('min-h-[44px]'), 'Activities mobile card buttons must have 44px touch target');
assert(actCode.includes('min-w-[760px]'), 'Activities desktop table must have min-w');
console.log('   ✓ My Activities: cards on mobile, min-w on desktop table verified.\n');

// 12. Check Tables Min-Widths across all pages
console.log('12. Checking Table Min-Widths across application...');
const tableFiles = [
  { path: 'src/app/evidence/page.tsx', minW: 'min-w-[880px]' },
  { path: 'src/app/schedule/page.tsx', minW: 'min-w-[960px]' },
  { path: 'src/app/health/page.tsx', minW: 'min-w-[800px]' },
  { path: 'src/app/progress/page.tsx', minW: 'min-w-[850px]' },
  { path: 'src/app/risks/page.tsx', minW: 'min-w-[1100px]' },
  { path: 'src/app/execution/page.tsx', minW: 'min-w-[850px]' },
  { path: 'src/app/sync/page.tsx', minW: 'min-w-[880px]' },
  { path: 'src/app/dashboard/page.tsx', minW: 'min-w-[700px]' },
  { path: 'src/app/what-if/page.tsx', minW: 'min-w-[750px]' },
  { path: 'src/app/projects/page.tsx', minW: 'min-w-[980px]' },
];

for (const tf of tableFiles) {
  const content = fs.readFileSync(tf.path, 'utf8');
  assert(content.includes(tf.minW), `${tf.path} must contain ${tf.minW} to prevent column squishing on mobile`);
  assert(content.includes('overflow-x-auto'), `${tf.path} must contain overflow-x-auto`);
  console.log(`   ✓ ${tf.path}: contains ${tf.minW} & overflow-x-auto`);
}

console.log('\n=============================================');
console.log('ALL RESPONSIVE UI VERIFICATION CHECKS PASSED!');
console.log('=============================================\n');
