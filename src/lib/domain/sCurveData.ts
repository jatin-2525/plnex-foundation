export interface SWorkItemContribution {
  id: string;
  name: string;
  discipline: string;
  plannedQty: string;
  actualQty: string;
  status: 'Completed' | 'In Progress' | 'Behind' | 'On Track';
}

export interface SMilestoneDetail {
  id: string;
  name: string;
  baselineDate: string;
  forecastDate: string;
  floatDays: number;
  status: 'Completed' | 'Critical Slip' | 'On Track';
}

export interface TimeSeriesPoint {
  period: string;
  dateLabel: string;
  planned: number;
  actual: number | null;
  forecast: number;
  isDataDate?: boolean;
  notes?: string;
  milestone?: string;
  milestoneDetail?: SMilestoneDetail;
  periodPlannedIncrement: number;
  periodActualIncrement: number | null;
  periodForecastIncrement: number;
  workItems?: SWorkItemContribution[];
}

export interface SCurveSummary {
  plannedAtDataDate: number;
  actualAtDataDate: number;
  varianceAtDataDate: number;
  dataDateLabel: string;
  forecastFinishDate: string;
  forecastDelayDays: number;
  isBehindSchedule: boolean;
}

export const PROJECT_S_CURVE_DATA: TimeSeriesPoint[] = [
  {
    period: 'May 2026',
    dateLabel: '31 May 2026',
    planned: 12.0,
    actual: 12.0,
    forecast: 12.0,
    periodPlannedIncrement: 12.0,
    periodActualIncrement: 12.0,
    periodForecastIncrement: 12.0,
    milestone: 'Site Mobilization & Earthworks',
    milestoneDetail: {
      id: 'MLS-001',
      name: 'Site Mobilization & Earthworks',
      baselineDate: '31 May 2026',
      forecastDate: '31 May 2026',
      floatDays: 0,
      status: 'Completed',
    },
    notes: 'Mobilization & site earthworks completed on schedule',
    workItems: [
      { id: 'CIV-01-001', name: 'Site Clearing & Grading', discipline: 'Civil', plannedQty: '12,000 m²', actualQty: '12,000 m²', status: 'Completed' },
      { id: 'CIV-01-002', name: 'Access Road & Perimeter Fencing', discipline: 'Civil', plannedQty: '1,400 m', actualQty: '1,400 m', status: 'Completed' },
    ],
  },
  {
    period: 'Jun 2026',
    dateLabel: '30 Jun 2026',
    planned: 28.0,
    actual: 30.5,
    forecast: 30.5,
    periodPlannedIncrement: 16.0,
    periodActualIncrement: 18.5,
    periodForecastIncrement: 18.5,
    milestone: 'Civil Foundations & Pedestals',
    milestoneDetail: {
      id: 'MLS-002',
      name: 'Civil Foundations & Pedestals',
      baselineDate: '30 Jun 2026',
      forecastDate: '26 Jun 2026',
      floatDays: 4,
      status: 'Completed',
    },
    notes: 'Unit A equipment foundations poured ahead of baseline envelope',
    workItems: [
      { id: 'CIV-02-005', name: 'Substation Raft Foundation', discipline: 'Civil', plannedQty: '180 m³', actualQty: '185 m³', status: 'Completed' },
      { id: 'CIV-02-008', name: 'Unit A Piperack Pedestals', discipline: 'Civil', plannedQty: '48 pedestals', actualQty: '52 pedestals', status: 'Completed' },
    ],
  },
  {
    period: 'Jul 2026',
    dateLabel: '31 Jul 2026',
    planned: 46.0,
    actual: 48.0,
    forecast: 48.0,
    periodPlannedIncrement: 18.0,
    periodActualIncrement: 17.5,
    periodForecastIncrement: 17.5,
    milestone: 'Compressor House Pedestals',
    milestoneDetail: {
      id: 'MLS-003',
      name: 'Compressor House Pedestals',
      baselineDate: '31 Jul 2026',
      forecastDate: '30 Jul 2026',
      floatDays: 1,
      status: 'Completed',
    },
    notes: 'Gas compressor foundation block cured and handed over to structural team',
    workItems: [
      { id: 'CIV-11-001', name: 'Compressor Pedestal Concrete Pour', discipline: 'Civil', plannedQty: '45 m³', actualQty: '45 m³', status: 'Completed' },
      { id: 'MEC-01-004', name: 'Soleplate Leveling & Anchor Bolt Preset', discipline: 'Mechanical', plannedQty: '32 sets', actualQty: '32 sets', status: 'Completed' },
    ],
  },
  {
    period: 'Aug 2026',
    dateLabel: '31 Aug 2026',
    planned: 65.0,
    actual: 64.0,
    forecast: 64.0,
    periodPlannedIncrement: 19.0,
    periodActualIncrement: 16.0,
    periodForecastIncrement: 16.0,
    milestone: 'Main Piperack Steelwork',
    milestoneDetail: {
      id: 'MLS-004',
      name: 'Main Piperack Steelwork',
      baselineDate: '31 Aug 2026',
      forecastDate: '03 Sep 2026',
      floatDays: 0,
      status: 'On Track',
    },
    notes: 'Main piperack structural steel erected; slight rain delay encountered',
    workItems: [
      { id: 'STR-02-004', name: 'Column & Beam Erection Tier 1', discipline: 'Civil', plannedQty: '94 MT', actualQty: '89 MT', status: 'Completed' },
      { id: 'PIP-20-001', name: 'Spool Stringing & Pre-rigging', discipline: 'Piping', plannedQty: '60 spools', actualQty: '56 spools', status: 'Completed' },
    ],
  },
  {
    period: '18 Sep 2026',
    dateLabel: '18 Sep 2026',
    planned: 80.0,
    actual: 73.0,
    forecast: 73.0,
    periodPlannedIncrement: 15.0,
    periodActualIncrement: 9.0,
    periodForecastIncrement: 9.0,
    isDataDate: true,
    milestone: 'Line 24 Header Welding',
    milestoneDetail: {
      id: 'MLS-005',
      name: 'Line 24 Header Welding & NDT Pass',
      baselineDate: '18 Sep 2026',
      forecastDate: '23 Sep 2026',
      floatDays: 0,
      status: 'Critical Slip',
    },
    notes: 'Data Date: High-pressure gas header welding behind by 7.0 percentage points',
    workItems: [
      { id: 'PIP-24-001', name: 'Erect Line 24-XX HP Gas Header', discipline: 'Piping', plannedQty: '48 spools', actualQty: '48 spools', status: 'Completed' },
      { id: 'PIP-24-002', name: 'Weld Line 24-XX Field Joints', discipline: 'Piping', plannedQty: '20 welds (85%)', actualQty: '14 welds (70%)', status: 'Behind' },
      { id: 'PIP-24-003', name: 'Hydrostatic Test Section Line 24', discipline: 'Piping', plannedQty: '1 test pack', actualQty: '0 test packs', status: 'Behind' },
    ],
  },
  {
    period: 'Oct 2026',
    dateLabel: '31 Oct 2026',
    planned: 92.0,
    actual: null,
    forecast: 88.0,
    periodPlannedIncrement: 12.0,
    periodActualIncrement: null,
    periodForecastIncrement: 15.0,
    milestone: 'NDE Clearance & Tie-ins',
    milestoneDetail: {
      id: 'MLS-006',
      name: 'NDE Clearance & Tie-ins',
      baselineDate: '31 Oct 2026',
      forecastDate: '04 Nov 2026',
      floatDays: 0,
      status: 'Critical Slip',
    },
    notes: 'Forecast recovery with double-shift radiographic testing and flange bolt-ups',
    workItems: [
      { id: 'PIP-24-004', name: 'Chemical Cleaning & Pickling', discipline: 'Piping', plannedQty: '1,200 m', actualQty: '—', status: 'On Track' },
      { id: 'INS-04-015', name: 'Pressure Transmitter Calibration', discipline: 'Instrumentation', plannedQty: '18 units', actualQty: '—', status: 'On Track' },
    ],
  },
  {
    period: 'Nov 2026',
    dateLabel: '30 Nov 2026',
    planned: 98.0,
    actual: null,
    forecast: 95.0,
    periodPlannedIncrement: 6.0,
    periodActualIncrement: null,
    periodForecastIncrement: 7.0,
    milestone: 'Hydrotest Package Loop Acceptance',
    milestoneDetail: {
      id: 'MLS-007',
      name: 'Hydrotest Package Loop Acceptance',
      baselineDate: '30 Nov 2026',
      forecastDate: '04 Dec 2026',
      floatDays: 0,
      status: 'On Track',
    },
    notes: 'Pre-commissioning leak tests, punchlist clearance, and cold loop checks',
    workItems: [
      { id: 'COM-99-001', name: 'Integrated Loop Dry-Runs', discipline: 'Instrumentation', plannedQty: '42 loops', actualQty: '—', status: 'On Track' },
      { id: 'ELE-12-008', name: 'MCC Energization & Motor Rotations', discipline: 'Electrical', plannedQty: '12 drives', actualQty: '—', status: 'On Track' },
    ],
  },
  {
    period: 'Dec 2026',
    dateLabel: '15 Dec 2026',
    planned: 100.0,
    actual: null,
    forecast: 100.0,
    periodPlannedIncrement: 2.0,
    periodActualIncrement: null,
    periodForecastIncrement: 5.0,
    milestone: 'Phase 1 Substantial COD',
    milestoneDetail: {
      id: 'MLS-100-COD',
      name: 'Phase 1 Gas Processing Substantial Completion (COD)',
      baselineDate: '15 Dec 2026',
      forecastDate: '20 Dec 2026',
      floatDays: -5,
      status: 'Critical Slip',
    },
    notes: 'Gas-in startup, 72h continuous run, and OIL handover (Target finish: 20 Dec 2026, +5d slip)',
    workItems: [
      { id: 'COM-99-002', name: 'Gas-In & System Commissioning', discipline: 'Commissioning', plannedQty: '1 facility', actualQty: '—', status: 'On Track' },
      { id: 'PRJ-HO-001', name: 'Commercial Handover Documentation', discipline: 'Management', plannedQty: '1 set', actualQty: '—', status: 'On Track' },
    ],
  },
];

// Baseline Revision 3.1 Dataset (Previous target baseline)
export const BASELINE_REV_3_1_DATA: TimeSeriesPoint[] = PROJECT_S_CURVE_DATA.map((pt) => ({
  ...pt,
  planned: Math.min(100, Number((pt.planned * 1.025).toFixed(1))),
}));

// Baseline Revision 3.0 Dataset (Contract baseline)
export const BASELINE_REV_3_0_DATA: TimeSeriesPoint[] = PROJECT_S_CURVE_DATA.map((pt) => ({
  ...pt,
  planned: Math.max(0, Number((pt.planned * 0.94).toFixed(1))),
}));

// Saved Scenario Comparison Curve (Simulated Monsoon Surge + Double Shift)
export const SAVED_SCENARIO_S_CURVE: TimeSeriesPoint[] = PROJECT_S_CURVE_DATA.map((pt, i) => {
  if (i < 4) return { ...pt };
  if (i === 4) return { ...pt, forecast: 71.0 };
  if (i === 5) return { ...pt, forecast: 85.0 };
  if (i === 6) return { ...pt, forecast: 94.0 };
  return { ...pt, forecast: 100.0 };
});

// Dimensional Filter Datasets: Discipline-Specific S-Curves
export const DISCIPLINE_S_CURVE_DATA: Record<string, TimeSeriesPoint[]> = {
  Piping: PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Number((pt.planned * 0.98).toFixed(1)),
    actual: pt.actual !== null ? Number((pt.actual * 0.96).toFixed(1)) : null,
    forecast: Number((pt.forecast * 0.97).toFixed(1)),
  })),
  Civil: PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Math.min(100, Number((pt.planned * 1.06).toFixed(1))),
    actual: pt.actual !== null ? Math.min(100, Number((pt.actual * 1.12).toFixed(1))) : null,
    forecast: Math.min(100, Number((pt.forecast * 1.08).toFixed(1))),
  })),
  Mechanical: PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Number((pt.planned * 0.75).toFixed(1)),
    actual: pt.actual !== null ? Number((pt.actual * 0.79).toFixed(1)) : null,
    forecast: Number((pt.forecast * 0.80).toFixed(1)),
  })),
  Electrical: PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Number((pt.planned * 0.62).toFixed(1)),
    actual: pt.actual !== null ? Number((pt.actual * 0.63).toFixed(1)) : null,
    forecast: Number((pt.forecast * 0.66).toFixed(1)),
  })),
};

export const AREA_S_CURVE_DATA: Record<string, TimeSeriesPoint[]> = {
  'Unit A - Gas Processing': PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Math.min(100, Number((pt.planned * 1.01).toFixed(1))),
    actual: pt.actual !== null ? Number((pt.actual * 1.03).toFixed(1)) : null,
  })),
  'Unit B - Compressor House': PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Number((pt.planned * 0.90).toFixed(1)),
    actual: pt.actual !== null ? Number((pt.actual * 0.90).toFixed(1)) : null,
  })),
  'Offsites & Substation': PROJECT_S_CURVE_DATA.map((pt) => ({
    ...pt,
    planned: Number((pt.planned * 0.85).toFixed(1)),
    actual: pt.actual !== null ? Number((pt.actual * 0.89).toFixed(1)) : null,
  })),
};

export function getSCurveSummary(data: TimeSeriesPoint[] = PROJECT_S_CURVE_DATA): SCurveSummary {
  const dataDatePoint = data.find((d) => d.isDataDate) || data[4];
  const planned = dataDatePoint.planned;
  const actual = dataDatePoint.actual ?? 0;
  const variance = Number((actual - planned).toFixed(1));

  return {
    plannedAtDataDate: planned,
    actualAtDataDate: actual,
    varianceAtDataDate: variance,
    dataDateLabel: dataDatePoint.dateLabel,
    forecastFinishDate: '20 Dec 2026',
    forecastDelayDays: 5,
    isBehindSchedule: variance < 0,
  };
}

export function getSCurveInterpretation(summary: SCurveSummary): string {
  const diff = Math.abs(summary.varianceAtDataDate);
  if (summary.varianceAtDataDate < 0) {
    return `Actual progress is ${diff.toFixed(1)} percentage points behind planned progress (-${diff.toFixed(1)} pp slip). Forecast completion shifts to 20 Dec 2026 (+5 days).`;
  }
  if (summary.varianceAtDataDate > 0) {
    return `Actual progress is ${diff.toFixed(1)} percentage points ahead of planned progress (+${diff.toFixed(1)} pp fast-track).`;
  }
  return 'Actual progress is tracking exactly on planned baseline schedule.';
}
