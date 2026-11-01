/**
 * PLnEX Canonical Shared Data Models & Single Source of Truth
 *
 * Provides authoritative definitions for:
 * 1. Schedule Version (Rev 3.2 (P6 XML) with traceability)
 * 2. Progress Snapshots (verifiedActualProgress with historical timestamps)
 * 3. Canonical Activities (identical ID, WBS, Progress, Start/Finish, Status across all views)
 * 4. Canonical Data States (DRAFT, PROCESSING, PENDING_REVIEW, VERIFIED, etc.)
 */

import { DisciplineType, ActivityStatus, WBSLevel } from '../../types';
import { PROJECT_REPORT_DATE, formatProjectDateTime } from './dateUtils';

// ============================================================================
// 1. CANONICAL DATA STATES
// ============================================================================
export type CanonicalDataState =
  | 'DRAFT'
  | 'PROCESSING'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'UNMATCHED'
  | 'CONFLICT'
  | 'DUPLICATE'
  | 'STALE'
  | 'FAILED'
  | 'SYNC_PENDING'
  | 'SERVER_CONFIRMED';

export interface CanonicalStateConfig {
  key: CanonicalDataState;
  label: string;
  description: string;
  badgeClass: string;
}

export const CANONICAL_STATE_CONFIGS: Record<CanonicalDataState, CanonicalStateConfig> = {
  DRAFT: {
    key: 'DRAFT',
    label: 'Draft',
    description: 'Local draft item not yet committed to sync or review queue.',
    badgeClass: 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]',
  },
  PROCESSING: {
    key: 'PROCESSING',
    label: 'Processing',
    description: 'Entity is undergoing NLP parameter extraction or WBS mapping.',
    badgeClass: 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]',
  },
  PENDING_REVIEW: {
    key: 'PENDING_REVIEW',
    label: 'Pending Review',
    description: 'Awaiting human planner or site engineer verification.',
    badgeClass: 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]',
  },
  VERIFIED: {
    key: 'VERIFIED',
    label: 'Verified',
    description: 'Confirmed against physical site evidence and approved by planner.',
    badgeClass: 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]',
  },
  UNMATCHED: {
    key: 'UNMATCHED',
    label: 'Unmatched',
    description: 'Field observation has no direct counterpart in master schedule baseline.',
    badgeClass: 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]',
  },
  CONFLICT: {
    key: 'CONFLICT',
    label: 'Conflict',
    description: 'Discrepancy detected between site update and master CPM logic or server version.',
    badgeClass: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
  },
  DUPLICATE: {
    key: 'DUPLICATE',
    label: 'Duplicate',
    description: 'Identical record already received in current reporting cycle.',
    badgeClass: 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]',
  },
  STALE: {
    key: 'STALE',
    label: 'Stale',
    description: 'Record timestamp exceeds the daily reporting SLA window.',
    badgeClass: 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]',
  },
  FAILED: {
    key: 'FAILED',
    label: 'Failed',
    description: 'Processing or transmission failed and requires correction or retry.',
    badgeClass: 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]',
  },
  SYNC_PENDING: {
    key: 'SYNC_PENDING',
    label: 'Queued (Sync Pending)',
    description: 'Buffered in local device storage; queued for transmission to central server.',
    badgeClass: 'bg-[#EDF5F8] text-[#3B6EA8] border-[#B3CBE0]',
  },
  SERVER_CONFIRMED: {
    key: 'SERVER_CONFIRMED',
    label: 'Server Confirmed',
    description: 'Successfully acknowledged by central database; not just locally queued.',
    badgeClass: 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]',
  },
};

// ============================================================================
// 2. CANONICAL SCHEDULE VERSION
// ============================================================================
export interface ScheduleVersion {
  version: string;
  revision: string;
  source: string;
  status: 'Current' | 'Baseline' | 'Superseded' | 'Draft';
  label: string; // e.g. "Rev 3.2 (P6 XML)"
  importedAt: string;
  activityCount: number;
  fileName: string;
  notes: string;
}

export const CANONICAL_SCHEDULE_VERSIONS: ScheduleVersion[] = [
  {
    version: 'V3',
    revision: '3.2',
    source: 'Primavera P6 XML',
    status: 'Current',
    label: 'Rev 3.2 (P6 XML)',
    importedAt: '2026-09-15T11:00:00+05:30',
    activityCount: 146,
    fileName: 'OIL_GAS_PROC_FACILITY_REV3.2.xer',
    notes: 'Current active working schedule baseline imported from Primavera P6 XML',
  },
  {
    version: 'V3',
    revision: '3.1',
    source: 'Primavera P6 XML',
    status: 'Superseded',
    label: 'Rev 3.1 (P6 XML)',
    importedAt: '2026-09-01T09:30:00+05:30',
    activityCount: 142,
    fileName: 'OIL_GAS_PROC_FACILITY_REV3.1.xer',
    notes: 'Superseded baseline following civil foundation re-sequencing',
  },
  {
    version: 'V2',
    revision: '2.0',
    source: 'Primavera P6 XML',
    status: 'Baseline',
    label: 'Rev 2.0 (P6 XML)',
    importedAt: '2026-08-15T14:00:00+05:30',
    activityCount: 138,
    fileName: 'OIL_GAS_PROC_FACILITY_REV2.0.xer',
    notes: 'Approved contractual baseline frozen at contract award',
  },
  {
    version: 'V1',
    revision: '1.0',
    source: 'Primavera P6 XML',
    status: 'Superseded',
    label: 'Rev 1.0 (P6 XML)',
    importedAt: '2026-07-01T10:00:00+05:30',
    activityCount: 120,
    fileName: 'OIL_GAS_PROC_FACILITY_REV1.0.xer',
    notes: 'Initial tender baseline version',
  },
];

export const CURRENT_SCHEDULE_VERSION: ScheduleVersion = CANONICAL_SCHEDULE_VERSIONS[0];
export const CANONICAL_SCHEDULE_VERSION_LABEL = CURRENT_SCHEDULE_VERSION.label; // "Rev 3.2 (P6 XML)"

// ============================================================================
// 3. PROGRESS SNAPSHOT (TIME-ANCHORED PROGRESS)
// ============================================================================
export interface ProgressSnapshot {
  progress: number; // 0-100%
  asOfDate: string; // ISO 8601
  formattedAsOf: string; // e.g. "18 Sep 2026, 17:30 IST"
  deltaPercent?: number;
  recordedBy?: string;
  evidenceId?: string;
  notes?: string;
}

// ============================================================================
// 4. CANONICAL ACTIVITY MODEL (AUTHORITATIVE SINGLE SOURCE OF TRUTH)
// ============================================================================
export interface CanonicalActivity {
  id: string; // "PIP-24-002"
  activityId: string; // "PIP-24-002" (identical to id)
  projectId: string; // "PRJ-OIL-2026-01"
  name: string; // "Weld Line 24-XX Field Joints & NDT Clearance"
  activityName: string; // identical to name
  wbs: string; // "1.1.3.2.2" (authoritative unified WBS)
  wbsLevel: WBSLevel;
  activityCode: string; // "PIP-24-002"
  p6ActivityId: string; // "A1040"
  discipline: DisciplineType;
  area: string;
  line?: string;
  scheduleVersion: string; // "Rev 3.2 (P6 XML)"
  plannedStart: string; // "2026-09-16"
  plannedFinish: string; // "2026-09-20"
  actualStart?: string; // "2026-09-16"
  actualFinish?: string;
  plannedProgress: number; // 85%
  verifiedActualProgress: number; // 70% (authoritative current value)
  actualProgress: number; // 70% (alias)
  progressHistory: ProgressSnapshot[];
  variance: number; // -15%
  status: ActivityStatus;
  delayDays: number;
  unit: string;
  plannedQuantity: number;
  actualQuantity: number;
  predecessors: string[];
  successors: string[];
  isCritical: boolean;
  assignedEngineer: string;
  evidenceIds: string[];
  executionEventIds: string[];
  description: string;
  dataState: CanonicalDataState;
  lastUpdated: string;
}

export const CANONICAL_ACTIVITIES: CanonicalActivity[] = [
  {
    id: 'CIV-11-001',
    activityId: 'CIV-11-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Foundation Block A - Compressor Pedestal Pour',
    activityName: 'Foundation Block A - Compressor Pedestal Pour',
    wbs: '1.1.1.1.1',
    wbsLevel: 'L5',
    activityCode: 'CIV-11-001',
    p6ActivityId: 'A1010',
    discipline: 'Civil',
    area: 'Unit A - Compressor House',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    actualStart: '2026-09-05',
    actualFinish: '2026-09-14',
    plannedProgress: 100,
    verifiedActualProgress: 100,
    actualProgress: 100,
    progressHistory: [
      {
        progress: 100,
        asOfDate: '2026-09-14T17:30:00+05:30',
        formattedAsOf: '14 Sep 2026, 17:30 IST',
        recordedBy: 'Rajesh Das',
        notes: 'Final 45m³ concrete pour completed and slump tests verified',
      },
    ],
    plannedQuantity: 45,
    actualQuantity: 45,
    unit: 'm³',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['MEC-08-003'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001'],
    executionEventIds: ['EVT-2026-003'],
    description: 'RCC pedestal concrete pour (M35 grade) including anchor bolt cluster alignment',
    dataState: 'VERIFIED',
    lastUpdated: '2026-09-14T17:30:00+05:30',
  },
  {
    id: 'PIP-24-001',
    activityId: 'PIP-24-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    activityName: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    activityCode: 'PIP-24-001',
    p6ActivityId: 'A1030',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-17',
    plannedProgress: 100,
    verifiedActualProgress: 100,
    actualProgress: 100,
    progressHistory: [
      {
        progress: 100,
        asOfDate: '2026-09-17T17:30:00+05:30',
        formattedAsOf: '17 Sep 2026, 17:30 IST',
        recordedBy: 'Debajit Borah',
        notes: 'All 12 spools safely lifted and bolted onto pipe rack section B',
      },
    ],
    plannedQuantity: 12,
    actualQuantity: 12,
    unit: 'spools',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['PIP-24-002'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-003'],
    executionEventIds: ['EVT-2026-001'],
    description: 'Erection of prefabricated 24-inch spool pieces on piperack section B',
    dataState: 'VERIFIED',
    lastUpdated: '2026-09-17T17:30:00+05:30',
  },
  {
    id: 'PIP-24-002',
    activityId: 'PIP-24-002',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    activityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    wbsLevel: 'L5',
    activityCode: 'PIP-24-002',
    p6ActivityId: 'A1040',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-16',
    actualFinish: undefined,
    plannedProgress: 85,
    verifiedActualProgress: 70, // Authoritative verified actual progress as of 18 Sep 2026
    actualProgress: 70,
    progressHistory: [
      {
        progress: 65,
        asOfDate: '2026-09-16T17:30:00+05:30',
        formattedAsOf: '16 Sep 2026, 17:30 IST',
        deltaPercent: 65,
        recordedBy: 'Debajit Borah',
        evidenceId: 'EVD-004',
        notes: 'Initial 65% achieved; 4 welds complete on joints J-01 through J-04',
      },
      {
        progress: 70,
        asOfDate: '2026-09-18T17:30:00+05:30',
        formattedAsOf: '18 Sep 2026, 17:30 IST',
        deltaPercent: 5,
        recordedBy: 'Debajit Borah',
        evidenceId: 'EVD-004',
        notes: '70% verified; Joint J-05 welded; 8 open joints pending radiographic testing (RT)',
      },
    ],
    plannedQuantity: 12,
    actualQuantity: 8.4,
    unit: 'joints',
    variance: -15, // 70% actual - 85% planned
    status: 'delayed',
    delayDays: 2,
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-04-015'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-004'],
    executionEventIds: ['EVT-2026-002'],
    description: 'Field butt welding and 100% radiographic inspection of Line 24-XX joints',
    dataState: 'VERIFIED',
    lastUpdated: '2026-09-18T17:30:00+05:30',
  },
  {
    id: 'PIP-24-003',
    activityId: 'PIP-24-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    activityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    wbsLevel: 'L5',
    activityCode: 'PIP-24-003',
    p6ActivityId: 'A1050',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    plannedProgress: 0,
    verifiedActualProgress: 0,
    actualProgress: 0,
    progressHistory: [
      {
        progress: 0,
        asOfDate: '2026-09-18T17:30:00+05:30',
        formattedAsOf: '18 Sep 2026, 17:30 IST',
        notes: 'Pending predecessor PIP-24-002 RT clearance and high-pressure blind flange delivery',
      },
    ],
    plannedQuantity: 1,
    actualQuantity: 0,
    unit: 'test package',
    variance: 0,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002'],
    successors: ['PIP-24-004'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Hydrostatic pressure integrity validation at 1.5x design pressure',
    dataState: 'PENDING_REVIEW',
    lastUpdated: '2026-09-18T17:30:00+05:30',
  },
  {
    id: 'MEC-08-003',
    activityId: 'MEC-08-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Align Centrifugal Gas Compressor Skid A',
    activityName: 'Align Centrifugal Gas Compressor Skid A',
    wbs: '1.1.2.4.1',
    wbsLevel: 'L5',
    activityCode: 'MEC-08-003',
    p6ActivityId: 'A1020',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor House',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-22',
    actualStart: '2026-09-16',
    plannedProgress: 20,
    verifiedActualProgress: 15,
    actualProgress: 15,
    progressHistory: [
      {
        progress: 15,
        asOfDate: '2026-09-18T17:30:00+05:30',
        formattedAsOf: '18 Sep 2026, 17:30 IST',
        recordedBy: 'Debajit Borah',
        notes: 'Laser dial gauge positioning in progress; 0.15 skid package aligned',
      },
    ],
    plannedQuantity: 1,
    actualQuantity: 0.15,
    unit: 'skid package',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['CIV-11-001'],
    successors: ['ELE-11-032'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-005'],
    executionEventIds: [],
    description: 'Laser alignment of high-pressure gas compressor train drive shaft and gearbox coupling',
    dataState: 'VERIFIED',
    lastUpdated: '2026-09-18T17:30:00+05:30',
  },
  {
    id: 'ELE-11-032',
    activityId: 'ELE-11-032',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Terminate 11kV Feeder Cable to Substation A',
    activityName: 'Terminate 11kV Feeder Cable to Substation A',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    activityCode: 'ELE-11-032',
    p6ActivityId: 'A1060',
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-17',
    plannedFinish: '2026-09-24',
    actualStart: '2026-09-17',
    plannedProgress: 50,
    verifiedActualProgress: 40,
    actualProgress: 40,
    progressHistory: [
      {
        progress: 40,
        asOfDate: '2026-09-18T17:30:00+05:30',
        formattedAsOf: '18 Sep 2026, 17:30 IST',
        notes: 'Cable ladder tray installation 40% complete; awaiting photo evidence for remaining overhead bay section',
      },
    ],
    plannedQuantity: 3,
    actualQuantity: 1.2,
    unit: 'circuits',
    variance: -10,
    status: 'at-risk',
    delayDays: 1,
    predecessors: ['MEC-08-003'],
    successors: ['INS-04-015'],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Termination of 3-core 240 sq.mm XLPE cables and high-voltage pothead assembly',
    dataState: 'VERIFIED',
    lastUpdated: '2026-09-18T17:30:00+05:30',
  },
  {
    id: 'INS-04-015',
    activityId: 'INS-04-015',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Calibrate Pressure Transmitter PT-2401 & Loop Check',
    activityName: 'Calibrate Pressure Transmitter PT-2401 & Loop Check',
    wbs: '1.1.5.2.1',
    wbsLevel: 'L5',
    activityCode: 'INS-04-015',
    p6ActivityId: 'A1070',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: '2026-09-21',
    plannedFinish: '2026-09-25',
    plannedProgress: 0,
    verifiedActualProgress: 0,
    actualProgress: 0,
    progressHistory: [
      {
        progress: 0,
        asOfDate: '2026-09-18T17:30:00+05:30',
        formattedAsOf: '18 Sep 2026, 17:30 IST',
        notes: 'Predecessor PIP-24-002 field welding incomplete; transmitter calibration awaiting line clearance',
      },
    ],
    plannedQuantity: 4,
    actualQuantity: 0,
    unit: 'loops',
    variance: 0,
    status: 'pending',
    delayDays: 1,
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: [],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: '5-point bench calibration and DCS loop verification of Rosemount 3051 transmitters',
    dataState: 'PENDING_REVIEW',
    lastUpdated: '2026-09-18T17:30:00+05:30',
  },
];

/**
 * Accessor for canonical activities by ID
 */
export function getCanonicalActivity(activityId: string): CanonicalActivity | undefined {
  return CANONICAL_ACTIVITIES.find((a) => a.id === activityId || a.activityId === activityId);
}

/**
 * Get all canonical activities
 */
export function getAllCanonicalActivities(): CanonicalActivity[] {
  return [...CANONICAL_ACTIVITIES];
}

/**
 * Returns formatted historical progress display string
 * e.g. "70% as of 18 Sep 2026, 17:30 IST (65% as of 16 Sep 2026, 17:30 IST)"
 */
export function getCanonicalProgressSummary(activityId: string): string {
  const activity = getCanonicalActivity(activityId);
  if (!activity) return '0%';

  if (!activity.progressHistory || activity.progressHistory.length === 0) {
    return `${activity.verifiedActualProgress}% (Current)`;
  }

  const latest = activity.progressHistory[activity.progressHistory.length - 1];
  if (activity.progressHistory.length === 1) {
    return `${latest.progress}% as of ${latest.formattedAsOf}`;
  }

  const previous = activity.progressHistory[activity.progressHistory.length - 2];
  return `${latest.progress}% as of ${latest.formattedAsOf} (${previous.progress}% as of ${previous.formattedAsOf})`;
}
