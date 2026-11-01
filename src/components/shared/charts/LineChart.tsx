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
  { period: 'Dec 2026', dateLabel: '20 Dec 2026', planned: 100, actual: null, forecast: 100, notes: 'Commercial completion (+5d)' },
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
  { period: 'Dec 2026', dateLabel: '20 Dec 2026', variance: 0.0, notes: 'Target zero float recovered' },
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
    <div className={`bg-white rounded-lg border border-[#D8E2EA] p-4 sm:p-6 shadow-xs text-[#142C3F] ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#D8E2EA] gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#142C3F] tracking-tight">{displayTitle}</h3>
            <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA] text-[10px] font-mono font-bold">
              Unit: {effectiveUnit}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#F3F6FA] text-[#526779] border border-[#D8E2EA] text-[10px] font-mono">
              {timeRange}
            </span>
          </div>
          <p className="text-xs text-[#526779] mt-0.5">{displaySubtitle}</p>
        </div>

        {/* Project Question Banner (only if explicitly provided) */}
        {projectQuestion && (
          <div className="px-3 py-1.5 rounded bg-[#EAF0F5] border border-[#D8E2EA] text-xs font-mono text-[#0F6B68] font-semibold self-start lg:self-auto max-w-md">
            <span className="font-sans font-bold text-[#142C3F] block text-[10px] uppercase tracking-wide">
              Project Question:
            </span>
            {displayQuestion}
          </div>
        )}
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4 text-xs font-mono">
        {!isVariance ? (
          <>
            <div className="p-2 bg-[#F3F6FA] rounded border border-[#D8E2EA]">
              <span className="text-[#526779] block text-[10px] font-sans">Planned Target</span>
              <span className="font-bold text-[#5274B8]">
                {effectiveData[dataDateIndex]?.planned ?? 80}%
              </span>
            </div>
            <div className="p-2 bg-[#F3F6FA] rounded border border-[#D8E2EA]">
              <span className="text-[#526779] block text-[10px] font-sans">Verified Actual</span>
              <span className="font-bold text-[#176B53]">
                {effectiveData[dataDateIndex]?.actual ?? 73}%
              </span>
            </div>
            <div className="p-2 bg-[#FFF1D3] rounded border border-[#F8DDA2]">
              <span className="text-[#845006] block text-[10px] font-sans">Current Variance</span>
              <span className="font-bold text-[#A24335]">-7.0%</span>
            </div>
            <div className="p-2 bg-[#F3F6FA] rounded border border-[#D8E2EA]">
              <span className="text-[#526779] block text-[10px] font-sans">Forecast Completion</span>
              <span className="font-bold text-[#142C3F]">20 Dec 2026 (+5d)</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-[#F3F6FA] rounded border border-[#D8E2EA]">
              <span className="text-[#526779] block text-[10px] font-sans">Baseline Zero Slip</span>
              <span className="font-bold text-[#526779]">0.0% pts</span>
            </div>
            <div className="p-2 bg-[#FCE8E4] rounded border border-[#F6C7BE]">
              <span className="text-[#526779] block text-[10px] font-sans">Active Maximum Slip</span>
              <span className="font-bold text-[#A24335]">-7.0% pts (18 Sep)</span>
            </div>
            <div className="p-2 bg-[#E4F4EC] rounded border border-[#BDE4D0]">
              <span className="text-[#526779] block text-[10px] font-sans">Peak Prior Gain</span>
              <span className="font-bold text-[#176B53]">+2.0% pts (Jun/Jul)</span>
            </div>
            <div className="p-2 bg-[#F3F6FA] rounded border border-[#D8E2EA]">
              <span className="text-[#526779] block text-[10px] font-sans">Target Recovery</span>
              <span className="font-bold text-[#5274B8]">0.0% pts by Dec</span>
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
                    stroke={isZero ? '#142C3F' : CHART_TOKENS.neutral.grid}
                    strokeWidth={isZero ? '1.5' : '1'}
                    strokeDasharray={isZero ? undefined : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill={isZero ? '#142C3F' : '#526779'}
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
              fill="#142C3F"
            >
              {isVariance ? `Variance (${effectiveUnit})` : `Progress (${effectiveUnit})`}
            </text>

            {/* Data Date Reference Line */}
            <line
              x1={getX(dataDateIndex)}
              y1={padTop}
              x2={getX(dataDateIndex)}
              y2={height - padBottom}
              stroke="#142C3F"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <rect
              x={getX(dataDateIndex) - 40}
              y={padTop - 18}
              width={80}
              height={16}
              rx={3}
              fill="#142C3F"
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
                  stroke={CHART_TOKENS.planned.stroke}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Forecast Line (Dashed Violet) */}
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
                  stroke={CHART_TOKENS.actual.stroke}
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
                stroke={CHART_TOKENS.variance.stroke}
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
                          ? '#A24335'
                          : pointVal > 0
                          ? '#0D8879'
                          : '#526779'
                        : pt.actual !== null
                        ? '#0D8879'
                        : '#8057B7'
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
                    fill="#142C3F"
                  >
                    {isVariance ? (pointVal > 0 ? `+${pointVal}%` : `${pointVal}%`) : `${pointVal}%`}
                  </text>

                  {/* X-axis Tick & Label */}
                  <line
                    x1={x}
                    y1={height - padBottom}
                    x2={x}
                    y2={height - padBottom + 4}
                    stroke="#D8E2EA"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight={isDD || isSelected ? '700' : '400'}
                    fill={isSelected ? '#0F6B68' : isDD ? '#142C3F' : '#526779'}
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
              fill="#526779"
            >
              Timeline (Project Reporting Periods • Cutoff: 18 Sep 2026)
            </text>
          </svg>
        </div>
      </div>

      {/* Legend & Interpretation (Strictly Static, No Animation) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#D8E2EA] text-xs text-[#526779]">
        <div className="flex items-center gap-4 flex-wrap">
          {!isVariance ? (
            <>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1 bg-[#5274B8] inline-block rounded-xs" />
                <span className="font-semibold text-[#142C3F]">■ Planned Target</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 bg-[#0D8879] inline-block rounded-xs" />
                <span className="font-semibold text-[#142C3F]">● Verified Actual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#8057B7] inline-block" />
                <span className="font-semibold text-[#526779]">▲ Forecast (Dashed)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 bg-[#142C3F] inline-block" />
                <span className="font-semibold text-[#142C3F]">— Baseline (0.0% Variance)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 bg-[#A24335] inline-block rounded-xs" />
                <span className="font-semibold text-[#142C3F]">✕ Schedule Slip Trend</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-1.5 bg-[#0D8879] inline-block rounded-xs" />
                <span className="font-semibold text-[#142C3F]">✓ Schedule Gain Ahead</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-[#142C3F] inline-block" />
            <span className="font-semibold text-[#142C3F]">Cutoff Data Date</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-[#526779]">
          Active Point: <strong className="text-[#142C3F]">{activePoint.period}</strong> —{' '}
          {isVariance ? (
            <span className={(activePoint.variance ?? 0) < 0 ? 'text-[#A24335] font-bold' : 'text-[#0D8879] font-bold'}>
              {activePoint.variance ?? 0}% pts
            </span>
          ) : (
            <span>
              Act: <strong className="text-[#0D8879]">{activePoint.actual ?? activePoint.forecast}%</strong> | Plan: <strong className="text-[#5274B8]">{activePoint.planned}%</strong>
            </span>
          )}{' '}
          ({activePoint.notes || 'Normal progression'})
        </div>
      </div>
    </div>
  );
}
