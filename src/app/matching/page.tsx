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
import { MatchExplanation } from '../../components/shared/MatchExplanation';
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

  const canApprove = hasPermission(userSession.role, 'verify:approve');

  const handleApprove = async (event: ExecutionEvent) => {
    if (!canApprove) {
      addToast({
        type: 'critical',
        title: 'Permission Denied',
        description: 'Only Project Managers can approve schedule link commitments.',
      });
      return;
    }

    const res = await projectService.approveMatch(event.id, 'Approved via Planner Review Queue');
    setEvents(events.map((e) => (e.id === event.id ? res.data : e)));
    setActiveReviewEvent(null);
    addToast({
      type: 'success',
      title: 'Match Approved & Committed',
      description: `Execution event linked to ${event.matchedActivityId}. Progress updated in Schedule Twin.`,
    });
  };

  const handleRejectConfirm = async () => {
    if (!activeReviewEvent) return;

    const res = await projectService.rejectMatch(
      activeReviewEvent.id,
      rejectReason || 'Does not correspond to planned schedule scope'
    );

    setEvents(events.map((e) => (e.id === activeReviewEvent.id ? res.data : e)));
    setIsRejectDialogOpen(false);
    setActiveReviewEvent(null);
    setRejectReason('');
    addToast({
      type: 'warning',
      title: 'Match Rejected',
      description: 'Field update rejected and logged in immutable audit trail.',
    });
  };

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
      title: 'Activity Rematched',
      description: `Event reassigned to ${selectedRematchTarget} with planner justification.`,
    });
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
        <span className="font-mono text-xs font-bold text-[#596579] bg-[#F0F2F5] px-2 py-0.5 rounded">
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
      header: 'Matched Schedule Activity',
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
      header: 'AI Confidence Score',
      width: '150px',
      cell: ({ row }) => <ConfidenceBadge score={row.confidence} size="sm" />,
    },
    {
      id: 'status',
      header: 'Workflow Status',
      width: '150px',
      cell: ({ row }) => <StatusBadge status={row.status} type="event" size="sm" />,
    },
    {
      id: 'actions',
      header: 'Planner Action',
      width: '130px',
      align: 'right',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setActiveReviewEvent(row)}
            className="px-2.5 py-1 bg-[#F0F2F5] hover:bg-[#E8EBF0] text-[#172033] rounded text-xs font-medium transition-colors"
          >
            Review Details
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Intelligent Activity Matching & Verification Queue"
        description="Connects unstructured site execution statements with exact L5/L6 activities. Uses explainable AI confidence scoring (≥90% Auto-link, 70–89% Planner Review, <70% Unmatched) to ensure wrong schedule updates never pass silently."
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
            <span className="font-mono">THRESHOLD POLICY: ≥90% Auto | 70-89% Review | &lt;70% Flagged</span>
            <span>•</span>
            <span>REVIEW QUEUE: 2 Pending Items</span>
            <span>•</span>
            <span>CURRENT ROLE: {userSession.role.toUpperCase()}</span>
          </>
        }
      />

      <StateWrapper>
        {/* Verification Policy Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-[#B8DCC9] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#EDF7F2] text-[#2E7D5B] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#2E7D5B] font-mono">≥ 90% High Confidence</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">Automatic Schedule Link</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Exact line/component tags, discipline alignment, and verified temporal window.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#F0D4A6] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FDF6ED] text-[#D98B32] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#D98B32] font-mono">70% – 89% Review Required</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">Routed to Planner Queue</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Partial name alignment or scope ambiguity requiring human engineer confirmation.
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E4B0AA] rounded-lg p-3.5 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FBEFEE] text-[#B5473C] flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#B5473C] font-mono">&lt; 70% Unmatched / Conflict</span>
              <p className="text-xs text-[#172033] font-medium mt-0.5">Manual Resolution</p>
              <p className="text-[11px] text-[#596579] mt-0.5">
                Work report not found in current baseline WBS. Option to rematch or reject.
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search review queue by event ID, statement, or target activity..."
          filters={[
            {
              id: 'status',
              label: 'Match Status',
              selectedValue: statusFilter,
              options: [
                { label: 'Auto Linked', value: 'auto-linked' },
                { label: 'Pending Review', value: 'pending-review' },
                { label: 'Pending Verification', value: 'pending-verification' },
                { label: 'Approved', value: 'approved' },
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

      {/* Review Details Drawer */}
      {activeReviewEvent && (
        <Drawer
          isOpen={!!activeReviewEvent}
          onClose={() => setActiveReviewEvent(null)}
          title={`Review Match: ${activeReviewEvent.id}`}
          subtitle={`Reported on ${activeReviewEvent.eventDate} by ${activeReviewEvent.createdBy}`}
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setIsRejectDialogOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-[#B5473C] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-md transition-colors"
              >
                Reject Match
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRematchModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-[#172033] bg-white hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-md transition-colors"
                >
                  Choose Another Activity
                </button>
                <button
                  onClick={() => handleApprove(activeReviewEvent)}
                  className="px-4 py-1.5 text-xs font-medium bg-[#176B87] hover:bg-[#135A72] text-white rounded-md shadow-xs transition-colors"
                >
                  Approve & Commit Update
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Field Statement Box */}
            <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3.5">
              <div className="flex items-center justify-between mb-1 text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                <span>Original Field Statement</span>
                <span className="font-mono">{activeReviewEvent.source}</span>
              </div>
              <p className="text-xs text-[#172033] font-medium leading-relaxed">
                "{activeReviewEvent.rawText}"
              </p>
            </div>

            {/* Full Deterministic Match Explanation */}
            <MatchExplanation
              eventId={activeReviewEvent.id}
              onSelectAlternative={(candId) => {
                setSelectedRematchTarget(candId);
                setIsRematchModalOpen(true);
              }}
              onOpenActivity={(actId) => openActivityDrawer(actId)}
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

      {/* Manual Rematch Modal */}
      <Modal
        isOpen={isRematchModalOpen}
        onClose={() => setIsRematchModalOpen(false)}
        title="Manual Activity Reassignment (Rematch)"
        subtitle="Select a target schedule activity from the project WBS to re-link this field event."
        footer={
          <>
            <button
              onClick={() => setIsRematchModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
            >
              Cancel
            </button>
            <button
              onClick={handleRematchConfirm}
              disabled={!selectedRematchTarget}
              className="px-4 py-2 text-xs font-medium bg-[#176B87] hover:bg-[#135A72] text-white rounded shadow-xs disabled:opacity-50"
            >
              Confirm Rematch & Update
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-[#172033] block mb-1">Select Schedule Activity</label>
            <select
              value={selectedRematchTarget}
              onChange={(e) => setSelectedRematchTarget(e.target.value)}
              className="w-full p-2 text-xs bg-white border border-[#D9DEE5] rounded outline-none focus:border-[#176B87]"
            >
              <option value="">-- Choose activity from WBS --</option>
              {MOCK_ACTIVITIES.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.id} — {act.name} ({act.discipline})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-[#172033] block mb-1">Planner Justification / Note</label>
            <textarea
              value={rematchReason}
              onChange={(e) => setRematchReason(e.target.value)}
              placeholder="Provide reason for manual override (e.g., spool scope matches tie-in section)..."
              rows={2}
              className="w-full p-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded outline-none focus:border-[#176B87]"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
