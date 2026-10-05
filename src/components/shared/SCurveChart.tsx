'use client';

import React, { useState } from 'react';
import {
  TimeSeriesPoint,
  PROJECT_S_CURVE_DATA,
  getSCurveSummary,
} from '@/lib/domain/sCurveData';

interface SCurveChartProps {
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
  title = 'Project S-Curve — Baseline vs. Actual vs. Forecast',
  subtitle = 'Cumulative physical progress curve across all WBS work packages',
  className = '',
  showLedgerByDefault = false,
  onSelectPeriod,
}: SCurveChartProps) {
  const summary = getSCurveSummary(data);
  const dataDateIndex = data.findIndex((d) => d.isDataDate) !== -1 ? data.findIndex((d) => d.isDataDate) : 4;
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(dataDateIndex);
  const [showLedger, setShowLedger] = useState<boolean>(showLedgerByDefault);

  const selectedPoint = data[selectedPointIndex] || data[dataDateIndex];

  // SVG Dimensions & Margins
  const width = variant === 'compact' ? 640 : 760;
  const height = variant === 'compact' ? 220 : 280;
  const padLeft = 48;
  const padRight = 36;
  const padTop = 24;
  const padBottom = 42;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const n = data.length;
  const getX = (i: number) => padLeft + (i / (n - 1)) * plotW;
  const getY = (val: number) => padTop + (1 - val / 100) * plotH;

  // Build SVG Paths
  // 1. Planned Path (all points)
  const plannedPathD = data.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.planned);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // 2. Actual Path (only up to data date)
  const actualPoints = data.filter((pt) => pt.actual !== null);
  const actualPathD = actualPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.actual as number);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // 3. Forecast Path (from data date onwards)
  const forecastPoints = data.slice(dataDateIndex);
  const forecastPathD = forecastPoints.reduce((acc, pt, idx) => {
    const x = getX(dataDateIndex + idx);
    const y = getY(pt.forecast);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  // Data date line coordinates
  const ddX = getX(dataDateIndex);
  const ddPlannedY = getY(data[dataDateIndex].planned);
  const ddActualY = getY(data[dataDateIndex].actual ?? data[dataDateIndex].planned);

  const handlePointClick = (idx: number) => {
    setSelectedPointIndex(idx);
    if (onSelectPeriod) {
      onSelectPeriod(data[idx]);
    }
  };

  const isCompact = variant === 'compact';

  return (
    <div
      className={`bg-white rounded-lg border border-[#D9DEE5] shadow-xs text-[#172033] ${className}`}
      data-testid="s-curve-chart"
    >
      {/* Level 1 Header: Titles & High-Level KPIs */}
      <div className="p-4 border-b border-[#D9DEE5] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-[#172033] tracking-tight">{title}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
              As-of {summary.dataDateLabel}
            </span>
          </div>
          {!isCompact && (
            <p className="text-xs text-[#596579] mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Level 1 Metrics Strip */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <div className="px-2.5 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
            <span className="text-[#7B8798] uppercase text-[10px] font-semibold tracking-wider block">Planned</span>
            <span className="font-mono font-semibold text-[#172033]">{summary.plannedAtDataDate.toFixed(1)}%</span>
          </div>

          <div className="px-2.5 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
            <span className="text-[#7B8798] uppercase text-[10px] font-semibold tracking-wider block">Actual</span>
            <span className="font-mono font-semibold text-[#2E7D5B]">{summary.actualAtDataDate.toFixed(1)}%</span>
          </div>

          <div className="px-2.5 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
            <span className="text-[#7B8798] uppercase text-[10px] font-semibold tracking-wider block">Variance</span>
            <span
              className={`font-mono font-semibold ${
                summary.varianceAtDataDate < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
              }`}
            >
              {summary.varianceAtDataDate > 0 ? `+${summary.varianceAtDataDate}%` : `${summary.varianceAtDataDate}%`}
            </span>
          </div>

          <div className="px-2.5 py-1.5 rounded bg-[#F7F8FA] border border-[#D9DEE5]">
            <span className="text-[#7B8798] uppercase text-[10px] font-semibold tracking-wider block">Forecast Finish</span>
            <span className="font-medium text-[#172033]">{summary.forecastFinishDate}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-4 overflow-x-auto">
        <div className="min-w-[620px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto select-none font-sans"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Subtle background striping */}
              <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F1F3F5" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Horizontal Grid lines */}
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
                    fill="#7B8798"
                    fontFamily="inherit"
                  >
                    {pct}%
                  </text>
                </g>
              );
            })}

            {/* Data Date Vertical Line */}
            <line
              x1={ddX}
              y1={padTop}
              x2={ddX}
              y2={height - padBottom}
              stroke="#176B87"
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
              fill="#176B87"
            />
            <text
              x={ddX}
              y={padTop - 7}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#FFFFFF"
            >
              DATA DATE
            </text>

            {/* Vertical Variance Gap line at Data Date */}
            <line
              x1={ddX}
              y1={ddPlannedY}
              x2={ddX}
              y2={ddActualY}
              stroke="#B5473C"
              strokeWidth="3"
            />
            <rect
              x={ddX + 6}
              y={(ddPlannedY + ddActualY) / 2 - 9}
              width={52}
              height={18}
              rx={3}
              fill="#FDF2F1"
              stroke="#B5473C"
              strokeWidth="1"
            />
            <text
              x={ddX + 32}
              y={(ddPlannedY + ddActualY) / 2 + 3}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#B5473C"
            >
              -7.0% Var
            </text>

            {/* 1. Baseline / Planned Line */}
            <path
              d={plannedPathD}
              fill="none"
              stroke="#596579"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 2. Forecast Line */}
            <path
              d={forecastPathD}
              fill="none"
              stroke="#D98B32"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 3. Actual Line */}
            <path
              d={actualPathD}
              fill="none"
              stroke="#2E7D5B"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* X-axis ticks and period labels */}
            {data.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = idx === selectedPointIndex;
              const isDD = pt.isDataDate;
              return (
                <g
                  key={pt.period}
                  className="cursor-pointer group"
                  onClick={() => handlePointClick(idx)}
                >
                  {/* Subtle hover/selection vertical band */}
                  {isSelected && (
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={height - padBottom}
                      stroke="#3B6EA8"
                      strokeWidth="1"
                      strokeOpacity="0.4"
                    />
                  )}

                  {/* Planned Node */}
                  <circle
                    cx={x}
                    cy={getY(pt.planned)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#596579"
                    strokeWidth="2"
                  />

                  {/* Actual Node */}
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

                  {/* Forecast Node (only future periods) */}
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

                  {/* Period Label */}
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

                  {/* Milestone small indicator */}
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
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-[#F1F3F5] text-xs text-[#596579]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 bg-[#596579] inline-block" />
              <span>Planned Baseline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-1 bg-[#2E7D5B] inline-block rounded-xs" />
              <span className="font-medium text-[#172033]">Actual Earned</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-t border-dashed border-[#D98B32] inline-block" />
              <span>Forecast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-[#176B87] inline-block" />
              <span>Data Date (18 Sep 2026)</span>
            </div>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-medium text-[#176B87] hover:underline focus:outline-none flex items-center gap-1"
            >
              {showLedger ? 'Hide Level 3 Ledger' : 'View Level 3 Cumulative Ledger'}
              <span className="text-[10px]">{showLedger ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Level 2: Selected Period Context ("Why?") */}
      <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
        <div className="flex items-start md:items-center gap-2">
          <span className="font-semibold text-[#172033] whitespace-nowrap">
            {selectedPoint.dateLabel}
          </span>
          {selectedPoint.milestone && (
            <span className="text-[#596579] border-l border-[#D9DEE5] pl-2">
              <strong className="text-[#172033]">Milestone:</strong> {selectedPoint.milestone}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-[#596579]">
          <span>
            Plan: <strong className="font-mono text-[#172033]">{selectedPoint.planned}%</strong>
          </span>
          {selectedPoint.actual !== null ? (
            <span>
              Actual: <strong className="font-mono text-[#2E7D5B]">{selectedPoint.actual}%</strong> (Var:{' '}
              <strong
                className={`font-mono ${
                  (selectedPoint.actual - selectedPoint.planned) < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
                }`}
              >
                {(selectedPoint.actual - selectedPoint.planned).toFixed(1)}%
              </strong>
              )
            </span>
          ) : (
            <span>
              Forecast: <strong className="font-mono text-[#D98B32]">{selectedPoint.forecast}%</strong>
            </span>
          )}
        </div>

        {selectedPoint.notes && (
          <p className="text-[11px] text-[#596579] italic max-w-md truncate">
            {selectedPoint.notes}
          </p>
        )}
      </div>

      {/* Level 3: Expandable Cumulative Progress Ledger */}
      {showLedger && !isCompact && (
        <div className="p-4 border-t border-[#D9DEE5] bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-[#7B8798] tracking-wider">
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
                        isCurrentDD ? 'bg-[#F0F7FA] font-medium' : ''
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
                      <td className="py-2 px-3 font-mono text-right text-[#172033]">{row.planned.toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono text-right text-[#2E7D5B]">
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
