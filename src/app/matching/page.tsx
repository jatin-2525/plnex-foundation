'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { FilterBar } from '../../components/shared/FilterBar';
import { DataTable } from '../../components/shared/DataTable';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { MatchCard, MatchFactorItem, MatchAlternativeItem } from '../../components/shared/MatchCard';
import { CoreFlowBanner } from '../../components/shared/CoreFlowBanner';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { projectService } from '../../lib/api/projectService';
import { MOCK_EXECUTION_EVENTS, MOCK_ACTIVITIES } from '../../lib/api/mockData';
import { ExecutionEvent, ColumnDef } from '../../types';
import { hasPermission } from '../../types/permissions';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  ShieldCheck,
  Check,
  X,
  SlidersHorizontal,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export default function MatchingPage() {
  const { activeProject, userSession, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ExecutionEvent[]>(MOCK_EXECUTION_EVENTS);
  const [activeReviewEvent, setActiveReviewEvent] = useState<ExecutionEvent | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRematchModalOpen, setIsRematchModalOpen] = useState(false);
  const [selectedRematchTarget, setSelectedRematchTarget] = useState<string>('');
  const [rematchReason, setRematchReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const breadcrumbs = [
    { label: 'Schedule Linking' },
    { label: 'Match Engine & Review Queue', current: true },
  ];

  const canApprove = userSession ? hasPermission(userSession.role, 'verify:approve') : false;

  // 1. APPROVE MATCH
  const handleApprove = async (event: ExecutionEvent) => {
    if (!canApprove) {
      addToast({
        type: 'critical',
        title: 'Permission Denied',
        description: 'Only Project Controls Managers can formally approve schedule match commitments.',
      });
      return;
    }

    const res = await projectService.approveMatch(event.id, 'Approved via Planner Review Queue');
    setEvents(events.map((e) => (e.id === event.id ? { ...res.data, status: 'approved' } : e)));
    setActiveReviewEvent(null);
    addToast({
      type: 'success',
      title: 'Match Approved & Committed',
      description: `Verified link to ${event.matchedActivityId}. Progress updated in Schedule Twin.`,
    });
  };

  // 2. REJECT MATCH
  const handleRejectConfirm = async () => {
    if (!activeReviewEvent) return;

    const res = await projectService.rejectMatch(
      activeReviewEvent.id,
      rejectReason || 'Does not correspond to planned schedule scope'
    );

    setEvents(events.map((e) => (e.id === activeReviewEvent.id ? { ...res.data, status: 'rejected' } : e)));
    setIsRejectDialogOpen(false);
    setActiveReviewEvent(null);
    setRejectReason('');
    addToast({
      type: 'warning',
      title: 'Match Rejected',
      description: 'Field update rejected and logged in immutable audit trail.',
    });
  };

  // 3. REMATCH / CHOOSE ANOTHER ACTIVITY
  const handleRematchConfirm = async () => {
    if (!activeReviewEvent || !selectedRematchTarget) return;

    const res = await projectService.rematchEvent(
      activeReviewEvent.id,
      selectedRematchTarget,
      rematchReason || 'Planner reassignment'
    );

    setEvents(events.map((e) => (e.id === activeReviewEvent.id ? res.data : e)));
    setIsRematchModalOpen(false);
    setActiveReviewEvent(null);
    setSelectedRematchTarget('');
    setRematchReason('');
    addToast({
      type: 'info',
      title: 'Activity Reassigned',
      description: `Event linked to ${selectedRematchTarget} with planner justification.`,
    });
  };

  // 4. MARK UNMATCHED
  const handleMarkUnmatched = async (event: ExecutionEvent) => {
    const updated: ExecutionEvent = {
      ...event,
      matchedActivityId: null,
      matchedActivityName: null,
      confidence: 40,
      status: 'pending-verification',
      matchedReasons: ['Marked as unmatched out-of-scope work by reviewer'],
    };

    setEvents(events.map((e) => (e.id === event.id ? updated : e)));
    setActiveReviewEvent(null);
    addToast({
      type: 'info',
      title: 'Marked as Unmatched',
      description: `Event ${event.id} marked as unmatched scope requiring engineering followup.`,
    });
  };

  // Map confidence signals into the 5 explicit scoring factors: Activity keywords, Area / Line, Discipline, Date / Context, Project / WBS
  const getFactorsForEvent = (event: ExecutionEvent): MatchFactorItem[] => {
    const isHigh = event.confidence >= 90;
    const isMed = event.confidence >= 70;

    return [
      {
        name: 'Activity keywords',
        status: isHigh ? 'matched' : isMed ? 'partial' : 'mismatch',
        reason: event.workDescription || 'Action verbs and physical scope nouns evaluated against master schedule',
      },
      {
        name: 'Area / Line',
        status: event.line ? 'matched' : event.area ? 'partial' : 'mismatch',
        reason: event.line
          ? `Exact line identifier verified: ${event.line}`
          : event.area
          ? `Area level alignment: ${event.area}`
          : 'Plant area tag absent from field report',
      },
      {
        name: 'Discipline',
        status: event.discipline ? 'matched' : 'partial',
        reason: `${event.discipline || 'Trade'} discipline evaluated against work package boundary`,
      },
      {
        name: 'Date / Context',
        status: isHigh ? 'matched' : 'partial',
        reason: `Submission date ${event.eventDate} evaluated against planned window`,
      },
      {
        name: 'Project / WBS',
        status: event.matchedActivityId ? 'matched' : 'mismatch',
        reason: event.matchedActivityId
          ? `Mapped to schedule baseline activity ${event.matchedActivityId}`
          : 'No baseline activity corresponds to reported scope',
      },
    ];
  };

  // Map alternatives
  const getAlternativesForEvent = (event: ExecutionEvent): MatchAlternativeItem[] => {
    if (event.alternativeCandidates && event.alternativeCandidates.length > 0) {
      return event.alternativeCandidates.map((c) => ({
        activityId: c.activityId,
        activityName: c.activityName,
        confidence: c.confidence,
        discipline: c.discipline,
        reasons: c.reasons,
      }));
    }

    // Default realistic alternatives when confidence is not high or none given
    if (event.id === 'EVT-2026-001') {
      return [
        {
          activityId: 'PIP-24-002',
          activityName: 'Weld Line 24-XX Field Joints',
          confidence: 71,
          wbs: '1.1.3.2.2',
          reasons: ['Successor activity on same line section'],
        },
        {
          activityId: 'PIP-25-003',
          activityName: 'Erect Line 25-YY Fuel Gas Header',
          confidence: 42,
          wbs: '3.3.1',
          reasons: ['Same discipline, different line number'],
        },
      ];
    }

    if (event.id === 'EVT-2026-002') {
      return [
        {
          activityId: 'PIP-24-001',
          activityName: 'Erect Line 24-XX High Pressure Gas Header',
          confidence: 68,
          wbs: '1.1.3.2.1',
          reasons: ['Predecessor erection already completed'],
        },
        {
          activityId: 'PIP-24-003',
          activityName: 'Hydrostatic Test Section Line 24-XX',
          confidence: 45,
          wbs: '1.1.3.2.3',
          reasons: ['Successor hydrotest requires welding clearance'],
        },
      ];
    }

    return [];
  };

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      search === '' ||
      e.rawText.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase()) ||
      (e.matchedActivityName && e.matchedActivityName.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === '' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnDef<ExecutionEvent>[] = [
    {
      id: 'id',
      header: 'Event ID',
      accessorKey: 'id',
      width: '110px',
      cell: ({ row }) => (
        <span className="font-mono text-xs font-bold text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded">
          {row.id}
        </span>
      ),
    },
    {
      id: 'rawText',
      header: 'Field Execution Report',
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium text-[#172033] leading-snug">{row.rawText}</p>
          <div className="flex items-center gap-2 text-[11px] text-[#596579] font-mono mt-0.5">
            <span>Date: {row.eventDate}</span>
            <span>•</span>
            <span>Discipline: {row.discipline}</span>
            <span>•</span>
            <span>Qty: {row.quantity} {row.unit}</span>
          </div>
        </div>
      ),
    },
    {
      id: 'matchedActivity',
      header: 'Suggested Schedule Activity',
      cell: ({ row }) => (
        <div>
          {row.matchedActivityId ? (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#176B87]">
                {row.matchedActivityId}
              </span>
              <span className="text-xs text-[#172033] truncate">{row.matchedActivityName}</span>
            </div>
          ) : (
            <span className="text-xs text-[#B5473C] font-semibold">Unmatched (Review Needed)</span>
          )}
          {row.matchedReasons && row.matchedReasons.length > 0 && (
            <p className="text-[11px] text-[#596579] italic mt-0.5">{row.matchedReasons[0]}</p>
          )}
        </div>
      ),
    },
    {
      id: 'confidence',
      header: 'AI Confidence',
      width: '140px',
      cell: ({ row }) => (
        <div>
          <ConfidenceBadge score={row.confidence} size="sm" />
          <span className="text-[10px] text-[#7B8798] block mt-0.5">Assistive Score</span>
        </div>
      ),
    },
    {
      id: 'verification',
      header: 'Verification Status',
      width: '150px',
      cell: ({ row }) => {
        const isApproved = row.status === 'approved';
        const isRejected = row.status === 'rejected';
        return (
          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${
                isApproved
                  ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                  : isRejected
                  ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                  : 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span>{isApproved ? 'Verified' : isRejected ? 'Rejected' : 'Pending'}</span>
            </span>
            <span className="text-[10px] text-[#7B8798] block mt-0.5">
              {isApproved ? 'Committed to Twin' : 'Awaiting Review'}
            </span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveReviewEvent(row)}
            className="px-2.5 py-1 bg-[#F1F3F5] hover:bg-[#D9DEE5] text-[#172033] rounded text-xs font-semibold transition-colors"
          >
            Review Match
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Intelligent Activity Matching & Verification"
        description="Connects unstructured site execution statements with exact L5/L6 activities. Uses explainable AI confidence scoring to assist project teams without replacing human engineering judgment."
        stage="MATCH"
        actions={
          <Link
            href="/review"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Open Review Queue</span>
          </Link>
        }
        metadata={
          <>
            <span className="font-mono">GOVERNANCE: Human Decision Gate Active</span>
            <span>•</span>
            <span>POLICY: Confidence ≠ Verification</span>
            <span>•</span>
            <span>CURRENT ROLE: {userSession ? userSession.role.toUpperCase() : 'RESTRICTED'}</span>
          </>
        }
      />

      <StateWrapper>
        {/* Core Flow Pipeline Visualization: Field Input -> Extraction -> Execution Event -> Candidate Match -> Confidence -> Human Verification -> Verified Update */}
        <CoreFlowBanner currentStage="CANDIDATE_MATCH" />

        {/* Verification Policy Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-[#B8DCC9] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2E7D5B] font-mono">≥ 90% High Confidence</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">High-Confidence Suggestion</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Strong alignment across line, area, and discipline. Requires manager approval before schedule commit.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#F0D4A6] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FDF6ED] text-[#D98B32] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#D98B32] font-mono">70% – 89% Review Required</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">Ambiguous / Partial Match</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Partial name alignment or missing parameters. Requires planner review and candidate alternative selection.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4B0AA] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FBEFEE] text-[#B5473C] flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#B5473C] font-mono">&lt; 70% Unmatched / Conflict</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">Manual Scope Resolution</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Reported work not found in baseline WBS. Reviewer can rematch to WBS activity or mark as out-of-scope work.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events by ID, field statement, or target activity..."
          filters={[
            {
              id: 'status',
              label: 'Verification Status',
              selectedValue: statusFilter,
              options: [
                { label: 'Pending Verification', value: 'pending-review' },
                { label: 'Verified & Committed', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ],
            },
          ]}
          onFilterChange={(id, val) => setStatusFilter(val)}
          hasActiveFilters={!!(statusFilter || search)}
          onClearAll={() => {
            setSearch('');
            setStatusFilter('');
          }}
          totalResults={filteredEvents.length}
        />

        {/* Table of Events */}
        <DataTable
          data={filteredEvents}
          columns={columns}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => setActiveReviewEvent(row)}
        />
      </StateWrapper>

      {/* Review Details Drawer using MatchCard Component */}
      {activeReviewEvent && (
        <Drawer
          isOpen={!!activeReviewEvent}
          onClose={() => setActiveReviewEvent(null)}
          title={`Candidate Match Review: ${activeReviewEvent.id}`}
          subtitle={`Submitted on ${activeReviewEvent.eventDate} by ${activeReviewEvent.createdBy}`}
          width="lg"
        >
          <div className="space-y-4">
            <MatchCard
              activityId={activeReviewEvent.matchedActivityId}
              activityName={activeReviewEvent.matchedActivityName}
              confidence={activeReviewEvent.confidence}
              statusText={
                activeReviewEvent.confidence >= 90
                  ? 'High-confidence suggestion'
                  : activeReviewEvent.confidence >= 70
                  ? 'Review-required suggestion'
                  : 'Low-confidence suggestion'
              }
              verificationStatus={
                activeReviewEvent.status === 'approved'
                  ? 'Verified'
                  : activeReviewEvent.status === 'rejected'
                  ? 'Rejected'
                  : 'Pending'
              }
              discipline={activeReviewEvent.discipline}
              area={activeReviewEvent.area}
              line={activeReviewEvent.line}
              fieldStatement={activeReviewEvent.rawText}
              factors={getFactorsForEvent(activeReviewEvent)}
              alternatives={getAlternativesForEvent(activeReviewEvent)}
              onApprove={() => handleApprove(activeReviewEvent)}
              onChooseAnother={() => {
                setSelectedRematchTarget(activeReviewEvent.matchedActivityId || '');
                setIsRematchModalOpen(true);
              }}
              onReject={() => setIsRejectDialogOpen(true)}
              onMarkUnmatched={() => handleMarkUnmatched(activeReviewEvent)}
              onSelectAlternative={(altId) => {
                setSelectedRematchTarget(altId);
                setIsRematchModalOpen(true);
              }}
            />
          </div>
        </Drawer>
      )}

      {/* Reject Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Schedule Activity Match"
        message="Are you sure you want to reject this match recommendation? It will be marked as unlinked and recorded in the audit trail."
        variant="critical"
        confirmLabel="Confirm Rejection"
      />

      {/* Choose Another Activity / Rematch Modal */}
      <Modal
        isOpen={isRematchModalOpen}
        onClose={() => setIsRematchModalOpen(false)}
        title="Choose Another Schedule Activity"
        subtitle="Select a target schedule activity from the master WBS to assign to this field event."
        footer={
          <>
            <button
              onClick={() => setIsRematchModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
            >
              Cancel
            </button>
            <button
              onClick={handleRematchConfirm}
              disabled={!selectedRematchTarget}
              className="px-4 py-2 text-xs font-bold bg-[#176B87] hover:bg-[#135A72] text-white rounded shadow-xs disabled:opacity-50"
            >
              Assign Selected Activity
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-[#172033] block mb-1">Target Schedule Activity (WBS)</label>
            <select
              value={selectedRematchTarget}
              onChange={(e) => setSelectedRematchTarget(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87]"
            >
              <option value="">-- Choose activity from WBS --</option>
              {MOCK_ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.id} — {act.name} ({act.discipline}) [WBS: {act.wbs}]
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-[#172033] block mb-1">Planner Override Justification</label>
            <textarea
              value={rematchReason}
              onChange={(e) => setRematchReason(e.target.value)}
              placeholder="State reason for manual reassignment (e.g., spool scope corresponds to line tie-in)..."
              rows={3}
              className="w-full p-2.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
