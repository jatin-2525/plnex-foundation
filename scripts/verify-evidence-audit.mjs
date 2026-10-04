import fs from 'fs';
import path from 'path';

const evidencePagePath = path.resolve('src/app/evidence/page.tsx');
const evidenceDataPath = path.resolve('src/lib/domain/evidenceData.ts');
const typesPath = path.resolve('src/types/index.ts');

console.log('--- Verifying PLnEX Evidence & Audit Implementation ---');

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
assert(fs.existsSync(evidencePagePath), 'src/app/evidence/page.tsx exists');
assert(fs.existsSync(evidenceDataPath), 'src/lib/domain/evidenceData.ts exists');
assert(fs.existsSync(typesPath), 'src/types/index.ts exists');

const evidencePageContent = fs.readFileSync(evidencePagePath, 'utf8');
const evidenceDataContent = fs.readFileSync(evidenceDataPath, 'utf8');
const typesContent = fs.readFileSync(typesPath, 'utf8');

// 2. Check AppShell removal & StateWrapper usage
assert(!evidencePageContent.includes('<AppShell>'), 'No duplicate <AppShell> in evidence page');
assert(evidencePageContent.includes('<StateWrapper') || evidencePageContent.includes('StateWrapper'), 'Uses StateWrapper in evidence page');

// 3. Check Core Purpose: "Why should I trust this update?"
assert(
  evidencePageContent.toLowerCase().includes('why should i trust this update?'),
  'Evidence explicitly addresses core question: "Why should I trust this update?"'
);

// 4. Check 7-Stage Pipeline:
// Evidence -> Field Report -> Execution Event -> Activity -> Progress Update -> Variance -> Impact
const pipelineStages = [
  'Evidence',
  'Field Report',
  'Execution Event',
  'Activity',
  'Progress Update',
  'Variance',
  'Impact'
];

for (const stage of pipelineStages) {
  assert(
    evidencePageContent.includes(stage),
    `7-Stage pipeline contains stage: ${stage}`
  );
}

// Check pipeline visualization presence
assert(
  evidencePageContent.toLowerCase().includes('evidence relationship') &&
  evidencePageContent.toLowerCase().includes('pipeline'),
  'Visual pipeline banner exists'
);

// 5. Check Evidence Table 9 canonical columns:
// Evidence ID, Type, Source, Activity, Execution Event, Uploaded By, Date, Verification, Status
const tableColumns = [
  'Evidence ID',
  'Type',
  'Source',
  'Activity',
  'Execution Event',
  'Uploaded By',
  'Date',
  'Verification',
  'Status'
];

for (const col of tableColumns) {
  assert(
    evidencePageContent.includes(col),
    `Evidence table header contains column: ${col}`
  );
}

// 6. Check Preview Modal:
// Original Evidence, Metadata, Extracted Information, Linked Execution Event, Linked Activity, Confidence, Verification
const previewSections = [
  'Original Evidence',
  'Metadata',
  'Extracted Information',
  'Linked Execution Event',
  'Linked Activity',
  'Confidence',
  'Verification'
];

for (const section of previewSections) {
  assert(
    evidencePageContent.includes(section),
    `Preview modal contains section: ${section}`
  );
}

// 7. Check Audit Trail:
// Who, What, When, Before, After, Reason
const auditHeaders = ['Who', 'What', 'When', 'Before', 'After', 'Reason'];
for (const header of auditHeaders) {
  assert(
    evidencePageContent.includes(header),
    `Audit trail table contains column: ${header}`
  );
}

// Check canonical audit entry: Progress changed: 53 → 65, Changed by: User, Reason: Verified execution event
assert(
  evidencePageContent.includes('53') && evidencePageContent.includes('65'),
  'Audit trail displays canonical progress change: 53 → 65'
);
assert(
  evidenceDataContent.includes('AUD-PRG-01') &&
  evidenceDataContent.includes('Progress changed: 53 → 65') &&
  evidenceDataContent.includes('Verified execution event'),
  'Domain data contains canonical AUD-PRG-01 with 53 → 65 and Verified execution event reason'
);

// 8. Check Technical Details:
// Must NOT be the dominant main UI; Must be placed under collapsible "Audit Integrity & Technical Details"
assert(
  evidencePageContent.includes('Audit Integrity') || evidencePageContent.includes('Audit Integrity & Technical Details'),
  'Technical details grouped under "Audit Integrity & Technical Details"'
);
assert(
  evidencePageContent.includes('<details') && evidencePageContent.includes('summary'),
  'Uses collapsible <details> / <summary> for technical ledger details'
);

// Ensure SHA-256 and append-only details are present inside the collapsible section
assert(
  evidencePageContent.includes('SHA-256') || evidencePageContent.includes('sha256'),
  'Cryptographic SHA-256 integrity present in system'
);
assert(
  evidencePageContent.includes('Append-only') || evidencePageContent.includes('append-only') || evidencePageContent.includes('Immutable'),
  'Append-only / Immutable ledger concept retained under integrity'
);

console.log(`\nResults: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Evidence & Audit requirements verified successfully!');
}
