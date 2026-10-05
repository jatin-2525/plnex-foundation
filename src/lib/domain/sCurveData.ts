export interface TimeSeriesPoint {
  period: string;
  dateLabel: string;
  planned: number;
  actual: number | null;
  forecast: number;
  isDataDate?: boolean;
  notes?: string;
  milestone?: string;
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
    milestone: 'Site Mobilization',
    notes: 'Mobilization & site earthworks commenced on schedule',
  },
  {
    period: 'Jun 2026',
    dateLabel: '30 Jun 2026',
    planned: 28.0,
    actual: 30.5,
    forecast: 30.5,
    milestone: 'Civil Foundations',
    notes: 'Unit A equipment foundations poured ahead of schedule',
  },
  {
    period: 'Jul 2026',
    dateLabel: '31 Jul 2026',
    planned: 46.0,
    actual: 48.0,
    forecast: 48.0,
    milestone: 'Compressor Pedestals',
    notes: 'Gas compressor foundation block cured & handed over',
  },
  {
    period: 'Aug 2026',
    dateLabel: '31 Aug 2026',
    planned: 65.0,
    actual: 64.0,
    forecast: 64.0,
    milestone: 'Piperack Steelwork',
    notes: 'Main piperack structural steel erected; slight rain delay',
  },
  {
    period: '18 Sep 2026',
    dateLabel: '18 Sep 2026',
    planned: 80.0,
    actual: 73.0,
    forecast: 73.0,
    isDataDate: true,
    milestone: 'Line 24 Header Welding',
    notes: 'Data Date: High-pressure gas header welding behind by 7.0%',
  },
  {
    period: 'Oct 2026',
    dateLabel: '31 Oct 2026',
    planned: 92.0,
    actual: null,
    forecast: 88.0,
    milestone: 'NDE Clearance & Tie-ins',
    notes: 'Forecast recovery with double-shift radiographic testing',
  },
  {
    period: 'Nov 2026',
    dateLabel: '30 Nov 2026',
    planned: 98.0,
    actual: null,
    forecast: 95.0,
    milestone: 'Hydrotest Package Loop',
    notes: 'Pre-commissioning leak tests and loop clearance',
  },
  {
    period: 'Dec 2026',
    dateLabel: '15 Dec 2026',
    planned: 100.0,
    actual: null,
    forecast: 100.0,
    milestone: 'Commercial Readiness',
    notes: 'Final commissioning, nitrogen purge, and handover',
  },
];

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
