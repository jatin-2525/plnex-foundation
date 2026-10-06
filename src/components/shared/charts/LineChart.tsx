'use client';

import React, { useState } from 'react';
import { CHART_TOKENS } from '../../../tokens/chartColors';

export interface LineChartDataPoint {
  period: string;
  dateLabel?: string;
  planned?: number;
  actual?: number | null;
  variance?: number; // e.g. -7.0 (% or days)
  forecast?: number;
  isDataDate?: boolean;
  notes?: string;
}

export interface LineChartProps {
  variant?: 'progress-over-time' | 'variance-trend';
  title?: string;
  subtitle?: string;
  projectQuestion?: string;
  timeRange?: string;
  unit?: string;
  data?: LineChartDataPoint[];
  className?: string;
}

// Canonical default dataset for Progress Over Time
const DEFAULT_PROGRESS_OVER_TIME: LineChartDataPoint[] = [
  { period: 'May 2026', dateLabel: '31 May 2026', planned: 12, actual: 12, notes: 'Site mobilization' },
  { period: 'Jun 2026', dateLabel: '30 Jun 2026', planned: 28, actual: 30, notes: 'Piling complete' },
  { period: 'Jul 2026', dateLabel: '31 Jul 2026', planned: 46, actual: 48, notes: 'Pedestal pour' },
  { period: 'Aug 2026', dateLabel: '31 Aug 2026', planned: 65, actual: 64, notes: 'Steel erection' },
  { period: 'Sep 2026', dateLabel: '18 Sep 2026', planned: 80, actual: 73, isDataDate: true, notes: 'Cutoff date' },
  { period: 'Oct 2026', dateLabel: '31 Oct 2026', planned: 92, actual: null, forecast: 88, notes: 'Double-shift RT' },
  { period: 'Nov 2026', dateLabel: '30 Nov 2026', planned: 98, actual: null, forecast: 95, notes: 'Hydrotests' },
  { period: 'Dec 2026', dateLabel: '15 Dec 2026', planned: 100, actual: null, forecast: 100, notes: 'Handover' },
];

// Canonical default dataset for Variance Trend
const DEFAULT_VARIANCE_TREND: LineChartDataPoint[] = [
  { period: 'May 2026', dateLabel: '31 May 2026', variance: 0.0, notes: 'On schedule' },
  { period: 'Jun 2026', dateLabel: '30 Jun 2026', variance: 2.0, notes: '+2.0% ahead' },
  { period: 'Jul 2026', dateLabel: '31 Jul 2026', variance: 2.0, notes: '+2.0% ahead' },
  { period: 'Aug 2026', dateLabel: '31 Aug 2026', variance: -1.0, notes: '-1.0% slip' },
  { period: 'Sep 2026', dateLabel: '18 Sep 2026', variance: -7.0, isDataDate: true, notes: '-7.0% slip (Cutoff)' },
  { period: 'Oct 2026', dateLabel: '31 Oct 2026', variance: -4.0, notes: 'Recovery forecast' },
  { period: 'Nov 2026', dateLabel: '30 Nov 2026', variance: -3.0, notes: 'Recovery forecast' },
  { period: 'Dec 2026', dateLabel: '15 Dec 2026', variance: 0.0, notes: 'Zero float recovered' },
];

export function LineChart({
  variant = 'progress-over-time',
  title,
  subtitle,
  projectQuestion,
  timeRange = 'May 2026 – Dec 2026 (Data Date: 18 Sep 2026)',
  unit,
  data,
  className = '',
}: LineChartProps) {
  const isVariance = variant === 'variance-trend';
  const effectiveData = data || (isVariance ? DEFAULT_VARIANCE_TREND : DEFAULT_PROGRESS_OVER_TIME);
  const effectiveUnit = unit || (isVariance ? '% pts' : '%');

  const defaultTitle = isVariance
    ? 'Variance Trend — Cumulative Schedule Slip / Recovery'
    : 'Progress Over Time — Monthly Planned vs. Verified Actual';

  const defaultSubtitle = isVariance
    ? 'Historical and projected schedule variance percentage points relative to approved baseline'
    : 'Monthly physical progress trajectory tracking earned milestone completion against P6 target';

  const defaultQuestion = isVariance
    ? 'Is the schedule variance expanding or recovering over the project timeline?'
    : 'How has monthly progress earned evolved against the planned schedule trajectory?';

  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;
  const displayQuestion = projectQuestion || defaultQuestion;

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // SVG Layout dimensions
  const width = 720;
  const height = 260;
  const padLeft = 60;
  const padRight = 40;
  const padTop = 32;
  const padBottom = 48;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = effectiveData.length;

  const getX = (i: number) => padLeft + (i / (n - 1)) * plotW;

  // Y-axis scaling
  let minY = 0;
  let maxY = 100;
  let yTicks = [0, 25, 50, 75, 100];

  if (isVariance) {
    minY = -15;
    maxY = 10;
    yTicks = [10, 5, 0, -5, -10, -15];
  }

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padTop + (1 - (clamped - minY) / (maxY - minY)) * plotH;
  };

  const zeroY = isVariance ? getY(0) : getY(0);
  const dataDateIndex = effectiveData.findIndex((d) => d.isDataDate) !== -1
    ? effectiveData.findIndex((d) => d.isDataDate)
    : 4;

  // Paths
  let plannedPath = '';
  let actualPath = '';
  let forecastPath = '';
  let variancePath = '';

  if (!isVariance) {
    plannedPath = effectiveData.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.planned ?? 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    const actuals = effectiveData.filter((pt) => pt.actual !== null && pt.actual !== undefined);
    actualPath = actuals.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.actual as number);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    const forecasts = effectiveData.slice(dataDateIndex);
    forecastPath = forecasts.reduce((acc, pt, idx) => {
      const realIdx = dataDateIndex + idx;
      const x = getX(realIdx);
      const val = pt.actual !== null && pt.actual !== undefined ? (pt.actual as number) : (pt.forecast ?? pt.planned ?? 0);
      const y = getY(val);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  } else {
    variancePath = effectiveData.reduce((acc, pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.variance ?? 0);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }

  const activePoint = hoveredIdx !== null ? effectiveData[hoveredIdx] : effectiveData[dataDateIndex];

  return (
    <div className={`bg-white rounded-lg border border-[#D9DEE5] p-5 shadow-xs text-[#172033] ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#172033] tracking-tight">{displayTitle}</h3>
            <span className="px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[10px] font-mono font-bold">
              Unit: {effectiveUnit}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5] text-[10px] font-mono">
              {timeRange}
            </span>
          </div>
          <p className="text-xs text-[#596579] mt-0.5">{displaySubtitle}</p>
        </div>

        {/* Real Project-Control Question Banner */}
        <div className="px-3 py-1.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-xs font-mono text-[#176B87] font-semibold self-start lg:self-auto max-w-md">
          <span className="font-sans font-bold text-[#172033] block text-[10px] uppercase tracking-wide">
            Project-Control Question:
          </span>
          {displayQuestion}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-3.5 text-xs font-mono">
        {!isVariance ? (
          <>
            <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
              <span className="text-[#596579] block text-[10px] font-sans">Planned Target</span>
              <span className="font-bold text-[#176B87]">
                {effectiveData[dataDateIndex]?.planned ?? 80}%
              </span>
            </div>
            <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
              <span className="text-[#596579] block text-[10px] font-sans">Verified Actual</span>
              <span className="font-bold text-[#2E7D5B]">
                {effectiveData[dataDateIndex]?.actual ?? 73}%
              </span>
            </div>
            <div className="p-2 bg-[#FDF6ED] rounded border border-[#F0D4A6]">
              <span className="text-[#596579] block text-[10px] font-sans">Current Variance</span>
              <span className="font-bold text-[#B5473C]">-7.0%</span>
            </div>
            <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
              <span className="text-[#596579] block text-[10px] font-sans">Forecast Completion</span>
              <span className="font-bold text-[#172033]">19 Dec 2026 (+4d)</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
              <span className="text-[#596579] block text-[10px] font-sans">Baseline Zero Slip</span>
              <span className="font-bold text-[#596579]">0.0% pts</span>
            </div>
            <div className="p-2 bg-[#FBEFEE] rounded border border-[#E4B0AA]">
              <span className="text-[#596579] block text-[10px] font-sans">Active Maximum Slip</span>
              <span className="font-bold text-[#B5473C]">-7.0% pts (18 Sep)</span>
            </div>
            <div className="p-2 bg-[#EDF7F2] rounded border border-[#B8DCC9]">
              <span className="text-[#596579] block text-[10px] font-sans">Peak Prior Gain</span>
              <span className="font-bold text-[#2E7D5B]">+2.0% pts (Jun/Jul)</span>
            </div>
            <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
              <span className="text-[#596579] block text-[10px] font-sans">Target Recovery</span>
              <span className="font-bold text-[#176B87]">0.0% pts by Dec</span>
            </div>
          </>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-sans"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Horizontal Grid lines & Y-axis labels */}
            {yTicks.map((val) => {
              const y = getY(val);
              const isZero = val === 0;
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke={isZero ? '#172033' : '#E5E9F0'}
                    strokeWidth={isZero ? '1.5' : '1'}
                    strokeDasharray={isZero ? undefined : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill={isZero ? '#172033' : '#596579'}
                    fontFamily="inherit"
                    fontWeight={isZero ? '700' : '500'}
                  >
                    {val > 0 && isVariance ? `+${val}` : `${val}`}
                    {effectiveUnit === '%' ? '%' : ''}
                  </text>
                </g>
              );
            })}

            {/* Explicit Y-axis Title */}
            <text
              x={padLeft - 38}
              y={padTop - 12}
              textAnchor="start"
              fontSize="10"
              fontWeight="bold"
              fill="#172033"
            >
              {isVariance ? `Variance (${effectiveUnit})` : `Progress (${effectiveUnit})`}
            </text>

            {/* Data Date Reference Line */}
            <line
              x1={getX(dataDateIndex)}
              y1={padTop}
              x2={getX(dataDateIndex)}
              y2={height - padBottom}
              stroke="#172033"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <rect
              x={getX(dataDateIndex) - 40}
              y={padTop - 18}
              width={80}
              height={16}
              rx={3}
              fill="#172033"
            />
            <text
              x={getX(dataDateIndex)}
              y={padTop - 7}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              DATA DATE
            </text>

            {/* Progress Over Time Lines */}
            {!isVariance && (
              <>
                {/* Planned Baseline */}
                <path
                  d={plannedPath}
                  fill="none"
                  stroke="#176B87"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Forecast Line (Dashed Neutral/Secondary) */}
                <path
                  d={forecastPath}
                  fill="none"
                  stroke={CHART_TOKENS.forecast.stroke}
                  strokeWidth={CHART_TOKENS.forecast.strokeWidth}
                  strokeDasharray={CHART_TOKENS.forecast.dashArray}
                  strokeLinecap="round"
                />
                {/* Verified Actual Line */}
                <path
                  d={actualPath}
                  fill="none"
                  stroke="#2E7D5B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Variance Trend Line */}
            {isVariance && (
              <path
                d={variancePath}
                fill="none"
                stroke="#B5473C"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Nodes, Readable Direct Values, and X-axis Ticks */}
            {effectiveData.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = idx === hoveredIdx;
              const isDD = pt.isDataDate;
              const colW = plotW / (n - 1);

              const pointVal = isVariance
                ? pt.variance ?? 0
                : pt.actual !== null && pt.actual !== undefined
                ? pt.actual
                : pt.forecast ?? pt.planned ?? 0;

              const y = getY(pointVal);

              return (
                <g
                  key={pt.period}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                >
                  {/* Hover Hit Target */}
                  <rect
                    x={x - colW / 2}
                    y={padTop}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                  />

                  {/* Node Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5.5 : 4}
                    fill={
                      isVariance
                        ? pointVal < 0
                          ? '#B5473C'
                          : pointVal > 0
                          ? '#2E7D5B'
                          : '#596579'
                        : pt.actual !== null
                        ? '#2E7D5B'
                        : '#D98B32'
                    }
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />

                  {/* Readable Direct Value Text */}
                  <text
                    x={x}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#172033"
                  >
                    {isVariance ? (pointVal > 0 ? `+${pointVal}%` : `${pointVal}%`) : `${pointVal}%`}
                  </text>

                  {/* X-axis Tick & Label */}
                  <line
                    x1={x}
                    y1={height - padBottom}
                    x2={x}
                    y2={height - padBottom + 4}
                    stroke="#7B8798"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isDD || isSelected ? '700' : '400'}
                    fill={isSelected ? '#176B87' : isDD ? '#172033' : '#596579'}
                  >
                    {pt.period}
                  </text>
                </g>
              );
            })}

            {/* Explicit X-axis Title */}
            <text
              x={padLeft + plotW / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#596579"
            >
              Timeline (Project Reporting Periods • Cutoff: 18 Sep 2026)
            </text>
          </svg>
        </div>
      </div>

      {/* Legend & Interpretation (Strictly Static, No Animation) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#F1F3F5] text-xs text-[#596579]">
        <div className="flex items-center gap-4 flex-wrap">
          {!isVariance ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-[#176B87] inline-block rounded-xs" />
                <span className="font-semibold text-[#172033]">■ Planned (Neutral/Primary)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-[#2E7D5B] inline-block rounded-xs" />
                <span className="font-semibold text-[#172033]">● Actual (Semantic Contrast)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#7B8798] inline-block" />
                <span className="font-semibold text-[#596579]">▲ Forecast (Dashed Secondary)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-0.5 bg-[#172033] inline-block" />
                <span className="font-semibold text-[#172033]">— Baseline (0.0% Variance)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-[#B5473C] inline-block rounded-xs" />
                <span className="font-semibold text-[#172033]">✕ Schedule Slip Trend [Critical Red]</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-1.5 bg-[#2E7D5B] inline-block rounded-xs" />
                <span className="font-semibold text-[#172033]">✓ Schedule Gain Ahead [Green]</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#172033] inline-block" />
            <span className="font-semibold text-[#172033]">Cutoff Data Date</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#596579]">
          Active Point: <strong className="text-[#172033]">{activePoint.period}</strong> —{' '}
          {isVariance ? (
            <span className={(activePoint.variance ?? 0) < 0 ? 'text-[#B5473C] font-bold' : 'text-[#2E7D5B] font-bold'}>
              {activePoint.variance ?? 0}% pts
            </span>
          ) : (
            <span>
              Act: <strong className="text-[#2E7D5B]">{activePoint.actual ?? activePoint.forecast}%</strong> | Plan: <strong className="text-[#176B87]">{activePoint.planned}%</strong>
            </span>
          )}{' '}
          ({activePoint.notes || 'Normal progression'})
        </div>
      </div>
    </div>
  );
}
