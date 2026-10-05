'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StatusBadge } from './StatusBadge';
import { VarianceBadge } from './VarianceBadge';
import { ProgressBar } from './ProgressBar';
import { ConfidenceBadge } from './ConfidenceBadge';
import { MatchExplanation } from './MatchExplanation';
import {
  getEnrichedActivityDetail,
  ActivityDrawerTab,
  EnrichedActivityDetail,
  WBSHierarchyStep,
} from '../../lib/domain/activityDetailData';
import {
  X,
  Layers,
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  Cpu,
  ShieldCheck,
  GitBranch,
  History,
  Plus,
  ArrowRight,
  ExternalLink,
  Camera,
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sliders,
  ChevronRight,
  Building2,
  HardHat,
  Lock,
  ArrowUpRight,
  Maximize2,
  FolderKanban,
  FileSpreadsheet,
  Info,
  Check,
  RefreshCw,
  Eye,
  Hash,
} from 'lucide-react';

export interface ActivityDetailDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  activityId?: string | null;
  initialTab?: ActivityDrawerTab;
}

export function ActivityDetailDrawer({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  activityId: propsActivityId,
  initialTab: propsInitialTab,
}: ActivityDetailDrawerProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const {
    activityDrawerActivityId,
    activityDrawerTab,
    closeActivityDrawer,
    openActivityDrawer,
  } = useApp();

  // Determine effective control mode
  const isControlledByProps = propsIsOpen !== undefined;
  const isOpen = isControlledByProps ? Boolean(propsIsOpen) : Boolean(activityDrawerActivityId);
  const effectiveActivityId = isControlledByProps ? propsActivityId : activityDrawerActivityId;
  const handleClose = isControlledByProps ? (propsOnClose || (() => {})) : closeActivityDrawer;

  // Active Tab state
  const [activeTab, setActiveTab] = useState<ActivityDrawerTab>('overview');

  // Preview state for evidence item modal inside drawer
  const [previewEvidenceModal, setPreviewEvidenceModal] = useState<any | null>(null);

  // Expanded Match Explanation event ID
  const [expandedMatchEventId, setExpandedMatchEventId] = useState<string | null>(null);

  // Sync initial tab when drawer opens or updates
  useEffect(() => {
    if (isOpen) {
      if (propsInitialTab) {
        setActiveTab(propsInitialTab);
      } else if (activityDrawerTab) {
        setActiveTab(activityDrawerTab);
      } else {
        setActiveTab('overview');
      }
    }
  }, [isOpen, propsInitialTab, activityDrawerTab, effectiveActivityId]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClose]);

  // Retrieve enriched activity detail data
  const data: EnrichedActivityDetail | null = useMemo(() => {
    if (!effectiveActivityId) return null;
    return getEnrichedActivityDetail(effectiveActivityId);
  }, [effectiveActivityId]);

  if (!isOpen || !effectiveActivityId || !data) return null;

  const {
    activity,
    projectName,
    projectCode,
    location,
    hierarchy,
    linkedExecutionEvents,
    linkedEvidenceItems,
    detailedPredecessors,
    detailedSuccessors,
    impactData,
    auditHistory,
  } = data;

  // Discipline color theme
  const getDisciplineTheme = (disc: string) => {
    switch (disc) {
      case 'Piping':
        return { bg: 'bg-[#EDF5F8]', text: 'text-[#176B87]', border: 'border-[#B3CBE0]' };
      case 'Civil':
        return { bg: 'bg-[#FDF6ED]', text: 'text-[#D98B32]', border: 'border-[#F0D4A6]' };
      case 'Mechanical':
        return { bg: 'bg-[#EDF5F8]', text: 'text-[#3B6EA8]', border: 'border-[#B3CBE0]' };
      case 'Electrical':
        return { bg: 'bg-[#EDF7F2]', text: 'text-[#2E7D5B]', border: 'border-[#B8DCC9]' };
      case 'Instrumentation':
        return { bg: 'bg-[#FBEFEE]', text: 'text-[#B5473C]', border: 'border-[#E4B0AA]' };
      default:
        return { bg: 'bg-[#F1F3F5]', text: 'text-[#596579]', border: 'border-[#D9DEE5]' };
    }
  };

  const discTheme = getDisciplineTheme(activity.discipline);

  // Tab definitions with dynamic badge counts
  const TABS: Array<{ id: ActivityDrawerTab; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'plan-vs-actual', label: 'Plan vs Actual', icon: Calendar },
    { id: 'execution', label: 'Execution', icon: Cpu, count: linkedExecutionEvents.length },
    { id: 'evidence', label: 'Evidence', icon: Camera, count: linkedEvidenceItems.length },
    {
      id: 'dependencies',
      label: 'Dependencies',
      icon: GitBranch,
      count: detailedPredecessors.length + detailedSuccessors.length,
    },
    { id: 'history', label: 'History', icon: History, count: auditHistory.length },
  ];

  // Action handlers
  const handleCaptureUpdate = () => {
    handleClose();
    router.push(`/field/capture?activityId=${encodeURIComponent(activity.id)}`);
    addToast({
      type: 'info',
      title: 'Field Quick Capture',
      description: `Opened quick capture entry for activity ${activity.id}.`,
    });
  };

  const handleReviewMatch = () => {
    handleClose();
    router.push(`/review?activityId=${encodeURIComponent(activity.id)}`);
    addToast({
      type: 'info',
      title: 'Review Queue',
      description: `Navigating to match review queue for activity ${activity.id}.`,
    });
  };

  const handleOpenEvidence = () => {
    // If not on evidence tab, switch to it, or user can click out to /evidence
    setActiveTab('evidence');
  };

  const handleViewDependencyImpact = () => {
    // Switch to dependencies tab
    setActiveTab('dependencies');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#172033]/50 transition-opacity animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Container: Fullscreen sheet on mobile, slide-over drawer on tablet/desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex sm:pl-10 z-10">
        <div className="w-full sm:w-screen sm:max-w-3xl h-full bg-white sm:border-l border-[#D9DEE5] shadow-lg flex flex-col transform transition-transform duration-150">
          
          {/* =========================================================================
              HEADER:
              - Activity ID
              - Activity Name
              - Status
              ========================================================================= */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#D9DEE5] bg-white flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Activity ID */}
                  <span className="font-mono font-bold text-base sm:text-lg text-[#176B87] tracking-tight bg-[#EDF5F8] px-2.5 py-0.5 rounded border border-[#B3CBE0]">
                    {activity.id}
                  </span>

                  {/* Critical Path Badge */}
                  {activity.isCritical && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] uppercase tracking-wider inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Critical Path (Float: 0d)</span>
                    </span>
                  )}

                  {/* Status Badge */}
                  <StatusBadge status={activity.status as any} />

                  {/* Discipline Pill */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${discTheme.bg} ${discTheme.text} ${discTheme.border}`}
                  >
                    {activity.discipline}
                  </span>
                </div>

                {/* Activity Name */}
                <h2 className="text-base sm:text-lg font-bold text-[#172033] leading-snug break-words">
                  {activity.name}
                </h2>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-lg transition-colors -mr-1 flex-shrink-0 cursor-pointer"
                aria-label="Close activity detail drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Context Subhead */}
            <div className="flex items-center gap-3 text-xs text-[#596579] font-mono flex-wrap pt-0.5">
              <span>WBS: <strong className="text-[#172033]">{activity.wbs}</strong> ({activity.wbsLevel})</span>
              <span>•</span>
              <span className="truncate max-w-[280px]">Area: <strong className="text-[#172033]">{activity.area}</strong></span>
              {activity.line && (
                <>
                  <span>•</span>
                  <span>Line: <strong className="text-[#172033]">{activity.line}</strong></span>
                </>
              )}
            </div>

            {/* Advanced Schedule Metadata Strip (Moved from Default Table) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-2 border-t border-[#D9DEE5] text-[11px] font-mono">
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">WBS</span>
                <span className="text-[#172033] font-semibold truncate block">{activity.wbs}</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">Actual Start</span>
                <span className="text-[#172033] font-semibold truncate block">{activity.actualStart || 'Pending'}</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">Actual Finish</span>
                <span className="text-[#172033] font-semibold truncate block">{activity.actualFinish || 'In Progress'}</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">Dependencies</span>
                <span className="text-[#176B87] font-semibold truncate block">{detailedPredecessors.length + detailedSuccessors.length} links</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">Evidence</span>
                <span className="text-[#2E7D5B] font-semibold truncate block">{linkedEvidenceItems.length} items</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">Execution Events</span>
                <span className="text-[#176B87] font-semibold truncate block">{linkedExecutionEvents.length} events</span>
              </div>
              <div className="px-2 py-1 bg-[#F7F8FA] rounded border border-[#D9DEE5]">
                <span className="text-[9px] text-[#7B8798] uppercase font-bold block">History</span>
                <span className="text-[#596579] font-semibold truncate block">{auditHistory.length} logs</span>
              </div>
            </div>
          </div>

          {/* =========================================================================
              NAVIGATION TABS:
              Overview | Plan vs Actual | Execution | Evidence | Dependencies | History
              ========================================================================= */}
          <div className="px-6 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center gap-1 overflow-x-auto scrollbar-none">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-3 px-3.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#176B87] text-[#176B87] bg-white rounded-t-md font-bold'
                      : 'border-transparent text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive
                          ? 'bg-[#176B87] text-white'
                          : 'bg-[#D9DEE5] text-[#596579]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* =========================================================================
              BODY CONTENT (Tab Switcher)
              ========================================================================= */}
          <div className="flex-1 px-6 py-5 overflow-y-auto text-[#172033] text-xs space-y-6">
            
            {/* ---------------------------------------------------------------------
                TAB 1: OVERVIEW (Project, L1–L6 hierarchy, WBS, Area, Discipline)
                --------------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Project Context Card */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#176B87]" />
                      Project Master Information
                    </span>
                    <span className="font-mono text-[11px] text-[#176B87] font-semibold">
                      {projectCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#7B8798] block text-[10px] uppercase font-bold">Project Name</span>
                      <strong className="text-[#172033]">{projectName}</strong>
                    </div>
                    <div>
                      <span className="text-[#7B8798] block text-[10px] uppercase font-bold">Field Location</span>
                      <span className="text-[#172033]">{location}</span>
                    </div>
                    <div>
                      <span className="text-[#7B8798] block text-[10px] uppercase font-bold">Assigned Lead Engineer</span>
                      <span className="font-semibold text-[#176B87] flex items-center gap-1">
                        <HardHat className="w-3 h-3" />
                        {activity.assignedEngineer}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7B8798] block text-[10px] uppercase font-bold">Active Schedule Baseline</span>
                      <span className="font-mono text-[#596579]">V3 · Rev 3.2 (Primavera P6 XML)</span>
                    </div>
                  </div>
                </div>

                {/* L1–L6 Hierarchy Stepper */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      L1–L6 Work Breakdown Hierarchy
                    </h3>
                    <span className="text-[11px] text-[#7B8798] font-mono">6 Levels Defined</span>
                  </div>

                  <div className="space-y-2 border border-[#D9DEE5] rounded-lg p-3 bg-white divide-y divide-[#D9DEE5]">
                    {hierarchy.map((step) => {
                      const isTarget = step.isCurrent;
                      return (
                        <div
                          key={step.level}
                          className={`pt-2.5 first:pt-0 pb-2.5 last:pb-0 flex items-start gap-3 transition-colors ${
                            isTarget ? 'bg-[#EDF5F8]/40 -mx-1 px-2 rounded-lg' : ''
                          }`}
                        >
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border flex-shrink-0 mt-0.5 ${
                              isTarget
                                ? 'bg-[#176B87] text-white border-[#176B87]'
                                : 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]'
                            }`}
                          >
                            {step.level}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-semibold text-[#172033]">
                                {step.code}
                              </span>
                              <span className="text-[10px] text-[#7B8798] font-medium uppercase">
                                {step.category}
                              </span>
                            </div>
                            <p
                              className={`text-xs mt-0.5 ${
                                isTarget ? 'font-bold text-[#176B87]' : 'text-[#596579]'
                              }`}
                            >
                              {step.name}
                            </p>
                          </div>

                          {isTarget && (
                            <span className="text-[10px] font-bold text-[#176B87] bg-[#EDF5F8] border border-[#B3CBE0] px-2 py-0.5 rounded">
                              Current Activity
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Classification Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* WBS & Classification Card */}
                  <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
                      WBS &amp; Discipline Classification
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">WBS Code:</span>
                        <strong className="font-mono text-[#172033]">{activity.wbs}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">Hierarchy Tier:</span>
                        <span className="font-mono font-bold text-[#176B87]">
                          {activity.wbsLevel} (Discrete Activity)
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">Engineering Discipline:</span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${discTheme.bg} ${discTheme.text} ${discTheme.border}`}
                        >
                          {activity.discipline}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#596579]">Critical Path:</span>
                        <strong className={activity.isCritical ? 'text-[#B5473C]' : 'text-[#2E7D5B]'}>
                          {activity.isCritical ? 'Yes (Zero Float)' : 'No (Float Available)'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Area & Asset Location Card */}
                  <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
                      Asset Location &amp; Tags
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">Asset Area:</span>
                        <strong className="text-[#172033]">{activity.area}</strong>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">Line / Equipment:</span>
                        <span className="font-mono font-bold text-[#176B87]">
                          {activity.line || 'Not Tagged'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]">
                        <span className="text-[#596579]">Physical Grid:</span>
                        <span className="font-mono text-[#596579]">Grid B-14 to B-20 (Rack B)</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#596579]">Quantity Target:</span>
                        <span className="font-mono font-bold text-[#172033]">
                          {activity.plannedQuantity} {activity.unit}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scope Description */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
                    Engineering Scope Description
                  </span>
                  <p className="text-xs text-[#172033] leading-relaxed">
                    {activity.description || 'No detailed scope description registered.'}
                  </p>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 2: PLAN VS ACTUAL (planned/actual start/finish, planned/actual progress, variance)
                --------------------------------------------------------------------- */}
            {activeTab === 'plan-vs-actual' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Progress & Variance Big Banner */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                        Progress &amp; Schedule Variance
                      </span>
                      <div className="flex items-baseline gap-3 mt-1">
                        <span className="text-2xl font-black text-[#172033] font-mono">
                          {activity.verifiedActualProgress !== undefined ? activity.verifiedActualProgress : activity.actualProgress}%
                        </span>
                        <span className="text-xs text-[#596579] font-mono">
                          Planned Target: <strong>{activity.plannedProgress}%</strong>
                        </span>
                      </div>
                      {activity.progressHistory && activity.progressHistory.length > 1 && (
                        <p className="text-[11px] text-[#596579] font-mono mt-1">
                          Authoritative: <strong>{activity.progressHistory[activity.progressHistory.length - 1].progress}% as of {activity.progressHistory[activity.progressHistory.length - 1].formattedAsOf}</strong> ({activity.progressHistory[activity.progressHistory.length - 2].progress}% as of {activity.progressHistory[activity.progressHistory.length - 2].formattedAsOf})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <VarianceBadge daysDelay={activity.delayDays} />
                      {activity.delayDays > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] text-[#B5473C] text-xs font-mono font-bold">
                          +{activity.delayDays}d Slip
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual ProgressBar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-[#596579]">
                      <span>Execution Completion vs Planned Baseline</span>
                      <span className="font-mono font-semibold text-[#172033]">
                        {activity.actualProgress}% / {activity.plannedProgress}%
                      </span>
                    </div>
                    <ProgressBar
                      actual={activity.actualProgress}
                      planned={activity.plannedProgress}
                      size="md"
                      showLabels={false}
                    />
                  </div>
                </div>

                {/* Planned vs Actual Milestone Dates Grid */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Baseline Schedule Dates vs Field Execution Timestamps
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Planned Schedule (P6 Baseline) */}
                    <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-3">
                      <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-2">
                        <span className="text-[11px] font-bold uppercase text-[#596579]">
                          P6 Planned Baseline
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[10px] font-mono text-[#596579]">
                          V3 · Rev 3.2
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Planned Start:</span>
                          <strong className="font-mono text-[#172033]">{activity.plannedStart}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Planned Finish:</span>
                          <strong className="font-mono text-[#172033]">{activity.plannedFinish}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Planned Target:</span>
                          <span className="font-mono text-[#172033] font-bold">{activity.plannedProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Planned Quantity:</span>
                          <span className="font-mono text-[#596579]">
                            {activity.plannedQuantity} {activity.unit}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actual Field Execution */}
                    <div className="p-4 bg-white border border-[#176B87]/30 rounded-lg space-y-3 bg-[#EDF5F8]/20">
                      <div className="flex items-center justify-between border-b border-[#176B87]/20 pb-2">
                        <span className="text-[11px] font-bold uppercase text-[#176B87]">
                          Field Execution (Verified)
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#EDF5F8] text-[10px] font-mono text-[#176B87] font-bold">
                          Site Ledgers
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Actual Start:</span>
                          <strong className="font-mono text-[#172033]">
                            {activity.actualStart || 'Pending Start'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Actual / Forecast Finish:</span>
                          <strong
                            className={`font-mono ${
                              activity.actualFinish ? 'text-[#2E7D5B]' : 'text-[#B5473C]'
                            }`}
                          >
                            {activity.actualFinish || 'In Progress (Forecast 20 Sep)'}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Actual Progress:</span>
                          <span className="font-mono text-[#176B87] font-bold">{activity.actualProgress}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#596579]">Executed Quantity:</span>
                          <span className="font-mono font-bold text-[#176B87]">
                            {activity.actualQuantity} of {activity.plannedQuantity} {activity.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variance Diagnostics */}
                {activity.variance < 0 && (
                  <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-[#B5473C] font-bold">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>Physical Variance Analysis ({activity.variance}%)</span>
                    </div>
                    <p className="text-xs text-[#8A382F] leading-relaxed">
                      Actual progress ({activity.actualProgress}%) is currently trailing behind the planned target ({activity.plannedProgress}%) by {Math.abs(activity.variance)}%. Driving factor: heavy monsoon rainfall at Unit A suspended welding operations for 2 days; radiographic inspection crew rescheduled.
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-[#8A382F]">
                      <span>Delay Magnitude: +{activity.delayDays} days</span>
                      <span>Mitigation Status: In Progress</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 3: EXECUTION (linked Execution Events)
                --------------------------------------------------------------------- */}
            {activeTab === 'execution' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" />
                      Linked Field Execution Events ({linkedExecutionEvents.length})
                    </h3>
                    <p className="text-[11px] text-[#596579] mt-0.5">
                      Field reports and daily statements mapped to this schedule activity.
                    </p>
                  </div>

                  <Link
                    href={`/execution`}
                    className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                  >
                    <span>View all in Execution Intel</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {linkedExecutionEvents.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[#D9DEE5] rounded-lg space-y-2 bg-[#F7F8FA]">
                    <Cpu className="w-6 h-6 text-[#7B8798] mx-auto" />
                    <p className="text-xs font-bold text-[#172033]">No execution events matched yet</p>
                    <p className="text-[11px] text-[#596579]">
                      Submit daily updates from Field Ingestion or review matches in Review Queue.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedExecutionEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-3 hover:border-[#176B87] transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                              {evt.id}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5] uppercase">
                              {evt.source.replace('_', ' ')}
                            </span>
                            <ConfidenceBadge score={evt.confidence} />
                          </div>

                          <div className="flex items-center gap-1 text-[11px] text-[#7B8798] font-mono">
                            <Clock className="w-3 h-3" />
                            <span>{evt.eventDate} {evt.eventTime || ''}</span>
                          </div>
                        </div>

                        {/* Raw Field Statement */}
                        <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] text-xs italic text-[#172033] leading-relaxed">
                          &quot;{evt.rawText}&quot;
                        </div>

                        {/* Extracted Structured Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-[#D9DEE5]">
                          <div>
                            <span className="text-[#7B8798] block text-[9px] uppercase font-bold">Quantity</span>
                            <span className="font-mono font-bold text-[#172033]">
                              {evt.quantity} {evt.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#7B8798] block text-[9px] uppercase font-bold">Discipline</span>
                            <span className="font-semibold text-[#172033]">{evt.discipline}</span>
                          </div>
                          <div>
                            <span className="text-[#7B8798] block text-[9px] uppercase font-bold">Work Area</span>
                            <span className="truncate block text-[#172033]">{evt.area}</span>
                          </div>
                          <div>
                            <span className="text-[#7B8798] block text-[9px] uppercase font-bold">Status</span>
                            <span className="font-bold text-[#2E7D5B] capitalize">
                              {evt.status.replace('-', ' ')}
                            </span>
                          </div>
                        </div>

                        {/* Match Reasons & Explanation */}
                        {evt.matchedReasons && evt.matchedReasons.length > 0 && (
                          <div className="text-[11px] text-[#596579] space-y-1 bg-[#EDF7F2] p-2 rounded border border-[#B8DCC9]">
                            <span className="font-bold text-[#2E7D5B] block text-[10px] uppercase">
                              Match Justification:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5 text-[#2E7D5B]">
                              {evt.matchedReasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Interactive Full Deterministic Match Explanation */}
                        <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMatchEventId(
                                expandedMatchEventId === evt.id ? null : evt.id
                              )
                            }
                            className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>
                              {expandedMatchEventId === evt.id
                                ? 'Hide Match Explanation'
                                : 'View Full Match Explanation'}
                            </span>
                          </button>
                        </div>

                        {expandedMatchEventId === evt.id && (
                          <div className="pt-1">
                            <MatchExplanation
                              eventId={evt.id}
                              compact={true}
                              showHeading={false}
                              onOpenActivity={(actId) => openActivityDrawer(actId)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 4: EVIDENCE (linked evidence)
                --------------------------------------------------------------------- */}
            {activeTab === 'evidence' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5" />
                      Linked Physical Evidence ({linkedEvidenceItems.length})
                    </h3>
                    <p className="text-[11px] text-[#596579] mt-0.5">
                      Photos, signed inspection logs, and certificates supporting this activity.
                    </p>
                  </div>

                  <Link
                    href={`/evidence?activityId=${encodeURIComponent(activity.id)}`}
                    className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Open in Evidence Center</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>

                {linkedEvidenceItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-[#D9DEE5] rounded-lg space-y-2 bg-[#F7F8FA]">
                    <Camera className="w-6 h-6 text-[#7B8798] mx-auto" />
                    <p className="text-xs font-bold text-[#172033]">No evidence files attached</p>
                    <p className="text-[11px] text-[#596579]">
                      Attach photos or inspection reports from Daily Progress Reporting.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedEvidenceItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-3 hover:border-[#176B87] transition-all shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                                {item.id}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5] uppercase">
                                {item.type}
                              </span>
                              {item.verifiedStatus ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>Verified QC</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending QC</span>
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-[#172033] mt-1">{item.title}</h4>
                            <p className="text-xs text-[#596579] font-mono">
                              File: {item.filename} ({item.fileSize})
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewEvidenceModal(item)}
                            className="p-1.5 text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded hover:bg-[#F1F3F5] transition-colors"
                            title="Preview evidence"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-[#596579] bg-[#F7F8FA] p-2.5 rounded-lg border border-[#D9DEE5] italic">
                            &quot;{item.notes}&quot;
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#7B8798] pt-1 border-t border-[#D9DEE5] flex-wrap gap-2">
                          <span className="font-medium text-[#596579]">
                            Uploaded by: <strong className="text-[#172033]">{item.uploader}</strong>
                          </span>
                          <span className="font-mono">{item.timestamp}</span>
                          {item.sha256Hash && (
                            <span className="font-mono text-[9px] text-[#7B8798] truncate max-w-[150px]">
                              SHA: {item.sha256Hash}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 5: DEPENDENCIES (predecessors, successors, impact)
                --------------------------------------------------------------------- */}
            {activeTab === 'dependencies' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Dependency Flow Chain Diagram */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
                    Critical Path Dependency Chain (Predecessors → Activity → Successors)
                  </span>

                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    {/* Predecessors Box */}
                    <div className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg min-w-[150px] space-y-1">
                      <span className="text-[9px] font-bold uppercase text-[#7B8798] block">Predecessor</span>
                      {detailedPredecessors.length > 0 ? (
                        detailedPredecessors.map((p) => (
                          <div key={p.id}>
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(p.id)}
                              className="font-mono font-bold text-xs text-[#176B87] hover:underline block text-left"
                            >
                              {p.id}
                            </button>
                            <span className="text-[10px] text-[#596579] truncate block max-w-[140px]">{p.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#7B8798] italic">None (Project Start)</span>
                      )}
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#7B8798] flex-shrink-0" />

                    {/* Current Activity Box (Highlighted) */}
                    <div className="p-2.5 bg-[#EDF5F8] border-2 border-[#176B87] rounded-lg min-w-[180px] space-y-1 shadow-xs">
                      <span className="text-[9px] font-bold uppercase text-[#176B87] block">Current Focus</span>
                      <strong className="font-mono text-xs text-[#176B87] block">{activity.id}</strong>
                      <span className="text-[10px] text-[#172033] font-semibold truncate block max-w-[170px]">
                        {activity.name}
                      </span>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#7B8798] flex-shrink-0" />

                    {/* Successors Box */}
                    <div className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg min-w-[160px] space-y-1">
                      <span className="text-[9px] font-bold uppercase text-[#7B8798] block">Successors</span>
                      {detailedSuccessors.length > 0 ? (
                        detailedSuccessors.map((s) => (
                          <div key={s.id} className="pb-1 last:pb-0">
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(s.id)}
                              className="font-mono font-bold text-xs text-[#176B87] hover:underline block text-left"
                            >
                              {s.id}
                            </button>
                            <span className="text-[10px] text-[#596579] truncate block max-w-[150px]">{s.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-[#7B8798] italic">None (Final Deliverable)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Predecessors Detailed List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Driving Predecessors ({detailedPredecessors.length})
                  </h3>

                  {detailedPredecessors.length === 0 ? (
                    <p className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs text-[#7B8798] italic">
                      No upstream predecessors linked. Activity starts on baseline start date.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {detailedPredecessors.map((pred) => (
                        <div
                          key={pred.id}
                          className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2 hover:border-[#176B87] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openActivityDrawer(pred.id)}
                                className="font-mono font-bold text-xs text-[#176B87] hover:underline"
                              >
                                {pred.id}
                              </button>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F3F5] text-[#596579] font-mono">
                                {pred.type}
                              </span>
                              <StatusBadge status={pred.status as any} />
                            </div>
                            <span className="font-mono text-[11px] text-[#7B8798]">{pred.plannedPeriod}</span>
                          </div>

                          <p className="text-xs font-semibold text-[#172033]">{pred.name}</p>
                          <p className="text-[11px] text-[#596579] bg-[#F7F8FA] p-2 rounded border border-[#D9DEE5]">
                            {pred.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Successors Detailed List */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Downstream Successors ({detailedSuccessors.length})
                  </h3>

                  {detailedSuccessors.length === 0 ? (
                    <p className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs text-[#7B8798] italic">
                      No downstream successors configured.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {detailedSuccessors.map((succ) => (
                        <div
                          key={succ.id}
                          className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2 hover:border-[#176B87] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openActivityDrawer(succ.id)}
                                className="font-mono font-bold text-xs text-[#176B87] hover:underline"
                              >
                                {succ.id}
                              </button>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F1F3F5] text-[#596579] font-mono">
                                {succ.type}
                              </span>
                              <StatusBadge status={succ.status as any} />
                            </div>
                            <span className="font-mono text-[11px] text-[#7B8798]">{succ.plannedPeriod}</span>
                          </div>

                          <p className="text-xs font-semibold text-[#172033]">{succ.name}</p>
                          <p className="text-[11px] text-[#596579] bg-[#F7F8FA] p-2 rounded border border-[#D9DEE5]">
                            {succ.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Schedule Float & Downstream Impact Card */}
                <div className="p-4 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg space-y-3">
                  <div className="flex items-center justify-between border-b border-[#F0D4A6] pb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#D98B32] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      CPM Schedule Impact &amp; Float Analysis
                    </span>
                    <span className="font-mono font-bold text-xs text-[#D98B32]">
                      Total Float: {impactData.totalFloatDays}d
                    </span>
                  </div>

                  <p className="text-xs text-[#172033] leading-relaxed">
                    {impactData.projectedScheduleImpact}
                  </p>

                  <div className="p-3 bg-white/80 rounded-lg border border-[#F0D4A6] space-y-1.5 text-xs">
                    <span className="text-[10px] uppercase font-bold text-[#D98B32] block">
                      Active Mitigation Strategy:
                    </span>
                    <p className="text-[#172033]">{impactData.currentMitigation}</p>
                    <span className="text-[10px] uppercase font-bold text-[#176B87] block pt-1">
                      Recommended Next Action:
                    </span>
                    <p className="text-[#172033]">{impactData.recommendedAction}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                TAB 6: HISTORY (audit records)
                --------------------------------------------------------------------- */}
            {activeTab === 'history' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      Immutable Activity Audit Ledger ({auditHistory.length})
                    </h3>
                    <p className="text-[11px] text-[#596579] mt-0.5">
                      Cryptographically tracked changes, approvals, progress modifications, and matches.
                    </p>
                  </div>

                  <span className="text-[11px] font-mono text-[#7B8798]">Tamper-Evident</span>
                </div>

                {auditHistory.length === 0 ? (
                  <p className="p-6 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-center text-xs text-[#7B8798]">
                    No historical modifications recorded for this activity yet.
                  </p>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3.5 before:w-0.5 before:bg-[#D9DEE5]">
                    {auditHistory.map((log) => (
                      <div key={log.id} className="relative pl-8 space-y-1.5">
                        <div className="absolute left-2 top-2.5 w-3.5 h-3.5 rounded-full bg-[#176B87] border-2 border-white -translate-x-1/2" />

                        <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2 hover:bg-[#F7F8FA] transition-colors shadow-2xs">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#176B87]">{log.id}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                                {log.actionCategory || log.action}
                              </span>
                            </div>
                            <span className="font-mono text-[11px] text-[#7B8798]">{log.timestamp}</span>
                          </div>

                          <div className="flex items-center justify-between text-xs font-semibold text-[#172033]">
                            <span>Actor: <strong className="text-[#176B87]">{log.actor}</strong> ({log.role})</span>
                          </div>

                          {log.whatChanged && (
                            <p className="text-xs font-medium text-[#172033] bg-[#F7F8FA] p-2 rounded border border-[#D9DEE5]">
                              {log.whatChanged}
                            </p>
                          )}

                          {(log.before || log.previousValue) && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                              <div className="p-2 bg-[#FBEFEE] text-[#B5473C] rounded border border-[#E4B0AA]">
                                <span className="text-[9px] uppercase font-bold block text-[#B5473C]/80">Before:</span>
                                <span>{log.before || log.previousValue}</span>
                              </div>
                              <div className="p-2 bg-[#EDF7F2] text-[#2E7D5B] rounded border border-[#B8DCC9]">
                                <span className="text-[9px] uppercase font-bold block text-[#2E7D5B]/80">After:</span>
                                <span>{log.after || log.newValue}</span>
                              </div>
                            </div>
                          )}

                          <p className="text-[11px] text-[#596579] leading-relaxed pt-1">
                            {log.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              DRAWER FOOTER & ACTIONS (Required 4 Actions):
              - Capture Update
              - Review Match
              - Open Evidence
              - View Dependency Impact
              ========================================================================= */}
          <div className="px-6 py-3.5 border-t border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between gap-2 flex-wrap">
            <div className="text-xs text-[#596579]">
              <span>Activity: </span>
              <strong className="font-mono text-[#172033]">{activity.id}</strong>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Action 4: View Dependency Impact */}
              <button
                type="button"
                onClick={handleViewDependencyImpact}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === 'dependencies'
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white text-[#596579] hover:text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                }`}
                title="View upstream and downstream dependency impact"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>View Dependency Impact</span>
              </button>

              {/* Action 3: Open Evidence */}
              <button
                type="button"
                onClick={handleOpenEvidence}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                  activeTab === 'evidence'
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white text-[#596579] hover:text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                }`}
                title="View linked evidence documentation"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Open Evidence</span>
              </button>

              {/* Action 2: Review Match */}
              <button
                type="button"
                onClick={handleReviewMatch}
                className="px-3 py-1.5 text-xs font-semibold bg-white text-[#176B87] border border-[#176B87] hover:bg-[#EDF5F8] rounded-lg transition-colors inline-flex items-center gap-1.5"
                title="Review AI candidate matches for this activity"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Review Match</span>
              </button>

              {/* Action 1: Capture Update */}
              <button
                type="button"
                onClick={handleCaptureUpdate}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                title="Capture physical site progress for this activity"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Capture Update</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Mini Evidence Preview Modal */}
      {previewEvidenceModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#172033]/60 transition-opacity"
            onClick={() => setPreviewEvidenceModal(null)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-lg border border-[#D9DEE5] shadow-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-[#176B87]">{previewEvidenceModal.id}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579]">
                  {previewEvidenceModal.type}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="text-[#596579] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h4 className="font-bold text-sm text-[#172033]">{previewEvidenceModal.title}</h4>
              <p className="text-xs text-[#596579] font-mono mt-0.5">
                {previewEvidenceModal.filename} • {previewEvidenceModal.fileSize}
              </p>
            </div>

            <div className="p-4 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] text-center space-y-2">
              <Camera className="w-10 h-10 text-[#7B8798] mx-auto" />
              <p className="text-xs text-[#596579]">Cryptographically sealed preview from site repository.</p>
              <div className="font-mono text-[10px] text-[#7B8798] break-all">
                SHA256: {previewEvidenceModal.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
