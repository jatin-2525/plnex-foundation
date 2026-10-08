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
import { WhyButton } from './WhyButton';
import { MatchExplanation } from './MatchExplanation';
import {
  getEnrichedActivityDetail,
  ActivityDrawerTab,
  EnrichedActivityDetail,
} from '../../lib/domain/activityDetailData';
import {
  X,
  Layers,
  Calendar,
  Clock,
  Cpu,
  ShieldCheck,
  GitBranch,
  History,
  Plus,
  ArrowRight,
  Camera,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HardHat,
  Eye,
  Check,
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
    openWhyExplanation,
  } = useApp();

  // Determine effective control mode
  const isControlledByProps = propsIsOpen !== undefined;
  const isOpen = isControlledByProps ? Boolean(propsIsOpen) : Boolean(activityDrawerActivityId);
  const effectiveActivityId = isControlledByProps ? propsActivityId : activityDrawerActivityId;
  const handleClose = isControlledByProps ? (propsOnClose || (() => {})) : closeActivityDrawer;

  // Active Tab state: normalize 'plan-vs-actual' to 'progress'
  const [activeTab, setActiveTab] = useState<ActivityDrawerTab>('overview');

  // Progressive disclosure states
  const [showFullWBS, setShowFullWBS] = useState<boolean>(false);
  const [showProjectMetadata, setShowProjectMetadata] = useState<boolean>(false);
  const [showProgressHistory, setShowProgressHistory] = useState<boolean>(false);
  const [expandedMatchEventId, setExpandedMatchEventId] = useState<string | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);
  const [showFullLogic, setShowFullLogic] = useState<boolean>(false);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);

  // Preview state for evidence item modal inside drawer
  const [previewEvidenceModal, setPreviewEvidenceModal] = useState<any | null>(null);

  // Sync initial tab when drawer opens or updates
  useEffect(() => {
    if (isOpen) {
      const target = propsInitialTab || activityDrawerTab || 'overview';
      setActiveTab(target === 'plan-vs-actual' ? 'progress' : target);
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
        return { bg: 'bg-[#FDF6ED]', text: 'text-[#8C5311]', border: 'border-[#F0D4A6]' };
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

  // 6 Sections: Overview, Progress, Execution, Evidence, Dependencies, History
  const TABS: Array<{ id: ActivityDrawerTab; label: string; icon: any; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Layers },
    { id: 'progress', label: 'Progress', icon: Calendar },
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
    setActiveTab('evidence');
  };

  const handleViewDependencyImpact = () => {
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

      {/* Container: Fullscreen sheet on mobile, slide-over drawer (420–520px) on desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex z-50">
        <div className="w-full sm:w-[480px] sm:max-w-[500px] h-full bg-white sm:border-l border-[#D9DEE5] shadow-xl flex flex-col transform transition-transform duration-150">
          
          {/* =========================================================================
              HEADER:
              Focused, non-dashboard header with Activity ID, Status, Name, and Quick Context
              ========================================================================= */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#D9DEE5] bg-white flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Activity ID */}
                  <span className="font-mono font-bold text-sm text-[#176B87] tracking-tight bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                    {activity.id}
                  </span>

                  {/* Critical Path Badge */}
                  {activity.isCritical && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] uppercase tracking-wider inline-flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Critical (Float: 0d)</span>
                    </span>
                  )}

                  {/* Status Badge */}
                  <StatusBadge status={activity.status as any} />

                  {/* Discipline Pill */}
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border uppercase tracking-wider ${discTheme.bg} ${discTheme.text} ${discTheme.border}`}
                  >
                    {activity.discipline}
                  </span>
                </div>

                {/* Activity Name */}
                <h2 className="text-lg font-semibold text-[#172033] leading-snug line-clamp-2">
                  {activity.name}
                </h2>
              </div>

              {/* Close Button (min-h-[44px] for accessibility) */}
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded-lg transition-colors -mr-1 flex-shrink-0 cursor-pointer"
                aria-label="Close activity detail drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Context Subhead: WBS, Area, Line */}
            <div className="flex items-center gap-2 text-[13px] text-[#596579] font-mono flex-wrap pt-0.5">
              <span>WBS: <strong className="text-[#172033] font-semibold">{activity.wbs}</strong> ({activity.wbsLevel})</span>
              <span>•</span>
              <span className="truncate">Area: <strong className="text-[#172033] font-semibold">{activity.area}</strong></span>
              {activity.line && (
                <>
                  <span>•</span>
                  <span>Line: <strong className="text-[#172033] font-semibold">{activity.line}</strong></span>
                </>
              )}
            </div>

            {/* Quick Summary Pill Strip */}
            <div className="flex items-center justify-between text-[11px] bg-[#F7F8FA] border border-[#D9DEE5] rounded px-3 py-1 text-[#596579] font-mono mt-0.5">
              <span>
                Progress: <strong className="text-[#172033]">{activity.actualProgress}%</strong> (Plan: {activity.plannedProgress}%)
              </span>
              <span>
                {activity.delayDays > 0 ? (
                  <span className="text-[#B5473C] font-semibold">+{activity.delayDays}d Delay</span>
                ) : (
                  <span className="text-[#2E7D5B] font-semibold">On Schedule</span>
                )}
              </span>
            </div>
          </div>

          {/* =========================================================================
              NAVIGATION TABS:
              Overview | Progress | Execution | Evidence | Dependencies | History
              ========================================================================= */}
          <div className="px-4 border-b border-[#D9DEE5] bg-[#F7F8FA] flex items-center gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    isActive
                      ? 'border-[#176B87] text-[#176B87] bg-white font-bold'
                      : 'border-transparent text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
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
              BODY CONTENT: Progressive Disclosure within 420–520px Width
              ========================================================================= */}
          <div className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto text-[#172033] text-sm space-y-4">
            
            {/* ---------------------------------------------------------------------
                SECTION 1: OVERVIEW
                Primary: Core scope, discipline, WBS, assigned lead, quantity target
                Secondary Expandable: Full L1-L6 WBS hierarchy, contract metadata
                --------------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Primary: Scope Description */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                    Scope Description
                  </span>
                  <p className="text-sm text-[#172033] leading-relaxed">
                    {activity.description || 'No detailed scope description registered.'}
                  </p>
                </div>

                {/* Primary: Key Work Parameters */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                    Execution Classification
                  </span>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]/60">
                      <span className="text-[#596579]">Engineering Discipline:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${discTheme.bg} ${discTheme.text} ${discTheme.border}`}>
                        {activity.discipline}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]/60">
                      <span className="text-[#596579]">Target Quantity:</span>
                      <strong className="font-mono text-[#172033]">
                        {activity.plannedQuantity} {activity.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]/60">
                      <span className="text-[#596579]">Work Breakdown (WBS):</span>
                      <strong className="font-mono text-[#176B87]">{activity.wbs}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D9DEE5]/60">
                      <span className="text-[#596579]">Work Area &amp; Grid:</span>
                      <span className="text-[#172033] font-medium">{activity.area}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#596579]">Assigned Field Lead:</span>
                      <span className="font-semibold text-[#176B87] flex items-center gap-1">
                        <HardHat className="w-3 h-3" />
                        {activity.assignedEngineer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progressive Disclosure 1: Full L1–L6 WBS Hierarchy (Expandable) */}
                <div className="border border-[#D9DEE5] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullWBS(!showFullWBS)}
                    className="w-full px-4 py-2 bg-[#F7F8FA] hover:bg-[#F1F3F5] text-left flex items-center justify-between text-xs font-semibold text-[#172033] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#176B87]" />
                      <span>Full WBS Hierarchy (L1–L6)</span>
                    </span>
                    <span className="text-[11px] text-[#596579] flex items-center gap-1">
                      <span>{showFullWBS ? 'Collapse' : 'Expand (6 Levels)'}</span>
                      {showFullWBS ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showFullWBS && (
                    <div className="p-3 space-y-2 border-t border-[#D9DEE5] bg-white divide-y divide-[#D9DEE5]/60">
                      {hierarchy.map((step) => {
                        const isTarget = step.isCurrent;
                        return (
                          <div
                            key={step.level}
                            className={`pt-2 first:pt-0 pb-2 last:pb-0 flex items-start gap-2 ${
                              isTarget ? 'bg-[#EDF5F8]/50 -mx-1 px-1.5 rounded' : ''
                            }`}
                          >
                            <span
                              className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                                isTarget
                                  ? 'bg-[#176B87] text-white border-[#176B87]'
                                  : 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]'
                              }`}
                            >
                              {step.level}
                            </span>
                            <div className="flex-1 min-w-0 text-[11px]">
                              <div className="flex justify-between text-[#7B8798]">
                                <span className="font-mono font-semibold text-[#172033]">{step.code}</span>
                                <span className="uppercase text-[11px] font-semibold">{step.category}</span>
                              </div>
                              <p className={`mt-0.5 truncate ${isTarget ? 'font-bold text-[#176B87]' : 'text-[#596579]'}`}>
                                {step.name}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure 2: Project Metadata (Expandable) */}
                <div className="border border-[#D9DEE5] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowProjectMetadata(!showProjectMetadata)}
                    className="w-full px-4 py-2 bg-[#F7F8FA] hover:bg-[#F1F3F5] text-left flex items-center justify-between text-xs font-semibold text-[#172033] transition-colors"
                  >
                    <span>Project &amp; Schedule Baseline Reference</span>
                    <span className="text-[11px] text-[#596579] flex items-center gap-1">
                      <span>{showProjectMetadata ? 'Collapse' : 'Expand'}</span>
                      {showProjectMetadata ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showProjectMetadata && (
                    <div className="p-3 border-t border-[#D9DEE5] space-y-2 text-xs bg-white">
                      <div className="flex justify-between">
                        <span className="text-[#596579]">Project Name:</span>
                        <strong className="text-[#172033]">{projectName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#596579]">Project Code:</span>
                        <span className="font-mono text-[#176B87]">{projectCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#596579]">Field Location:</span>
                        <span className="text-[#172033]">{location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#596579]">Baseline Spec:</span>
                        <span className="font-mono text-[#596579]">V3 · Rev 3.2 (Primavera P6 XML)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SECTION 2: PROGRESS (Plan vs Actual)
                Primary: Planned vs Actual %, Planned/Actual Dates, Delay Variance
                Secondary Expandable: Historical checkpoints
                --------------------------------------------------------------------- */}
            {(activeTab === 'progress' || activeTab === 'plan-vs-actual') && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Primary Progress Card */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                          Physical Progress
                        </span>
                        <WhyButton
                          onClick={() => openWhyExplanation(`progress:${activity.id}`)}
                          title={`Why is physical progress ${activity.actualProgress}%?`}
                        />
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-[28px] font-bold text-[#172033] font-mono leading-none">
                          {activity.actualProgress}%
                        </span>
                        <span className="text-xs text-[#596579] font-mono">
                          Planned: <strong className="font-semibold">{activity.plannedProgress}%</strong>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <VarianceBadge daysDelay={activity.delayDays} />
                        <WhyButton
                          onClick={() => openWhyExplanation(`variance:${activity.id}`)}
                          title="Why is this activity delayed?"
                        />
                      </div>
                      {activity.delayDays > 0 && (
                        <span className="text-[11px] font-mono font-semibold text-[#B5473C] block mt-0.5">
                          +{activity.delayDays}d Slippage
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dual-track Progress Bar */}
                  <ProgressBar
                    actual={activity.actualProgress}
                    planned={activity.plannedProgress}
                    size="md"
                    showLabels={false}
                  />

                  <div className="flex justify-between text-[11px] text-[#596579] font-mono pt-1 border-t border-[#D9DEE5]">
                    <span>Executed: <strong>{activity.actualQuantity}</strong> {activity.unit}</span>
                    <span>Target: <strong>{activity.plannedQuantity}</strong> {activity.unit}</span>
                  </div>
                </div>

                {/* Primary Milestone Dates Card */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                    Schedule Dates &amp; Milestone Milestones
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-[#F7F8FA] border border-[#D9DEE5] space-y-1">
                      <span className="text-[11px] uppercase font-semibold text-[#596579] block">Planned Start</span>
                      <strong className="font-mono text-[#172033] block">{activity.plannedStart}</strong>
                      <span className="text-[11px] uppercase font-semibold text-[#596579] block pt-1">Planned Finish</span>
                      <strong className="font-mono text-[#172033] block">{activity.plannedFinish}</strong>
                    </div>

                    <div className="p-3 rounded bg-[#EDF5F8]/40 border border-[#B3CBE0] space-y-1">
                      <span className="text-[11px] uppercase font-semibold text-[#176B87] block">Actual Start</span>
                      <strong className="font-mono text-[#172033] block">
                        {activity.actualStart || 'Pending Start'}
                      </strong>
                      <span className="text-[11px] uppercase font-semibold text-[#176B87] block pt-1">Actual Finish</span>
                      <strong className={`font-mono block ${activity.actualFinish ? 'text-[#2E7D5B]' : 'text-[#B5473C]'}`}>
                        {activity.actualFinish || 'In Progress (Active)'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Variance Explanation if delayed */}
                {activity.delayDays > 0 && (
                  <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg space-y-2 text-xs text-[#8A382F]">
                    <div className="flex items-center gap-2 font-bold text-[#B5473C]">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Variance Driving Cause</span>
                    </div>
                    <p className="leading-relaxed">
                      Actual progress ({activity.actualProgress}%) is trailing planned target ({activity.plannedProgress}%) by {Math.abs(activity.variance)}%. Driving factor: weather stoppage and weld inspection hold.
                    </p>
                  </div>
                )}

                {/* Progressive Disclosure: Progress History */}
                {activity.progressHistory && activity.progressHistory.length > 0 && (
                  <div className="border border-[#D9DEE5] rounded-lg bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowProgressHistory(!showProgressHistory)}
                      className="w-full px-4 py-2 bg-[#F7F8FA] hover:bg-[#F1F3F5] text-left flex items-center justify-between text-xs font-semibold text-[#172033] transition-colors"
                    >
                      <span>Progress Checkpoints &amp; Historical Cutoffs</span>
                      <span className="text-[11px] text-[#596579] flex items-center gap-1">
                        <span>{showProgressHistory ? 'Collapse' : 'Expand'}</span>
                        {showProgressHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>

                    {showProgressHistory && (
                      <div className="p-3 border-t border-[#D9DEE5] space-y-2 bg-white">
                        {activity.progressHistory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-1 border-b last:border-b-0 border-[#D9DEE5]/60 font-mono">
                            <span className="text-[#596579]">{item.formattedAsOf}</span>
                            <span className="font-bold text-[#172033]">{item.progress}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SECTION 3: EXECUTION
                Primary: Execution Events list with standardized confidence (e.g. 94% High Confidence)
                Secondary Expandable: Why this match? feature explanation
                --------------------------------------------------------------------- */}
            {activeTab === 'execution' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider">
                    Execution Events ({linkedExecutionEvents.length})
                  </span>
                  <Link
                    href="/execution"
                    className="text-[11px] font-semibold text-[#176B87] hover:underline"
                  >
                    Open Execution Intel →
                  </Link>
                </div>

                {linkedExecutionEvents.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#D9DEE5] rounded-lg bg-[#F7F8FA] space-y-1">
                    <p className="text-xs font-semibold text-[#172033]">No execution events matched yet</p>
                    <p className="text-[11px] text-[#596579] max-w-xs mx-auto">
                      Field reports submitted for this project will appear here after automated matching and verification.
                    </p>
                    <Link
                      href="/execution"
                      className="inline-block mt-2 text-xs font-semibold text-[#176B87] hover:underline"
                    >
                      Open Execution Intel Feed →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedExecutionEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2 shadow-2xs hover:border-[#176B87] transition-colors"
                      >
                        {/* Event ID, Source, Date */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                              {evt.id}
                            </span>
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#596579] uppercase">
                              {evt.source.replace('_', ' ')}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-[#7B8798]">
                            {evt.eventDate}
                          </span>
                        </div>

                        {/* Standardized Confidence visualization */}
                        <div className="flex items-center justify-between text-xs pt-0.5">
                          <div className="flex items-center gap-2">
                            <ConfidenceBadge score={evt.confidence} />
                            <WhyButton
                              onClick={() => openWhyExplanation(`confidence:${evt.id}`)}
                              title={`Why is match confidence ${evt.confidence}%?`}
                            />
                          </div>
                          <span className="font-mono font-semibold text-[#172033]">
                            {evt.quantity} {evt.unit}
                          </span>
                        </div>

                        {/* Raw observation statement */}
                        <p className="p-3 bg-[#F7F8FA] rounded border border-[#D9DEE5] text-xs text-[#172033] leading-relaxed italic">
                          &quot;{evt.rawText}&quot;
                        </p>

                        {/* Progressive Disclosure: Why this match? */}
                        <div className="pt-1 border-t border-[#D9DEE5]/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMatchEventId(
                                expandedMatchEventId === evt.id ? null : evt.id
                              )
                            }
                            className="text-xs font-semibold text-[#176B87] hover:underline flex items-center justify-between w-full"
                          >
                            <span>Why this match? (Match Factors)</span>
                            <span className="text-[11px]">
                              {expandedMatchEventId === evt.id ? 'Hide ▲' : 'Details ▼'}
                            </span>
                          </button>

                          {expandedMatchEventId === evt.id && (
                            <div className="mt-2 space-y-2 text-[11px]">
                              <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded text-[#2E7D5B] space-y-1">
                                <span className="font-semibold uppercase text-[11px] block">Verified Feature Matches:</span>
                                <div className="space-y-0.5">
                                   <div className="flex items-center gap-2">
                                     <Check className="w-3 h-3 text-[#2E7D5B]" />
                                     <span>Activity match: {activity.name}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Check className="w-3 h-3 text-[#2E7D5B]" />
                                     <span>Area match: {activity.area}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Check className="w-3 h-3 text-[#2E7D5B]" />
                                     <span>Discipline match: {activity.discipline}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <Check className="w-3 h-3 text-[#2E7D5B]" />
                                     <span>Context match: Shift log &amp; physical unit agreement</span>
                                   </div>
                                 </div>
                               </div>

                               <div className="pt-1">
                                 <MatchExplanation
                                   eventId={evt.id}
                                   compact={true}
                                   showHeading={false}
                                   onOpenActivity={(actId) => openActivityDrawer(actId)}
                                 />
                               </div>
                             </div>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             )}

             {/* ---------------------------------------------------------------------
                 SECTION 4: EVIDENCE
                 Primary: Evidence list, Verified state, preview modal
                 Secondary Expandable: Cryptographic SHA256, technical metadata
                 --------------------------------------------------------------------- */}
             {activeTab === 'evidence' && (
               <div className="space-y-4 animate-in fade-in duration-150">
                 <div className="flex items-center justify-between">
                   <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider">
                     Evidence Records ({linkedEvidenceItems.length})
                   </span>
                   <Link
                     href={`/evidence?activityId=${encodeURIComponent(activity.id)}`}
                     className="text-[11px] font-semibold text-[#176B87] hover:underline"
                   >
                     Open Evidence &amp; Audit →
                   </Link>
                 </div>

                 {linkedEvidenceItems.length === 0 ? (
                   <div className="p-6 text-center border border-dashed border-[#D9DEE5] rounded-lg bg-[#F7F8FA] space-y-1">
                     <p className="text-xs font-semibold text-[#172033]">No physical evidence linked</p>
                     <p className="text-[11px] text-[#596579] max-w-xs mx-auto">
                       Photographic logs and QA/QC certificates linked to this activity will appear here after verification.
                     </p>
                     <Link
                       href={`/evidence?activityId=${encodeURIComponent(activity.id)}`}
                       className="inline-block mt-2 text-xs font-semibold text-[#176B87] hover:underline"
                     >
                       Open Evidence &amp; Audit →
                     </Link>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {linkedEvidenceItems.map((item) => (
                       <div
                         key={item.id}
                         className="p-4 bg-white border border-[#D9DEE5] rounded-lg space-y-2 shadow-2xs hover:border-[#176B87] transition-colors"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="space-y-1 min-w-0">
                             <div className="flex items-center gap-2 flex-wrap">
                               <span className="font-mono font-bold text-xs text-[#176B87] bg-[#EDF5F8] px-2 py-0.5 rounded border border-[#B3CBE0]">
                                 {item.id}
                               </span>
                               <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F3F5] text-[#596579] uppercase">
                                 {item.type}
                               </span>
                               {item.verifiedStatus ? (
                                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                                   <ShieldCheck className="w-3 h-3" />
                                   <span>Verified QC</span>
                                 </span>
                               ) : (
                                 <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                                   <Clock className="w-3 h-3" />
                                   <span>Pending QC</span>
                                 </span>
                               )}
                             </div>
                             <h4 className="font-semibold text-sm text-[#172033] pt-0.5 truncate">{item.title}</h4>
                             <span className="text-[11px] text-[#596579] font-mono block">
                               {item.filename} ({item.fileSize})
                             </span>
                           </div>

                           <button
                             type="button"
                             onClick={() => setPreviewEvidenceModal(item)}
                             className="p-2 text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded hover:bg-[#F1F3F5] transition-colors flex-shrink-0"
                             title="Preview file"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                         </div>

                         {item.notes && (
                           <p className="text-xs text-[#596579] bg-[#F7F8FA] p-2 rounded border border-[#D9DEE5] italic">
                             &quot;{item.notes}&quot;
                           </p>
                         )}

                         {/* Progressive Disclosure: Cryptographic & Telemetry Metadata */}
                         <div className="pt-1 border-t border-[#D9DEE5]/60">
                           <button
                             type="button"
                             onClick={() =>
                               setExpandedEvidenceId(
                                 expandedEvidenceId === item.id ? null : item.id
                               )
                             }
                             className="text-[11px] font-semibold text-[#176B87] hover:underline flex items-center justify-between w-full"
                           >
                             <span>Cryptographic Proof &amp; Metadata</span>
                             <span>{expandedEvidenceId === item.id ? 'Hide ▲' : 'Expand ▼'}</span>
                           </button>

                           {expandedEvidenceId === item.id && (
                             <div className="mt-2 p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5] space-y-1 text-[11px] font-mono">
                               <div className="flex justify-between">
                                 <span className="text-[#596579]">Uploader:</span>
                                 <span className="text-[#172033] font-semibold">{item.uploader}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-[#596579]">Timestamp:</span>
                                 <span className="text-[#172033]">{item.timestamp}</span>
                               </div>
                               {item.sha256Hash && (
                                 <div className="pt-1 border-t border-[#D9DEE5]">
                                   <span className="text-[#596579] block">SHA-256 Digest:</span>
                                   <span className="text-[#596579] break-all">{item.sha256Hash}</span>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SECTION 5: DEPENDENCIES
                Primary: Predecessors & Successors lists, Float impact
                Secondary Expandable: Logic details, lag days, mitigation notes
                --------------------------------------------------------------------- */}
            {activeTab === 'dependencies' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                {/* Float & Critical Path Summary */}
                <div className="p-4 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-[#8C5311] block">
                      CPM Float Analysis
                    </span>
                    <strong className="text-sm font-semibold text-[#172033]">
                      Total Float: {impactData.totalFloatDays}d
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      activity.isCritical ? 'bg-[#FBEFEE] text-[#B5473C]' : 'bg-[#EDF7F2] text-[#2E7D5B]'
                    }`}>
                      {activity.isCritical ? 'Critical Path' : 'Non-Critical'}
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`impact:${activity.id}`)}
                      title="Why does this activity impact the critical path?"
                    />
                  </div>
                </div>

                {/* Predecessors List */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                    Predecessors ({detailedPredecessors.length})
                  </span>

                  {detailedPredecessors.length === 0 ? (
                    <p className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs text-[#7B8798] italic">
                      None (Project Inception Milestone)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailedPredecessors.map((pred) => (
                        <div
                          key={pred.id}
                          className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2 hover:border-[#176B87] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(pred.id)}
                              className="font-mono font-bold text-xs text-[#176B87] hover:underline"
                            >
                              {pred.id}
                            </button>
                            <StatusBadge status={pred.status as any} />
                          </div>
                          <p className="text-xs font-semibold text-[#172033]">{pred.name}</p>
                          <div className="flex justify-between text-[11px] text-[#596579] font-mono">
                            <span>{pred.type}</span>
                            <span>{pred.plannedPeriod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Successors List */}
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                    Successors ({detailedSuccessors.length})
                  </span>

                  {detailedSuccessors.length === 0 ? (
                    <p className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs text-[#7B8798] italic">
                      None (Project Final Milestone)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailedSuccessors.map((succ) => (
                        <div
                          key={succ.id}
                          className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2 hover:border-[#176B87] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(succ.id)}
                              className="font-mono font-bold text-xs text-[#176B87] hover:underline"
                            >
                              {succ.id}
                            </button>
                            <StatusBadge status={succ.status as any} />
                          </div>
                          <p className="text-xs font-semibold text-[#172033]">{succ.name}</p>
                          <div className="flex justify-between text-[11px] text-[#596579] font-mono">
                            <span>{succ.type}</span>
                            <span>{succ.plannedPeriod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure: Schedule Impact & Mitigation Details */}
                <div className="border border-[#D9DEE5] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullLogic(!showFullLogic)}
                    className="w-full px-4 py-2 bg-[#F7F8FA] hover:bg-[#F1F3F5] text-left flex items-center justify-between text-xs font-semibold text-[#172033] transition-colors"
                  >
                    <span>Schedule Impact &amp; Mitigation Notes</span>
                    <span className="text-[11px] text-[#596579] flex items-center gap-1">
                      <span>{showFullLogic ? 'Collapse' : 'Expand'}</span>
                      {showFullLogic ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showFullLogic && (
                    <div className="p-3 border-t border-[#D9DEE5] space-y-2 text-xs bg-white">
                      <p className="text-[#172033] leading-relaxed">
                        {impactData.projectedScheduleImpact}
                      </p>
                      <div className="p-3 bg-[#F7F8FA] rounded border border-[#D9DEE5] space-y-1 text-[11px]">
                        <span className="text-[#8C5311] font-semibold block uppercase text-[11px]">Active Mitigation:</span>
                        <p className="text-[#172033]">{impactData.currentMitigation}</p>
                        <span className="text-[#176B87] font-semibold block uppercase text-[11px] pt-1">Recommended Action:</span>
                        <p className="text-[#172033]">{impactData.recommendedAction}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------------------------
                SECTION 6: HISTORY
                Primary: Audit log entries (Action, Actor, Timestamp, Before/After)
                Secondary Expandable: Telemetry & Record IDs
                --------------------------------------------------------------------- */}
            {activeTab === 'history' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider">
                    History &amp; Audit Trail ({auditHistory.length})
                  </span>
                  <span className="text-[11px] font-mono text-[#7B8798]">Tamper-Evident</span>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="p-6 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-center space-y-1">
                    <p className="font-semibold text-xs text-[#172033]">No historical modifications recorded yet</p>
                    <p className="text-[11px] text-[#596579]">
                      Baseline revisions and verified actual modifications for this activity will be logged here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-[#D9DEE5]">
                    {auditHistory.map((log) => (
                      <div key={log.id} className="relative pl-7 space-y-2">
                        <div className="absolute left-1.5 top-2.5 w-3 h-3 rounded-full bg-[#176B87] border-2 border-white -translate-x-1/2" />

                        <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2 shadow-2xs hover:bg-[#F7F8FA] transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                              {log.actionCategory || log.action}
                            </span>
                            <span className="font-mono text-[11px] text-[#7B8798]">{log.timestamp}</span>
                          </div>

                          <div className="text-xs text-[#172033]">
                            <span>Actor: <strong className="text-[#176B87]">{log.actor}</strong> ({log.role})</span>
                          </div>

                          {log.whatChanged && (
                            <p className="text-xs text-[#172033] bg-[#F7F8FA] p-2 rounded border border-[#D9DEE5]">
                              {log.whatChanged}
                            </p>
                          )}

                          {(log.before || log.previousValue) && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-0.5">
                              <div className="p-2 bg-[#FBEFEE] text-[#B5473C] rounded border border-[#E4B0AA]">
                                <span className="block text-[11px] uppercase font-semibold">Before:</span>
                                <span>{log.before || log.previousValue}</span>
                              </div>
                              <div className="p-2 bg-[#EDF7F2] text-[#2E7D5B] rounded border border-[#B8DCC9]">
                                <span className="block text-[11px] uppercase font-semibold">After:</span>
                                <span>{log.after || log.newValue}</span>
                              </div>
                            </div>
                          )}

                          {/* Progressive Disclosure: Telemetry & Record ID */}
                          <div className="pt-1 border-t border-[#D9DEE5]/60 flex items-center justify-between text-[11px] text-[#7B8798]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAuditId(
                                  expandedAuditId === log.id ? null : log.id
                                )
                              }
                              className="font-mono text-[#176B87] hover:underline"
                            >
                              Log ID: {log.id} {expandedAuditId === log.id ? '▲' : '▼'}
                            </button>
                            {expandedAuditId === log.id && (
                              <span className="font-mono">Payload Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* =========================================================================
              DRAWER FOOTER & ACTIONS:
              Compact, accessible action toolbar
              Capture Update | Review Match | Open Evidence | View Dependency Impact
              ========================================================================= */}
          <div className="px-4 sm:px-6 py-3 border-t border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleViewDependencyImpact}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  activeTab === 'dependencies'
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white text-[#596579] hover:text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                }`}
                title="View upstream and downstream dependencies"
              >
                Dependencies
              </button>

              <button
                type="button"
                onClick={handleOpenEvidence}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                  activeTab === 'evidence'
                    ? 'bg-[#176B87] text-white border-[#176B87]'
                    : 'bg-white text-[#596579] hover:text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                }`}
                title="View linked evidence"
              >
                Evidence
              </button>

              <button
                type="button"
                onClick={handleReviewMatch}
                className="px-3 py-1.5 text-xs font-semibold bg-white text-[#176B87] border border-[#176B87] hover:bg-[#EDF5F8] rounded-lg transition-colors"
                title="Review AI candidate matches"
              >
                Review Match
              </button>
            </div>

            <button
              type="button"
              onClick={handleCaptureUpdate}
              className="px-3 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs transition-colors inline-flex items-center gap-2 flex-shrink-0"
              title="Capture physical site progress"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Capture Update</span>
            </button>
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
          <div className="relative w-full max-w-sm bg-white rounded-lg border border-[#D9DEE5] shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-2">
              <span className="font-mono font-bold text-xs text-[#176B87]">{previewEvidenceModal.id}</span>
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="text-[#596579] hover:text-[#172033]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#172033]">{previewEvidenceModal.title}</h4>
              <p className="text-[11px] text-[#596579] font-mono mt-0.5">
                {previewEvidenceModal.filename} • {previewEvidenceModal.fileSize}
              </p>
            </div>

            <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] text-center space-y-1">
              <Camera className="w-8 h-8 text-[#7B8798] mx-auto" />
              <p className="text-[11px] text-[#596579]">Cryptographically sealed proof.</p>
              <div className="font-mono text-[11px] text-[#7B8798] break-all">
                SHA: {previewEvidenceModal.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="px-3 py-1 text-xs font-semibold text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
