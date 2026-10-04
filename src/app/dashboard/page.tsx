'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Modal } from '../../components/shared/Modal';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { projectService } from '../../lib/api/projectService';
import {
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
} from '../../lib/api/mockData';
import { ExecutionEvent } from '../../types';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  GitCompare,
  TrendingDown,
  Layers,
  ArrowRight,
  Clock,
  User,
  FileText,
  FileCheck,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  Info,
  Calendar,
  ExternalLink,
} from 'lucide-react';

export default function ManagerDashboardPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  const [reviewEvents, setReviewEvents] = useState<ExecutionEvent[]>(
    MOCK_EXECUTION_EVENTS.filter((e) => e.status === 'pending-review' || e.status === 'pending-verification')
  );

  const [selectedEventForApproval, setSelectedEventForApproval] = useState<ExecutionEvent | null>(null);
  const [selectedEventForRejection, setSelectedEventForRejection] = useState<ExecutionEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const breadcrumbs = [
    { label: 'Project Controls' },
    { label: 'Manager Dashboard', current: true },
  ];

  const handleApproveEvent = async (event: ExecutionEvent) => {
    const res = await projectService.approveMatch(
      event.id,
      'Approved via Manager Dashboard quick action'
    );
    setReviewEvents(reviewEvents.filter((e) => e.id !== event.id));
    setSelectedEventForApproval(null);
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
    setReviewEvents(reviewEvents.filter((e) => e.id !== selectedEventForRejection.id));
    setSelectedEventForRejection(null);
    setRejectReason('');
    addToast({
      type: 'warning',
      title: 'Match Rejected',
      description: 'Event marked as rejected and logged to audit ledger.',
    });
  };

  // Discipline Progress Breakdown for Section 2
  const disciplineBreakdown = [
    { name: 'Civil Foundations & Pedestals', planned: 100, actual: 100, status: 'completed' as const, delta: '0d' },
    { name: 'Piping Erection & Welding', planned: 85, actual: 70, status: 'delayed' as const, delta: '+2d slip' },
    { name: 'Mechanical Skid Alignment', planned: 20, actual: 15, status: 'on-track' as const, delta: '0d float' },
    { name: 'Electrical Cable Tray Galleries', planned: 50, actual: 40, status: 'at-risk' as const, delta: '+1d slip' },
    { name: 'Instrumentation & Loop Tubing', planned: 15, actual: 0, status: 'pending' as const, delta: '+2d lag' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Top Header Controls Bar */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 -mt-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D98B32]" />
            <span className="text-xs font-bold text-[#172033] font-mono">
              PROJECT: {activeProject.code}
            </span>
          </div>
          <span className="text-[#8A94A6] hidden sm:inline">•</span>
          <span className="text-xs text-[#596579]">
            Baseline Version: <strong className="text-[#172033] font-mono">Rev 3.2 (P6 XML)</strong>
          </span>
          <span className="text-[#8A94A6] hidden sm:inline">•</span>
          <span className="text-xs text-[#596579]">
            Reporting Date: <strong className="text-[#172033] font-mono">18 Sep 2026</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 text-[#596579]">
            <Clock className="w-3.5 h-3.5 text-[#2E7D5B]" />
            <span>Last Sync: <strong className="text-[#172033] font-mono">Today, 17:30 UTC</strong></span>
          </div>
          <StatusBadge status="at-risk" size="sm" />
        </div>
      </div>

      <PageHeader
        title="Manager Project Controls Dashboard"
        description="Centralized oversight for project planners and control managers. Surfaces execution progress, schedule variances, pending AI match decisions, and downstream critical path impacts."
        stage="ACTION"
        metadata={
          <>
            <span className="font-mono">ORGANIZATION: Oil India Limited</span>
            <span>•</span>
            <span>PROJECT: {activeProject.name}</span>
            <span>•</span>
            <span>CONTRACTOR: {activeProject.contractor}</span>
          </>
        }
      />

      <StateWrapper>
        {/* Core Manager Focus: "What needs my attention now?" */}
        <div className="bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-[#D98B32] text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <h3 className="text-sm font-bold text-[#172033]">
                  What Needs My Attention Now? (2 Critical Items)
                </h3>
                <span className="text-[11px] font-mono text-[#D98B32] font-semibold">
                  Action Required Today
                </span>
              </div>
              <p className="text-xs text-[#596579] leading-relaxed mb-3">
                Immediate schedule intervention needed on <strong>Line 24-XX</strong> critical path delay, and <strong>2 field progress records</strong> await planner verification before baseline synchronizations can commit.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white border border-[#F0D4A6] rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#B5473C] font-mono">1. Critical Path Slip: PIP-24-001</span>
                    <p className="text-[11px] text-[#596579]">Line 24-XX header slip (+2d) delays downstream hydro-test.</p>
                  </div>
                  <a
                    href="#delay-impact"
                    className="ml-2 px-2.5 py-1 bg-[#176B87] text-white text-[11px] font-semibold rounded hover:bg-[#135A72] whitespace-nowrap"
                  >
                    View Delay Chain
                  </a>
                </div>

                <div className="p-2.5 bg-white border border-[#F0D4A6] rounded flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#D98B32] font-mono">2. Review Queue: {reviewEvents.length} Events</span>
                    <p className="text-[11px] text-[#596579]">Line 24 spool welding (86% conf) & drain pipe (47% conf).</p>
                  </div>
                  <a
                    href="#review-required"
                    className="ml-2 px-2.5 py-1 bg-[#176B87] text-white text-[11px] font-semibold rounded hover:bg-[#135A72] whitespace-nowrap"
                  >
                    Resolve Matches
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Summary Cards */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4 gap-2">
            <div>
              <span className="text-xs font-mono font-bold text-[#176B87]">{activeProject.id}</span>
              <h2 className="text-base font-bold text-[#172033]">{activeProject.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/matching"
                className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded shadow-xs transition-colors"
              >
                Open Full Review Queue ({reviewEvents.length})
              </Link>
              <Link
                href="/variance"
                className="px-3 py-1.5 bg-white hover:bg-[#F0F2F5] text-[#172033] border border-[#D9DEE5] text-xs font-medium rounded transition-colors"
              >
                What-If Simulator
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md">
              <span className="text-[11px] font-medium text-[#596579] block">Overall Actual Progress</span>
              <span className="text-2xl font-black font-mono text-[#172033] mt-0.5 block">
                {activeProject.overallProgress}%
              </span>
              <span className="text-[10px] text-[#596579]">Baseline Target: {activeProject.plannedProgress}%</span>
            </div>

            <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-md">
              <span className="text-[11px] font-medium text-[#B5473C] block">Schedule Variance</span>
              <span className="text-2xl font-black font-mono text-[#B5473C] mt-0.5 block">
                {activeProject.variance}%
              </span>
              <span className="text-[10px] text-[#B5473C] font-semibold">+2 Days Behind P6 Finish</span>
            </div>

            <div className="p-3 bg-[#FDF6ED] border border-[#F0D4A6] rounded-md">
              <span className="text-[11px] font-medium text-[#D98B32] block">Open Review Items</span>
              <span className="text-2xl font-black font-mono text-[#D98B32] mt-0.5 block">
                {reviewEvents.length}
              </span>
              <span className="text-[10px] text-[#596579]">Requires Planner Approval</span>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md">
              <span className="text-[11px] font-medium text-[#596579] block">Open Critical Risks</span>
              <span className="text-2xl font-black font-mono text-[#172033] mt-0.5 block">
                {activeProject.delayedCount}
              </span>
              <span className="text-[10px] text-[#596579]">Zero Float Critical Path</span>
            </div>
          </div>
        </div>

        {/* Section 1: EXECUTION SUMMARY */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="pb-3 border-b border-[#E8EBF0] mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Section 1: Execution Summary
            </h3>
            <p className="text-xs text-[#596579] mt-0.5">
              Aggregated project reconciliation counts from WBS schedule to field capture.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 border border-[#D9DEE5] rounded bg-white">
              <span className="text-[11px] text-[#596579] block">Planned Activities</span>
              <span className="text-lg font-bold font-mono text-[#172033] block mt-1">151</span>
              <span className="text-[10px] text-[#8A94A6]">L1 to L6 baseline</span>
            </div>

            <div className="p-3 border border-[#D9DEE5] rounded bg-white">
              <span className="text-[11px] text-[#596579] block">Execution Events</span>
              <span className="text-lg font-bold font-mono text-[#176B87] block mt-1">184</span>
              <span className="text-[10px] text-[#8A94A6]">Captured from site</span>
            </div>

            <div className="p-3 border border-[#B8DCC9] rounded bg-[#EDF7F2]">
              <span className="text-[11px] text-[#2E7D5B] block font-medium">Verified Updates</span>
              <span className="text-lg font-bold font-mono text-[#2E7D5B] block mt-1">146</span>
              <span className="text-[10px] text-[#2E7D5B]">Committed to twin</span>
            </div>

            <div className="p-3 border border-[#F0D4A6] rounded bg-[#FDF6ED]">
              <span className="text-[11px] text-[#D98B32] block font-medium">Pending Review</span>
              <span className="text-lg font-bold font-mono text-[#D98B32] block mt-1">{reviewEvents.length}</span>
              <span className="text-[10px] text-[#D98B32]">70%–89% band</span>
            </div>

            <div className="p-3 border border-[#D9DEE5] rounded bg-[#F7F8FA]">
              <span className="text-[11px] text-[#596579] block">Unmatched Events</span>
              <span className="text-lg font-bold font-mono text-[#172033] block mt-1">1</span>
              <span className="text-[10px] text-[#8A94A6]">&lt;70% confidence</span>
            </div>

            <div className="p-3 border border-[#E4B0AA] rounded bg-[#FBEFEE]">
              <span className="text-[11px] text-[#B5473C] block font-medium">Delayed Activities</span>
              <span className="text-lg font-bold font-mono text-[#B5473C] block mt-1">3</span>
              <span className="text-[10px] text-[#B5473C]">Critical path lag</span>
            </div>
          </div>
        </div>

        {/* Section 2: PLANNED VS ACTUAL */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Section 2: Planned vs Actual Schedule Progress
              </h3>
              <p className="text-xs text-[#596579] mt-0.5">
                Comparison of planned progress basis against verified actual field execution.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] rounded text-xs font-mono font-bold">
                Classification: Behind Schedule (-7% / +2d Lag)
              </span>
            </div>
          </div>

          {/* Overall Dual Comparison Line */}
          <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg mb-5 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#172033] font-bold">
                Actual Progress: <strong className="text-[#176B87]">{activeProject.overallProgress}%</strong>
              </span>
              <span className="text-[#596579]">
                P6 Baseline Target: <strong>{activeProject.plannedProgress}%</strong>
              </span>
              <span className="text-[#B5473C] font-semibold">
                Variance: {activeProject.variance}% (-2 Days)
              </span>
            </div>
            <ProgressBar
              actual={activeProject.overallProgress}
              planned={activeProject.plannedProgress}
              size="lg"
              status="delayed"
            />
          </div>

          {/* Discipline-by-Discipline Engineering Comparison Visualization */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#596579]">
              Discipline Performance Breakdown
            </h4>

            <div className="space-y-3">
              {disciplineBreakdown.map((item) => (
                <div key={item.name} className="p-3 border border-[#D9DEE5] rounded bg-white text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <span className="font-semibold text-[#172033]">{item.name}</span>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="text-[#596579]">Actual: <strong className="text-[#172033]">{item.actual}%</strong></span>
                      <span className="text-[#8A94A6]">|</span>
                      <span className="text-[#596579]">Planned: {item.planned}%</span>
                      <span className="text-[#8A94A6]">|</span>
                      <span className={item.actual < item.planned ? 'text-[#B5473C] font-bold' : 'text-[#2E7D5B] font-bold'}>
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
          </div>
        </div>

        {/* Section 3: REVIEW REQUIRED */}
        <div id="review-required" className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Section 3: Review Required Queue
                </h3>
                <span className="px-2 py-0.5 bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6] rounded text-xs font-mono font-bold">
                  {reviewEvents.length} Actions Pending
                </span>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                AI matching confidence policy: <strong className="text-[#2E7D5B]">≥90% Auto-Link</strong>, <strong className="text-[#D98B32]">70%–89% Planner Review</strong>, <strong className="text-[#B5473C]">&lt;70% Unmatched</strong>.
              </p>
            </div>
          </div>

          {reviewEvents.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#172033]">All Review Items Cleared</p>
              <p className="text-[11px] text-[#596579]">No unverified execution events in the manager review queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#D9DEE5] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] uppercase font-mono">
                    <th className="px-3.5 py-2.5 font-semibold">Execution Event</th>
                    <th className="px-3.5 py-2.5 font-semibold">Candidate Activity</th>
                    <th className="px-3.5 py-2.5 font-semibold">Confidence</th>
                    <th className="px-3.5 py-2.5 font-semibold">Evidence</th>
                    <th className="px-3.5 py-2.5 font-semibold">Explainable Reason</th>
                    <th className="px-3.5 py-2.5 font-semibold">Status</th>
                    <th className="px-3.5 py-2.5 font-semibold text-right">Manager Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0] text-[#172033]">
                  {reviewEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="px-3.5 py-3 min-w-[200px]">
                        <span className="font-mono text-xs font-bold text-[#596579] block">{evt.id}</span>
                        <p className="text-xs font-medium text-[#172033] mt-0.5 leading-snug">{evt.rawText}</p>
                        <span className="text-[10px] text-[#8A94A6] font-mono mt-0.5 block">{evt.eventDate} • {evt.source}</span>
                      </td>

                      <td className="px-3.5 py-3 min-w-[180px]">
                        {evt.matchedActivityId ? (
                          <>
                            <span className="font-mono text-xs font-bold text-[#176B87] block">
                              {evt.matchedActivityId}
                            </span>
                            <span className="text-xs text-[#172033] leading-tight block">
                              {evt.matchedActivityName}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-[#B5473C] font-semibold italic">
                            No Direct Match Target
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <ConfidenceBadge score={evt.confidence} size="sm" />
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap">
                        {evt.evidenceIds.length > 0 ? (
                          <Link
                            href="/evidence"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#176B87] hover:underline"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
                            <span>{evt.evidenceIds[0]}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#8A94A6]">None</span>
                        )}
                      </td>

                      <td className="px-3.5 py-3 min-w-[180px] text-[11px] text-[#596579]">
                        {evt.matchedReasons && evt.matchedReasons.length > 0
                          ? evt.matchedReasons[0]
                          : 'Awaiting manual match assignment'}
                      </td>

                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <StatusBadge status={evt.status} type="event" size="sm" />
                      </td>

                      <td className="px-3.5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEventForApproval(evt)}
                            className="px-2.5 py-1 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedEventForRejection(evt)}
                            className="px-2 py-1 bg-white hover:bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] text-xs font-medium rounded transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 4: DELAY & DEPENDENCY IMPACT */}
        <div id="delay-impact" className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Section 4: Delay & Downstream Dependency Impact Chain
              </h3>
              <p className="text-xs text-[#596579] mt-0.5">
                Transparent propagation of active schedule slips onto downstream critical activities.
              </p>
            </div>
            <Link
              href="/variance"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Interactive Delay Graph <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {/* Delay Case 1: Line 24-XX Slip */}
            <div className="border border-[#E4B0AA] rounded-lg p-4 bg-[#FBEFEE]/30 space-y-3">
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
                  <span className="text-xs font-mono font-bold text-[#B5473C]">CRITICAL PATH</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Reported Cause</span>
                  <p className="text-[#596579] mt-0.5">Crane mobilization delayed by 2 days due to heavy rain at Unit A laydown.</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Affected Downstream</span>
                  <p className="font-mono text-[#172033] mt-0.5 font-medium">
                    PIP-24-002 (Joint Welds), PIP-24-003 (Hydro-test), INS-04-015
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Schedule Impact</span>
                  <p className="text-[#B5473C] font-semibold mt-0.5">
                    Pushes 150-bar hydrostatic pressure test milestone by +2 days. Zero float.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Owner & Recommended Action</span>
                  <p className="text-[#172033] mt-0.5">
                    <strong>Debajit Borah</strong> (Lead Site Engineer)
                  </p>
                  <span className="text-[11px] text-[#176B87] font-semibold mt-0.5 block">
                    Action: Authorize weekend overtime shift on welding to recover 2 days buffer.
                  </span>
                </div>
              </div>
            </div>

            {/* Delay Case 2: Cable Tray Overhead Slip */}
            <div className="border border-[#F0D4A6] rounded-lg p-4 bg-[#FDF6ED]/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0D4A6]/60">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#D98B32] bg-[#FDF6ED] border border-[#F0D4A6] px-2 py-0.5 rounded">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Reported Cause</span>
                  <p className="text-[#596579] mt-0.5">Overhead steel gallery bracket alignment hold point.</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Affected Downstream</span>
                  <p className="font-mono text-[#172033] mt-0.5 font-medium">INS-04-015 (Smart Transmitters)</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Schedule Impact</span>
                  <p className="text-[#D98B32] font-semibold mt-0.5">
                    Absorbs 1 day of 3-day float buffer. No immediate milestone slip.
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">Owner & Next Action</span>
                  <p className="text-[#172033] mt-0.5"><strong>Debajit Borah</strong></p>
                  <span className="text-[11px] text-[#176B87] font-semibold mt-0.5 block">
                    Action: Accelerate ladder bracket installation with second welding team.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: RECENT FIELD UPDATES */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] mb-4 gap-2">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Section 5: Recent Field Updates & Extraction Stream
              </h3>
              <p className="text-xs text-[#596579] mt-0.5">
                Near real-time stream of parsed site reports, extracted engineering values, and match outcomes.
              </p>
            </div>
            <Link
              href="/field"
              className="text-xs text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
            >
              Field Ingestion Console <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E8EBF0]">
            {MOCK_EXECUTION_EVENTS.map((evt) => (
              <div key={evt.id} className="py-3.5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#176B87] bg-[#EDF2F8] px-2 py-0.5 rounded">
                      {evt.id}
                    </span>
                    <span className="text-xs font-semibold text-[#172033]">{evt.createdBy}</span>
                    <span className="text-[11px] text-[#8A94A6] font-mono">• {evt.eventDate} {evt.eventTime} ({evt.source})</span>
                  </div>

                  <p className="text-xs text-[#172033] font-medium leading-snug">
                    "{evt.rawText}"
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[11px] text-[#596579] font-mono flex-wrap bg-[#F7F8FA] p-2 rounded border border-[#E8EBF0]">
                    <span>Discipline: <strong className="text-[#172033]">{evt.discipline}</strong></span>
                    <span>•</span>
                    <span>Extracted Qty: <strong className="text-[#172033]">{evt.quantity} {evt.unit}</strong></span>
                    <span>•</span>
                    <span>Area/Line: <strong className="text-[#172033]">{evt.area} {evt.line ? `(${evt.line})` : ''}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                  <div className="text-right">
                    <span className="text-[10px] text-[#8A94A6] font-mono block">MATCHED TARGET</span>
                    <span className="font-mono text-xs font-bold text-[#172033] block">
                      {evt.matchedActivityId || 'UNMATCHED'}
                    </span>
                  </div>
                  <ConfidenceBadge score={evt.confidence} size="sm" />
                  <StatusBadge status={evt.status} type="event" size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </StateWrapper>

      {/* Confirmation Dialog: Approve Match */}
      {selectedEventForApproval && (
        <ConfirmationDialog
          isOpen={!!selectedEventForApproval}
          onClose={() => setSelectedEventForApproval(null)}
          onConfirm={() => handleApproveEvent(selectedEventForApproval)}
          title="Approve Schedule Link Commitment"
          message={`Are you sure you want to verify and commit this field progress to activity ${selectedEventForApproval.matchedActivityId}? Actual quantities will update in the Schedule Twin.`}
          variant="primary"
          confirmLabel="Approve & Commit"
        />
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
                onClick={() => setSelectedEventForRejection(null)}
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectEvent}
                className="px-4 py-1.5 text-xs bg-[#B5473C] hover:bg-[#973930] text-white rounded font-medium shadow-xs"
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
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded outline-none focus:border-[#176B87]"
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
