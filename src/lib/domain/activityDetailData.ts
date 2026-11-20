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
import { CANONICAL_SCHEDULE_VERSION_LABEL, MASTER_CANONICAL_ACTIVITIES, getCanonicalActivity, CanonicalActivity } from './canonicalModels';

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
const EXTENDED_ACTIVITY_RECORDS: Record<string, Partial<ScheduleActivity>> = (() => {
  const map: Record<string, Partial<ScheduleActivity>> = {};
  for (const act of MASTER_CANONICAL_ACTIVITIES) {
    map[act.id] = {
      id: act.id,
      activityId: act.activityId,
      projectId: act.projectId,
      name: act.name,
      activityName: act.activityName,
      wbs: act.wbs,
      wbsLevel: act.wbsLevel,
      discipline: act.discipline,
      area: act.area,
      line: act.line,
      scheduleVersion: act.scheduleVersion,
      plannedStart: act.plannedStart,
      plannedFinish: act.plannedFinish,
      actualStart: act.actualStart,
      actualFinish: act.actualFinish,
      plannedProgress: act.plannedProgress,
      actualProgress: act.actualProgress,
      verifiedActualProgress: act.verifiedActualProgress,
      plannedQuantity: act.plannedQuantity,
      actualQuantity: act.actualQuantity,
      unit: act.unit,
      variance: act.variance,
      status: act.status,
      delayDays: act.delayDays,
      totalFloat: act.totalFloat,
      freeFloat: act.freeFloat,
      predecessors: act.predecessors,
      successors: act.successors,
      isCritical: act.isCritical,
      assignedEngineer: act.assignedEngineer,
      evidenceIds: act.evidenceIds,
      executionEventIds: act.executionEventIds,
      description: act.description,
      progressHistory: act.progressHistory,
      parentId: act.parentId,
    };
  }

  // Deep engineering detail overrides for focal activities
  if (map['PIP-24-002']) {
    map['PIP-24-002'].description = 'Field butt welding and 100% radiographic inspection of Line 24-XX joints (24\" High Pressure Natural Gas Header)';
    map['PIP-24-002'].line = 'Line 24-XX (24\" High Pressure Natural Gas Header)';
  }
  if (map['CIV-11-001']) {
    map['CIV-11-001'].description = 'Reinforced concrete foundation pedestal for 3.5MW compressor package with heavy anchor bolt cages and vibration damping pad';
  }
  if (map['MEC-08-003']) {
    map['MEC-08-003'].description = 'Precision laser shaft alignment of centrifugal compressor train and 6.6kV drive motor on Foundation Block A';
  }
  if (map['ELE-11-032']) {
    map['ELE-11-032'].description = 'Installation of 600mm heavy-duty hot-dip galvanized ladder-type cable trays across piperack elevation +6.5m';
  }
  if (map['INS-04-015']) {
    map['INS-04-015'].description = 'Field bracket mounting, impulse line hookup, 5-point bench calibration, and DCS loop wiring for Line 24-XX PT and TT smart transmitters';
  }

  return map;
})();

export function getEnrichedActivityDetail(activityId: string): EnrichedActivityDetail {
  // 1. Look up base activity with full fallback chain
  const fromExtended = EXTENDED_ACTIVITY_RECORDS[activityId];
  const fromCanonical = getCanonicalActivity(activityId);
  const fromMock = MOCK_ACTIVITIES.find((a) => a.id === activityId);

  const base: ScheduleActivity = {
    id: activityId,
    activityId: fromExtended?.activityId || fromCanonical?.activityId || activityId,
    projectId: fromExtended?.projectId || fromCanonical?.projectId || fromMock?.projectId || 'PRJ-OIL-2026-01',
    name: fromExtended?.name || fromCanonical?.name || fromMock?.name || `Activity ${activityId}`,
    activityName: fromExtended?.activityName || fromCanonical?.activityName || fromMock?.activityName || fromExtended?.name || fromCanonical?.name || `Activity ${activityId}`,
    wbs: fromExtended?.wbs || fromCanonical?.wbs || fromMock?.wbs || '1.1.3.2.2',
    wbsLevel: fromExtended?.wbsLevel || fromCanonical?.wbsLevel || fromMock?.wbsLevel || 'L5',
    discipline: fromExtended?.discipline || fromCanonical?.discipline || fromMock?.discipline || 'Piping',
    area: fromExtended?.area || fromCanonical?.area || fromMock?.area || 'Unit A - Gas Processing Area',
    line: fromExtended?.line || fromCanonical?.line || fromMock?.line || (activityId.includes('24') ? 'Line 24-XX' : undefined),
    scheduleVersion: fromExtended?.scheduleVersion || fromCanonical?.scheduleVersion || fromMock?.scheduleVersion || CANONICAL_SCHEDULE_VERSION_LABEL,
    plannedStart: fromExtended?.plannedStart || fromCanonical?.plannedStart || fromMock?.plannedStart || '2026-09-12',
    plannedFinish: fromExtended?.plannedFinish || fromCanonical?.plannedFinish || fromMock?.plannedFinish || '2026-09-18',
    actualStart: fromExtended?.actualStart ?? fromCanonical?.actualStart ?? fromMock?.actualStart ?? (fromExtended?.plannedStart || fromCanonical?.plannedStart || '2026-09-12'),
    actualFinish: fromExtended?.actualFinish ?? fromCanonical?.actualFinish ?? fromMock?.actualFinish,
    plannedProgress: fromExtended?.plannedProgress ?? fromCanonical?.plannedProgress ?? fromMock?.plannedProgress ?? 0,
    actualProgress: fromExtended?.actualProgress ?? fromCanonical?.actualProgress ?? fromMock?.actualProgress ?? 0,
    verifiedActualProgress: fromExtended?.verifiedActualProgress ?? fromCanonical?.verifiedActualProgress ?? fromMock?.verifiedActualProgress ?? fromExtended?.actualProgress ?? 0,
    plannedQuantity: fromExtended?.plannedQuantity ?? fromCanonical?.plannedQuantity ?? fromMock?.plannedQuantity ?? 1,
    actualQuantity: fromExtended?.actualQuantity ?? fromCanonical?.actualQuantity ?? fromMock?.actualQuantity ?? 0,
    unit: fromExtended?.unit || fromCanonical?.unit || fromMock?.unit || 'units',
    variance: fromExtended?.variance ?? fromCanonical?.variance ?? fromMock?.variance ?? 0,
    status: fromExtended?.status || fromCanonical?.status || fromMock?.status || 'pending',
    delayDays: fromExtended?.delayDays ?? fromCanonical?.delayDays ?? fromMock?.delayDays ?? 0,
    totalFloat: fromExtended?.totalFloat ?? fromCanonical?.totalFloat ?? (fromExtended?.isCritical ? 0 : 4),
    freeFloat: fromExtended?.freeFloat ?? fromCanonical?.freeFloat ?? (fromExtended?.isCritical ? 0 : 2),
    predecessors: fromExtended?.predecessors || fromCanonical?.predecessors || fromMock?.predecessors || [],
    successors: fromExtended?.successors || fromCanonical?.successors || fromMock?.successors || [],
    isCritical: fromExtended?.isCritical ?? fromCanonical?.isCritical ?? fromMock?.isCritical ?? false,
    assignedEngineer: fromExtended?.assignedEngineer || fromCanonical?.assignedEngineer || fromMock?.assignedEngineer || 'Debajit Borah',
    evidenceIds: fromExtended?.evidenceIds || fromCanonical?.evidenceIds || fromMock?.evidenceIds || [],
    executionEventIds: fromExtended?.executionEventIds || fromCanonical?.executionEventIds || fromMock?.executionEventIds || [],
    description:
      fromExtended?.description ||
      fromCanonical?.description ||
      fromMock?.description ||
      `Schedule execution activity ${activityId} under the Duliajan Gas Processing master baseline.`,
    progressHistory: fromExtended?.progressHistory || fromCanonical?.progressHistory || [],
    parentId: fromExtended?.parentId || fromCanonical?.parentId,
  };

  // 2. Derive L1-L6 WBS Hierarchy dynamically from master activities catalog
  const hierarchyMap: Record<WBSLevel, { category: string }> = {
    L1: { category: 'Project Baseline' },
    L2: { category: 'Major Facility Area' },
    L3: { category: 'Discipline Work Breakdown' },
    L4: { category: 'Sub-System Work Package' },
    L5: { category: 'Schedule Work Activity' },
    L6: { category: 'Discrete Field Task' },
  };

  // Build breadcrumb steps by walking up parent tree
  const hierarchySteps: WBSHierarchyStep[] = [];
  let currentAct: ScheduleActivity | CanonicalActivity | undefined = base;
  const visited = new Set<string>();

  while (currentAct && !visited.has(currentAct.id)) {
    visited.add(currentAct.id);
    hierarchySteps.unshift({
      level: currentAct.wbsLevel,
      code: currentAct.wbs,
      name: currentAct.name,
      category: hierarchyMap[currentAct.wbsLevel as WBSLevel]?.category || 'Work Item',
      isCurrent: currentAct.id === base.id,
    });
    if (currentAct.parentId) {
      currentAct = getCanonicalActivity(currentAct.parentId);
    } else {
      break;
    }
  }

  // Ensure root L1 is always represented
  if (hierarchySteps.length > 0 && hierarchySteps[0].level !== 'L1') {
    const root = getCanonicalActivity('PRJ-OIL-01');
    if (root) {
      hierarchySteps.unshift({
        level: 'L1',
        code: root.wbs,
        name: root.name,
        category: 'Project Baseline',
      });
    }
  }

  // If hierarchy has at least 1 item, use it; otherwise fallback to standard hierarchy
  const hierarchy: WBSHierarchyStep[] = hierarchySteps.length > 0 ? hierarchySteps : [
    {
      level: 'L1',
      code: '1.0',
      name: 'Duliajan Gas Processing & Pipeline Interconnect',
      category: 'Project Baseline',
    },
    {
      level: 'L2',
      code: '1.1',
      name: base.area,
      category: 'Major Facility Area',
    },
    {
      level: 'L3',
      code: '1.1.3',
      name: `${base.discipline} Systems & Infrastructure`,
      category: 'Discipline Work Breakdown',
    },
    {
      level: 'L4',
      code: '1.1.3.2',
      name: base.line ? `${base.line} Delivery Package` : 'Work Package',
      category: 'Sub-System Work Package',
    },
    {
      level: 'L5',
      code: base.wbs,
      name: base.name,
      category: 'Schedule Work Activity',
      isCurrent: true,
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

  // If none found, synthesize authentic verified field record
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
    const p = EXTENDED_ACTIVITY_RECORDS[predId] || getCanonicalActivity(predId) || MOCK_ACTIVITIES.find((a) => a.id === predId);
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
      isCritical: p?.isCritical ?? false,
      notes:
        predId === 'PIP-24-001'
          ? 'Completed 2 days late due to crane mobilization permit; pushed current activity start from 12 Sep to 14 Sep.'
          : 'Driving predecessor relationship with contractual network dependency.',
    };
  });

  const detailedSuccessors: DetailedDependency[] = base.successors.map((succId) => {
    const s = EXTENDED_ACTIVITY_RECORDS[succId] || getCanonicalActivity(succId) || MOCK_ACTIVITIES.find((a) => a.id === succId);
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
      isCritical: s?.isCritical ?? false,
      notes:
        succId === 'PIP-24-003'
          ? 'Cannot begin hydrostatic pressure test until 100% field welds and radiographic clearance are completed.'
          : 'Downstream execution milestone directly sequenced after this task.',
    };
  });

  // 6. Impact Data
  const impactData: DependencyImpactData = {
    totalFloatDays: base.totalFloat ?? (base.isCritical ? 0 : 4),
    freeFloatDays: base.freeFloat ?? (base.isCritical ? 0 : 2),
    isOnCriticalPath: base.isCritical,
    drivingPredecessorId: base.predecessors[0] || undefined,
    downstreamChain: [
      { id: base.id, name: base.name, shiftDays: base.delayDays, isCritical: base.isCritical },
      ...(base.successors.length > 0
        ? base.successors.map((sid) => ({
            id: sid,
            name: EXTENDED_ACTIVITY_RECORDS[sid]?.name || getCanonicalActivity(sid)?.name || `Successor ${sid}`,
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
      : `Activity has ${base.totalFloat ?? 4} days total float. Current variance is absorbed within buffer float and does not push commercial commissioning date.`,
    currentMitigation:
      base.id === 'PIP-24-002'
        ? 'Mobilized secondary welding team (Borah Crew 2) and accelerated NDT radiography crews during non-rain shifts.'
        : 'Daily monitoring by project controls team with automated progress verification.',
    recommendedAction:
      base.id === 'PIP-24-002'
        ? 'Authorise overtime for welder certified teams to close remaining 3.6 joints within next 48-hour window.'
        : 'Maintain daily physical progress tracking and verify DPR submissions.',
  };

  // 7. Audit History
  const auditHistory: AuditEntry[] = COMPREHENSIVE_AUDIT_LOGS.filter(
    (log) =>
      log.objectId === base.id ||
      (base.id === 'PIP-24-002' && (log.id === 'AUD-001' || log.id === 'AUD-002'))
  );

  if (auditHistory.length === 0) {
    auditHistory.push({
      id: `AUD-${base.id}-01`,
      timestamp: '18 Sep 2026, 17:30 IST',
      actor: base.assignedEngineer,
      role: 'engineer',
      action: 'Progress Verified',
      actionCategory: 'Approval',
      objectType: 'Activity',
      objectId: base.id,
      objectTitle: base.name,
      whatChanged: 'Verified Actual Progress',
      previousValue: `${Math.max(0, base.actualProgress - 5)}%`,
      newValue: `${base.actualProgress}%`,
      details: `Verified ${base.actualProgress}% completion against physical field measurement.`,
    });
  }

  return {
    activity: base,
    projectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    projectCode: 'PRJ-OIL-2026-01',
    location: 'Duliajan, Assam, India',
    hierarchy,
    linkedExecutionEvents,
    linkedEvidenceItems,
    detailedPredecessors,
    detailedSuccessors,
    impactData,
    auditHistory,
  };
}

