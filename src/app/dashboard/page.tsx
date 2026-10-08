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
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { SCurveChart } from '../../components/shared/SCurveChart';
import { BarChart, HorizontalBarChart, StatusDonutChart } from '../../components/shared/charts';
import { Modal } from '../../components/shared/Modal';
import { WhyButton } from '../../components/shared/WhyButton';
import { projectService } from '../../lib/api/projectService';
import {
  MOCK_EXECUTION_EVENTS,
} from '../../lib/api/mockData';
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
  ChevronDown,
  ChevronRight,
  Activity,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { effectiveStatus } = useOffline();
  const { addToast } = useToast();

  // Review Items State
  const [reviewEvents, setReviewEvents] = useState<ExecutionEvent[]>(
    MOCK_EXECUTION_EVENTS.filter((e) => e.status === 'pending-review' || e.status === 'pending-verification')
  );

  // Modal & Drawer Interaction States
  const [selectedReviewModalEvent, setSelectedReviewModalEvent] = useState<ExecutionEvent | null>(null);
  const [selectedEventForRejection, setSelectedEventForRejection] = useState<ExecutionEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Expandable Raw Technical Info State (Section 7: Recent Activity)
  const [openedTechnicalEventId, setOpenedTechnicalEventId] = useState<string | null>(null);

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

  // Discipline Progress Breakdown for Section 5: Execution Progress
  const disciplineBreakdown = [
    { name: 'Civil Foundations & Pedestals', planned: 100, actual: 100, status: 'completed' as const, delta: '0d float' },
    { name: 'Piping Erection & Welding', planned: 85, actual: 70, status: 'delayed' as const, delta: '+2d slip' },
    { name: 'Mechanical Skid Alignment', planned: 20, actual: 15, status: 'on-track' as const, delta: '0d float' },
    { name: 'Electrical Cable Tray Galleries', planned: 50, actual: 40, status: 'at-risk' as const, delta: '+1d slip' },
    { name: 'Instrumentation & Loop Tubing', planned: 15, actual: 0, status: 'pending' as const, delta: '+2d lag' },
  ];

  // Specific event for Unmatched Item in Section 3
  const unmatchedEvent = MOCK_EXECUTION_EVENTS.find((e) => e.id === 'EVT-2026-004') || MOCK_EXECUTION_EVENTS[2];

  return (
    <div className="space-y-6 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <StateWrapper>
        {/* =========================================================================
            1. PAGE HEADER
            Project context, canonical schedule version, reporting date, connection status
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0] text-[11px] font-mono font-bold">
                  PROJECT ID: {activeProject.code}
                </span>
                <span className="text-xs text-[#596579]">
                  Schedule Version: <strong className="text-[#172033] font-mono">{CANONICAL_SCHEDULE_VERSION_LABEL}</strong>
                </span>
                <span className="text-[#7B8798] hidden sm:inline">•</span>
                <span className="text-xs text-[#596579]">
                  Reporting Date: <strong className="text-[#172033] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong>
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                {activeProject.name}
              </h1>
              <p className="text-sm text-[#596579]">
                Manager Project Controls & Execution Decision Surface • Organization: <strong>Oil India Limited</strong>
              </p>
            </div>

            {/* Connection Status Indicator */}
            <div className="flex items-center gap-3 self-start lg:self-center">
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
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PROJECT HEALTH (4–5 Primary KPI Cards)
            Recommended: Schedule Health, Verified Progress, Activities At Risk, Pending Review, Schedule Variance
            ========================================================================= */}
        <section aria-labelledby="kpi-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 id="kpi-heading" className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                Planned vs Actual Performance KPIs
              </h2>
              <span className="text-[12px] text-[#596579]">
                • Planned: {activeProject.plannedProgress}% vs Actual: {activeProject.overallProgress}%
              </span>
            </div>
            <span className="text-[11px] text-[#7B8798] font-mono hidden sm:inline">
              P6 Master Schedule Version: {CANONICAL_SCHEDULE_VERSION_LABEL}
            </span>
          </div>

          <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-[#D9DEE5]">
            {/* 1. Schedule Health */}
            <div className="p-4 sm:p-4 sm:p-6 hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Schedule Health
                </span>
                <div className="flex items-center gap-2">
                  <WhyButton
                    onClick={() => openWhyExplanation('health:PRJ-OIL-2026-01')}
                    title="Why is schedule health 94%?"
                  />
                  <Activity className="w-4 h-4 text-[#2E7D5B] flex-shrink-0" />
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#2E7D5B] leading-none">
                    94%
                  </span>
                  <span className="text-xs font-semibold text-[#2E7D5B]">Good</span>
                </div>
                <p className="text-[12px] text-[#596579] mt-0.5">
                  DCMA 14-Point • 5 Minor Flags
                </p>
              </div>
              <Link href="/health" className="text-[11px] sm:text-xs text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Inspect Health &rarr;
              </Link>
            </div>

            {/* 2. Verified Progress */}
            <div className="p-4 sm:p-4 sm:p-6 hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Verified Progress
                </span>
                <div className="flex items-center gap-2">
                  <WhyButton
                    onClick={() => openWhyExplanation('progress:verified')}
                    title="Why is verified progress 68.4%?"
                  />
                  <CheckCircle2 className="w-4 h-4 text-[#176B87] flex-shrink-0" />
                </div>
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#176B87] leading-none">
                    {activeProject.overallProgress}%
                  </span>
                  <span className="text-xs text-[#596579]">Actual</span>
                </div>
                <p className="text-[12px] text-[#596579] mt-0.5">
                  Target: {activeProject.plannedProgress}% (P6 Target)
                </p>
              </div>
              <Link href="/progress" className="text-[11px] sm:text-xs text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Progress Matrix &rarr;
              </Link>
            </div>

            {/* 3. Activities At Risk */}
            <Link
              href="/risks"
              className="p-4 sm:p-4 sm:p-6 hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Activities At Risk
                </span>
                <AlertTriangle className="w-4 h-4 text-[#B5473C] flex-shrink-0" />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                    3
                  </span>
                  <span className="text-xs font-bold text-[#B5473C]">At Risk</span>
                </div>
                <p className="text-[12px] text-[#596579] mt-0.5">
                  1 Critical Path • 2 Near-Critical
                </p>
              </div>
              <span className="text-[11px] sm:text-xs text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                CPM Risk Network &rarr;
              </span>
            </Link>

            {/* 4. Pending Review */}
            <Link
              href="/review"
              className="p-4 sm:p-4 sm:p-6 hover:bg-[#F9FAFC] transition-colors flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  Pending Review
                </span>
                <Clock className="w-4 h-4 text-[#D98B32] flex-shrink-0" />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#D98B32] leading-none">
                    {reviewEvents.length}
                  </span>
                  <span className="text-xs font-bold text-[#D98B32]">Items</span>
                </div>
                <p className="text-[12px] text-[#596579] mt-0.5">
                  Awaiting Planner Validation
                </p>
              </div>
              <span className="text-[11px] sm:text-xs text-[#176B87] group-hover:underline font-semibold flex items-center gap-1">
                Review Queue &rarr;
              </span>
            </Link>

            {/* 5. Schedule Variance */}
            <div className="p-4 sm:p-4 sm:p-6 bg-[#FFFDFD] hover:bg-[#FFF8F8] transition-colors flex flex-col justify-between col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#B5473C]">
                  Schedule Variance
                </span>
                <WhyButton
                  onClick={() => openWhyExplanation('variance:portfolio')}
                  title="Why is variance -7%?"
                />
              </div>
              <div className="my-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#B5473C] leading-none">
                    {activeProject.variance}%
                  </span>
                  <span className="text-xs font-bold text-[#B5473C]">Variance</span>
                </div>
                <p className="text-[12px] text-[#B5473C] font-semibold mt-0.5">
                  +2 Days Behind Baseline Finish
                </p>
              </div>
              <a href="#schedule-variance" className="text-[11px] sm:text-xs text-[#176B87] hover:underline font-semibold flex items-center gap-1">
                Inspect Delay Chain &rarr;
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. WHAT NEEDS MY ATTENTION NOW?
            Executive priority queue: Answers "What needs attention?" with immediate
            decision pathways answering "What should I do?".
            ========================================================================= */}
        <section aria-labelledby="attention-heading" className="bg-[#FFFDF7] border-2 border-[#D98B32] rounded-lg p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0D4A6] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-[#B5473C]" />
                <h2 id="attention-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                  What Needs My Attention Now?
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#B5473C] text-white text-[11px] font-mono font-semibold">
                  6 Critical Items
                </span>
              </div>
              <p className="text-[13px] text-[#596579] mt-1">
                Executive priority queue: Answers <strong>&ldquo;What needs attention?&rdquo;</strong> with immediate decision pathways answering <strong>&ldquo;What should I do?&rdquo;</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/review"
                className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs transition-colors inline-flex items-center gap-2"
              >
                <span>Full Review Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Limited Status Distribution Donut Chart */}
          <StatusDonutChart />

          {/* 6 Prominent Decision Cards (Each with exactly one primary action) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ITEM 1: Review Match */}
            <div className="p-4 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#D98B32] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                    Review Match
                  </span>
                  <WhyButton
                    onClick={() => openWhyExplanation('confidence:EVT-2026-002', 'EVT-2026-002')}
                    title="Why do these matches require review?"
                  />
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  {reviewEvents.length} Field Matches Awaiting Planner Validation
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  Execution events in the 70%–89% confidence band (Line 24 welding, cable trays) require planner sign-off before actual progress commits to P6.
                </p>
                <div className="text-[12px] text-[#8C581E] pt-2 border-t border-[#F0D4A6]/50">
                  <span className="font-semibold text-[#664014]">Impact:</span> Schedule Twin baseline synchronization paused.
                </div>
              </div>
              <Link
                href="/review"
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block"
              >
                Review Matches ({reviewEvents.length})
              </Link>
            </div>

            {/* ITEM 2: Unmatched Event */}
            <div className="p-4 rounded-lg bg-white border border-[#E4B0AA] hover:border-[#B5473C] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                    Unmatched Event
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#B5473C]">47% Confidence</span>
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  EVT-2026-004: Unit B Drain Line Pipe Installation
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  Field report submitted by Debajit Borah references an unlinked spool code syntax. Cannot automatically resolve to an active P6 baseline node.
                </p>
                <div className="text-[12px] text-[#B5473C] pt-2 border-t border-[#E4B0AA]/50">
                  <span className="font-semibold text-[#8B2C24]">Impact:</span> 1.0 job progress uncredited in current reporting period.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReviewModalEvent(unmatchedEvent)}
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block cursor-pointer"
              >
                Assign Activity Target
              </button>
            </div>

            {/* ITEM 3: Delayed Activity */}
            <div className="p-4 rounded-lg bg-white border border-[#E4B0AA] hover:border-[#B5473C] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                    Delayed Activity
                  </span>
                  <WhyButton
                    onClick={() => openWhyExplanation('delay:PIP-24-001', 'PIP-24-001')}
                    title="Why is this activity delayed?"
                  />
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  PIP-24-001: Erect Line 24-XX Header (+2d Slip)
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  Critical path activity slipped 2 days due to crane mobilization constraints during heavy rainfall at Unit A laydown. Total float is 0.
                </p>
                <div className="text-[12px] text-[#B5473C] pt-2 border-t border-[#E4B0AA]/50">
                  <span className="font-semibold text-[#8B2C24]">Impact:</span> Direct day-for-day slip on commercial hydro-test milestone.
                </div>
              </div>
              <a
                href="#schedule-variance"
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block"
              >
                Inspect Delay Chain
              </a>
            </div>

            {/* ITEM 4: Dependency Impact */}
            <div className="p-4 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#D98B32] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                    Dependency Impact
                  </span>
                  <div className="flex items-center gap-2">
                    <WhyButton
                      onClick={() => openWhyExplanation('impact:CIV-11-001')}
                      title="Why does this delay impact downstream activities?"
                    />
                    <span className="text-[11px] font-mono font-semibold text-[#D98B32]">3 Downstream</span>
                  </div>
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  Critical Path Ripple: Hydro-test & Loop Tubing
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  PIP-24-001 delay pushes successor activities PIP-24-002 (Welds), PIP-24-003 (Hydro-test), and INS-04-015 (Smart Transmitters).
                </p>
                <div className="text-[12px] text-[#8C581E] pt-2 border-t border-[#F0D4A6]/50">
                  <span className="font-semibold text-[#664014]">Impact:</span> Milestone finish pushed from 30 Nov to 02 Dec.
                </div>
              </div>
              <Link
                href="/what-if"
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block"
              >
                Run What-If Simulation
              </Link>
            </div>

            {/* ITEM 5: Evidence Conflict */}
            <div className="p-4 rounded-lg bg-white border border-[#F0D4A6] hover:border-[#D98B32] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                    Evidence Conflict
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#B5473C]">Audit Grade Alert</span>
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  EV-DPR-002 vs NDT-XRAY-088 Joint Count Variance
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  Site Engineer DPR reports 12 completed welds on Line 24, but third-party NDT agency report verified and cleared only 10 joints.
                </p>
                <div className="text-[12px] text-[#8C581E] pt-2 border-t border-[#F0D4A6]/50">
                  <span className="font-semibold text-[#664014]">Impact:</span> Discrepancy of 2 joints requires supervisor reconciliation.
                </div>
              </div>
              <Link
                href="/sync"
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block"
              >
                Reconcile Evidence Conflict
              </Link>
            </div>

            {/* ITEM 6: Data Quality Issue */}
            <div className="p-4 rounded-lg bg-white border border-[#D9DEE5] hover:border-[#176B87] transition-all shadow-xs flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold uppercase bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                    Data Quality Issue
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#D98B32]">Pending Stamp</span>
                </div>
                <h3 className="text-[15px] sm:text-base font-medium text-[#172033] leading-snug">
                  DPR-2026-09-18 (Unit A): Missing Quality Signoff
                </h3>
                <p className="text-[13px] text-[#596579] leading-relaxed">
                  Field shift diary was captured and queued without Lead Quality Inspector digital certificate seal. Held in local validation buffer.
                </p>
                <div className="text-[12px] text-[#596579] pt-2 border-t border-[#D9DEE5]/60">
                  <span className="font-semibold text-[#172033]">Impact:</span> Record cannot be promoted to Server Confirmed audit grade.
                </div>
              </div>
              <Link
                href="/field/dpr"
                className="w-full py-2 px-3 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs text-center transition-colors block"
              >
                Request Inspector Signoff
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. S-CURVE
            The S-curve is one of the most visually important elements on the page.
            Baseline Plan vs. Actual Earned vs. Forecast.
            ========================================================================= */}
        <section aria-labelledby="scurve-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Earned Value & Schedule Trajectory
              </span>
              <h2 id="scurve-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                Project S-Curve — Baseline vs. Actual Earned vs. Forecast
              </h2>
              <p className="text-[13px] text-[#596579] mt-0.5">
                Physical earned progress trajectory across all WBS work packages compared to P6 baseline envelope.
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
                <span>Detailed Variance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <SCurveChart
            variant="full"
            title="Project S-Curve — Baseline vs. Actual Earned vs. Forecast"
            subtitle="Primavera P6 Baseline Rev 3.2 Physical Earned Progress (Data Date: 18 Sep 2026)"
          />
        </section>

        {/* =========================================================================
            5. EXECUTION PROGRESS
            Discipline Performance Comparison and Contextual Operational Summary
            ========================================================================= */}
        <section aria-labelledby="progress-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Discipline Performance & Work Packages
              </span>
              <h2 id="progress-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                Execution Progress & Discipline Breakdown
              </h2>
              <p className="text-[13px] text-[#596579] mt-0.5">
                Physical progress earned across major engineering disciplines against P6 baseline targets.
              </p>
            </div>
            <Link
              href="/progress"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Detailed Progress Matrix <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bar Chart: Progress by Discipline */}
          <BarChart variant="discipline" className="border-0 p-0 shadow-none" />

          {/* Discipline Breakdown Bars */}
          <div className="border border-[#D9DEE5] rounded-md bg-white divide-y divide-[#D9DEE5] overflow-hidden">
            {disciplineBreakdown.map((item) => (
              <div key={item.name} className="p-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <span className="font-medium text-[#172033]">{item.name}</span>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[#596579]">Actual: <strong className="text-[#172033]">{item.actual}%</strong></span>
                    <span className="text-[#7B8798]">|</span>
                    <span className="text-[#596579]">Planned: {item.planned}%</span>
                    <span className="text-[#7B8798]">|</span>
                    <span className={item.actual < item.planned ? 'text-[#B5473C] font-medium' : 'text-[#2E7D5B] font-medium'}>
                      {item.delta}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>
                </div>
                <ProgressBar
                  actual={item.actual}
                  planned={item.planned}
                  size="sm"
                  status={item.status}
                  showLabels={false}
                />
              </div>
            ))}
          </div>

          {/* Summary Contextual Brief Note */}
          <div className="p-3 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-xs text-[#596579] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Summary Context:</span>
              <strong className="text-[#172033]">What happened?</strong>
              <span>16 units verified, civil foundations 100%.</span>
              <span className="text-[#7B8798]">•</span>
              <strong className="text-[#172033]">What changed?</strong>
              <span>Line 24 slipped +2d, widening variance to -7.0%.</span>
            </div>
            <Link href="/progress" className="text-[#176B87] hover:underline font-semibold flex-shrink-0">
              Discipline Matrix &rarr;
            </Link>
          </div>
        </section>

        {/* =========================================================================
            6. SCHEDULE VARIANCE
            Delay & Dependency Impact Analysis, Critical Path Propagation, and Review Queue
            ========================================================================= */}
        <section id="schedule-variance" aria-labelledby="delay-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Critical Path Propagation & Float Loss
              </span>
              <h2 id="delay-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                Schedule Variance & Delay Impact
              </h2>
              <p className="text-[13px] text-[#596579] mt-0.5">
                Propagation analysis of active schedule variances onto downstream critical activities and commercial milestones.
              </p>
            </div>
            <Link
              href="/risks"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Interactive CPM Risk Network <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Horizontal Bar Chart: Delayed Activities */}
          <HorizontalBarChart variant="delayed-activities" className="border-0 p-0 shadow-none mb-4" />

          <div className="space-y-4 pt-2 border-t border-[#D9DEE5]/60">
            {/* Delay Case 1: Line 24-XX Header */}
            <div className="border border-[#E4B0AA] rounded-lg p-4 bg-[#FFF9F8] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E4B0AA]/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-2 py-0.5 rounded">
                    PIP-24-001
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    Erect Line 24-XX High Pressure Gas Header
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <VarianceBadge daysDelay={2} size="sm" />
                  <WhyButton
                    onClick={() => openWhyExplanation('delay:PIP-24-001', 'PIP-24-001')}
                    title="Why is PIP-24-001 delayed?"
                  />
                  <span className="text-xs font-mono font-bold text-[#B5473C]">CRITICAL PATH</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Activity & Delay */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Activity & Delay</span>
                  <p className="text-[#172033] font-semibold mt-0.5">PIP-24-001 (+2d slip)</p>
                  <span className="text-[10px] text-[#596579]">Planned: 15 Aug - 30 Sep</span>
                </div>

                {/* 2. Cause */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Cause</span>
                  <p className="text-[#596579] mt-0.5">
                    Crane mobilization delayed 2 days due to heavy rainfall at Unit A laydown.
                  </p>
                </div>

                {/* 3. Affected Activities */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Affected Activities</span>
                  <p className="font-mono text-[#172033] mt-0.5 font-medium">
                    PIP-24-002 (Welds), PIP-24-003 (Hydro-test), INS-04-015
                  </p>
                </div>

                {/* 4. Impact */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Impact</span>
                  <p className="text-[#B5473C] font-semibold mt-0.5">
                    Pushes 150-bar hydrostatic pressure test milestone by +2 days. Zero float.
                  </p>
                </div>

                {/* 5. Action */}
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-[#596579] block mb-1">Action</span>
                  <Link
                    href="/what-if"
                    className="w-full py-1.5 px-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded text-center transition-colors shadow-xs"
                  >
                    Simulate Recovery
                  </Link>
                </div>
              </div>
            </div>

            {/* Delay Case 2: Cable Tray Overhead Slip */}
            <div className="border border-[#F0D4A6] rounded-lg p-4 bg-[#FFFCF7] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0D4A6]/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#8C5311] bg-[#FDF6ED] border border-[#F0D4A6] px-2 py-0.5 rounded">
                    ELE-11-032
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    Cable Tray Installation - Substation to Compressor Bay
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <VarianceBadge daysDelay={1} size="sm" />
                  <span className="text-xs font-mono font-medium text-[#596579]">SECONDARY PATH</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                {/* 1. Activity & Delay */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Activity & Delay</span>
                  <p className="text-[#172033] font-semibold mt-0.5">ELE-11-032 (+1d lag)</p>
                  <span className="text-[10px] text-[#596579]">Planned: 01 Sep - 15 Oct</span>
                </div>

                {/* 2. Cause */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Cause</span>
                  <p className="text-[#596579] mt-0.5">
                    Overhead steel gallery bracket alignment hold point awaiting re-torque inspection.
                  </p>
                </div>

                {/* 3. Affected Activities */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Affected Activities</span>
                  <p className="font-mono text-[#172033] mt-0.5 font-medium">
                    INS-04-015 (Smart Transmitters)
                  </p>
                </div>

                {/* 4. Impact */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">Impact</span>
                  <p className="text-[#D98B32] font-semibold mt-0.5">
                    Absorbs 1 day of 3-day float buffer. No immediate milestone push.
                  </p>
                </div>

                {/* 5. Action */}
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] uppercase font-bold text-[#596579] block mb-1">Action</span>
                  <button
                    type="button"
                    onClick={() => openActivityDrawer('ELE-11-032')}
                    className="w-full py-1.5 px-2 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] text-xs font-medium rounded text-center transition-colors cursor-pointer"
                  >
                    Inspect Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEW REQUIRED TABLE (Integrated within Schedule Variance domain) */}
        <section id="review-required" aria-labelledby="review-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="review-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                  Review Required Queue
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] text-[11px] font-mono font-semibold">
                  {reviewEvents.length} Actions Pending
                </span>
              </div>
              <p className="text-[13px] text-[#596579] mt-0.5">
                AI Match Policy: <strong className="text-[#2E7D5B]">≥90% Auto-Link</strong>, <strong className="text-[#D98B32]">70%–89% Planner Review</strong>, <strong className="text-[#B5473C]">&lt;70% Unmatched</strong>.
              </p>
            </div>
            <Link
              href="/review"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Open Full Review Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {reviewEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#172033]">All Review Items Cleared</p>
              <p className="text-[13px] text-[#596579]">No execution events require planner match confirmation.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#D9DEE5] rounded-lg">
              <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-semibold text-[11px] sm:text-xs uppercase tracking-wider h-11">
                    <th className="py-3 px-4 whitespace-nowrap min-w-[220px]">Event</th>
                    <th className="py-3 px-4 whitespace-nowrap min-w-[200px]">Candidate Activity</th>
                    <th className="py-3 px-4 whitespace-nowrap">Confidence</th>
                    <th className="py-3 px-4 whitespace-nowrap">Evidence</th>
                    <th className="py-3 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]/60 text-[#172033]">
                  {reviewEvents.map((evt) => (
                    <tr key={evt.id} className="h-11 sm:h-12 hover:bg-[#F9FAFC] transition-colors">
                      {/* 1. Event */}
                      <td className="py-3 px-4 align-middle">
                        <span className="font-mono text-xs font-semibold text-[#176B87] block">{evt.id}</span>
                        <p className="text-[14px] font-normal text-[#172033] mt-0.5 leading-snug">{evt.rawText}</p>
                        <span className="text-[11px] text-[#7B8798] font-mono mt-0.5 block">
                          {evt.eventDate} • {evt.source}
                        </span>
                      </td>

                      {/* 2. Candidate Activity */}
                      <td className="py-3 px-4 align-middle">
                        {evt.matchedActivityId ? (
                          <>
                            <span className="font-mono text-xs font-semibold text-[#176B87] block">
                              {evt.matchedActivityId}
                            </span>
                            <span className="text-[13px] text-[#172033] leading-tight block">
                              {evt.matchedActivityName}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#B5473C] font-semibold italic">
                            No Candidate Match Assigned
                          </span>
                        )}
                      </td>

                      {/* 3. Confidence */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge score={evt.confidence} size="sm" />
                          <WhyButton
                            onClick={() => openWhyExplanation(`confidence:${evt.id}`, evt.id)}
                            title="Why this confidence score?"
                          />
                        </div>
                      </td>

                      {/* 4. Evidence */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        {evt.evidenceIds.length > 0 ? (
                          <Link
                            href="/evidence"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#176B87] hover:underline"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                            <span>{evt.evidenceIds[0]}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#7B8798]">None</span>
                        )}
                      </td>

                      {/* 5. Status */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <StatusBadge status={evt.status} type="event" size="sm" />
                      </td>

                      {/* 6. Action: Review */}
                      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedReviewModalEvent(evt)}
                          className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =========================================================================
            7. RECENT ACTIVITY
            Stream of verified and processing field updates with progressive disclosure
            ========================================================================= */}
        <section aria-labelledby="execution-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <span className="text-[11px] font-mono font-medium uppercase text-[#596579] tracking-wider">
                Field Activity Stream & Verification Feed
              </span>
              <h2 id="execution-heading" className="text-lg sm:text-xl font-semibold text-[#172033] tracking-tight">
                Recent Activity & Field Execution
              </h2>
              <p className="text-[13px] text-[#596579] mt-0.5">
                Stream of verified and processing field updates. Technical extraction parameters and NLP spans are hidden until opened.
              </p>
            </div>
            <Link
              href="/execution"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Full Execution Stream <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#D9DEE5]">
            {MOCK_EXECUTION_EVENTS.map((evt) => {
              const isTechnicalOpen = openedTechnicalEventId === evt.id;

              return (
                <div key={evt.id} className="py-3 space-y-2">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#176B87] bg-[#EDF2F8] px-2 py-0.5 rounded">
                          {evt.id}
                        </span>
                        <span className="text-xs font-semibold text-[#172033]">{evt.createdBy}</span>
                        <span className="text-[11px] text-[#7B8798] font-mono">
                          • {evt.eventDate} {evt.eventTime} ({evt.source})
                        </span>
                        <StatusBadge status={evt.status} type="event" size="sm" />
                      </div>

                      <p className="text-xs text-[#172033] font-medium leading-snug">
                        &ldquo;{evt.rawText}&rdquo;
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#596579]">
                        <span>Activity Target:</span>
                        <span className="font-mono font-bold text-[#176B87]">
                          {evt.matchedActivityId || 'UNASSIGNED'}
                        </span>
                        {evt.matchedActivityName && (
                          <span className="text-[#172033] truncate max-w-sm">
                            — {evt.matchedActivityName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progressive disclosure toggle */}
                    <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
                      <ConfidenceBadge score={evt.confidence} size="sm" />
                      <button
                        type="button"
                        onClick={() => setOpenedTechnicalEventId(isTechnicalOpen ? null : evt.id)}
                        className="px-3 py-1 text-xs text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded font-medium transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        {isTechnicalOpen ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span>Inspect Event</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PROGRESSIVE DISCLOSURE: Raw technical payload hidden until opened */}
                  {isTechnicalOpen && (
                    <div className="mt-2 p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]">
                        <span className="font-mono font-bold text-[11px] text-[#172033] uppercase">
                          Technical Processing Payload • {evt.id}
                        </span>
                        <span className="text-[10px] font-mono text-[#7B8798]">
                          Parser: V3.2 Precedence NLP Classifier
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 border-y border-[#D9DEE5]">
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#596579] block">Discipline</span>
                          <span className="font-mono font-medium text-[#172033] text-sm">{evt.discipline}</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#596579] block">Extracted Quantity</span>
                          <span className="font-mono font-medium text-[#172033] text-sm">{evt.quantity} {evt.unit}</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#596579] block">Area / Header</span>
                          <span className="font-mono font-medium text-[#172033] text-sm">{evt.area} {evt.line ? `(${evt.line})` : ''}</span>
                        </div>
                        <div>
                          <span className="text-[11px] uppercase font-semibold text-[#596579] block">Evidence Linked</span>
                          <span className="font-mono font-medium text-[#176B87] text-sm">
                            {evt.evidenceIds.length > 0 ? evt.evidenceIds.join(', ') : 'None'}
                          </span>
                        </div>
                      </div>

                      {evt.extractedFields?.confidenceSignals && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[11px] uppercase font-semibold text-[#596579] block">
                            Confidence Scoring Factors
                          </span>
                          <div className="divide-y divide-[#D9DEE5] border border-[#D9DEE5] rounded bg-white">
                            {evt.extractedFields.confidenceSignals.map((sig, sIdx) => (
                              <div key={sIdx} className="flex items-center justify-between text-[12px] p-2">
                                <span className="font-medium text-[#172033]">{sig.name}: <span className="text-[#596579] font-normal">{sig.reason}</span></span>
                                <span className="font-mono font-medium text-[#176B87]">{sig.score}/{sig.maxScore}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </StateWrapper>

      {/* =========================================================================
          REVIEW MODAL (Triggered by "Review" action in Review Queue or Section 3)
          ========================================================================= */}
      {selectedReviewModalEvent && (
        <Modal
          isOpen={!!selectedReviewModalEvent}
          onClose={() => setSelectedReviewModalEvent(null)}
          title={`Review Match: ${selectedReviewModalEvent.id}`}
          subtitle="Validate AI match hypothesis before committing progress to authoritative schedule twin."
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
