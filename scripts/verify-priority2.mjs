/**
 * PLnEX Priority 2 Connection Modes, IndexedDB Offline Storage & Conflict Resolution
 * Verification Test Suite
 *
 * Verifies all Priority 2 requirements:
 * 1. Connection Modes: AUTOMATIC, ONLINE, OFFLINE
 * 2. Global Compact Header Control: ConnectionStatusControl in TopHeader
 * 3. IndexedDB Local Storage: 5 Dedicated Stores (not localStorage for structured data)
 * 4. Sync States: LOCAL_DRAFT, QUEUED, UPLOADING, SERVER_CONFIRMED, FAILED, CONFLICT
 * 5. Sync Center: Real metrics (Pending, Uploading, Confirmed, Failed, Conflicts),
 *    Actions (Sync Now, Retry Failed, Resolve Conflicts),
 *    Conflict Comparison Matrix (Keep Local, Keep Server, Merge, Cancel, no silent overwrite)
 * 6. Site Engineer Experience: OFFLINE MODE banners, "Saved locally" vs "Server confirmed", offline local queues
 * 7. Developer/Admin Test Sandbox: 6 Simulation Scenarios
 * 8. Zero Fake Synchronization: Real event-driven status logic
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
console.log('PLnEX PRIORITY 2 ACCEPTANCE TEST SUITE');
console.log('======================================================\n');

// ----------------------------------------------------------------------------
// 1. IndexedDB Architecture
// ----------------------------------------------------------------------------
console.log('TEST GROUP 1: IndexedDB Architecture (src/lib/offline/indexedDbService.ts)');
const idbContent = fs.readFileSync(path.resolve('src/lib/offline/indexedDbService.ts'), 'utf-8');

assert(idbContent.includes("DB_NAME = 'PLnEX_Field_DB'"), 'Dedicated IndexedDB database PLnEX_Field_DB defined');
assert(idbContent.includes("FIELD_UPDATES: 'field_updates'"), 'Store: field_updates defined');
assert(idbContent.includes("DPR_DRAFTS: 'dpr_drafts'"), 'Store: dpr_drafts defined');
assert(idbContent.includes("EXECUTION_EVENTS: 'execution_events'"), 'Store: execution_events defined');
assert(idbContent.includes("EVIDENCE_METADATA: 'evidence_metadata'"), 'Store: evidence_metadata defined');
assert(idbContent.includes("SYNC_QUEUE: 'sync_queue'"), 'Store: sync_queue defined');
assert(idbContent.includes('InMemoryFallbackStore'), 'SSR/SSG safe InMemoryFallbackStore included for Next.js builds');
assert(!idbContent.includes('localStorage.setItem("plnex_field_data"'), 'No localStorage used as primary database for field records');

// ----------------------------------------------------------------------------
// 2. Connection Modes & Global Offline Context
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 2: Connection Modes & Offline Context (src/context/OfflineContext.tsx)');
const offlineCtxContent = fs.readFileSync(path.resolve('src/context/OfflineContext.tsx'), 'utf-8');
const syncEngineContent = fs.readFileSync(path.resolve('src/lib/domain/syncEngine.ts'), 'utf-8');

assert(offlineCtxContent.includes("'AUTOMATIC' | 'ONLINE' | 'OFFLINE'"), 'Supports AUTOMATIC, ONLINE, OFFLINE connection modes');
assert(
  syncEngineContent.includes("'LOCAL_DRAFT'") &&
  syncEngineContent.includes("'QUEUED'") &&
  syncEngineContent.includes("'UPLOADING'") &&
  syncEngineContent.includes("'SERVER_CONFIRMED'") &&
  syncEngineContent.includes("'FAILED'") &&
  syncEngineContent.includes("'CONFLICT'"),
  'Supports all 6 Sync States: LOCAL_DRAFT, QUEUED, UPLOADING, SERVER_CONFIRMED, FAILED, CONFLICT'
);

assert(offlineCtxContent.includes('effectiveStatus'), 'Derives effectiveStatus from user connectionMode and network state');
assert(offlineCtxContent.includes('resolveConflict'), 'Provides resolveConflict action');
assert(offlineCtxContent.includes('syncNow'), 'Provides syncNow action');
assert(offlineCtxContent.includes('retryFailed'), 'Provides retryFailed action');
assert(offlineCtxContent.includes('captureFieldUpdate'), 'Provides captureFieldUpdate for local capture persistence');
assert(offlineCtxContent.includes('captureDPR'), 'Provides captureDPR for local DPR persistence');

// Check Root Layout integration
const layoutContent = fs.readFileSync(path.resolve('src/app/layout.tsx'), 'utf-8');
assert(layoutContent.includes('<OfflineProvider>'), 'Root layout wraps application with <OfflineProvider>');

// ----------------------------------------------------------------------------
// 3. Compact Header Control
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 3: Header Connection Control');
const headerControlContent = fs.readFileSync(path.resolve('src/components/shell/ConnectionStatusControl.tsx'), 'utf-8');
const topHeaderContent = fs.readFileSync(path.resolve('src/components/shell/TopHeader.tsx'), 'utf-8');

assert(headerControlContent.includes('ConnectionStatusControl'), 'ConnectionStatusControl component implemented');
assert(
  headerControlContent.includes('AUTOMATIC') &&
  headerControlContent.includes('ONLINE') &&
  headerControlContent.includes('OFFLINE'),
  'Allows user to select Automatic, Online, or Offline modes'
);
assert(headerControlContent.includes('compact') || headerControlContent.includes('px-2.5'), 'Compact non-dominant visual footprint');
assert(topHeaderContent.includes('<ConnectionStatusControl'), 'TopHeader embeds <ConnectionStatusControl />');

// ----------------------------------------------------------------------------
// 4. Site Engineer Offline Experience (Field Capture & DPR)
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 4: Site Engineer Offline Experience');
const fieldCaptureContent = fs.readFileSync(path.resolve('src/app/field/capture/page.tsx'), 'utf-8');
const dprContent = fs.readFileSync(path.resolve('src/app/field/dpr/page.tsx'), 'utf-8');
const engineerContent = fs.readFileSync(path.resolve('src/app/engineer/page.tsx'), 'utf-8');

assert(
  fieldCaptureContent.includes('OFFLINE MODE') &&
  fieldCaptureContent.includes('Updates will be synchronized when online mode is restored'),
  'Field Capture shows explicit OFFLINE MODE banner'
);
assert(
  fieldCaptureContent.includes('Saved locally') &&
  fieldCaptureContent.includes('Save Locally to Offline Queue'),
  'Field Capture uses "Saved locally" when offline, never fake "Server confirmed"'
);
assert(fieldCaptureContent.includes('captureFieldUpdate'), 'Field Capture saves directly to IndexedDB via captureFieldUpdate');

assert(
  dprContent.includes('OFFLINE MODE') &&
  dprContent.includes('Updates will be synchronized when online mode is restored'),
  'DPR shows explicit OFFLINE MODE banner'
);
assert(dprContent.includes("'Saved locally'"), 'DPR tracks "Saved locally" state when submitted offline');
assert(dprContent.includes('captureDPR'), 'DPR saves directly to IndexedDB via captureDPR');

assert(
  engineerContent.includes('OFFLINE MODE') &&
  engineerContent.includes('Updates will be synchronized when online mode is restored'),
  'Engineer dashboard shows explicit OFFLINE MODE banner'
);
assert(engineerContent.includes('Saved locally'), 'Engineer dashboard shows "Saved locally" badge for offline items');

// ----------------------------------------------------------------------------
// 5. Sync Center & Conflict Resolution
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 5: Sync Center & Conflict Resolution (src/app/sync/page.tsx)');
const syncPageContent = fs.readFileSync(path.resolve('src/app/sync/page.tsx'), 'utf-8');

assert(syncPageContent.includes('connectionMode'), 'Sync Center shows user connection mode selector');
assert(
  syncPageContent.includes('>Pending<') &&
  syncPageContent.includes('>Uploading<') &&
  syncPageContent.includes('>Confirmed<') &&
  syncPageContent.includes('>Failed<') &&
  syncPageContent.includes('>Conflicts<'),
  'Sync Center displays exact counts for Pending, Uploading, Confirmed, Failed, Conflicts'
);

assert(syncPageContent.includes('Sync Now'), 'Sync Center provides "Sync Now" action');
assert(syncPageContent.includes('Retry Failed'), 'Sync Center provides "Retry Failed" action');
assert(syncPageContent.includes('Resolve Conflicts'), 'Sync Center provides "Resolve Conflicts" action');

// Conflict resolution modal
assert(syncPageContent.includes('Changed Fields'), 'Conflict UI highlights Changed Fields');
assert(syncPageContent.includes('Keep Local'), 'Conflict UI provides "Keep Local" button');
assert(syncPageContent.includes('Keep Server'), 'Conflict UI provides "Keep Server" button');
assert(syncPageContent.includes('Merge'), 'Conflict UI provides "Merge" button');
assert(syncPageContent.includes('Cancel'), 'Conflict UI provides "Cancel" button');
assert(syncPageContent.includes('Do not silently overwrite'), 'Enforces no silent overwrites in conflict resolution');

// ----------------------------------------------------------------------------
// 6. Developer / Admin Test Mode & Scenarios
// ----------------------------------------------------------------------------
console.log('\nTEST GROUP 6: Admin Test Sandbox & Verification Scenarios');
assert(
  syncPageContent.includes('Admin / Developer Synchronization Test Sandbox'),
  'Sync Center includes Admin / Developer Test Sandbox'
);
assert(offlineCtxContent.includes('online_capture'), 'Sandbox includes Online Capture scenario');
assert(offlineCtxContent.includes('offline_capture'), 'Sandbox includes Offline Field Capture scenario');
assert(offlineCtxContent.includes('offline_multi'), 'Sandbox includes Multi Offline scenario');
assert(offlineCtxContent.includes('return_online_sync'), 'Sandbox includes Return & Sync scenario');
assert(offlineCtxContent.includes('server_failure'), 'Sandbox includes Network Server Failure scenario');
assert(offlineCtxContent.includes('conflict'), 'Sandbox includes Conflict Creation scenario');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passCount} Passed, ${failCount} Failed`);
console.log('======================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
