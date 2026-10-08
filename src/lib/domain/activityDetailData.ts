import {
  ScheduleActivity,
  ExecutionEvent,
  EvidenceItem,
  AuditEntry,
  WBSLevel,
  DisciplineType,
} from '../../types';
import {
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
  MOCK_AUDIT_LOGS,
} from '../api/mockData';
import {
  COMPREHENSIVE_EVIDENCE_ITEMS,
  COMPREHENSIVE_AUDIT_LOGS,
} from './evidenceData';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from './canonicalModels';

export type ActivityDrawerTab =
  | 'overview'
  | 'progress'
  | 'execution'
  | 'evidence'
  | 'dependencies'
  | 'history'
  | 'plan-vs-actual';

export interface WBSHierarchyStep {
  level: WBSLevel;
  code: string;
  name: string;
  category: string;
  isCurrent?: boolean;
}

export interface DetailedDependency {
  id: string;
  name: string;
  wbs: string;
  discipline: DisciplineType;
  type: 'Finish-to-Start (FS)' | 'Start-to-Start (SS)' | 'Finish-to-Finish (FF)';
  lagDays: number;
  plannedPeriod: string;
  status: 'completed' | 'on-track' | 'at-risk' | 'delayed' | 'pending';
  delayDays: number;
  isCritical: boolean;
  notes: string;
}

export interface DependencyImpactData {
  totalFloatDays: number;
  freeFloatDays: number;
  isOnCriticalPath: boolean;
  drivingPredecessorId?: string;
  downstreamChain: Array<{ id: string; name: string; shiftDays: number; isCritical: boolean }>;
  projectedScheduleImpact: string;
  currentMitigation: string;
  recommendedAction: string;
}

export interface EnrichedActivityDetail {
  activity: ScheduleActivity;
  projectName: string;
  projectCode: string;
  location: string;
  hierarchy: WBSHierarchyStep[];
  linkedExecutionEvents: ExecutionEvent[];
  linkedEvidenceItems: EvidenceItem[];
  detailedPredecessors: DetailedDependency[];
  detailedSuccessors: DetailedDependency[];
  impactData: DependencyImpactData;
  auditHistory: AuditEntry[];
}

// Master catalogue of activities for deep inspection
const EXTENDED_ACTIVITY_RECORDS: Record<string, Partial<ScheduleActivity>> = {
  'PIP-24-002': {
    id: 'PIP-24-002',
    activityId: 'PIP-24-002',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    activityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    line: 'Line 24-XX (24" High Pressure Natural Gas Header)',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-16',
    actualFinish: undefined,
    plannedProgress: 85,
    actualProgress: 70,
    verifiedActualProgress: 70,
    plannedQuantity: 12,
    actualQuantity: 8.4,
    unit: 'joints',
    variance: -15,
    status: 'delayed',
    delayDays: 2,
    scheduleVersion: CANONICAL_SCHEDULE_VERSION_LABEL,
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
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-04-015'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah (Lead Site Execution Engineer)',
    evidenceIds: ['EVD-004', 'EVD-002'],
    executionEventIds: ['EVT-2026-002'],
    description:
      'Field butt welding of 24-inch Schedule 80 carbon steel pipe joints and 100% radiographic examination clearance for the high-pressure gas gathering header.',
  },
  'PIP-24-001': {
    id: 'PIP-24-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-17',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 12,
    actualQuantity: 12,
    unit: 'spools',
    variance: 0,
    status: 'completed',
    delayDays: 2,
    predecessors: ['CIV-11-001'],
    successors: ['PIP-24-002'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001', 'EVD-002', 'EVD-003'],
    executionEventIds: ['EVT-2026-001'],
    description:
      'Rigging and erection of 12 prefabricated 24-inch spool sections on structural piperack B at Unit A.',
  },
  'PIP-24-003': {
    id: 'PIP-24-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    line: 'Line 24-XX',
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    actualStart: undefined,
    actualFinish: undefined,
    plannedProgress: 0,
    actualProgress: 0,
    plannedQuantity: 1,
    actualQuantity: 0,
    unit: 'test package',
    variance: 0,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002'],
    successors: ['INS-04-015'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description:
      'High pressure water fill, pressurization up to 150 bar, holding for 24-hour chart recording and punchlist clearance.',
  },
  'CIV-11-001': {
    id: 'CIV-11-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Foundation Block A - Compressor Pedestal',
    wbs: '1.1.2.1.1',
    wbsLevel: 'L5',
    discipline: 'Civil',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    actualStart: '2026-09-05',
    actualFinish: '2026-09-14',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 45,
    actualQuantity: 45,
    unit: 'm³ concrete',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['MEC-08-003', 'PIP-24-001'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001'],
    executionEventIds: ['EVT-CIV-001'],
    description:
      'Heavy mass concrete pour and anchor bolts setting for 3.5MW natural gas compressor pedestal foundation.',
  },
  'MEC-08-003': {
    id: 'MEC-08-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Align Centrifugal Gas Compressor Skid A',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-22',
    actualStart: '2026-09-16',
    actualFinish: undefined,
    plannedProgress: 20,
    actualProgress: 15,
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
    description:
      'Laser alignment of electric drive motor and multi-stage barrel compressor coupling within 0.05mm tolerance.',
  },
  'ELE-11-032': {
    id: 'ELE-11-032',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '1.1.5.1.1',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Unit A - Overhead Gallery',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-09-23',
    actualStart: '2026-09-15',
    actualFinish: undefined,
    plannedProgress: 50,
    actualProgress: 40,
    plannedQuantity: 320,
    actualQuantity: 128,
    unit: 'meters',
    variance: -10,
    status: 'at-risk',
    delayDays: 1,
    predecessors: ['MEC-08-003'],
    successors: ['INS-04-015'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: ['EVT-2026-003'],
    description:
      'Installation of 600mm heavy-duty hot-dip galvanized ladder-type cable trays across piperack elevation +6.5m.',
  },
  'INS-04-015': {
    id: 'INS-04-015',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Mount Pressure & Temperature Transmitters Unit A',
    wbs: '1.1.6.2.1',
    wbsLevel: 'L5',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-22',
    plannedFinish: '2026-09-28',
    actualStart: undefined,
    actualFinish: undefined,
    plannedProgress: 0,
    actualProgress: 0,
    plannedQuantity: 18,
    actualQuantity: 0,
    unit: 'instruments',
    variance: 0,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description:
      'Field bracket mounting, impulse line hookup, and loop wiring for Line 24-XX PT and TT smart transmitters.',
  },
};

export function getEnrichedActivityDetail(activityId: string): EnrichedActivityDetail {
  // 1. Look up base activity
  const fromMock = MOCK_ACTIVITIES.find((a) => a.id === activityId);
  const fromExtended = EXTENDED_ACTIVITY_RECORDS[activityId];

  const base: ScheduleActivity = {
    id: activityId,
    projectId: 'PRJ-OIL-2026-01',
    name: fromExtended?.name || fromMock?.name || `Activity ${activityId}`,
    wbs: fromExtended?.wbs || fromMock?.wbs || '1.1.3.2.2',
    wbsLevel: fromExtended?.wbsLevel || fromMock?.wbsLevel || 'L5',
    discipline: fromExtended?.discipline || fromMock?.discipline || 'Piping',
    area: fromExtended?.area || fromMock?.area || 'Unit A - Gas Processing Area',
    line: fromExtended?.line || fromMock?.line || (activityId.includes('24') ? 'Line 24-XX' : undefined),
    plannedStart: fromExtended?.plannedStart || fromMock?.plannedStart || '2026-09-12',
    plannedFinish: fromExtended?.plannedFinish || fromMock?.plannedFinish || '2026-09-18',
    actualStart: fromExtended?.actualStart ?? fromMock?.actualStart ?? '2026-09-14',
    actualFinish: fromExtended?.actualFinish ?? fromMock?.actualFinish,
    plannedProgress: fromExtended?.plannedProgress ?? fromMock?.plannedProgress ?? 100,
    actualProgress: fromExtended?.actualProgress ?? fromMock?.actualProgress ?? 65,
    plannedQuantity: fromExtended?.plannedQuantity ?? fromMock?.plannedQuantity ?? 24,
    actualQuantity: fromExtended?.actualQuantity ?? fromMock?.actualQuantity ?? 16,
    unit: fromExtended?.unit || fromMock?.unit || 'units',
    variance: fromExtended?.variance ?? fromMock?.variance ?? -35,
    status: fromExtended?.status || fromMock?.status || 'delayed',
    delayDays: fromExtended?.delayDays ?? fromMock?.delayDays ?? 2,
    predecessors: fromExtended?.predecessors || fromMock?.predecessors || ['PIP-24-001'],
    successors: fromExtended?.successors || fromMock?.successors || ['PIP-24-003'],
    isCritical: fromExtended?.isCritical ?? fromMock?.isCritical ?? true,
    assignedEngineer: fromExtended?.assignedEngineer || fromMock?.assignedEngineer || 'Debajit Borah',
    evidenceIds: fromExtended?.evidenceIds || fromMock?.evidenceIds || ['EVD-004'],
    executionEventIds: fromExtended?.executionEventIds || fromMock?.executionEventIds || ['EVT-2026-002'],
    description:
      fromExtended?.description ||
      fromMock?.description ||
      `Schedule execution activity ${activityId} under the Duliajan Gas Processing master baseline.`,
  };

  // 2. Derive L1-L6 WBS Hierarchy
  const hierarchy: WBSHierarchyStep[] = [
    {
      level: 'L1',
      code: '1.0',
      name: 'Duliajan Gas Processing & Pipeline Interconnect',
      category: 'Project Baseline',
    },
    {
      level: 'L2',
      code: '1.1',
      name: 'Unit A - Gas Processing & Compression Area',
      category: 'Major Facility Area',
    },
    {
      level: 'L3',
      code: '1.1.3',
      name: `${base.discipline} Systems & Interconnecting Piperacks`,
      category: 'Discipline Work Breakdown',
    },
    {
      level: 'L4',
      code: '1.1.3.2',
      name: base.line ? `${base.line} Delivery Package` : 'High-Pressure Header Package',
      category: 'Sub-System Work Package',
    },
    {
      level: 'L5',
      code: base.wbs,
      name: base.name,
      category: 'Schedule Work Activity',
      isCurrent: true,
    },
    {
      level: 'L6',
      code: `${base.wbs}.1`,
      name: `${base.name} — Field Execution & NDT Clearance Step`,
      category: 'Discrete Field Task',
    },
  ];

  // 3. Linked Execution Events
  const allEvents: ExecutionEvent[] = [...MOCK_EXECUTION_EVENTS];
  const linkedExecutionEvents = allEvents.filter(
    (e) =>
      e.matchedActivityId === base.id ||
      base.executionEventIds.includes(e.id) ||
      (base.id === 'PIP-24-002' && e.id === 'EVT-2026-002') ||
      (base.id === 'PIP-24-001' && e.id === 'EVT-2026-001') ||
      (base.id === 'ELE-11-032' && e.id === 'EVT-2026-003')
  );

  // If none found for a generic activity, synthesize a realistic verified field record
  if (linkedExecutionEvents.length === 0) {
    linkedExecutionEvents.push({
      id: `EVT-${base.id}-01`,
      projectId: base.projectId,
      source: 'DPR_PDF',
      rawText: `Field work in progress for ${base.name}. Measured progress: ${base.actualProgress}% with ${base.actualQuantity} ${base.unit} completed.`,
      eventDate: '2026-09-17',
      eventTime: '17:00',
      quantity: base.actualQuantity,
      unit: base.unit,
      discipline: base.discipline,
      area: base.area,
      line: base.line || '',
      workDescription: base.name,
      extractedFields: {
        quantity: base.actualQuantity,
        unit: base.unit,
        line: base.line || '',
        area: base.area,
        discipline: base.discipline,
        workType: 'Execution',
        eventDate: '2026-09-17',
        confidenceSignals: [
          { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Exact match' },
          { name: 'Asset Area Match', score: 35, maxScore: 35, reason: 'Area confirmed' },
          { name: 'Action Verb Alignment', score: 20, maxScore: 20, reason: 'Matches planned task' },
          { name: 'Schedule Window', score: 12, maxScore: 15, reason: 'Within reported window' },
        ],
      },
      confidence: 92,
      matchCategory: 'AUTO_LINK',
      matchedActivityId: base.id,
      matchedActivityName: base.name,
      matchedReasons: ['Direct match from site daily progress verification log'],
      alternativeCandidates: [],
      status: 'approved',
      createdBy: `${base.assignedEngineer} (Site Execution)`,
      createdAt: '2026-09-17T17:45:00Z',
      verifiedAt: '2026-09-17T18:30:00Z',
      verifiedBy: 'Rajesh Sharma (Project Controls Manager)',
      evidenceIds: base.evidenceIds,
    });
  }

  // 4. Linked Evidence Items
  const allEvidence = [...COMPREHENSIVE_EVIDENCE_ITEMS, ...MOCK_EVIDENCE_ITEMS];
  const linkedEvidenceItems = allEvidence.filter(
    (ev) =>
      ev.activityId === base.id ||
      base.evidenceIds.includes(ev.id) ||
      (base.id === 'PIP-24-002' && (ev.id === 'EVD-004' || ev.id === 'EVD-002')) ||
      (base.id === 'PIP-24-001' && (ev.id === 'EVD-001' || ev.id === 'EVD-002' || ev.id === 'EVD-003')) ||
      (base.id === 'CIV-11-001' && ev.id === 'EVD-001')
  );

  // If no evidence found, add a fallback evidence card
  if (linkedEvidenceItems.length === 0) {
    linkedEvidenceItems.push({
      id: `EVD-${base.id}-01`,
      projectId: base.projectId,
      projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
      title: `Site Progress Inspection Report — ${base.name}`,
      type: 'DPR',
      source: 'Mobile Inspection Tablet',
      filename: `QC_REP_${base.id}_20260917.pdf`,
      fileSize: '1.8 MB',
      timestamp: '2026-09-17 16:45',
      uploader: base.assignedEngineer,
      uploaderRole: 'Lead Site Execution Engineer',
      activityId: base.id,
      activityName: base.name,
      gpsCoords: '27.3485° N, 95.3132° E',
      verifiedStatus: true,
      verificationBy: 'Rajesh Sharma (Project Controls Manager)',
      verificationTimestamp: '2026-09-17 18:00',
      status: 'Verified',
      sha256Hash: 'f4b1e5a890d7e6c43210987654321abcdef0123456789abcdef0123456789abc',
      notes: 'Verified against physical inspection checklists and surveyor measurements.',
    });
  }

  // 5. Predecessors & Successors
  const detailedPredecessors: DetailedDependency[] = base.predecessors.map((predId) => {
    const p = EXTENDED_ACTIVITY_RECORDS[predId] || MOCK_ACTIVITIES.find((a) => a.id === predId);
    return {
      id: predId,
      name: p?.name || `Predecessor Activity ${predId}`,
      wbs: p?.wbs || '1.1.3.2.1',
      discipline: p?.discipline || base.discipline,
      type: 'Finish-to-Start (FS)',
      lagDays: 0,
      plannedPeriod: `${p?.plannedStart || '2026-09-10'} → ${p?.plannedFinish || '2026-09-15'}`,
      status: (p?.status as any) || 'completed',
      delayDays: p?.delayDays || 0,
      isCritical: p?.isCritical ?? true,
      notes:
        predId === 'PIP-24-001'
          ? 'Completed 2 days late due to crane mobilization permit; pushed current activity start from 12 Sep to 14 Sep.'
          : 'Driving predecessor link with zero float.',
    };
  });

  const detailedSuccessors: DetailedDependency[] = base.successors.map((succId) => {
    const s = EXTENDED_ACTIVITY_RECORDS[succId] || MOCK_ACTIVITIES.find((a) => a.id === succId);
    return {
      id: succId,
      name: s?.name || `Successor Activity ${succId}`,
      wbs: s?.wbs || '1.1.3.2.3',
      discipline: s?.discipline || base.discipline,
      type: 'Finish-to-Start (FS)',
      lagDays: 0,
      plannedPeriod: `${s?.plannedStart || '2026-09-19'} → ${s?.plannedFinish || '2026-09-22'}`,
      status: (s?.status as any) || 'pending',
      delayDays: base.delayDays,
      isCritical: s?.isCritical ?? true,
      notes:
        succId === 'PIP-24-003'
          ? 'Cannot begin hydrostatic pressure test until 100% field welds and radiographic clearance are completed.'
          : 'Downstream electrical/instrumentation tie-in depends on piping line clearance.',
    };
  });

  // 6. Impact Data
  const impactData: DependencyImpactData = {
    totalFloatDays: base.isCritical ? 0 : 4,
    freeFloatDays: base.isCritical ? 0 : 2,
    isOnCriticalPath: base.isCritical,
    drivingPredecessorId: base.predecessors[0] || undefined,
    downstreamChain: [
      { id: base.id, name: base.name, shiftDays: base.delayDays, isCritical: base.isCritical },
      ...(base.successors.length > 0
        ? base.successors.map((sid) => ({
            id: sid,
            name: EXTENDED_ACTIVITY_RECORDS[sid]?.name || `Successor ${sid}`,
            shiftDays: base.delayDays,
            isCritical: true,
          }))
        : []),
      {
        id: 'MILE-04',
        name: 'Commissioning & First Gas Injection Milestone',
        shiftDays: base.isCritical ? base.delayDays : 0,
        isCritical: true,
      },
    ],
    projectedScheduleImpact: base.isCritical
      ? `Activity has 0 days total float. The current ${base.delayDays}-day variance directly delays successor ${base.successors[0] || 'activities'} and risks commercial gas target completion date (15 Dec 2026) unless recovered.`
      : `Activity has 4 days total float. Current variance is absorbed within buffer float and does not push commercial commissioning date.`,
    currentMitigation:
      base.id === 'PIP-24-002'
        ? 'Mobilized 2 additional NDT radiographers for night shift inspection to compress weld clearance window by 36 hours.'
        : 'Overtime crew assigned to clear field punchlist and restore baseline trajectory.',
    recommendedAction:
      'Authorize double-shift welding protocol and prioritize radiography clearance ahead of monsoon forecast.',
  };

  // 7. Audit History
  const allAudits = [...COMPREHENSIVE_AUDIT_LOGS, ...MOCK_AUDIT_LOGS];
  const auditHistory = allAudits.filter(
    (a) =>
      a.objectId === base.id ||
      a.objectTitle?.includes(base.id) ||
      (base.id === 'PIP-24-002' && (a.id === 'AUD-002' || a.id === 'AUD-003' || a.objectId === 'EVT-2026-002')) ||
      (base.id === 'PIP-24-001' && (a.id === 'AUD-001' || a.id === 'AUD-002'))
  );

  // If no audits found, synthesize realistic audit entries
  if (auditHistory.length === 0) {
    auditHistory.push(
      {
        id: `AUD-${base.id}-01`,
        timestamp: '2026-09-17 18:30:15',
        actor: 'Rajesh Sharma',
        role: 'manager',
        action: 'PROGRESS_VERIFIED_AND_COMMITTED',
        actionCategory: 'Approval',
        objectType: 'SCHEDULE_ACTIVITY',
        objectId: base.id,
        objectTitle: base.name,
        whatChanged: 'Actual Progress updated with verified field quantities',
        previousValue: `Progress: 50% (${base.actualQuantity - 4} ${base.unit})`,
        newValue: `Progress: ${base.actualProgress}% (${base.actualQuantity} ${base.unit})`,
        before: '50% Physical Completion',
        after: `${base.actualProgress}% Physical Completion`,
        details: `Approved DPR submission linked to verified field inspection certificate. Variance recorded as ${base.variance}%.`,
      },
      {
        id: `AUD-${base.id}-02`,
        timestamp: '2026-09-15 09:12:00',
        actor: 'PLnEX Match Engine (Rule-Score v2.4)',
        role: 'SYSTEM',
        action: 'AI_LINK_ESTABLISHED',
        actionCategory: 'AI Match',
        objectType: 'EXECUTION_EVENT',
        objectId: base.id,
        objectTitle: base.name,
        whatChanged: 'Candidate match auto-linked with high confidence',
        previousValue: 'UNLINKED',
        newValue: `Matched to ${base.id} (Score: 92%)`,
        before: 'Uncorrelated Field Statement',
        after: `Structured Event → ${base.id}`,
        details: 'Discipline, area tag, and work description matched baseline WBS with 92% confidence score.',
      },
      {
        id: `AUD-${base.id}-03`,
        timestamp: '2026-08-01 10:00:00',
        actor: 'Rajesh Sharma',
        role: 'manager',
        action: 'SCHEDULE_BASELINE_IMPORTED',
        actionCategory: 'Schedule Import',
        objectType: 'SCHEDULE_ACTIVITY',
        objectId: base.id,
        objectTitle: base.name,
        whatChanged: 'Activity created in Rev 3.2 (P6 XML) Baseline Schedule',
        previousValue: 'None',
        newValue: `WBS ${base.wbs} (${base.plannedQuantity} ${base.unit})`,
        before: 'Draft Schedule',
        after: 'Baseline Rev 3.2 (P6 XML) Activated',
        details: 'Imported from Primavera P6 XML master export with full CPM predecessor logic intact.',
      }
    );
  }

  return {
    activity: base,
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    projectCode: 'PRJ-OIL-2026-01',
    location: 'Duliajan Field, Dibrugarh, Upper Assam',
    hierarchy,
    linkedExecutionEvents,
    linkedEvidenceItems,
    detailedPredecessors,
    detailedSuccessors,
    impactData,
    auditHistory,
  };
}
