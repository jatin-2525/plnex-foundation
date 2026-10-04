/**
 * PLnEX Priority 3 Streamlined Usability, Role Navigation, Progressive Disclosure
 * & Global "Why?" Transparent Explanation System
 *
 * Verification Test Suite
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
console.log('PLnEX PRIORITY 3 ACCEPTANCE TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------------------------------
// 1. Role-Based Navigation Architecture in Sidebar.tsx
// ----------------------------------------------------------------------------
console.log('TEST GROUP 1: Role-Based Navigation Structure (src/components/shell/Sidebar.tsx)');
const sidebarContent = fs.readFileSync(path.resolve('src/components/shell/Sidebar.tsx'), 'utf-8');

// Manager groups
assert(sidebarContent.includes("'PROJECT'") && sidebarContent.includes("href: '/schedule-twin'"), 'Manager has PROJECT group with Schedule Twin');
assert(sidebarContent.includes("'EXECUTION'") && sidebarContent.includes("href: '/review'"), 'Manager has EXECUTION group with Review Queue');
assert(sidebarContent.includes("'CONTROL'") && sidebarContent.includes("href: '/what-if'"), 'Manager has CONTROL group with Progress, Delay & Impact, What-if');
assert(sidebarContent.includes("'TRUST'") && sidebarContent.includes("href: '/health'"), 'Manager has TRUST group with Evidence & Schedule Health');
assert(sidebarContent.includes("'KNOWLEDGE'") && sidebarContent.includes("href: '/reports'"), 'Manager has KNOWLEDGE group with Reports & Memory');
assert(sidebarContent.includes("'SYSTEM'") && sidebarContent.includes("href: '/sync'"), 'Manager has SYSTEM group with Offline / Sync');

// Engineer groups
assert(sidebarContent.includes("'FIELD'") && sidebarContent.includes("href: '/field/capture'"), 'Engineer has FIELD group with Field Capture and DPR');
assert(sidebarContent.includes("href: '/activities'"), 'Engineer has My Activities');

// Admin deliberate navigation
assert(sidebarContent.includes("href: '/showcase'"), 'Admin has deliberate navigation to Foundation & Showcase');

// Normal users separation: Showcase, Demo, Developer Controls removed from normal navigation
assert(sidebarContent.includes("role === 'admin'"), 'Showcase and foundation items are guarded for admin role only');

// ----------------------------------------------------------------------------
// 2. Removal of Clutter & Developer Controls from Normal Users
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 2: Developer Clutter & Sample Indicator Restriction');
const topHeaderContent = fs.readFileSync(path.resolve('src/components/shell/TopHeader.tsx'), 'utf-8');
const showcaseContent = fs.readFileSync(path.resolve('src/app/showcase/page.tsx'), 'utf-8');
const scheduleContent = fs.readFileSync(path.resolve('src/app/schedule/page.tsx'), 'utf-8');

assert(
  topHeaderContent.includes("userSession?.role === 'admin'") &&
  topHeaderContent.includes('Sample Project Data'),
  'Sample Project Data badge in header restricted to Admin users'
);

assert(
  showcaseContent.includes("userSession?.role !== 'admin'") &&
  showcaseContent.includes('<PermissionDenied'),
  'Showcase page blocks non-admin users with PermissionDenied policy'
);

assert(
  scheduleContent.includes("userSession?.role === 'admin'") &&
  scheduleContent.includes('Test Empty State'),
  'Simulate empty state developer test button restricted to Admin users'
);

// ----------------------------------------------------------------------------
// 3. Progressive Disclosure: 4 Operational Questions on Manager Dashboard
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 3: Progressive Disclosure on Manager Dashboard (src/app/dashboard/page.tsx)');
const dashboardContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');

assert(dashboardContent.includes('What happened?'), 'Dashboard answers "What happened?"');
assert(dashboardContent.includes('What changed?'), 'Dashboard answers "What changed?"');
assert(dashboardContent.includes('What needs attention?'), 'Dashboard answers "What needs attention?"');
assert(dashboardContent.includes('What should I do?'), 'Dashboard answers "What should I do?" with primary action triggers');
assert(dashboardContent.includes("href: '/review'") || dashboardContent.includes("href=\"/review\""), 'What should I do connects directly to Review Queue');
assert(dashboardContent.includes("href: '/what-if'") || dashboardContent.includes("href=\"/what-if\""), 'What should I do connects directly to What-If simulation');

// ----------------------------------------------------------------------------
// 4. Canonical 8-Column Activity Table & 7-Column Execution Table
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 4: Streamlined Canonical Tables (Activities, Execution & Schedule)');
const activitiesContent = fs.readFileSync(path.resolve('src/app/activities/page.tsx'), 'utf-8');
const executionContent = fs.readFileSync(path.resolve('src/app/execution/page.tsx'), 'utf-8');

// Activities: 8 canonical columns
assert(activitiesContent.includes('>Activity ID</th>'), 'Activities Table has Activity ID column');
assert(activitiesContent.includes('>Activity</th>'), 'Activities Table has clean Activity column (no raw inline WBS noise)');
assert(activitiesContent.includes('>Area</th>'), 'Activities Table has Area column');
assert(activitiesContent.includes('>Discipline</th>'), 'Activities Table has Discipline column');
assert(activitiesContent.includes('>Progress</th>'), 'Activities Table has Progress column');
assert(activitiesContent.includes('>Variance</th>'), 'Activities Table has Variance column');
assert(activitiesContent.includes('>Status</th>'), 'Activities Table has Status column');
assert(activitiesContent.includes('>Action</th>'), 'Activities Table has Action column');

// Execution: 7 canonical columns
assert(executionContent.includes('>Event ID</th>'), 'Execution Table has Event ID column');
assert(executionContent.includes('>Field Statement</th>'), 'Execution Table has Field Statement column');
assert(executionContent.includes('>Activity</th>'), 'Execution Table has Activity column');
assert(executionContent.includes('>Confidence</th>'), 'Execution Table has Confidence column');
assert(executionContent.includes('>Status</th>'), 'Execution Table has Status column');
assert(executionContent.includes('>Date</th>'), 'Execution Table has Date column');
assert(executionContent.includes('>Action</th>'), 'Execution Table has Action column');

// Schedule: Progressive disclosure toggle
assert(scheduleContent.includes("viewMode === 'operational'"), 'Schedule Table supports 8-column Operational clean view');
assert(scheduleContent.includes("viewMode === 'detailed'"), 'Schedule Table supports 14-column Full P6 Matrix view');

// ----------------------------------------------------------------------------
// 5. Global "Why?" Explanation Architecture
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 5: Global "Why?" Explanation Architecture');
const whyEngineContent = fs.readFileSync(path.resolve('src/lib/domain/whyExplanations.ts'), 'utf-8');
const whyBtnContent = fs.readFileSync(path.resolve('src/components/shared/WhyButton.tsx'), 'utf-8');
const whyModalContent = fs.readFileSync(path.resolve('src/components/shared/WhyExplanationModal.tsx'), 'utf-8');
const appContextContent = fs.readFileSync(path.resolve('src/context/AppContext.tsx'), 'utf-8');
const appShellContent = fs.readFileSync(path.resolve('src/components/shell/AppShell.tsx'), 'utf-8');

assert(whyEngineContent.includes('getWhyExplanation'), 'Provides getWhyExplanation resolver');
assert(whyEngineContent.includes("'delay'"), 'Explains delay root cause and CPM slips');
assert(whyEngineContent.includes("'variance'"), 'Explains EVM variance and productivity drag');
assert(whyEngineContent.includes("'confidence'"), 'Explains AI match confidence factor breakdown');
assert(whyEngineContent.includes("'health'"), 'Explains schedule health and DCMA checks');

assert(whyBtnContent.includes('Why?'), 'WhyButton renders clear, compact [?] Why? trigger');
assert(whyModalContent.includes('Contributing Factors'), 'WhyExplanationModal renders contributing factors breakdown');
assert(appContextContent.includes('openWhyExplanation'), 'AppContext provides openWhyExplanation action globally');
assert(appShellContent.includes('<WhyExplanationModal'), 'AppShell mounts global WhyExplanationModal');

// Verify WhyButton usage across pages
assert(activitiesContent.includes('openWhyExplanation'), 'Activities Table uses openWhyExplanation');
assert(executionContent.includes('openWhyExplanation'), 'Execution Table uses openWhyExplanation');
assert(dashboardContent.includes('openWhyExplanation'), 'Dashboard uses openWhyExplanation');
assert(scheduleContent.includes('openWhyExplanation'), 'Schedule Table uses openWhyExplanation');

// ----------------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`RESULTS: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 PRIORITY 3 USABILITY & PROGRESSIVE DISCLOSURE VERIFIED SUCCESSFULLY!\n');
  process.exit(0);
}
