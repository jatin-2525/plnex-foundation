'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { SCurveChart } from '../../components/shared/SCurveChart';
import { BarChart, HorizontalBarChart, LineChart, StatusDonutChart } from '../../components/shared/charts';
import { Modal } from '../../components/shared/Modal';
import { WhyButton } from '../../components/shared/WhyButton';
import { TermHelp } from '../../components/shared/TermHelp';
import { projectService } from '../../lib/api/projectService';
import { MOCK_EXECUTION_EVENTS } from '../../lib/api/mockData';
import { ExecutionEvent } from '../../types';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../lib/domain/canonicalModels';
import { formatProjectDate, PROJECT_REPORT_DATE } from '../../lib/domain/dateUtils';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  Clock,
  FileCheck,
  Activity,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Layers,
  MapPin,
  BarChart3,
  LineChart as LineChartIcon,
  ShieldAlert,
  GitCommit,
  Check,
  Calendar,
  SlidersHorizontal,
  LayoutGrid,
  Filter,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { effectiveStatus } = useOffline();
  const { addToast } = useToast();

  // Active Tab for Analytics Cockpit: 'discipline' | 'area' | 'variance-trend' | 'delays'
  const [activeChartTab, setActiveChartTab] = useState<'discipline' | 'area' | 'variance-trend' | 'delays'>('discipline');

  // Review Items State
  const [reviewEvents, setReviewEvents] = useState<ExecutionEvent[]>(
    MOCK_EXECUTION_EVENTS.filter((e) => e.status === 'pending-review' || e.status === 'pending-verification')
  );

  // Feature 15: Dashboard Layout Controls (Density & Section Visibility)
  const [dashboardDensity, setDashboardDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [visibleSections, setVisibleSections] = useState({
    kpis: true,
    attention: true,
    scurve: true,
    analytics: false, // Default collapsed to reduce manager overload
    variance: true,
    pendingMatches: true,
    milestones: false, // Default collapsed
  });

  // Feature 18: Saved Table Views Preset for Schedule Variance Table
  const [varianceTableFilter, setVarianceTableFilter] = useState<'all' | 'critical' | 'delayed' | 'completed'>('all');

  // Modal & Drawer Interaction States
  const [selectedReviewModalEvent, setSelectedReviewModalEvent] = useState<ExecutionEvent | null>(null);
  const [selectedEventForRejection, setSelectedEventForRejection] = useState<ExecutionEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const breadcrumbs = [
    { label: 'Project Controls' },
    { label: 'Manager Dashboard', current: true },
  ];

  // Primary Actions Handlers
  const handleApproveEvent = async (event: ExecutionEvent) => {
    await projectService.approveMatch(
      event.id,
      'Approved via Manager Dashboard quick action'
    );
    setReviewEvents((prev) => prev.filter((e) => e.id !== event.id));
    setSelectedReviewModalEvent(null);
    addToast({
      type: 'success',
      title: 'Match Approved & Committed',
      description: `Execution update linked to ${event.matchedActivityId || 'activity'}. Schedule Twin synchronized.`,
    });
  };

  const handleRejectEvent = async () => {
    if (!selectedEventForRejection) return;
    await projectService.rejectMatch(
      selectedEventForRejection.id,
      rejectReason || 'Rejected by Project Manager'
    );
    setReviewEvents((prev) => prev.filter((e) => e.id !== selectedEventForRejection.id));
    setSelectedEventForRejection(null);
    setSelectedReviewModalEvent(null);
    setRejectReason('');
    addToast({
      type: 'warning',
      title: 'Match Rejected',
      description: 'Event marked as rejected and logged to audit ledger.',
    });
  };

  // Schedule Variance Control Table Items (Anchored strictly to Data Date: 18 Sep 2026)
  const scheduleVarianceItems = [
    {
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      plannedFinish: '15 Sep 2026',
      actualFinish: '17 Sep 2026',
      varianceDays: 2,
      status: 'delayed' as const,
      isCriticalPath: true,
    },
    {
      id: 'CIV-11-001',
      name: 'Foundation Block A - Compressor Pedestal',
      plannedFinish: '14 Sep 2026',
      actualFinish: '14 Sep 2026',
      varianceDays: 0,
      status: 'completed' as const,
      isCriticalPath: false,
    },
    {
      id: 'MEC-08-003',
      name: 'Align Centrifugal Gas Compressor Skid A',
      plannedFinish: '22 Sep 2026',
      actualFinish: '22 Sep 2026 (Projected)',
      varianceDays: 0,
      status: 'on-track' as const,
      isCriticalPath: false,
    },
    {
      id: 'ELE-11-032',
      name: 'Cable Tray Installation - Substation to Bay',
      plannedFinish: '23 Sep 2026',
      actualFinish: '24 Sep 2026 (Projected)',
      varianceDays: 1,
      status: 'delayed' as const,
      isCriticalPath: false,
    },
    {
      id: 'PIP-24-002',
      name: 'Weld Line 24-XX Field Joints & NDT Clearance',
      plannedFinish: '20 Sep 2026',
      actualFinish: '20 Sep 2026 (Projected)',
      varianceDays: 0,
      status: 'on-track' as const,
      isCriticalPath: false,
    },
    {
      id: 'PIP-24-003',
      name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      plannedFinish: '22 Sep 2026',
      actualFinish: '26 Sep 2026 (Projected)',
      varianceDays: 4,
      status: 'at-risk' as const,
      isCriticalPath: true,
    },
  ];

  // Feature 18: Filtered Variance Table items according to saved view preset
  const filteredVarianceItems = scheduleVarianceItems.filter((item) => {
    if (varianceTableFilter === 'critical') return item.isCriticalPath;
    if (varianceTableFilter === 'delayed') return item.varianceDays > 0;
    if (varianceTableFilter === 'completed') return item.status === 'completed';
    return true;
  });

  // Specific event for Unmatched Item in Section 2
  const unmatchedEvent = MOCK_EXECUTION_EVENTS.find((e) => e.id === 'EVT-2026-004') || MOCK_EXECUTION_EVENTS[2];

  // Verified Milestones Stream (All completions strictly on or before Data Date: 18 Sep 2026)
  const verifiedMilestones = [
    {
      id: 'EVT-2026-001',
      activityId: 'CIV-11-001',
      title: 'Foundation Block A - Pedestal Pour Complete',
      progress: '100% Completed',
      verifiedDate: '15 Aug 2026',
      auditor: 'Lead Quality Inspector (RITES)',
      status: 'verified' as const,
    },
    {
      id: 'EVT-2026-002',
      activityId: 'PIP-24-001',
      title: 'Line 24-XX Gas Header Spool Rigging',
      progress: '100% Spools Placed',
      verifiedDate: '17 Sep 2026',
      auditor: 'Project Controls Verification',
      status: 'verified' as const,
    },
    {
      id: 'EVT-2026-003',
      activityId: 'ELE-11-032',
      title: 'Substation Overhead Cable Tray Alignment',
      progress: '350m Installed',
      verifiedDate: '16 Sep 2026',
      auditor: 'Resident Electrical Engineer',
      status: 'verified' as const,
    },
    {
      id: 'EVT-2026-005',
      activityId: 'MEC-08-003',
      title: 'Compressor Skid A Laser Alignment',
      progress: 'Tolerance ±0.02mm Cleared',
      verifiedDate: '12 Sep 2026',
      auditor: 'OEM Technical Specialist',
      status: 'verified' as const,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <StateWrapper
        loadingMessage="Loading dashboard overview..."
        emptyTitle="No dashboard metrics found in this view"
        emptyDescription="Operational KPIs, critical path risks, and pending review events will appear here once project data is loaded."
      >
        {/* =========================================================================
            1. PAGE HEADER
            Project context, canonical schedule version, reporting date, connection status
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[11px] font-mono font-bold">
                  PROJECT ID: {activeProject.code}
                </span>
                <span className="text-xs text-[#596579]">
                  Schedule: <strong className="text-[#172033] font-mono">{CANONICAL_SCHEDULE_VERSION_LABEL}</strong>
                </span>
                <span className="text-[#7B8798] hidden sm:inline">•</span>
                <span className="text-xs text-[#596579]">
                  Reporting Date: <strong className="text-[#172033] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                {activeProject.name}
              </h1>
              <p className="text-sm text-[#596579]">
                Executive Project Controls & Schedule Decision Cockpit • <strong>Oil India Limited</strong>
              </p>
            </div>

            {/* Header Action Toolbar & Connection Status */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold ${
                  effectiveStatus === 'OFFLINE'
                    ? 'bg-[#FBEFEE] border-[#E4B0AA] text-[#B5473C]'
                    : 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                }`}
                title={`Application operating mode: ${effectiveStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    effectiveStatus === 'OFFLINE' ? 'bg-[#B5473C]' : 'bg-[#2E7D5B]'
                  }`}
                />
                <span className="font-mono uppercase tracking-wider text-[11px]">
                  {effectiveStatus === 'OFFLINE' ? 'Offline Mode' : 'Online'}
                </span>
              </div>

              {/* Secondary Navigation */}
              <Link
                href="/schedule-twin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors shadow-2xs"
              >
                <GitCommit className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Schedule Twin</span>
              </Link>

              {/* Primary Action */}
              <Link
                href="/review"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] border border-[#176B87] rounded-lg transition-colors shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Review Pending Events ({reviewEvents.length})</span>
              </Link>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FEATURE 15: DASHBOARD LAYOUT & DENSITY CONTROLS
            Allows the Project Manager to customize density and show/hide sections
            ========================================================================= */}
        <div className="bg-white border border-[#D7E1E8] rounded-lg p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#172B3A] flex items-center gap-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#0F6574]" />
              Layout & Density:
            </span>
            <div className="flex rounded border border-[#D7E1E8] p-0.5 bg-[#F4F7FA]">
              <button
                type="button"
                onClick={() => setDashboardDensity('comfortable')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  dashboardDensity === 'comfortable'
                    ? 'bg-white text-[#0F6574] font-bold shadow-2xs'
                    : 'text-[#526779] hover:text-[#172B3A]'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDashboardDensity('compact')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  dashboardDensity === 'compact'
                    ? 'bg-white text-[#0F6574] font-bold shadow-2xs'
                    : 'text-[#526779] hover:text-[#172B3A]'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-[#526779]">Visible Sections:</span>
            {[
              { id: 'kpis', label: 'KPIs' },
              { id: 'attention', label: 'Attention' },
              { id: 'scurve', label: 'S-Curve' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'variance', label: 'Variance' },
              { id: 'pendingMatches', label: 'Matches' },
              { id: 'milestones', label: 'History' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() =>
                  setVisibleSections((prev: any) => ({ ...prev, [sec.id]: !prev[sec.id] }))
                }
                className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                  (visibleSections as any)[sec.id]
                    ? 'bg-[#EDF5F8] text-[#0F6574] border-[#B3CBE0] font-semibold'
                    : 'bg-white text-[#7B8798] border-[#D7E1E8]'
                }`}
              >
                {(visibleSections as any)[sec.id] ? `✓ ${sec.label}` : sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            2. PROJECT PERFORMANCE KPIS (5 Visual KPI Cards with Icons & Trends)
            ========================================================================= */}
        {visibleSections.kpis && (
          <section aria-labelledby="kpi-heading" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 id="kpi-heading" className="text-xs font-semibold uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-[#0F6574]" />
                Executive Performance Indicators
              </h2>
              <span className="text-[11px] text-[#7B8798] font-mono hidden sm:inline">
                P6 XML Target vs Field Actuals
              </span>
            </div>

            <div className="border border-[#D7E1E8] rounded-lg shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#D7E1E8]">
              {/* 1. Schedule Health */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#596579] flex items-center gap-1">
                    Schedule Health
                    <TermHelp term="spi" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('health:PRJ-OIL-2026-01')}
                      title="Why is schedule health 82%?"
                    />
                    <div className="p-1 rounded bg-[#FDF6ED] text-[#D98B32]">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#D98B32] leading-none">
                      82%
                    </span>
                    <span className="text-xs font-semibold text-[#D98B32] flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Warning
                    </span>
                  </div>
                  <p className="text-[11px] text-[#596579] mt-1">
                    Needs Attention — 5 Warnings
                  </p>
                </div>
                <Link href="/health" className="text-[11px] text-[#0F6574] group-hover:underline font-semibold flex items-center gap-1">
                  Inspect Health &rarr;
                </Link>
              </div>

              {/* 2. Verified Progress */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#596579] flex items-center gap-1">
                    Verified Progress
                    <TermHelp term="cpi" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('progress:verified')}
                      title="Why is verified progress 68.4%?"
                    />
                    <div className="p-1 rounded bg-[#EDF5F8] text-[#0F6574]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#187A6A] leading-none">
                      {activeProject.overallProgress}%
                    </span>
                    <span className="text-xs text-[#596579]">Actual</span>
                  </div>
                  <p className="text-[11px] text-[#596579] mt-1">
                    Baseline Target: <strong>{activeProject.plannedProgress}%</strong>
                  </p>
                </div>
                <Link href="/progress" className="text-[11px] text-[#0F6574] group-hover:underline font-semibold flex items-center gap-1">
                  Progress Matrix &rarr;
                </Link>
              </div>

              {/* 3. Activities At Risk */}
              <Link
                href="/risks?filter=critical"
                className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#596579] flex items-center gap-1">
                    Activities At Risk
                    <TermHelp term="critical_path" />
                  </span>
                  <div className="p-1 rounded bg-[#FBEFEE] text-[#B43D47]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B43D47] leading-none">
                      3
                    </span>
                    <span className="text-xs font-bold text-[#B43D47]">Alert</span>
                  </div>
                  <p className="text-[11px] text-[#596579] mt-1">
                    1 Critical Path • 2 Near-Critical
                  </p>
                </div>
                <span className="text-[11px] text-[#0F6574] group-hover:underline font-semibold flex items-center gap-1">
                  CPM Risk Network &rarr;
                </span>
              </Link>

              {/* 4. Pending Review */}
              <Link
                href="/review"
                className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                    Pending Review
                  </span>
                  <div className="p-1 rounded bg-[#FDF6ED] text-[#D98B32]">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#D98B32] leading-none">
                      {reviewEvents.length}
                    </span>
                    <span className="text-xs font-bold text-[#D98B32]">Events</span>
                  </div>
                  <p className="text-[11px] text-[#596579] mt-1">
                    Awaiting Planner Sign-off
                  </p>
                </div>
                <span className="text-[11px] text-[#0F6574] group-hover:underline font-semibold flex items-center gap-1">
                  Review Center &rarr;
                </span>
              </Link>

              {/* 5. Schedule Variance */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-[#FFFDFD] hover:bg-[#FFF8F8] transition-colors flex flex-col justify-between sm:col-span-2 lg:col-span-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#B43D47] flex items-center gap-1">
                    Schedule Variance
                    <TermHelp term="variance" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('variance:portfolio')}
                      title="Why is variance -7%?"
                    />
                    <div className="p-1 rounded bg-[#FBEFEE] text-[#B43D47]">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B43D47] leading-none">
                      {activeProject.variance}%
                    </span>
                    <span className="text-xs font-bold text-[#B43D47]">Slip</span>
                  </div>
                  <p className="text-[11px] text-[#B43D47] font-semibold mt-1">
                    +2 Days Behind Baseline Finish
                  </p>
                </div>
                <a href="#variance-table" className="text-[11px] text-[#0F6574] hover:underline font-semibold flex items-center gap-1">
                  Inspect Variance Table &rarr;
                </a>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            3. WHAT NEEDS MY ATTENTION (Feature 16: Prioritized Attention Action Grid)
            Prioritized #1 URGENT, #2 HIGH, #3 HIGH, #4 MEDIUM with single 1-click actions
            ========================================================================= */}
        {visibleSections.attention && (
          <section aria-labelledby="attention-heading" className="bg-[#FFFDF7] border-2 border-[#D98B32] border-l-4 border-l-[#B43D47] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0D4A6] gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA]">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="attention-heading" className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight">
                      What Needs My Attention
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA] text-[10px] font-mono font-bold uppercase">
                      PRIORITIZED DECISION BACKLOG
                    </span>
                  </div>
                  <p className="text-xs text-[#526779]">
                    Strictly ordered by project criticality — 1 clear action per item
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#B43D47] text-white text-xs font-mono font-bold flex items-center gap-1 shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  4 Action Items
                </span>
                <Link
                  href="/review"
                  className="px-3 py-1.5 bg-[#0F6574] hover:bg-[#0c505c] text-white text-xs font-bold rounded shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Full Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* High-Signal Action Cards (Feature 16: Prioritized order with single clear action) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: #1 URGENT - Critical Path Header Erection Slip */}
              <div className="p-4 rounded-lg bg-white border border-[#E8B6BA] hover:border-[#B43D47] transition-all shadow-2xs flex flex-col justify-between space-y-3 border-l-4 border-l-[#B43D47]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA] flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-[#B43D47]" />
                      #1 URGENT
                    </span>
                    <span className="text-xs font-mono font-bold text-[#B43D47] bg-[#FBEFEE] px-1.5 rounded border border-[#E8B6BA]">+2d Slip</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B3A] leading-snug">
                    PIP-24-001: Header Erection
                  </h3>
                  <p className="text-xs text-[#526779] leading-relaxed">
                    <strong>Reason:</strong> Zero-float critical activity slipped 2 days. Pushes downstream hydrostatic testing and threatens 15 Dec COD.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA]">
                      COD Slip Risk: +2 Days
                    </span>
                  </div>
                </div>
                <Link
                  href="/what-if?activity=PIP-24-001"
                  className="w-full py-2 px-3 bg-[#B43D47] hover:bg-[#922E37] text-white text-xs font-bold rounded text-center transition-colors block mt-2 shadow-xs"
                >
                  Inspect Delay Chain &rarr;
                </Link>
              </div>

              {/* Card 2: #2 HIGH - Field Matches Awaiting Sign-off */}
              <div className="p-4 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#9C5A08] transition-all shadow-2xs flex flex-col justify-between space-y-3 border-l-4 border-l-[#9C5A08]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FFF8E6] text-[#9C5A08] border border-[#F0D4A6] flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#9C5A08]" />
                      #2 HIGH
                    </span>
                    <span className="text-xs font-mono font-bold text-[#9C5A08]">{reviewEvents.length} Pending</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B3A] leading-snug">
                    Field Matches Awaiting Sign-off
                  </h3>
                  <p className="text-xs text-[#526779] leading-relaxed">
                    <strong>Reason:</strong> 3 field updates in 70%–89% confidence band pause live Schedule Twin synchronization until committed.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FFF8E6] text-[#9C5A08] border border-[#F0D4A6]">
                      Schedule Twin Sync Paused
                    </span>
                  </div>
                </div>
                <Link
                  href="/review"
                  className="w-full py-2 px-3 bg-[#0F6574] hover:bg-[#0c505c] text-white text-xs font-bold rounded text-center transition-colors block mt-2 shadow-xs"
                >
                  Review Matches ({reviewEvents.length}) &rarr;
                </Link>
              </div>

              {/* Card 3: #3 HIGH - Unmatched Field Spool */}
              <div className="p-4 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#9C5A08] transition-all shadow-2xs flex flex-col justify-between space-y-3 border-l-4 border-l-[#9C5A08]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FFF8E6] text-[#9C5A08] border border-[#F0D4A6] flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#9C5A08]" />
                      #3 HIGH
                    </span>
                    <span className="text-xs font-mono font-bold text-[#B43D47] bg-[#FBEFEE] px-1.5 rounded">47% Score</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B3A] leading-snug">
                    EVT-2026-004: Unit B Drain Line
                  </h3>
                  <p className="text-xs text-[#526779] leading-relaxed">
                    <strong>Reason:</strong> Unlinked spool code submitted. Requires manager target assignment to credit physical earned progress.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA]">
                      Progress Uncredited (1.0 spool)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReviewModalEvent(unmatchedEvent)}
                  className="w-full py-2 px-3 bg-white hover:bg-[#EDF5F8] text-[#0F6574] border border-[#0F6574] text-xs font-bold rounded text-center transition-colors block cursor-pointer mt-2"
                >
                  Assign Target Activity &rarr;
                </button>
              </div>

              {/* Card 4: #4 MEDIUM - Downstream Ripple / Simulation */}
              <div className="p-4 rounded-lg bg-white border border-[#D7E1E8] hover:border-[#0F6574] transition-all shadow-2xs flex flex-col justify-between space-y-3 border-l-4 border-l-[#3D73B5]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#EDF5F8] text-[#0F6574] border border-[#B3CBE0] flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5 text-[#0F6574]" />
                      #4 MEDIUM
                    </span>
                    <span className="text-xs font-mono font-bold text-[#3D73B5] bg-[#EDF5F8] px-1.5 rounded">3 Downstream</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#172B3A] leading-snug">
                    Downstream Cascade Simulation
                  </h3>
                  <p className="text-xs text-[#526779] leading-relaxed">
                    <strong>Reason:</strong> Foundation slip absorbs total float on MEC-08-003. Evaluates schedule compression options.
                  </p>
                  <div className="pt-1">
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-[#EDF5F8] text-[#0F6574] border border-[#B3CBE0]">
                      Float Buffer: 0 Days Left
                    </span>
                  </div>
                </div>
                <Link
                  href="/what-if"
                  className="w-full py-2 px-3 bg-white hover:bg-[#F4F7FA] text-[#172B3A] border border-[#D7E1E8] text-xs font-bold rounded text-center transition-colors block mt-2"
                >
                  Run What-If Simulation &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            4. UNIFIED S-CURVE PERFORMANCE TRAJECTORY (All 14 Controls Integrated)
            Single concise summary integrated with the trajectory chart
            ========================================================================= */}
        {visibleSections.scurve && (
          <section aria-labelledby="scurve-heading" className="space-y-2">
            <SCurveChart
              variant="full"
              title="Project S-Curve — Baseline vs. Actual Earned vs. Forecast"
              subtitle="Rev 3.2 (P6 XML) Physical Earned Progress (Data Date: 18 Sep 2026)"
            />
          </section>
        )}

        {/* =========================================================================
            5. SUPPORTING ANALYTICAL CHARTS SUITE (Secondary Analysis)
            ========================================================================= */}
        {visibleSections.analytics && (
          <details className="group bg-white border border-[#D7E1E8] rounded-lg shadow-xs overflow-hidden" open>
            <summary className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer list-none hover:bg-[#F9FAFC] transition-colors gap-3 select-none">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-medium uppercase text-[#526779] tracking-wider">
                  Supporting Schedule Analytics
                </span>
                <div className="flex items-center gap-2">
                  <h2 id="analytics-heading" className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight">
                    Dimensional Analysis & Deep-Dive Charts
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#EDF5F8] text-[#0F6574] font-semibold hidden sm:inline">
                    Discipline • Site Area • Trend • Delays
                  </span>
                </div>
                <p className="text-xs text-[#526779]">
                  Multi-perspective breakdowns across engineering disciplines, site zones, and variance trajectories.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0F6574] self-start sm:self-center">
                <span className="group-open:hidden">Expand Analysis &darr;</span>
                <span className="hidden group-open:inline">Collapse Analysis &uarr;</span>
              </div>
            </summary>

            <div className="p-4 sm:p-6 border-t border-[#D7E1E8] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D7E1E8] gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#172B3A]">
                    Interactive Performance Dimensions
                  </h3>
                  <p className="text-xs text-[#526779]">
                    Switch visual perspectives to evaluate project delivery by engineering discipline, site zone, or variance trajectory.
                  </p>
                </div>

                {/* Perspective Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] border border-[#D7E1E8] rounded-lg self-start sm:self-center overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('discipline')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeChartTab === 'discipline'
                        ? 'bg-white text-[#0F6574] shadow-2xs border border-[#D7E1E8]'
                        : 'text-[#526779] hover:text-[#172B3A]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>By Discipline</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab('area')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeChartTab === 'area'
                        ? 'bg-white text-[#0F6574] shadow-2xs border border-[#D7E1E8]'
                        : 'text-[#526779] hover:text-[#172B3A]'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>By Site Area</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab('variance-trend')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeChartTab === 'variance-trend'
                        ? 'bg-white text-[#0F6574] shadow-2xs border border-[#D7E1E8]'
                        : 'text-[#526779] hover:text-[#172B3A]'
                    }`}
                  >
                    <LineChartIcon className="w-3.5 h-3.5" />
                    <span>Variance Trend</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChartTab('delays')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeChartTab === 'delays'
                        ? 'bg-white text-[#0F6574] shadow-2xs border border-[#D7E1E8]'
                        : 'text-[#526779] hover:text-[#172B3A]'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Critical Delays</span>
                  </button>
                </div>
              </div>

              {/* Active Chart Rendering */}
              <div className="pt-2">
                {activeChartTab === 'discipline' && (
                  <BarChart
                    variant="discipline"
                    title="Discipline Performance — Actual vs Baseline"
                    subtitle="Earned progress comparison across major engineering disciplines against P6 targets"
                    className="border-0 p-0 shadow-none"
                  />
                )}

                {activeChartTab === 'area' && (
                  <BarChart
                    variant="area"
                    title="Work Package Progress by Site Area"
                    subtitle="WBS physical progress across Unit A Gas Processing, Compressor House, and Offsites"
                    className="border-0 p-0 shadow-none"
                  />
                )}

                {activeChartTab === 'variance-trend' && (
                  <LineChart
                    variant="variance-trend"
                    title="Cumulative Schedule Variance Trend"
                    subtitle="Historical trajectory of monthly schedule slip (+ahead / -slip) and projected recovery"
                    className="border-0 p-0 shadow-none"
                  />
                )}

                {activeChartTab === 'delays' && (
                  <HorizontalBarChart
                    variant="delayed-activities"
                    title="Top Delayed Critical Activities"
                    subtitle="Slip duration and critical path impact ranking across active work packages"
                    className="border-0 p-0 shadow-none"
                  />
                )}
              </div>
            </div>
          </details>
        )}

        {/* ========================================================= */}
        {/* 6. SCHEDULE VARIANCE CONTROL TABLE (Feature 18: Saved Views) */}
        {/* Compact, crisp activity-level tracking with highlighted CPM rows */}
        {/* ========================================================= */}
        {visibleSections.variance && (
          <section id="variance-table" aria-labelledby="variance-table-heading" className="bg-white border border-[#D7E1E8] border-l-4 border-l-[#0F6574] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D7E1E8] gap-2">
              <div>
                <span className="text-[11px] font-mono font-medium uppercase text-[#526779] tracking-wider">
                  Critical Path Activity Tracking
                </span>
                <div className="flex items-center gap-2">
                  <h2 id="variance-table-heading" className="text-base sm:text-lg font-bold text-[#172B3A] tracking-tight">
                    Schedule Variance Control Table
                  </h2>
                  <TermHelp term="variance" />
                </div>
                <p className="text-xs text-[#526779] mt-0.5">
                  Activity-level audit comparing planned finish to actual completion and slip variance.
                </p>
              </div>

              {/* Feature 18: Saved Table Views & Preset Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#F4F7FA] border border-[#D7E1E8] rounded p-0.5 text-xs">
                  <span className="text-[11px] font-medium text-[#526779] px-1.5 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#526779]" /> Filter:
                  </span>
                  {[
                    { id: 'all', label: 'All (6)' },
                    { id: 'critical', label: 'Critical Path (3)' },
                    { id: 'delayed', label: 'Delayed Slips (3)' },
                    { id: 'completed', label: 'Completed (1)' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setVarianceTableFilter(preset.id as any)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        varianceTableFilter === preset.id
                          ? 'bg-[#0F6574] text-white font-bold shadow-2xs'
                          : 'text-[#526779] hover:text-[#172B3A]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Link
                  href="/variance"
                  className="text-xs text-[#0F6574] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  Full Ledger <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#D7E1E8] rounded-lg">
              <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                <thead className="bg-[#F4F7FA] border-b border-[#D7E1E8] text-[#526779] uppercase font-semibold text-[11px] tracking-wider h-10">
                  <tr>
                    <th className="py-2.5 px-3">Activity</th>
                    <th className="py-2.5 px-3">Planned Finish</th>
                    <th className="py-2.5 px-3">Actual Finish</th>
                    <th className="py-2.5 px-3 flex items-center gap-1">
                      Variance
                      <TermHelp term="float" />
                    </th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7E1E8]/60 text-[#172B3A]">
                  {filteredVarianceItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`h-10 hover:bg-[#F9FAFC] transition-colors ${
                        item.isCriticalPath && item.varianceDays > 0 ? 'bg-[#FFF9F8]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F6574]">{item.id}</span>
                          <span className="text-[#172B3A] truncate max-w-xs">{item.name}</span>
                          {item.isCriticalPath && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA]">
                              CPM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#526779]">{item.plannedFinish}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#172B3A]">{item.actualFinish}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${item.varianceDays > 0 ? 'bg-[#FBEFEE] text-[#B43D47] border border-[#E8B6BA]' : 'text-[#187A6A]'}`}>
                          {item.varianceDays === 0 ? '0d' : `+${item.varianceDays}d`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={item.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openActivityDrawer(item.id)}
                          className="px-2.5 py-1 text-xs text-[#0F6574] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded font-medium transition-colors cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =========================================================================
            7. DECISIONS & VERIFIED MILESTONES (Streamlined Executive Ledger)
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Pending Match Approvals */}
          {visibleSections.pendingMatches && (
            <section aria-labelledby="pending-approvals-heading" className="bg-white border border-[#D7E1E8] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#D7E1E8]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F6574]" />
                  <h2 id="pending-approvals-heading" className="text-sm sm:text-base font-bold text-[#172B3A]">
                    Pending Schedule Links
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF8E6] text-[#9C5A08] border border-[#F0D4A6] text-[10px] font-mono font-bold">
                    {reviewEvents.length} Actions
                  </span>
                </div>
                <Link href="/review" className="text-xs text-[#0F6574] hover:underline font-semibold">
                  Open Review Center &rarr;
                </Link>
              </div>

              {reviewEvents.length === 0 ? (
                <div className="p-6 text-center bg-[#F4F7FA] border border-[#D7E1E8] rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-[#187A6A] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#172B3A]">No pending review items</p>
                  <p className="text-[11px] text-[#526779] mt-0.5">
                    All field updates are linked and verified with the baseline.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#D7E1E8]">
                  {reviewEvents.slice(0, 3).map((evt) => (
                    <div key={evt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0F6574] text-[11px]">{evt.id}</span>
                          <ConfidenceBadge score={evt.confidence} size="sm" />
                        </div>
                        <p className="text-xs text-[#172B3A] font-medium truncate max-w-sm">
                          {evt.rawText}
                        </p>
                        <div className="text-[10px] text-[#526779] flex items-center gap-1">
                          <span>Target:</span>
                          <strong className="text-[#172B3A] font-mono">{evt.matchedActivityId || 'Unassigned'}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReviewModalEvent(evt)}
                        className="px-2.5 py-1 text-xs bg-white hover:bg-[#EDF5F8] text-[#0F6574] border border-[#B3CBE0] rounded font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Column 2: Verified Milestones Sync History (Collapsible Historical Stream) */}
          {visibleSections.milestones && (
            <details className="group bg-white border border-[#D7E1E8] rounded-lg p-4 sm:p-5 shadow-xs" open>
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#187A6A]" />
                  <h2 id="milestones-heading" className="text-sm sm:text-base font-bold text-[#172B3A]">
                    Verified Progress History ({verifiedMilestones.length})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#0F6574] font-semibold group-open:hidden">View History &darr;</span>
                  <span className="text-xs text-[#0F6574] font-semibold hidden group-open:inline">Hide History &uarr;</span>
                </div>
              </summary>

              <div className="pt-3 mt-3 border-t border-[#D7E1E8] divide-y divide-[#D7E1E8]">
                {verifiedMilestones.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#187A6A] text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#187A6A]" />
                          {m.activityId}
                        </span>
                        <span className="text-[10px] text-[#526779] font-mono">{m.verifiedDate}</span>
                      </div>
                      <p className="text-xs text-[#172B3A] font-medium">{m.title}</p>
                      <p className="text-[11px] text-[#526779]">{m.progress} • Certified by {m.auditor}</p>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </StateWrapper>

      {/* =========================================================================
          REVIEW MODAL (Triggered by "Review" or Attention Decision Card)
          ========================================================================= */}
      {selectedReviewModalEvent && (
        <Modal
          isOpen={!!selectedReviewModalEvent}
          onClose={() => setSelectedReviewModalEvent(null)}
          title={`Review Match: ${selectedReviewModalEvent.id}`}
          subtitle="Validate suggested match hypothesis before committing progress to authoritative schedule twin."
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => {
                  setSelectedEventForRejection(selectedReviewModalEvent);
                }}
                className="px-3 py-1.5 text-xs text-[#B5473C] hover:bg-[#FBEFEE] rounded border border-[#E4B0AA] font-semibold transition-colors cursor-pointer"
              >
                Reject Match
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReviewModalEvent(null)}
                  className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveEvent(selectedReviewModalEvent)}
                  className="px-4 py-1.5 text-xs bg-[#176B87] hover:bg-[#135A72] text-white rounded font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Approve & Commit Match
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Field Statement */}
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-[#596579] uppercase block">
                Raw Field Statement
              </span>
              <p className="text-xs font-semibold text-[#172033] mt-1 leading-relaxed">
                &ldquo;{selectedReviewModalEvent.rawText}&rdquo;
              </p>
              <div className="mt-2 text-[10px] font-mono text-[#596579]">
                Source: {selectedReviewModalEvent.source} • Date: {selectedReviewModalEvent.eventDate} • Creator: {selectedReviewModalEvent.createdBy}
              </div>
            </div>

            {/* Candidate Target */}
            <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
              <span className="text-[10px] font-mono font-semibold text-[#596579] uppercase block">
                Target Schedule Activity
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[#176B87]">
                    {selectedReviewModalEvent.matchedActivityId || 'NO TARGET ASSIGNED'}
                  </span>
                  <p className="text-xs font-semibold text-[#172033] mt-0.5">
                    {selectedReviewModalEvent.matchedActivityName || 'Awaiting planner manual assignment'}
                  </p>
                </div>
                <ConfidenceBadge score={selectedReviewModalEvent.confidence} size="md" />
              </div>

              {selectedReviewModalEvent.matchedReasons && selectedReviewModalEvent.matchedReasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#D9DEE5] space-y-1">
                  <span className="text-[10px] font-semibold text-[#596579]">Match Justification:</span>
                  <ul className="list-disc list-inside text-[11px] text-[#596579] space-y-0.5">
                    {selectedReviewModalEvent.matchedReasons.map((r, rIdx) => (
                      <li key={rIdx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Evidence Link */}
            {selectedReviewModalEvent.evidenceIds.length > 0 && (
              <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded-md text-xs text-[#2E7D5B] flex items-center justify-between">
                <span className="font-medium">Attached Audit Evidence: {selectedReviewModalEvent.evidenceIds.join(', ')}</span>
                <Link href="/evidence" className="underline font-bold text-[11px]">
                  View Evidence &rarr;
                </Link>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirmation Dialog: Reject Match */}
      {selectedEventForRejection && (
        <Modal
          isOpen={!!selectedEventForRejection}
          onClose={() => setSelectedEventForRejection(null)}
          title="Reject Schedule Link"
          subtitle={`Event ${selectedEventForRejection.id}`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setSelectedEventForRejection(null)}
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectEvent}
                className="px-4 py-1.5 text-xs bg-[#B5473C] hover:bg-[#973930] text-white rounded font-medium shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#596579]">
              Provide a justification for rejecting this match. It will be recorded into the append-only audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Activity does not belong to active package scope..."
              rows={3}
              className="w-full p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded outline-none focus:border-[#176B87]"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
