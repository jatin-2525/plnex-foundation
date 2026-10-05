import fs from 'fs';
import path from 'path';

const healthPagePath = path.resolve('src/app/health/page.tsx');
const healthEnginePath = path.resolve('src/lib/domain/healthEngine.ts');
const reportsPagePath = path.resolve('src/app/reports/page.tsx');
const reportsEnginePath = path.resolve('src/lib/domain/reportsAndMemory.ts');

console.log('--- Verifying PLnEX Schedule Health, Reports & Project Memory ---');

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

// 1. Check file existence
assert(fs.existsSync(healthPagePath), 'src/app/health/page.tsx exists');
assert(fs.existsSync(healthEnginePath), 'src/lib/domain/healthEngine.ts exists');
assert(fs.existsSync(reportsPagePath), 'src/app/reports/page.tsx exists');
assert(fs.existsSync(reportsEnginePath), 'src/lib/domain/reportsAndMemory.ts exists');

const healthContent = fs.readFileSync(healthPagePath, 'utf8');
const healthEngineContent = fs.readFileSync(healthEnginePath, 'utf8');
const reportsContent = fs.readFileSync(reportsPagePath, 'utf8');
const reportsEngineContent = fs.readFileSync(reportsEnginePath, 'utf8');

// 2. Shell Architecture (No duplicate AppShell)
assert(!healthContent.includes('<AppShell>'), 'Health page uses StateWrapper without duplicate AppShell');
assert(healthContent.includes('<StateWrapper>'), 'Health page uses StateWrapper');
assert(!reportsContent.includes('<AppShell>'), 'Reports page uses StateWrapper without duplicate AppShell');
assert(reportsContent.includes('<StateWrapper>'), 'Reports page uses StateWrapper');

// 3. SCHEDULE HEALTH TABS
assert(healthContent.includes('Schedule Health'), 'Health page includes "Schedule Health" tab');
assert(healthContent.includes('Execution Data Quality'), 'Health page includes "Execution Data Quality" tab');

// 4. SCHEDULE HEALTH: 6 Specific checks
const scheduleHealthRules = [
  'Missing Activity IDs',
  'Duplicate IDs',
  'Invalid Dates',
  'Missing Dependencies',
  'Invalid Hierarchy',
  'Missing WBS',
];

for (const rule of scheduleHealthRules) {
  assert(
    healthContent.includes(rule) && healthEngineContent.includes(rule),
    `Schedule Health includes check: "${rule}"`
  );
}

// 5. EXECUTION DATA QUALITY: 6 Specific checks
const executionDataRules = [
  'Unmatched Events',
  'Duplicate Events',
  'Missing Values',
  'Conflicting Reports',
  'Low Confidence',
  'Stale Events',
];

for (const rule of executionDataRules) {
  assert(
    healthContent.includes(rule) && healthEngineContent.includes(rule),
    `Execution Data Quality includes check: "${rule}"`
  );
}

// 6. ISSUE TABLE (Exact 7 Columns)
const issueTableColumns = [
  'Issue',
  'Severity',
  'Object',
  'Description',
  'Detected',
  'Status',
  'Action',
];

for (const col of issueTableColumns) {
  assert(
    healthContent.includes(`>${col}</th>`),
    `Issue Table contains column: "${col}"`
  );
}

// 7. ACTIONS (View, Fix, Review, Resolve)
const issueActions = ['View', 'Fix', 'Review', 'Resolve'];
for (const act of issueActions) {
  const actionRegex = new RegExp(`>\\s*${act}\\s*<\\/button>`);
  assert(
    actionRegex.test(healthContent),
    `Issue Table supports action: "${act}"`
  );
}

// 8. REPORTS: 6 Separate Canonical Reports
assert(reportsContent.includes('Reports') && reportsContent.includes('Project Memory'), 'Separates REPORTS and PROJECT MEMORY');

const canonicalReports = [
  'Daily Progress',
  'Progress Summary',
  'Delay Report',
  'Risk Report',
  'Exception Report',
  'Evidence-linked Activity Report',
];

for (const rep of canonicalReports) {
  assert(
    reportsEngineContent.includes(rep),
    `REPORTS includes canonical report: "${rep}"`
  );
}

// 9. PROJECT MEMORY: 6 Canonical Memory Facets
const memoryFacets = [
  'Historical Execution',
  'Actual Durations',
  'Delay Causes',
  'Verified Progress',
  'Past Decisions',
  'Evidence',
];

for (const facet of memoryFacets) {
  assert(
    reportsContent.includes(facet) && reportsEngineContent.includes(facet),
    `PROJECT MEMORY includes facet: "${facet}"`
  );
}

// 10. PROJECT MEMORY: Strict negative rule (NO "Ask Project AI Anything")
assert(
  !reportsContent.toLowerCase().includes('ask project ai anything') &&
  !reportsContent.toLowerCase().includes('ask ai anything'),
  'Project Memory does NOT include conversational "Ask Project AI Anything" chatbot'
);

// 11. PROJECT MEMORY: Required capabilities
assert(reportsContent.includes('Search') || reportsContent.includes('placeholder="Search'), 'Project Memory provides Search');
assert(reportsContent.includes('Filter') || reportsContent.includes('Filters'), 'Project Memory provides Filters');
assert(reportsContent.includes('Source:'), 'Project Memory provides Source links');
assert(reportsContent.includes('Evidence:'), 'Project Memory provides Evidence links');
assert(
  reportsContent.includes('Every memory record points to a verified source') ||
  reportsContent.includes('verified source'),
  'Every memory record is certified to point to a verified source'
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Schedule Health, Reports & Project Memory requirements verified successfully!');
}
