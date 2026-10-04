export type HealthCategory = 'Schedule Structure' | 'Execution Data';

export type ScheduleStructureRule =
  | 'missing Activity IDs'
  | 'duplicate Activity IDs'
  | 'missing dates'
  | 'invalid dates'
  | 'invalid hierarchy'
  | 'missing WBS'
  | 'missing dependencies';

export type ExecutionDataRule =
  | 'unmatched events'
  | 'stale events'
  | 'duplicate events'
  | 'conflicting reports'
  | 'incomplete execution values';

export type HealthRule = ScheduleStructureRule | ExecutionDataRule;

export type HealthSeverity = 'Critical' | 'Needs Attention' | 'Healthy';

export type IssueStatus = 'Open' | 'In Review' | 'Ignored' | 'Resolved';

export interface HealthIssue {
  id: string;
  category: HealthCategory;
  rule: HealthRule;
  severity: HealthSeverity;
  objectId: string;
  objectName: string;
  objectType: 'SCHEDULE_ACTIVITY' | 'EXECUTION_EVENT' | 'WBS_NODE' | 'DEPENDENCY_LINK';
  description: string;
  impactExplanation: string;
  detectedAt: string;
  status: IssueStatus;
  suggestedAction: 'View Activity' | 'Fix Data' | 'Review' | 'Ignore with Reason';
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
  category: HealthCategory;
  name: string;
  description: string;
  status: 'Healthy' | 'Needs Attention' | 'Critical';
  issueCount: number;
  criticalCount: number;
  warningCount: number;
  totalEvaluated: number;
}

export const INITIAL_HEALTH_ISSUES: HealthIssue[] = [
  // ==========================================
  // SCHEDULE STRUCTURE ISSUES
  // ==========================================
  {
    id: 'ISS-SCH-002',
    category: 'Schedule Structure',
    rule: 'invalid dates',
    severity: 'Critical',
    objectId: 'ELE-12-008',
    objectName: 'Substation Motor Control Center (MCC) Energization',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Inverted logic dates: Planned Finish (14 Sep 2026) is scheduled earlier than Planned Start (20 Sep 2026). Negative duration (-6 days).',
    impactExplanation: 'Breaks forward and backward CPM passes. Total float calculation returns NaN in Primavera P6 schedule engine.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Planned Finish Date',
      currentValue: '2026-09-14',
      suggestedValue: '2026-09-25',
    },
  },
  {
    id: 'ISS-SCH-004',
    category: 'Schedule Structure',
    rule: 'missing WBS',
    severity: 'Critical',
    objectId: 'MEC-99-002',
    objectName: 'Emergency Diesel Generator 500kVA Test Run',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Activity imported with null WBS assignment. It is unattached to any L1-L4 work breakdown package.',
    impactExplanation: 'Cannot roll up progress to Mechanical Package summary or contract cost code. Excluded from master schedule S-curve.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'WBS Code',
      currentValue: 'null',
      suggestedValue: '4.3.1 (Auxiliary Utilities)',
    },
  },
  {
    id: 'ISS-SCH-005',
    category: 'Schedule Structure',
    rule: 'missing dependencies',
    severity: 'Critical',
    objectId: 'PIP-24-004',
    objectName: 'Chemical Cleaning, De-greasing & Nitrogen Purging',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Dangling logic: Activity has no predecessor defined, despite physically requiring completion of hydrotest section Line 24-XX.',
    impactExplanation: 'Allows cleaning to schedule before hydrotest validation in early start pass, violating ASME B31.3 commissioning sequence.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Predecessor Link',
      currentValue: 'None (Dangling Open Start)',
      suggestedValue: 'PIP-24-003 (FS +0d)',
    },
  },
  {
    id: 'ISS-SCH-001',
    category: 'Schedule Structure',
    rule: 'missing dates',
    severity: 'Needs Attention',
    objectId: 'PIP-25-004',
    objectName: 'Tie-in Fuel Gas Line 25-YY at Battery Limit',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Missing Planned Finish date in P6 XML import. Planned Start is 28 Sep 2026, but finish is blank.',
    impactExplanation: 'Defaults to milestone zero-duration unless planner assigns an explicit duration estimate.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Planned Finish Date',
      currentValue: 'Unassigned (Blank)',
      suggestedValue: '2026-10-03',
    },
  },
  {
    id: 'ISS-SCH-003',
    category: 'Schedule Structure',
    rule: 'invalid hierarchy',
    severity: 'Needs Attention',
    objectId: 'INS-04-019',
    objectName: 'Fire & Gas Sensor Field Cabling to Central Panel',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Hierarchy mismatch: L6 activity assigned under parent WBS 3.1.0 (Detailed Engineering), but discipline is Site Execution.',
    impactExplanation: 'Skews engineering deliverables completion percentage with site physical installation progress.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Parent WBS Level',
      currentValue: '3.1.0 (Engineering)',
      suggestedValue: '6.2.1 (Field Instrumentation)',
    },
  },
  {
    id: 'ISS-SCH-006',
    category: 'Schedule Structure',
    rule: 'missing dependencies',
    severity: 'Needs Attention',
    objectId: 'CIV-11-004',
    objectName: 'Perimeter Stormwater Drain Sump Excavation',
    objectType: 'SCHEDULE_ACTIVITY',
    description: 'Open-ended finish: Activity has 0 successors defined and is not tagged as a project handover milestone.',
    impactExplanation: 'Total float expands artificially to contractual end date (88 days float), masking potential site drainage delays.',
    detectedAt: '18 Sep 2026, 08:30',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Successor Link',
      currentValue: 'None (Dangling Finish)',
      suggestedValue: 'CIV-11-010 (Final Grading, FS +0d)',
    },
  },

  // ==========================================
  // EXECUTION DATA ISSUES
  // ==========================================
  {
    id: 'ISS-EXE-001',
    category: 'Execution Data',
    rule: 'unmatched events',
    severity: 'Critical',
    objectId: 'EVT-2026-004',
    objectName: 'Pipe installation near Unit B drain line',
    objectType: 'EXECUTION_EVENT',
    description: 'Field diary submission cannot be correlated to any schedule activity. Low AI match confidence (47%).',
    impactExplanation: 'Work is being executed on site that has no baseline representation in P6 V3 · Rev 3.2. Possible scope creep or non-schedule work order.',
    detectedAt: '17 Sep 2026, 17:30',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-003',
    category: 'Execution Data',
    rule: 'duplicate events',
    severity: 'Critical',
    objectId: 'EVT-2026-008',
    objectName: 'Erect Line 24 spools (12 spools)',
    objectType: 'EXECUTION_EVENT',
    description: 'Duplicate ingestion detected: EVT-2026-008 submitted via mobile chatbot reports identical 12 spools already verified in EVT-2026-001.',
    impactExplanation: 'Accepting both entries would double-count progress on PIP-24-001, artificially showing 24 spools erected instead of 12.',
    detectedAt: '15 Sep 2026, 09:10',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-004',
    category: 'Execution Data',
    rule: 'conflicting reports',
    severity: 'Critical',
    objectId: 'EVT-2026-002',
    objectName: 'Weld Line 24-XX Field Joints',
    objectType: 'EXECUTION_EVENT',
    description: 'Conflicting field quantities: Contractor DPR claims 8 welds completed, while OIL Quality Inspection memo reports 5 welds passed and 3 rejected.',
    impactExplanation: 'Discrepancy of 3 field welds affects NDT radiography testing window and unblocking of successor hydrotest activity.',
    detectedAt: '16 Sep 2026, 18:30',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-002',
    category: 'Execution Data',
    rule: 'stale events',
    severity: 'Needs Attention',
    objectId: 'EVT-2026-003',
    objectName: 'Cable tray installation substation to compressor bay',
    objectType: 'EXECUTION_EVENT',
    description: 'Voice diary report has remained in Manager Review Queue for over 48 hours without engineering sign-off.',
    impactExplanation: 'Stale field data causes Schedule Twin and Progress dashboard to lag real site execution status.',
    detectedAt: '16 Sep 2026, 16:00',
    status: 'Open',
    suggestedAction: 'Review',
  },
  {
    id: 'ISS-EXE-005',
    category: 'Execution Data',
    rule: 'incomplete execution values',
    severity: 'Needs Attention',
    objectId: 'EVT-2026-007',
    objectName: 'Grouting applied on compressor foundation block',
    objectType: 'EXECUTION_EVENT',
    description: 'Incomplete entry: Work description provided, but quantity value and physical unit were left empty.',
    impactExplanation: 'Granularity Bridge cannot aggregate progress percentage into L5 activity CIV-11-001 without numeric quantity.',
    detectedAt: '17 Sep 2026, 11:45',
    status: 'Open',
    suggestedAction: 'Fix Data',
    fixPayload: {
      fieldToFix: 'Quantity and Unit',
      currentValue: 'null [units: empty]',
      suggestedValue: '3.5 m³ epoxy grout',
    },
  },
];

export const SCHEDULE_STRUCTURE_RULES: Array<{
  rule: ScheduleStructureRule;
  name: string;
  description: string;
}> = [
  {
    rule: 'missing Activity IDs',
    name: 'Missing Activity IDs',
    description: 'Checks that every activity has a unique alphanumeric identifier complying with project WBS naming standards.',
  },
  {
    rule: 'duplicate Activity IDs',
    name: 'Duplicate Activity IDs',
    description: 'Verifies primary key integrity across schedule versions so no two activities share identical identifiers.',
  },
  {
    rule: 'missing dates',
    name: 'Missing Dates',
    description: 'Detects activities with unassigned planned start or finish dates causing duration calculation failures.',
  },
  {
    rule: 'invalid dates',
    name: 'Invalid / Inverted Dates',
    description: 'Detects finish dates scheduled earlier than start dates, negative durations, or dates outside project lifespan.',
  },
  {
    rule: 'invalid hierarchy',
    name: 'Invalid WBS Hierarchy',
    description: 'Flags parent-child depth inconsistencies, mismatched disciplines between L5 activities and L3 packages.',
  },
  {
    rule: 'missing WBS',
    name: 'Missing WBS Assignment',
    description: 'Identifies orphaned activities not tied to an authorized Work Breakdown Structure node.',
  },
  {
    rule: 'missing dependencies',
    name: 'Missing Dependencies (Dangling Logic)',
    description: 'Flags open-start activities with no predecessors or open-finish activities with no successors (excluding project milestones).',
  },
];

export const EXECUTION_DATA_RULES: Array<{
  rule: ExecutionDataRule;
  name: string;
  description: string;
}> = [
  {
    rule: 'unmatched events',
    name: 'Unmatched Field Events',
    description: 'Flags daily field observations that could not be mapped to any schedule activity in the master baseline.',
  },
  {
    rule: 'stale events',
    name: 'Stale Unverified Events (>48h)',
    description: 'Flags ingested field reports awaiting manager review or verification for more than 48 hours.',
  },
  {
    rule: 'duplicate events',
    name: 'Duplicate Field Reports',
    description: 'Identifies redundant field captures submitted across multiple channels reporting the same physical work.',
  },
  {
    rule: 'conflicting reports',
    name: 'Conflicting Field Submissions',
    description: 'Highlights conflicting quantity or date observations reported by different site engineers on the same shift.',
  },
  {
    rule: 'incomplete execution values',
    name: 'Incomplete Execution Records',
    description: 'Detects updates lacking critical parameters like physical quantity, unit of measure, line number, or area.',
  },
];
