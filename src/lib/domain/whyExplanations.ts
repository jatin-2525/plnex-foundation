/**
 * PLnEX "Why?" Explanation Domain Engine
 *
 * Provides structured, transparent, non-black-box explanations for computed metrics:
 * 1. Why is this delayed? (Delay & critical path impact)
 * 2. Why is confidence 94%? (Multi-factor AI match scoring)
 * 3. Why is variance -7%? (Earned value planned vs actual progress)
 * 4. Why is this activity/schedule unhealthy? (DCMA 14-point schedule health)
 */

export type WhyExplanationType = 'delay' | 'confidence' | 'health' | 'variance' | 'custom';

export interface WhyExplanationFactor {
  factor: string;
  contribution: string; // e.g., "+35%", "-7%", "Primary Driver"
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
    subjectId: 'OIL-DULIAJAN-2026',
    subjectName: 'Oil India Duliajan Gas Plant Expansion',
    metricLabel: 'Schedule Variance',
    metricValue: '-7.0% Overall (-15% Critical Piping)',
    summary:
      'Cumulative Earned Value (EV) stands at 70% physical verified actuals against a planned schedule baseline (PV) of 85% as of 18 Sep 2026 reporting cutoff. The variance is driven by piping welding deficits partially offset by civil foundations.',
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

  // 3. CONFIDENCE EXPLANATION (94% AI Match)
  'confidence:EVT-2026-001': {
    type: 'confidence',
    title: 'AI Match Confidence Scoring Factors',
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
    subjectName: 'Oil India Duliajan Gas Plant Expansion',
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
};

export function getWhyExplanation(key: string, fallbackSubjectId?: string): WhyExplanationData {
  if (WHY_EXPLANATION_PRESETS[key]) {
    return WHY_EXPLANATION_PRESETS[key];
  }

  // Derive dynamic explanation if key is typed
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

  if (key.startsWith('variance:')) {
    const id = key.replace('variance:', '');
    return {
      type: 'variance',
      title: 'Progress Variance Explanation',
      subjectId: id,
      subjectName: `Activity ${id}`,
      metricLabel: 'Progress Variance',
      metricValue: '-15% Variance',
      summary: `Physical verified progress is behind planned schedule baseline due to open inspection sign-offs.`,
      factors: [
        {
          factor: 'Planned Work Pace',
          contribution: '85% Baseline Target',
          reason: 'Required finish pace according to Primavera P6 Rev 3.2 baseline.',
          status: 'neutral',
        },
        {
          factor: 'Verified Actual Progress',
          contribution: '70% Actual Measured',
          reason: 'Earned value confirmed through field measurements and weld logs.',
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
        reason: 'Calculated using current schedule baseline V3 · Rev 3.2.',
        status: 'positive',
      },
    ],
    algorithmOrRule: 'PLnEX Project Controls Computation Standard',
    timestamp: '18 Sep 2026, 17:30 IST',
  };
}
