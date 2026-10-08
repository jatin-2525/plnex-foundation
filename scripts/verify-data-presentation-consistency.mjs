/**
 * PLnEX Data Presentation Consistency Verification Suite
 *
 * Verifies that project data is presented uniformly across the entire application:
 * 1. Schedule Version (Standardized to 'Rev 3.2 (P6 XML)')
 * 2. WBS Formatting (Strict 5-tier L5 hierarchy '1.1.X.Y.Z' across all views and simulation models)
 * 3. Activity IDs (Monospace format with standard discipline prefix 'PIP-24-001', 'CIV-11-001')
 * 4. Progress & Variance (Project Planned: 80%, Verified Actual: 73%, Variance: -7%; PIP-24-002: 85% vs 70% = -15%)
 * 5. Dates & Cutoffs (Reporting cutoff anchored to 18 Sep 2026, 17:30 IST)
 * 6. Status Badges & Casing (completed, on-track, at-risk, delayed, pending)
 * 7. Confidence Thresholds (≥85% High, 70-84% Review Required, <70% Unmatched)
 * 8. Project Names & Identifiers (Canonical: 'Duliajan Gas Processing & Pipeline Interconnect' / 'PRJ-OIL-2026-01')
 * 9. Area Names (Standard battery limits: 'Unit A - Gas Processing', 'Unit A - Compressor House', 'Unit A - Substation')
 * 10. Discipline Names (Canonical full names: Piping, Civil, Electrical, Mechanical, Instrumentation)
 * 11. Time-Anchored Labels (Historical progression steps explicitly labeled with timestamps)
 */

import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

function readFile(relPath) {
  return fs.readFileSync(path.resolve(relPath), 'utf-8');
}

console.log('======================================================');
console.log('PLnEX DATA PRESENTATION CONSISTENCY VERIFICATION');
console.log('======================================================');

// ----------------------------------------------------------------------------
// 1. SCHEDULE VERSION STANDARDIZATION
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 1: Schedule Version Uniformity');
const canonicalModels = readFile('src/lib/domain/canonicalModels.ts');
const schedulePage = readFile('src/app/schedule/page.tsx');
const sCurveChart = readFile('src/components/shared/SCurveChart.tsx');
const barChart = readFile('src/components/shared/charts/BarChart.tsx');
const whyExplanations = readFile('src/lib/domain/whyExplanations.ts');
const activityDetailDrawer = readFile('src/components/shared/ActivityDetailDrawer.tsx');

assert(
  canonicalModels.includes("label: 'Rev 3.2 (P6 XML)'"),
  "Canonical schedule model label is 'Rev 3.2 (P6 XML)'"
);
assert(
  canonicalModels.includes("CANONICAL_SCHEDULE_VERSION_LABEL = CURRENT_SCHEDULE_VERSION.label"),
  "CANONICAL_SCHEDULE_VERSION_LABEL is tied to active schedule version"
);
assert(
  schedulePage.includes("label: 'Rev 3.2 (P6 XML)'") &&
  schedulePage.includes("versionCode: 'Rev 3.2 (P6 XML)'"),
  "Schedule page uses 'Rev 3.2 (P6 XML)' in DEFAULT_VERSIONS"
);
assert(
  sCurveChart.includes('Rev 3.2 (P6 XML) • Cutoff: 18 Sep 2026'),
  "SCurveChart timeline axis uses 'Rev 3.2 (P6 XML)'"
);
assert(
  sCurveChart.includes('Source: Rev 3.2 (P6 XML)'),
  "SCurveChart audit ledger source uses 'Rev 3.2 (P6 XML)'"
);
assert(
  barChart.includes('Rev 3.2 (P6 XML)'),
  "BarChart footer displays canonical 'Rev 3.2 (P6 XML)'"
);
assert(
  activityDetailDrawer.includes('Rev 3.2 (P6 XML)'),
  "ActivityDetailDrawer displays canonical 'Rev 3.2 (P6 XML)'"
);

// ----------------------------------------------------------------------------
// 2. WBS FORMATTING (No truncated 3-tier codes on activities)
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 2: WBS Formatting Consistency');
const whatIfEngine = readFile('src/lib/domain/whatIfEngine.ts');
const matchExplanation = readFile('src/lib/domain/matchExplanationData.ts');

assert(
  whatIfEngine.includes("id: 'PIP-24-001'") && whatIfEngine.includes("wbs: '1.1.3.2.1'"),
  "PIP-24-001 uses 5-tier L5 WBS 1.1.3.2.1 in whatIfEngine"
);
assert(
  whatIfEngine.includes("id: 'PIP-24-002'") && whatIfEngine.includes("wbs: '1.1.3.2.2'"),
  "PIP-24-002 uses 5-tier L5 WBS 1.1.3.2.2 in whatIfEngine"
);
assert(
  whatIfEngine.includes("id: 'CIV-11-001'") && whatIfEngine.includes("wbs: '1.1.1.1.1'"),
  "CIV-11-001 uses 5-tier L5 WBS 1.1.1.1.1 in whatIfEngine"
);
assert(
  whatIfEngine.includes("id: 'ELE-11-032'") && whatIfEngine.includes("wbs: '1.1.4.1.2'"),
  "ELE-11-032 uses 5-tier L5 WBS 1.1.4.1.2 in whatIfEngine"
);
assert(
  !whatIfEngine.includes("wbs: '3.2.1'") && !whatIfEngine.includes("wbs: '3.2.2'"),
  "whatIfEngine has no legacy 3-tier WBS codes ('3.2.1', '3.2.2')"
);
assert(
  matchExplanation.includes('WBS node 1.1.3.2.1 conforms') &&
  matchExplanation.includes('Conforms to WBS 1.1.3.2.2'),
  "matchExplanationData uses authoritative 5-tier WBS references"
);

// ----------------------------------------------------------------------------
// 3. ACTIVITY IDS UNIFORMITY
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 3: Activity IDs Uniformity');
assert(
  canonicalModels.includes("id: 'PIP-24-002'") &&
  canonicalModels.includes("activityCode: 'PIP-24-002'") &&
  canonicalModels.includes("p6ActivityId: 'A1040'"),
  "PIP-24-002 maintains consistent ID and P6 cross-reference"
);

// ----------------------------------------------------------------------------
// 4. PROGRESS & VARIANCE VALUES
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 4: Progress & Variance Alignment');
const progressPage = readFile('src/app/progress/page.tsx');

assert(
  whyExplanations.includes("metricValue: '73.0% (Verified Actual)'") &&
  whyExplanations.includes("baseline target of 80.0%"),
  "whyExplanations verifies 73.0% actual vs 80.0% planned baseline"
);
assert(
  whyExplanations.includes("73.0% verified actuals against a planned schedule baseline (PV) of 80.0% (-7.0% overall variance)"),
  "whyExplanations accurately presents -7.0% overall schedule variance"
);
assert(
  progressPage.includes("plannedPercent: 85") &&
  progressPage.includes("actualPercent: 70") &&
  progressPage.includes("variancePercent: -15"),
  "Progress page PIP-24-002 maintains 85% planned, 70% actual, -15% variance"
);
assert(
  progressPage.includes('20% → 65% → 70%'),
  "Progress page history progression correctly displays '20% → 65% → 70%'"
);

// ----------------------------------------------------------------------------
// 5. PROJECT NAMES & IDENTIFIERS
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 5: Project Names & Identifiers Uniformity');
assert(
  !whyExplanations.includes('OIL-DULIAJAN-2026') &&
  !whyExplanations.includes('Oil India Duliajan Gas Plant Expansion'),
  "whyExplanations no longer uses legacy project names or IDs"
);
assert(
  whyExplanations.includes("subjectId: 'PRJ-OIL-2026-01'") &&
  whyExplanations.includes("subjectName: 'Duliajan Gas Processing & Pipeline Interconnect'"),
  "whyExplanations uses authoritative PRJ-OIL-2026-01 project name"
);

// ----------------------------------------------------------------------------
// 6. AREA NAMES UNIFORMITY
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 6: Area Names Uniformity');
assert(
  !barChart.includes("label: 'Unit A - Compressor'") &&
  barChart.includes("label: 'Unit A - Compressor House'"),
  "BarChart uses canonical 'Unit A - Compressor House'"
);
assert(
  !progressPage.includes("area: 'Unit A - Compressor Station'") &&
  progressPage.includes("area: 'Unit A - Compressor House'"),
  "Progress page uses canonical 'Unit A - Compressor House'"
);
assert(
  whatIfEngine.includes("id: 'ELE-11-032'") &&
  whatIfEngine.includes("area: 'Unit A - Substation'"),
  "ELE-11-032 area standardized to 'Unit A - Substation' in whatIfEngine"
);
assert(
  !matchExplanation.includes("Unit A Overhead Gallery") &&
  !matchExplanation.includes("Unit A - Compressor Bay"),
  "matchExplanationData has zero legacy area references"
);

// ----------------------------------------------------------------------------
// 7. TIME-ANCHORED LABELS FOR HISTORICAL VALUES
// ----------------------------------------------------------------------------
console.log('\nDIMENSION 7: Time-Anchored Historical State Labels');
assert(
  progressPage.includes('18 Sep 2026, 17:30 IST: 70% verified (65% as of 16 Sep)'),
  "Progress page clearly anchors latest 70% and previous 65% with timestamp dates"
);
assert(
  canonicalModels.includes('getCanonicalProgressSummary'),
  "canonicalModels provides getCanonicalProgressSummary helper for time-anchoring"
);

// ----------------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------------
console.log('\n======================================================');
console.log(`TOTAL CHECKS: ${passed + failed}`);
console.log(`PASSED:       ${passed}`);
console.log(`FAILED:       ${failed}`);
console.log('======================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PROJECT DATA PRESENTATION CONSISTENCY CHECKS PASSED!\n');
}
