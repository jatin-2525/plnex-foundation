import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING PLnEX TABLE AUDIT & SYSTEMATIC STANDARDS ===\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failCount++;
  }
}

// 1. DataTable.tsx
const dataTableSrc = fs.readFileSync('src/components/shared/DataTable.tsx', 'utf8');
assert(dataTableSrc.includes('sticky top-0'), 'DataTable component has sticky header');
assert(dataTableSrc.includes('text-sm'), 'DataTable component uses readable text-sm');
assert(dataTableSrc.includes('py-3') || dataTableSrc.includes('h-11') || dataTableSrc.includes('h-12'), 'DataTable rows use 40-52px row height');
assert(dataTableSrc.includes('hover:bg-'), 'DataTable rows have hover state');

// 2. Activities Table
const activitiesSrc = fs.readFileSync('src/app/activities/page.tsx', 'utf8');
assert(activitiesSrc.includes('<thead className="sticky top-0') || activitiesSrc.includes('<thead className=\\"sticky top-0'), 'Activities table has sticky header');
assert(!activitiesSrc.includes('<table className="w-full min-w-[760px] text-left text-xs'), 'Activities table uses readable text-sm instead of text-xs');
assert(activitiesSrc.includes('min-w-[760px]') && activitiesSrc.includes('overflow-x-auto'), 'Activities table has horizontal scroll with min-width');

// 3. Dashboard Table
const dashboardSrc = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
assert(dashboardSrc.includes('sticky top-0'), 'Dashboard review table has sticky header');
assert(dashboardSrc.includes('min-w-[700px]') && dashboardSrc.includes('overflow-x-auto'), 'Dashboard review table has horizontal scroll');

// 4. Engineer Table
const engineerSrc = fs.readFileSync('src/app/engineer/page.tsx', 'utf8');
assert(engineerSrc.includes('sticky top-0'), 'Engineer activities table has sticky header');
assert(!engineerSrc.includes('<table className="w-full min-w-[700px] text-left text-xs'), 'Engineer activities table uses readable text-sm instead of text-xs');

// 5. Evidence Tables
const evidenceSrc = fs.readFileSync('src/app/evidence/page.tsx', 'utf8');
assert(evidenceSrc.includes('sticky top-0'), 'Evidence tables have sticky header');
assert(evidenceSrc.includes('min-w-[880px]'), 'Evidence table enforces horizontal scroll min-width');

// 6. Execution Signals Table
const executionSrc = fs.readFileSync('src/app/execution/page.tsx', 'utf8');
assert(executionSrc.includes('sticky top-0'), 'Execution signals table has sticky header');
assert(!executionSrc.includes('<table className="w-full min-w-[850px] text-left text-xs'), 'Execution signals table uses readable text-sm');

// 7. Field DPR Tables
const dprSrc = fs.readFileSync('src/app/field/dpr/page.tsx', 'utf8');
assert(dprSrc.includes('sticky top-0'), 'DPR quantity table has sticky header');
assert(!dprSrc.includes('<table className="w-full min-w-[700px] text-left text-xs'), 'DPR table uses readable text-sm');

// 8. Health Issues Table
const healthSrc = fs.readFileSync('src/app/health/page.tsx', 'utf8');
assert(healthSrc.includes('sticky top-0'), 'Health issues table has sticky header');
assert(healthSrc.includes('min-w-[800px]'), 'Health table has horizontal scroll min-width');

// 9. Progress Tables
const progressSrc = fs.readFileSync('src/app/progress/page.tsx', 'utf8');
assert(progressSrc.includes('sticky top-0'), 'Progress activities table has sticky header');
assert(progressSrc.includes('min-w-[850px]'), 'Progress table has horizontal scroll min-width');

// 10. Projects Portfolio Table
const projectsSrc = fs.readFileSync('src/app/projects/page.tsx', 'utf8');
assert(projectsSrc.includes('sticky top-0'), 'Projects portfolio table has sticky header');
assert(!projectsSrc.includes('<table className="w-full min-w-[980px] text-left text-xs'), 'Projects table uses readable text-sm');

// 11. Risks Delay Table
const risksSrc = fs.readFileSync('src/app/risks/page.tsx', 'utf8');
assert(risksSrc.includes('sticky top-0'), 'Risks delay impact table has sticky header');
assert(risksSrc.includes('min-w-[1100px]'), 'Risks table has horizontal scroll min-width');

// 12. Schedule Tables
const scheduleSrc = fs.readFileSync('src/app/schedule/page.tsx', 'utf8');
assert(scheduleSrc.includes('sticky top-0'), 'Schedule table has sticky header');
assert(scheduleSrc.includes('min-w-[960px]'), 'Schedule operational table has min-width');

// 13. Sync Queue Table
const syncSrc = fs.readFileSync('src/app/sync/page.tsx', 'utf8');
assert(syncSrc.includes('sticky top-0'), 'Sync queue table has sticky header');
assert(syncSrc.includes('min-w-[880px]'), 'Sync queue table has horizontal scroll min-width');

// 14. What-If Comparison Tables
const whatIfSrc = fs.readFileSync('src/app/what-if/page.tsx', 'utf8');
assert(whatIfSrc.includes('sticky top-0'), 'What-If simulation table has sticky header');

// 15. SCurveChart Table
const sCurveSrc = fs.readFileSync('src/components/shared/SCurveChart.tsx', 'utf8');
assert(sCurveSrc.includes('sticky top-0'), 'SCurveChart progress ledger table has sticky header');
assert(!sCurveSrc.includes('<table className="w-full text-left text-xs'), 'SCurveChart table uses readable text-sm');

console.log(`\nResults: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('All Table Audit requirements verified successfully!\n');
  process.exit(0);
}
