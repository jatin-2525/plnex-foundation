/**
 * ANSI/EIA-748 Earned Value Management (EVM) Calculation Engine
 * PLnEX — Project Controls & Schedule Intelligence (Oil India Limited)
 *
 * Implements authoritative mathematical formulas for Earned Value Analysis:
 * - BAC  (Budget at Completion)
 * - PV   (Planned Value = Planned % * BAC)
 * - EV   (Earned Value = Verified Actual % * BAC)
 * - AC   (Actual Cost)
 * - CV   (Cost Variance = EV - AC)
 * - SV   (Schedule Variance = EV - PV)
 * - SV%  (Schedule Variance Percentage = Actual % - Planned %)
 * - CPI  (Cost Performance Index = EV / AC)
 * - SPI  (Schedule Performance Index = EV / PV)
 * - EAC  (Estimate at Completion = BAC / CPI)
 * - VAC  (Variance at Completion = BAC - EAC)
 * - TCPI (To-Complete Performance Index = (BAC - EV) / (BAC - AC))
 *
 * Standard Reference: ANSI/EIA-748-D / AACE International RP 55R-09
 * Anchored to Canonical Baseline Rev 3.2 (P6 XML, Data Date: 18 Sep 2026, 17:30 IST)
 */

import { PROJECT_REPORT_DATE } from './dateUtils';

export interface EVMMetrics {
  bac: number;       // ₹ Cr (Budget at Completion, default: 142.50)
  pv: number;        // ₹ Cr (Planned Value = Planned % * BAC, default: 114.00 Cr)
  ev: number;        // ₹ Cr (Earned Value = Verified Actual % * BAC, default: 104.03 Cr)
  ac: number;        // ₹ Cr (Actual Cost, default: 108.50 Cr)
  cv: number;        // ₹ Cr (Cost Variance = EV - AC, default: -4.47 Cr)
  sv: number;        // ₹ Cr (Schedule Variance = EV - PV, default: -9.97 Cr)
  svPct: number;     // % (-7.00 pp)
  cpi: number;       // Cost Performance Index = EV / AC, default: 0.9588 (~0.96)
  spi: number;       // Schedule Performance Index = EV / PV, default: 0.9125 (~0.91)
  eac: number;       // Estimate at Completion = BAC / CPI, default: 148.62 Cr (+6.12 Cr overrun)
  vac: number;       // Variance at Completion = BAC - EAC, default: -6.12 Cr
  tcpi: number;      // To-Complete Performance Index = (BAC - EV) / (BAC - AC), default: 1.1315
  plannedPct: number; // 80.0%
  actualPct: number;  // 73.0%
  dataDate: string;  // '2026-09-18T17:30:00+05:30'
  status: 'behind_schedule_over_budget' | 'on_track' | 'ahead_schedule_under_budget';
  cpiInterpretation: string;
  spiInterpretation: string;
  tcpiInterpretation: string;
}

export interface EVMTimeSeriesPoint {
  period: string;
  dateLabel: string;
  isDataDate: boolean;
  plannedPct: number;
  actualPct: number | null;
  forecastPct: number;
  pv: number;
  ev: number | null;
  ac: number | null;
  cpi: number | null;
  spi: number | null;
  cv: number | null;
  sv: number | null;
}

export interface EVMDisciplineMetric {
  discipline: string;
  weightPct: number;
  bac: number; // ₹ Cr
  plannedPct: number;
  actualPct: number;
  pv: number;  // ₹ Cr
  ev: number;  // ₹ Cr
  ac: number;  // ₹ Cr
  cpi: number;
  spi: number;
  cv: number;
  sv: number;
  status: 'Critical' | 'Warning' | 'On Track' | 'Ahead';
}

/**
 * Canonical Project Baseline Financial Defaults
 */
export const CANONICAL_BAC = 142.50;        // ₹ 142.50 Crores
export const CANONICAL_PLANNED_PCT = 80.0;  // 80.0% as of Data Date
export const CANONICAL_ACTUAL_PCT = 73.0;   // 73.0% verified physical completion
export const CANONICAL_ACTUAL_COST = 108.50; // ₹ 108.50 Crores actual incurred expenditure

/**
 * Floating-point precision helper for financial currency rounding (2 decimal places)
 */
function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Floating-point precision helper for performance indices (4 decimal places)
 */
function round4(num: number): number {
  return Math.round((num + Number.EPSILON) * 10000) / 10000;
}

/**
 * Calculates ANSI/EIA-748 Earned Value Management (EVM) metrics dynamically.
 *
 * @param bac Budget at Completion in ₹ Crores (default: 142.50)
 * @param plannedPct Scheduled planned progress percentage (default: 80.0)
 * @param actualPct Verified physical actual progress percentage (default: 73.0)
 * @param actualCost Cumulative actual incurred cost in ₹ Crores (default: 108.50)
 * @param dataDate Cutoff ISO timestamp (default: PROJECT_REPORT_DATE)
 * @returns Fully computed EVMMetrics object
 */
export function calculateProjectEVM(
  bac: number = CANONICAL_BAC,
  plannedPct: number = CANONICAL_PLANNED_PCT,
  actualPct: number = CANONICAL_ACTUAL_PCT,
  actualCost: number = CANONICAL_ACTUAL_COST,
  dataDate: string = PROJECT_REPORT_DATE
): EVMMetrics {
  // 1. Planned Value (PV) = Planned % * BAC
  const pv = round2((plannedPct / 100) * bac);

  // 2. Earned Value (EV) = Verified Actual % * BAC
  const ev = round2((actualPct / 100) * bac);

  // 3. Actual Cost (AC)
  const ac = round2(actualCost);

  // 4. Cost Variance (CV) = EV - AC (Negative = Cost Overrun)
  const cv = round2(ev - ac);

  // 5. Schedule Variance (SV) = EV - PV (Negative = Behind Schedule)
  const sv = round2(ev - pv);
  const svPct = round2(actualPct - plannedPct);

  // 6. Cost Performance Index (CPI) = EV / AC (< 1.0 = Cost Inefficient)
  const cpi = ac > 0 ? round4(ev / ac) : 1.0;

  // 7. Schedule Performance Index (SPI) = EV / PV (< 1.0 = Behind Schedule)
  const spi = pv > 0 ? round4(ev / pv) : 1.0;

  // 8. Estimate at Completion (EAC) = BAC / CPI
  const eac = cpi > 0 ? round2(bac / cpi) : bac;

  // 9. Variance at Completion (VAC) = BAC - EAC (Negative = Projected Overrun)
  const vac = round2(bac - eac);

  // 10. To-Complete Performance Index (TCPI) = (BAC - EV) / (BAC - AC)
  const remainingWork = bac - ev;
  const remainingBudget = bac - ac;
  const tcpi = remainingBudget > 0 ? round4(remainingWork / remainingBudget) : 1.0;

  // 11. Overarching Status Determination
  let status: EVMMetrics['status'] = 'on_track';
  if (spi < 0.99 && cpi < 0.99) {
    status = 'behind_schedule_over_budget';
  } else if (spi >= 1.0 && cpi >= 1.0) {
    status = 'ahead_schedule_under_budget';
  }

  // 12. Contextual Interpretations
  const cpiInterpretation =
    cpi < 1.0
      ? `For every ₹ 1.00 spent, project realizes ₹ ${cpi.toFixed(2)} in earned work (Cost Overrun).`
      : cpi === 1.0
      ? 'Expenditures are precisely in line with earned value realization.'
      : `For every ₹ 1.00 spent, project realizes ₹ ${cpi.toFixed(2)} in earned work (Cost Favorable).`;

  const spiInterpretation =
    spi < 1.0
      ? `Project is progressing at ${(spi * 100).toFixed(1)}% of scheduled pace (${Math.abs(svPct).toFixed(1)} pp schedule slip).`
      : spi === 1.0
      ? 'Progress is precisely tracking contractual baseline velocity.'
      : `Project is advancing at ${(spi * 100).toFixed(1)}% of scheduled pace (Ahead of Schedule).`;

  const tcpiInterpretation =
    tcpi > 1.0
      ? `Remaining scope requires efficiency of ${tcpi.toFixed(2)} CPI to finish within ₹ ${bac.toFixed(2)} Cr budget.`
      : 'Remaining scope can be completed at or below current burn rate efficiency.';

  return {
    bac,
    pv,
    ev,
    ac,
    cv,
    sv,
    svPct,
    cpi,
    spi,
    eac,
    vac,
    tcpi,
    plannedPct,
    actualPct,
    dataDate,
    status,
    cpiInterpretation,
    spiInterpretation,
    tcpiInterpretation,
  };
}

/**
 * Formats a currency amount in ₹ Crores.
 * Example: 142.5 => "₹ 142.50 Cr", -4.47 => "-₹ 4.47 Cr"
 */
export function formatCurrencyCr(amount: number, showSign: boolean = false): string {
  const isNegative = amount < 0;
  const absVal = Math.abs(amount).toFixed(2);
  const sign = isNegative ? '-₹ ' : showSign ? '+₹ ' : '₹ ';
  return `${sign}${absVal} Cr`;
}

/**
 * Formats a variance amount in ₹ Crores with explicit +/- prefix.
 * Example: -4.47 => "-₹ 4.47 Cr", 2.10 => "+₹ 2.10 Cr"
 */
export function formatVarianceCr(amount: number): string {
  if (Math.abs(amount) < 0.005) return '₹ 0.00 Cr';
  return formatCurrencyCr(amount, true);
}

/**
 * Formats an EVM efficiency ratio (CPI or SPI) to 2 or 4 decimal places.
 * Example: 0.9588 => "0.96" (standard) or "0.9588" (expanded)
 */
export function formatEVMIndex(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Formats percentage point variance.
 * Example: -7.0 => "-7.00 pp", +2.5 => "+2.50 pp"
 */
export function formatPercentPoints(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} pp`;
}

/**
 * Mineral + Evergreen Theme Status Badge Configuration
 */
export interface EVMBadgeConfig {
  label: string;
  badgeClass: string;
  textClass: string;
  bgClass: string;
  borderClass: string;
  variant: 'danger' | 'warning' | 'success' | 'info';
}

export function getEVMStatusBadgeConfig(status: EVMMetrics['status']): EVMBadgeConfig {
  switch (status) {
    case 'behind_schedule_over_budget':
      return {
        label: 'Behind Schedule & Over Budget',
        badgeClass: 'bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5A2624]',
        textClass: 'text-[#A43B36] dark:text-[#FF9E94]',
        bgClass: 'bg-[#F6E4E1] dark:bg-[#3D1418]',
        borderClass: 'border-[#DCABA7] dark:border-[#5A2624]',
        variant: 'danger',
      };
    case 'ahead_schedule_under_budget':
      return {
        label: 'Ahead of Schedule & Under Budget',
        badgeClass: 'bg-[#EAF0E9] dark:bg-[#203129] text-[#08786A] dark:text-[#72C6AD] border-[#BDE4D0] dark:border-[#2A5949]',
        textClass: 'text-[#08786A] dark:text-[#72C6AD]',
        bgClass: 'bg-[#EAF0E9] dark:bg-[#203129]',
        borderClass: 'border-[#BDE4D0] dark:border-[#2A5949]',
        variant: 'success',
      };
    case 'on_track':
    default:
      return {
        label: 'Contractual Baseline Target',
        badgeClass: 'bg-[#F8EFDA] dark:bg-[#3D2808] text-[#825700] dark:text-[#F3B765] border-[#F2DCA8] dark:border-[#5C3F10]',
        textClass: 'text-[#825700] dark:text-[#F3B765]',
        bgClass: 'bg-[#F8EFDA] dark:bg-[#3D2808]',
        borderClass: 'border-[#F2DCA8] dark:border-[#5C3F10]',
        variant: 'warning',
      };
  }
}

/**
 * Historical period-by-period EVM time series data aligned with project S-curve timeline
 */
export function getEVMPeriodTimeSeries(bac: number = CANONICAL_BAC): EVMTimeSeriesPoint[] {
  const periods = [
    { period: 'May 2026', dateLabel: '31 May 2026', plannedPct: 12.0, actualPct: 12.0, forecastPct: 12.0, ac: 15.50, isDataDate: false },
    { period: 'Jun 2026', dateLabel: '30 Jun 2026', plannedPct: 28.0, actualPct: 30.0, forecastPct: 30.0, ac: 39.80, isDataDate: false },
    { period: 'Jul 2026', dateLabel: '31 Jul 2026', plannedPct: 46.0, actualPct: 48.0, forecastPct: 48.0, ac: 66.20, isDataDate: false },
    { period: 'Aug 2026', dateLabel: '31 Aug 2026', plannedPct: 65.0, actualPct: 64.0, forecastPct: 64.0, ac: 92.40, isDataDate: false },
    { period: '18 Sep 2026', dateLabel: '18 Sep 2026', plannedPct: 80.0, actualPct: 73.0, forecastPct: 73.0, ac: 108.50, isDataDate: true },
    { period: 'Oct 2026', dateLabel: '31 Oct 2026', plannedPct: 92.0, actualPct: null, forecastPct: 88.0, ac: null, isDataDate: false },
    { period: 'Nov 2026', dateLabel: '30 Nov 2026', plannedPct: 98.0, actualPct: null, forecastPct: 95.0, ac: null, isDataDate: false },
    { period: 'Dec 2026', dateLabel: '20 Dec 2026', plannedPct: 100.0, actualPct: null, forecastPct: 100.0, ac: null, isDataDate: false },
  ];

  return periods.map((p) => {
    const pv = round2((p.plannedPct / 100) * bac);
    const ev = p.actualPct !== null ? round2((p.actualPct / 100) * bac) : null;
    const ac = p.ac !== null ? round2(p.ac) : null;
    const cv = ev !== null && ac !== null ? round2(ev - ac) : null;
    const sv = ev !== null ? round2(ev - pv) : null;
    const cpi = ev !== null && ac !== null && ac > 0 ? round4(ev / ac) : null;
    const spi = ev !== null && pv > 0 ? round4(ev / pv) : null;

    return {
      period: p.period,
      dateLabel: p.dateLabel,
      isDataDate: p.isDataDate,
      plannedPct: p.plannedPct,
      actualPct: p.actualPct,
      forecastPct: p.forecastPct,
      pv,
      ev,
      ac,
      cpi,
      spi,
      cv,
      sv,
    };
  });
}

/**
 * Discipline-level EVM breakdown for EPC package monitoring
 */
export function getEVMDisciplineBreakdown(bac: number = CANONICAL_BAC): EVMDisciplineMetric[] {
  const disciplines = [
    { discipline: 'Piping & Mechanical Integration', weightPct: 35.0, plannedPct: 82.0, actualPct: 69.0, ac: 37.80 },
    { discipline: 'Civil & Structural Foundations', weightPct: 25.0, plannedPct: 95.0, actualPct: 96.0, ac: 34.20 },
    { discipline: 'Compressor Package & Equipment', weightPct: 20.0, plannedPct: 75.0, actualPct: 71.0, ac: 21.50 },
    { discipline: 'Electrical Distribution & Cables', weightPct: 12.0, plannedPct: 68.0, actualPct: 64.0, ac: 10.80 },
    { discipline: 'Instrumentation & SCADA Control', weightPct: 8.0, plannedPct: 52.0, actualPct: 48.0, ac: 4.20 },
  ];

  return disciplines.map((d) => {
    const discBac = round2((d.weightPct / 100) * bac);
    const pv = round2((d.plannedPct / 100) * discBac);
    const ev = round2((d.actualPct / 100) * discBac);
    const ac = d.ac;
    const cv = round2(ev - ac);
    const sv = round2(ev - pv);
    const cpi = ac > 0 ? round4(ev / ac) : 1.0;
    const spi = pv > 0 ? round4(ev / pv) : 1.0;

    let status: EVMDisciplineMetric['status'] = 'On Track';
    if (spi < 0.90 || cpi < 0.90) {
      status = 'Critical';
    } else if (spi < 0.98 || cpi < 0.98) {
      status = 'Warning';
    } else if (spi > 1.02 && cpi >= 1.0) {
      status = 'Ahead';
    }

    return {
      discipline: d.discipline,
      weightPct: d.weightPct,
      bac: discBac,
      plannedPct: d.plannedPct,
      actualPct: d.actualPct,
      pv,
      ev,
      ac,
      cpi,
      spi,
      cv,
      sv,
      status,
    };
  });
}
