export type HealthCategory = 'Schedule Health' | 'Execution Data Quality' | 'Schedule Structure' | 'Execution Data';

export type ScheduleHealthRule =
  | 'Missing Activity IDs'
  | 'Duplicate IDs'
  | 'Invalid Dates'
  | 'Missing Dependencies'
  | 'Invalid Hierarchy'
  | 'Missing WBS';

export type ExecutionDataQualityRule =
  | 'Unmatched Events'
  | 'Duplicate Events'
  | 'Missing Values'
  | 'Conflicting Reports'
  | 'Low Confidence'
  | 'Stale Events';

export type HealthRule = ScheduleHealthRule | ExecutionDataQualityRule | string;

export type HealthSeverity = 'Critical' | 'Needs Attention' | 'Healthy';

export type IssueStatus = 'Open' | 'In Review' | 'Ignored' | 'Resolved';

export interface HealthIssue {
  id: string; // e.g. "ISS-SCH-001"
  category: 'Schedule Health' | 'Execution Data Quality';
  rule: HealthRule;
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

export interface RuleCheckSummary {
  rule: HealthRule;
  category: 'Schedule Health' | 'Execution Data Quality';
  name: string;
  description: string;
  status: 'Healthy' | 'Needs Attention' | 'Critical';
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  totalEvaluated: number;
}

export const SCHEDULE_HEALTH_RULES: Array<{
  rule: ScheduleHealthRule;
  name: string;
  description: string;
}> = [
  {
    rule: 'Missing Activity IDs',
    name: 'Missing Activity IDs',
    description: 'Checks that every imported schedule activity has a unique alphanumeric identifier complying with project WBS naming standards.',
  },
  {
    rule: 'Duplicate IDs',
    name: 'Duplicate IDs',
    description: 'Verifies primary key uniqueness across schedule baseline versions so no two activities share identical identifiers.',
  },
  {
    rule: 'Invalid Dates',
    name: 'Invalid Dates',
    description: 'Detects finish dates scheduled earlier than start dates, negative task durations, or dates outside project lifespan.',
  },
  {
    rule: 'Missing Dependencies',
    name: 'Missing Dependencies',
    description: 'Flags dangling logic: activities with zero predecessors or open-ended finishes without successors (excluding milestones).',
  },
  {
    rule: 'Invalid Hierarchy',
    name: 'Invalid Hierarchy',
    description: 'Flags parent-child depth inconsistencies, mismatched disciplines between L5 activities and L3 packages, or orphan nodes.',
  },
  {
    rule: 'Missing WBS',
    name: 'Missing WBS',
    description: 'Identifies activities unassigned to any authorized Work Breakdown Structure node in the master baseline.',
  },
];

export const EXECUTION_DATA_QUALITY_RULES: Array<{
  rule: ExecutionDataQualityRule;
  name: string;
  description: string;
}> = [
  {
    rule: 'Unmatched Events',
    name: 'Unmatched Events',
    description: 'Flags daily field observations that cannot be mapped or matched to any schedule activity in the master baseline.',
  },
  {
    rule: 'Duplicate Events',
    name: 'Duplicate Events',
    description: 'Identifies redundant field captures submitted across multiple channels reporting identical physical work.',
  },
  {
    rule: 'Missing Values',
    name: 'Missing Values',
    description: 'Detects execution event updates lacking critical parameters like physical quantity, unit of measure, line number, or area.',
  },
  {
    rule: 'Conflicting Reports',
    name: 'Conflicting Reports',
    description: 'Highlights conflicting quantity, test, or date observations reported by different site inspectors on the same shift.',
  },
  {
    rule: 'Low Confidence',
    name: 'Low Confidence',
    description: 'Identifies AI candidate matches falling below verification threshold (<60%), requiring human review before schedule linkage.',
  },
  {
    rule: 'Stale Events',
    name: 'Stale Events',
    description: 'Flags ingested field reports awaiting manager review or verification for more than 48 hours without sign-off.',
  },
];

// Backward compatibility aliases
export const SCHEDULE_STRUCTURE_RULES = SCHEDULE_HEALTH_RULES;
export const EXECUTION_DATA_RULES = EXECUTION_DATA_QUALITY_RULES;

export const INITIAL_HEALTH_ISSUES: HealthIssue[] = [
  // ==========================================
  // 1. SCHEDULE HEALTH ISSUES (6 categories)
  // ==========================================
  {
    id: 'ISS-SCH-001',
    category: 'Schedule Health',
    rule: 'Missing Activity IDs',
    severity: 'Critical',
    objectId: 'TEMP-LINE24-UNID',
    objectName: 'Hydrostatic Relief Valve Calibration & Certification',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Activity imported without unique P6 Activity ID. Record has null activity identifier in source XML node.',
    impactExplanation: 'Cannot correlate field execution updates or track CPM float without a canonical activity ID.',
    detectedAt: '18 Sep 2026, 08:30 IST',
    detected: '18 Sep 2026, 08:30 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Activity ID',
      currentValue: 'null (Blank)',
      suggestedValue: 'PIP-24-006',
    },
  },
  {
    id: 'ISS-SCH-002',
    category: 'Schedule Health',
    rule: 'Duplicate IDs',
    severity: 'Critical',
    objectId: 'PIP-24-001',
    objectName: 'Erect Line 24-XX High Pressure Gas Header [Duplicate]',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Duplicate ID collision: Activity PIP-24-001 is declared twice in P6 schedule import file with conflicting durations.',
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
    id: 'ISS-SCH-003',
    category: 'Schedule Health',
    rule: 'Invalid Dates',
    severity: 'Critical',
    objectId: 'ELE-12-008',
    objectName: 'Substation Motor Control Center (MCC) Energization',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Inverted logic dates: Planned Finish (14 Sep 2026) is scheduled earlier than Planned Start (20 Sep 2026). Negative duration (-6 days).',
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
    id: 'ISS-SCH-004',
    category: 'Schedule Health',
    rule: 'Missing Dependencies',
    severity: 'Critical',
    objectId: 'PIP-24-004',
    objectName: 'Chemical Cleaning, De-greasing & Nitrogen Purging',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Dangling logic: Activity has no predecessor defined, despite physically requiring completion of hydrotest section Line 24-XX.',
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
    id: 'ISS-SCH-005',
    category: 'Schedule Health',
    rule: 'Invalid Hierarchy',
    severity: 'Needs Attention',
    objectId: 'INS-04-019',
    objectName: 'Fire & Gas Sensor Field Cabling to Central Panel',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Hierarchy mismatch: L6 activity assigned under parent WBS 3.1.0 (Detailed Engineering), but discipline is Site Execution.',
    impactExplanation: 'Skews engineering deliverables completion percentage with site physical installation progress.',
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
    id: 'ISS-SCH-006',
    category: 'Schedule Health',
    rule: 'Missing WBS',
    severity: 'Critical',
    objectId: 'MEC-99-002',
    objectName: 'Emergency Diesel Generator 500kVA Test Run',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Activity imported with null WBS assignment. It is unattached to any L1-L4 work breakdown package.',
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

  // ==========================================
  // 2. EXECUTION DATA QUALITY ISSUES (6 categories)
  // ==========================================
  {
    id: 'ISS-EXE-001',
    category: 'Execution Data Quality',
    rule: 'Unmatched Events',
    severity: 'Critical',
    objectId: 'EVT-2026-004',
    objectName: 'Pipe installation near Unit B drain line',
    objectType: 'EXECUTION_EVENT',
    description: 'Field diary submission cannot be correlated to any schedule activity. Low AI match confidence (47%).',
    impactExplanation: 'Work is being executed on site that has no baseline representation in P6 V3 · Rev 3.2. Possible scope creep or non-schedule work order.',
    detectedAt: '17 Sep 2026, 17:30 IST',
    detected: '17 Sep 2026, 17:30 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-002',
    category: 'Execution Data Quality',
    rule: 'Duplicate Events',
    severity: 'Critical',
    objectId: 'EVT-2026-008',
    objectName: 'Erect Line 24 spools (12 spools duplicate)',
    objectType: 'EXECUTION_EVENT',
    description: 'Duplicate ingestion detected: EVT-2026-008 submitted via mobile chatbot reports identical 12 spools already verified in EVT-2026-001.',
    impactExplanation: 'Accepting both entries would double-count progress on PIP-24-001, artificially showing 24 spools erected instead of 12.',
    detectedAt: '15 Sep 2026, 09:10 IST',
    detected: '15 Sep 2026, 09:10 IST',
    status: 'Open',
    suggestedAction: 'Resolve',
  },
  {
    id: 'ISS-EXE-003',
    category: 'Execution Data Quality',
    rule: 'Missing Values',
    severity: 'Needs Attention',
    objectId: 'EVT-2026-011',
    objectName: 'Field Grouting Under Compressor Skid Bay 2',
    objectType: 'EXECUTION_EVENT',
    description: 'Incomplete parameter set: Execution update record lacks mandatory physical quantity and unit of measure in payload.',
    impactExplanation: 'Cannot compute verified physical completion percentage or EVM Earned Value credit without quantity denominator.',
    detectedAt: '16 Sep 2026, 12:45 IST',
    detected: '16 Sep 2026, 12:45 IST',
    status: 'Open',
    suggestedAction: 'Fix',
    fixPayload: {
      fieldToFix: 'Quantity and Unit',
      currentValue: 'null [units: empty]',
      suggestedValue: '3.5 m³ epoxy grout',
    },
  },
  {
    id: 'ISS-EXE-004',
    category: 'Execution Data Quality',
    rule: 'Conflicting Reports',
    severity: 'Critical',
    objectId: 'EVT-2026-002',
    objectName: 'Weld Line 24-XX Field Joints Quantity Discrepancy',
    objectType: 'EXECUTION_EVENT',
    description: 'Conflicting field quantities: Contractor DPR claims 8 welds completed, while OIL Quality Inspection memo reports 5 welds passed and 3 rejected.',
    impactExplanation: 'Discrepancy of 3 field welds affects NDT radiography testing window and unblocking of successor hydrotest activity.',
    detectedAt: '16 Sep 2026, 18:30 IST',
    detected: '16 Sep 2026, 18:30 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-005',
    category: 'Execution Data Quality',
    rule: 'Low Confidence',
    severity: 'Needs Attention',
    objectId: 'EVT-2026-009',
    objectName: 'Cable Pulling in Overhead Process Gallery',
    objectType: 'EXECUTION_EVENT',
    description: 'Ambiguous AI candidate suggestion (58% confidence). Unclear whether update belongs to ELE-11-032 (Substation) or INS-02-005 (Transmitters).',
    impactExplanation: 'Automated ingestion suspended. Requires human engineer verification gate to select authoritative activity.',
    detectedAt: '17 Sep 2026, 16:00 IST',
    detected: '17 Sep 2026, 16:00 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-006',
    category: 'Execution Data Quality',
    rule: 'Stale Events',
    severity: 'Needs Attention',
    objectId: 'EVT-2026-003',
    objectName: 'Foundation Excavation Trench Inspection Sheet',
    objectType: 'EXECUTION_EVENT',
    description: 'Stale unverified record: Daily field submission has been sitting in review queue for 54 hours without site engineer sign-off.',
    impactExplanation: 'Violates 24-hour verification SLA. Causes variance indicators to lag behind actual site progress.',
    detectedAt: '15 Sep 2026, 10:00 IST',
    detected: '15 Sep 2026, 10:00 IST',
    status: 'Open',
    suggestedAction: 'Review',
  },
];
