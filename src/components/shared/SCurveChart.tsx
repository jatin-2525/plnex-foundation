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
            <p className="text-xs text-[#526779] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Summary values above / beside chart with consistent palette */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Planned */}
          <div className="px-3 py-1.5 rounded bg-[#F4F7FA] border border-[#D7E1E8] flex items-center gap-2 shadow-2xs">
            <span className="text-[#526779] font-sans font-medium text-[11px]">Planned:</span>
            <span className="font-bold text-[#3D73B5]">{summary.plannedAtDataDate.toFixed(1)}%</span>
          </div>

          {/* Actual */}
          <div className="px-3 py-1.5 rounded bg-[#F4F7FA] border border-[#D7E1E8] flex items-center gap-2 shadow-2xs">
            <span className="text-[#526779] font-sans font-medium text-[11px]">Actual:</span>
            <span className="font-bold text-[#187A6A]">{summary.actualAtDataDate.toFixed(1)}%</span>
          </div>

          {/* Variance */}
          <div
            className={`px-3 py-1.5 rounded border flex items-center gap-2 shadow-2xs ${
              summary.varianceAtDataDate < 0
                ? 'bg-[#FBEFEE] border-[#E8B6BA]'
                : 'bg-[#E8F5F2] border-[#B1DBD2]'
            }`}
          >
            <span className="text-[#526779] font-sans font-medium text-[11px]">Variance:</span>
            <span
              className={`font-bold ${
                summary.varianceAtDataDate < 0 ? 'text-[#B43D47]' : 'text-[#187A6A]'
              }`}
            >
              {summary.varianceAtDataDate > 0
                ? `+${summary.varianceAtDataDate.toFixed(1)}%`
                : `${summary.varianceAtDataDate.toFixed(1)}% SLIP`}
            </span>
          </div>

          {summary.forecastFinishDate && (
            <div className="px-3 py-1.5 rounded bg-[#F4F7FA] border border-[#D7E1E8] flex items-center gap-2 shadow-2xs">
              <span className="text-[#526779] font-sans font-medium text-[11px]">Forecast Finish:</span>
              <span className="font-bold text-[#7655A6]">{summary.forecastFinishDate} (+{summary.forecastDelayDays}d)</span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. STATIC S-CURVE CANVAS AREA (Responsive SVG Container) */}
      {/* Fluid scaling on all screen sizes, no horizontal scroll clipping */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4 w-full">
        <div className="w-full">
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
              stroke="#172B3A"
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            {/* Data Date Callout on top */}
            <rect
              x={ddX - 52}
              y={padTop - 18}
              width={104}
              height={18}
              rx={3}
              fill="#172B3A"
            />
            <text
              x={ddX}
              y={padTop - 5}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#FFFFFF"
            >
              DATA DATE (18 Sep)
            </text>

            {/* Variance Gap between Planned and Actual at Data Date */}
            <line
              x1={ddX}
              y1={ddPlannedY}
              x2={ddX}
              y2={ddActualY}
              stroke="#B43D47"
              strokeWidth="3.5"
            />
            <rect
              x={ddX + 6}
              y={(ddPlannedY + ddActualY) / 2 - 10}
              width={112}
              height={20}
              rx={3}
              fill="#FBEFEE"
              stroke="#E8B6BA"
              strokeWidth="1"
            />
            <text
              x={ddX + 62}
              y={(ddPlannedY + ddActualY) / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#922E37"
            >
              -7.0% Slip [Critical]
            </text>

            {/* LINE 1: Planned Progress (Blue solid line #3D73B5) */}
            <path
              d={plannedPathD}
              fill="none"
              stroke={CHART_TOKENS.planned.stroke}
              strokeWidth={CHART_TOKENS.planned.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* LINE 3: Forecast Progress (Violet dashed line #7655A6 from data date onwards) */}
            <path
              d={forecastPathD}
              fill="none"
              stroke={CHART_TOKENS.forecast.stroke}
              strokeWidth={CHART_TOKENS.forecast.strokeWidth}
              strokeDasharray={CHART_TOKENS.forecast.dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* LINE 2: Actual Progress (Verified Teal solid line #187A6A) */}
            <path
              d={actualPathD}
              fill="none"
              stroke={CHART_TOKENS.actual.stroke}
              strokeWidth={CHART_TOKENS.actual.strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis ticks, period labels, and accessible keyboard hit columns */}
            {data.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = idx === activeIndex;
              const isDD = pt.isDataDate;
              const colW = plotW / (n - 1);

              return (
                <g
                  key={pt.period}
                  tabIndex={0}
                  role="button"
                  aria-label={`Reporting period ${pt.period}, Planned ${pt.planned}%, ${pt.actual !== null ? `Actual ${pt.actual}%` : `Forecast ${pt.forecast}%`}`}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onClick={() => handlePointClick(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePointClick(idx);
                    }
                  }}
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
                      stroke="#526779"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Planned Node Circle (Blue stroke #3D73B5) */}
                  <circle
                    cx={x}
                    cy={getY(pt.planned)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#3D73B5"
                    strokeWidth="2"
                  />

                  {/* Actual Node Circle (Verified Teal fill #187A6A) */}
                  {pt.actual !== null && (
                    <circle
                      cx={x}
                      cy={getY(pt.actual)}
                      r={isSelected ? 5 : 4}
                      fill="#187A6A"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Forecast Node Circle (Consistent Violet fill #7655A6) */}
                  {pt.actual === null && (
                    <circle
                      cx={x}
                      cy={getY(pt.forecast)}
                      r={isSelected ? 4.5 : 3.5}
                      fill="#7655A6"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* X-axis Period / Date Label */}
                  <text
                    x={x}
                    y={height - padBottom + 16}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isDD || isSelected ? '700' : '500'}
                    fill={isSelected ? '#0F6574' : isDD ? '#172B3A' : '#526779'}
                  >
                    {pt.period}
                  </text>

                  {/* Milestone dot if present */}
                  {pt.milestone && !isCompact && (
                    <circle
                      cx={x}
                      cy={height - padBottom + 26}
                      r="2"
                      fill={pt.actual !== null ? '#187A6A' : '#7655A6'}
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
              fontSize="11"
              fontWeight="bold"
              fill="#526779"
            >
              Timeline (Project Reporting Periods • Rev 3.2 (P6 XML) • Cutoff: 18 Sep 2026)
            </text>

            {/* ========================================================= */}
            {/* STATIC TOOLTIP ON HOVER (NO ANIMATION) */}
            {/* Shows: Date, Planned, Actual / Forecast, Variance */}
            {/* ========================================================= */}
            {hoveredPointIndex !== null && (
              <g pointerEvents="none">
                {/* Tooltip Card Background */}
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth + 8}
                  height={tooltipHeight}
                  rx={4}
                  fill="#FFFFFF"
                  stroke="#D7E1E8"
                  strokeWidth="1.5"
                  filter="drop-shadow(0 2px 4px rgba(23, 43, 58, 0.08))"
                />

                {/* Date */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 16}
                  fontSize="11"
                  fontWeight="bold"
                  fill="#172B3A"
                >
                  {activePoint.dateLabel}
                </text>

                {/* Planned */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 33}
                  fontSize="11"
                  fontWeight="500"
                  fill="#526779"
                >
                  Planned: <tspan fontWeight="bold" fill="#3D73B5">{activePoint.planned.toFixed(1)}%</tspan>
                </text>

                {/* Actual / Forecast */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 48}
                  fontSize="11"
                  fontWeight="500"
                  fill="#526779"
                >
                  {activePoint.actual !== null ? (
                    <>
                      Actual: <tspan fontWeight="bold" fill="#187A6A">{activePoint.actual.toFixed(1)}%</tspan>
                    </>
                  ) : (
                    <>
                      Forecast: <tspan fontWeight="bold" fill="#7655A6">{activePoint.forecast.toFixed(1)}%</tspan>
                    </>
                  )}
                </text>

                {/* Variance */}
                <text
                  x={tooltipX + 10}
                  y={tooltipY + 63}
                  fontSize="11"
                  fontWeight="500"
                  fill="#526779"
                >
                  Variance:{' '}
                  <tspan
                    fontWeight="bold"
                    fill={activeVariance < 0 ? '#B43D47' : '#187A6A'}
                  >
                    {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                    {activePoint.actual === null ? ' (Fcst)' : ''}
                  </tspan>
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Clear Legend (Planned, Verified Actual, Forecast, Data Date) */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-[#D7E1E8] text-xs text-[#526779]">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Planned Line Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-[#3D73B5] inline-block rounded-xs" />
              <span className="font-semibold text-[#172B3A]">■ Planned Target</span>
            </div>

            {/* Actual Line Legend */}
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 bg-[#187A6A] inline-block rounded-xs" />
              <span className="font-semibold text-[#172B3A]">● Verified Actual</span>
            </div>

            {/* Forecast Line Legend */}
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#7655A6] inline-block" />
              <span className="font-semibold text-[#172B3A]">▲ Forecast</span>
            </div>

            {/* Data Date Marker Legend */}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#172B3A] inline-block" />
              <span className="font-semibold text-[#172B3A]">Cutoff Data Date</span>
            </div>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-semibold text-[#0F6574] hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
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
          Cutoff: {summary.dataDateLabel} (Rev 3.2 (P6 XML))
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

          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[#596579]">
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
            <span className="text-[11px] text-[#7B8798]">Source: Rev 3.2 (P6 XML)</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#D9DEE5]">
            <table className="w-full min-w-[720px] text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F1F3F5]">
                <tr className="bg-[#F1F3F5] text-[#172033] border-b border-[#D9DEE5] h-11">
                  <th className="py-3 px-4 font-semibold">Period</th>
                  <th className="py-3 px-4 font-semibold">Cutoff Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Planned Cum %</th>
                  <th className="py-3 px-4 font-semibold text-right">Actual Cum %</th>
                  <th className="py-3 px-4 font-semibold text-right">Forecast Cum %</th>
                  <th className="py-3 px-4 font-semibold text-right">Variance %</th>
                  <th className="py-3 px-4 font-semibold">Work Package / Milestone Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]/60">
                {data.map((row) => {
                  const varVal = row.actual !== null ? Number((row.actual - row.planned).toFixed(1)) : null;
                  const isCurrentDD = row.isDataDate;
                  return (
                    <tr
                      key={row.period}
                      className={`h-11 sm:h-12 hover:bg-[#F7F8FA] transition-colors ${
                        isCurrentDD ? 'bg-[#EDF5F8] font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        {row.period}
                        {isCurrentDD && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#176B87] text-white">
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
