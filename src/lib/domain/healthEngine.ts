export type HealthCategory = 'Schedule Health' | 'Execution Data Quality' | 'Schedule Structure' | 'Execution Data';

// Canonical 6 Schedule Health Rules
export type ScheduleHealthRule =
  | 'Broken Hierarchy'
  | 'Invalid Dates'
  | 'Missing Dependencies'
  | 'Duplicate Activities'
  | 'WBS Issues'
  | 'Schedule Conflicts'
  // Legacy compatibility
  | 'Missing Activity IDs'
  | 'Duplicate IDs'
  | 'Invalid Hierarchy'
  | 'Missing WBS';

// Canonical 6 Execution Data Quality Rules
export type ExecutionDataQualityRule =
  | 'Missing Quantity'
  | 'Missing Unit'
  | 'Ambiguous Field Event'
  | 'Missing Evidence'
  | 'Unmatched Event'
  | 'Duplicate Event'
  // Legacy compatibility
  | 'Unmatched Events'
  | 'Duplicate Events'
  | 'Missing Values'
  | 'Conflicting Reports'
  | 'Low Confidence'
  | 'Stale Events';

export type HealthRule = ScheduleHealthRule | ExecutionDataQualityRule | string;

// Canonical 3 Severities: Healthy, Warning, Critical
export type HealthSeverity = 'Healthy' | 'Warning' | 'Critical' | 'Needs Attention';

export type IssueStatus = 'Open' | 'In Review' | 'Ignored' | 'Resolved';

export interface HealthIssue {
  id: string; // e.g. "ISS-SCH-001"
  category: 'Schedule Health' | 'Execution Data Quality';
  rule: HealthRule;
  canonicalCategory: string; // e.g. "broken hierarchy", "missing quantity"
  severity: HealthSeverity;
  objectId: string;
  objectName: string;
  objectType: 'SCHEDULE_ACTIVITY' | 'EXECUTION_EVENT' | 'WBS_NODE' | 'DEPENDENCY_LINK';
  description: string;
  impactExplanation: string;
  detectedAt: string;
  detected?: string; // alias for canonical table
  status: IssueStatus;
  suggestedAction: 'View' | 'Fix' | 'Review' | 'Resolve' | 'View Activity' | 'Fix Data' | 'Ignore with Reason';
  fixPayload?: {
    fieldToFix: string;
    currentValue: string;
    suggestedValue: string;
  };
  ignoredReason?: string;
  resolvedAt?: string;
}

export interface RuleCheckDefinition {
  rule: HealthRule;
  canonicalName: string;
  canonicalTerm: string;
  legacyRuleName: string;
  description: string;
}

export interface RuleCheckSummary {
  rule: HealthRule;
  category: 'Schedule Health' | 'Execution Data Quality';
  name: string;
  canonicalTerm: string;
  description: string;
  status: 'Healthy' | 'Warning' | 'Critical' | 'Needs Attention';
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  totalEvaluated: number;
}

// =========================================================================
// 1. SCHEDULE HEALTH CHECKS (6 Canonical Categories)
// - broken hierarchy
// - invalid dates
// - missing dependencies
// - duplicate activities
// - WBS issues
// - schedule conflicts
// =========================================================================
export const SCHEDULE_HEALTH_RULES: Array<{
  rule: ScheduleHealthRule;
  name: string;
  canonicalTerm: string;
  description: string;
}> = [
  {
    rule: 'Broken Hierarchy',
    name: 'Broken Hierarchy',
    canonicalTerm: 'broken hierarchy',
    description: 'Detects broken hierarchy, parent-child depth inconsistencies, mismatched disciplines between activity levels, or orphan nodes without proper WBS parent (Invalid Hierarchy).',
  },
  {
    rule: 'Invalid Dates',
    name: 'Invalid Dates',
    canonicalTerm: 'invalid dates',
    description: 'Flags invalid dates: finish dates earlier than start dates, negative task durations, or dates outside project lifespan (Invalid Dates).',
  },
  {
    rule: 'Missing Dependencies',
    name: 'Missing Dependencies',
    canonicalTerm: 'missing dependencies',
    description: 'Identifies missing dependencies: open-ended activities with dangling logic, zero predecessors, or missing successors (Missing Dependencies).',
  },
  {
    rule: 'Duplicate Activities',
    name: 'Duplicate Activities',
    canonicalTerm: 'duplicate activities',
    description: 'Verifies duplicate activities and Duplicate IDs colliding across schedule baseline revisions with conflicting scope or durations (Duplicate IDs).',
  },
  {
    rule: 'WBS Issues',
    name: 'WBS Issues',
    canonicalTerm: 'WBS issues',
    description: 'Surfaces WBS issues and Missing WBS assignments: activities unattached to any authorized Work Breakdown Structure node in the master schedule (Missing WBS).',
  },
  {
    rule: 'Schedule Conflicts',
    name: 'Schedule Conflicts',
    canonicalTerm: 'schedule conflicts',
    description: 'Detects schedule conflicts, constraint collisions, circular logic loops, and Missing Activity IDs in imported schedule baseline files (Missing Activity IDs).',
  },
];

// =========================================================================
// 2. EXECUTION DATA QUALITY CHECKS (6 Canonical Categories)
// - missing quantity
// - missing unit
// - ambiguous field event
// - missing evidence
// - unmatched event
// - duplicate event
// =========================================================================
export const EXECUTION_DATA_QUALITY_RULES: Array<{
  rule: ExecutionDataQualityRule;
  name: string;
  canonicalTerm: string;
  description: string;
}> = [
  {
    rule: 'Missing Quantity',
    name: 'Missing Quantity',
    canonicalTerm: 'missing quantity',
    description: 'Flags field reports with missing quantity: physical measurement or count is null or blank (Missing Values).',
  },
  {
    rule: 'Missing Unit',
    name: 'Missing Unit',
    canonicalTerm: 'missing unit',
    description: 'Flags field reports with missing unit: quantities recorded without engineering unit like m³, dia-inch, or metric ton (Missing Values).',
  },
  {
    rule: 'Ambiguous Field Event',
    name: 'Ambiguous Field Event',
    canonicalTerm: 'ambiguous field event',
    description: 'Identifies ambiguous field event descriptions with Low Confidence (<60%) or Conflicting Reports requiring human engineer disambiguation (Low Confidence, Conflicting Reports).',
  },
  {
    rule: 'Missing Evidence',
    name: 'Missing Evidence',
    canonicalTerm: 'missing evidence',
    description: 'Detects execution entries with missing evidence: daily logs or Stale Events submitted without required photographic or lab QC attachments (Stale Events).',
  },
  {
    rule: 'Unmatched Event',
    name: 'Unmatched Event',
    canonicalTerm: 'unmatched event',
    description: 'Flags unmatched event / Unmatched Events: onsite observations that cannot be correlated to any approved baseline schedule activity (Unmatched Events).',
  },
  {
    rule: 'Duplicate Event',
    name: 'Duplicate Event',
    canonicalTerm: 'duplicate event',
    description: 'Detects duplicate event / Duplicate Events: redundant mobile or chatbot captures reporting work already verified in prior submissions (Duplicate Events).',
  },
];

// Backward compatibility aliases
export const SCHEDULE_STRUCTURE_RULES = SCHEDULE_HEALTH_RULES;
export const EXECUTION_DATA_RULES = EXECUTION_DATA_QUALITY_RULES;

export const INITIAL_HEALTH_ISSUES: HealthIssue[] = [
  // =========================================================================
  // 1. SCHEDULE HEALTH ISSUES
  // - broken hierarchy
  // - invalid dates
  // - missing dependencies
  // - duplicate activities
  // - WBS issues
  // - schedule conflicts
  // =========================================================================
  {
    id: 'ISS-SCH-001',
    category: 'Schedule Health',
    rule: 'Broken Hierarchy',
    canonicalCategory: 'broken hierarchy',
    severity: 'Warning',
    objectId: 'INS-04-019',
    objectName: 'Fire & Gas Sensor Field Cabling to Central Panel',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Broken hierarchy detected: Level 6 field installation activity is erroneously parented under WBS 3.1.0 (Detailed Engineering Design) instead of Construction Execution (Invalid Hierarchy).',
    impactExplanation: 'Distorts engineering deliverable completion percentages by mixing physical site cabling with design office deliverables.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Parent WBS Level',
      currentValue: '3.1.0 (Engineering)',
      suggestedValue: '1.1.5.2.1 (Field Instrumentation)',
    },
  },
  {
    id: 'ISS-SCH-002',
    category: 'Schedule Health',
    rule: 'Invalid Dates',
    canonicalCategory: 'invalid dates',
    severity: 'Critical',
    objectId: 'ELE-12-008',
    objectName: 'Substation Motor Control Center (MCC) Energization',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Invalid dates detected: Inverted logic dates where Planned Finish (14 Sep 2026) is scheduled earlier than Planned Start (20 Sep 2026). Negative duration (-6 days) (Invalid Dates).',
    impactExplanation: 'Breaks forward and backward CPM passes. Total float calculation returns NaN in Primavera P6 schedule engine.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Planned Finish Date',
      currentValue: '2026-09-14',
      suggestedValue: '2026-09-25',
    },
  },
  {
    id: 'ISS-SCH-003',
    category: 'Schedule Health',
    rule: 'Missing Dependencies',
    canonicalCategory: 'missing dependencies',
    severity: 'Critical',
    objectId: 'PIP-24-004',
    objectName: 'Chemical Cleaning, De-greasing & Nitrogen Purging',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Missing dependencies: Activity has no predecessor defined, despite physically requiring completion of hydrotest section Line 24-XX (Missing Dependencies).',
    impactExplanation: 'Allows cleaning to schedule before hydrotest validation in early start pass, violating ASME B31.3 commissioning sequence.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Predecessor Link',
      currentValue: 'None (Dangling Open Start)',
      suggestedValue: 'PIP-24-003 (FS +0d)',
    },
  },
  {
    id: 'ISS-SCH-004',
    category: 'Schedule Health',
    rule: 'Duplicate Activities',
    canonicalCategory: 'duplicate activities',
    severity: 'Critical',
    objectId: 'PIP-24-001',
    objectName: 'Erect Line 24-XX High Pressure Gas Header [Duplicate]',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Duplicate activities detected: Duplicate IDs collision where activity PIP-24-001 is declared twice in P6 schedule import file with conflicting durations (Duplicate IDs).',
    impactExplanation: 'Causes non-deterministic schedule updates and dual progress reporting on the same spool line.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Resolve',
    fixPayload: {
      fieldToFix: 'Primary Activity ID',
      currentValue: 'PIP-24-001 (Duplicate)',
      suggestedValue: 'PIP-24-001-B (Renamed)',
    },
  },
  {
    id: 'ISS-SCH-005',
    category: 'Schedule Health',
    rule: 'WBS Issues',
    canonicalCategory: 'WBS issues',
    severity: 'Critical',
    objectId: 'MEC-99-002',
    objectName: 'Emergency Diesel Generator 500kVA Test Run',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'WBS issues: Activity imported with null WBS assignment. It is unattached to any L1-L4 work breakdown package in master schedule (Missing WBS).',
    impactExplanation: 'Cannot roll up progress to Mechanical Package summary or contract cost code. Excluded from master schedule S-curve.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'WBS Code',
      currentValue: 'null',
      suggestedValue: '1.1.4.1 (Auxiliary Utilities)',
    },
  },
  {
    id: 'ISS-SCH-006',
    category: 'Schedule Health',
    rule: 'Schedule Conflicts',
    canonicalCategory: 'schedule conflicts',
    severity: 'Warning',
    objectId: 'TEMP-LINE24-UNID',
    objectName: 'Hydrostatic Relief Valve Calibration & Certification',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Schedule conflicts: Activity imported without standard P6 Activity ID (Missing Activity IDs); logic link imposes mandatory constraint conflicting with upstream handover.',
    impactExplanation: 'Cannot correlate field execution updates or track CPM float without a canonical activity ID.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Activity ID',
      currentValue: 'TEMP-LINE24-UNID (Missing Format)',
      suggestedValue: 'PIP-24-006',
    },
  },

  // =========================================================================
  // 2. EXECUTION DATA QUALITY ISSUES
  // - missing quantity
  // - missing unit
  // - ambiguous field event
  // - missing evidence
  // - unmatched event
  // - duplicate event
  // =========================================================================
  {
    id: 'ISS-EXE-001',
    category: 'Execution Data Quality',
    rule: 'Missing Quantity',
    canonicalCategory: 'missing quantity',
    severity: 'Warning',
    objectId: 'EVT-2026-011',
    objectName: 'Field Grouting Under Compressor Skid Bay 2',
    objectType: 'EXECUTION_EVENT',
    description: 'Missing quantity: Field execution update record lacks mandatory physical quantity in payload (Missing Values).',
    impactExplanation: 'Cannot compute verified physical completion percentage or EVM Earned Value credit without quantity denominator.',
    detectedAt: '16 Sep 2026, 12:45 IST',
    detected: '16 Sep 2026, 12:45 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Quantity',
      currentValue: 'null (Blank)',
      suggestedValue: '3.5',
    },
  },
  {
    id: 'ISS-EXE-002',
    category: 'Execution Data Quality',
    rule: 'Missing Unit',
    canonicalCategory: 'missing unit',
    severity: 'Warning',
    objectId: 'EVT-2026-014',
    objectName: 'Torque Tightening on Pipe Rack Flange Joints',
    objectType: 'EXECUTION_EVENT',
    description: 'Missing unit: Quantity of 120 recorded but unit of measure is empty (Missing Values). Incomplete parameter specification.',
    impactExplanation: 'Incomplete measurement specification prevents automated conversion into standard Dia-Inch inspection ledger.',
    detectedAt: '16 Sep 2026, 14:15 IST',
    detected: '16 Sep 2026, 14:15 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Unit of Measure',
      currentValue: 'null (Blank)',
      suggestedValue: 'Flanges (Torqued)',
    },
  },
  {
    id: 'ISS-EXE-003',
    category: 'Execution Data Quality',
    rule: 'Ambiguous Field Event',
    canonicalCategory: 'ambiguous field event',
    severity: 'Warning',
    objectId: 'EVT-2026-009',
    objectName: 'Cable Pulling in Overhead Process Gallery',
    objectType: 'EXECUTION_EVENT',
    description: 'Ambiguous field event: Low Confidence match (58%) with Conflicting Reports on whether work applies to Substation or Transmitters (Low Confidence, Conflicting Reports).',
    impactExplanation: 'Automated ingestion suspended. Requires human engineer verification gate to select authoritative activity.',
    detectedAt: '17 Sep 2026, 16:00 IST',
    detected: '17 Sep 2026, 16:00 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-004',
    category: 'Execution Data Quality',
    rule: 'Missing Evidence',
    canonicalCategory: 'missing evidence',
    severity: 'Warning',
    objectId: 'EVT-2026-018',
    objectName: 'Underground Drainage Trench Compaction',
    objectType: 'EXECUTION_EVENT',
    description: 'Missing evidence: Daily field record submitted without mandatory photo proof or laboratory compaction slip (Stale Events).',
    impactExplanation: 'Work cannot be credited towards schedule baseline until physical QC proof is attached and verified.',
    detectedAt: '15 Sep 2026, 10:00 IST',
    detected: '15 Sep 2026, 10:00 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-005',
    category: 'Execution Data Quality',
    rule: 'Unmatched Event',
    canonicalCategory: 'unmatched event',
    severity: 'Critical',
    objectId: 'EVT-2026-004',
    objectName: 'Pipe installation near Unit B drain line',
    objectType: 'EXECUTION_EVENT',
    description: 'Unmatched event: Field observation cannot be correlated to any schedule activity in master baseline (Unmatched Events).',
    impactExplanation: 'Work is being executed on site that has no baseline representation in P6 V3 · Rev 3.2. Potential scope creep or non-schedule work order.',
    detectedAt: '17 Sep 2026, 17:30 IST',
    detected: '17 Sep 2026, 17:30 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-006',
    category: 'Execution Data Quality',
    rule: 'Duplicate Event',
    canonicalCategory: 'duplicate event',
    severity: 'Critical',
    objectId: 'EVT-2026-008',
    objectName: 'Erect Line 24 spools (12 spools duplicate)',
    objectType: 'EXECUTION_EVENT',
    description: 'Duplicate event: Ingested field capture reports identical 12 spools already verified and credited under EVT-2026-001 (Duplicate Events).',
    impactExplanation: 'Accepting both entries would double-count progress on PIP-24-001, artificially showing 24 spools erected instead of 12.',
    detectedAt: '15 Sep 2026, 09:10 IST',
    detected: '15 Sep 2026, 09:10 IST',
    status: 'Open',
    suggestedAction: 'Resolve',
  },
];
