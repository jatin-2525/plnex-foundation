'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { usePreferences } from '../../context/PreferencesContext';
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
  HelpCircle,
  MessageSquare,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { effectiveStatus } = useOffline();
  const { addToast } = useToast();
  const { manager, shared } = usePreferences();

  // Active Tab for Analytics Cockpit: 'discipline' | 'area' | 'variance-trend' | 'delays'
  const [activeChartTab, setActiveChartTab] = useState<'discipline' | 'area' | 'variance-trend' | 'delays'>('discipline');

  // Review Items State
  const [reviewEvents, setReviewEvents] = useState<ExecutionEvent[]>(
    MOCK_EXECUTION_EVENTS.filter((e) => e.status === 'pending-review' || e.status === 'pending-verification')
  );

  // Feature 15: Dashboard Layout Controls (Density & Section Visibility wired to Display Preferences)
  const [dashboardDensity, setDashboardDensity] = useState<'comfortable' | 'compact'>(shared.density || 'comfortable');
  const [visibleSections, setVisibleSections] = useState({
    kpis: manager.pinnedCards?.includes('kpi-summary') ?? true,
    attention: manager.pinnedCards?.includes('urgent-actions') ?? true,
    scurve: manager.pinnedCards?.includes('s-curve') ?? true,
    analytics: false, // Default collapsed to reduce manager overload
    variance: true,
    pendingMatches: true,
    milestones: manager.pinnedCards?.includes('milestones') ?? false,
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
      status: 'completed' as const,
      isCriticalPath: false,
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
      status: 'at-risk' as const,
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

  // Verified Milestones Stream (Historical completions strictly on or before Data Date: 18 Sep 2026)
  const verifiedMilestones = [
    {
      id: 'EVT-HIST-001',
      activityId: 'CIV-11-001',
      title: 'Foundation Block A - Pedestal Pour Complete',
      progress: '100% Completed',
      verifiedDate: '15 Aug 2026',
      auditor: 'Lead Quality Inspector (RITES)',
      status: 'verified' as const,
    },
    {
      id: 'EVT-HIST-002',
      activityId: 'PIP-24-001',
      title: 'Line 24-XX Gas Header Spool Rigging',
      progress: '100% Spools Placed',
      verifiedDate: '17 Sep 2026',
      auditor: 'Project Controls Verification',
      status: 'verified' as const,
    },
    {
      id: 'EVT-HIST-003',
      activityId: 'ELE-11-032',
      title: 'Substation Overhead Cable Tray Alignment',
      progress: '350m Installed',
      verifiedDate: '16 Sep 2026',
      auditor: 'Resident Electrical Engineer',
      status: 'verified' as const,
    },
    {
      id: 'EVT-HIST-005',
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
            1. PAGE HEADER (Deliberate dark evergreen #103F39 anchor for executive hierarchy)
            Project context, canonical schedule version, reporting date, connection status
            ========================================================================= */}
        <div className="bg-[#103F39] dark:bg-[#101815] border border-[#235F56] dark:border-[#3A5146] rounded-xl p-4 sm:p-6 shadow-card text-white transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-[#103F39] dark:bg-[#243832] text-[#72C6AD] border border-[#235F56] text-[11px] font-mono font-bold">
                  PROJECT ID: {activeProject.code}
                </span>
                <span className="text-xs text-[#C5D5CA]">
                  Schedule: <strong className="text-[#F2F4E9] font-mono">{CANONICAL_SCHEDULE_VERSION_LABEL}</strong>
                </span>
                <span className="text-[#8FA897] hidden sm:inline">•</span>
                <span className="text-xs text-[#C5D5CA]">
                  Reporting Date: <strong className="text-[#F2F4E9] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-heading">
                {activeProject.name}
              </h1>
              <p className="text-sm text-[#C5D5CA]">
                Executive Project Controls & Schedule Decision Cockpit • <strong className="text-white">Oil India Limited</strong>
              </p>
            </div>

            {/* Header Action Toolbar & Connection Status */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold ${
                  effectiveStatus === 'OFFLINE'
                    ? 'bg-[#381916] border-[#5C2823] text-[#FF9E94]'
                    : 'bg-[#0C312C] border-[#235F56] text-[#72C6AD]'
                }`}
                title={`Application operating mode: ${effectiveStatus}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    effectiveStatus === 'OFFLINE' ? 'bg-[#FF9E94]' : 'bg-[#72C6AD]'
                  }`}
                />
                <span className="font-mono uppercase tracking-wider text-[11px]">
                  {effectiveStatus === 'OFFLINE' ? 'Offline Mode (Local)' : 'Simulated Online (Sandbox)'}
                </span>
              </div>

              {/* Messages Link */}
              <Link
                href="/messages"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#103F39] hover:bg-[#0C312C] border border-[#235F56] rounded-lg transition-colors shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#72C6AD]" />
                <span>Messages</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#E5C185] text-[#1B281E] text-[10px] font-bold">2</span>
              </Link>

              {/* Secondary Navigation */}
              <Link
                href="/schedule-twin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#103F39] hover:bg-[#0C312C] border border-[#235F56] rounded-lg transition-colors shadow-2xs"
              >
                <GitCommit className="w-3.5 h-3.5 text-[#72C6AD]" />
                <span>Schedule Twin</span>
              </Link>

              {/* Primary Action */}
              <Link
                href="/review"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#103F39] hover:bg-[#0C312C] dark:bg-[#72C6AD] dark:text-[#0B2822] border border-[#235F56] dark:border-[#72C6AD] rounded-lg transition-colors shadow-xs"
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
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] flex items-center gap-1.5 text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
              Layout & Density:
            </span>
            <div className="flex rounded border border-[#D9E2DA] dark:border-[#3A5146] p-0.5 bg-[#F6F7F3] dark:bg-[#101815]">
              <button
                type="button"
                onClick={() => setDashboardDensity('comfortable')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dashboardDensity === 'comfortable'
                    ? 'bg-[#006B61] dark:bg-[#006B61] text-white font-bold shadow-xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
              >
                Comfortable
              </button>
              <button
                type="button"
                onClick={() => setDashboardDensity('compact')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  dashboardDensity === 'compact'
                    ? 'bg-[#006B61] dark:bg-[#006B61] text-white font-bold shadow-xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                }`}
              >
                Compact
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-[#52665D] dark:text-[#B5C1B5]">Visible Sections:</span>
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
                className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-all cursor-pointer ${
                  (visibleSections as any)[sec.id]
                    ? 'bg-[#006B61] dark:bg-[#006B61] text-white border-[#006B61] dark:border-[#006B61] font-semibold shadow-xs'
                    : 'bg-white dark:bg-[#243832] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#1f3049]'
                }`}
              >
                {(visibleSections as any)[sec.id] ? `✓ ${sec.label}` : sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* =========================================================================
            1. WHAT NEEDS MY ATTENTION (Decision Backlog First)
            Prioritized #1 URGENT, #2 HIGH, #3 HIGH, #4 MEDIUM with single 1-click actions
            ========================================================================= */}
        {visibleSections.attention && (
          <section aria-labelledby="attention-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-xl p-4 sm:p-6 shadow-card space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#FFF1EE] dark:bg-[#381916] text-[#9D473D] dark:text-[#FF9E94] border border-[#F6CEC7] dark:border-[#5C2823]">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 id="attention-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                      What Needs My Attention
                    </h2>
                    <span className="px-2 py-0.5 rounded bg-[#FFF1EE] dark:bg-[#381916] text-[#9D473D] dark:text-[#FF9E94] border border-[#F6CEC7] dark:border-[#5C2823] text-[10px] font-mono font-bold uppercase">
                      PRIORITIZED DECISION BACKLOG
                    </span>
                  </div>
                  <p className="text-xs text-[#566159] dark:text-[#B5C1B5]">
                    Strictly ordered by project criticality — 1 clear action per item
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-[#9D473D] text-white text-xs font-mono font-bold flex items-center gap-1 shadow-2xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  4 Action Items
                </span>
                <Link
                  href="/review"
                  className="px-3 py-1.5 bg-[#103F39] hover:bg-[#0C312C] dark:bg-[#72C6AD] dark:text-[#0B2822] text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <span>Full Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* High-Signal Action Cards (Feature 16: Prioritized order with single clear action) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: #1 URGENT - Critical Path Header Erection Slip */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#243832] border border-[#F6CEC7] dark:border-[#5C2823] hover:border-[#9D473D] dark:hover:border-[#F28E7C] transition-all shadow-card flex flex-col justify-between space-y-3 border-l-4 border-l-[#9D473D] dark:border-l-[#F28E7C]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#FFF1EE] dark:bg-[#381916] text-[#9D473D] dark:text-[#FF9E94] border border-[#F6CEC7] dark:border-[#5C2823] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> #1 URGENT
                    </span>
                    <span className="text-[10px] text-[#9D473D] dark:text-[#FF9E94] font-mono font-bold">
                      Critical Path
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                    Line 24 Header Erection Delayed
                  </h3>
                  <p className="text-[11px] text-[#566159] dark:text-[#B5C1B5] leading-relaxed">
                    Crane rigging hold caused 2-day slip. Unmitigated, this pushes downstream Hydrotest and COD by +2 days.
                  </p>
                  <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#566159] dark:text-[#B5C1B5]">WBS: 1.1.3.2.1</span>
                    <span className="text-[#9D473D] dark:text-[#FF9E94] font-bold">Slip: +2 Days</span>
                  </div>
                </div>
                <Link
                  href="/variance"
                  className="w-full py-2 px-3 bg-[#9D473D] hover:bg-[#853B32] text-white text-xs font-bold rounded-lg text-center transition-colors block shadow-xs"
                >
                  Authorize Mitigation Shift &rarr;
                </Link>
              </div>

              {/* Card 2: #2 HIGH - Low Confidence Ambiguous Match */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#243832] border border-[#E5D1A9] dark:border-[#553F1D] hover:border-[#765216] dark:hover:border-[#E5C185] transition-all shadow-card flex flex-col justify-between space-y-3 border-l-4 border-l-[#765216] dark:border-l-[#E5C185]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#F5EAD4] dark:bg-[#352712] text-[#765216] dark:text-[#E5C185] border border-[#E5D1A9] dark:border-[#553F1D] flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> #2 HIGH
                    </span>
                    <span className="text-[10px] text-[#765216] dark:text-[#E5C185] font-mono font-bold">
                      Match Review
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                    Unmatched Flare Line Observation
                  </h3>
                  <p className="text-[11px] text-[#566159] dark:text-[#B5C1B5] leading-relaxed">
                    Field reported 35m pipe installation at Unit 02 flare, but closest baseline match (PIP-24-003) is 62% confidence.
                  </p>
                  <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#566159] dark:text-[#B5C1B5]">DPR-2026-09-18</span>
                    <span className="text-[#765216] dark:text-[#E5C185] font-bold">62% Match</span>
                  </div>
                </div>
                <Link
                  href="/matching"
                  className="w-full py-2 px-3 bg-[#765216] hover:bg-[#614210] text-white text-xs font-bold rounded-lg text-center transition-colors block shadow-xs"
                >
                  Verify or Remap Candidate &rarr;
                </Link>
              </div>

              {/* Card 3: #3 HIGH - Unmatched Field Observation */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#243832] border border-[#E5D1A9] dark:border-[#553F1D] hover:border-[#765216] dark:hover:border-[#E5C185] transition-all shadow-card flex flex-col justify-between space-y-3 border-l-4 border-l-[#765216] dark:border-l-[#E5C185]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#F5EAD4] dark:bg-[#352712] text-[#765216] dark:text-[#E5C185] border border-[#E5D1A9] dark:border-[#553F1D] flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-[#765216] dark:text-[#E5C185]" />
                      #3 HIGH
                    </span>
                    <span className="text-xs font-mono font-bold text-[#9D473D] dark:text-[#FF9E94] bg-[#FFF1EE] dark:bg-[#381916] px-1.5 rounded">47% Score</span>
                  </div>
                  <h3 className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                    EVT-2026-004: Unit B Drain Line
                  </h3>
                  <p className="text-[11px] text-[#566159] dark:text-[#B5C1B5] leading-relaxed">
                    Unlinked spool code submitted. Requires manager target assignment to credit physical earned progress.
                  </p>
                  <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#566159] dark:text-[#B5C1B5]">DPR-2026-09-17</span>
                    <span className="text-[#9D473D] dark:text-[#FF9E94] font-bold">Uncredited</span>
                  </div>
                </div>
                <Link
                  href="/matching"
                  className="w-full py-2 px-3 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] text-[#1A2B25] dark:text-[#72C6AD] border border-[#235F56] dark:border-[#72C6AD] text-xs font-bold rounded-lg text-center transition-colors block mt-2"
                >
                  Assign Target Activity &rarr;
                </Link>
              </div>

              {/* Card 4: #4 MEDIUM - Float Erosion Warning */}
              <div className="p-4 rounded-lg bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#566159] dark:hover:border-[#B5C1B5] transition-all shadow-card flex flex-col justify-between space-y-3 border-l-4 border-l-[#566159] dark:border-l-[#B5C1B5]">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-[#EAF0E9] dark:bg-[#17221D] text-[#566159] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> #4 MEDIUM
                    </span>
                    <span className="text-[10px] text-[#566159] dark:text-[#B5C1B5] font-mono font-bold">
                      Float Erosion
                    </span>
                  </div>
                  <h3 className="font-bold text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                    Substation Cable Tray Float Exhausted
                  </h3>
                  <p className="text-[11px] text-[#566159] dark:text-[#B5C1B5] leading-relaxed">
                    Total float decreased from 3 days to 0 days due to structural support bracket delays. Now on near-critical chain.
                  </p>
                  <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#566159] dark:text-[#B5C1B5]">WBS: 1.1.2.4</span>
                    <span className="text-[#765216] dark:text-[#E5C185] font-bold">Float: 0 Days</span>
                  </div>
                </div>
                <Link
                  href="/risks"
                  className="w-full py-2 px-3 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-bold rounded-lg text-center transition-colors block mt-2"
                >
                  Inspect Critical Path &rarr;
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            2. PROJECT PERFORMANCE KPIS (5 Visual KPI Cards with Icons & Trends)
            ========================================================================= */}
        {visibleSections.kpis && (
          <section aria-labelledby="kpi-heading" className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 id="kpi-heading" className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1.5 font-heading">
                <BarChart3 className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                Executive Performance Indicators
              </h2>
              <span className="text-[11px] text-[#738A80] dark:text-[#859688] font-mono hidden sm:inline">
                P6 XML Target vs Field Actuals
              </span>
            </div>

            <div className="border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-px bg-[#D9E2DA] dark:bg-[#243832]">
              {/* 1. Schedule Health */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors flex flex-col justify-between group`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
                    Schedule Health
                    <TermHelp term="spi" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('health:PRJ-OIL-2026-01')}
                      title="Why is schedule health 82%?"
                    />
                    <div className="p-1 rounded bg-[#F8EFDA] dark:bg-[#3D2808] text-[#825700] dark:text-[#F3B765]">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#825700] dark:text-[#F3B765] leading-none">
                      82%
                    </span>
                    <span className="text-xs font-semibold text-[#825700] dark:text-[#F3B765] flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Warning
                    </span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1">
                    Needs Attention — 5 Warnings
                  </p>
                </div>
                <Link href="/health" className="text-[11px] text-[#006B61] dark:text-[#72C6AD] group-hover:underline font-semibold flex items-center gap-1">
                  Inspect Health &rarr;
                </Link>
              </div>

              {/* 2. Verified Progress */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors flex flex-col justify-between group`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
                    Verified Progress
                    <TermHelp term="verified_progress" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('progress:verified')}
                      title="Why is verified progress 73.0%?"
                    />
                    <div className="p-1 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#176B53] dark:text-[#4ADE80] leading-none">
                      {activeProject.overallProgress}%
                    </span>
                    <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">Actual</span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1">
                    Baseline Target: <strong className="text-[#1A2B25] dark:text-[#F2F4E9] font-mono">{activeProject.plannedProgress}%</strong>
                  </p>
                </div>
                <Link href="/progress" className="text-[11px] text-[#006B61] dark:text-[#72C6AD] group-hover:underline font-semibold flex items-center gap-1">
                  Progress Matrix &rarr;
                </Link>
              </div>

              {/* 3. Activities At Risk */}
              <Link
                href="/risks?filter=critical"
                className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors flex flex-col justify-between group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
                    Activities At Risk
                    <TermHelp term="critical_path" />
                  </span>
                  <div className="p-1 rounded bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#A43B36] dark:text-[#FF9E94] leading-none">
                      3
                    </span>
                    <span className="text-xs font-bold text-[#A43B36] dark:text-[#FF9E94]">Alert</span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1">
                    1 Critical Path • 2 Near-Critical
                  </p>
                </div>
                <span className="text-[11px] text-[#006B61] dark:text-[#72C6AD] group-hover:underline font-semibold flex items-center gap-1">
                  CPM Risk Network &rarr;
                </span>
              </Link>

              {/* 4. Pending Review */}
              <Link
                href="/review"
                className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors flex flex-col justify-between group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5]">
                    Pending Review
                  </span>
                  <div className="p-1 rounded bg-[#F0F3FC] dark:bg-[#1A2548] text-[#405AA3] dark:text-[#E5C185]">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#405AA3] dark:text-[#E5C185] leading-none">
                      {reviewEvents.length}
                    </span>
                    <span className="text-xs font-bold text-[#405AA3] dark:text-[#E5C185]">Events</span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-1">
                    Awaiting Planner Sign-off
                  </p>
                </div>
                <span className="text-[11px] text-[#006B61] dark:text-[#72C6AD] group-hover:underline font-semibold flex items-center gap-1">
                  Review Center &rarr;
                </span>
              </Link>

              {/* 5. Schedule Variance */}
              <div className={`${dashboardDensity === 'compact' ? 'p-3' : 'p-4 lg:p-5'} bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors flex flex-col justify-between sm:col-span-2 lg:col-span-1`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#A43B36] dark:text-[#FF9E94] flex items-center gap-1">
                    Schedule Variance
                    <TermHelp term="variance" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <WhyButton
                      onClick={() => openWhyExplanation('variance:portfolio')}
                      title="Why is variance -7%?"
                    />
                    <div className="p-1 rounded bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94]">
                      <TrendingDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold font-mono text-[#A43B36] dark:text-[#FF9E94] leading-none">
                      {activeProject.variance}%
                    </span>
                    <span className="text-xs font-bold text-[#A43B36] dark:text-[#FF9E94]">Slip</span>
                  </div>
                  <p className="text-[11px] text-[#A43B36] dark:text-[#FF9E94] font-semibold mt-1">
                    +2 Days Behind Baseline Finish
                  </p>
                </div>
                <a href="#variance-table" className="text-[11px] text-[#006B61] dark:text-[#72C6AD] hover:underline font-semibold flex items-center gap-1">
                  Inspect Variance Table &rarr;
                </a>
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
              variant="dashboard"
              title="Project S-Curve — Baseline vs. Actual Earned vs. Forecast"
              subtitle="Rev 3.2 (P6 XML) Physical Earned Progress (Data Date: 18 Sep 2026)"
            />
          </section>
        )}

        {/* =========================================================================
            5. SUPPORTING ANALYTICAL CHARTS SUITE (Secondary Analysis)
            ========================================================================= */}
        {visibleSections.analytics && (
          <details className="group bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg shadow-xs overflow-hidden transition-colors" open>
            <summary className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer list-none hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors gap-3 select-none">
              <div className="space-y-0.5">
                <span className="text-[11px] font-mono font-medium uppercase text-[#52665D] dark:text-[#B5C1B5] tracking-wider">
                  Supporting Schedule Analytics
                </span>
                <div className="flex items-center gap-2">
                  <h2 id="analytics-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                    Dimensional Analysis & Deep-Dive Charts
                  </h2>
                  <span className="text-xs px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] font-semibold hidden sm:inline">
                    Discipline • Site Area • Trend • Delays
                  </span>
                </div>
                <p className="text-xs text-[#52665D] dark:text-[#B5C1B5]">
                  Multi-perspective breakdowns across engineering disciplines, site zones, and variance trajectories.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#006B61] dark:text-[#72C6AD] self-start sm:self-center">
                <span className="group-open:hidden">Expand Analysis &darr;</span>
                <span className="hidden group-open:inline">Collapse Analysis &uarr;</span>
              </div>
            </summary>

            <div className="p-4 sm:p-6 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Interactive Performance Dimensions
                  </h3>
                  <p className="text-xs text-[#52665D] dark:text-[#B5C1B5]">
                    Switch visual perspectives to evaluate project delivery by engineering discipline, site zone, or variance trajectory.
                  </p>
                </div>

                {/* Perspective Selector Tabs */}
                <div className="flex items-center gap-1 p-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg self-start sm:self-center overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('discipline')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      activeChartTab === 'discipline'
                        ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] shadow-2xs border border-[#D9E2DA] dark:border-[#3A5146]'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
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
                        ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] shadow-2xs border border-[#D9E2DA] dark:border-[#3A5146]'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
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
                        ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] shadow-2xs border border-[#D9E2DA] dark:border-[#3A5146]'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
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
                        ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] shadow-2xs border border-[#D9E2DA] dark:border-[#3A5146]'
                        : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
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
                    className="border-0 p-0 shadow-none bg-transparent"
                  />
                )}

                {activeChartTab === 'area' && (
                  <BarChart
                    variant="area"
                    title="Work Package Progress by Site Area"
                    subtitle="WBS physical progress across Unit A Gas Processing, Compressor House, and Offsites"
                    className="border-0 p-0 shadow-none bg-transparent"
                  />
                )}

                {activeChartTab === 'variance-trend' && (
                  <LineChart
                    variant="variance-trend"
                    title="Cumulative Schedule Variance Trend"
                    subtitle="Historical trajectory of monthly schedule slip (+ahead / -slip) and projected recovery"
                    className="border-0 p-0 shadow-none bg-transparent"
                  />
                )}

                {activeChartTab === 'delays' && (
                  <HorizontalBarChart
                    variant="delayed-activities"
                    title="Top Delayed Critical Activities"
                    subtitle="Slip duration and critical path impact ranking across active work packages"
                    className="border-0 p-0 shadow-none bg-transparent"
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
          <section id="variance-table" aria-labelledby="variance-table-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] border-l-4 border-l-[#006B61] dark:border-l-[#72C6AD] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-2">
              <div>
                <span className="text-[11px] font-mono font-medium uppercase text-[#52665D] dark:text-[#B5C1B5] tracking-wider">
                  Critical Path Activity Tracking
                </span>
                <div className="flex items-center gap-2">
                  <h2 id="variance-table-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                    Schedule Variance Control Table
                  </h2>
                  <TermHelp term="variance" />
                </div>
                <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                  Activity-level audit comparing planned finish to actual completion and slip variance.
                </p>
              </div>

              {/* Feature 18: Saved Table Views & Preset Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded p-0.5 text-xs">
                  <span className="text-[11px] font-medium text-[#52665D] dark:text-[#B5C1B5] px-1.5 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-[#52665D] dark:text-[#B5C1B5]" /> Filter:
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
                          ? 'bg-[#006B61] dark:bg-[#006B61] text-white font-bold shadow-2xs'
                          : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <Link
                  href="/variance"
                  className="text-xs text-[#006B61] dark:text-[#72C6AD] hover:underline font-semibold inline-flex items-center gap-1"
                >
                  Full Ledger <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
              <table className="w-full min-w-[640px] text-left border-collapse text-xs">
                <thead className="bg-[#F6F7F3] dark:bg-[#243832] border-b border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] uppercase font-semibold text-[11px] tracking-wider h-10">
                  <tr>
                    <th scope="col" className="py-2.5 px-3">Activity</th>
                    <th scope="col" className="py-2.5 px-3">Planned Finish</th>
                    <th scope="col" className="py-2.5 px-3">Actual Finish</th>
                    <th scope="col" className="py-2.5 px-3 flex items-center gap-1">
                      Variance
                      <TermHelp term="float" />
                    </th>
                    <th scope="col" className="py-2.5 px-3">Status</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9]">
                  {filteredVarianceItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`h-10 hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors ${
                        item.isCriticalPath && item.varianceDays > 0 ? 'bg-[#FFF9F8] dark:bg-[#25181A]' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">{item.id}</span>
                          <span className="text-[#1A2B25] dark:text-[#F2F4E9] truncate max-w-xs">{item.name}</span>
                          {item.isCriticalPath && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#5C2329]">
                              CPM
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#52665D] dark:text-[#B5C1B5]">{item.plannedFinish}</td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#1A2B25] dark:text-[#F2F4E9]">{item.actualFinish}</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${item.varianceDays > 0 ? 'bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#5C2329]' : 'text-[#176B53] dark:text-[#4ADE80]'}`}>
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
                          className="px-2.5 py-1 text-xs text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#1f3049] border border-[#D9E2DA] dark:border-[#3A5146] rounded font-medium transition-colors cursor-pointer"
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
            <section aria-labelledby="pending-approvals-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-5 shadow-xs space-y-3 transition-colors">
              <div className="flex items-center justify-between pb-2 border-b border-[#D9E2DA] dark:border-[#3A5146]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                  <h2 id="pending-approvals-heading" className="text-sm sm:text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Pending Schedule Links
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF8E6] dark:bg-[#3D2808] text-[#825700] dark:text-[#F3B765] border border-[#E5C185] dark:border-[#523712] text-[10px] font-mono font-bold">
                    {reviewEvents.length} Actions
                  </span>
                </div>
                <Link href="/review" className="text-xs text-[#006B61] dark:text-[#72C6AD] hover:underline font-semibold">
                  Open Review Center &rarr;
                </Link>
              </div>

              {reviewEvents.length === 0 ? (
                <div className="p-6 text-center bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-[#176B53] dark:text-[#4ADE80] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">No pending review items</p>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                    All field updates are linked and verified with the baseline.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
                  {reviewEvents.slice(0, 3).map((evt) => (
                    <div key={evt.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD] text-[11px]">{evt.id}</span>
                          <ConfidenceBadge score={evt.confidence} size="sm" />
                        </div>
                        <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] font-medium truncate max-w-sm">
                          {evt.rawText}
                        </p>
                        <div className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] flex items-center gap-1">
                          <span>Target:</span>
                          <strong className="text-[#1A2B25] dark:text-[#F2F4E9] font-mono">{evt.matchedActivityId || 'Unassigned'}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedReviewModalEvent(evt)}
                        className="px-2.5 py-1 text-xs bg-white dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#1f3049] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] rounded font-semibold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
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
            <details className="group bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-5 shadow-xs transition-colors" open>
              <summary className="flex items-center justify-between cursor-pointer list-none select-none">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#176B53] dark:text-[#4ADE80]" />
                  <h2 id="milestones-heading" className="text-sm sm:text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] font-heading">
                    Verified Progress History ({verifiedMilestones.length})
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold group-open:hidden">View History &darr;</span>
                  <span className="text-xs text-[#006B61] dark:text-[#72C6AD] font-semibold hidden group-open:inline">Hide History &uarr;</span>
                </div>
              </summary>

              <div className="pt-3 mt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
                {verifiedMilestones.map((m) => (
                  <div key={m.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B53] dark:text-[#4ADE80] text-[11px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-[#176B53] dark:text-[#4ADE80]" />
                          {m.activityId}
                        </span>
                        <span className="text-[10px] text-[#52665D] dark:text-[#B5C1B5] font-mono">{m.verifiedDate}</span>
                      </div>
                      <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] font-medium">{m.title}</p>
                      <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">{m.progress} • Certified by {m.auditor}</p>
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
                className="px-3 py-1.5 text-xs text-[#A43B36] dark:text-[#FF9E94] hover:bg-[#F6E4E1] dark:hover:bg-[#3D1418] rounded border border-[#DCABA7] dark:border-[#5C2329] font-semibold transition-colors cursor-pointer"
              >
                Reject Match
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedReviewModalEvent(null)}
                  className="px-3 py-1.5 text-xs text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] rounded border border-[#D9E2DA] dark:border-[#3A5146] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveEvent(selectedReviewModalEvent)}
                  className="px-4 py-1.5 text-xs bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] text-white rounded font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Approve & Commit Match
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Field Statement */}
            <div className="p-3 bg-[#F6F7F3] dark:bg-[#101815] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
              <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                Raw Field Statement
              </span>
              <p className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] mt-1 leading-relaxed">
                &ldquo;{selectedReviewModalEvent.rawText}&rdquo;
              </p>
              <div className="mt-2 text-[10px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
                Source: {selectedReviewModalEvent.source} • Date: {selectedReviewModalEvent.eventDate} • Creator: {selectedReviewModalEvent.createdBy}
              </div>
            </div>

            {/* Candidate Target */}
            <div className="p-3 bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
              <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                Target Schedule Activity
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-sm text-[#006B61] dark:text-[#72C6AD]">
                    {selectedReviewModalEvent.matchedActivityId || 'NO TARGET ASSIGNED'}
                  </span>
                  <p className="text-xs font-semibold text-[#1A2B25] dark:text-[#F2F4E9] mt-0.5">
                    {selectedReviewModalEvent.matchedActivityName || 'Awaiting planner manual assignment'}
                  </p>
                </div>
                <ConfidenceBadge score={selectedReviewModalEvent.confidence} size="md" />
              </div>

              {selectedReviewModalEvent.matchedReasons && selectedReviewModalEvent.matchedReasons.length > 0 && (
                <div className="mt-2 pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-1">
                  <span className="text-[10px] font-semibold text-[#52665D] dark:text-[#B5C1B5]">Match Justification:</span>
                  <ul className="list-disc list-inside text-[11px] text-[#52665D] dark:text-[#B5C1B5] space-y-0.5">
                    {selectedReviewModalEvent.matchedReasons.map((r, rIdx) => (
                      <li key={rIdx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Evidence Link */}
            {selectedReviewModalEvent.evidenceIds.length > 0 && (
              <div className="p-3 bg-[#E4F1E9] dark:bg-[#0D3326] border border-[#B7DAC3] dark:border-[#1E4D3A] rounded-md text-xs text-[#1F6B4E] dark:text-[#4ADE80] flex items-center justify-between">
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
                className="px-3 py-1.5 text-xs text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] rounded border border-[#D9E2DA] dark:border-[#3A5146] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectEvent}
                className="px-4 py-1.5 text-xs bg-[#92372F] hover:bg-[#973930] dark:bg-[#B91C1C] dark:hover:bg-[#991B1B] text-white rounded font-medium shadow-xs cursor-pointer"
              >
                Confirm Rejection
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#52665D] dark:text-[#B5C1B5]">
              Provide a justification for rejecting this match. It will be recorded into the append-only audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Activity does not belong to active package scope..."
              rows={3}
              className="w-full p-3 bg-[#F6F7F3] dark:bg-[#101815] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded outline-none focus:border-[#006B61] dark:focus:border-[#72C6AD]"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
