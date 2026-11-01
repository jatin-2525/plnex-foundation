'use client';

import React, { useState, useRef, useId, useEffect } from 'react';
import Link from 'next/link';
import {
  TimeSeriesPoint,
  PROJECT_S_CURVE_DATA,
  BASELINE_REV_3_1_DATA,
  BASELINE_REV_3_0_DATA,
  SAVED_SCENARIO_S_CURVE,
  DISCIPLINE_S_CURVE_DATA,
  AREA_S_CURVE_DATA,
  getSCurveSummary,
  getSCurveInterpretation,
} from '@/lib/domain/sCurveData';
import { CHART_TOKENS } from '@/tokens/chartColors';
import { TermHelp } from './TermHelp';
import {
  Info,
  Download,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileImage,
  AlertTriangle,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';

export interface SCurveChartProps {
  data?: TimeSeriesPoint[];
  variant?: 'full' | 'compact' | 'dashboard';
  title?: string;
  subtitle?: string;
  className?: string;
  showLedgerByDefault?: boolean;
  onSelectPeriod?: (point: TimeSeriesPoint) => void;
}

export function SCurveChart({
  data: initialData = PROJECT_S_CURVE_DATA,
  variant = 'full',
  title = 'Project S-Curve — Planned vs. Actual vs. Forecast',
  subtitle = 'Cumulative physical progress curve across all WBS work packages',
  className = '',
  showLedgerByDefault = false,
  onSelectPeriod,
}: SCurveChartProps) {
  const isCompact = variant === 'compact';
  const isDashboard = variant === 'dashboard';
  const [showDashboardAdvanced, setShowDashboardAdvanced] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const liveRegionId = useId();

  // --- 1. S-Curve Feature Controls State ---
  // Feature 1: "What does this chart mean?" explanation drawer/popover
  const [showExplanation, setShowExplanation] = useState(false);

  // Feature 2: Series visibility toggles
  const [seriesVisible, setSeriesVisible] = useState({
    planned: true,
    actual: true,
    forecast: true,
    comparison: true,
  });

  // Feature 3: "As of" Reporting Date & Baseline Revision
  const [asOfDate, setAsOfDate] = useState<'18 Sep 2026' | '11 Sep 2026' | '04 Sep 2026' | '28 Aug 2026'>('18 Sep 2026');
  const [baselineRevision, setBaselineRevision] = useState<'Rev 3.2' | 'Rev 3.1' | 'Rev 3.0'>('Rev 3.2');

  // Feature 4: Dimensional Filters (Discipline & Area)
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | 'Piping' | 'Civil' | 'Mechanical' | 'Electrical'>('All');
  const [selectedArea, setSelectedArea] = useState<'All' | 'Unit A - Gas Processing' | 'Unit B - Compressor House' | 'Offsites & Substation'>('All');

  // Feature 7: Time-range options
  const [timeRange, setTimeRange] = useState<'full' | '6m' | '3m'>('full');

  // Feature 8: Comparison baseline / saved scenario
  const [comparisonMode, setComparisonMode] = useState<'none' | 'rev31' | 'rev30' | 'monsoon'>('none');

  // Feature 9: Cumulative S-Curve vs. Period Progress Switch
  const [progressViewMode, setProgressViewMode] = useState<'cumulative' | 'period'>('cumulative');

  // Feature 13: Fullscreen Modal
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Feature 14: Compact Report Summary Toggle
  const [showReportSummary, setShowReportSummary] = useState(false);

  // Level 3 Ledger Toggle
  const [showLedger, setShowLedger] = useState(showLedgerByDefault);

  // Active Selected / Hovered Point
  const [selectedPointIndex, setSelectedPointIndex] = useState<number>(4);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Filter & Dataset Derivation
  let rawData = initialData;
  if (selectedDiscipline !== 'All' && DISCIPLINE_S_CURVE_DATA[selectedDiscipline]) {
    rawData = DISCIPLINE_S_CURVE_DATA[selectedDiscipline];
  } else if (selectedArea !== 'All' && AREA_S_CURVE_DATA[selectedArea]) {
    rawData = AREA_S_CURVE_DATA[selectedArea];
  } else if (baselineRevision === 'Rev 3.1') {
    rawData = BASELINE_REV_3_1_DATA;
  } else if (baselineRevision === 'Rev 3.0') {
    rawData = BASELINE_REV_3_0_DATA;
  }

  // Adjust for "As of" Date cutoff simulation
  const activeDataset: TimeSeriesPoint[] = rawData.map((pt, idx) => {
    let cutoffIdx = 4; // default 18 Sep 2026
    if (asOfDate === '11 Sep 2026') cutoffIdx = 3;
    if (asOfDate === '04 Sep 2026') cutoffIdx = 2;
    if (asOfDate === '28 Aug 2026') cutoffIdx = 1;

    const isCurrentDD = idx === cutoffIdx;
    if (idx > cutoffIdx) {
      return {
        ...pt,
        actual: null,
        periodActualIncrement: null,
        isDataDate: isCurrentDD,
      };
    }
    return {
      ...pt,
      isDataDate: isCurrentDD,
    };
  });

  // Time Range Slicing
  let displayedData = activeDataset;
  if (timeRange === '3m') {
    displayedData = activeDataset.slice(2, 6); // Jul to Oct
  } else if (timeRange === '6m') {
    displayedData = activeDataset.slice(1, 7); // Jun to Nov
  }

  // Comparison Series Points
  const comparisonData: TimeSeriesPoint[] | null = React.useMemo(() => {
    if (comparisonMode === 'none') return null;
    let compSource = PROJECT_S_CURVE_DATA;
    if (comparisonMode === 'rev31') compSource = BASELINE_REV_3_1_DATA;
    if (comparisonMode === 'rev30') compSource = BASELINE_REV_3_0_DATA;
    if (comparisonMode === 'monsoon') compSource = SAVED_SCENARIO_S_CURVE;

    if (timeRange === '3m') return compSource.slice(2, 6);
    if (timeRange === '6m') return compSource.slice(1, 7);
    return compSource;
  }, [comparisonMode, timeRange]);

  const summary = getSCurveSummary(displayedData);
  const dataDateIndex = displayedData.findIndex((d) => d.isDataDate) !== -1 ? displayedData.findIndex((d) => d.isDataDate) : 4;

  const activeIndex = hoveredPointIndex !== null ? hoveredPointIndex : Math.min(selectedPointIndex, displayedData.length - 1);
  const activePoint = displayedData[activeIndex] || displayedData[0];

  // SVG Dimensions & Margins
  const width = isFullscreen ? 1080 : isCompact ? 640 : 760;
  const height = isFullscreen ? 400 : isCompact ? 240 : 310;
  const padLeft = 58;
  const padRight = 36;
  const padTop = 36;
  const padBottom = 54;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = displayedData.length;

  const getX = (i: number) => padLeft + (i / Math.max(1, n - 1)) * plotW;
  const getY = (val: number) => padTop + (1 - Math.min(100, Math.max(0, val)) / 100) * plotH;

  // Build Paths for Cumulative Curves
  const plannedPathD = displayedData.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.planned);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const actualPoints = displayedData.filter((pt) => pt.actual !== null);
  const actualPathD = actualPoints.reduce((acc, pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.actual as number);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const forecastPoints = displayedData.slice(dataDateIndex);
  const forecastPathD = forecastPoints.reduce((acc, pt, idx) => {
    const x = getX(dataDateIndex + idx);
    const y = getY(pt.forecast);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const comparisonPathD = comparisonData
    ? comparisonData.reduce((acc, pt, idx) => {
        const x = getX(idx);
        const y = getY(comparisonMode === 'monsoon' ? pt.forecast : pt.planned);
        return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, '')
    : '';

  const ddX = getX(dataDateIndex);
  const ddPlannedY = getY(displayedData[dataDateIndex]?.planned ?? 80);
  const ddActualY = getY(displayedData[dataDateIndex]?.actual ?? displayedData[dataDateIndex]?.planned ?? 73);

  const activeVariance =
    activePoint.actual !== null
      ? Number((activePoint.actual - activePoint.planned).toFixed(1))
      : Number((activePoint.forecast - activePoint.planned).toFixed(1));

  const activeX = getX(activeIndex);
  const tooltipWidth = 154;
  const tooltipHeight = 84;
  const tooltipX = activeX > width - tooltipWidth - 20 ? activeX - tooltipWidth - 12 : activeX + 12;
  const tooltipY = Math.max(padTop + 6, Math.min(height - padBottom - tooltipHeight - 6, getY(activePoint.planned) - 20));

  // Reset Filters to Baseline
  const isFiltered =
    selectedDiscipline !== 'All' ||
    selectedArea !== 'All' ||
    baselineRevision !== 'Rev 3.2' ||
    asOfDate !== '18 Sep 2026' ||
    timeRange !== 'full' ||
    comparisonMode !== 'none';

  const handleResetFilters = () => {
    setSelectedDiscipline('All');
    setSelectedArea('All');
    setBaselineRevision('Rev 3.2');
    setAsOfDate('18 Sep 2026');
    setTimeRange('full');
    setComparisonMode('none');
  };

  const handlePointSelect = (idx: number) => {
    setSelectedPointIndex(idx);
    if (onSelectPeriod && displayedData[idx]) {
      onSelectPeriod(displayedData[idx]);
    }
  };

  // Keyboard navigation for accessible points
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = Math.min(displayedData.length - 1, activeIndex + 1);
      handlePointSelect(nextIdx);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = Math.max(0, activeIndex - 1);
      handlePointSelect(prevIdx);
    } else if (e.key === 'Home') {
      e.preventDefault();
      handlePointSelect(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      handlePointSelect(displayedData.length - 1);
    }
  };

  // Feature 13: Export CSV
  const handleExportCSV = () => {
    const headers = ['Period', 'Cutoff Date', 'Planned Cum %', 'Actual Cum %', 'Forecast Cum %', 'Period Plan %', 'Period Actual %', 'Milestone'];
    const rows = displayedData.map((d) => [
      d.period,
      d.dateLabel,
      d.planned.toFixed(1),
      d.actual !== null ? d.actual.toFixed(1) : '',
      d.forecast.toFixed(1),
      d.periodPlannedIncrement.toFixed(1),
      d.periodActualIncrement !== null ? d.periodActualIncrement.toFixed(1) : '',
      `"${d.milestone || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PLnEX_SCurve_${baselineRevision}_${asOfDate.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Feature 13: Export SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PLnEX_SCurve_${asOfDate.replace(/\s+/g, '_')}.svg`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={`bg-white rounded-lg border border-[#D8E2EA] text-[#142C3F] shadow-xs ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-white shadow-2xl p-6 border-2 border-[#0F6B68]' : className
      }`}
      data-testid="s-curve-chart"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Interactive S-Curve Project Performance Chart"
    >
      {/* Screen reader live region */}
      <div id={liveRegionId} className="sr-only" aria-live="polite">
        {`Selected period ${activePoint.period}. Planned: ${activePoint.planned}%, ${
          activePoint.actual !== null ? `Actual: ${activePoint.actual}%` : `Forecast: ${activePoint.forecast}%`
        }, Variance: ${activeVariance}%`}
      </div>

      {/* ========================================================= */}
      {/* 1. TOP HEADER & INTERACTIVE S-CURVE TOOLBAR */}
      {/* ========================================================= */}
      <div className="p-4 border-b border-[#D8E2EA] flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#142C3F] tracking-tight">{title}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]">
                Baseline: {baselineRevision} (P6 XML)
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F3F6FA] text-[#526779] border border-[#D8E2EA]">
                Cutoff: {asOfDate}
              </span>

              {/* Feature 1: "What does this chart mean?" ⓘ Hint */}
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-[#0F6B68] bg-[#E4F4EC] hover:bg-[#D5EFEA] border border-[#BDE4D0] transition-colors cursor-pointer"
                title="Explain Planned, Verified Actual, Forecast, Data Date, and Variance"
              >
                <Info className="w-3.5 h-3.5" />
                <span>What does this chart mean?</span>
              </button>
            </div>

            {!isCompact && (
              <p className="text-xs text-[#526779] mt-1">{subtitle}</p>
            )}
          </div>

          {/* Action Tools: Reset, Mode Switch, CSV, SVG, Fullscreen */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Feature 7: Time-range options */}
            <div className="flex rounded-md border border-[#D8E2EA] overflow-hidden bg-[#F3F6FA] p-0.5">
              {(['full', '6m', '3m'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-2 py-1 text-xs font-mono uppercase transition-colors ${
                    timeRange === r ? 'bg-white text-[#0F6B68] font-bold shadow-xs' : 'text-[#526779] hover:text-[#142C3F]'
                  }`}
                >
                  {r === 'full' ? 'Full' : r}
                </button>
              ))}
            </div>

            {isDashboard ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowDashboardAdvanced(!showDashboardAdvanced)}
                  className={`px-2.5 py-1 text-xs rounded border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    showDashboardAdvanced
                      ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                      : 'bg-white text-[#526779] border-[#D8E2EA] hover:bg-[#F3F6FA]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showDashboardAdvanced ? 'Hide Secondary Controls' : 'Advanced Controls'}</span>
                </button>

                <Link
                  href="/progress"
                  className="px-2.5 py-1 text-xs font-semibold text-[#0F6B68] hover:text-[#0a4846] bg-[#EAF0F5] hover:bg-[#DCE7EE] border border-[#D8E2EA] rounded inline-flex items-center gap-1 transition-colors"
                >
                  <span>Progress Deep Dive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <>
                {/* Feature 9: Cumulative vs Period Switch */}
                <div className="flex rounded-md border border-[#D8E2EA] overflow-hidden bg-[#F3F6FA] p-0.5">
                  <button
                    type="button"
                    onClick={() => setProgressViewMode('cumulative')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      progressViewMode === 'cumulative'
                        ? 'bg-white text-[#0F6B68] shadow-xs font-semibold'
                        : 'text-[#526779] hover:text-[#142C3F]'
                    }`}
                  >
                    Cumulative S-Curve
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressViewMode('period')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      progressViewMode === 'period'
                        ? 'bg-white text-[#0F6B68] shadow-xs font-semibold'
                        : 'text-[#526779] hover:text-[#142C3F]'
                    }`}
                  >
                    Period Progress (%/Mo)
                  </button>
                </div>

                {/* Feature 14: Report Summary Toggle */}
                <button
                  type="button"
                  onClick={() => setShowReportSummary(!showReportSummary)}
                  className={`p-1.5 rounded border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    showReportSummary
                      ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                      : 'bg-white text-[#526779] border-[#D8E2EA] hover:bg-[#F3F6FA]'
                  }`}
                  title="Toggle Executive Summary card for reports"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Report Card</span>
                </button>

                {/* Feature 13: Export Options */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="p-1.5 rounded border border-[#D8E2EA] bg-white text-[#526779] hover:bg-[#F3F6FA] hover:text-[#142C3F] transition-colors cursor-pointer"
                    title="Download S-Curve Ledger CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSVG}
                    className="p-1.5 rounded border border-[#D8E2EA] bg-white text-[#526779] hover:bg-[#F3F6FA] hover:text-[#142C3F] transition-colors cursor-pointer"
                    title="Download S-Curve SVG Vector Image"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded border border-[#D8E2EA] bg-white text-[#526779] hover:bg-[#F3F6FA] hover:text-[#142C3F] transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen S-Curve Workspace'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#A24335]" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature 1: "What does this chart mean?" Collapsible Explanation Drawer */}
        {showExplanation && (
          <div className="bg-[#EAF0F5] border border-[#D8E2EA] rounded-md p-3 text-xs text-[#142C3F] animate-fadeIn">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[#0F6B68]">
                <Info className="w-4 h-4 text-[#0F6B68]" />
                <span>Understanding the Project S-Curve & Earned Value Metrics</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="text-[#526779] hover:text-[#142C3F] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
                <div className="font-semibold text-[#5274B8] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#5274B8] inline-block" />
                  Planned (Baseline)
                </div>
                <p className="text-[11px] text-[#526779]">
                  Physical progress scheduled in Rev 3.2 baseline envelope. Frozen contract commitment.
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
                <div className="font-semibold text-[#0D8879] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D8879] inline-block" />
                  Verified Actual
                </div>
                <p className="text-[11px] text-[#526779]">
                  Physical progress certified by site engineers and signed DPR evidence up to Data Date.
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
                <div className="font-semibold text-[#8057B7] mb-0.5 flex items-center gap-1.5">
                  <span className="w-3 h-1 border-t-2 border-dashed border-[#8057B7] inline-block" />
                  Forecast (CPM Logic)
                </div>
                <p className="text-[11px] text-[#526779]">
                  Deterministic critical-path projection calculated from remaining durations and logic ties.
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
                <div className="font-semibold text-[#142C3F] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#142C3F] inline-block" />
                  Data Date (Cutoff)
                </div>
                <p className="text-[11px] text-[#526779]">
                  Current reporting boundary (18 Sep 2026). Actuals end here; future work is projected.
                </p>
              </div>
              <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
                <div className="font-semibold text-[#A24335] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#A24335] inline-block" />
                  Variance (% Slip)
                </div>
                <p className="text-[11px] text-[#526779]">
                  Calculated as: <span className="font-mono font-bold">Actual % - Planned %</span>. Negative values indicate schedule slip.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature 2, 3, 4, 8: Interactive Filter Toolbar ("As of", Baselines, Discipline, Compare) */}
        {(!isDashboard || showDashboardAdvanced) && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#D8E2EA]/70 text-xs">
            <div className="flex items-center flex-wrap gap-2">
              {/* Feature 3: "As of" Reporting Date */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] border border-[#D8E2EA] rounded px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-[#526779]" />
                <span className="text-[#526779] font-medium text-[11px]">As of:</span>
                <select
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value as any)}
                  className="bg-transparent font-medium text-[#142C3F] focus:outline-none cursor-pointer"
                >
                  <option value="18 Sep 2026">18 Sep 2026 (Current Cutoff)</option>
                  <option value="11 Sep 2026">11 Sep 2026 (Week 37)</option>
                  <option value="04 Sep 2026">04 Sep 2026 (Week 36)</option>
                  <option value="28 Aug 2026">28 Aug 2026 (Week 35)</option>
                </select>
              </div>

              {/* Feature 3: Baseline Revision */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] border border-[#D8E2EA] rounded px-2 py-1">
                <span className="text-[#526779] font-medium text-[11px]">Baseline:</span>
                <select
                  value={baselineRevision}
                  onChange={(e) => setBaselineRevision(e.target.value as any)}
                  className="bg-transparent font-medium text-[#142C3F] focus:outline-none cursor-pointer"
                >
                  <option value="Rev 3.2">Rev 3.2 (Approved)</option>
                  <option value="Rev 3.1">Rev 3.1 (Aug 2026)</option>
                  <option value="Rev 3.0">Rev 3.0 (FID Contract)</option>
                </select>
              </div>

              {/* Feature 4: Discipline Filter */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] border border-[#D8E2EA] rounded px-2 py-1">
                <span className="text-[#526779] font-medium text-[11px]">Discipline:</span>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                    setSelectedDiscipline(e.target.value as any);
                    if (e.target.value !== 'All') setSelectedArea('All');
                  }}
                  className="bg-transparent font-medium text-[#142C3F] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Disciplines</option>
                  <option value="Piping">Piping</option>
                  <option value="Civil">Civil</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                </select>
              </div>

              {/* Feature 4: Area Filter */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] border border-[#D8E2EA] rounded px-2 py-1">
                <span className="text-[#526779] font-medium text-[11px]">Area:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value as any);
                    if (e.target.value !== 'All') setSelectedDiscipline('All');
                  }}
                  className="bg-transparent font-medium text-[#142C3F] focus:outline-none cursor-pointer"
                >
                  <option value="All">All Areas</option>
                  <option value="Unit A - Gas Processing">Unit A (Gas Processing)</option>
                  <option value="Unit B - Compressor House">Unit B (Compressors)</option>
                  <option value="Offsites & Substation">Offsites & Substation</option>
                </select>
              </div>

              {/* Feature 8: Compare Revisions or Saved Scenarios */}
              <div className="flex items-center gap-1 bg-[#F3F6FA] border border-[#D8E2EA] rounded px-2 py-1">
                <span className="text-[#526779] font-medium text-[11px]">Compare:</span>
                <select
                  value={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.value as any)}
                  className="bg-transparent font-medium text-[#142C3F] focus:outline-none cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="rev31">Rev 3.1 Baseline</option>
                  <option value="rev30">Rev 3.0 Baseline</option>
                  <option value="monsoon">Monsoon Slip Scenario</option>
                </select>
              </div>

              {/* Reset Filters */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#A24335] bg-[#FCE8E4] hover:bg-[#F8D2CC] border border-[#F6C7BE] rounded transition-colors cursor-pointer"
                  title="Reset all filters back to project baseline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Feature 2: Series Toggles (Checkboxes) */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#5274B8]">
                <input
                  type="checkbox"
                  checked={seriesVisible.planned}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, planned: e.target.checked }))}
                  className="rounded border-[#D8E2EA] text-[#5274B8] focus:ring-0 cursor-pointer"
                />
                Planned
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#0D8879]">
                <input
                  type="checkbox"
                  checked={seriesVisible.actual}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, actual: e.target.checked }))}
                  className="rounded border-[#D8E2EA] text-[#0D8879] focus:ring-0 cursor-pointer"
                />
                Verified Actual
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#8057B7]">
                <input
                  type="checkbox"
                  checked={seriesVisible.forecast}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, forecast: e.target.checked }))}
                  className="rounded border-[#D8E2EA] text-[#8057B7] focus:ring-0 cursor-pointer"
                />
                Forecast
              </label>
              {comparisonMode !== 'none' && (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#C98925]">
                  <input
                    type="checkbox"
                    checked={seriesVisible.comparison}
                    onChange={(e) => setSeriesVisible((prev) => ({ ...prev, comparison: e.target.checked }))}
                    className="rounded border-[#D8E2EA] text-[#C98925] focus:ring-0 cursor-pointer"
                  />
                  Comparison
                </label>
              )}
            </div>
          </div>
        )}

        {/* Feature 4: Scope Warning Banner when filtering */}
        {(selectedDiscipline !== 'All' || selectedArea !== 'All') && (
          <div className="bg-[#FFF8E6] border border-[#F0D4A6] rounded p-2 text-xs text-[#8C5311] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#8C5311] shrink-0" />
              <span>
                <strong>FILTERED PERSPECTIVE:</strong> Showing {selectedDiscipline !== 'All' ? `${selectedDiscipline} discipline` : selectedArea} work packages only. Progress figures reflect discipline scope and do not equal total EPC contract progress.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedDiscipline('All');
                setSelectedArea('All');
              }}
              className="text-xs font-semibold text-[#8C5311] underline hover:text-[#5E3809] cursor-pointer shrink-0 ml-2"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Feature 14: Compact Report Summary Card */}
        {showReportSummary && (
          <div className="bg-[#F3F6FA] border border-[#D8E2EA] rounded-md p-3 text-xs text-[#142C3F]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#526779]">
                Executive S-Curve Audit Report Card
              </span>
              <span className="font-mono text-[10px] text-[#526779]">Source: Rev 3.2 (P6 XML)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Reporting Date</div>
                <div className="font-bold text-[#142C3F]">{asOfDate}</div>
              </div>
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Baseline Plan</div>
                <div className="font-bold text-[#3D73B5]">{summary.plannedAtDataDate.toFixed(1)}%</div>
              </div>
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Verified Actual</div>
                <div className="font-bold text-[#176B53]">{summary.actualAtDataDate.toFixed(1)}%</div>
              </div>
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Schedule Variance</div>
                <div className="font-bold text-[#A24335]">{summary.varianceAtDataDate.toFixed(1)} pp slip</div>
              </div>
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Schedule Perf Index (SPI)</div>
                <div className="font-bold text-[#845006]">0.91 (Critical)</div>
              </div>
              <div className="bg-white p-2 rounded border border-[#D8E2EA]">
                <div className="text-[10px] text-[#526779]">Forecast COD Finish</div>
                <div className="font-bold text-[#7655A6]">20 Dec 2026 (+5d)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. SVG CHART CANVAS (CUMULATIVE S-CURVE OR PERIOD BARS) */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4 w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none font-sans"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          {/* Explicit Y-axis Title */}
          <text
            x={padLeft - 44}
            y={padTop - 14}
            textAnchor="start"
            fontSize="10"
            fontWeight="bold"
            fill="#142C3F"
          >
            {progressViewMode === 'cumulative' ? 'Cumulative Progress (%)' : 'Period Increment (%/Month)'}
          </text>

          {/* Y-axis Grid Lines */}
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
                  fill="#526779"
                  fontFamily="inherit"
                  fontWeight="500"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Feature 11: Projected Forecast Region Background Shading after Data Date */}
          <rect
            x={ddX}
            y={padTop}
            width={width - padRight - ddX}
            height={plotH}
            fill="#F3F6FA"
            opacity="0.75"
          />
          <text
            x={ddX + (width - padRight - ddX) / 2}
            y={padTop + 14}
            textAnchor="middle"
            fontSize="9"
            fontWeight="bold"
            fill="#7655A6"
            letterSpacing="0.05em"
          >
            PROJECTED FORECAST REGION (DETERMINISTIC CPM)
          </text>

          {/* Feature 6: Data Date Vertical Reference Line & Prominent Callout */}
          <line
            x1={ddX}
            y1={padTop}
            x2={ddX}
            y2={height - padBottom}
            stroke="#142C3F"
            strokeWidth="1.5"
            strokeDasharray="4,3"
          />
          <rect
            x={ddX - 58}
            y={padTop - 20}
            width={116}
            height={20}
            rx={3}
            fill="#142C3F"
          />
          <text
            x={ddX}
            y={padTop - 6}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#FFFFFF"
          >
            DATA DATE ({asOfDate.split(' ')[0]} {asOfDate.split(' ')[1]})
          </text>

          {/* Feature 6: Prominent Callout at Data Date: Planned, Actual, Variance */}
          <line
            x1={ddX}
            y1={ddPlannedY}
            x2={ddX}
            y2={ddActualY}
            stroke="#A24335"
            strokeWidth="3.5"
          />
          <rect
            x={Math.min(width - padRight - 130, ddX + 8)}
            y={(ddPlannedY + ddActualY) / 2 - 12}
            width={124}
            height={24}
            rx={3}
            fill="#FCE8E4"
            stroke="#E8B6BA"
            strokeWidth="1"
          />
          <text
            x={Math.min(width - padRight - 130, ddX + 8) + 62}
            y={(ddPlannedY + ddActualY) / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#922E37"
          >
            -7.0 pp Slip [Critical]
          </text>

          {/* ========================================================= */}
          {/* CUMULATIVE S-CURVE VIEW MODE */}
          {/* ========================================================= */}
          {progressViewMode === 'cumulative' && (
            <>
              {/* Feature 8: Comparison Curve Path */}
              {comparisonMode !== 'none' && seriesVisible.comparison && comparisonPathD && (
                <path
                  d={comparisonPathD}
                  fill="none"
                  stroke="#845006"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Planned Line (Blue #3D73B5) */}
              {seriesVisible.planned && (
                <path
                  d={plannedPathD}
                  fill="none"
                  stroke={CHART_TOKENS.planned.stroke}
                  strokeWidth={CHART_TOKENS.planned.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Forecast Line (Violet dashed #7655A6) */}
              {seriesVisible.forecast && (
                <path
                  d={forecastPathD}
                  fill="none"
                  stroke={CHART_TOKENS.forecast.stroke}
                  strokeWidth={CHART_TOKENS.forecast.strokeWidth}
                  strokeDasharray={CHART_TOKENS.forecast.dashArray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Actual Line (Verified Teal #176B53) */}
              {seriesVisible.actual && (
                <path
                  d={actualPathD}
                  fill="none"
                  stroke={CHART_TOKENS.actual.stroke}
                  strokeWidth={CHART_TOKENS.actual.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* Feature 9: PERIOD PROGRESS CLUSTERED BARS VIEW MODE */}
          {/* ========================================================= */}
          {progressViewMode === 'period' && (
            <>
              {displayedData.map((pt, idx) => {
                const x = getX(idx);
                const colW = (plotW / Math.max(1, n - 1)) * 0.55;
                const barW = colW / 3;

                const planY = getY(pt.periodPlannedIncrement * 3.5); // scale for visibility
                const planH = Math.max(2, (height - padBottom) - planY);

                const actY = pt.periodActualIncrement !== null ? getY(pt.periodActualIncrement * 3.5) : 0;
                const actH = pt.periodActualIncrement !== null ? Math.max(2, (height - padBottom) - actY) : 0;

                const fcstY = getY(pt.periodForecastIncrement * 3.5);
                const fcstH = Math.max(2, (height - padBottom) - fcstY);

                return (
                  <g key={`bar-${pt.period}`}>
                    {/* Planned increment bar */}
                    {seriesVisible.planned && (
                      <rect
                        x={x - colW / 2}
                        y={planY}
                        width={barW - 1}
                        height={planH}
                        fill="#5274B8"
                        rx="1"
                        opacity="0.85"
                      />
                    )}

                    {/* Actual increment bar */}
                    {seriesVisible.actual && pt.periodActualIncrement !== null && (
                      <rect
                        x={x - colW / 2 + barW}
                        y={actY}
                        width={barW - 1}
                        height={actH}
                        fill="#0D8879"
                        rx="1"
                      />
                    )}

                    {/* Forecast increment bar */}
                    {seriesVisible.forecast && pt.periodActualIncrement === null && (
                      <rect
                        x={x - colW / 2 + barW * 2}
                        y={fcstY}
                        width={barW - 1}
                        height={fcstH}
                        fill="#8057B7"
                        rx="1"
                        strokeDasharray="2,2"
                      />
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* ========================================================= */}
          {/* INTERACTIVE NODES & MILESTONES ON THE CURVE */}
          {/* ========================================================= */}
          {displayedData.map((pt, idx) => {
            const x = getX(idx);
            const isSelected = idx === activeIndex;
            const isDD = pt.isDataDate;
            const colW = plotW / Math.max(1, n - 1);

            return (
              <g
                key={pt.period}
                tabIndex={0}
                role="button"
                aria-label={`Reporting period ${pt.period}. Planned ${pt.planned}%, ${
                  pt.actual !== null ? `Actual ${pt.actual}%` : `Forecast ${pt.forecast}%`
                }`}
                className="cursor-pointer focus:outline-none"
                onMouseEnter={() => setHoveredPointIndex(idx)}
                onClick={() => handlePointSelect(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePointSelect(idx);
                  }
                }}
              >
                {/* Wide invisible hit area */}
                <rect
                  x={x - colW / 2}
                  y={padTop}
                  width={colW}
                  height={plotH}
                  fill="transparent"
                />

                {/* Vertical Crosshair Guide */}
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

                {/* Feature 10: Milestone Diamond (◆) Markers */}
                {pt.milestone && (
                  <g transform={`translate(${x}, ${getY(pt.actual ?? pt.planned) - 14})`}>
                    <polygon
                      points="0,-6 6,0 0,6 -6,0"
                      fill={pt.actual !== null ? '#0D8879' : pt.milestoneDetail?.status === 'Critical Slip' ? '#A24335' : '#8057B7'}
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                )}

                {/* Explicit Visual COD Slip Annotation Badge */}
                {pt.period === '20 Dec 2026' && (
                  <g transform={`translate(${x}, ${getY(pt.forecast) - 26})`}>
                    <rect
                      x="-38"
                      y="-11"
                      width="76"
                      height="16"
                      rx="3"
                      fill="#A24335"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#FFFFFF"
                    >
                      +5d COD Slip
                    </text>
                  </g>
                )}

                {/* Planned Node Circle */}
                {seriesVisible.planned && (
                  <circle
                    cx={x}
                    cy={getY(pt.planned)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#5274B8"
                    strokeWidth="2"
                  />
                )}

                {/* Actual Node Circle */}
                {seriesVisible.actual && pt.actual !== null && (
                  <circle
                    cx={x}
                    cy={getY(pt.actual)}
                    r={isSelected ? 5 : 4}
                    fill="#0D8879"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* Forecast Node Circle */}
                {seriesVisible.forecast && pt.actual === null && (
                  <circle
                    cx={x}
                    cy={getY(pt.forecast)}
                    r={isSelected ? 4.5 : 3.5}
                    fill="#8057B7"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                )}

                {/* X-axis Label */}
                <text
                  x={x}
                  y={height - padBottom + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isDD || isSelected ? '700' : '500'}
                  fill={isSelected ? '#0F6B68' : isDD ? '#142C3F' : '#526779'}
                >
                  {pt.period}
                </text>
              </g>
            );
          })}

          {/* X-axis Title */}
          <text
            x={padLeft + plotW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="10"
            fontWeight="bold"
            fill="#526779"
          >
            Project Reporting Timeline • Cutoff: {asOfDate} • Baseline: {baselineRevision}
          </text>

          {/* Hover Tooltip */}
          {hoveredPointIndex !== null && (
            <g pointerEvents="none">
              <rect
                x={tooltipX}
                y={tooltipY}
                width={tooltipWidth}
                height={tooltipHeight}
                rx={4}
                fill="#FFFFFF"
                stroke="#D8E2EA"
                strokeWidth="1.5"
                filter="drop-shadow(0 2px 4px rgba(20, 44, 63, 0.08))"
              />
              <text x={tooltipX + 10} y={tooltipY + 16} fontSize="11" fontWeight="bold" fill="#142C3F">
                {activePoint.dateLabel}
              </text>
              <text x={tooltipX + 10} y={tooltipY + 33} fontSize="11" fontWeight="500" fill="#526779">
                Planned: <tspan fontWeight="bold" fill="#5274B8">{activePoint.planned.toFixed(1)}%</tspan>
              </text>
              <text x={tooltipX + 10} y={tooltipY + 48} fontSize="11" fontWeight="500" fill="#526779">
                {activePoint.actual !== null ? (
                  <>Actual: <tspan fontWeight="bold" fill="#0D8879">{activePoint.actual.toFixed(1)}%</tspan></>
                ) : (
                  <>Forecast: <tspan fontWeight="bold" fill="#8057B7">{activePoint.forecast.toFixed(1)}%</tspan></>
                )}
              </text>
              <text x={tooltipX + 10} y={tooltipY + 63} fontSize="11" fontWeight="500" fill="#526779">
                Variance:{' '}
                <tspan fontWeight="bold" fill={activeVariance < 0 ? '#A24335' : '#0D8879'}>
                  {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                  {activePoint.actual === null ? ' (Fcst)' : ''}
                </tspan>
              </text>
              <text x={tooltipX + 10} y={tooltipY + 76} fontSize="9" fill="#8057B7" fontWeight="bold">
                {activePoint.milestone ? `◆ ${activePoint.milestone.substring(0, 18)}...` : ''}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-[#D8E2EA] text-xs text-[#526779]">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-[#5274B8] inline-block rounded-xs" />
              <span className="font-semibold text-[#142C3F]">■ Planned Baseline</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1.5 bg-[#0D8879] inline-block rounded-xs" />
              <span className="font-semibold text-[#142C3F]">● Verified Actual</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#8057B7] inline-block" />
              <span className="font-semibold text-[#142C3F]">▲ Forecast (CPM)</span>
            </div>
            {comparisonMode !== 'none' && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#C98925] inline-block" />
                <span className="font-semibold text-[#C98925]">◇ Comparison Series</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[#0D8879] font-bold">◆</span>
              <span className="font-semibold text-[#142C3F]">Milestone Marker</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#142C3F] inline-block" />
              <span className="font-semibold text-[#142C3F]">Data Date Cutoff</span>
            </div>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-semibold text-[#0F6B68] hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
            >
              {showLedger ? 'Hide Level 3 Ledger' : 'View Level 3 Cumulative Ledger'}
              <span className="text-[10px]">{showLedger ? '▲' : '▼'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. SHORT INTERPRETATION STRIP */}
      {/* ========================================================= */}
      <div className="mx-4 mb-3 p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded text-xs text-[#142C3F] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              summary.varianceAtDataDate < 0 ? 'bg-[#A24335]' : 'bg-[#0D8879]'
            }`}
          />
          <p className="font-medium text-[#142C3F]">
            {getSCurveInterpretation(summary)}
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#526779] shrink-0">
          Cutoff: {asOfDate} ({baselineRevision})
        </span>
      </div>

      {/* ========================================================= */}
      {/* Feature 5: SELECTABLE POINT INTERACTIVE DRAWER / CONTEXT */}
      {/* Numbers, Period Delta, Milestones, and Contributed Work Items */}
      {/* ========================================================= */}
      <div className="px-4 py-3 bg-[#F3F6FA] border-t border-[#D8E2EA] text-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 pb-2 border-b border-[#D8E2EA]/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#142C3F] text-sm">{activePoint.period}</span>
            <span className="text-[#526779] text-xs font-mono">({activePoint.dateLabel})</span>
            {activePoint.isDataDate && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#142C3F] text-white">
                CURRENT REPORTING CUTOFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-xs">
            <span>
              Cumulative Plan: <strong className="text-[#5274B8]">{activePoint.planned.toFixed(1)}%</strong>
            </span>
            {activePoint.actual !== null ? (
              <span>
                Verified Actual: <strong className="text-[#0D8879]">{activePoint.actual.toFixed(1)}%</strong> (
                <strong className={activeVariance < 0 ? 'text-[#A24335]' : 'text-[#0D8879]'}>
                  {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                </strong>
                )
              </span>
            ) : (
              <span>
                Forecast: <strong className="text-[#8057B7]">{activePoint.forecast.toFixed(1)}%</strong>
              </span>
            )}
            <span className="border-l border-[#D8E2EA] pl-3 text-[#526779]">
              Period Work: <strong className="text-[#142C3F]">+{activePoint.periodPlannedIncrement.toFixed(1)}%</strong> plan /{' '}
              <strong className="text-[#0D8879]">
                {activePoint.periodActualIncrement !== null ? `+${activePoint.periodActualIncrement.toFixed(1)}%` : '—'}
              </strong>{' '}
              actual
            </span>
          </div>
        </div>

        {/* Milestone & Work Items Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {/* Milestone Detail */}
          <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#142C3F] flex items-center gap-1.5 text-xs">
                <span className="text-[#0F6B68]">◆</span> Milestone in this Period:
              </span>
              {activePoint.milestoneDetail && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activePoint.milestoneDetail.status === 'Completed'
                      ? 'bg-[#E4F4EC] text-[#176B53]'
                      : activePoint.milestoneDetail.status === 'Critical Slip'
                      ? 'bg-[#FCE8E4] text-[#A24335]'
                      : 'bg-[#F3F6FA] text-[#526779]'
                  }`}
                >
                  {activePoint.milestoneDetail.status}
                </span>
              )}
            </div>
            {activePoint.milestoneDetail ? (
              <div className="text-xs space-y-1">
                <p className="font-medium text-[#142C3F]">{activePoint.milestoneDetail.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#526779]">
                  <span>Baseline: <strong>{activePoint.milestoneDetail.baselineDate}</strong></span>
                  <span>Forecast: <strong>{activePoint.milestoneDetail.forecastDate}</strong></span>
                  <span>Float: <strong className={activePoint.milestoneDetail.floatDays < 0 ? 'text-[#A24335]' : 'text-[#0D8879]'}>{activePoint.milestoneDetail.floatDays}d</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#7B8798] italic">No major project milestone scheduled in this cycle.</p>
            )}
          </div>

          {/* Work Package Contribution */}
          <div className="bg-white p-2.5 rounded border border-[#D8E2EA]">
            <span className="font-semibold text-[#142C3F] text-xs block mb-1">
              Contributing WBS Work Packages ({activePoint.workItems?.length || 0}):
            </span>
            {activePoint.workItems && activePoint.workItems.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {activePoint.workItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-[11px] border-b border-gray-100 pb-0.5 last:border-0">
                    <span className="font-medium text-[#142C3F] truncate max-w-[200px]" title={item.name}>
                      <span className="font-mono text-[#0F6B68] mr-1">{item.id}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[#526779] shrink-0 ml-2">
                      {item.actualQty} / {item.plannedQty}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#7B8798] italic">Detailed work package ledger available in WBS matrix.</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEVEL 3 AUDIT TRAIL LEDGER */}
      {/* ========================================================= */}
      {showLedger && !isCompact && (
        <div className="p-4 border-t border-[#D8E2EA] bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-[#526779] tracking-wider">
              Level 3 — Cumulative Physical Progress Ledger (Audit Trail)
            </h4>
            <span className="text-[11px] text-[#7B8798]">Source: {baselineRevision} (P6 XML)</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#D8E2EA]">
            <table className="w-full min-w-[720px] text-left text-[13px] border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F3F6FA]">
                <tr className="bg-[#F3F6FA] text-[#142C3F] border-b border-[#D8E2EA] h-10 text-xs">
                  <th className="py-2.5 px-3 font-semibold">Period</th>
                  <th className="py-2.5 px-3 font-semibold">Cutoff Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Planned Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Forecast Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Variance %</th>
                  <th className="py-2.5 px-3 font-semibold">Work Package / Milestone Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E2EA]/60 text-[13px]">
                {displayedData.map((row) => {
                  const varVal = row.actual !== null ? Number((row.actual - row.planned).toFixed(1)) : null;
                  const isCurrentDD = row.isDataDate;
                  return (
                    <tr
                      key={row.period}
                      className={`hover:bg-[#F3F6FA] transition-colors ${
                        isCurrentDD ? 'bg-[#EAF0F5] font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {row.period}
                        {isCurrentDD && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0F6B68] text-white">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#526779] whitespace-nowrap">{row.dateLabel}</td>
                      <td className="py-2 px-3 font-mono text-right text-[#5274B8] font-semibold">{row.planned.toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono text-right text-[#0D8879] font-semibold">
                        {row.actual !== null ? `${row.actual.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-[#8057B7]">
                        {row.forecast.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2 px-3 font-mono text-right font-semibold ${
                          varVal === null
                            ? 'text-[#7B8798]'
                            : varVal < 0
                            ? 'text-[#A24335]'
                            : 'text-[#0D8879]'
                        }`}
                      >
                        {varVal !== null ? (varVal > 0 ? `+${varVal}%` : `${varVal}%`) : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#526779]">
                        <span className="font-medium text-[#142C3F]">{row.milestone}</span>
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
