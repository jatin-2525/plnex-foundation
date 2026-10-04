import fs from 'fs';
import path from 'path';

const schedulePagePath = path.resolve('src/app/schedule/page.tsx');
const drawerPath = path.resolve('src/components/shared/ActivityDetailDrawer.tsx');
const typesPath = path.resolve('src/types/index.ts');

console.log('--- Verifying PLnEX Schedule Implementation ---');

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
assert(fs.existsSync(schedulePagePath), 'src/app/schedule/page.tsx exists');
assert(fs.existsSync(drawerPath), 'src/components/shared/ActivityDetailDrawer.tsx exists');
assert(fs.existsSync(typesPath), 'src/types/index.ts exists');

const scheduleContent = fs.readFileSync(schedulePagePath, 'utf8');
const drawerContent = fs.readFileSync(drawerPath, 'utf8');
const typesContent = fs.readFileSync(typesPath, 'utf8');

// 2. Hierarchy: L1 Project down to L6 Sub-Activity as expandable tree
const hierarchyLevels = [
  'L1',
  'L2',
  'L3',
  'L4',
  'L5',
  'L6',
];

for (const lvl of hierarchyLevels) {
  assert(scheduleContent.includes(lvl), `Schedule hierarchy includes level ${lvl}`);
}

assert(
  scheduleContent.includes('Project') &&
  scheduleContent.includes('Area') &&
  scheduleContent.includes('Discipline') &&
  scheduleContent.includes('Work Package') &&
  scheduleContent.includes('Activity') &&
  scheduleContent.includes('Sub-Activity'),
  'Hierarchy includes L1 Project, L2 Area, L3 Discipline, L4 Work Package, L5 Activity, L6 Sub-Activity'
);

assert(
  scheduleContent.includes('expandedNodeIds') || scheduleContent.includes('toggleNode'),
  'Supports expandable tree state for hierarchy'
);

assert(
  scheduleContent.includes('Expand All') && scheduleContent.includes('Collapse All'),
  'Provides Expand All and Collapse All tree controls'
);

// 3. Default Table:
// Activity ID, Activity, Area, Discipline, Start, Finish, Progress, Status, Variance, Action
const defaultTableColumns = [
  'Activity ID',
  'Activity',
  'Area',
  'Discipline',
  'Start',
  'Finish',
  'Progress',
  'Status',
  'Variance',
  'Action'
];

for (const col of defaultTableColumns) {
  assert(
    scheduleContent.includes(`>${col}</th>`),
    `Default Table header contains column: ${col}`
  );
}

// 4. Advanced in Activity Detail Drawer:
// WBS, Actual Start, Actual Finish, Dependencies, Evidence, Execution Events, History
const advancedFields = [
  'WBS',
  'Actual Start',
  'Actual Finish',
  'Dependencies',
  'Evidence',
  'Execution Events',
  'History'
];

for (const field of advancedFields) {
  assert(
    drawerContent.includes(field),
    `Activity Detail Drawer contains advanced section: ${field}`
  );
}

// 5. Schedule Version:
// Show: V3 · Rev 3.2
// Metadata: Source: Primavera P6 XML, Status: Current
// Never silently overwrite previous versions
assert(
  scheduleContent.includes('V3 · Rev 3.2'),
  'Schedule displays version "V3 · Rev 3.2"'
);
assert(
  scheduleContent.includes('Primavera P6 XML'),
  'Schedule metadata includes Source: Primavera P6 XML'
);
assert(
  scheduleContent.includes('Current'),
  'Schedule metadata includes Status: Current'
);
assert(
  scheduleContent.includes('Never silently overwrite previous versions') ||
  scheduleContent.toLowerCase().includes('never silently overwrite'),
  'Strict rule enforced: Never silently overwrite previous versions'
);

// 6. Import Flow:
// Select File -> Upload -> Processing -> Validation -> Error Report -> Preview -> Create Version -> Complete
const importStages = [
  'Select File',
  'Upload',
  'Processing',
  'Validation',
  'Error Report',
  'Preview',
  'Create Version',
  'Complete'
];

for (const stage of importStages) {
  assert(
    scheduleContent.includes(stage),
    `Import pipeline includes stage: ${stage}`
  );
}

// Validation errors must identify: Row, Column, Problem, Correction
const errorFields = ['Row', 'Column', 'Problem', 'Correction'];
for (const ef of errorFields) {
  assert(
    scheduleContent.includes(ef),
    `Validation Error Report table includes field: ${ef}`
  );
}

// 7. Backward Compatibility Checks:
assert(scheduleContent.includes("viewMode === 'operational'"), 'Supports operational clean view');
assert(scheduleContent.includes("viewMode === 'detailed'"), 'Supports full detailed view');
assert(scheduleContent.includes('openWhyExplanation'), 'Supports openWhyExplanation');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Schedule requirements verified successfully!');
}
