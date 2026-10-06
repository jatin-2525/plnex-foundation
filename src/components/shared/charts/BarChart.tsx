'use client';

import React from 'react';
import { CHART_TOKENS } from '../../../tokens/chartColors';

export interface BarChartItem {
  label: string; // e.g. "Piping" or "Unit A - Gas Processing"
  subLabel?: string; // e.g. "35% Scope" or "AREA-01 • Critical Path"
  planned: number; // 0-100%
  actual: number; // 0-100%
  variance?: number; // e.g. -14
  status?: 'Ahead' | 'On Track' | 'Behind';
  isCriticalPath?: boolean;
  totalFloatDays?: number;
  driver?: string;
}

export interface BarChartProps {
  variant?: 'discipline' | 'area';
  title?: string;
  subtitle?: string;
  projectQuestion?: string;
  timeRange?: string;
  unit?: string;
  items?: BarChartItem[];
  className?: string;
}

// Canonical Progress by Discipline
const DEFAULT_DISCIPLINE_ITEMS: BarChartItem[] = [
  {
    label: 'Piping',
    subLabel: '35% Scope',
    planned: 82.0,
    actual: 68.0,
    variance: -14.0,
    status: 'Behind',
    driver: 'Line 24 field butt welding hold (4 joints pending RT)',
  },
  {
    label: 'Civil',
    subLabel: '25% Scope',
    planned: 94.0,
    actual: 97.0,
    variance: 3.0,
    status: 'Ahead',
    driver: 'Compressor foundation pedestal 45 m³ pour complete',
  },
  {
    label: 'Electrical',
    subLabel: '15% Scope',
    planned: 70.0,
    actual: 65.0,
    variance: -5.0,
    status: 'Behind',
    driver: '350m cable pull complete; overhead bracket delay',
  },
  {
    label: 'Mechanical',
    subLabel: '15% Scope',
    planned: 75.0,
    actual: 78.0,
    variance: 3.0,
    status: 'Ahead',
    driver: 'Compressor C-101 laser alignment running ahead',
  },
  {
    label: 'Instrumentation',
    subLabel: '10% Scope',
    planned: 45.0,
    actual: 40.0,
    variance: -5.0,
    status: 'Behind',
    driver: 'Transmitter bracket held awaiting hydrotest signoff',
  },
];

// Canonical Progress by Area
const DEFAULT_AREA_ITEMS: BarChartItem[] = [
  {
    label: 'Unit A - Gas Processing',
    subLabel: 'AREA-01 • 45% WBS',
    planned: 84.0,
    actual: 72.0,
    variance: -12.0,
    status: 'Behind',
    isCriticalPath: true,
    totalFloatDays: 0,
    driver: 'On zero-float critical path; drives 85% of net lag',
  },
  {
    label: 'Unit A - Compressor',
    subLabel: 'AREA-02 • 25% WBS',
    planned: 92.0,
    actual: 95.0,
    variance: 3.0,
    status: 'Ahead',
    isCriticalPath: false,
    totalFloatDays: 8,
    driver: 'Civil pedestal complete; 8 days buffer float',
  },
  {
    label: 'Unit B - Offsites',
    subLabel: 'AREA-03 • 15% WBS',
    planned: 65.0,
    actual: 60.0,
    variance: -5.0,
    status: 'Behind',
    isCriticalPath: false,
    totalFloatDays: 14,
    driver: 'Drainage piping complete; 14 days buffer float',
  },
  {
    label: 'Unit 02 - Flare System',
    subLabel: 'AREA-04 • 15% WBS',
    planned: 70.0,
    actual: 68.0,
    variance: -2.0,
    status: 'Behind',
    isCriticalPath: false,
    totalFloatDays: 20,
    driver: 'Flare KO drum vessel erected; 20 days float',
  },
];

export function BarChart({
  variant = 'discipline',
  title,
  subtitle,
  projectQuestion,
  timeRange = 'As of Cutoff: 18 Sep 2026',
  unit = '%',
  items,
  className = '',
}: BarChartProps) {
  const isDiscipline = variant === 'discipline';
  const effectiveItems = items || (isDiscipline ? DEFAULT_DISCIPLINE_ITEMS : DEFAULT_AREA_ITEMS);

  const defaultTitle = isDiscipline
    ? 'Progress by Discipline — Planned vs. Verified Actual'
    : 'Progress by Area — Planned vs. Verified Actual';

  const defaultSubtitle = isDiscipline
    ? 'Comparison of physical progress earned against P6 baseline targets across engineering disciplines'
    : 'Geographical battery limit performance tracking with CPM critical path and float status';

  const defaultQuestion = isDiscipline
    ? 'Which engineering discipline is leading or lagging against its discipline-specific target?'
    : 'Which physical battery limit has progress bottlenecks?';

  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;
  const displayQuestion = projectQuestion || defaultQuestion;

  // Layout parameters for SVG
  const width = 720;
  const height = 280;
  const padLeft = 56;
  const padRight = 30;
  const padTop = 36;
  const padBottom = 54;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = effectiveItems.length;
  const groupW = plotW / n;
  const barW = Math.min(28, (groupW - 20) / 2);

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padTop + (1 - clamped / 100) * plotH;
  };

  return (
    <div className={`bg-white rounded-lg border border-[#D9DEE5] p-5 shadow-xs text-[#172033] ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#172033] tracking-tight">{displayTitle}</h3>
            <span className="px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[10px] font-mono font-bold">
              Unit: {unit}
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

      {/* SVG Canvas (Side-by-side Planned vs Actual Bars, No animation) */}
      <div className="overflow-x-auto mt-4">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-sans"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Horizontal Grid lines & Y-axis labels */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#E5E9F0"
                    strokeWidth="1"
                    strokeDasharray={val === 0 || val === 100 ? undefined : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill="#7B8798"
                    fontFamily="inherit"
                    fontWeight="500"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Explicit Y-axis Title */}
            <text
              x={padLeft - 42}
              y={padTop - 14}
              textAnchor="start"
              fontSize="10"
              fontWeight="bold"
              fill="#172033"
            >
              Physical Progress ({unit})
            </text>

            {/* Bars for Each Group */}
            {effectiveItems.map((item, idx) => {
              const groupCenterX = padLeft + idx * groupW + groupW / 2;
              const plannedX = groupCenterX - barW - 2;
              const actualX = groupCenterX + 2;

              const plannedY = getY(item.planned);
              const plannedH = height - padBottom - plannedY;

              const actualY = getY(item.actual);
              const actualH = height - padBottom - actualY;

              const isBehind = item.actual < item.planned;
              const isAhead = item.actual > item.planned;
              const varianceVal = item.variance ?? Number((item.actual - item.planned).toFixed(1));

              return (
                <g key={item.label}>
                  {/* Background highlight column on hover */}
                  <rect
                    x={padLeft + idx * groupW + 4}
                    y={padTop}
                    width={groupW - 8}
                    height={plotH}
                    fill="#F7F8FA"
                    opacity="0.5"
                    rx={4}
                  />

                  {/* Planned Target Bar (Teal outline / soft fill) */}
                  <rect
                    x={plannedX}
                    y={plannedY}
                    width={barW}
                    height={Math.max(2, plannedH)}
                    fill={CHART_TOKENS.planned.fill}
                    stroke={CHART_TOKENS.planned.stroke}
                    strokeWidth="1.5"
                    rx={2}
                  />

                  {/* Planned Direct Value Label */}
                  <text
                    x={plannedX + barW / 2}
                    y={plannedY - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={CHART_TOKENS.planned.text}
                  >
                    {item.planned.toFixed(0)}%
                  </text>

                  {/* Actual Earned Bar (Green if on track, Rose/Red if lagging) */}
                  <rect
                    x={actualX}
                    y={actualY}
                    width={barW}
                    height={Math.max(2, actualH)}
                    fill={isBehind ? CHART_TOKENS.critical.fill : CHART_TOKENS.positive.fill}
                    rx={2}
                  />

                  {/* Actual Direct Value Label */}
                  <text
                    x={actualX + barW / 2}
                    y={actualY - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={isBehind ? CHART_TOKENS.critical.text : CHART_TOKENS.positive.text}
                  >
                    {item.actual.toFixed(0)}%
                  </text>

                  {/* Variance Delta Pill above group with multi-channel glyph */}
                  <rect
                    x={groupCenterX - 28}
                    y={padTop - 18}
                    width={56}
                    height={16}
                    rx={3}
                    fill={isBehind ? CHART_TOKENS.critical.bg : isAhead ? CHART_TOKENS.positive.bg : CHART_TOKENS.neutral.bg}
                    stroke={isBehind ? CHART_TOKENS.critical.border : isAhead ? CHART_TOKENS.positive.border : CHART_TOKENS.neutral.border}
                    strokeWidth="1"
                  />
                  <text
                    x={groupCenterX}
                    y={padTop - 7}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill={isBehind ? CHART_TOKENS.critical.text : isAhead ? CHART_TOKENS.positive.text : CHART_TOKENS.neutral.text}
                  >
                    {varianceVal > 0 ? `+${varianceVal}% [✓]` : `${varianceVal}% [✕]`}
                  </text>

                  {/* X-axis Category Label */}
                  <text
                    x={groupCenterX}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#172033"
                  >
                    {item.label}
                  </text>

                  {/* Sub-label (Scope Weight or Area Code) */}
                  {item.subLabel && (
                    <text
                      x={groupCenterX}
                      y={height - padBottom + 29}
                      textAnchor="middle"
                      fontSize="9"
                      fontFamily="monospace"
                      fill="#7B8798"
                    >
                      {item.subLabel}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Explicit X-axis Title */}
            <text
              x={padLeft + plotW / 2}
              y={height - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#596579"
            >
              {isDiscipline ? 'Engineering Disciplines' : 'Plant Battery Limits & Areas'}
            </text>
          </svg>
        </div>
      </div>

      {/* Legend & Concise Drivers */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#F1F3F5] text-xs text-[#596579]">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#E0EEF2] border border-[#176B87] inline-block rounded-xs" />
            <span>Planned Target</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#2E7D5B] inline-block rounded-xs" />
            <span>Actual (On-Track / Ahead)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 bg-[#B5473C] inline-block rounded-xs" />
            <span>Actual (Behind Schedule)</span>
          </div>
        </div>

        <div className="text-[11px] text-[#596579] font-mono">
          Total Analyzed: <strong className="text-[#172033]">{effectiveItems.length} {isDiscipline ? 'Disciplines' : 'Areas'}</strong> • Primavera P6 Baseline Rev 3.2
        </div>
      </div>
    </div>
  );
}
