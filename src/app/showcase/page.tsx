'use client';

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { ConfidenceBlock } from '../../components/shared/ConfidenceBlock';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingState } from '../../components/shared/LoadingState';
import { ErrorState } from '../../components/shared/ErrorState';
import { ProcessingState } from '../../components/shared/ProcessingState';
import { PermissionDenied } from '../../components/shared/PermissionDenied';
import { Modal } from '../../components/shared/Modal';
import { Drawer } from '../../components/shared/Drawer';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { DataTable } from '../../components/shared/DataTable';
import { FilterBar } from '../../components/shared/FilterBar';
import { MatchExplanation } from '../../components/shared/MatchExplanation';
import { NotificationCenterPanel } from '../../components/shared/NotificationCenterPanel';
import { GlobalSearchPanel } from '../../components/shared/GlobalSearchPanel';
import { CanonicalStateBadge } from '../../components/shared/CanonicalStateBadge';
import { colors } from '../../tokens/colors';
import { typography } from '../../tokens/typography';
import { spacing } from '../../tokens/spacing';
import { PIPELINE_STAGES } from '../../tokens/status';
import {
  Layers,
  Target,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar,
  Eye,
  Bell,
  Search,
  Loader2,
  Inbox,
} from 'lucide-react';

export default function ShowcasePage() {
  const {
    simulatedState,
    setSimulatedState,
    userSession,
    setUserRole,
    openActivityDrawer,
    setGlobalSearchOpen,
  } = useApp();
  const { addToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedExplanationEventId, setSelectedExplanationEventId] = useState<string>('EVT-2026-001');

  const breadcrumbs = [
    { label: 'Foundation' },
    { label: 'Design System & Component Showcase', current: true },
  ];

  if (userSession?.role !== 'admin') {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'System' }, { label: 'Showcase', current: true }]} />
        <PermissionDenied
          requiredPermission="role:admin"
          role={userSession?.role || 'user'}
          message="The PLnEX Foundation Showcase, component catalog, and design system reference are restricted to administrators. Use the deliberate Admin navigation to access developer tools."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Breadcrumbs items={breadcrumbs} />

      <PageHeader
        title="Shared PLnEX Foundation & Design System Showcase"
        description="Comprehensive reference catalog of all centralized tokens, state semantics, and shared components built for serious infrastructure project controls."
        stage="PLAN"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              Open Test Modal
            </button>
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5] rounded-md text-xs font-medium transition-colors"
            >
              Open Test Drawer
            </button>
            <button
              onClick={() => setIsConfirmDialogOpen(true)}
              className="px-3 py-1.5 bg-[#B5473C] hover:bg-[#973930] text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
            >
              Confirm Dialog
            </button>
          </div>
        }
      />

      {/* Interactive State & Role Sandbox Bar */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-3 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-[#176B87]" />
          Interactive State Simulator & RBAC Role Sandbox
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-[11px] font-semibold text-[#596579] block mb-1">
              Test UI State on Current Page:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'success', label: 'Default / Success' },
                { id: 'loading', label: 'Loading State' },
                { id: 'empty', label: 'Empty State' },
                { id: 'error', label: 'Error State' },
                { id: 'processing', label: 'Processing State' },
                { id: 'permission-denied', label: 'Permission Denied' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSimulatedState(s.id as any)}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                    simulatedState === s.id
                      ? 'bg-[#176B87] text-white font-bold'
                      : 'bg-[#F1F3F5] text-[#596579] hover:bg-[#D9DEE5] hover:text-[#172033]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-[#596579] block mb-1">
              Test RBAC Authorization Role:
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'manager', label: 'Project Manager' },
                { id: 'engineer', label: 'Site Engineer' },
                { id: 'admin', label: 'Administrator' },
                { id: 'viewer', label: 'Viewer / Auditor' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setUserRole(r.id as any)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    userSession?.role === r.id
                      ? 'bg-[#176B87] text-white font-bold'
                      : 'bg-[#F1F3F5] text-[#596579] hover:bg-[#D9DEE5]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Core Workflow Stages (PLAN → ACTION) */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
          1. Core PLnEX Value Chain (9 Stages)
        </h3>
        <p className="text-xs text-[#596579] mb-4">
          Strict sequence defined in authoritative engineering specifications connecting planning schedules with actual site execution.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PIPELINE_STAGES.map((st) => (
            <div key={st.key} className="p-3 border border-[#D9DEE5] rounded bg-[#F7F8FA] text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-[#176B87]">
                  {st.stepNumber}. {st.label}
                </span>
              </div>
              <p className="text-[11px] text-[#596579] leading-relaxed">{st.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Semantic Badges (Status, Confidence, Variance) */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
          2. Semantic Status & Confidence Badges
        </h3>

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-semibold text-[#596579] mb-2">The 8 Canonical System Statuses:</h4>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="On Track" />
              <StatusBadge status="At Risk" />
              <StatusBadge status="Delayed" />
              <StatusBadge status="Completed" />
              <StatusBadge status="Blocked" />
              <StatusBadge status="Pending Review" />
              <StatusBadge status="Unmatched" />
              <StatusBadge status="Verified" />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#596579] mb-2">
              Confidence Thresholds (≥90% High Confidence, 70-89% Review Required, &lt;70% Unmatched):
            </h4>
            <div className="flex flex-wrap gap-2">
              <ConfidenceBadge score={94} />
              <ConfidenceBadge score={86} />
              <ConfidenceBadge score={71} />
              <ConfidenceBadge score={42} />
              <ConfidenceBadge score={0} />
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-[#596579]">
              Standardized Confidence Visualizer (Simple text + small indicator + explanation):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-semibold text-[#596579] uppercase block mb-1">State 1: High Confidence</span>
                <ConfidenceBlock score={94} />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#596579] uppercase block mb-1">State 2: Medium Confidence</span>
                <ConfidenceBlock
                  score={71}
                  alternatives={[
                    {
                      activityId: 'PIP-24-002',
                      activityName: 'Line 24 Tie-In Weld Inspection',
                      confidence: 68,
                      reasons: ['Area matches Line 24'],
                    },
                    {
                      activityId: 'PIP-25-001',
                      activityName: 'Erect Line 25 Flare Header Spools',
                      confidence: 45,
                      reasons: ['Alternate piping package'],
                    },
                  ]}
                />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#596579] uppercase block mb-1">State 3: Low Confidence</span>
                <ConfidenceBlock score={42} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#596579] mb-2">Schedule Variance Indicators:</h4>
            <div className="flex flex-wrap gap-2">
              <VarianceBadge daysDelay={-3} />
              <VarianceBadge daysDelay={0} />
              <VarianceBadge daysDelay={1} />
              <VarianceBadge daysDelay={3} />
              <VarianceBadge daysDelay={7} />
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#596579] mb-2">
              Canonical PLnEX Data States (Shared Single Source of Truth):
            </h4>
            <div className="flex flex-wrap gap-2">
              <CanonicalStateBadge state="DRAFT" />
              <CanonicalStateBadge state="PROCESSING" />
              <CanonicalStateBadge state="PENDING_REVIEW" />
              <CanonicalStateBadge state="VERIFIED" />
              <CanonicalStateBadge state="UNMATCHED" />
              <CanonicalStateBadge state="CONFLICT" />
              <CanonicalStateBadge state="DUPLICATE" />
              <CanonicalStateBadge state="STALE" />
              <CanonicalStateBadge state="FAILED" />
              <CanonicalStateBadge state="SYNC_PENDING" />
              <CanonicalStateBadge state="SERVER_CONFIRMED" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Progress Bars */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
          3. Dual Planned vs Actual Progress Bars
        </h3>
        <p className="text-xs text-[#596579] mb-3">
          Displays actual completed percentage alongside baseline planned targets with critical lag detection.
        </p>

        <div className="space-y-4 max-w-xl">
          <div>
            <span className="text-xs text-[#596579] block mb-1">On Track (Actual 75%, Planned 70%):</span>
            <ProgressBar actual={75} planned={70} status="on-track" />
          </div>
          <div>
            <span className="text-xs text-[#596579] block mb-1">At Risk (Actual 40%, Planned 50%):</span>
            <ProgressBar actual={40} planned={50} status="at-risk" />
          </div>
          <div>
            <span className="text-xs text-[#596579] block mb-1">Delayed (Actual 20%, Planned 45%):</span>
            <ProgressBar actual={20} planned={45} status="delayed" />
          </div>
        </div>
      </div>

      {/* 4. Feedback & Overlay Triggers */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
          4. Toast Notifications & System Triggers
        </h3>
        <p className="text-xs text-[#596579] mb-3">
          Trigger system notifications across semantic categories.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() =>
              addToast({
                type: 'success',
                title: 'Schedule Synchronized',
                description: 'Baseline P6 XML import confirmed. 146 activities aligned.',
              })
            }
            className="px-3 py-1.5 bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9] rounded text-xs font-medium"
          >
            Trigger Success Toast
          </button>
          <button
            onClick={() =>
              addToast({
                type: 'warning',
                title: 'Review Required',
                description: 'Field event matched at 86% confidence. Routed to review queue.',
              })
            }
            className="px-3 py-1.5 bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6] rounded text-xs font-medium"
          >
            Trigger Warning Toast
          </button>
          <button
            onClick={() =>
              addToast({
                type: 'critical',
                title: 'Critical Path Delay',
                description: 'Line 24-XX erection +2d slip impacts hydro-test milestone.',
              })
            }
            className="px-3 py-1.5 bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] rounded text-xs font-medium"
          >
            Trigger Critical Toast
          </button>
          <button
            onClick={() =>
              addToast({
                type: 'info',
                title: 'Audit Record Logged',
                description: 'Permanent audit record generated for match approval AUD-003.',
              })
            }
            className="px-3 py-1.5 bg-[#EDF2F8] text-[#3B6EA8] border border-[#B3CBE0] rounded text-xs font-medium"
          >
            Trigger Info Toast
          </button>
        </div>
      </div>

      {/* 5. Centralized Tokens Reference */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033] mb-1">
          5. Design Tokens Catalog (Exact Specification)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3 border border-[#D9DEE5] rounded bg-[#F7F8FA]">
            <span className="font-bold text-[#172033]">Background</span>
            <div className="h-6 w-full bg-[#F7F8FA] border border-[#D9DEE5] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#F7F8FA</code>
          </div>
          <div className="p-3 border border-[#D9DEE5] rounded bg-white">
            <span className="font-bold text-[#172033]">Surface</span>
            <div className="h-6 w-full bg-white border border-[#D9DEE5] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#FFFFFF</code>
          </div>
          <div className="p-3 border border-[#D9DEE5] rounded bg-white">
            <span className="font-bold text-[#172033]">Primary Brand</span>
            <div className="h-6 w-full bg-[#176B87] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#176B87</code>
          </div>
          <div className="p-3 border border-[#D9DEE5] rounded bg-white">
            <span className="font-bold text-[#172033]">Success</span>
            <div className="h-6 w-full bg-[#2E7D5B] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#2E7D5B</code>
          </div>
          <div className="p-3 border border-[#D9DEE5] rounded bg-white">
            <span className="font-bold text-[#172033]">Warning</span>
            <div className="h-6 w-full bg-[#D98B32] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#D98B32</code>
          </div>
          <div className="p-3 border border-[#D9DEE5] rounded bg-white">
            <span className="font-bold text-[#172033]">Critical</span>
            <div className="h-6 w-full bg-[#B5473C] rounded my-1" />
            <code className="text-[10px] text-[#596579]">#B5473C</code>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REUSABLE COMPONENT: PLnEX MATCH EXPLANATION COMPONENT
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Target className="w-4 h-4 text-[#176B87]" />
              <span>Reusable PLnEX Match Explanation Component</span>
            </h3>
            <p className="text-xs text-[#596579]">
              Strictly auditable explainability model. Never shows an unexplained percentage. Decomposes confidence into the 5 explicit signals: Activity keywords, Area / Line, Discipline, Context / Date, and Project / WBS.
            </p>
          </div>
        </div>

        {/* Interactive Scenario Switcher */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
          <span className="text-[11px] font-semibold text-[#596579] uppercase">Test Scenarios:</span>
          {[
            { id: 'EVT-2026-001', label: '94% High Confidence (Erect Spools)', badge: 'Auto-link' },
            { id: 'EVT-2026-002', label: '86% Review Required (Field Welds)', badge: 'Review' },
            { id: 'EVT-2026-003', label: '78% Review Required (Voice Audio)', badge: 'Voice' },
            { id: 'EVT-2026-004', label: '47% Unmatched (Offsite Drain Gap)', badge: 'Unmatched' },
            { id: 'EVT-2026-005', label: '62% Conflict (Weather Stoppage)', badge: 'Conflict' },
            { id: 'EVT-2026-006', label: '96% Approved (Compressor Pour)', badge: 'Approved' },
          ].map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => setSelectedExplanationEventId(sc.id)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                selectedExplanationEventId === sc.id
                  ? 'bg-[#176B87] text-white border-[#176B87] shadow-xs'
                  : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
              }`}
            >
              <span>{sc.label}</span>
            </button>
          ))}
        </div>

        {/* Live MatchExplanation Component */}
        <MatchExplanation
          eventId={selectedExplanationEventId}
          onOpenActivity={(actId) => openActivityDrawer(actId)}
          onSelectAlternative={(altId) => {
            addToast({
              type: 'info',
              title: 'Alternative Selected',
              description: `User selected candidate activity ${altId} as manual rematch target.`,
            });
          }}
        />
      </div>

      {/* =========================================================================
          REUSABLE COMPONENT: PLnEX NOTIFICATION CENTER
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#176B87]" />
            <span>Reusable PLnEX Notification Center</span>
          </h3>
          <p className="text-xs text-[#596579]">
            Enterprise operational alerts with zero decorative notifications. Covers all 8 project controls types: New review required, Activity delayed, Dependency impacted, Match conflict, DPR confirmation required, Evidence uploaded, Processing failed, and Sync conflict. Clicking opens the relevant PLnEX page or drawer.
          </p>
        </div>

        {/* Live Notification Center Panel */}
        <NotificationCenterPanel />
      </div>

      {/* =========================================================================
          REUSABLE COMPONENT: PLnEX GLOBAL UNIVERSAL SEARCH
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#176B87]" />
              <span>Reusable PLnEX Global Search (Ctrl/Cmd + K)</span>
            </h3>
            <p className="text-xs text-[#596579]">
              Indexed across all 7 project data stores: Projects, Activities, Execution Events, Evidence, Review Items, Risks, and Reports. Displays Type, ID, Title, Project, and Status for each entity with deep drawer and route routing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setGlobalSearchOpen(true)}
            className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2 transition-colors shadow-xs"
          >
            <span>Trigger Global Modal (⌘K)</span>
          </button>
        </div>

        {/* Live Embedded Global Search Panel */}
        <GlobalSearchPanel />
      </div>

      {/* =========================================================================
          REUSABLE SYSTEM: RESTRAINED LOADING INDICATORS
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-[#176B87]" />
            <span>Restrained Loading Indicators (Communicates Status Without Decoration)</span>
          </h3>
          <p className="text-xs text-[#596579] mt-1">
            Simple restrained indicators. Zero animated decorative skeletons, zero pulsing cards, zero animated dashboard elements, and zero unnecessary spinners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-[#596579] uppercase block mb-1.5 font-mono">
              Schedule Subsystem
            </span>
            <LoadingState message="Loading schedule..." />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#596579] uppercase block mb-1.5 font-mono">
              Execution Subsystem
            </span>
            <LoadingState message="Loading execution events..." />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#596579] uppercase block mb-1.5 font-mono">
              Reporting Subsystem
            </span>
            <LoadingState message="Preparing report..." />
          </div>
        </div>
      </div>

      {/* =========================================================================
          REUSABLE SYSTEM: STANDARDIZED EMPTY STATES
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#176B87]" />
            <span>Standardized Empty States (3-Part Explanation + Single Action)</span>
          </h3>
          <p className="text-xs text-[#596579] mt-1">
            Eliminates vague empty messages. Always explains: 1. What is missing? 2. Why? 3. What can the user do? Zero decorative illustrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No execution events yet"
            description="Field reports submitted for this project will appear here after processing. Submit a daily field report or adjust active filters."
            action={{
              label: 'View Execution Feed',
              onClick: () => addToast({ type: 'info', title: 'Navigation', description: 'Navigating to execution feed.' }),
            }}
          />
          <EmptyState
            title="No schedule activities match your filters"
            description="No activities match the current WBS or status selection. Reset your filter criteria to inspect the full schedule baseline."
            action={{
              label: 'Reset All Filters',
              onClick: () => addToast({ type: 'info', title: 'Filters Reset', description: 'Filters restored to defaults.' }),
            }}
          />
        </div>
      </div>

      {/* =========================================================================
          REUSABLE SYSTEM: STANDARDIZED ERROR STATES
          ========================================================================= */}
      <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#B5473C]" />
            <span>Standardized Error States (What Happened + What User Can Do + Retry)</span>
          </h3>
          <p className="text-xs text-[#596579] mt-1">
            Consistent restrained error styling. Zero giant red screens and zero dramatic illustrations. Every major error explicitly communicates: 1. What happened, 2. What the user can do, paired with an accessible Retry action.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ErrorState
            title="Schedule could not be displayed."
            message="The schedule data is temporarily unavailable. Check your network connection or retry the operation."
            code="ERR_SCHEDULE_UNAVAILABLE"
            onRetry={() => addToast({ type: 'info', title: 'Retry Triggered', description: 'Re-attempting schedule data fetch.' })}
            retryLabel="Retry"
          />
          <ErrorState
            title="Execution events could not be displayed."
            message="The execution feed is temporarily unavailable. Check connection parameters or retry the operation."
            code="ERR_EXECUTION_FEED_UNAVAILABLE"
            onRetry={() => addToast({ type: 'info', title: 'Retry Triggered', description: 'Re-attempting execution feed fetch.' })}
            retryLabel="Retry"
          />
        </div>
      </div>

      {/* Modal Preview */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Engineering Modal Component"
        subtitle="Restrained white surface, 8-12px radius, zero glassmorphism or neon."
        footer={
          <button
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-1.5 bg-[#176B87] text-white text-xs font-semibold rounded"
          >
            Close Modal
          </button>
        }
      >
        <p className="text-xs text-[#596579] leading-relaxed">
          Standard enterprise modal dialog for schedule configuration, evidence attachment, and manual activity rematches.
        </p>
      </Modal>

      {/* Drawer Preview */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Schedule Detail Drawer"
        subtitle="Side slide-over inspection panel"
        footer={
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="px-4 py-1.5 bg-[#176B87] text-white text-xs font-semibold rounded"
          >
            Dismiss
          </button>
        }
      >
        <p className="text-xs text-[#596579]">
          The drawer allows inspecting rich data like L1–L6 WBS hierarchies, predecessor graphs, and linked evidence photos without losing table context.
        </p>
      </Drawer>

      {/* Confirmation Dialog Preview */}
      <ConfirmationDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={() => {
          setIsConfirmDialogOpen(false);
          addToast({ type: 'critical', title: 'Action Confirmed', description: 'Schedule override recorded.' });
        }}
        title="Commit Schedule Override"
        message="This will update baseline finish dates and re-trigger downstream CPM calculations. Proceed?"
        variant="critical"
        confirmLabel="Confirm Schedule Override"
      />
    </div>
  );
}
