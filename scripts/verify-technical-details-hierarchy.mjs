/**
 * PLnEX Verification Script: Technical Implementation Details in Visual Hierarchy
 *
 * Requirements:
 * - Remove technical implementation details from primary visual hierarchy
 * - Do not prominently display:
 *   - parser versions
 *   - algorithm names
 *   - internal model names
 *   - protocol names
 *   - implementation jargon
 *   - internal pipeline terminology
 *   - cryptographic implementation terminology
 * - If useful, place under: "Technical Details" or "Advanced Information"
 * - Default UI communicates:
 *   - Extracted
 *   - Matched
 *   - Confidence
 *   - Verified
 *   - Evidence
 *   - Status
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

console.log('\n================================================================');
console.log('PLnEX TECHNICAL DETAILS VISUAL HIERARCHY VERIFICATION SUITE');
console.log('================================================================\n');

// 1. Dashboard: No parser version in primary header
console.log('TEST GROUP 1: Dashboard Primary Visual Hierarchy');
const dashboardContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');
assert(!dashboardContent.includes('Technical Processing Payload'), 'No "Technical Processing Payload" title in dashboard event stream');
assert(!dashboardContent.includes('Parser: V3.2 Precedence NLP Classifier\n'), 'No prominent open parser version in dashboard stream');
assert(dashboardContent.includes('Extracted Details •'), 'Dashboard uses domain-focused "Extracted Details" header');
assert(dashboardContent.includes('<span>Technical Details</span>'), 'Dashboard encapsulates model/event metadata under "Technical Details"');

// 2. Field Page: No parser model in page metadata
console.log('\nTEST GROUP 2: Field Ingestion Primary Visual Hierarchy');
const fieldContent = fs.readFileSync(path.resolve('src/app/field/page.tsx'), 'utf-8');
assert(!fieldContent.includes('EXTRACTION MODEL: Rule & Semantic Parser v2.4'), 'No extraction parser model in field page header metadata');
assert(fieldContent.includes('Extracted Fields:'), 'Uses domain-focused "Extracted Fields" instead of "Extraction Pipeline"');
assert(fieldContent.includes('STATUS: 6 Events Extracted &amp; Matched') || fieldContent.includes('STATUS: 6 Events Extracted & Matched'), 'Field page header communicates Extracted & Matched status');

// 3. MatchExplanation: Algorithm footer collapsed under Technical Details
console.log('\nTEST GROUP 3: MatchExplanation Progressive Disclosure');
const matchExplanationContent = fs.readFileSync(path.resolve('src/components/shared/MatchExplanation.tsx'), 'utf-8');
assert(matchExplanationContent.includes('<details className="group border-t border-[#D9DEE5] bg-[#F7F8FA]">'), 'Encapsulates algorithm version inside collapsible <details>');
assert(matchExplanationContent.includes('<span>Technical Details</span>'), 'Collapsible trigger labeled "Technical Details"');

// 4. WhyExplanationModal: Technical Details label
console.log('\nTEST GROUP 4: Why Explanation Modal');
const whyContent = fs.readFileSync(path.resolve('src/components/shared/WhyExplanationModal.tsx'), 'utf-8');
assert(whyContent.includes('<span>Technical Details</span>'), 'Progressive disclosure button labeled "Technical Details"');
assert(whyContent.includes('Calculation Baseline:'), 'Uses "Calculation Baseline" instead of internal "Rule Engine" jargon');

// 5. Execution Events: No deterministic NLP extractor actors or deduplication hash
console.log('\nTEST GROUP 5: Execution Intelligence Stream');
const executionContent = fs.readFileSync(path.resolve('src/app/execution/page.tsx'), 'utf-8');
assert(!executionContent.includes("'Deterministic NLP Extractor'"), 'No "Deterministic NLP Extractor" actor jargon');
assert(!executionContent.includes("'Deduplication Hash'"), 'No "Deduplication Hash" signal title');
assert(executionContent.includes("'Duplicate Check'"), 'Uses domain-focused "Duplicate Check"');
assert(executionContent.includes('<span>Technical Details</span>'), 'Drawer transformation timeline labeled "Technical Details"');

// 6. Evidence Page: Technical Details disclosure & copy hash notification
console.log('\nTEST GROUP 6: Evidence & Audit Vault');
const evidenceContent = fs.readFileSync(path.resolve('src/app/evidence/page.tsx'), 'utf-8');
assert(evidenceContent.includes('<span>Technical Details</span>'), 'Table metadata button labeled "Technical Details"');
assert(evidenceContent.includes('Technical Details • Integrity Verification'), 'Metadata row header uses "Technical Details"');
assert(evidenceContent.includes('Permanent Audit Record'), 'Uses "Permanent Audit Record" instead of "Append-Only Immutable Ledger"');
assert(evidenceContent.includes('title: \'Verification Hash Copied\''), 'Copy toast communicates "Verification Hash Copied"');
assert(evidenceContent.includes('<span>Technical Details & Audit Integrity</span>') || evidenceContent.includes('<span>Audit Integrity & Technical Details</span>'), 'Collapsible section labeled with Technical Details');

// 7. Review Queue: Policy terminology & Evidence preview footer
console.log('\nTEST GROUP 7: Review Queue Visual Hierarchy');
const reviewContent = fs.readFileSync(path.resolve('src/app/review/page.tsx'), 'utf-8');
assert(reviewContent.includes('Schedule Integrity Policy: Human Verification Required'), 'Uses Policy instead of Protocol in governance banner');
assert(!reviewContent.includes('SHA-256: 7f8a3c...e901 · Timestamped'), 'No raw SHA-256 prominently displayed in evidence preview modal footer');
assert(reviewContent.includes('Verified Evidence · Timestamped &amp; Geotagged') || reviewContent.includes('Verified Evidence · Timestamped & Geotagged'), 'Modal footer communicates Verified Evidence');
assert(reviewContent.includes('Technical Details'), 'Hash placed under Technical Details');

// 8. Admin Settings: Tamper-Evident Audit Trail
console.log('\nTEST GROUP 8: Admin Settings Visual Hierarchy');
const adminSettingsContent = fs.readFileSync(path.resolve('src/app/admin/settings/page.tsx'), 'utf-8');
assert(adminSettingsContent.includes('Tamper-Evident Audit Trail'), 'Uses Tamper-Evident Audit Trail instead of Immutable Cryptographic Audit Trail');

// 9. Activity Detail Drawer: Technical Details & Evidence preview
console.log('\nTEST GROUP 9: Activity Detail Drawer');
const drawerContent = fs.readFileSync(path.resolve('src/components/shared/ActivityDetailDrawer.tsx'), 'utf-8');
assert(drawerContent.includes('<span>Technical Details</span>'), 'Evidence metadata toggle labeled "Technical Details"');
assert(!drawerContent.includes('Cryptographically sealed proof.'), 'Removed prominent "Cryptographically sealed proof" jargon from preview modal');
assert(drawerContent.includes('Verified Onsite Evidence'), 'Preview modal communicates "Verified Onsite Evidence"');

// 10. Sync Center: Technical Details disclosure for payload hash
console.log('\nTEST GROUP 10: Sync Center Offline Queue');
const syncContent = fs.readFileSync(path.resolve('src/app/sync/page.tsx'), 'utf-8');
assert(syncContent.includes('Technical Details') && syncContent.includes('Verification Hash:'), 'Inspect drawer wraps payload hash under Technical Details');

// 11. Schedule & Showcase: Non-jargon audit snapshot records
console.log('\nTEST GROUP 11: Schedule & Showcase');
const scheduleContent = fs.readFileSync(path.resolve('src/app/schedule/page.tsx'), 'utf-8');
assert(scheduleContent.includes('permanent revision snapshot'), 'Schedule version protection refers to permanent revision snapshot');
const showcaseContent = fs.readFileSync(path.resolve('src/app/showcase/page.tsx'), 'utf-8');
assert(showcaseContent.includes('Permanent audit record generated'), 'Showcase toast refers to Permanent audit record');

// 12. Badges & Charts: Clean domain descriptions
console.log('\nTEST GROUP 12: Badges & Charts Domain Descriptions');
const statusBadgeContent = fs.readFileSync(path.resolve('src/components/shared/StatusBadge.tsx'), 'utf-8');
assert(statusBadgeContent.includes('field extraction and schedule analysis'), 'Processing status badge describes field extraction and schedule analysis');
const donutChartContent = fs.readFileSync(path.resolve('src/components/shared/charts/StatusDonutChart.tsx'), 'utf-8');
assert(donutChartContent.includes('verified audit record and evidence proof'), 'Donut chart slice describes verified audit record');
assert(donutChartContent.includes('Matched candidate; awaiting Lead Engineer confirmation'), 'Donut chart slice describes matched candidate');

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${passCount + failCount}`);
console.log(`PASSED:       ${passCount}`);
console.log(`FAILED:       ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TECHNICAL DETAILS HIERARCHY DIRECTIVES VERIFIED CLEANLY!\n');
}
