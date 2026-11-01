'use client';

import React from 'react';
import { CHART_TOKENS } from '@/tokens';

export interface HorizontalBarItem {
  id: string; // e.g. "CIV-11-001" or "PIP-24-002"
  label: string; // e.g. "Foundation Block A"
  subLabel?: string; // e.g. "Civil • Compressor Pedestal"
  value: number; // e.g. 5 (days) or -15 (%) or 8 (items)
  valueDisplay?: string; // e.g. "+5 Days" or "-15.0%" or "8 Items"
  isCritical?: boolean;
  totalFloat?: number;
  category?: string;
  contextNote?: string;
}

export interface HorizontalBarChartProps {
  variant?: 'delayed-activities' | 'top-variances' | 'review-backlog';
  title?: string;
  subtitle?: string;
  projectQuestion?: string;
  timeRange?: string;
  unit?: string;
  items?: HorizontalBarItem[];
  className?: string;
  maxBars?: number;
}

// Canonical Delayed Activities Dataset
const DEFAULT_DELAYED_ACTIVITIES: HorizontalBarItem[] = [
  {
    id: 'CIV-11-001',
    label: 'Foundation Block A - Compressor Pedestal',
    subLabel: 'Civil • Area 01',
    value: 5,
    valueDisplay: '+5 Days',
    isCritical: true,
    totalFloat: 0,
    contextNote: 'Curing hold and concrete test report verification delay',
  },
  {
    id: 'PIP-24-002',
    label: 'Weld Line 24-XX Field Joints & NDT',
    subLabel: 'Piping • Area 01',
    value: 4,
    valueDisplay: '+4 Days',
    isCritical: true,
    totalFloat: 0,
    contextNote: 'Monsoon squall stoppage and evening shift RT hold',
  },
  {
    id: 'PIP-24-001',
    label: 'Erect Line 24-XX High Pressure Header',
    subLabel: 'Piping • Area 01',
    value: 2,
    valueDisplay: '+2 Days',
    isCritical: true,
    totalFloat: 0,
    contextNote: 'Crane mobilization delayed by muddy ground at laydown',
  },
  {
    id: 'ELE-11-032',
    label: 'Cable Tray Installation - Gallery',
    subLabel: 'Electrical • Area 02',
    value: 2,
    valueDisplay: '+2 Days',
    isCritical: false,
    totalFloat: 2,
    contextNote: 'Bracket shipment arrival delayed by 2 days; absorbs float',
  },
  {
    id: 'INS-04-015',
    label: 'Transmitter Instrument Impulse Tubing',
    subLabel: 'Instrumentation • Area 01',
    value: 1,
    valueDisplay: '+1 Day',
    isCritical: false,
    totalFloat: 5,
    contextNote: 'Held awaiting piping hydrotest clearance sign-off',
  },
];

// Canonical Top Variances Dataset (Reconciled with 80.0% Planned / 73.0% Actual)
const DEFAULT_TOP_VARIANCES: HorizontalBarItem[] = [
  {
    id: 'PIP-24-SCOPE',
    label: 'Piping Erection & Welding Scope',
    subLabel: 'Discipline Level • 35% Weight',
    value: 17.0,
    valueDisplay: '-17.0%',
    isCritical: true,
    contextNote: 'Actual 68% vs Planned 85% • 4 joints pending RT',
  },
  {
    id: 'PIP-24-002',
    label: 'Weld Line 24-XX Field Joints & NDT',
    subLabel: 'Piping • WBS 1.1.3.2.2',
    value: 15.0, // Abs value for rendering bar length
    valueDisplay: '-15.0%',
    isCritical: true,
    contextNote: 'Actual 70% vs Planned 85% • NDT clearance hold',
  },
  {
    id: 'AREA-01-GAS',
    label: 'Unit A - Gas Processing Battery Limit',
    subLabel: 'Area Level • 45% Scope',
    value: 14.0,
    valueDisplay: '-14.0%',
    isCritical: true,
    contextNote: 'Actual 69% vs Planned 83% • Zero float critical path',
  },
  {
    id: 'ELE-11-032',
    label: 'Cable Tray Installation - Overhead Gallery',
    subLabel: 'Electrical • WBS 1.1.4.1.2',
    value: 8.0,
    valueDisplay: '-8.0%',
    isCritical: false,
    contextNote: 'Actual 64% vs Planned 72% • Bracket logistics delay',
  },
  {
    id: 'INS-04-SCOPE',
    label: 'Instrumentation & Loop Tubing',
    subLabel: 'Discipline Level • 10% Weight',
    value: 4.0,
    valueDisplay: '-4.0%',
    isCritical: false,
    contextNote: 'Actual 39% vs Planned 43% • Awaiting piping test signoff',
  },
];

// Canonical Review Backlog Dataset
const DEFAULT_REVIEW_BACKLOG: HorizontalBarItem[] = [
  {
    id: 'REV-PIP',
    label: 'Piping Field Submissions Backlog',
    subLabel: 'Spool erection & weld fit-up logs',
    value: 8,
    valueDisplay: '8 Items',
    category: 'High Priority',
    contextNote: 'Includes 4 field butt welds awaiting RT certificate verification',
  },
  {
    id: 'REV-ELE',
    label: 'Electrical Cable Pull & Tray Backlog',
    subLabel: 'Substation cable trench runs',
    value: 4,
    valueDisplay: '4 Items',
    category: 'Medium Priority',
    contextNote: 'Inspection photos matched to WBS 1.1.4.1.2; pending lead engineer stamp',
  },
  {
    id: 'REV-CIV',
    label: 'Civil Batch Tickets & Core Cylinders',
    subLabel: 'Compressor pedestal pour tickets',
    value: 2,
    valueDisplay: '2 Items',
    category: 'Normal Priority',
    contextNote: '7-day compressive strength lab test reports to attach',
  },
  {
    id: 'REV-MEC',
    label: 'Mechanical Equipment Alignment Runs',
    subLabel: 'Laser tool shim calibration',
    value: 1,
    valueDisplay: '1 Item',
    category: 'Normal Priority',
    contextNote: 'Preliminary shim check sheet submitted via offline sync',
  },
];

export function HorizontalBarChart({
  variant = 'delayed-activities',
  title,
  subtitle,
  projectQuestion,
  timeRange = 'Reporting Window: 18 Sep 2026',
  unit,
  items,
  className = '',
  maxBars = 5,
}: HorizontalBarChartProps) {
  let effectiveItems = items;
  let defaultUnit = 'Days';
  let defaultTitle = 'Delayed Activities — Schedule Slip & Critical Path Impact';
  let defaultSubtitle = 'Ranked list of activities driving schedule slips with CPM float consumption';
  let defaultQuestion = 'Which critical activities are driving the largest schedule delays?';

  if (variant === 'top-variances') {
    effectiveItems = effectiveItems || DEFAULT_TOP_VARIANCES;
    defaultUnit = '%';
    defaultTitle = 'Top Variances — Largest Negative Schedule Slippages';
    defaultSubtitle = 'Activities and work packages contributing the greatest variance percentage drag';
    defaultQuestion = 'Which work packages contribute the highest negative variance percentage to the project?';
  } else if (variant === 'review-backlog') {
    effectiveItems = effectiveItems || DEFAULT_REVIEW_BACKLOG;
    defaultUnit = 'Items';
    defaultTitle = 'Review Backlog — Unverified Execution Events by Discipline';
    defaultSubtitle = 'Pending field events awaiting engineering verification across construction teams';
    defaultQuestion = 'Where are unverified execution items accumulating across disciplines?';
  } else {
    effectiveItems = effectiveItems || DEFAULT_DELAYED_ACTIVITIES;
  }

  const effectiveUnit = unit || defaultUnit;
  const displayTitle = title || defaultTitle;
  const displaySubtitle = subtitle || defaultSubtitle;
  const displayQuestion = projectQuestion || defaultQuestion;

  const displayList = effectiveItems.slice(0, maxBars);
  const maxVal = Math.max(...displayList.map((i) => i.value), 1);

  // SVG Dimensions
  const width = 720;
  const barHeight = 22;
  const rowSpacing = 44;
  const padLeft = 240; // Label column width
  const padRight = 90; // Value label space
  const padTop = 32;
  const padBottom = 38;

  const height = padTop + displayList.length * rowSpacing + padBottom;
  const plotW = width - padLeft - padRight;

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

      {/* SVG Canvas (Static Horizontal Bars, No animation) */}
      <div className="overflow-x-auto mt-4">
        <div className="min-w-[640px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-sans"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background vertical grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const x = padLeft + ratio * plotW;
              const tickVal = Math.round(ratio * maxVal * 10) / 10;
              return (
                <g key={ratio}>
                  <line
                    x1={x}
                    y1={padTop}
                    x2={x}
                    y2={height - padBottom}
                    stroke={CHART_TOKENS.neutral.grid}
                    strokeWidth="1"
                    strokeDasharray={ratio === 0 ? undefined : '3,3'}
                  />
                  <text
                    x={x}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#526779"
                    fontFamily="inherit"
                  >
                    {variant === 'top-variances' ? `-${tickVal}%` : `${tickVal} ${effectiveUnit}`}
                  </text>
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
              fill="#526779"
            >
              {variant === 'delayed-activities'
                ? `Schedule Delay Duration (${effectiveUnit})`
                : variant === 'top-variances'
                ? `Negative Schedule Variance (${effectiveUnit})`
                : `Backlog Accumulation (${effectiveUnit})`}
            </text>

            {/* Rows */}
            {displayList.map((item, idx) => {
              const y = padTop + idx * rowSpacing;
              const barLen = Math.max(6, (item.value / maxVal) * plotW);

              // Colors and multi-channel descriptors based on variant & criticality
              let barColor: string = CHART_TOKENS.planned.stroke;
              let statusBadge = '';

              if (variant === 'delayed-activities') {
                if (item.isCritical) {
                  barColor = CHART_TOKENS.critical.fill;
                  statusBadge = '[✕ Critical Path]';
                } else {
                  barColor = CHART_TOKENS.warning.fill;
                  statusBadge = `[▲ Float: ${item.totalFloat ?? 0}d]`;
                }
              } else if (variant === 'top-variances') {
                if (item.value >= 12) {
                  barColor = CHART_TOKENS.critical.fill;
                  statusBadge = '[✕ Critical Slip]';
                } else {
                  barColor = CHART_TOKENS.warning.fill;
                  statusBadge = '[▲ Warning Slip]';
                }
              } else if (variant === 'review-backlog') {
                if (item.value >= 6) {
                  barColor = CHART_TOKENS.critical.fill;
                  statusBadge = '[✕ High Priority]';
                } else {
                  barColor = CHART_TOKENS.planned.stroke;
                  statusBadge = '[● Standard Queue]';
                }
              }

              return (
                <g key={item.id}>
                  {/* Row Hover Background */}
                  <rect
                    x={4}
                    y={y - 4}
                    width={width - 8}
                    height={rowSpacing - 6}
                    fill={CHART_TOKENS.neutral.bg}
                    opacity="0.4"
                    rx={4}
                  />

                  {/* Left Label: ID & Name */}
                  <text
                    x={padLeft - 10}
                    y={y + 11}
                    textAnchor="end"
                    fontSize="11"
                    fontWeight="bold"
                    fill={CHART_TOKENS.neutral.heading}
                  >
                    {item.label}
                  </text>

                  {/* Left Sub-label: WBS / Area / Critical Path */}
                  <text
                    x={padLeft - 10}
                    y={y + 24}
                    textAnchor="end"
                    fontSize="9"
                    fontFamily="monospace"
                    fill={item.isCritical ? CHART_TOKENS.critical.text : CHART_TOKENS.neutral.text}
                  >
                    {item.id} • {item.subLabel || ''}
                    {item.isCritical ? ' [CRITICAL PATH ✕]' : ''}
                  </text>

                  {/* Background Track */}
                  <rect
                    x={padLeft}
                    y={y + 4}
                    width={plotW}
                    height={barHeight - 6}
                    fill={CHART_TOKENS.neutral.border}
                    rx={3}
                  />

                  {/* Horizontal Bar */}
                  <rect
                    x={padLeft}
                    y={y + 4}
                    width={barLen}
                    height={barHeight - 6}
                    fill={barColor}
                    rx={3}
                  />

                  {/* Readable Value Label with Multi-Channel Indicator */}
                  <text
                    x={padLeft + barLen + 8}
                    y={y + 16}
                    textAnchor="start"
                    fontSize="11"
                    fontWeight="bold"
                    fill={barColor}
                  >
                    {item.valueDisplay || `${item.value} ${effectiveUnit}`} {statusBadge}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend & Summary with Multi-Channel Symbols */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#D8E2EA] text-xs text-[#526779]">
        <div className="flex items-center gap-4 flex-wrap">
          {variant === 'delayed-activities' ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.critical.fill }}
                >
                  ✕
                </span>
                <span className="font-semibold text-[#142C3F]">Critical Path Delay (Zero Float)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.warning.fill }}
                >
                  ▲
                </span>
                <span>Secondary Float Delay</span>
              </div>
            </>
          ) : variant === 'top-variances' ? (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.critical.fill }}
                >
                  ✕
                </span>
                <span className="font-semibold text-[#142C3F]">Severe Variance (&ge; 12% Slip)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.warning.fill }}
                >
                  ▲
                </span>
                <span>Moderate Variance (&lt; 12% Slip)</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.critical.fill }}
                >
                  ✕
                </span>
                <span className="font-semibold text-[#142C3F]">High Priority Backlog (&ge; 6 Items)</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 inline-flex items-center justify-center rounded-xs text-[10px] text-white font-bold leading-none"
                  style={{ backgroundColor: CHART_TOKENS.planned.stroke }}
                >
                  ●
                </span>
                <span>Standard Review Queue</span>
              </div>
            </>
          )}
        </div>

        <div className="text-[11px] text-[#526779] font-mono">
          Showing Top {displayList.length} Drivers • Primavera P6 Live Model
        </div>
      </div>
    </div>
  );
}
