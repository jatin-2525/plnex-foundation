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

  // Schedule Variance Control Table Items
  const scheduleVarianceItems = [
    {
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      plannedFinish: '30 Sep 2026',
      actualFinish: '02 Oct 2026',
      varianceDays: 2,
      status: 'delayed' as const,
      isCriticalPath: true,
    },
    {
      id: 'PIP-24-002',
      name: 'Weld Line 24-XX Field Joints & NDT Clearance',
      plannedFinish: '15 Oct 2026',
      actualFinish: '15 Oct 2026',
      varianceDays: 0,
      status: 'on-track' as const,
      isCriticalPath: false,
    },
    {
      id: 'PIP-24-003',
      name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      plannedFinish: '25 Oct 2026',
      actualFinish: '29 Oct 2026',
      varianceDays: 4,
      status: 'at-risk' as const,
      isCriticalPath: true,
    },
    {
      id: 'ELE-11-032',
      name: 'Cable Tray Installation - Substation to Bay',
      plannedFinish: '15 Oct 2026',
      actualFinish: '16 Oct 2026',
      varianceDays: 1,
      status: 'delayed' as const,
      isCriticalPath: false,
    },
    {
      id: 'CIV-11-001',
      name: 'Foundation Block A - Compressor Pedestal',
      plannedFinish: '15 Aug 2026',
      actualFinish: '15 Aug 2026',
      varianceDays: 0,
      status: 'completed' as const,
      isCriticalPath: false,
    },
    {
      id: 'MEC-08-003',
      name: 'Align Centrifugal Gas Compressor Skid A',
      plannedFinish: '22 Sep 2026',
      actualFinish: '22 Sep 2026',
      varianceDays: 0,
      status: 'on-track' as const,
      isCriticalPath: false,
    },
  ];

  // Specific event for Unmatched Item in Section 2
  const unmatchedEvent = MOCK_EXECUTION_EVENTS.find((e) => e.id === 'EVT-2026-004') || MOCK_EXECUTION_EVENTS[2];

  // Verified Milestones Stream (Replaces raw worker logs with executive milestone syncs)
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
      verifiedDate: '02 Oct 2026',
      auditor: 'Project Controls Verification',
      status: 'verified' as const,
    },
    {
      id: 'EVT-2026-003',
      activityId: 'ELE-11-032',
      title: 'Substation Overhead Cable Tray Alignment',
      progress: '350m Installed',
      verifiedDate: '01 Oct 2026',
      auditor: 'Resident Electrical Engineer',
      status: 'verified' as const,
    },
    {
      id: 'EVT-2026-005',
      activityId: 'MEC-08-003',
      title: 'Compressor Skid A Laser Alignment',
      progress: 'Tolerance ±0.02mm Cleared',
      verifiedDate: '22 Sep 2026',
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
                href="/schedule"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors shadow-2xs"
              >
                <GitCommit className="w-3.5 h-3.5 text-[#596579]" />
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
            2. PROJECT PERFORMANCE KPIS (5 Visual KPI Cards with Icons & Trends)
            ========================================================================= */}
        <section aria-labelledby="kpi-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="kpi-heading" className="text-xs font-semibold uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#176B87]" />
              Executive Performance Indicators
            </h2>
            <span className="text-[11px] text-[#7B8798] font-mono hidden sm:inline">
              P6 XML Target vs Field Actuals
            </span>
          </div>

          <div className="border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#D9DEE5]">
            {/* 1. Schedule Health */}
            <div className="p-4 lg:p-5 bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Schedule Health
                </span>
                <div className="flex items-center gap-1.5">
                  <WhyButton
                    onClick={() => openWhyExplanation('health:PRJ-OIL-2026-01')}
                    title="Why is schedule health 94%?"
                  />
                  <div className="p-1 rounded bg-[#EDF7F2] text-[#2E7D5B]">
                    <Activity className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#2E7D5B] leading-none">
                    94%
                  </span>
                  <span className="text-xs font-semibold text-[#2E7D5B] flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> Good
                  </span>
                </div>
                <p className="text-[11px] text-[#596579] mt-1">
                  DCMA 14-Point Check Passed
                </p>
              </div>
              <Link href="/health" className="text-[11px] text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Inspect Health &rarr;
              </Link>
            </div>

            {/* 2. Verified Progress */}
            <div className="p-4 lg:p-5 bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Verified Progress
                </span>
                <div className="flex items-center gap-1.5">
                  <WhyButton
                    onClick={() => openWhyExplanation('progress:verified')}
                    title="Why is verified progress 68.4%?"
                  />
                  <div className="p-1 rounded bg-[#EDF2F8] text-[#176B87]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#176B87] leading-none">
                    {activeProject.overallProgress}%
                  </span>
                  <span className="text-xs text-[#596579]">Actual</span>
                </div>
                <p className="text-[11px] text-[#596579] mt-1">
                  Baseline Target: <strong>{activeProject.plannedProgress}%</strong>
                </p>
              </div>
              <Link href="/progress" className="text-[11px] text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Progress Matrix &rarr;
              </Link>
            </div>

            {/* 3. Activities At Risk */}
            <Link
              href="/risks"
              className="p-4 lg:p-5 bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Activities At Risk
                </span>
                <div className="p-1 rounded bg-[#FBEFEE] text-[#B5473C]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                    3
                  </span>
                  <span className="text-xs font-bold text-[#B5473C]">Alert</span>
                </div>
                <p className="text-[11px] text-[#596579] mt-1">
                  1 Critical Path • 2 Near-Critical
                </p>
              </div>
              <span className="text-[11px] text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                CPM Risk Network &rarr;
              </span>
            </Link>

            {/* 4. Pending Review */}
            <Link
              href="/review"
              className="p-4 lg:p-5 bg-white hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group"
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
              <span className="text-[11px] text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Review Center &rarr;
              </span>
            </Link>

            {/* 5. Schedule Variance */}
            <div className="p-4 lg:p-5 bg-[#FFFDFD] hover:bg-[#FFF8F8] transition-colors flex flex-col justify-between sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B5473C]">
                  Schedule Variance
                </span>
                <div className="flex items-center gap-1.5">
                  <WhyButton
                    onClick={() => openWhyExplanation('variance:portfolio')}
                    title="Why is variance -7%?"
                  />
                  <div className="p-1 rounded bg-[#FBEFEE] text-[#B5473C]">
                    <TrendingDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                    {activeProject.variance}%
                  </span>
                  <span className="text-xs font-bold text-[#B5473C]">Slip</span>
                </div>
                <p className="text-[11px] text-[#B5473C] font-semibold mt-1">
                  +2 Days Behind Baseline Finish
                </p>
              </div>
              <a href="#variance-table" className="text-[11px] text-[#176B87] hover:underline font-semibold flex items-center gap-1">
                Inspect Variance Table &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. WHAT NEEDS MY ATTENTION (Streamlined Executive Priority Grid + Donut Chart)
            Replaces verbose contractor essay paragraphs with clear, high-signal action cards
            ========================================================================= */}
        <section aria-labelledby="attention-heading" className="bg-[#FFFDF7] border-2 border-[#D98B32] border-l-4 border-l-[#B5473C] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0D4A6] gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="attention-heading" className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                    What Needs My Attention
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] text-[10px] font-mono font-bold uppercase">
                    URGENT INTERVENTION
                  </span>
                </div>
                <p className="text-xs text-[#596579]">
                  Prioritized decision backlog requiring project manager intervention
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#B5473C] text-white text-xs font-mono font-bold flex items-center gap-1 shadow-2xs">
                <ShieldAlert className="w-3.5 h-3.5" />
                4 Action Items
              </span>
              <Link
                href="/review"
                className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <span>Full Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* 2-Column Executive Layout: Donut Chart on Left, Clean Decision Cards on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Status Donut Chart */}
            <div className="lg:col-span-5 bg-white border border-[#F0D4A6] rounded-lg p-4 shadow-2xs">
              <StatusDonutChart />
            </div>

            {/* High-Signal Action Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card 1: Review Validation */}
              <div className="p-3.5 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#D98B32] transition-all shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-[#D98B32]" />
                      Match Validation
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#D98B32]">{reviewEvents.length} Pending</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033] leading-snug">
                    Field Matches Awaiting Sign-off
                  </h3>
                  <p className="text-[11px] text-[#596579] leading-normal">
                    Events in the 70%–89% confidence band pause live Schedule Twin synchronization until approved.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                      Schedule Twin Sync Paused
                    </span>
                  </div>
                </div>
                <Link
                  href="/review"
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-xs font-bold rounded text-center transition-colors block mt-2"
                >
                  Review Matches ({reviewEvents.length}) &rarr;
                </Link>
              </div>

              {/* Card 2: Critical Path Slip */}
              <div className="p-3.5 rounded-lg bg-white border border-[#E4B0AA] hover:border-[#B5473C] transition-all shadow-2xs flex flex-col justify-between space-y-2.5 border-l-4 border-l-[#B5473C]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] flex items-center gap-1">
                      <AlertOctagon className="w-3 h-3 text-[#B5473C]" />
                      Critical Slip
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#B5473C] bg-[#FBEFEE] px-1 rounded border border-[#E4B0AA]">+2d Slip</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033] leading-snug">
                    PIP-24-001: Header Erection
                  </h3>
                  <p className="text-[11px] text-[#596579] leading-normal">
                    Zero-float activity slipped 2 days. Pushes hydrostatic testing milestone day-for-day.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                      Milestone Impact: +2 Days
                    </span>
                  </div>
                </div>
                <a
                  href="#variance-table"
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] text-xs font-bold rounded text-center transition-colors block mt-2"
                >
                  Inspect Delay Impact &rarr;
                </a>
              </div>

              {/* Card 3: Unmatched Field Spool */}
              <div className="p-3.5 rounded-lg bg-white border border-[#E4B0AA] hover:border-[#B5473C] transition-all shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-[#B5473C]" />
                      Unmatched Event
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#B5473C] bg-[#FBEFEE] px-1 rounded">47% Score</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033] leading-snug">
                    EVT-2026-004: Unit B Drain Line
                  </h3>
                  <p className="text-[11px] text-[#596579] leading-normal">
                    Unlinked spool code syntax submitted. Requires planner target assignment to credit progress.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                      Progress Uncredited (1.0 spool)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReviewModalEvent(unmatchedEvent)}
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-xs font-bold rounded text-center transition-colors block cursor-pointer mt-2"
                >
                  Assign Activity Target &rarr;
                </button>
              </div>

              {/* Card 4: Downstream Ripple / Simulation */}
              <div className="p-3.5 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#D98B32] transition-all shadow-2xs flex flex-col justify-between space-y-2.5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3 text-[#D98B32]" />
                      Ripple Impact
                    </span>
                    <span className="text-[11px] font-mono font-bold text-[#D98B32] bg-[#FDF6ED] px-1 rounded">3 Downstream</span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#172033] leading-snug">
                    Critical Ripple: Hydro-test & Loops
                  </h3>
                  <p className="text-[11px] text-[#596579] leading-normal">
                    Successor activities PIP-24-002 and INS-04-015 impacted. Commercial milestone shifts from 30 Nov to 02 Dec.
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                      Target Shift: 30 Nov &rarr; 02 Dec
                    </span>
                  </div>
                </div>
                <Link
                  href="/what-if"
                  className="w-full py-1.5 px-3 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-xs font-bold rounded text-center transition-colors block mt-2"
                >
                  Run What-If Simulation &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. MANDATORY STATIC S-CURVE (Executive Physical Earned Trajectory)
            ========================================================================= */}
        <section aria-labelledby="scurve-heading" className="bg-white border border-[#D9DEE5] border-l-4 border-l-[#176B87] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Earned Value & Cumulative Trajectory
              </span>
              <h2 id="scurve-heading" className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                Project S-Curve — Baseline vs. Actual Earned vs. Forecast
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Physical earned progress curve across all WBS work packages compared to P6 baseline envelope.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#596579]">
                Data Date: <strong className="font-mono text-[#172033]">18 Sep 2026</strong>
              </span>
              <Link
                href="/variance"
                className="px-3 py-1.5 bg-[#F1F3F5] hover:bg-[#E5E8EB] text-[#172033] border border-[#D9DEE5] text-xs font-semibold rounded transition-colors inline-flex items-center gap-1"
              >
                <span>Full Variance Ledger</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* S-Curve Summary Pills */}
          <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-[#D9DEE5]">
                <span className="w-3 h-1 bg-[#176B87] rounded-full" />
                <span className="text-[#596579]">Planned:</span>
                <strong className="font-mono text-sm font-bold text-[#176B87]">80.0%</strong>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-[#D9DEE5]">
                <span className="w-3 h-1 bg-[#2E7D5B] rounded-full" />
                <span className="text-[#596579]">Actual:</span>
                <strong className="font-mono text-sm font-bold text-[#2E7D5B]">73.0%</strong>
              </div>
              <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded border border-[#D9DEE5]">
                <span className="w-3 h-1 border-t-2 border-dashed border-[#D98B32]" />
                <span className="text-[#596579]">Forecast:</span>
                <strong className="font-mono text-sm font-bold text-[#D98B32]">100% (20 Dec)</strong>
              </div>
              <div className="flex items-center gap-2 bg-[#FBEFEE] px-2.5 py-1 rounded border border-[#E4B0AA]">
                <span className="w-2 h-2 rounded-full bg-[#B5473C]" />
                <span className="text-[#B5473C] font-semibold">Variance:</span>
                <strong className="font-mono text-sm font-bold text-[#B5473C]">-7.0% SLIP</strong>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded bg-white border border-[#D9DEE5] text-[#596579] font-medium text-xs">
              <span className="text-[#B5473C] font-bold">Variance Diagnosis:</span> Actual physical progress is 7.0 percentage points behind approved baseline (critical path impact).
            </div>
          </div>

          <SCurveChart
            variant="full"
            title="Project S-Curve — Baseline vs. Actual Earned vs. Forecast"
            subtitle="Rev 3.2 (P6 XML) Physical Earned Progress (Data Date: 18 Sep 2026)"
          />
        </section>

        {/* =========================================================================
            5. ANALYTICAL CHARTS SUITE (Interactive Multi-Perspective Cockpit)
            Provides rich visual charts (Discipline, Site Area, Variance Trend, Delay Ranking)
            and completely removes duplicate progress bars and verbose excuse paragraphs!
            ========================================================================= */}
        <section aria-labelledby="analytics-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-3">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Multi-Perspective Schedule Analytics
              </span>
              <h2 id="analytics-heading" className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                Execution Analytics & Performance Dimensions
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Switch visual perspectives to evaluate project delivery by engineering discipline, site zone, or variance trajectory.
              </p>
            </div>

            {/* Perspective Selector Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg self-start sm:self-center overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setActiveChartTab('discipline')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeChartTab === 'discipline'
                    ? 'bg-white text-[#176B87] shadow-2xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
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
                    ? 'bg-white text-[#176B87] shadow-2xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
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
                    ? 'bg-white text-[#176B87] shadow-2xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
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
                    ? 'bg-white text-[#176B87] shadow-2xs border border-[#D9DEE5]'
                    : 'text-[#596579] hover:text-[#172033]'
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
        </section>

        {/* ========================================================= */}
        {/* 6. SCHEDULE VARIANCE CONTROL TABLE */}
        {/* Compact, crisp activity-level tracking with highlighted CPM rows */}
        {/* ========================================================= */}
        <section id="variance-table" aria-labelledby="variance-table-heading" className="bg-white border border-[#D9DEE5] border-l-4 border-l-[#176B87] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Critical Path Activity Tracking
              </span>
              <h2 id="variance-table-heading" className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
                Schedule Variance Control Table
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Activity-level audit comparing planned finish to actual completion and slip variance.
              </p>
            </div>
            <Link
              href="/variance"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Full Variance Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto border border-[#D9DEE5] rounded-lg">
            <table className="w-full min-w-[640px] text-left border-collapse text-xs">
              <thead className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] uppercase font-semibold text-[11px] tracking-wider h-10">
                <tr>
                  <th className="py-2.5 px-3">Activity</th>
                  <th className="py-2.5 px-3">Planned Finish</th>
                  <th className="py-2.5 px-3">Actual Finish</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]/60 text-[#172033]">
                {scheduleVarianceItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`h-10 hover:bg-[#F9FAFC] transition-colors ${
                      item.isCriticalPath && item.varianceDays > 0 ? 'bg-[#FFF9F8]' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B87]">{item.id}</span>
                        <span className="text-[#172033] truncate max-w-xs">{item.name}</span>
                        {item.isCriticalPath && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                            CPM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#596579]">{item.plannedFinish}</td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#172033]">{item.actualFinish}</td>
                    <td className="py-2.5 px-3">
                      <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${item.varianceDays > 0 ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]' : 'text-[#2E7D5B]'}`}>
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
                        className="px-2.5 py-1 text-xs text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded font-medium transition-colors cursor-pointer"
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

        {/* =========================================================================
            7. DECISIONS & VERIFIED MILESTONES (Streamlined Executive Ledger)
            Replaces raw worker logs with high-signal pending approvals + verified milestone syncs
            ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Column 1: Pending Match Approvals */}
          <section aria-labelledby="pending-approvals-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#176B87]" />
                <h2 id="pending-approvals-heading" className="text-sm sm:text-base font-bold text-[#172033]">
                  Pending Schedule Links
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] text-[10px] font-mono font-bold">
                  {reviewEvents.length} Actions
                </span>
              </div>
              <Link href="/review" className="text-xs text-[#176B87] hover:underline font-semibold">
                Open Review Center &rarr;
              </Link>
            </div>

            {reviewEvents.length === 0 ? (
              <div className="p-6 text-center bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-[#2E7D5B] mx-auto mb-1.5" />
                <p className="text-xs font-bold text-[#172033]">No pending review items</p>
                <p className="text-[11px] text-[#596579] mt-0.5">
                  All field updates are linked and verified with the baseline.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#D9DEE5]">
                {reviewEvents.slice(0, 3).map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B87] text-[11px]">{evt.id}</span>
                        <ConfidenceBadge score={evt.confidence} size="sm" />
                      </div>
                      <p className="text-xs text-[#172033] font-medium truncate max-w-sm">
                        {evt.rawText}
                      </p>
                      <div className="text-[10px] text-[#596579] flex items-center gap-1">
                        <span>Target:</span>
                        <strong className="text-[#172033] font-mono">{evt.matchedActivityId || 'Unassigned'}</strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReviewModalEvent(evt)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] rounded font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
                    >
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Column 2: Verified Milestones Sync Ledger */}
          <section aria-labelledby="milestones-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                <h2 id="milestones-heading" className="text-sm sm:text-base font-bold text-[#172033]">
                  Verified Progress Synchronizations
                </h2>
              </div>
              <Link href="/execution" className="text-xs text-[#176B87] hover:underline font-semibold">
                Execution Stream &rarr;
              </Link>
            </div>

            <div className="divide-y divide-[#D9DEE5]">
              {verifiedMilestones.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#2E7D5B] text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3 text-[#2E7D5B]" />
                        {m.activityId}
                      </span>
                      <span className="text-[10px] text-[#7B8798] font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {m.verifiedDate}
                      </span>
                    </div>
                    <p className="text-xs text-[#172033] font-medium truncate max-w-sm">
                      {m.title}
                    </p>
                    <p className="text-[10px] text-[#596579]">
                      Verified by: <strong className="text-[#172033]">{m.auditor}</strong> • {m.progress}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9] text-[10px] font-bold font-mono whitespace-nowrap">
                    Committed
                  </span>
                </div>
              ))}
            </div>
          </section>
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
