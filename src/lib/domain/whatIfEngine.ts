import { DisciplineType } from '../../types';

export interface SimulatorActivity {
  id: string;
  name: string;
  wbs: string;
  discipline: DisciplineType;
  area: string;
  line?: string;
  plannedStart: string;
  plannedFinish: string;
  totalFloat: number; // in days
  freeFloat: number; // in days
  isCritical: boolean;
  isMilestone?: boolean;
  predecessors: string[]; // activity IDs
  successors: string[]; // activity IDs
  assignedEngineer: string;
  description: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  sourceActivityId: string;
  delayDays: number;
  optionalDateChange?: string;
  createdAt: string;
  createdBy: string;
  description?: string;
  tags: string[];
}

export interface SimulatedActivityShift {
  activityId: string;
  name: string;
  wbs: string;
  discipline: DisciplineType;
  area: string;
  isCritical: boolean;
  isMilestone?: boolean;
  currentDate: string; // original planned finish
  simulatedDate: string; // new projected finish
  shiftDays: number;
  floatAvailable: number;
  floatConsumed: number;
  pathImpact: 'Critical Path Slip' | 'Float Buffer Consumed' | 'Accelerated Recovery' | 'Unaffected';
  predecessorReason: string;
  dependencyType: 'FS +0d' | 'SS +1d' | 'FF +0d';
}

export interface DependencyChainNode {
  id: string;
  name: string;
  discipline: DisciplineType;
  currentFinish: string;
  simulatedFinish: string;
  shiftDays: number;
  isCritical: boolean;
  isMilestone?: boolean;
  relationshipToNext?: string;
}

export interface MilestoneShift {
  id: string;
  name: string;
  currentDate: string;
  simulatedDate: string;
  shiftDays: number;
  isCritical: boolean;
  status: 'On Target' | 'Minor Delay' | 'Critical Slip' | 'Accelerated';
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  sourceActivity: SimulatorActivity;
  delayDays: number;
  optionalDateChange?: string;
  currentProjectFinish: string;
  simulatedProjectFinish: string;
  differenceDays: number;
  criticalPathPenetrated: boolean;
  totalFloatConsumed: number;
  affectedActivitiesCount: number;
  affectedActivities: SimulatedActivityShift[];
  dependencyChain: DependencyChainNode[];
  milestones: MilestoneShift[];
  impactSummary: {
    headline: string;
    downstreamNarrative: string;
    criticalPathAssessment: string;
    floatAbsorptionNote: string;
    mitigationSuggestions: string[];
  };
}

export const SIMULATION_ACTIVITIES: SimulatorActivity[] = [
  {
    id: 'PIP-24-001',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: [],
    successors: ['PIP-24-002'],
    assignedEngineer: 'Debajit Borah',
    description: 'Erection of prefabricated 24-inch spool pieces on piperack section B.',
  },
  {
    id: 'PIP-24-002',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-12',
    plannedFinish: '2026-09-18',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-04-015'],
    assignedEngineer: 'Debajit Borah',
    description: 'Field butt welding and 100% radiographic inspection of Line 24-XX joints.',
  },
  {
    id: 'PIP-24-003',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['PIP-24-002'],
    successors: ['PIP-24-004'],
    assignedEngineer: 'Debajit Borah',
    description: 'Hydrostatic pressure integrity validation at 1.5x design pressure.',
  },
  {
    id: 'PIP-24-004',
    name: 'Chemical Cleaning, De-greasing & Nitrogen Purging',
    wbs: '1.1.3.2.4',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-23',
    plannedFinish: '2026-09-26',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['PIP-24-003'],
    successors: ['COM-99-001'],
    assignedEngineer: 'Debajit Borah',
    description: 'Post-hydrotest line drying, chemical pickling, and preservation blanket.',
  },
  {
    id: 'CIV-11-001',
    name: 'Foundation Block A - Compressor Pedestal Pour',
    wbs: '1.1.1.1.1',
    discipline: 'Civil',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-10-01',
    plannedFinish: '2026-10-15',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: [],
    successors: ['STR-02-004'],
    assignedEngineer: 'S. Ramanathan',
    description: 'Reinforced concrete foundation pedestal for 3.5MW compressor package.',
  },
  {
    id: 'STR-02-004',
    name: 'Column Installation',
    wbs: '1.1.1.2.1',
    discipline: 'Civil',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-10-16',
    plannedFinish: '2026-10-25',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['CIV-11-001'],
    successors: ['MEC-03-010'],
    assignedEngineer: 'S. Ramanathan',
    description: 'Structural steel column erection on foundation block A pedestals.',
  },
  {
    id: 'MEC-03-010',
    name: 'Equipment Installation',
    wbs: '1.1.2.4.1',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-10-26',
    plannedFinish: '2026-11-10',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['STR-02-004'],
    successors: ['ELE-11-032'],
    assignedEngineer: 'Debajit Borah',
    description: 'Centrifugal compressor casing and skid equipment positioning and anchor bolting.',
  },
  {
    id: 'ELE-11-032',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '1.1.4.1.2',
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-09-23',
    totalFloat: 3,
    freeFloat: 3,
    isCritical: false,
    predecessors: ['MEC-03-010'],
    successors: ['INS-04-015'],
    assignedEngineer: 'K. Narayanan',
    description: 'Hot-dip galvanized ladder cable trays along structural steel gallery.',
  },
  {
    id: 'INS-04-015',
    name: 'Calibrate Pressure Transmitter PT-2401 & Loop Check',
    wbs: '1.1.5.2.1',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-22',
    plannedFinish: '2026-09-28',
    totalFloat: 2,
    freeFloat: 0,
    isCritical: false,
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: ['COM-99-001'],
    assignedEngineer: 'Debajit Borah',
    description: 'Installation and impulse tubing of smart transmitters on Line 24-XX header.',
  },
  {
    id: 'COM-99-001',
    name: 'Integrated Loop Checks & Gas-In Commissioning',
    wbs: '1.1.6.1.1',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-29',
    plannedFinish: '2026-10-10',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    predecessors: ['PIP-24-004', 'INS-04-015'],
    successors: ['MLS-100-COD'],
    assignedEngineer: 'Debajit Borah',
    description: 'Cold and hot commissioning sequence with interlock simulation tests.',
  },
  {
    id: 'MLS-100-COD',
    name: 'Key Project Milestone: Commercial Operation Date (COD)',
    wbs: '1.0.0.0.1',
    discipline: 'Mechanical',
    area: 'Entire Facility',
    plannedStart: '2026-12-15',
    plannedFinish: '2026-12-15',
    totalFloat: 0,
    freeFloat: 0,
    isCritical: true,
    isMilestone: true,
    predecessors: ['COM-99-001'],
    successors: [],
    assignedEngineer: 'Rajesh Sharma',
    description: 'Contractual completion date for gas processing plant handover to Oil India Limited.',
  },
];

export const DEFAULT_SAVED_SCENARIOS: SimulationScenario[] = [
  {
    id: 'SCN-2026-001',
    name: 'Foundation Block A Curing Hold (+4d)',
    sourceActivityId: 'CIV-11-001',
    delayDays: 4,
    createdAt: '2026-09-18 10:00',
    createdBy: 'Rajesh Sharma (Project Controls Lead)',
    description: 'Simulates 4-day curing hold on Foundation Block A (15 Oct to 19 Oct) affecting downstream Column Installation and Equipment Installation.',
    tags: ['Civil', 'Foundation', 'Equipment'],
  },
  {
    id: 'SCN-2026-002',
    name: 'Monsoon Heavy Rain Slip on HP Gas Header',
    sourceActivityId: 'PIP-24-001',
    delayDays: 7,
    createdAt: '2026-09-17 14:30',
    createdBy: 'Debajit Borah (Lead Site Engineer)',
    description: 'Tests 7-day torrential rain suspension on pipe erection and evaluates downstream COD exposure.',
    tags: ['Weather', 'Critical Path', 'Piping'],
  },
  {
    id: 'SCN-2026-003',
    name: 'Fast-Track Double-Shift Welding Crew Recovery',
    sourceActivityId: 'PIP-24-002',
    delayDays: -3,
    createdAt: '2026-09-18 09:45',
    createdBy: 'S. Ramanathan (Planning Lead)',
    description: 'Simulates crash acceleration by mobilizing a second mobile NDT inspection crew.',
    tags: ['Recovery', 'Acceleration', 'Mitigation'],
  },
];

/**
 * Helper to add days to a date string (YYYY-MM-DD)
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Format date for friendly UI presentation (e.g. "15 Sep 2026")
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format short date (e.g. "15 Oct")
 */
export function formatShortDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
}

/**
 * Deterministic CPM Forward-Pass Simulation Engine.
 * Evaluates schedule network topologies without writing to master schedule.
 */
export function executeWhatIfSimulation(
  scenarioName: string,
  sourceActivityId: string,
  delayDays: number,
  optionalDateChange?: string,
  activities: SimulatorActivity[] = SIMULATION_ACTIVITIES
): SimulationResult {
  const activityMap = new Map<string, SimulatorActivity>(activities.map((a) => [a.id, { ...a }]));
  const source = activityMap.get(sourceActivityId);

  if (!source) {
    throw new Error(`Source activity '${sourceActivityId}' not found in project schedule.`);
  }

  // Calculate actual delay days from optionalDateChange if supplied
  let calculatedDelayDays = delayDays;
  if (optionalDateChange && optionalDateChange !== source.plannedFinish) {
    const orig = new Date(source.plannedFinish).getTime();
    const targeted = new Date(optionalDateChange).getTime();
    calculatedDelayDays = Math.round((targeted - orig) / (1000 * 60 * 60 * 24));
  }

  const BASELINE_COD = '2026-12-15';
  const shiftsMap = new Map<string, SimulatedActivityShift>();

  // Queue for BFS traversal through successor network
  // Each element carries the current accumulated delay reaching that node
  const queue: Array<{ id: string; incomingDelay: number; predId: string }> = [
    { id: source.id, incomingDelay: calculatedDelayDays, predId: '' },
  ];

  let criticalPenetration = false;
  let maxProjectSlipDays = 0;
  let totalFloatConsumedSum = 0;

  // Process source activity first
  const sourceNewFinish = addDaysToDateString(source.plannedFinish, calculatedDelayDays);
  const sourcePathImpact = calculatedDelayDays > 0
    ? (source.isCritical ? 'Critical Path Slip' : 'Float Buffer Consumed')
    : calculatedDelayDays < 0
    ? 'Accelerated Recovery'
    : 'Unaffected';

  shiftsMap.set(source.id, {
    activityId: source.id,
    name: source.name,
    wbs: source.wbs,
    discipline: source.discipline,
    area: source.area,
    isCritical: source.isCritical,
    isMilestone: source.isMilestone,
    currentDate: source.plannedFinish,
    simulatedDate: sourceNewFinish,
    shiftDays: calculatedDelayDays,
    floatAvailable: source.totalFloat,
    floatConsumed: Math.min(Math.max(0, calculatedDelayDays), source.totalFloat),
    pathImpact: sourcePathImpact,
    predecessorReason: 'Scenario source perturbation trigger',
    dependencyType: 'FS +0d',
  });

  if (source.isCritical && calculatedDelayDays > 0) {
    criticalPenetration = true;
    maxProjectSlipDays = Math.max(maxProjectSlipDays, calculatedDelayDays);
  } else if (source.isCritical && calculatedDelayDays < 0) {
    maxProjectSlipDays = calculatedDelayDays; // acceleration
  }

  // Traverse downstream network
  const visited = new Set<string>([source.id]);

  while (queue.length > 0) {
    const item = queue.shift()!;
    const curr = activityMap.get(item.id);
    if (!curr) continue;

    for (const succId of curr.successors) {
      const succ = activityMap.get(succId);
      if (!succ) continue;

      // Determine propagation slip
      let effectiveSlip = item.incomingDelay;

      // If successor has float and delay is positive, float absorbs part or all of delay
      let floatConsumedForSucc = 0;
      if (effectiveSlip > 0) {
        if (!succ.isCritical && succ.totalFloat > 0) {
          floatConsumedForSucc = Math.min(effectiveSlip, succ.totalFloat);
          totalFloatConsumedSum += floatConsumedForSucc;
          effectiveSlip = Math.max(0, effectiveSlip - succ.totalFloat);
        }
      }

      const origSuccFinish = succ.plannedFinish;
      const simSuccFinish = addDaysToDateString(origSuccFinish, effectiveSlip);

      let succImpact: SimulatedActivityShift['pathImpact'] = 'Unaffected';
      if (effectiveSlip > 0) {
        succImpact = succ.isCritical || effectiveSlip > succ.totalFloat ? 'Critical Path Slip' : 'Float Buffer Consumed';
      } else if (effectiveSlip < 0) {
        succImpact = 'Accelerated Recovery';
      }

      shiftsMap.set(succ.id, {
        activityId: succ.id,
        name: succ.name,
        wbs: succ.wbs,
        discipline: succ.discipline,
        area: succ.area,
        isCritical: succ.isCritical,
        isMilestone: succ.isMilestone,
        currentDate: origSuccFinish,
        simulatedDate: simSuccFinish,
        shiftDays: effectiveSlip,
        floatAvailable: succ.totalFloat,
        floatConsumed: floatConsumedForSucc,
        pathImpact: succImpact,
        predecessorReason: `Constrained by finish of predecessor ${curr.id} (${curr.name})`,
        dependencyType: 'FS +0d',
      });

      if (succ.isCritical) {
        if (effectiveSlip > 0) {
          criticalPenetration = true;
          maxProjectSlipDays = Math.max(maxProjectSlipDays, effectiveSlip);
        } else if (effectiveSlip < 0) {
          maxProjectSlipDays = Math.min(maxProjectSlipDays, effectiveSlip);
        }
      }

      if (!visited.has(succ.id)) {
        visited.add(succ.id);
        queue.push({ id: succ.id, incomingDelay: effectiveSlip, predId: curr.id });
      }
    }
  }

  // Calculate project finish dates
  const simulatedCOD = addDaysToDateString(BASELINE_COD, maxProjectSlipDays);

  // Build sequential dependency chain visualization
  const chainNodes: DependencyChainNode[] = [];
  let currChainId: string | undefined = source.id;
  const chainVisited = new Set<string>();

  while (currChainId && !chainVisited.has(currChainId)) {
    chainVisited.add(currChainId);
    const act = activityMap.get(currChainId);
    if (!act) break;

    const shift = shiftsMap.get(act.id);
    const nextSuccId = act.successors[0];

    chainNodes.push({
      id: act.id,
      name: act.name,
      discipline: act.discipline,
      currentFinish: act.plannedFinish,
      simulatedFinish: shift ? shift.simulatedDate : act.plannedFinish,
      shiftDays: shift ? shift.shiftDays : 0,
      isCritical: act.isCritical,
      isMilestone: act.isMilestone,
      relationshipToNext: nextSuccId ? 'FS +0d' : undefined,
    });

    currChainId = nextSuccId;
  }

  // Key Milestones status
  const milestones: MilestoneShift[] = [
    {
      id: 'MLS-01-HYDRO',
      name: 'Hydrotest Acceptance Section Line 24',
      currentDate: '2026-09-22',
      simulatedDate: addDaysToDateString('2026-09-22', shiftsMap.get('PIP-24-003')?.shiftDays || 0),
      shiftDays: shiftsMap.get('PIP-24-003')?.shiftDays || 0,
      isCritical: true,
      status: (shiftsMap.get('PIP-24-003')?.shiftDays || 0) > 0 ? 'Critical Slip' : (shiftsMap.get('PIP-24-003')?.shiftDays || 0) < 0 ? 'Accelerated' : 'On Target',
    },
    {
      id: 'MLS-02-GASIN',
      name: 'Gas-In & System Ready for Hydrocarbon Feed',
      currentDate: '2026-10-10',
      simulatedDate: addDaysToDateString('2026-10-10', shiftsMap.get('COM-99-001')?.shiftDays || 0),
      shiftDays: shiftsMap.get('COM-99-001')?.shiftDays || 0,
      isCritical: true,
      status: (shiftsMap.get('COM-99-001')?.shiftDays || 0) > 0 ? 'Critical Slip' : (shiftsMap.get('COM-99-001')?.shiftDays || 0) < 0 ? 'Accelerated' : 'On Target',
    },
    {
      id: 'MLS-100-COD',
      name: 'Commercial Operation Date (COD)',
      currentDate: BASELINE_COD,
      simulatedDate: simulatedCOD,
      shiftDays: maxProjectSlipDays,
      isCritical: true,
      status: maxProjectSlipDays > 0 ? 'Critical Slip' : maxProjectSlipDays < 0 ? 'Accelerated' : 'On Target',
    },
  ];

  // Synthesize impact narrative
  let headline = '';
  let downstreamNarrative = '';
  let criticalAssessment = '';
  let floatNote = '';
  const mitigations: string[] = [];

  const affectedList = Array.from(shiftsMap.values()).filter((s) => s.activityId !== source.id);

  if (calculatedDelayDays > 0) {
    if (criticalPenetration) {
      headline = `Critical Path Penetrated: Project Commercial Completion shifts by +${maxProjectSlipDays} days`;
      downstreamNarrative = `A delay of +${calculatedDelayDays} days on source activity ${source.id} (${source.name}) directly cascades through ${affectedList.length} downstream successors. Because this activity lies on the zero-float critical path, the delay fully transmits to milestone COD.`;
      criticalAssessment = `Zero total float available on this path. Every day of delay on ${source.id} equates to 1:1 contractual completion slippage from ${formatFriendlyDate(BASELINE_COD)} to ${formatFriendlyDate(simulatedCOD)}.`;
      floatNote = 'Zero buffer remaining. Total float = 0 days.';
      mitigations.push(`Mobilize second welding & inspection shift on ${source.id} to compress duration by 40%.`);
      mitigations.push(`Re-sequence downstream NDT to run concurrently with spool tie-ins instead of sequential Finish-to-Start.`);
      mitigations.push(`Pre-fabricate instrument impulse tubes in vendor shop prior to field spool erection.`);
    } else {
      headline = `Float Buffer Absorbed: Zero slip on Project Completion Date (${formatFriendlyDate(BASELINE_COD)})`;
      downstreamNarrative = `A delay of +${calculatedDelayDays} days on ${source.id} (${source.name}) was absorbed by available path float (${source.totalFloat} days available). Downstream critical milestones remain protected.`;
      criticalAssessment = `Non-critical activity chain. Total float decreased from ${source.totalFloat} days to ${Math.max(0, source.totalFloat - calculatedDelayDays)} days.`;
      floatNote = `Float consumed: ${Math.min(calculatedDelayDays, source.totalFloat)} days. Remaining buffer: ${Math.max(0, source.totalFloat - calculatedDelayDays)} days.`;
      mitigations.push(`Monitor successor mechanical package alignment closely to prevent remaining float from eroding further.`);
    }
  } else if (calculatedDelayDays < 0) {
    const accDays = Math.abs(calculatedDelayDays);
    headline = `Fast-Track Acceleration: Project Completion pulled forward by ${accDays} days`;
    downstreamNarrative = `Crashing activity ${source.id} by ${accDays} days recovers critical path float and advances subsequent testing milestones to ${formatFriendlyDate(simulatedCOD)}.`;
    criticalAssessment = `Positive critical path delta. Creates an additional buffer of ${accDays} days ahead of scheduled commercial startup.`;
    floatNote = `Positive variance gained: ${accDays} days.`;
    mitigations.push(`Lock in subcontractor incentive agreements for sustaining accelerated double-shift productivity.`);
  } else {
    headline = 'Neutral Baseline Scenario: No variance applied';
    downstreamNarrative = 'Parameters match baseline schedule Rev 3.2 (P6 XML). All downstream activities remain at planned baseline dates.';
    criticalAssessment = 'Critical path remains stable.';
    floatNote = 'No float consumed.';
  }

  return {
    scenarioId: `SIM-${Date.now().toString().slice(-6)}`,
    scenarioName: scenarioName || `What-if Simulation: ${source.id} (${calculatedDelayDays >= 0 ? `+${calculatedDelayDays}d` : `${calculatedDelayDays}d`})`,
    sourceActivity: source,
    delayDays: calculatedDelayDays,
    optionalDateChange,
    currentProjectFinish: BASELINE_COD,
    simulatedProjectFinish: simulatedCOD,
    differenceDays: maxProjectSlipDays,
    criticalPathPenetrated: criticalPenetration,
    totalFloatConsumed: totalFloatConsumedSum,
    affectedActivitiesCount: affectedList.length,
    affectedActivities: affectedList,
    dependencyChain: chainNodes,
    milestones,
    impactSummary: {
      headline,
      downstreamNarrative,
      criticalPathAssessment: criticalAssessment,
      floatAbsorptionNote: floatNote,
      mitigationSuggestions: mitigations,
    },
  };
}
