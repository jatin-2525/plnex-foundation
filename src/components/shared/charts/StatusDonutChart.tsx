'use client';

import React from 'react';
import { CHART_TOKENS } from '@/tokens';

export interface StatusSliceItem {
  id: string;
  label: string; // e.g. "Verified / Approved"
  count: number;
  color: string; // e.g. CHART_TOKENS.positive.fill
  glyph?: string; // Multi-channel indicator e.g. "✓", "●", "▲"
  description?: string;
}

export interface StatusDonutChartProps {
  title?: string;
  subtitle?: string;
  projectQuestion?: string;
  timeRange?: string;
  unit?: string;
  slices?: StatusSliceItem[];
  centerLabel?: string;
  className?: string;
}

// Canonical Limited Status Distribution for Execution Events
const DEFAULT_EXECUTION_STATUS_SLICES: StatusSliceItem[] = [
  {
    id: 'verified',
    label: 'Verified & Committed',
    count: 12,
    color: CHART_TOKENS.positive.fill, // Green #2E7D5B
    glyph: '✓',
    description: 'Signed off with verified audit record and evidence proof',
  },
  {
    id: 'pending',
    label: 'Pending Engineering Review',
    count: 4,
    color: CHART_TOKENS.planned.stroke, // Primary Teal #176B87
    glyph: '●',
    description: 'Matched candidate; awaiting Lead Engineer confirmation',
  },
  {
    id: 'attention',
    label: 'Unmatched / Attention Required',
    count: 2,
    color: CHART_TOKENS.warning.fill, // Amber #D98B32
    glyph: '▲',
    description: 'Ambiguous field statement or low confidence score (<70%)',
  },
];

export function StatusDonutChart({
  title = 'Execution Event Status Distribution',
  subtitle = 'Proportion of field site events verified and committed to the live schedule model',
  projectQuestion = 'What proportion of field execution events are verified vs. awaiting engineering review?',
  timeRange = 'Execution Pipeline as of 18 Sep 2026',
  unit = 'Events',
  slices = DEFAULT_EXECUTION_STATUS_SLICES,
  centerLabel = 'Total Events',
  className = '',
}: StatusDonutChartProps) {
  const total = slices.reduce((acc, s) => acc + s.count, 0);

  // SVG Geometry for Static Donut Ring
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute strokeDasharray offsets
  let cumulativePercent = 0;
  const sliceArcs = slices.map((slice) => {
    const percent = total > 0 ? slice.count / total : 0;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    return {
      ...slice,
      percent,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className={`bg-white rounded-lg border border-[#D9DEE5] p-4 sm:p-6 shadow-xs text-[#172033] ${className}`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#172033] tracking-tight">{title}</h3>
            <span className="px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[10px] font-mono font-bold">
              Unit: {unit}
            </span>
            <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5] text-[10px] font-mono">
              {timeRange}
            </span>
          </div>
          <p className="text-xs text-[#596579] mt-0.5">{subtitle}</p>
        </div>

        {/* Project Question Banner (only if explicitly provided) */}
        {projectQuestion && (
          <div className="px-3 py-1.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-xs font-mono text-[#176B87] font-semibold self-start lg:self-auto max-w-md">
            <span className="font-sans font-bold text-[#172033] block text-[10px] uppercase tracking-wide">
              Project Question:
            </span>
            {projectQuestion}
          </div>
        )}
      </div>

      {/* Content: Static Donut on Left, Detailed Data Table on Right */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mt-4">
        {/* Static Donut Ring (No 3D, No Rainbow, No animation) */}
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <svg
            width={size}
            height={size}
            className="select-none font-sans -rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background Circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={CHART_TOKENS.neutral.border}
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {sliceArcs.map((slice) => (
              <circle
                key={slice.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                strokeLinecap="butt"
              />
            ))}
          </svg>

          {/* Center Text (Direct Readable Values) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-black font-mono text-[#172033] leading-none">
              {total}
            </span>
            <span className="text-[10px] text-[#596579] font-medium uppercase tracking-wider mt-1">
              {centerLabel}
            </span>
          </div>
        </div>

        {/* Legend Table with Exact Counts, Multi-Channel Glyphs, and Percentages */}
        <div className="flex-1 w-full space-y-2">
          {sliceArcs.map((slice) => (
            <div
              key={slice.id}
              className="p-3 rounded-md border border-[#D9DEE5] bg-[#F7F8FA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-xs flex-shrink-0 inline-flex items-center justify-center text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: slice.color }}
                >
                  {slice.glyph || '●'}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#172033] block">{slice.label}</span>
                    <span className="font-mono text-[10px] text-[#596579]">[{slice.glyph || '●'}]</span>
                  </div>
                  {slice.description && (
                    <span className="text-[10px] text-[#596579] block">
                      {slice.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono self-end sm:self-center">
                <span className="font-bold text-[#172033]">
                  {slice.count} {unit}
                </span>
                <span className="text-[#7B8798]">•</span>
                <span className="font-bold px-1.5 py-0.5 rounded bg-white border border-[#D9DEE5] text-[#172033]">
                  {(slice.percent * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#F1F3F5] flex flex-wrap items-center justify-between text-xs text-[#596579] font-mono">
        <span>Validation Engine: PLnEX Verification Rules</span>
        <span>Quality Standard: 100% Traceable to Signed Evidence</span>
      </div>
    </div>
  );
}
