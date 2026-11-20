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
import {
  calculateProjectEVM,
  formatCurrencyCr,
  formatVarianceCr,
  formatEVMIndex,
  formatPercentPoints,
  getEVMStatusBadgeConfig,
  CANONICAL_BAC,
  CANONICAL_ACTUAL_COST,
} from '@/lib/domain/evmEngine';
import { CHART_TOKENS, CHART_TOKENS_LIGHT, CHART_TOKENS_DARK } from '@/tokens/chartColors';
import { useTheme } from '@/context/ThemeContext';
import { usePreferences } from '@/context/PreferencesContext';
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
  BarChart3,
  Table as TableIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';

export interface SCurveChartProps {
  data?: TimeSeriesPoint[];
  variant?: 'full' | 'compact' | 'dashboard';
  title?: string;
  subtitle?: string;
  className?: string;
  showLedgerByDefault?: boolean;
  showEVMScorecard?: boolean;
  onSelectPeriod?: (point: TimeSeriesPoint) => void;
}

export function SCurveChart({
  data: initialData = PROJECT_S_CURVE_DATA,
  variant = 'full',
  title = 'Project S-Curve — Planned vs. Actual vs. Forecast',
  subtitle = 'Cumulative physical progress curve across all WBS work packages',
  className = '',
  showLedgerByDefault = false,
  showEVMScorecard = true,
  onSelectPeriod,
}: SCurveChartProps) {
  const isCompact = variant === 'compact';
  const isDashboard = variant === 'dashboard';
  const [showDashboardAdvanced, setShowDashboardAdvanced] = useState(false);
  const [showEVM, setShowEVM] = useState(showEVMScorecard);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const liveRegionId = useId();

  // Theme & Preferences Integration
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const chartTokens = isDark ? CHART_TOKENS_DARK : CHART_TOKENS_LIGHT;
  const { manager } = usePreferences();

  // View Display Mode: 'chart' (Visual SVG) vs 'table' (Accessible Data Table Alternative)
  const [viewDisplayMode, setViewDisplayMode] = useState<'chart' | 'table'>('chart');

  // --- 1. S-Curve Feature Controls State ---
  // Feature 1: "What does this chart mean?" explanation drawer/popover
  const [showExplanation, setShowExplanation] = useState(false);

  // Feature 2: Series visibility toggles (initialized with manager preferences if defined)
  const [seriesVisible, setSeriesVisible] = useState({
    planned: manager.sCurveSeries?.planned ?? true,
    actual: manager.sCurveSeries?.actual ?? true,
    forecast: manager.sCurveSeries?.forecast ?? true,
    comparison: true,
  });

  // Feature 3: "As of" Reporting Date & Baseline Revision
  const [asOfDate, setAsOfDate] = useState<'18 Sep 2026' | '11 Sep 2026' | '04 Sep 2026' | '28 Aug 2026'>('18 Sep 2026');
  const [baselineRevision, setBaselineRevision] = useState<'Rev 3.2' | 'Rev 3.1' | 'Rev 3.0'>('Rev 3.2');

  // Feature 4: Dimensional Filters (Discipline & Area)
  const [selectedDiscipline, setSelectedDiscipline] = useState<'All' | 'Piping' | 'Civil' | 'Mechanical' | 'Electrical'>('All');
  const [selectedArea, setSelectedArea] = useState<'All' | 'Unit A - Gas Processing' | 'Unit B - Compressor House' | 'Offsites & Substation'>('All');

  // Feature 7: Time-range options (initialized with manager preference)
  const [timeRange, setTimeRange] = useState<'1m' | '3m' | '6m' | 'all'>(
    manager.sCurveRange || 'all'
  );

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

  // Time Range Slicing (1M, 3M, 6M, All)
  let displayedData = activeDataset;
  if (timeRange === '1m') {
    // 1-month window around the cutoff data date
    displayedData = activeDataset.slice(3, 5); // Aug to Sep
  } else if (timeRange === '3m') {
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

    if (timeRange === '1m') return compSource.slice(3, 5);
    if (timeRange === '3m') return compSource.slice(2, 6);
    if (timeRange === '6m') return compSource.slice(1, 7);
    return compSource;
  }, [comparisonMode, timeRange]);

  const summary = getSCurveSummary(displayedData);

  // Dynamic ANSI/EIA-748 Earned Value Management (EVM) Metrics Calculation
  const evmMetrics = React.useMemo(() => {
    return calculateProjectEVM(
      CANONICAL_BAC,
      summary.plannedAtDataDate,
      summary.actualAtDataDate,
      CANONICAL_ACTUAL_COST
    );
  }, [summary.plannedAtDataDate, summary.actualAtDataDate]);
  const evmBadge = getEVMStatusBadgeConfig(evmMetrics.status);

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
  const tooltipWidth = 184;
  const tooltipHeight = activePoint.milestone ? 114 : 96;
  const tooltipX = activeX > width - tooltipWidth - 20 ? activeX - tooltipWidth - 12 : activeX + 12;
  const tooltipY = Math.max(padTop + 6, Math.min(height - padBottom - tooltipHeight - 6, getY(activePoint.planned) - 25));

  // Reset Filters to Baseline
  const isFiltered =
    selectedDiscipline !== 'All' ||
    selectedArea !== 'All' ||
    baselineRevision !== 'Rev 3.2' ||
    asOfDate !== '18 Sep 2026' ||
    timeRange !== 'all' ||
    comparisonMode !== 'none';

  const handleResetFilters = () => {
    setSelectedDiscipline('All');
    setSelectedArea('All');
    setBaselineRevision('Rev 3.2');
    setAsOfDate('18 Sep 2026');
    setTimeRange('all');
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
      className={`bg-white dark:bg-[#17221D] rounded-lg border border-[#D9E2DA] dark:border-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] shadow-xs ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto bg-white dark:bg-[#17221D] shadow-2xl p-6 border-2 border-[#006B61]' : className
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
      <div className="p-4 border-b border-[#D9E2DA] dark:border-[#3A5146] flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight">{title}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146]">
                Baseline: {baselineRevision} (P6 XML)
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F6F7F3] dark:bg-[#101815] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146]">
                Cutoff: {asOfDate}
              </span>

              {/* Feature 1: "What does this chart mean?" ⓘ Hint */}
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] bg-[#E4F1E9] dark:bg-[#172E28] hover:bg-[#D5EFEA] dark:hover:bg-[#1F3D35] border border-[#BDE4D0] dark:border-[#2A5949] transition-colors cursor-pointer"
                title="Explain Planned, Verified Actual, Forecast, Data Date, and Variance"
              >
                <Info className="w-3.5 h-3.5" />
                <span>What does this chart mean?</span>
              </button>
            </div>

            {!isCompact && (
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-1">{subtitle}</p>
            )}
          </div>

          {/* Action Tools: Reset, Mode Switch, CSV, SVG, Fullscreen */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* View Display Mode: Visual Chart vs Accessible Data Table */}
            <div className="flex rounded-md border border-[#D9E2DA] dark:border-[#3A5146] overflow-hidden bg-[#F6F7F3] dark:bg-[#101815] p-0.5">
              <button
                type="button"
                onClick={() => setViewDisplayMode('chart')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                  viewDisplayMode === 'chart'
                    ? 'bg-[#006B61] text-white shadow-xs font-semibold'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
                title="Visual S-Curve SVG Curve"
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Chart</span>
              </button>
              <button
                type="button"
                onClick={() => setViewDisplayMode('table')}
                className={`px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1 ${
                  viewDisplayMode === 'table'
                    ? 'bg-[#006B61] text-white shadow-xs font-semibold'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
                title="Accessible Tabular Data Alternative"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Data Table</span>
              </button>
            </div>

            {/* Feature 7: Time-range options with clear selected state & Reset Zoom */}
            <div className="flex items-center gap-1.5">
              <div className="flex rounded-md border border-[#D9E2DA] dark:border-[#3A5146] overflow-hidden bg-[#F6F7F3] dark:bg-[#101815] p-0.5">
                {(['1m', '3m', '6m', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setTimeRange(r)}
                    className={`px-2.5 py-1 text-xs font-mono uppercase rounded transition-colors cursor-pointer ${
                      timeRange === r
                        ? 'bg-[#006B61] text-white font-bold shadow-xs'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                    title={r === 'all' ? 'All project duration' : `${r.toUpperCase()} time range zoom`}
                  >
                    {r === 'all' ? 'All' : r.toUpperCase()}
                  </button>
                ))}
              </div>
              {timeRange !== 'all' && (
                <button
                  type="button"
                  onClick={() => setTimeRange('all')}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#DCE7EE] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded transition-colors cursor-pointer"
                  title="Reset date-range zoom to full schedule"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Zoom</span>
                </button>
              )}
            </div>

            {isDashboard ? (
              <>
                <button
                  type="button"
                  onClick={() => setShowEVM(!showEVM)}
                  className={`px-2.5 py-1 text-xs rounded border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    showEVM
                      ? 'bg-[#006B61] text-white border-[#006B61] shadow-xs'
                      : 'bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                  title="Toggle Contractual EVM Scorecard"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{showEVM ? 'Hide EVM' : 'EVM Scorecard'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDashboardAdvanced(!showDashboardAdvanced)}
                  className={`px-2.5 py-1 text-xs rounded border inline-flex items-center gap-1 transition-colors cursor-pointer ${
                    showDashboardAdvanced
                      ? 'bg-[#006B61] text-white border-[#006B61] shadow-xs'
                      : 'bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showDashboardAdvanced ? 'Hide Secondary Controls' : 'Advanced Controls'}</span>
                </button>

                <Link
                  href="/progress"
                  className="px-2.5 py-1 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:text-[#094341] bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#DCE7EE] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded inline-flex items-center gap-1 transition-colors shadow-2xs"
                >
                  <span>Progress Deep Dive</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <>
                {/* Feature 9: Cumulative vs Period Switch with clear selected state */}
                <div className="flex rounded-md border border-[#D9E2DA] dark:border-[#3A5146] overflow-hidden bg-[#F6F7F3] dark:bg-[#101815] p-0.5">
                  <button
                    type="button"
                    onClick={() => setProgressViewMode('cumulative')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      progressViewMode === 'cumulative'
                        ? 'bg-[#006B61] text-white shadow-xs font-semibold'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                  >
                    Cumulative S-Curve
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgressViewMode('period')}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                      progressViewMode === 'period'
                        ? 'bg-[#006B61] text-white shadow-xs font-semibold'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                  >
                    Period Progress (%/Mo)
                  </button>
                </div>

                {/* EVM Scorecard Toggle */}
                <button
                  type="button"
                  onClick={() => setShowEVM(!showEVM)}
                  className={`p-1.5 rounded border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    showEVM
                      ? 'bg-[#006B61] text-white border-[#006B61]'
                      : 'bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                  title="Toggle ANSI/EIA-748 EVM Summary Scorecard"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">EVM Scorecard</span>
                </button>

                {/* Feature 14: Report Summary Toggle */}
                <button
                  type="button"
                  onClick={() => setShowReportSummary(!showReportSummary)}
                  className={`p-1.5 rounded border text-xs flex items-center gap-1 cursor-pointer transition-colors ${
                    showReportSummary
                      ? 'bg-[#006B61] text-white border-[#006B61]'
                      : 'bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
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
                    className="p-1.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#F6F7F3] dark:hover:bg-[#243832] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors cursor-pointer"
                    title="Download S-Curve Ledger CSV"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportSVG}
                    className="p-1.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#F6F7F3] dark:hover:bg-[#243832] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors cursor-pointer"
                    title="Download S-Curve SVG Vector Image"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] hover:bg-[#F6F7F3] dark:hover:bg-[#243832] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen S-Curve Workspace'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#A43B36] dark:text-[#FF9E94]" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Feature 1: "What does this chart mean?" Collapsible Explanation Drawer */}
        {showExplanation && (
          <div className="bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md p-3 text-xs text-[#1A2B25] dark:text-[#F2F4E9] animate-fadeIn">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-[#006B61] dark:text-[#72C6AD]">
                <Info className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                <span>Understanding the Project S-Curve & Earned Value Metrics</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanation(false)}
                className="text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="font-semibold text-[#4263EB] dark:text-[#E5C185] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#4263EB] dark:bg-[#E5C185] inline-block" />
                  Planned (Baseline)
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Physical progress scheduled in Rev 3.2 baseline envelope. Frozen contract commitment.
                </p>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="font-semibold text-[#176B53] dark:text-[#72C6AD] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#176B53] dark:bg-[#72C6AD] inline-block" />
                  Verified Actual
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Physical progress certified by site engineers and signed DPR evidence up to Data Date.
                </p>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="font-semibold text-[#7357A6] dark:text-[#C0A8F0] mb-0.5 flex items-center gap-1.5">
                  <span className="w-3 h-1 border-t-2 border-dashed border-[#7357A6] dark:border-[#C0A8F0] inline-block" />
                  Forecast (CPM Logic)
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Deterministic critical-path projection calculated from remaining durations and logic ties.
                </p>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-[#1A2B25] dark:border-[#F2F4E9] inline-block" />
                  Data Date (Cutoff)
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Current reporting boundary (18 Sep 2026). Actuals end here; future work is projected.
                </p>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="font-semibold text-[#A43B36] dark:text-[#FF9E94] mb-0.5 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#A43B36] dark:bg-[#FF9E94] inline-block" />
                  Variance (% Slip)
                </div>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Calculated as: <span className="font-mono font-bold">Actual % - Planned %</span>. Negative values indicate schedule slip.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Feature 2, 3, 4, 8: Interactive Filter Toolbar ("As of", Baselines, Discipline, Compare) */}
        {(!isDashboard || showDashboardAdvanced) && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#D9E2DA]/70 dark:border-[#3A5146]/70 text-xs">
            <div className="flex items-center flex-wrap gap-2">
              {/* Feature 3: "As of" Reporting Date */}
              <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded px-2 py-1">
                <Calendar className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5]" />
                <span className="text-[#52665D] dark:text-[#B5C1B5] font-medium text-[11px]">As of:</span>
                <select
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value as any)}
                  className="bg-transparent font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:outline-none cursor-pointer"
                >
                  <option value="18 Sep 2026" className="dark:bg-[#17221D]">18 Sep 2026 (Current Cutoff)</option>
                  <option value="11 Sep 2026" className="dark:bg-[#17221D]">11 Sep 2026 (Week 37)</option>
                  <option value="04 Sep 2026" className="dark:bg-[#17221D]">04 Sep 2026 (Week 36)</option>
                  <option value="28 Aug 2026" className="dark:bg-[#17221D]">28 Aug 2026 (Week 35)</option>
                </select>
              </div>

              {/* Feature 3: Baseline Revision */}
              <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded px-2 py-1">
                <span className="text-[#52665D] dark:text-[#B5C1B5] font-medium text-[11px]">Baseline:</span>
                <select
                  value={baselineRevision}
                  onChange={(e) => setBaselineRevision(e.target.value as any)}
                  className="bg-transparent font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:outline-none cursor-pointer"
                >
                  <option value="Rev 3.2" className="dark:bg-[#17221D]">Rev 3.2 (Approved)</option>
                  <option value="Rev 3.1" className="dark:bg-[#17221D]">Rev 3.1 (Aug 2026)</option>
                  <option value="Rev 3.0" className="dark:bg-[#17221D]">Rev 3.0 (FID Contract)</option>
                </select>
              </div>

              {/* Feature 4: Discipline Filter */}
              <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded px-2 py-1">
                <span className="text-[#52665D] dark:text-[#B5C1B5] font-medium text-[11px]">Discipline:</span>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                    setSelectedDiscipline(e.target.value as any);
                    if (e.target.value !== 'All') setSelectedArea('All');
                  }}
                  className="bg-transparent font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:outline-none cursor-pointer"
                >
                  <option value="All" className="dark:bg-[#17221D]">All Disciplines</option>
                  <option value="Piping" className="dark:bg-[#17221D]">Piping</option>
                  <option value="Civil" className="dark:bg-[#17221D]">Civil</option>
                  <option value="Mechanical" className="dark:bg-[#17221D]">Mechanical</option>
                  <option value="Electrical" className="dark:bg-[#17221D]">Electrical</option>
                </select>
              </div>

              {/* Feature 4: Area Filter */}
              <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded px-2 py-1">
                <span className="text-[#52665D] dark:text-[#B5C1B5] font-medium text-[11px]">Area:</span>
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value as any);
                    if (e.target.value !== 'All') setSelectedDiscipline('All');
                  }}
                  className="bg-transparent font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:outline-none cursor-pointer"
                >
                  <option value="All" className="dark:bg-[#17221D]">All Areas</option>
                  <option value="Unit A - Gas Processing" className="dark:bg-[#17221D]">Unit A (Gas Processing)</option>
                  <option value="Unit B - Compressor House" className="dark:bg-[#17221D]">Unit B (Compressors)</option>
                  <option value="Offsites & Substation" className="dark:bg-[#17221D]">Offsites & Substation</option>
                </select>
              </div>

              {/* Feature 8: Compare Revisions or Saved Scenarios */}
              <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded px-2 py-1">
                <span className="text-[#52665D] dark:text-[#B5C1B5] font-medium text-[11px]">Compare:</span>
                <select
                  value={comparisonMode}
                  onChange={(e) => setComparisonMode(e.target.value as any)}
                  className="bg-transparent font-medium text-[#1A2B25] dark:text-[#F2F4E9] focus:outline-none cursor-pointer"
                >
                  <option value="none" className="dark:bg-[#17221D]">None</option>
                  <option value="rev31" className="dark:bg-[#17221D]">Rev 3.1 Baseline</option>
                  <option value="rev30" className="dark:bg-[#17221D]">Rev 3.0 Baseline</option>
                  <option value="monsoon" className="dark:bg-[#17221D]">Monsoon Slip Scenario</option>
                </select>
              </div>

              {/* Reset Filters */}
              {isFiltered && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#A43B36] dark:text-[#FF9E94] bg-[#F6E4E1] dark:bg-[#3B2422] hover:bg-[#F8CDC6] dark:hover:bg-[#481E21] border border-[#DCABA7] dark:border-[#5B3734] rounded transition-colors cursor-pointer"
                  title="Reset all filters back to project baseline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Feature 2: Series Toggles (Checkboxes) with distinct line colors */}
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#4263EB] dark:text-[#E5C185]">
                <input
                  type="checkbox"
                  checked={seriesVisible.planned}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, planned: e.target.checked }))}
                  className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#4263EB] dark:text-[#E5C185] focus:ring-0 cursor-pointer"
                />
                Planned (Solid Blue)
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#176B53] dark:text-[#72C6AD]">
                <input
                  type="checkbox"
                  checked={seriesVisible.actual}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, actual: e.target.checked }))}
                  className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#176B53] dark:text-[#72C6AD] focus:ring-0 cursor-pointer"
                />
                Verified Actual (Green)
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#7357A6] dark:text-[#C0A8F0]">
                <input
                  type="checkbox"
                  checked={seriesVisible.forecast}
                  onChange={(e) => setSeriesVisible((prev) => ({ ...prev, forecast: e.target.checked }))}
                  className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#7357A6] dark:text-[#C0A8F0] focus:ring-0 cursor-pointer"
                />
                Forecast (Dashed Violet)
              </label>
              {comparisonMode !== 'none' && (
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-[#825700] dark:text-[#FBBF24]">
                  <input
                    type="checkbox"
                    checked={seriesVisible.comparison}
                    onChange={(e) => setSeriesVisible((prev) => ({ ...prev, comparison: e.target.checked }))}
                    className="rounded border-[#D9E2DA] dark:border-[#3A5146] text-[#825700] dark:text-[#FBBF24] focus:ring-0 cursor-pointer"
                  />
                  Comparison (Amber)
                </label>
              )}
            </div>
          </div>
        )}

        {/* Feature 4: Scope Warning Banner when filtering */}
        {(selectedDiscipline !== 'All' || selectedArea !== 'All') && (
          <div className="bg-[#F8EFDA] dark:bg-[#33220A] border border-[#E5C185] dark:border-[#5C3D14] rounded p-2 text-xs text-[#825700] dark:text-[#FBBF24] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#825700] dark:text-[#FBBF24] shrink-0" />
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
              className="text-xs font-semibold text-[#825700] dark:text-[#FBBF24] underline hover:text-[#5E3809] dark:hover:text-[#FDE68A] cursor-pointer shrink-0 ml-2"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Feature 14: Compact Report Summary Card */}
        {showReportSummary && (
          <div className="bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md p-3 text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                Executive S-Curve Audit Report Card
              </span>
              <span className="font-mono text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Source: Rev 3.2 (P6 XML)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Reporting Date</div>
                <div className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{asOfDate}</div>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Baseline Plan</div>
                <div className="font-bold text-[#4263EB] dark:text-[#E5C185]">{summary.plannedAtDataDate.toFixed(1)}%</div>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Verified Actual</div>
                <div className="font-bold text-[#176B53] dark:text-[#72C6AD]">{summary.actualAtDataDate.toFixed(1)}%</div>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Schedule Variance</div>
                <div className="font-bold text-[#A43B36] dark:text-[#FF9E94]">{summary.varianceAtDataDate.toFixed(1)} pp slip</div>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Schedule Perf Index (SPI)</div>
                <div className="font-bold text-[#825700] dark:text-[#FBBF24]">
                  {formatEVMIndex(evmMetrics.spi, 2)} ({evmMetrics.spi < 1 ? 'Behind' : 'On Track'})
                </div>
              </div>
              <div className="bg-white dark:bg-[#17221D] p-2 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Forecast COD Finish</div>
                <div className="font-bold text-[#7357A6] dark:text-[#C0A8F0]">20 Dec 2026 (+5d)</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* CONTRACTUAL ANSI/EIA-748 EVM SUMMARY SCORECARD */}
      {/* 11 Metrics: BAC, PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC, TCPI */}
      {/* ========================================================= */}
      {showEVM && (
        <div className="mx-4 mt-3 mb-1 p-3.5 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-[#D9E2DA]/80 dark:border-[#3A5146]/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold uppercase tracking-wider text-[11px] text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1.5 font-heading">
                <BarChart3 className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                Contractual EVM Summary Scorecard (ANSI/EIA-748)
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${evmBadge.badgeClass}`}>
                {evmBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
              <span>Data Date: {asOfDate}</span>
              <span>•</span>
              <span>Baseline: {baselineRevision}</span>
            </div>
          </div>

          {/* 11 Contractual Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2">
            {/* 1. BAC */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Budget (BAC)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#1A2B25] dark:text-[#F2F4E9]">
                {formatCurrencyCr(evmMetrics.bac)}
              </div>
              <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Contract Baseline</div>
            </div>

            {/* 2. PV */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Planned (PV)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#825700] dark:text-[#E5C185]">
                {formatCurrencyCr(evmMetrics.pv)}
              </div>
              <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">{evmMetrics.plannedPct.toFixed(1)}% of BAC</div>
            </div>

            {/* 3. EV */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Earned (EV)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#08786A] dark:text-[#72C6AD]">
                {formatCurrencyCr(evmMetrics.ev)}
              </div>
              <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">{evmMetrics.actualPct.toFixed(1)}% of BAC</div>
            </div>

            {/* 4. AC */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Actual Cost (AC)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#182920] dark:text-[#F2F4E9]">
                {formatCurrencyCr(evmMetrics.ac)}
              </div>
              <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Cumulative Spend</div>
            </div>

            {/* 5. CV */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Cost Var (CV)</div>
              <div className={`my-1 font-mono font-bold text-sm ${evmMetrics.cv < 0 ? 'text-[#A43B36] dark:text-[#FF9E94]' : 'text-[#08786A] dark:text-[#72C6AD]'}`}>
                {formatVarianceCr(evmMetrics.cv)}
              </div>
              <div className="text-[10px] text-[#A43B36] dark:text-[#FF9E94] font-medium">
                {evmMetrics.cv < 0 ? 'Cost Overrun' : 'Cost Underrun'}
              </div>
            </div>

            {/* 6. SV */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase flex items-center gap-0.5">
                <span>Sched Var (SV)</span>
                <TermHelp term="variance" />
              </div>
              <div className={`my-1 font-mono font-bold text-sm ${evmMetrics.sv < 0 ? 'text-[#A43B36] dark:text-[#FF9E94]' : 'text-[#08786A] dark:text-[#72C6AD]'}`}>
                {formatVarianceCr(evmMetrics.sv)}
              </div>
              <div className="text-[10px] text-[#A43B36] dark:text-[#FF9E94] font-medium">
                {formatPercentPoints(evmMetrics.svPct)}
              </div>
            </div>

            {/* 7. CPI */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase flex items-center gap-0.5">
                <span>CPI</span>
                <TermHelp term="cpi" />
              </div>
              <div className={`my-1 font-mono font-bold text-base ${evmMetrics.cpi < 1 ? 'text-[#A43B36] dark:text-[#FF9E94]' : 'text-[#08786A] dark:text-[#72C6AD]'}`}>
                {formatEVMIndex(evmMetrics.cpi, 2)}
              </div>
              <div className="text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
                {formatEVMIndex(evmMetrics.cpi, 4)} ({evmMetrics.cpi < 1 ? 'Overrun' : 'Favorable'})
              </div>
            </div>

            {/* 8. SPI */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase flex items-center gap-0.5">
                <span>SPI</span>
                <TermHelp term="spi" />
              </div>
              <div className={`my-1 font-mono font-bold text-base ${evmMetrics.spi < 1 ? 'text-[#825700] dark:text-[#F3B765]' : 'text-[#08786A] dark:text-[#72C6AD]'}`}>
                {formatEVMIndex(evmMetrics.spi, 2)}
              </div>
              <div className="text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
                {formatEVMIndex(evmMetrics.spi, 4)} ({evmMetrics.spi < 1 ? 'Lag' : 'On Track'})
              </div>
            </div>

            {/* 9. EAC */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Estimate (EAC)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#A43B36] dark:text-[#FF9E94]">
                {formatCurrencyCr(evmMetrics.eac)}
              </div>
              <div className="text-[10px] text-[#A43B36] dark:text-[#FF9E94]">
                +{formatCurrencyCr(evmMetrics.eac - evmMetrics.bac)}
              </div>
            </div>

            {/* 10. VAC */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">Var at Comp (VAC)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#A43B36] dark:text-[#FF9E94]">
                {formatVarianceCr(evmMetrics.vac)}
              </div>
              <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5]">Projected Slippage</div>
            </div>

            {/* 11. TCPI */}
            <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146] flex flex-col justify-between">
              <div className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase">To-Complete (TCPI)</div>
              <div className="my-1 font-mono font-bold text-sm text-[#825700] dark:text-[#F3B765]">
                {formatEVMIndex(evmMetrics.tcpi, 4)}
              </div>
              <div className="text-[10px] text-[#825700] dark:text-[#F3B765]">Target BAC</div>
            </div>
          </div>

          {/* Quick Contextual Summary */}
          <div className="mt-2.5 pt-2 border-t border-[#D9E2DA]/60 dark:border-[#3A5146]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
            <p>
              <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Performance Verdict: </strong>
              {evmMetrics.spiInterpretation} {evmMetrics.cpiInterpretation}
            </p>
            <div className="shrink-0 font-mono text-[10px]">
              TCPI: {formatEVMIndex(evmMetrics.tcpi, 4)} required efficiency
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SVG CHART CANVAS OR ACCESSIBLE DATA TABLE ALTERNATIVE */}
      {/* ========================================================= */}
      <div className="p-3 sm:p-4 w-full">
        {viewDisplayMode === 'table' ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-md bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146]">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A2B25] dark:text-[#F2F4E9]">
                  Accessible S-Curve Progress Data Table
                </h4>
                <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  Screen reader & keyboard accessible tabular view of all project reporting periods, verified actuals, and deterministic projections.
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
                Baseline: {baselineRevision} • Cutoff: {asOfDate}
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#D9E2DA] dark:border-[#3A5146]">
              <table className="w-full min-w-[760px] text-left text-[13px] border-collapse bg-white dark:bg-[#17221D]">
                <caption className="sr-only">Project S-Curve Physical Progress Table</caption>
                <thead className="bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border-b border-[#D9E2DA] dark:border-[#3A5146]">
                  <tr className="h-10 text-xs">
                    <th scope="col" className="py-2.5 px-3 font-semibold">Reporting Period</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Cutoff Date</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">Planned Cum %</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">Verified Actual %</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">Forecast Cum %</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">Variance (pp)</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold text-right">Period Work</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Milestone / Work Package</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146]/60 text-[13px]">
                  {displayedData.map((row, idx) => {
                    const isSelected = idx === activeIndex;
                    const isDD = row.isDataDate;
                    const varVal = row.actual !== null ? Number((row.actual - row.planned).toFixed(1)) : null;

                    return (
                      <tr
                        key={row.period}
                        onClick={() => handlePointSelect(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handlePointSelect(idx);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#EAF0E9] dark:bg-[#243832] font-semibold'
                            : isDD
                            ? 'bg-[#F6F7F3]/70 dark:bg-[#243832]/40 hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                            : 'hover:bg-[#F6F7F3] dark:hover:bg-[#243832]'
                        }`}
                      >
                        <th scope="row" className="py-2.5 px-3 whitespace-nowrap text-[#1A2B25] dark:text-[#F2F4E9] font-medium">
                          <div className="flex items-center gap-1.5">
                            {row.period}
                            {isDD && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#103F39] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                                Cutoff
                              </span>
                            )}
                          </div>
                        </th>
                        <td className="py-2 px-3 text-[#52665D] dark:text-[#B5C1B5] whitespace-nowrap">{row.dateLabel}</td>
                        <td className="py-2 px-3 font-mono text-right font-semibold text-[#4263EB] dark:text-[#E5C185]">
                          {row.planned.toFixed(1)}%
                        </td>
                        <td className="py-2 px-3 font-mono text-right font-semibold text-[#176B53] dark:text-[#72C6AD]">
                          {row.actual !== null ? `${row.actual.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-right font-semibold text-[#7357A6] dark:text-[#C0A8F0]">
                          {row.forecast.toFixed(1)}%
                        </td>
                        <td
                          className={`py-2 px-3 font-mono text-right font-semibold ${
                            varVal === null
                              ? 'text-[#52665D] dark:text-[#B5C1B5]'
                              : varVal < 0
                              ? 'text-[#A43B36] dark:text-[#FF9E94]'
                              : 'text-[#176B53] dark:text-[#72C6AD]'
                          }`}
                        >
                          {varVal !== null ? (varVal > 0 ? `+${varVal}%` : `${varVal}%`) : '—'}
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-xs text-[#52665D] dark:text-[#B5C1B5]">
                          +{row.periodPlannedIncrement.toFixed(1)}% /{' '}
                          {row.periodActualIncrement !== null ? `+${row.periodActualIncrement.toFixed(1)}%` : '—'}
                        </td>
                        <td className="py-2 px-3 text-[#1A2B25] dark:text-[#F2F4E9]">
                          {row.milestone && (
                            <div className="flex items-center gap-1 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD]">
                              <span>◆</span>
                              <span>{row.milestone}</span>
                            </div>
                          )}
                          {row.notes && (
                            <span className="block text-[11px] text-[#52665D] dark:text-[#B5C1B5] truncate max-w-xs">{row.notes}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
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
              fill={isDark ? '#F2F4E9' : '#1A2B25'}
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
                    stroke={chartTokens.grid}
                    strokeWidth="1"
                    strokeDasharray={pct === 0 || pct === 100 ? undefined : '3,3'}
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fill={chartTokens.textMuted}
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
              fill={chartTokens.forecastZoneBg}
              opacity="0.85"
            />
            <text
              x={ddX + (width - padRight - ddX) / 2}
              y={padTop + 14}
              textAnchor="middle"
              fontSize="9"
              fontWeight="bold"
              fill={chartTokens.forecast.stroke}
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
              stroke={chartTokens.dataDateLine}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
            <rect
              x={ddX - 58}
              y={padTop - 20}
              width={116}
              height={20}
              rx={3}
              fill={chartTokens.dataDateLine}
            />
            <text
              x={ddX}
              y={padTop - 6}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={isDark ? '#0B2822' : '#FFFFFF'}
            >
              DATA DATE ({asOfDate.split(' ')[0]} {asOfDate.split(' ')[1]})
            </text>

            {/* Feature 6: Prominent Callout at Data Date: Planned, Actual, Variance */}
            <line
              x1={ddX}
              y1={ddPlannedY}
              x2={ddX}
              y2={ddActualY}
              stroke={chartTokens.variance.stroke}
              strokeWidth="3.5"
            />
            <rect
              x={Math.min(width - padRight - 130, ddX + 8)}
              y={(ddPlannedY + ddActualY) / 2 - 12}
              width={124}
              height={24}
              rx={3}
              fill={chartTokens.variance.bg}
              stroke={chartTokens.variance.border}
              strokeWidth="1"
            />
            <text
              x={Math.min(width - padRight - 130, ddX + 8) + 62}
              y={(ddPlannedY + ddActualY) / 2 + 4}
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill={chartTokens.variance.text}
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
                    stroke="#81500B"
                    strokeWidth="2"
                    strokeDasharray="5,4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Planned Line */}
                {seriesVisible.planned && (
                  <path
                    d={plannedPathD}
                    fill="none"
                    stroke={chartTokens.planned.stroke}
                    strokeWidth={chartTokens.planned.strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Forecast Line */}
                {seriesVisible.forecast && (
                  <path
                    d={forecastPathD}
                    fill="none"
                    stroke={chartTokens.forecast.stroke}
                    strokeWidth={chartTokens.forecast.strokeWidth}
                    strokeDasharray={chartTokens.forecast.dashArray}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Actual Line */}
                {seriesVisible.actual && (
                  <path
                    d={actualPathD}
                    fill="none"
                    stroke={chartTokens.actual.stroke}
                    strokeWidth={chartTokens.actual.strokeWidth}
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

                  const planY = getY(pt.periodPlannedIncrement * 3.5);
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
                          fill={chartTokens.planned.stroke}
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
                          fill={chartTokens.actual.stroke}
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
                          fill={chartTokens.forecast.stroke}
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
                      stroke={chartTokens.textMuted}
                      strokeWidth="1"
                      strokeDasharray="2,2"
                    />
                  )}

                  {/* Feature 10: Milestone Diamond (◆) Markers */}
                  {pt.milestone && (
                    <g transform={`translate(${x}, ${getY(pt.actual ?? pt.planned) - 14})`}>
                      <polygon
                        points="0,-6 6,0 0,6 -6,0"
                        fill={pt.actual !== null ? chartTokens.actual.stroke : pt.milestoneDetail?.status === 'Critical Slip' ? chartTokens.variance.stroke : chartTokens.forecast.stroke}
                        stroke={isDark ? '#17221D' : '#FFFFFF'}
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
                        fill={chartTokens.variance.stroke}
                        stroke={isDark ? '#17221D' : '#FFFFFF'}
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
                      fill={isDark ? '#17221D' : '#FFFFFF'}
                      stroke={chartTokens.planned.stroke}
                      strokeWidth="2"
                    />
                  )}

                  {/* Actual Node Circle */}
                  {seriesVisible.actual && pt.actual !== null && (
                    <circle
                      cx={x}
                      cy={getY(pt.actual)}
                      r={isSelected ? 5 : 4}
                      fill={chartTokens.actual.stroke}
                      stroke={isDark ? '#17221D' : '#FFFFFF'}
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Forecast Node Circle */}
                  {seriesVisible.forecast && pt.actual === null && (
                    <circle
                      cx={x}
                      cy={getY(pt.forecast)}
                      r={isSelected ? 4.5 : 3.5}
                      fill={chartTokens.forecast.stroke}
                      stroke={isDark ? '#17221D' : '#FFFFFF'}
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
                    fill={isSelected ? (isDark ? '#72C6AD' : '#006B61') : isDD ? (isDark ? '#F2F4E9' : '#1A2B25') : chartTokens.textMuted}
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
              fill={chartTokens.textMuted}
            >
              Project Reporting Timeline • Cutoff: {asOfDate} • Baseline: {baselineRevision}
            </text>

            {/* Hover Tooltip with period, planned, actual, forecast, and variance */}
            {hoveredPointIndex !== null && (
              <g pointerEvents="none">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={6}
                  fill={isDark ? '#17221D' : '#FFFFFF'}
                  stroke={isDark ? '#3A5146' : '#D9E2DA'}
                  strokeWidth="1.5"
                  filter={isDark ? 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))' : 'drop-shadow(0 4px 12px rgba(26, 43, 37, 0.12))'}
                />
                <text x={tooltipX + 12} y={tooltipY + 18} fontSize="11" fontWeight="bold" fill={isDark ? '#F2F4E9' : '#1A2B25'}>
                  {activePoint.period} • {activePoint.dateLabel}
                </text>
                <text x={tooltipX + 12} y={tooltipY + 36} fontSize="11" fontWeight="500" fill={chartTokens.textMuted}>
                  Planned: <tspan fontWeight="bold" fill={chartTokens.planned.stroke}>{activePoint.planned.toFixed(1)}%</tspan>
                </text>
                <text x={tooltipX + 12} y={tooltipY + 52} fontSize="11" fontWeight="500" fill={chartTokens.textMuted}>
                  Actual: <tspan fontWeight="bold" fill={chartTokens.actual.stroke}>{activePoint.actual !== null ? `${activePoint.actual.toFixed(1)}%` : '—'}</tspan>
                </text>
                <text x={tooltipX + 12} y={tooltipY + 68} fontSize="11" fontWeight="500" fill={chartTokens.textMuted}>
                  Forecast: <tspan fontWeight="bold" fill={chartTokens.forecast.stroke}>{activePoint.forecast ? `${activePoint.forecast.toFixed(1)}%` : '—'}</tspan>
                </text>
                <text x={tooltipX + 12} y={tooltipY + 84} fontSize="11" fontWeight="500" fill={chartTokens.textMuted}>
                  Variance:{' '}
                  <tspan fontWeight="bold" fill={activeVariance < 0 ? chartTokens.variance.stroke : chartTokens.actual.stroke}>
                    {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                    {activePoint.actual === null ? ' (Fcst)' : ''}
                  </tspan>
                </text>
                {activePoint.milestone && (
                  <text x={tooltipX + 12} y={tooltipY + 101} fontSize="10" fontWeight="bold" fill={isDark ? '#72C6AD' : '#006B61'}>
                    ◆ {activePoint.milestone.length > 24 ? `${activePoint.milestone.slice(0, 22)}…` : activePoint.milestone}
                  </text>
                )}
              </g>
            )}
          </svg>
        )}

        {/* Clickable Interactive Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] text-xs text-[#52665D] dark:text-[#B5C1B5]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-[#52665D] dark:text-[#B5C1B5] mr-1 hidden sm:inline">Series Toggles:</span>
            <button
              type="button"
              onClick={() => setSeriesVisible((prev) => ({ ...prev, planned: !prev.planned }))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer border ${
                seriesVisible.planned
                  ? 'bg-[#EBF1FA] dark:bg-[#1E2D4A] border-[#C8D7F7] dark:border-[#2D4370] text-[#4263EB] dark:text-[#E5C185] font-semibold shadow-2xs'
                  : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#738A80] dark:text-[#859688] line-through opacity-60'
              }`}
              aria-pressed={seriesVisible.planned}
              title="Click to toggle Planned Baseline series"
            >
              <span className="w-3.5 h-1 bg-[#4263EB] dark:bg-[#E5C185] inline-block rounded-xs" />
              <span>■ Planned Baseline</span>
            </button>

            <button
              type="button"
              onClick={() => setSeriesVisible((prev) => ({ ...prev, actual: !prev.actual }))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer border ${
                seriesVisible.actual
                  ? 'bg-[#E4F1E9] dark:bg-[#16332A] border-[#BCE7D2] dark:border-[#235345] text-[#176B53] dark:text-[#72C6AD] font-semibold shadow-2xs'
                  : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#738A80] dark:text-[#859688] line-through opacity-60'
              }`}
              aria-pressed={seriesVisible.actual}
              title="Click to toggle Verified Actual series"
            >
              <span className="w-3.5 h-1.5 bg-[#176B53] dark:bg-[#72C6AD] inline-block rounded-xs" />
              <span>● Verified Actual</span>
            </button>

            <button
              type="button"
              onClick={() => setSeriesVisible((prev) => ({ ...prev, forecast: !prev.forecast }))}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer border ${
                seriesVisible.forecast
                  ? 'bg-[#F4F0FA] dark:bg-[#2C2140] border-[#DCCEF0] dark:border-[#4B376E] text-[#7357A6] dark:text-[#C0A8F0] font-semibold shadow-2xs'
                  : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#738A80] dark:text-[#859688] line-through opacity-60'
              }`}
              aria-pressed={seriesVisible.forecast}
              title="Click to toggle Forecast Trajectory series"
            >
              <span className="w-4 h-0.5 border-t-2 border-dashed border-[#7357A6] dark:border-[#C0A8F0] inline-block" />
              <span>▲ Forecast (CPM)</span>
            </button>

            {comparisonMode !== 'none' && (
              <button
                type="button"
                onClick={() => setSeriesVisible((prev) => ({ ...prev, comparison: !prev.comparison }))}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all cursor-pointer border ${
                  seriesVisible.comparison
                    ? 'bg-[#F8EFDA] dark:bg-[#33220A] border-[#E5C185] dark:border-[#5C3D14] text-[#825700] dark:text-[#FBBF24] font-semibold shadow-2xs'
                    : 'bg-[#F6F7F3] dark:bg-[#243832] border-[#D9E2DA] dark:border-[#3A5146] text-[#738A80] dark:text-[#859688] line-through opacity-60'
                }`}
                aria-pressed={seriesVisible.comparison}
                title="Click to toggle Comparison series"
              >
                <span className="w-4 h-0.5 border-t-2 border-dashed border-[#81500B] dark:border-[#FBBF24] inline-block" />
                <span>◇ Comparison Series</span>
              </button>
            )}

            <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#52665D] dark:text-[#B5C1B5]">
              <span className="text-[#176B53] dark:text-[#72C6AD] font-bold">◆</span>
              <span>Milestone Marker</span>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#52665D] dark:text-[#B5C1B5]">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-[#1A2B25] dark:border-[#F2F4E9] inline-block" />
              <span>Data Date Cutoff</span>
            </div>
          </div>

          {!isCompact && (
            <button
              type="button"
              onClick={() => setShowLedger(!showLedger)}
              className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline focus:outline-none flex items-center gap-1 cursor-pointer"
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
      <div className="mx-4 mb-3 p-3 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded text-xs text-[#1A2B25] dark:text-[#F2F4E9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              summary.varianceAtDataDate < 0 ? 'bg-[#92372F]' : 'bg-[#176B53]'
            }`}
          />
          <p className="font-medium text-[#1A2B25]">
            {getSCurveInterpretation(summary)}
          </p>
        </div>
        <span className="text-[11px] font-mono text-[#52665D] shrink-0">
          Cutoff: {asOfDate} ({baselineRevision})
        </span>
      </div>

      {/* ========================================================= */}
      {/* Feature 5: SELECTABLE POINT INTERACTIVE DRAWER / CONTEXT */}
      {/* Numbers, Period Delta, Milestones, and Contributed Work Items */}
      {/* ========================================================= */}
      <div className="px-4 py-3 bg-[#F6F7F3] dark:bg-[#101815] border-t border-[#D9E2DA] dark:border-[#3A5146] text-xs text-[#1A2B25] dark:text-[#F2F4E9]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2 pb-2 border-b border-[#D9E2DA]/60 dark:border-[#3A5146]/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] text-sm">{activePoint.period}</span>
            <span className="text-[#52665D] dark:text-[#B5C1B5] text-xs font-mono">({activePoint.dateLabel})</span>
            {activePoint.isDataDate && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#103F39] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                CURRENT REPORTING CUTOFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
            <span>
              Cumulative Plan: <strong className="text-[#4263EB] dark:text-[#E5C185]">{activePoint.planned.toFixed(1)}%</strong>
            </span>
            {activePoint.actual !== null ? (
              <span>
                Verified Actual: <strong className="text-[#176B53] dark:text-[#72C6AD]">{activePoint.actual.toFixed(1)}%</strong> (
                <strong className={activeVariance < 0 ? 'text-[#A43B36] dark:text-[#FF9E94]' : 'text-[#176B53] dark:text-[#72C6AD]'}>
                  {activeVariance > 0 ? `+${activeVariance}%` : `${activeVariance}%`}
                </strong>
                )
              </span>
            ) : (
              <span>
                Forecast: <strong className="text-[#7357A6] dark:text-[#C0A8F0]">{activePoint.forecast.toFixed(1)}%</strong>
              </span>
            )}
            <span className="border-l border-[#D9E2DA] dark:border-[#3A5146] pl-3 text-[#52665D] dark:text-[#B5C1B5]">
              Period Work: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">+{activePoint.periodPlannedIncrement.toFixed(1)}%</strong> plan /{' '}
              <strong className="text-[#176B53] dark:text-[#72C6AD]">
                {activePoint.periodActualIncrement !== null ? `+${activePoint.periodActualIncrement.toFixed(1)}%` : '—'}
              </strong>{' '}
              actual
            </span>
          </div>
        </div>

        {/* Milestone & Work Items Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {/* Milestone Detail */}
          <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1.5 text-xs">
                <span className="text-[#006B61] dark:text-[#72C6AD]">◆</span> Milestone in this Period:
              </span>
              {activePoint.milestoneDetail && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    activePoint.milestoneDetail.status === 'Completed'
                      ? 'bg-[#E4F1E9] dark:bg-[#16332A] text-[#176B53] dark:text-[#72C6AD]'
                      : activePoint.milestoneDetail.status === 'Critical Slip'
                      ? 'bg-[#F6E4E1] dark:bg-[#3B2422] text-[#A43B36] dark:text-[#FF9E94]'
                      : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5]'
                  }`}
                >
                  {activePoint.milestoneDetail.status}
                </span>
              )}
            </div>
            {activePoint.milestoneDetail ? (
              <div className="text-xs space-y-1">
                <p className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">{activePoint.milestoneDetail.name}</p>
                <div className="flex items-center gap-3 text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                  <span>Baseline: <strong>{activePoint.milestoneDetail.baselineDate}</strong></span>
                  <span>Forecast: <strong>{activePoint.milestoneDetail.forecastDate}</strong></span>
                  <span>Float: <strong className={activePoint.milestoneDetail.floatDays < 0 ? 'text-[#A43B36] dark:text-[#FF9E94]' : 'text-[#176B53] dark:text-[#72C6AD]'}>{activePoint.milestoneDetail.floatDays}d</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#738A80] dark:text-[#859688] italic">No major project milestone scheduled in this cycle.</p>
            )}
          </div>

          {/* Work Package Contribution */}
          <div className="bg-white dark:bg-[#17221D] p-2.5 rounded border border-[#D9E2DA] dark:border-[#3A5146]">
            <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] text-xs block mb-1">
              Contributing WBS Work Packages ({activePoint.workItems?.length || 0}):
            </span>
            {activePoint.workItems && activePoint.workItems.length > 0 ? (
              <ul className="space-y-1 text-xs">
                {activePoint.workItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-[11px] border-b border-gray-100 dark:border-[#3A5146] pb-0.5 last:border-0">
                    <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9] truncate max-w-[200px]" title={item.name}>
                      <span className="font-mono text-[#006B61] dark:text-[#72C6AD] mr-1">{item.id}</span>
                      {item.name}
                    </span>
                    <span className="font-mono text-[#52665D] dark:text-[#B5C1B5] shrink-0 ml-2">
                      {item.actualQty} / {item.plannedQty}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#738A80] dark:text-[#859688] italic">Detailed work package ledger available in WBS matrix.</p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LEVEL 3 AUDIT TRAIL LEDGER */}
      {/* ========================================================= */}
      {showLedger && !isCompact && (
        <div className="p-4 border-t border-[#D9E2DA] dark:border-[#3A5146] bg-white dark:bg-[#17221D]">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase text-[#52665D] dark:text-[#B5C1B5] tracking-wider">
              Level 3 — Cumulative Physical Progress Ledger (Audit Trail)
            </h4>
            <span className="text-[11px] text-[#738A80] dark:text-[#859688]">Source: {baselineRevision} (P6 XML)</span>
          </div>

          <div className="overflow-x-auto rounded border border-[#D9E2DA] dark:border-[#3A5146]">
            <table className="w-full min-w-[720px] text-left text-[13px] border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F6F7F3] dark:bg-[#243832]">
                <tr className="bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border-b border-[#D9E2DA] dark:border-[#3A5146] h-10 text-xs">
                  <th className="py-2.5 px-3 font-semibold">Period</th>
                  <th className="py-2.5 px-3 font-semibold">Cutoff Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Planned Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actual Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Forecast Cum %</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Variance %</th>
                  <th className="py-2.5 px-3 font-semibold">Work Package / Milestone Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146]/60 text-[13px]">
                {displayedData.map((row) => {
                  const varVal = row.actual !== null ? Number((row.actual - row.planned).toFixed(1)) : null;
                  const isCurrentDD = row.isDataDate;
                  return (
                    <tr
                      key={row.period}
                      className={`hover:bg-[#F6F7F3] dark:hover:bg-[#243832] transition-colors ${
                        isCurrentDD ? 'bg-[#EAF0E9] dark:bg-[#243832]/70 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#1A2B25] dark:text-[#F2F4E9]">
                        {row.period}
                        {isCurrentDD && (
                          <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822]">
                            Current
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-[#52665D] dark:text-[#B5C1B5] whitespace-nowrap">{row.dateLabel}</td>
                      <td className="py-2 px-3 font-mono text-right text-[#4263EB] dark:text-[#E5C185] font-semibold">{row.planned.toFixed(1)}%</td>
                      <td className="py-2 px-3 font-mono text-right text-[#176B53] dark:text-[#72C6AD] font-semibold">
                        {row.actual !== null ? `${row.actual.toFixed(1)}%` : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-right text-[#7357A6] dark:text-[#C0A8F0]">
                        {row.forecast.toFixed(1)}%
                      </td>
                      <td
                        className={`py-2 px-3 font-mono text-right font-semibold ${
                          varVal === null
                            ? 'text-[#738A80] dark:text-[#859688]'
                            : varVal < 0
                            ? 'text-[#A43B36] dark:text-[#FF9E94]'
                            : 'text-[#176B53] dark:text-[#72C6AD]'
                        }`}
                      >
                        {varVal !== null ? (varVal > 0 ? `+${varVal}%` : `${varVal}%`) : '—'}
                      </td>
                      <td className="py-2 px-3 text-[#52665D] dark:text-[#B5C1B5]">
                        <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">{row.milestone}</span>
                        {row.notes && <span className="block text-[11px] text-[#738A80] dark:text-[#859688]">{row.notes}</span>}
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
