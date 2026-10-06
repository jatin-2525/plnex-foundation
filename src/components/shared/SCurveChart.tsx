'use client';

import React, { useState } from 'react';
import {
  TimeSeriesPoint,
  PROJECT_S_CURVE_DATA,
  getSCurveSummary,
  getSCurveInterpretation,
} from '@/lib/domain/sCurveData';
import { CHART_TOKENS } from '@/tokens/chartColors';

export interface SCurveChartProps {
  data?: TimeSeriesPoint[];
  variant?: 'full' | 'compact';
  title?: string;
  subtitle?: string;
  className?: string;
  showLedgerByDefault?: boolean;
  onSelectPeriod?: (point: TimeSeriesPoint) => void;
}

export function SCurveChart({
  data = PROJECT_S_CURVE_DATA,
  variant = 'full',
  title = 'Project S-Curve — Planned vs. Actual vs. Forecast',
  subtitle = 'Cumulative physical progress curve across all WBS work packages',
  className = '',
  showLedgerByDefault = false,
  onSelectPeriod,
}: SCurveChartProps) {
  const summary = getSCurveSummary(data);
  const dataDateIndex = data.findIndex((d) => d.isDataDate) !== -1 ? data.findIndex((d) => d.isDataDate) : 4;

  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(dataDateIndex);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [showLedger, setShowLedger] = useState<boolean>(showLedgerByDefault);

  const activeIndex = hoveredPointIndex !== null ? hoveredPointIndex : selectedPointIndex;
  const activePoint = data[activeIndex] || data[dataDateIndex];

  // SVG Dimensions & Margins
  const width = variant === 'compact' ? 640 : 760;
  const height = variant === 'compact' ? 230 : 290;
  const padLeft = 56;
  const padRight = 36;
  const padTop = 32;
  const padBottom = 52;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const n = data.length;
  const getX = (i: number) => padLeft + (i / (n - 1)) * plotW;
  const getY = (val: number) => padTop + (1 - val / 100) * plotH;

  // Build SVG Paths for the 3 Major Lines:
  // 1. Planned Line (all points, solid teal #176B87)
  const plannedPathD = data.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.planned);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // 2. Actual Line (points up to data date, solid contrasting semantic #2E7D5B)
  const actualPoints = data.filter((pt) => pt.actual !== null);
  const actualPathD = actualPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.actual as number);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // 3. Forecast Line (from data date onwards, dashed #D98B32)
  const forecastPoints = data.slice(dataDateIndex);
  const forecastPathD = forecastPoints.reduce((acc, pt, idx) => {
    const x = getX(dataDateIndex + idx);
    const y = getY(pt.forecast);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Data Date Coordinates
  const ddX = getX(dataDateIndex);
  const ddPlannedY = getY(data[dataDateIndex].planned);
  const ddActualY = getY(data[dataDateIndex].actual ?? data[dataDateIndex].planned);

  const isCompact = variant === 'compact';
  const interpretationText = getSCurveInterpretation(summary);

  // Active Tooltip Point Metrics
  const activeVariance =
    activePoint.actual !== null
      ? Number((activePoint.actual - activePoint.planned).toFixed(1))
      : Number((activePoint.forecast - activePoint.planned).toFixed(1));

  const activeX = getX(activeIndex);
  const tooltipWidth = 144;
  const tooltipHeight = 78;
  const tooltipX = activeX > width - tooltipWidth - 20 ? activeX - tooltipWidth - 10 : activeX + 12;
  const tooltipY = Math.max(padTop + 6, Math.min(height - padBottom - tooltipHeight - 6, getY(activePoint.planned) - 20));

  const handlePointClick = (idx: number) => {
    setSelectedPointIndex(idx);
    if (onSelectPeriod) {
      onSelectPeriod(data[idx]);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border border-[#D9DEE5] shadow-xs text-[#172033] ${className}`}
      data-testid="s-curve-chart"
    >
      {/* ========================================================= */}
      {/* 1. HEADER: Title, Date & Prominent Summary Values */}
      {/* Planned: XX% | Actual: XX% | Variance: XX% */}
      {/* ========================================================= */}
      <div className="p-4 border-b border-[#D9DEE5] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#172033] tracking-tight">{title}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
              Unit: %
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
              Cutoff: {summary.dataDateLabel}
            </span>
          </div>
          {!isCompact && (
            <p className="text-xs text-[#596579] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Real Project-Control Question Banner */}
        <div className="px-3 py-1.5 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-xs font-mono text-[#176B87] font-semibold self-start lg:self-auto max-w-md">
          <span className="font-sans font-bold text-[#172033] block text-[10px] uppercase tracking-wide">
            Project-Control Question:
          </span>
          Is cumulative physical progress tracking ahead or behind the approved baseline curve?
        </div>

        {/* Summary values above / beside chart */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Planned */}
          <div className="px-3 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center gap-1.5 shadow-2xs">
            <span className="text-[#596579] font-sans font-medium text-[11px]">Planned:</span>
            <span className="font-bold text-[#176B87]">{summary.plannedAtDataDate.toFixed(1)}%</span>
          </div>

          {/* Actual */}
          <div className="px-3 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center gap-1.5 shadow-2xs">
            <span className="text-[#596579] font-sans font-medium text-[11px]">Actual:</span>
            <span className="font-bold text-[#2E7D5B]">{summary.actualAtDataDate.toFixed(1)}%</span>
          </div>

          {/* Variance */}
          <div
            className={`px-3 py-1.5 rounded border flex items-center gap-1.5 shadow-2xs ${
              summary.varianceAtDataDate < 0
                ? 'bg-[#FDF6ED] border-[#F0D4A6]'
                : 'bg-[#EDF7F2] border-[#B8DCC9]'
            }`}
          >
            <span className="text-[#596579] font-sans font-medium text-[11px]">Variance:</span>
            <span
              className={`font-bold ${
                summary.varianceAtDataDate < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
              }`}
            >
              {summary.varianceAtDataDate > 0
                ? `+${summary.varianceAtDataDate.toFixed(1)}%`
                : `${summary.varianceAtDataDate.toFixed(1)}%`}
            </span>
          </div>

          {summary.forecastFinishDate && (
            <div className="px-3 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center gap-1.5 shadow-2xs">
              <span className="text-[#596579] font-sans font-medium text-[11px]">Forecast Finish:</span>
              <span className="font-semibold text-[#172033]">{summary.forecastFinishDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. STATIC S-CURVE CANVAS AREA */}
      {/* Strictly static, non-animated, clean engineering visualization */}
      {/* ========================================================= */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[620px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-sans"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setHoveredPointIndex(null)}
          >
            {/* Explicit Y-axis Title */}
            <text
              x={padLeft - 40}
              y={padTop - 14}
              textAnchor="start"
              fontSize="10"
              fontWeight="bold"
              fill="#172033"
            >
              Cumulative Progress (%)
            </text>

            {/* Horizontal Grid lines & Y-axis Progress Percentage */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = getY(pct);
              return (
                <g key={pct}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="#E5E9F0"
                    strokeWidth="1"
                    strokeDasharray={pct === 0 || pct === 100 ? undefined : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill="#596579"
                    fontFamily="inherit"
                    fontWeight="500"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Data Date Vertical Reference Line */}
            <line
              x1={ddX}
              y1={padTop}
              x2={ddX}
              y2={height - padBottom}
              stroke="#172033"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            {/* Data Date Callout on top */}
            <rect
              x={ddX - 44}
              y={padTop - 18}
              width={88}
              height={16}
              rx={3}
              fill="#172033"
            />
            <text
              x={ddX}
              y={padTop - 7}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              DATA DATE
            </text>

            {/* Variance Gap between Planned and Actual at Data Date */}
            <line
              x1={ddX}
              y1={ddPlannedY}
              x2={ddX}
              y2={ddActualY}
              stroke="#B5473C"
              strokeWidth="3.5"
            />
            <rect
              x={ddX + 6}
              y={(ddPlannedY + ddActualY) / 2 - 10}
              width={100}
              height={20}
              rx={3}
              fill={CHART_TOKENS.critical.bg}
              stroke={CHART_TOKENS.critical.border}
              strokeWidth="1"
            />
            <text
              x={ddX + 56}
              y={(ddPlannedY + ddActualY) / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={CHART_TOKENS.critical.text}
            >
              -7.0% Var [✕ Critical]
            </text>

            {/* LINE 1: Planned Progress (Neutral/Primary solid line) */}
            <path
              d={plannedPathD}
              fill="none"
              stroke={CHART_TOKENS.planned.stroke}
              strokeWidth={CHART_TOKENS.planned.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* LINE 3: Forecast Progress (Dashed Neutral/Secondary line from data date onwards) */}
            <path
              d={forecastPathD}
              fill="none"
              stroke={CHART_TOKENS.forecast.stroke}
              strokeWidth={CHART_TOKENS.forecast.strokeWidth}
              strokeDasharray={CHART_TOKENS.forecast.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* LINE 2: Actual Progress (Semantic contrast solid line) */}
            <path
              d={actualPathD}
              fill="none"
              stroke={CHART_TOKENS.actual.stroke}
              strokeWidth={CHART_TOKENS.actual.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis ticks, period labels, and hover hit columns */}
            {data.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = idx === activeIndex;
              const isDD = pt.isDataDate;
              const colW = plotW / (n - 1);

              return (
                <g
                  key={pt.period}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onClick={() => handlePointClick(idx)}
                >
                  {/* Invisible wide hover hit target */}
                  <rect
                    x={x - colW / 2}
                    y={padTop}
                    width={colW}
                    height={plotH}
                    fill="transparent"
                  />

                  {/* Static Crosshair Guide on Active/Hovered Point */}
                  {isSelected && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={height - padBottom}
                      stroke="#596579"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Planned Node Circle */}
                  <circle
                    cx={x}
                    cy={getY(pt.planned)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#176B87"
                    strokeWidth="2"
                  />

                  {/* Actual Node Circle */}
                  {pt.actual !== null && (
                    <circle
                      cx={x}
                      cy={getY(pt.actual)}
                      r={isSelected ? 5 : 4}
                      fill="#2E7D5B"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Forecast Node Circle (future periods only) */}
                  {pt.actual === null && (
                    <circle
                      cx={x}
                      cy={getY(pt.forecast)}
                      r={isSelected ? 4.5 : 3.5}
                      fill="#D98B32"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* X-axis Period / Date Label */}
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

                  {/* Milestone dot if present */}
                  {pt.milestone && !isCompact && (
                    <circle
                      cx={x}
                      cy={height - padBottom + 26}
                      r="2"
                      fill={pt.actual !== null ? '#2E7D5B' : '#7B8798'}
                    />
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
              Timeline (Project Reporting Periods • Baseline Rev 3.2 • Cutoff: 18 Sep 2026)
            </text>

            {/* ========================================================= */}
            {/* STATIC TOOLTIP ON HOVER (NO ANIMATION) */}
            {/* Shows: Date, Planned, Actual, Variance */}
            {/* ========================================================= */}
            {hoveredPointIndex !== null && (
              <g pointerEvents="none">
                {/* Tooltip Card Background */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={4}
                  fill="#FFFFFF"
                  stroke="#D9DEE5"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 2px 4px rgba(23, 32, 51, 0.08))"
                />

                {/* Date */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 16}
                  fontSize="11"
                  fontWeight="bold"
                  fill="#172033"
                >
                  {activePoint.dateLabel}
                </text>

                {/* Planned */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 33}
                  fontSize="10"
                  fontWeight="500"
                  fill="#596579"
                >
                  Planned: <tspan fontWeight="bold" fill="#176B87">{activePoint.planned.toFixed(1)}%</tspan>
                </text>

                {/* Actual */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 48}
                  fontSize="10"
                  fontWeight="500"
                  fill="#596579"
                >
                  Actual:{' '}
                  {activePoint.actual !== null ? (
                    <tspan fontWeight="bold" fill="#2E7D5B">{activePoint.actual.toFixed(1)}%</tspan>
                  ) : (
                    <tspan fill="#596579">N/A (Future)</tspan>
                  )}
                </text>

                {/* Variance */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 63}
                  fontSize="10"
                  fontWeight="500"
                  fill="#596579"
                >
                  Variance:{' '}
                  <tspan
                    fontWeight="bold"
                    fill={activeVariance < 0 ? '#B5473C' : '#2E7D5B'}
                  >
                    {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                    {activePoint.actual === null ? ' (Fcst)' : ''}
                  </tspan>
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Clear Legend (Max 3 Major Lines + Data Date) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-[#F1F3F5] text-xs text-[#596579]">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Planned Line Legend */}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-[#176B87] inline-block rounded-xs" />
              <span className="font-semibold text-[#172033]">■ Planned (Neutral/Primary)</span>
            </div>

            {/* Actual Line Legend */}
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-1.5 bg-[#2E7D5B] inline-block rounded-xs" />
              <span className="font-semibold text-[#172033]">● Actual (Semantic Contrast)</span>
            </div>

            {/* Forecast Line Legend */}
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#7B8798] inline-block" />
              <span className="font-semibold text-[#596579]">▲ Forecast (Dashed Secondary)</span>
            </div>

            {/* Data Date Marker Legend */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#172033] inline-block" />
              <span className="font-semibold text-[#172033]">Cutoff Data Date</span>
            </div>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-semibold text-[#176B87] hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
            >
              {showLedger ? 'Hide Level 3 Ledger' : 'View Level 3 Cumulative Ledger'}
              <span className="text-[10px]">{showLedger ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SHORT INTERPRETATION BELOW */}
      {/* "Actual progress is 7.0 percentage points behind planned progress." */}
      {/* ========================================================= */}
      <div className="mx-4 mb-4 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-xs text-[#172033] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              summary.varianceAtDataDate < 0 ? 'bg-[#B5473C]' : 'bg-[#2E7D5B]'
            }`}
          />
          <p className="font-medium text-[#172033]">
            {interpretationText}
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#596579] shrink-0">
          Cutoff: {summary.dataDateLabel} (Primavera P6 Rev 3.2)
        </span>
      </div>

      {/* Level 2: Selected Period Context ("Why?") */}
      {!isCompact && (
        <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-start md:items-center gap-2">
            <span className="font-semibold text-[#172033] whitespace-nowrap">
              {activePoint.dateLabel}
            </span>
            {activePoint.milestone && (
              <span className="text-[#596579] border-l border-[#D9DEE5] pl-2">
                <strong className="text-[#172033]">Milestone:</strong> {activePoint.milestone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-[#596579]">
            <span>
              Plan: <strong className="font-mono text-[#176B87]">{activePoint.planned.toFixed(1)}%</strong>
            </span>
            {activePoint.actual !== null ? (
              <span>
                Actual: <strong className="font-mono text-[#2E7D5B]">{activePoint.actual.toFixed(1)}%</strong> (Var:{' '}
                <strong
                  className={`font-mono ${
                    activeVariance < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
                  }`}
                >
                  {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                </strong>
                )
              </span>
            ) : (
              <span>
                Forecast: <strong className="font-mono text-[#D98B32]">{activePoint.forecast.toFixed(1)}%</strong>
              </span>
            )}
          </div>

          {activePoint.notes && (
            <p className="text-[11px] text-[#596579] italic max-w-md truncate">
              {activePoint.notes}
            </p>
          )}
        </div>
      )}

      {/* Level 3: Expandable Cumulative Progress Ledger */}
      {showLedger && !isCompact && (
        <div className="p-4 border-t border-[#D9DEE5] bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-[#596579] tracking-wider">
              Level 3 — Cumulative Physical Progress Ledger (Audit Trail)
            </h4>
            <span className="text-[11px] text-[#7B8798]">Source: Primavera P6 Baseline Rev 3.2</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#D9DEE5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F1F3F5] text-[#172033] border-b border-[#D9DEE5]">
                  <th className="py-2 px-3 font-semibold">Period</th>
                  <th className="py-2 px-3 font-semibold">Cutoff Date</th>
                  <th className="py-2 px-3 font-semibold text-right">Planned Cum %</th>
                  <th className="py-2 px-3 font-semibold text-right">Actual Cum %</th>
                  <th className="py-2 px-3 font-semibold text-right">Forecast Cum %</th>
                  <th className="py-2 px-3 font-semibold text-right">Variance %</th>
                  <th className="py-2 px-3 font-semibold">Work Package / Milestone Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {data.map((row) => {
                  const varVal = row.actual !== null ? Number((row.actual - row.planned).toFixed(1)) : null;
                  const isCurrentDD = row.isDataDate;
                  return (
                    <tr
                      key={row.period}
                      className={`hover:bg-[#F7F8FA] transition-colors ${
                        isCurrentDD ? 'bg-[#EDF5F8] font-medium' : ''
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        {row.period}
                        {isCurrentDD && (
                          <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#176B87] text-white">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#596579] whitespace-nowrap">{row.dateLabel}</td>
                      <td className="py-2 px-3 font-mono text-right text-[#176B87] font-semibold">{row.planned.toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono text-right text-[#2E7D5B] font-semibold">
                        {row.actual !== null ? `${row.actual.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-[#D98B32]">
                        {row.forecast.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2 px-3 font-mono text-right font-semibold ${
                          varVal === null
                            ? 'text-[#7B8798]'
                            : varVal < 0
                            ? 'text-[#B5473C]'
                            : 'text-[#2E7D5B]'
                        }`}
                      >
                        {varVal !== null ? (varVal > 0 ? `+${varVal}%` : `${varVal}%`) : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#596579]">
                        <span className="font-medium text-[#172033]">{row.milestone}</span>
                        {row.notes && <span className="block text-[11px] text-[#7B8798]">{row.notes}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
