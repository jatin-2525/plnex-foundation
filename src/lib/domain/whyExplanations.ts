/**
 * PLnEX "Why?" Explanation Domain Engine
 *
 * Provides structured, transparent, non-black-box explanations for computed metrics:
 * 1. Why is this delayed? (Delay & critical path impact)
 * 2. Why is confidence 94%? (Multi-factor match scoring)
 * 3. Why is variance -7%? (Earned value planned vs actual progress)
 * 4. Why is this activity/schedule unhealthy? (DCMA 14-point schedule health)
 */

export type WhyExplanationType =
  | 'progress'
  | 'confidence'
  | 'health'
  | 'variance'
  | 'delay'
  | 'impact'
  | 'custom';

export interface WhyExplanationFactor {
  factor: string;
  contribution: string; // e.g., "+35%", "-7%", "Primary Driver", "+28.5%"
  reason: string;
  status?: 'positive' | 'negative' | 'neutral';
}

export interface WhyExplanationData {
  type: WhyExplanationType;
  title: string;
  subjectId: string;
  subjectName?: string;
  metricLabel: string;
  metricValue: string;
  summary: string;
  factors: WhyExplanationFactor[];
  algorithmOrRule?: string;
  timestamp?: string;
  recommendation?: string;
}

export const WHY_EXPLANATION_PRESETS: Record<string, WhyExplanationData> = {
  // 0. PROGRESS EXPLANATION (Verified Progress 73.0% vs Baseline 80.0%)
  'progress:verified': {
    type: 'progress',
    title: 'Verified Progress Breakdown',
    subjectId: 'PRJ-OIL-2026-01',
    subjectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    metricLabel: 'Verified Progress',
    metricValue: '73.0% (Verified Actual)',
    summary:
      'Verified physical progress has reached 73.0% substantiated by 14 signed-off daily execution reports and field inspections, against the CPM baseline target of 80.0% as of 18 Sep 2026, 17:30 IST.',
    factors: [
      {
        factor: 'Piping Erection & Field Welds (WBS 1.1.3)',
        contribution: '+33.1% Scope Contribution',
        reason: '8.4 of 12 planned spool packages erected on Piperack Section B with 75T crane support.',
        status: 'positive',
      },
      {
        factor: 'Civil Foundations & Pedestals (WBS 1.1.1)',
        contribution: '+24.0% Scope Contribution',
        reason: 'Compressor foundation block and equipment pedestals 100% completed and QA signed-off.',
        status: 'positive',
      },
      {
        factor: 'Electrical Cable Tray Galleries (WBS 1.1.4)',
        contribution: '+9.2% Scope Contribution',
        reason: '120 meters of overhead cantilever ladder tray mounted along column line 4.',
        status: 'positive',
      },
      {
        factor: 'Mechanical Skid Alignment (WBS 1.1.2)',
        contribution: '+6.7% Scope Contribution',
        reason: 'Compressor skid C-101 positioned and anchored; preliminary laser alignment verified.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'Physical Work Breakdown Earned Value (Weighted Sum of Verified Milestones)',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Complete radiography testing clearance on remaining Line 24 joints to convert 3.6 units into verified progress.',
  },
  // 1. DELAY EXPLANATION (Line 24 Critical Path)
  'delay:PIP-24-002': {
    type: 'delay',
    title: 'Delay Root-Cause Analysis',
    subjectId: 'PIP-24-002',
    subjectName: 'Weld Line 24-XX Field Joints & NDT Clearance',
    metricLabel: 'Schedule Delay',
    metricValue: '+2 Days Slip (Critical Path)',
    summary:
      'The 2-day slip on Line 24-XX is driven primarily by upstream predecessor handover lag (+1.5d) compounded by a weather-induced NDT radiography hold (+0.5d). Because this activity is on Critical Path 1 (Total Float = 0), every day of slip directly delays downstream Hydro-Test PIP-24-003.',
    factors: [
      {
        factor: 'Predecessor Slip (PIP-24-001 Erection)',
        contribution: '+1.5 Days (75% of delay)',
        reason: 'Line 24-XX pipe spools arrived with fit-up bevel tolerance issues requiring on-site re-machining, delaying erection handover.',
        status: 'negative',
      },
      {
        factor: 'High-Humidity Hold for Radiography (NDT)',
        contribution: '+0.5 Days (25% of delay)',
        reason: 'Relative humidity exceeded 85% at Duliajan plant area on 17 Sep evening; non-destructive testing was safely paused to comply with ASME B31.3 standards.',
        status: 'negative',
      },
      {
        factor: 'Downstream Float Buffer',
        contribution: '0 Days (No Absorption)',
        reason: 'Activity is on Critical Path CP-01 with 0 hours of available float before Hydro-test package commissioning.',
        status: 'negative',
      },
    ],
    algorithmOrRule: 'Critical Path Method (CPM) Forward Pass with Primavera P6 XML Float Ledger',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Deploy secondary welding crew for morning shift to clear remaining 3.6 joints before the 19 Sep hydro-test testing window.',
  },

  // 2. VARIANCE EXPLANATION (Earned Value -7% / -15%)
  'variance:portfolio': {
    type: 'variance',
    title: 'Progress Variance Breakdown',
    subjectId: 'PRJ-OIL-2026-01',
    subjectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    metricLabel: 'Schedule Variance',
    metricValue: '-7.0% Overall (-15% Critical Piping)',
    summary:
      'Cumulative Earned Value (EV) stands at 73.0% verified actuals against a planned schedule baseline (PV) of 80.0% (-7.0% overall variance) as of 18 Sep 2026, 17:30 IST reporting cutoff. Critical path activity PIP-24-002 drives the greatest variance (70% actual vs 85% planned, -15% activity variance).',
    factors: [
      {
        factor: 'Piping Erection & Welding (WBS 1.1.3)',
        contribution: '-10.5% Variance Drag',
        reason: 'Planned progress was 85% (10.2 joints target); verified actual progress is 70% (8.4 joints). 3.6 joints lag behind schedule.',
        status: 'negative',
      },
      {
        factor: 'Electrical Cable Tray Galleries (WBS 1.1.4)',
        contribution: '-3.5% Variance Drag',
        reason: 'Cable tray installation reached 40% actual vs 50% planned; conduit access awaiting compressor skid clearance.',
        status: 'negative',
      },
      {
        factor: 'Civil Foundations & Pedestals (WBS 1.1.1)',
        contribution: '+7.0% Offset Buffer',
        reason: 'Foundations and equipment pedestals completed at 100% on schedule, buffering total project variance from wider slippage.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'Earned Value Management Formula: Schedule Variance (SV%) = (Earned % - Planned %) / Planned %',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Reconcile 6 pending field events in Review Queue; confirming 3 pending welding reports will immediately recover +4.2% of verified actual progress.',
  },

  // 3. CONFIDENCE EXPLANATION (94% Suggested Match)
  'confidence:EVT-2026-001': {
    type: 'confidence',
    title: 'Confidence Scoring Factors',
    subjectId: 'EVT-2026-001',
    subjectName: 'Line 24-XX Spool Joint Welding Observation',
    metricLabel: 'Match Confidence',
    metricValue: '94% (High Confidence)',
    summary:
      'The field observation statement ("Completed 4 welds on Line 24 high-pressure joint") was matched to Activity PIP-24-002 with 94% composite confidence across 5 industrial feature dimensions.',
    factors: [
      {
        factor: 'Activity Keywords Alignment',
        contribution: '+35% (Max: 35%)',
        reason: 'Exact matches for industrial terminology: "weld", "field joint", and "Line 24".',
        status: 'positive',
      },
      {
        factor: 'Area & Line Identification',
        contribution: '+25% (Max: 25%)',
        reason: 'Site area "Unit A - Piperack Section B" matches the Primavera P6 schedule location code exactly.',
        status: 'positive',
      },
      {
        factor: 'Discipline Compatibility',
        contribution: '+20% (Max: 20%)',
        reason: 'Observation classified as Piping; matched activity discipline is Piping (100% semantic match).',
        status: 'positive',
      },
      {
        factor: 'Context & Date Proximity',
        contribution: '+8% (Max: 10%)',
        reason: 'Work executed on 18 Sep falls directly inside the planned activity window (16 Sep – 20 Sep 2026).',
        status: 'positive',
      },
      {
        factor: 'Project WBS Proximity',
        contribution: '+6% (Max: 10%)',
        reason: 'Matches WBS element 1.1.3.2.2 with parent package concordance.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'PLnEX Multi-factor Heuristic Engine v2.4 (Deterministic Feature Scoring)',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'High confidence (≥85%) exceeds threshold for 1-click planner approval in Review Queue.',
  },

  // 4. SCHEDULE HEALTH EXPLANATION (78/100 DCMA Check)
  'health:PRJ-OIL-2026-01': {
    type: 'health',
    title: 'DCMA 14-Point Schedule Health Breakdown',
    subjectId: 'PRJ-OIL-2026-01',
    subjectName: 'Duliajan Gas Processing & Pipeline Interconnect',
    metricLabel: 'Schedule Health',
    metricValue: '78 / 100 (5 Integrity Warnings)',
    summary:
      'Schedule health is evaluated against the US Department of Defense DCMA 14-point industry standard for Primavera P6 logic validity, float anomalies, and relationship integrity.',
    factors: [
      {
        factor: 'Dangling Activity Logic (Missing Successor)',
        contribution: '-10 Points',
        reason: 'Activity INS-02-005 (Instrumentation Loop Tubing) has no driving finish-to-start successor assigned.',
        status: 'negative',
      },
      {
        factor: 'Negative Total Float on Critical Path',
        contribution: '-8 Points',
        reason: 'Total float on Line 24-XX critical path slipped to -2 days, violating the 0 float baseline rule.',
        status: 'negative',
      },
      {
        factor: 'Hard Date Constraints',
        contribution: '-4 Points',
        reason: '2 activities contain "Mandatory Finish" constraints that artificially distort natural network float calculation.',
        status: 'negative',
      },
      {
        factor: 'High Lags & Leads',
        contribution: '0 Points (Compliant)',
        reason: 'All relationship lags are under the 5-day ceiling, satisfying DCMA Check #5.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'DCMA 14-Point Schedule Assessment Protocol v3.2 & Primavera P6 Logic Verifier',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Link INS-02-005 to Pre-Commissioning package and relax hard constraints to restore natural schedule float.',
  },

  // 5. IMPACT EXPLANATIONS (Downstream & Critical Path Cascade)
  'impact:CIV-11-001': {
    type: 'impact',
    title: 'Downstream Schedule Impact Assessment',
    subjectId: 'CIV-11-001',
    subjectName: 'Foundation Block A',
    metricLabel: 'Critical Path Impact',
    metricValue: '+5 Days Downstream Delay',
    summary:
      'A 5-day execution slip on Foundation Block A propagates directly along Critical Path 1, postponing structural steel and mechanical placement milestones by 5 days.',
    factors: [
      {
        factor: 'Activity A: Column Baseplate Preparation',
        contribution: '+2 Days Successor Lag',
        reason: 'Direct Finish-to-Start successor held until curing reaches 28-day target strength.',
        status: 'negative',
      },
      {
        factor: 'Activity B: Column Installation',
        contribution: '+3 Days Crane Re-slotting',
        reason: 'Structural erection crane mobilization shifted to accommodate delayed foundation handover.',
        status: 'negative',
      },
      {
        factor: 'Activity C: Equipment Installation',
        contribution: '+5 Days Net Project Slip',
        reason: 'Heavy compressor placement delayed day-for-day because total float is 0.',
        status: 'negative',
      },
      {
        factor: 'Critical Path Float Buffer',
        contribution: '0 Days (Driving Chain)',
        reason: 'Zero total float available along Path CP-01; no absorption possible.',
        status: 'negative',
      },
    ],
    algorithmOrRule: 'CPM Forward Pass & Successor Cascade Matrix',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Mobilize rapid-curing accelerator mix and double-shift column rigger crew to recover 2 days.',
  },
  'impact:DLY-CIV-01': {
    type: 'impact',
    title: 'Downstream Schedule Impact Assessment',
    subjectId: 'CIV-11-001',
    subjectName: 'Foundation Block A',
    metricLabel: 'Critical Path Impact',
    metricValue: '+5 Days Downstream Delay',
    summary:
      'A 5-day execution slip on Foundation Block A propagates directly along Critical Path 1, postponing structural steel and mechanical placement milestones by 5 days.',
    factors: [
      {
        factor: 'Activity A: Column Baseplate Preparation',
        contribution: '+2 Days Successor Lag',
        reason: 'Direct Finish-to-Start successor held until curing reaches 28-day target strength.',
        status: 'negative',
      },
      {
        factor: 'Activity B: Column Installation',
        contribution: '+3 Days Crane Re-slotting',
        reason: 'Structural erection crane mobilization shifted to accommodate delayed foundation handover.',
        status: 'negative',
      },
      {
        factor: 'Activity C: Equipment Installation',
        contribution: '+5 Days Net Project Slip',
        reason: 'Heavy compressor placement delayed day-for-day because total float is 0.',
        status: 'negative',
      },
      {
        factor: 'Critical Path Float Buffer',
        contribution: '0 Days (Driving Chain)',
        reason: 'Zero total float available along Path CP-01; no absorption possible.',
        status: 'negative',
      },
    ],
    algorithmOrRule: 'CPM Forward Pass & Successor Cascade Matrix',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Mobilize rapid-curing accelerator mix and double-shift column rigger crew to recover 2 days.',
  },
  'impact:what-if': {
    type: 'impact',
    title: 'Simulated Schedule Impact Analysis',
    subjectId: 'SIM-SCENARIO-01',
    subjectName: 'Foundation +4 Days Simulation',
    metricLabel: 'Simulated Impact',
    metricValue: '+4 Days Critical Path Slip',
    summary:
      'Injecting a hypothetical +4 days delay into Foundation Block A propagates through the critical chain, moving projected completion from 15 Oct to 19 Oct.',
    factors: [
      {
        factor: 'Hypothetical Delay Source',
        contribution: '+4 Days Direct Driver',
        reason: 'User simulated a 4-day slippage on Foundation Block A execution.',
        status: 'negative',
      },
      {
        factor: 'Critical Predecessor Succession',
        contribution: '+4 Days Cascade',
        reason: 'Successor column installation and equipment setting inherit the delay day-for-day.',
        status: 'negative',
      },
      {
        factor: 'Available Float Absorption',
        contribution: '0 Days Absorbed',
        reason: 'Zero total float along Path CP-01 prevents schedule buffer absorption.',
        status: 'negative',
      },
    ],
    algorithmOrRule: 'Interactive CPM Forward Simulation (Isolated Sandbox)',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Explore crashing downstream piping spools to pull the 19 Oct simulated date back to 15 Oct.',
  },
  'impact:forecast': {
    type: 'impact',
    title: 'Projected Completion Impact',
    subjectId: 'PROJECT-COMPLETION',
    subjectName: 'Commercial Handover Milestone',
    metricLabel: 'Forecast Variance',
    metricValue: '+4 Days Slip (15 Dec 2026)',
    summary:
      'Current cumulative execution delays on critical piping and civil packages indicate an unmitigated 4-day forecast delay to overall project handover.',
    factors: [
      {
        factor: 'Critical Piping Line 24',
        contribution: '+2.5 Days Drag',
        reason: 'Welding and NDT testing pace lagging behind baseline.',
        status: 'negative',
      },
      {
        factor: 'Civil Foundation Handoff',
        contribution: '+1.5 Days Drag',
        reason: 'Curing hold delayed mechanical skid positioning.',
        status: 'negative',
      },
      {
        factor: 'Schedule Compression Option',
        contribution: '-2.0 Days Potential Recovery',
        reason: 'Fast-tracking electrical instrumentation testing can recover 2 days.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'CPM Completion Forecast Ledger',
    timestamp: '18 Sep 2026, 17:30 IST',
    recommendation:
      'Execute recovery shifts on Line 24 field butt joints before monsoon window intensifies.',
  },
};

export function getWhyExplanation(key: string, fallbackSubjectId?: string): WhyExplanationData {
  if (WHY_EXPLANATION_PRESETS[key]) {
    return WHY_EXPLANATION_PRESETS[key];
  }

  // Derive dynamic explanation if key is typed
  if (key.startsWith('progress:')) {
    const id = key.replace('progress:', '');
    return {
      type: 'progress',
      title: 'Verified Progress Breakdown',
      subjectId: id || 'PROGRESS',
      subjectName: id ? `Activity ${id}` : 'Physical Progress Metric',
      metricLabel: 'Verified Progress',
      metricValue: '73.0% Verified',
      summary: `Verified progress is calculated by aggregating engineer-attested field logs, survey measurements, and physical deliverables against baseline scope.`,
      factors: [
        {
          factor: 'Attested Field Quantities',
          contribution: 'Primary Driver',
          reason: 'Substantiated by verified daily progress reports and QC sign-offs.',
          status: 'positive',
        },
        {
          factor: 'WBS Scope Weighting',
          contribution: 'Baseline Weighted',
          reason: 'Aggregated proportionally across civil, mechanical, and electrical deliverables.',
          status: 'positive',
        },
        {
          factor: 'Pending Review Holdbacks',
          contribution: '-3.2% Unverified Buffer',
          reason: 'Field updates pending planner review are excluded until approved.',
          status: 'neutral',
        },
      ],
      algorithmOrRule: 'Physical Work Breakdown Earned Value Ledger',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'Review items in Review Queue to convert attested work to verified progress.',
    };
  }

  if (key.startsWith('delay:')) {
    const id = key.replace('delay:', '');
    return {
      type: 'delay',
      title: 'Delay Root-Cause Analysis',
      subjectId: id,
      subjectName: `Activity ${id}`,
      metricLabel: 'Schedule Slip',
      metricValue: '+2 Days Slip',
      summary: `Activity ${id} is experiencing delayed execution due to upstream delivery lag and constrained site access.`,
      factors: [
        {
          factor: 'Upstream Deliverable Handover',
          contribution: '65% of delay',
          reason: 'Predecessor milestone completed behind baseline schedule.',
          status: 'negative',
        },
        {
          factor: 'Site Resource Reallocation',
          contribution: '35% of delay',
          reason: 'Mechanical erection crew prioritized to Compressor Skid A.',
          status: 'negative',
        },
      ],
      algorithmOrRule: 'Primavera P6 Critical Path Float Engine',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'Evaluate fast-tracking remaining tasks or crashing successors.',
    };
  }

  if (key.startsWith('impact:')) {
    const id = key.replace('impact:', '');
    return {
      type: 'impact',
      title: 'Downstream Schedule Impact',
      subjectId: id,
      subjectName: `Activity ${id}`,
      metricLabel: 'Downstream Impact',
      metricValue: '+2 Days Critical Path Impact',
      summary: `The delay on ${id} directly impacts successor activities along the critical path due to zero available float buffer.`,
      factors: [
        {
          factor: 'Downstream Finish-to-Start Ties',
          contribution: 'Direct Cascade',
          reason: 'Successor work package cannot mobilize until preceding scope is certified.',
          status: 'negative',
        },
        {
          factor: 'Critical Float Buffer Exhaustion',
          contribution: '0d Total Float',
          reason: 'Activity is on Critical Path CP-01 with no buffer to absorb slippage.',
          status: 'negative',
        },
      ],
      algorithmOrRule: 'CPM Network Forward Pass',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'Deploy double-shift recovery crew to prevent downstream milestone shift.',
    };
  }

  if (key.startsWith('confidence:')) {
    const id = key.replace('confidence:', '');
    return {
      type: 'confidence',
      title: 'Match Confidence Scoring Factors',
      subjectId: id,
      subjectName: `Event ${id}`,
      metricLabel: 'Match Confidence',
      metricValue: '94% High Confidence',
      summary: `Field observation statement matched against schedule activity based on multi-factor semantic and spatial concordance.`,
      factors: [
        {
          factor: 'Activity Match',
          contribution: '+35% Weight',
          reason: 'Exact terminology match between field observation and activity scope.',
          status: 'positive',
        },
        {
          factor: 'Area Match',
          contribution: '+25% Weight',
          reason: 'Site location coordinates align with schedule work breakdown structure.',
          status: 'positive',
        },
        {
          factor: 'Discipline Match',
          contribution: '+20% Weight',
          reason: 'Trade discipline (Piping, Civil, Electrical) matches assigned work package.',
          status: 'positive',
        },
        {
          factor: 'Context Match',
          contribution: '+10% Weight',
          reason: 'Execution date falls directly within scheduled activity calendar window.',
          status: 'positive',
        },
      ],
      algorithmOrRule: 'Multi-factor Heuristic Engine v2.4',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'High confidence exceeds threshold for 1-click planner approval.',
    };
  }

  if (key.startsWith('health:')) {
    const id = key.replace('health:', '');
    return {
      type: 'health',
      title: 'Schedule Health Breakdown',
      subjectId: id || 'PRJ-OIL-2026-01',
      subjectName: 'Schedule Logic Assessment',
      metricLabel: 'Schedule Health',
      metricValue: '78 / 100 (Warning)',
      summary: `Schedule integrity evaluated against industry-standard DCMA 14-point CPM logic rules and data quality standards.`,
      factors: [
        {
          factor: 'Missing Successor Ties',
          contribution: '-10 Points',
          reason: '1 activity has dangling finish logic without a driving successor.',
          status: 'negative',
        },
        {
          factor: 'Negative Total Float',
          contribution: '-8 Points',
          reason: 'Line 24 critical path slipped by 2 days, causing negative total float.',
          status: 'negative',
        },
        {
          factor: 'Hard Constraints',
          contribution: '-4 Points',
          reason: '2 activities contain mandatory finish constraints that distort float.',
          status: 'negative',
        },
      ],
      algorithmOrRule: 'DCMA 14-Point Assessment Protocol',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'Link open successor logic and relax hard date constraints.',
    };
  }

  if (key.startsWith('variance:')) {
    const id = key.replace('variance:', '');
    return {
      type: 'variance',
      title: 'Progress Variance Explanation',
      subjectId: id,
      subjectName: `Activity ${id}`,
      metricLabel: 'Progress Variance',
      metricValue: '-7.0% Variance',
      summary: `Physical verified progress is behind planned schedule baseline due to open inspection sign-offs and weather holds.`,
      factors: [
        {
          factor: 'Planned Baseline Pace',
          contribution: '80.0% Baseline Target',
          reason: 'Required finish pace according to Rev 3.2 (P6 XML) baseline schedule.',
          status: 'neutral',
        },
        {
          factor: 'Verified Actual Progress',
          contribution: '73.0% Actual Measured',
          reason: 'Earned value confirmed through field measurements and weld logs.',
          status: 'negative',
        },
        {
          factor: 'Net Schedule Variance',
          contribution: '-7.0% Variance Drag',
          reason: 'Critical piping butt welding holds partially offset by civil foundations.',
          status: 'negative',
        },
      ],
      algorithmOrRule: 'Earned Value Variance Formula: Actual % - Planned %',
      timestamp: '18 Sep 2026, 17:30 IST',
      recommendation: 'Verify open field updates to bring recorded earned value up to date.',
    };
  }

  return {
    type: 'custom',
    title: 'Metric Explanation',
    subjectId: fallbackSubjectId || 'METRIC',
    metricLabel: 'Computed Metric',
    metricValue: 'Detailed Explanation',
    summary: 'This value was computed using authoritative project control baselines and verified field measurements.',
    factors: [
      {
        factor: 'Authoritative Baseline',
        contribution: 'Primary Driver',
        reason: 'Calculated using current schedule baseline Rev 3.2 (P6 XML).',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'PLnEX Project Controls Computation Standard',
    timestamp: '18 Sep 2026, 17:30 IST',
  };
}
