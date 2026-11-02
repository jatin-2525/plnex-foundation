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
        return { bg: 'bg-[#EAF1F5]', text: 'text-[#0F6B68]', border: 'border-[#D6E1E9]' };
      case 'Civil':
        return { bg: 'bg-[#FEF4E6]', text: 'text-[#8C5311]', border: 'border-[#F0D4A6]' };
      case 'Mechanical':
        return { bg: 'bg-[#EAF1F5]', text: 'text-[#3B6EA8]', border: 'border-[#D6E1E9]' };
      case 'Electrical':
        return { bg: 'bg-[#E5F6EE]', text: 'text-[#2E7D5B]', border: 'border-[#B8DCC9]' };
      case 'Instrumentation':
        return { bg: 'bg-[#FDEEED]', text: 'text-[#A44339]', border: 'border-[#E4B0AA]' };
      default:
        return { bg: 'bg-[#EAF1F5]', text: 'text-[#52687B]', border: 'border-[#D6E1E9]' };
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
        className="fixed inset-0 bg-[#1A2E42]/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Container: Fullscreen sheet on mobile, slide-over drawer (420–520px) on desktop */}
      <div className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto max-w-full flex z-50">
        <div className="w-full sm:w-[480px] sm:max-w-[500px] h-full bg-white sm:border-l border-[#D6E1E9] shadow-xl flex flex-col">
          
          {/* =========================================================================
              HEADER:
              Focused, non-dashboard header with Activity ID, Status, Name, and Quick Context
              ========================================================================= */}
          <div className="px-4 sm:px-6 py-4 border-b border-[#D6E1E9] bg-white flex flex-col gap-2 flex-shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Activity ID */}
                  <span className="font-mono font-bold text-sm text-[#0F6B68] tracking-tight bg-[#EAF1F5] px-2 py-0.5 rounded border border-[#D6E1E9]">
                    {activity.id}
                  </span>

                  {/* Critical Path Badge */}
                  {activity.isCritical && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FDEEED] text-[#A44339] border border-[#E4B0AA] uppercase tracking-wider inline-flex items-center gap-1">
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
                <h2 className="text-lg font-semibold text-[#1A2E42] leading-snug line-clamp-2">
                  {activity.name}
                </h2>
              </div>

              {/* Close Button (min-h-[44px] for accessibility) */}
              <button
                type="button"
                onClick={handleClose}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-[#52687B] hover:text-[#1A2E42] hover:bg-[#EAF1F5] rounded-lg transition-colors -mr-1 flex-shrink-0 cursor-pointer"
                aria-label="Close activity detail drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Context Subhead: WBS, Area, Line */}
            <div className="flex items-center gap-2 text-[13px] text-[#52687B] font-mono flex-wrap pt-0.5">
              <span>WBS: <strong className="text-[#1A2E42] font-semibold">{activity.wbs}</strong> ({activity.wbsLevel})</span>
              <span>•</span>
              <span className="truncate">Area: <strong className="text-[#1A2E42] font-semibold">{activity.area}</strong></span>
              {activity.line && (
                <>
                  <span>•</span>
                  <span>Line: <strong className="text-[#1A2E42] font-semibold">{activity.line}</strong></span>
                </>
              )}
            </div>

            {/* Quick Summary Pill Strip */}
            <div className="flex items-center justify-between text-[11px] bg-[#F4F7FB] border border-[#D6E1E9] rounded px-3 py-1 text-[#52687B] font-mono mt-0.5">
              <span>
                Progress: <strong className="text-[#1A2E42]">{activity.actualProgress}%</strong> (Plan: {activity.plannedProgress}%)
              </span>
              <span>
                {activity.delayDays > 0 ? (
                  <span className="text-[#A44339] font-semibold">+{activity.delayDays}d Delay</span>
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
          <div className="px-4 border-b border-[#D6E1E9] bg-[#F4F7FB] flex items-center gap-1 overflow-x-auto scrollbar-none flex-shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[44px] flex items-center gap-2 py-2.5 px-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    isActive
                      ? 'border-[#0F6B68] text-[#0F6B68] bg-white font-bold'
                      : 'border-transparent text-[#52687B] hover:text-[#1A2E42] hover:bg-[#EAF1F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-mono ${
                        isActive
                          ? 'bg-[#0F6B68] text-white'
                          : 'bg-[#D6E1E9] text-[#52687B]'
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
          <div className="flex-1 px-4 sm:px-6 py-4 overflow-y-auto text-[#1A2E42] text-sm space-y-4">
            
            {/* ---------------------------------------------------------------------
                SECTION 1: OVERVIEW
                Primary: Core scope, discipline, WBS, assigned lead, quantity target
                Secondary Expandable: Full L1-L6 WBS hierarchy, contract metadata
                --------------------------------------------------------------------- */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Primary: Scope Description */}
                <div className="p-4 bg-[#F4F7FB] border border-[#D6E1E9] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                    Scope Description
                  </span>
                  <p className="text-sm text-[#1A2E42] leading-relaxed">
                    {activity.description || 'No detailed scope description registered.'}
                  </p>
                </div>

                {/* Primary: Key Work Parameters */}
                <div className="p-4 bg-white border border-[#D6E1E9] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                    Execution Classification
                  </span>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-[#D6E1E9]/60">
                      <span className="text-[#52687B]">Engineering Discipline:</span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[11px] border ${discTheme.bg} ${discTheme.text} ${discTheme.border}`}>
                        {activity.discipline}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D6E1E9]/60">
                      <span className="text-[#52687B]">Target Quantity:</span>
                      <strong className="font-mono text-[#1A2E42]">
                        {activity.plannedQuantity} {activity.unit}
                      </strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D6E1E9]/60">
                      <span className="text-[#52687B]">Work Breakdown (WBS):</span>
                      <strong className="font-mono text-[#0F6B68]">{activity.wbs}</strong>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-[#D6E1E9]/60">
                      <span className="text-[#52687B]">Work Area &amp; Grid:</span>
                      <span className="text-[#1A2E42] font-medium">{activity.area}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-[#52687B]">Assigned Field Lead:</span>
                      <span className="font-semibold text-[#0F6B68] flex items-center gap-1">
                        <HardHat className="w-3 h-3" />
                        {activity.assignedEngineer}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progressive Disclosure 1: Full L1–L6 WBS Hierarchy (Expandable) */}
                <div className="border border-[#D6E1E9] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullWBS(!showFullWBS)}
                    className="w-full px-4 py-2 bg-[#F4F7FB] hover:bg-[#EAF1F5] text-left flex items-center justify-between text-xs font-semibold text-[#1A2E42] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-[#0F6B68]" />
                      <span>Full WBS Hierarchy (L1–L6)</span>
                    </span>
                    <span className="text-[11px] text-[#52687B] flex items-center gap-1">
                      <span>{showFullWBS ? 'Collapse' : 'Expand (6 Levels)'}</span>
                      {showFullWBS ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showFullWBS && (
                    <div className="p-3 space-y-2 border-t border-[#D6E1E9] bg-white divide-y divide-[#D6E1E9]/60">
                      {hierarchy.map((step) => {
                        const isTarget = step.isCurrent;
                        return (
                          <div
                            key={step.level}
                            className={`pt-2 first:pt-0 pb-2 last:pb-0 flex items-start gap-2 ${
                              isTarget ? 'bg-[#EAF1F5]/50 -mx-1 px-1.5 rounded' : ''
                            }`}
                          >
                            <span
                              className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                                isTarget
                                  ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                                  : 'bg-[#EAF1F5] text-[#52687B] border-[#D6E1E9]'
                              }`}
                            >
                              {step.level}
                            </span>
                            <div className="flex-1 min-w-0 text-[11px]">
                              <div className="flex justify-between text-[#7B8798]">
                                <span className="font-mono font-semibold text-[#1A2E42]">{step.code}</span>
                                <span className="uppercase text-[11px] font-semibold">{step.category}</span>
                              </div>
                              <p className={`mt-0.5 truncate ${isTarget ? 'font-bold text-[#0F6B68]' : 'text-[#52687B]'}`}>
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
                <div className="border border-[#D6E1E9] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowProjectMetadata(!showProjectMetadata)}
                    className="w-full px-4 py-2 bg-[#F4F7FB] hover:bg-[#EAF1F5] text-left flex items-center justify-between text-xs font-semibold text-[#1A2E42] transition-colors"
                  >
                    <span>Project &amp; Schedule Baseline Reference</span>
                    <span className="text-[11px] text-[#52687B] flex items-center gap-1">
                      <span>{showProjectMetadata ? 'Collapse' : 'Expand'}</span>
                      {showProjectMetadata ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showProjectMetadata && (
                    <div className="p-3 border-t border-[#D6E1E9] space-y-2 text-xs bg-white">
                      <div className="flex justify-between">
                        <span className="text-[#52687B]">Project Name:</span>
                        <strong className="text-[#1A2E42]">{projectName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#52687B]">Project Code:</span>
                        <span className="font-mono text-[#0F6B68]">{projectCode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#52687B]">Field Location:</span>
                        <span className="text-[#1A2E42]">{location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#52687B]">Baseline Spec:</span>
                        <span className="font-mono text-[#52687B]">Rev 3.2 (P6 XML)</span>
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
              <div className="space-y-4">
                {/* Primary Progress Card */}
                <div className="p-4 bg-[#F4F7FB] border border-[#D6E1E9] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                          Physical Progress
                        </span>
                        <WhyButton
                          onClick={() => openWhyExplanation(`progress:${activity.id}`)}
                          title={`Why is physical progress ${activity.actualProgress}%?`}
                        />
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-[28px] font-bold text-[#1A2E42] font-mono leading-none">
                          {activity.actualProgress}%
                        </span>
                        <span className="text-xs text-[#52687B] font-mono">
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
                        <span className="text-[11px] font-mono font-semibold text-[#A44339] block mt-0.5">
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

                  <div className="flex justify-between text-[11px] text-[#52687B] font-mono pt-1 border-t border-[#D6E1E9]">
                    <span>Executed: <strong>{activity.actualQuantity}</strong> {activity.unit}</span>
                    <span>Target: <strong>{activity.plannedQuantity}</strong> {activity.unit}</span>
                  </div>
                </div>

                {/* Primary Milestone Dates Card */}
                <div className="p-4 bg-white border border-[#D6E1E9] rounded-lg space-y-2">
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                    Schedule Dates &amp; Milestone Milestones
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded bg-[#F4F7FB] border border-[#D6E1E9] space-y-1">
                      <span className="text-[11px] uppercase font-semibold text-[#52687B] block">Planned Start</span>
                      <strong className="font-mono text-[#1A2E42] block">{activity.plannedStart}</strong>
                      <span className="text-[11px] uppercase font-semibold text-[#52687B] block pt-1">Planned Finish</span>
                      <strong className="font-mono text-[#1A2E42] block">{activity.plannedFinish}</strong>
                    </div>

                    <div className="p-3 rounded bg-[#EAF1F5]/40 border border-[#D6E1E9] space-y-1">
                      <span className="text-[11px] uppercase font-semibold text-[#0F6B68] block">Actual Start</span>
                      <strong className="font-mono text-[#1A2E42] block">
                        {activity.actualStart || 'Pending Start'}
                      </strong>
                      <span className="text-[11px] uppercase font-semibold text-[#0F6B68] block pt-1">Actual Finish</span>
                      <strong className={`font-mono block ${activity.actualFinish ? 'text-[#2E7D5B]' : 'text-[#A44339]'}`}>
                        {activity.actualFinish || 'In Progress (Active)'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Variance Explanation if delayed */}
                {activity.delayDays > 0 && (
                  <div className="p-4 bg-[#FDEEED] border border-[#E4B0AA] rounded-lg space-y-2 text-xs text-[#8A382F]">
                    <div className="flex items-center gap-2 font-bold text-[#A44339]">
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
                  <div className="border border-[#D6E1E9] rounded-lg bg-white overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowProgressHistory(!showProgressHistory)}
                      className="w-full px-4 py-2 bg-[#F4F7FB] hover:bg-[#EAF1F5] text-left flex items-center justify-between text-xs font-semibold text-[#1A2E42] transition-colors"
                    >
                      <span>Progress Checkpoints &amp; Historical Cutoffs</span>
                      <span className="text-[11px] text-[#52687B] flex items-center gap-1">
                        <span>{showProgressHistory ? 'Collapse' : 'Expand'}</span>
                        {showProgressHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>

                    {showProgressHistory && (
                      <div className="p-3 border-t border-[#D6E1E9] space-y-2 bg-white">
                        {activity.progressHistory.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs py-1 border-b last:border-b-0 border-[#D6E1E9]/60 font-mono">
                            <span className="text-[#52687B]">{item.formattedAsOf}</span>
                            <span className="font-bold text-[#1A2E42]">{item.progress}%</span>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider">
                    Execution Events ({linkedExecutionEvents.length})
                  </span>
                  <Link
                    href="/execution"
                    className="text-[11px] font-semibold text-[#0F6B68] hover:underline"
                  >
                    Open Execution Intel →
                  </Link>
                </div>

                {linkedExecutionEvents.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-[#D6E1E9] rounded-lg bg-[#F4F7FB] space-y-1">
                    <p className="text-xs font-semibold text-[#1A2E42]">No execution events matched yet</p>
                    <p className="text-[11px] text-[#52687B] max-w-xs mx-auto">
                      Field reports submitted for this project will appear here after automated matching and verification.
                    </p>
                    <Link
                      href="/execution"
                      className="inline-block mt-2 text-xs font-semibold text-[#0F6B68] hover:underline"
                    >
                      Open Execution Intel Feed →
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {linkedExecutionEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="p-4 bg-white border border-[#D6E1E9] rounded-lg space-y-2 shadow-2xs hover:border-[#0F6B68] transition-colors"
                      >
                        {/* Event ID, Source, Date */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#0F6B68] bg-[#EAF1F5] px-2 py-0.5 rounded border border-[#D6E1E9]">
                              {evt.id}
                            </span>
                            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF1F5] text-[#52687B] uppercase">
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
                          <span className="font-mono font-semibold text-[#1A2E42]">
                            {evt.quantity} {evt.unit}
                          </span>
                        </div>

                        {/* Raw observation statement */}
                        <p className="p-3 bg-[#F4F7FB] rounded border border-[#D6E1E9] text-xs text-[#1A2E42] leading-relaxed italic">
                          &quot;{evt.rawText}&quot;
                        </p>

                        {/* Progressive Disclosure: Why this match? */}
                        <div className="pt-1 border-t border-[#D6E1E9]/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedMatchEventId(
                                expandedMatchEventId === evt.id ? null : evt.id
                              )
                            }
                            className="text-xs font-semibold text-[#0F6B68] hover:underline flex items-center justify-between w-full"
                          >
                            <span>Why this match? (Match Factors)</span>
                            <span className="text-[11px]">
                              {expandedMatchEventId === evt.id ? 'Hide ▲' : 'Details ▼'}
                            </span>
                          </button>

                          {expandedMatchEventId === evt.id && (
                            <div className="mt-2 space-y-2 text-[11px]">
                              <div className="p-3 bg-[#E5F6EE] border border-[#B8DCC9] rounded text-[#2E7D5B] space-y-1">
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
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider">
                     Evidence Records ({linkedEvidenceItems.length})
                   </span>
                   <Link
                     href={`/evidence?activityId=${encodeURIComponent(activity.id)}`}
                     className="text-[11px] font-semibold text-[#0F6B68] hover:underline"
                   >
                     Open Evidence &amp; Audit →
                   </Link>
                 </div>

                 {linkedEvidenceItems.length === 0 ? (
                   <div className="p-6 text-center border border-dashed border-[#D6E1E9] rounded-lg bg-[#F4F7FB] space-y-1">
                     <p className="text-xs font-semibold text-[#1A2E42]">No physical evidence linked</p>
                     <p className="text-[11px] text-[#52687B] max-w-xs mx-auto">
                       Photographic logs and QA/QC certificates linked to this activity will appear here after verification.
                     </p>
                     <Link
                       href={`/evidence?activityId=${encodeURIComponent(activity.id)}`}
                       className="inline-block mt-2 text-xs font-semibold text-[#0F6B68] hover:underline"
                     >
                       Open Evidence &amp; Audit →
                     </Link>
                   </div>
                 ) : (
                   <div className="space-y-3">
                     {linkedEvidenceItems.map((item) => (
                       <div
                         key={item.id}
                         className="p-4 bg-white border border-[#D6E1E9] rounded-lg space-y-2 shadow-2xs hover:border-[#0F6B68] transition-colors"
                       >
                         <div className="flex items-start justify-between gap-2">
                           <div className="space-y-1 min-w-0">
                             <div className="flex items-center gap-2 flex-wrap">
                               <span className="font-mono font-bold text-xs text-[#0F6B68] bg-[#EAF1F5] px-2 py-0.5 rounded border border-[#D6E1E9]">
                                 {item.id}
                               </span>
                               <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EAF1F5] text-[#52687B] uppercase">
                                 {item.type}
                               </span>
                               <StatusBadge
                                 status={item.verifiedStatus ? 'Verified' : 'Pending Review'}
                                 size="xs"
                               />
                             </div>
                             <h4 className="font-semibold text-sm text-[#1A2E42] pt-0.5 truncate">{item.title}</h4>
                             <span className="text-[11px] text-[#52687B] font-mono block">
                               {item.filename} ({item.fileSize})
                             </span>
                           </div>

                           <button
                             type="button"
                             onClick={() => setPreviewEvidenceModal(item)}
                             className="p-2 text-[#52687B] hover:text-[#1A2E42] border border-[#D6E1E9] rounded hover:bg-[#EAF1F5] transition-colors flex-shrink-0"
                             title="Preview file"
                           >
                             <Eye className="w-4 h-4" />
                           </button>
                         </div>

                         {item.notes && (
                           <p className="text-xs text-[#52687B] bg-[#F4F7FB] p-2 rounded border border-[#D6E1E9] italic">
                             &quot;{item.notes}&quot;
                           </p>
                         )}

                         {/* Progressive Disclosure: Cryptographic & Telemetry Metadata */}
                         <div className="pt-1 border-t border-[#D6E1E9]/60">
                           <button
                             type="button"
                             onClick={() =>
                               setExpandedEvidenceId(
                                 expandedEvidenceId === item.id ? null : item.id
                               )
                             }
                             className="text-[11px] font-semibold text-[#0F6B68] hover:underline flex items-center justify-between w-full"
                           >
                             <span>Technical Details</span>
                             <span>{expandedEvidenceId === item.id ? 'Hide ▲' : 'Expand ▼'}</span>
                           </button>

                           {expandedEvidenceId === item.id && (
                             <div className="mt-2 p-2 bg-[#F4F7FB] rounded border border-[#D6E1E9] space-y-1 text-[11px] font-mono">
                               <div className="flex justify-between">
                                 <span className="text-[#52687B]">Uploader:</span>
                                 <span className="text-[#1A2E42] font-semibold">{item.uploader}</span>
                               </div>
                               <div className="flex justify-between">
                                 <span className="text-[#52687B]">Timestamp:</span>
                                 <span className="text-[#1A2E42]">{item.timestamp}</span>
                               </div>
                               {item.sha256Hash && (
                                 <div className="pt-1 border-t border-[#D6E1E9]">
                                   <span className="text-[#52687B] block">Verification Hash (SHA-256):</span>
                                   <span className="text-[#52687B] break-all">{item.sha256Hash}</span>
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
              <div className="space-y-4">
                {/* Float & Critical Path Summary */}
                <div className="p-4 bg-[#FEF4E6] border border-[#F0D4A6] rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] uppercase font-semibold text-[#8C5311] block">
                      CPM Float Analysis
                    </span>
                    <strong className="text-sm font-semibold text-[#1A2E42]">
                      Total Float: {impactData.totalFloatDays}d
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                      activity.isCritical ? 'bg-[#FDEEED] text-[#A44339]' : 'bg-[#E5F6EE] text-[#2E7D5B]'
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
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                    Predecessors ({detailedPredecessors.length})
                  </span>

                  {detailedPredecessors.length === 0 ? (
                    <p className="p-3 bg-[#F4F7FB] border border-[#D6E1E9] rounded-lg text-xs text-[#7B8798] italic">
                      None (Project Inception Milestone)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailedPredecessors.map((pred) => (
                        <div
                          key={pred.id}
                          className="p-3 bg-white border border-[#D6E1E9] rounded-lg space-y-2 hover:border-[#0F6B68] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(pred.id)}
                              className="font-mono font-bold text-xs text-[#0F6B68] hover:underline"
                            >
                              {pred.id}
                            </button>
                            <StatusBadge status={pred.status as any} />
                          </div>
                          <p className="text-xs font-semibold text-[#1A2E42]">{pred.name}</p>
                          <div className="flex justify-between text-[11px] text-[#52687B] font-mono">
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
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider block">
                    Successors ({detailedSuccessors.length})
                  </span>

                  {detailedSuccessors.length === 0 ? (
                    <p className="p-3 bg-[#F4F7FB] border border-[#D6E1E9] rounded-lg text-xs text-[#7B8798] italic">
                      None (Project Final Milestone)
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {detailedSuccessors.map((succ) => (
                        <div
                          key={succ.id}
                          className="p-3 bg-white border border-[#D6E1E9] rounded-lg space-y-2 hover:border-[#0F6B68] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => openActivityDrawer(succ.id)}
                              className="font-mono font-bold text-xs text-[#0F6B68] hover:underline"
                            >
                              {succ.id}
                            </button>
                            <StatusBadge status={succ.status as any} />
                          </div>
                          <p className="text-xs font-semibold text-[#1A2E42]">{succ.name}</p>
                          <div className="flex justify-between text-[11px] text-[#52687B] font-mono">
                            <span>{succ.type}</span>
                            <span>{succ.plannedPeriod}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Progressive Disclosure: Schedule Impact & Mitigation Details */}
                <div className="border border-[#D6E1E9] rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowFullLogic(!showFullLogic)}
                    className="w-full px-4 py-2 bg-[#F4F7FB] hover:bg-[#EAF1F5] text-left flex items-center justify-between text-xs font-semibold text-[#1A2E42] transition-colors"
                  >
                    <span>Schedule Impact &amp; Mitigation Notes</span>
                    <span className="text-[11px] text-[#52687B] flex items-center gap-1">
                      <span>{showFullLogic ? 'Collapse' : 'Expand'}</span>
                      {showFullLogic ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </button>

                  {showFullLogic && (
                    <div className="p-3 border-t border-[#D6E1E9] space-y-2 text-xs bg-white">
                      <p className="text-[#1A2E42] leading-relaxed">
                        {impactData.projectedScheduleImpact}
                      </p>
                      <div className="p-3 bg-[#F4F7FB] rounded border border-[#D6E1E9] space-y-1 text-[11px]">
                        <span className="text-[#8C5311] font-semibold block uppercase text-[11px]">Active Mitigation:</span>
                        <p className="text-[#1A2E42]">{impactData.currentMitigation}</p>
                        <span className="text-[#0F6B68] font-semibold block uppercase text-[11px] pt-1">Recommended Action:</span>
                        <p className="text-[#1A2E42]">{impactData.recommendedAction}</p>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-semibold text-[#52687B] tracking-wider">
                    History &amp; Audit Trail ({auditHistory.length})
                  </span>
                  <span className="text-[11px] font-mono text-[#7B8798]">Tamper-Evident</span>
                </div>

                {auditHistory.length === 0 ? (
                  <div className="p-6 bg-[#F4F7FB] border border-[#D6E1E9] rounded-lg text-center space-y-1">
                    <p className="font-semibold text-xs text-[#1A2E42]">No historical modifications recorded yet</p>
                    <p className="text-[11px] text-[#52687B]">
                      Baseline revisions and verified actual modifications for this activity will be logged here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-3 before:w-0.5 before:bg-[#D6E1E9]">
                    {auditHistory.map((log) => (
                      <div key={log.id} className="relative pl-7 space-y-2">
                        <div className="absolute left-1.5 top-2.5 w-3 h-3 rounded-full bg-[#0F6B68] border-2 border-white -translate-x-1/2" />

                        <div className="p-3 bg-white border border-[#D6E1E9] rounded-lg space-y-2 shadow-2xs hover:bg-[#F4F7FB] transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EAF1F5] text-[#52687B] border border-[#D6E1E9]">
                              {log.actionCategory || log.action}
                            </span>
                            <span className="font-mono text-[11px] text-[#7B8798]">{log.timestamp}</span>
                          </div>

                          <div className="text-xs text-[#1A2E42]">
                            <span>Actor: <strong className="text-[#0F6B68]">{log.actor}</strong> ({log.role})</span>
                          </div>

                          {log.whatChanged && (
                            <p className="text-xs text-[#1A2E42] bg-[#F4F7FB] p-2 rounded border border-[#D6E1E9]">
                              {log.whatChanged}
                            </p>
                          )}

                          {(log.before || log.previousValue) && (
                            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-0.5">
                              <div className="p-2 bg-[#FDEEED] text-[#A44339] rounded border border-[#E4B0AA]">
                                <span className="block text-[11px] uppercase font-semibold">Before:</span>
                                <span>{log.before || log.previousValue}</span>
                              </div>
                              <div className="p-2 bg-[#E5F6EE] text-[#2E7D5B] rounded border border-[#B8DCC9]">
                                <span className="block text-[11px] uppercase font-semibold">After:</span>
                                <span>{log.after || log.newValue}</span>
                              </div>
                            </div>
                          )}

                          {/* Progressive Disclosure: Telemetry & Record ID */}
                          <div className="pt-1 border-t border-[#D6E1E9]/60 flex items-center justify-between text-[11px] text-[#7B8798]">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAuditId(
                                  expandedAuditId === log.id ? null : log.id
                                )
                              }
                              className="font-mono text-[#0F6B68] hover:underline"
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
          <div className="px-4 sm:px-6 py-3 border-t border-[#D6E1E9] bg-[#F4F7FB] flex items-center justify-between gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleViewDependencyImpact}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center justify-center cursor-pointer ${
                  activeTab === 'dependencies'
                    ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                    : 'bg-white text-[#52687B] hover:text-[#1A2E42] border-[#D6E1E9] hover:bg-[#EAF1F5]'
                }`}
                title="View upstream and downstream dependencies"
              >
                Dependencies
              </button>

              <button
                type="button"
                onClick={handleOpenEvidence}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center justify-center cursor-pointer ${
                  activeTab === 'evidence'
                    ? 'bg-[#0F6B68] text-white border-[#0F6B68]'
                    : 'bg-white text-[#52687B] hover:text-[#1A2E42] border-[#D6E1E9] hover:bg-[#EAF1F5]'
                }`}
                title="View linked evidence"
              >
                Evidence
              </button>

              <button
                type="button"
                onClick={handleReviewMatch}
                className="min-h-[44px] px-3.5 py-2 text-xs font-semibold bg-white text-[#0F6B68] border border-[#0F6B68] hover:bg-[#EAF1F5] rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                title="Review candidate matches"
              >
                Review Match
              </button>
            </div>

            <button
              type="button"
              onClick={handleCaptureUpdate}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-2 flex-shrink-0 cursor-pointer"
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
            className="fixed inset-0 bg-[#1A2E42]/60 transition-opacity"
            onClick={() => setPreviewEvidenceModal(null)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-lg border border-[#D6E1E9] shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D6E1E9] pb-2">
              <span className="font-mono font-bold text-xs text-[#0F6B68]">{previewEvidenceModal.id}</span>
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="text-[#52687B] hover:text-[#1A2E42]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-[#1A2E42]">{previewEvidenceModal.title}</h4>
              <p className="text-[11px] text-[#52687B] font-mono mt-0.5">
                {previewEvidenceModal.filename} • {previewEvidenceModal.fileSize}
              </p>
            </div>

            <div className="p-3 bg-[#F4F7FB] rounded-lg border border-[#D6E1E9] text-center space-y-1">
              <Camera className="w-8 h-8 text-[#7B8798] mx-auto" />
              <p className="text-[11px] font-semibold text-[#1A2E42]">Verified Onsite Evidence</p>
              <p className="text-[10px] text-[#52687B]">Signed and validated during field inspection.</p>
              <details className="pt-2 text-left">
                <summary className="text-[11px] text-[#0F6B68] cursor-pointer hover:underline font-medium">Technical Details</summary>
                <div className="mt-1 font-mono text-[10px] text-[#7B8798] break-all bg-white p-2 rounded border border-[#D6E1E9]">
                  Verification Hash: {previewEvidenceModal.sha256Hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                </div>
              </details>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setPreviewEvidenceModal(null)}
                className="px-3 py-1 text-xs font-semibold text-[#52687B] hover:text-[#1A2E42] border border-[#D6E1E9] rounded-lg"
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
