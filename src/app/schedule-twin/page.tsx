'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Drawer } from '../../components/shared/Drawer';
import { Modal } from '../../components/shared/Modal';
import {
  ScheduleActivity,
  ExecutionEvent,
  EvidenceItem,
  WBSLevel,
  DisciplineType,
} from '../../types';
import {
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
} from '../../lib/api/mockData';
import {
  Layers,
  Calendar,
  ClipboardList,
  GitCompare,
  FileText,
  Camera,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Search,
  Filter,
  ChevronRight,
  ChevronDown,
  Info,
  ShieldCheck,
  TrendingDown,
  User,
  SlidersHorizontal,
  Maximize2,
  ExternalLink,
  Eye,
  Building2,
} from 'lucide-react';

interface HierarchyNode {
  id: string;
  code: string;
  name: string;
  level: WBSLevel;
  discipline?: DisciplineType;
  activityId?: string; // Links to ScheduleActivity
  plannedProgress: number;
  actualProgress: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'pending';
  delayDays: number;
  isCritical?: boolean;
  children?: HierarchyNode[];
}

export default function ScheduleTwinPage() {
  const { activeProject, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  // Selected Activity State (Defaults to PIP-24-002 which has rich execution & evidence links)
  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-24-002');
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<EvidenceItem | null>(null);

  // Left Hierarchy UI Controls
  const [hierarchySearch, setHierarchySearch] = useState('');
  const [hierarchyLevelFilter, setHierarchyLevelFilter] = useState<string>('all');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'L1-MAIN': true,
    'L2-AREA100': true,
    'L3-PIP': true,
    'L4-WP32': true,
  });

  const breadcrumbs = [
    { label: 'Schedule Controls' },
    { label: 'Schedule Twin', current: true },
  ];

  // Activities list
  const activities: ScheduleActivity[] = useMemo(() => {
    return MOCK_ACTIVITIES;
  }, []);

  // Currently selected activity object
  const selectedActivity: ScheduleActivity = useMemo(() => {
    const act = activities.find((a) => a.id === selectedActivityId);
    return act || activities[0];
  }, [activities, selectedActivityId]);

  // Linked Execution Events for the selected activity
  const linkedEvents: ExecutionEvent[] = useMemo(() => {
    return MOCK_EXECUTION_EVENTS.filter(
      (e) =>
        e.matchedActivityId === selectedActivity.id ||
        selectedActivity.executionEventIds.includes(e.id)
    );
  }, [selectedActivity]);

  // Linked Evidence Items for the selected activity
  const linkedEvidence: EvidenceItem[] = useMemo(() => {
    return MOCK_EVIDENCE_ITEMS.filter(
      (ev) =>
        ev.activityId === selectedActivity.id ||
        selectedActivity.evidenceIds.includes(ev.id) ||
        linkedEvents.some((e) => e.evidenceIds.includes(ev.id))
    );
  }, [selectedActivity, linkedEvents]);

  // Verification Details for the selected activity
  const verificationDetails = useMemo(() => {
    if (linkedEvents.length > 0) {
      const topEvent = linkedEvents[0];
      return {
        confidence: topEvent.confidence,
        matchReason:
          topEvent.matchedReasons.join('; ') ||
          'Matched on line identifier, welding action verb, and scheduled window.',
        reviewState:
          topEvent.status === 'auto-linked'
            ? 'Auto-Linked & Verified'
            : topEvent.status === 'approved'
            ? 'Manager Approved'
            : 'Pending Human Review',
        reviewer: topEvent.verifiedBy || topEvent.reviewedBy || 'Debajit Borah (Site QC Lead)',
        verifiedAt: topEvent.verifiedAt || topEvent.createdAt,
      };
    }
    return {
      confidence: selectedActivity.actualProgress > 0 ? 88 : 0,
      matchReason: 'Historical baseline progress committed via Primavera P6 sync.',
      reviewState: selectedActivity.actualProgress > 0 ? 'Baseline Confirmed' : 'Scheduled',
      reviewer: 'System Synchronizer (Rev 3.2)',
      verifiedAt: '2026-09-18 17:30 UTC',
    };
  }, [linkedEvents, selectedActivity]);

  // L1-L6 Hierarchy Tree Data
  const hierarchyTree: HierarchyNode = useMemo(() => {
    return {
      id: 'L1-MAIN',
      code: activeProject.code,
      name: activeProject.name,
      level: 'L1',
      plannedProgress: activeProject.plannedProgress,
      actualProgress: activeProject.overallProgress,
      status: activeProject.status,
      delayDays: activeProject.status === 'delayed' ? 4 : 2,
      isCritical: true,
      children: [
        {
          id: 'L2-AREA100',
          code: 'AREA-100',
          name: 'Unit A - Gas Processing Area',
          level: 'L2',
          plannedProgress: 78,
          actualProgress: 72,
          status: 'at-risk',
          delayDays: 2,
          isCritical: true,
          children: [
            {
              id: 'L3-PIP',
              code: 'DISC-PIP',
              name: 'Piping Systems & Manifolds',
              level: 'L3',
              discipline: 'Piping',
              plannedProgress: 85,
              actualProgress: 70,
              status: 'delayed',
              delayDays: 2,
              isCritical: true,
              children: [
                {
                  id: 'L4-WP32',
                  code: 'WP-3.2',
                  name: 'High-Pressure Header Package',
                  level: 'L4',
                  discipline: 'Piping',
                  plannedProgress: 80,
                  actualProgress: 68,
                  status: 'delayed',
                  delayDays: 2,
                  isCritical: true,
                  children: [
                    {
                      id: 'L5-PIP24001',
                      code: 'PIP-24-001',
                      name: 'Erect Line 24-XX High Pressure Header',
                      level: 'L5',
                      discipline: 'Piping',
                      activityId: 'PIP-24-001',
                      plannedProgress: 100,
                      actualProgress: 100,
                      status: 'delayed',
                      delayDays: 2,
                      isCritical: true,
                      children: [
                        {
                          id: 'L6-SUB2401',
                          code: 'SUB-24-01',
                          name: 'Rigging & Spool Hoisting Section B',
                          level: 'L6',
                          discipline: 'Piping',
                          plannedProgress: 100,
                          actualProgress: 100,
                          status: 'completed',
                          delayDays: 0,
                        },
                      ],
                    },
                    {
                      id: 'L5-PIP24002',
                      code: 'PIP-24-002',
                      name: 'Weld Line 24-XX Field Joints & NDT',
                      level: 'L5',
                      discipline: 'Piping',
                      activityId: 'PIP-24-002',
                      plannedProgress: 85,
                      actualProgress: 70,
                      status: 'delayed',
                      delayDays: 2,
                      isCritical: true,
                      children: [
                        {
                          id: 'L6-SUB2403',
                          code: 'SUB-24-03',
                          name: 'Root Pass GTAW Welding (8 Joints)',
                          level: 'L6',
                          discipline: 'Piping',
                          plannedProgress: 100,
                          actualProgress: 100,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB2404',
                          code: 'SUB-24-04',
                          name: 'Fill & Cap Passes (4 Joints)',
                          level: 'L6',
                          discipline: 'Piping',
                          plannedProgress: 70,
                          actualProgress: 40,
                          status: 'delayed',
                          delayDays: 2,
                        },
                      ],
                    },
                    {
                      id: 'L5-PIP24003',
                      code: 'PIP-24-003',
                      name: 'Hydrostatic Test Line 24-XX (150 bar)',
                      level: 'L5',
                      discipline: 'Piping',
                      activityId: 'PIP-24-003',
                      plannedProgress: 0,
                      actualProgress: 0,
                      status: 'pending',
                      delayDays: 2,
                      isCritical: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'L3-CIV',
              code: 'DISC-CIV',
              name: 'Civil Reinforced Concrete Foundations',
              level: 'L3',
              discipline: 'Civil',
              plannedProgress: 100,
              actualProgress: 100,
              status: 'completed',
              delayDays: 0,
              children: [
                {
                  id: 'L4-WP21',
                  code: 'WP-2.1',
                  name: 'Compressor Foundations Package',
                  level: 'L4',
                  discipline: 'Civil',
                  plannedProgress: 100,
                  actualProgress: 100,
                  status: 'completed',
                  delayDays: 0,
                  children: [
                    {
                      id: 'L5-CIV11001',
                      code: 'CIV-11-001',
                      name: 'Foundation Block A - Compressor Pedestal',
                      level: 'L5',
                      discipline: 'Civil',
                      activityId: 'CIV-11-001',
                      plannedProgress: 100,
                      actualProgress: 100,
                      status: 'completed',
                      delayDays: 0,
                      isCritical: true,
                    },
                  ],
                },
              ],
            },
            {
              id: 'L3-MEC',
              code: 'DISC-MEC',
              name: 'Mechanical Compression Skids',
              level: 'L3',
              discipline: 'Mechanical',
              plannedProgress: 20,
              actualProgress: 15,
              status: 'on-track',
              delayDays: 0,
              children: [
                {
                  id: 'L5-MEC08003',
                  code: 'MEC-08-003',
                  name: 'Align Centrifugal Gas Compressor Skid A',
                  level: 'L5',
                  discipline: 'Mechanical',
                  activityId: 'MEC-08-003',
                  plannedProgress: 20,
                  actualProgress: 15,
                  status: 'on-track',
                  delayDays: 0,
                },
              ],
            },
            {
              id: 'L3-ELE',
              code: 'DISC-ELE',
              name: 'Electrical Cable Tray Galleries',
              level: 'L3',
              discipline: 'Electrical',
              plannedProgress: 50,
              actualProgress: 40,
              status: 'at-risk',
              delayDays: 1,
              children: [
                {
                  id: 'L5-ELE11032',
                  code: 'ELE-11-032',
                  name: 'Cable Tray Installation - Bay 1-4',
                  level: 'L5',
                  discipline: 'Electrical',
                  activityId: 'ELE-11-032',
                  plannedProgress: 50,
                  actualProgress: 40,
                  status: 'at-risk',
                  delayDays: 1,
                },
              ],
            },
          ],
        },
      ],
    };
  }, [activeProject]);

  // Toggle Node Expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const handleSelectHierarchyActivity = (node: HierarchyNode) => {
    if (node.activityId) {
      setSelectedActivityId(node.activityId);
      openActivityDrawer(node.activityId);
    }
  };

  // Render Left Hierarchy Tree Node
  const renderLeftTreeNode = (node: HierarchyNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedNodes[node.id]);
    const isSelected = node.activityId === selectedActivityId;

    if (hierarchySearch.trim()) {
      const q = hierarchySearch.toLowerCase().trim();
      const matches =
        node.name.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.level.toLowerCase().includes(q);

      const hasMatchingDescendant = (n: HierarchyNode): boolean => {
        if (n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)) return true;
        return Boolean(n.children?.some(hasMatchingDescendant));
      };

      if (!matches && !node.children?.some(hasMatchingDescendant)) {
        return null;
      }
    }

    if (hierarchyLevelFilter !== 'all') {
      if (hierarchyLevelFilter === 'L5-L6' && !['L5', 'L6'].includes(node.level)) {
        // Continue rendering to show children
      }
    }

    return (
      <React.Fragment key={node.id}>
        <div
          onClick={() => {
            if (node.activityId) {
              setSelectedActivityId(node.activityId);
            } else if (hasChildren) {
              toggleNode(node.id);
            }
          }}
          className={`flex items-center justify-between py-2 px-2.5 rounded-md cursor-pointer text-xs transition-colors mb-0.5 select-none ${
            isSelected
              ? 'bg-[#176B87] text-white font-semibold shadow-xs'
              : 'hover:bg-[#E8EBF0] text-[#172033]'
          }`}
          style={{ paddingLeft: `${Math.max(8, depth * 14 + 8)}px` }}
        >
          <div className="flex items-center gap-1.5 flex-1 min-w-0 pr-1">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className={`w-4 h-4 flex items-center justify-center rounded transition-colors ${
                  isSelected ? 'hover:bg-white/20 text-white' : 'hover:bg-[#D9DEE5] text-[#596579]'
                }`}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <span className={`w-4 text-center text-[10px] ${isSelected ? 'text-white/70' : 'text-[#8A94A6]'}`}>
                •
              </span>
            )}

            <span
              className={`font-mono text-[9px] px-1 py-0.2 rounded font-bold flex-shrink-0 ${
                isSelected
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]'
              }`}
            >
              {node.level}
            </span>

            <span className={`font-mono text-[10px] truncate ${isSelected ? 'text-white' : 'text-[#596579]'}`}>
              {node.code}
            </span>

            <span className="truncate text-[11px]" title={node.name}>
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {node.delayDays > 0 && (
              <span
                className={`font-mono text-[10px] font-bold ${
                  isSelected ? 'text-white' : 'text-[#B5473C]'
                }`}
              >
                +{node.delayDays}d
              </span>
            )}
            <span
              className={`w-2 h-2 rounded-full ${
                node.status === 'completed'
                  ? 'bg-[#2E7D5B]'
                  : node.status === 'delayed'
                  ? 'bg-[#B5473C]'
                  : node.status === 'at-risk'
                  ? 'bg-[#D98B32]'
                  : 'bg-[#176B87]'
              }`}
            />
          </div>
        </div>

        {hasChildren &&
          isExpanded &&
          node.children!.map((child) => renderLeftTreeNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <StateWrapper>
      <div className="space-y-5">
        <Breadcrumbs items={breadcrumbs} />

        {/* TOP HEADER */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded bg-[#E8F1F5] flex items-center justify-center text-[#176B87]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#172033] tracking-tight">
                    Schedule Twin — Planning-to-Execution Bridge
                  </h1>
                </div>
              </div>
              <p className="text-xs text-[#596579]">
                Visual correlation of planned WBS baseline schedule activities with verified field execution events, QA/QC evidence, and delay propagation.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono text-[#596579] bg-[#F7F8FA] px-2.5 py-1 rounded border border-[#D9DEE5]">
                BASELINE: Rev 3.2 (P6 XML)
              </span>
              <span className="font-mono text-[#172033] bg-[#F7F8FA] px-2.5 py-1 rounded border border-[#D9DEE5]">
                PROJECT: {activeProject.code}
              </span>
              <button
                type="button"
                onClick={() => openActivityDrawer(selectedActivity.id)}
                className="px-3 py-1 bg-[#176B87] hover:bg-[#12546A] text-white rounded font-medium inline-flex items-center gap-1 transition-colors shadow-xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Detail Drawer</span>
              </button>
            </div>
          </div>

          {/* VISUAL LINKING WORKFLOW PIPELINE RIBBON */}
          {/* Plan → Execution → Evidence → Verification → Actual Update */}
          <div className="mt-4 pt-3 border-t border-[#E8EBF0]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-[11px] text-[#596579] uppercase tracking-wider">
                Planning-to-Execution Linking Pipeline
              </span>
              <span className="text-[11px] font-mono text-[#176B87]">
                Selected Activity: {selectedActivity.id}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Stage 1: Plan */}
              <div className="p-2.5 rounded bg-[#E8F1F5] border border-[#C5DCE6] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#176B87] font-mono">1. PLAN</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#176B87]" />
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#172033] truncate">
                  WBS {selectedActivity.wbs}
                </div>
                <span className="text-[10px] text-[#596579] truncate">P6 Baseline Target</span>
              </div>

              {/* Stage 2: Execution */}
              <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#172033] font-mono">2. EXECUTION</span>
                  {linkedEvents.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#8A94A6]" />
                  )}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#172033]">
                  {linkedEvents.length} Field Event{linkedEvents.length === 1 ? '' : 's'}
                </div>
                <span className="text-[10px] text-[#596579] truncate">DPR &amp; Site Logs</span>
              </div>

              {/* Stage 3: Evidence */}
              <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#172033] font-mono">3. EVIDENCE</span>
                  {linkedEvidence.length > 0 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-[#8A94A6]" />
                  )}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#172033]">
                  {linkedEvidence.length} Vault Record{linkedEvidence.length === 1 ? '' : 's'}
                </div>
                <span className="text-[10px] text-[#596579] truncate">Photos &amp; QC Reports</span>
              </div>

              {/* Stage 4: Verification */}
              <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#172033] font-mono">4. VERIFY</span>
                  <ConfidenceBadge score={verificationDetails.confidence} size="sm" showLabel={false} />
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#172033]">
                  {verificationDetails.confidence}% Match Score
                </div>
                <span className="text-[10px] text-[#596579] truncate">{verificationDetails.reviewState}</span>
              </div>

              {/* Stage 5: Actual Update */}
              <div className="p-2.5 rounded bg-[#FAF2F1] border border-[#E4B0AA] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#B5473C] font-mono">5. ACTUAL UPDATE</span>
                  <span className="font-mono font-bold text-[#B5473C] text-[10px]">
                    +{selectedActivity.delayDays}d
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#172033]">
                  Progress: {selectedActivity.actualProgress}%
                </div>
                <span className="text-[10px] text-[#B5473C] truncate">Twin Synced (Slip Recorded)</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3-COLUMN DESKTOP LAYOUT (LEFT: Hierarchy, CENTER: Activity State, RIGHT: Execution/Evidence/Verify) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* ========================================================= */}
          {/* LEFT: L1–L6 SCHEDULE HIERARCHY (col-span-3) */}
          {/* ========================================================= */}
          <div className="lg:col-span-3 bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8EBF0]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Schedule Hierarchy
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#596579]">L1 to L6</span>
            </div>

            {/* Tree Search & Level Filter */}
            <div className="space-y-1.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter WBS or activity..."
                  value={hierarchySearch}
                  onChange={(e) => setHierarchySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded focus:border-[#176B87] outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#596579]">
                <span>Click item to inspect in center:</span>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedNodes({
                      'L1-MAIN': true,
                      'L2-AREA100': true,
                      'L3-PIP': true,
                      'L4-WP32': true,
                      'L3-CIV': true,
                      'L4-WP21': true,
                      'L3-MEC': true,
                      'L3-ELE': true,
                    })
                  }
                  className="text-[#176B87] hover:underline text-[10px]"
                >
                  Expand All
                </button>
              </div>
            </div>

            {/* Tree Container */}
            <div className="max-h-[620px] overflow-y-auto pr-1">
              {renderLeftTreeNode(hierarchyTree)}
            </div>

            <div className="pt-2 border-t border-[#E8EBF0] text-[11px] text-[#596579] flex items-center justify-between">
              <span>WBS Navigator</span>
              <Link
                href="/schedule"
                className="text-[#176B87] hover:underline font-medium inline-flex items-center gap-0.5"
              >
                <span>Master Table</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* ========================================================= */}
          {/* CENTER: SELECTED ACTIVITY TIMELINE / STATE (col-span-5) */}
          {/* ========================================================= */}
          <div className="lg:col-span-5 bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-5">
            {/* Selected Activity Header Card */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#176B87] bg-[#E8F1F5] px-2 py-0.5 rounded border border-[#C5DCE6]">
                    {selectedActivity.id}
                  </span>
                  <span className="font-mono text-xs text-[#596579] bg-[#F0F2F5] px-2 py-0.5 rounded border border-[#D9DEE5]">
                    WBS {selectedActivity.wbs} ({selectedActivity.wbsLevel})
                  </span>
                </div>
                <StatusBadge status={selectedActivity.status} size="sm" />
              </div>

              <h2 className="text-base font-bold text-[#172033] leading-snug">
                {selectedActivity.name}
              </h2>

              <div className="flex items-center gap-2 text-xs text-[#596579] mt-1.5 flex-wrap">
                <span>Discipline: <strong className="text-[#172033]">{selectedActivity.discipline}</strong></span>
                <span>•</span>
                <span>Area: <strong className="text-[#172033]">{selectedActivity.area}</strong></span>
                {selectedActivity.line && (
                  <>
                    <span>•</span>
                    <span>Line: <strong className="text-[#172033]">{selectedActivity.line}</strong></span>
                  </>
                )}
                {selectedActivity.isCritical && (
                  <>
                    <span>•</span>
                    <span className="text-[10px] font-mono text-[#B5473C] font-bold bg-[#FDF0EE] px-1.5 py-0.2 rounded border border-[#E4B0AA]">
                      CRITICAL PATH (0d float)
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* TIMELINE COMPARISON CARD (Planned Dates vs Actual Dates) */}
            <div className="border border-[#D9DEE5] rounded-lg p-4 bg-[#F7F8FA] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033] flex items-center justify-between">
                <span>Timeline Synchronization</span>
                <span className="text-[10px] font-mono text-[#596579]">Data Date: 18 Sep 2026</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Planned */}
                <div className="p-3 bg-white border border-[#D9DEE5] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#596579] block">
                    P6 Baseline Planned
                  </span>
                  <div className="font-mono font-medium text-[#172033]">
                    {selectedActivity.plannedStart} <span className="text-[#8A94A6]">→</span> {selectedActivity.plannedFinish}
                  </div>
                  <div className="text-[11px] text-[#596579] font-mono">
                    Target: {selectedActivity.plannedQuantity} {selectedActivity.unit}
                  </div>
                </div>

                {/* Actual */}
                <div className="p-3 bg-white border border-[#D9DEE5] rounded space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#176B87] block">
                    Field Actual (Verified)
                  </span>
                  <div className="font-mono font-medium text-[#172033]">
                    {selectedActivity.actualStart || 'Not Started'} <span className="text-[#8A94A6]">→</span>{' '}
                    <span className={selectedActivity.delayDays > 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'}>
                      {selectedActivity.actualFinish || 'In Progress'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#176B87] font-mono font-bold">
                    Actual: {selectedActivity.actualQuantity} {selectedActivity.unit}
                  </div>
                </div>
              </div>

              {/* Progress & Variance Bar */}
              <div className="p-3 bg-white border border-[#D9DEE5] rounded space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span>Actual Progress: <strong className="text-[#176B87]">{selectedActivity.actualProgress}%</strong></span>
                  <span>Planned Target: <strong>{selectedActivity.plannedProgress}%</strong></span>
                  <span className="font-bold">
                    <VarianceBadge daysDelay={selectedActivity.delayDays} size="sm" />
                  </span>
                </div>
                <ProgressBar
                  actual={selectedActivity.actualProgress}
                  planned={selectedActivity.plannedProgress}
                  size="md"
                  status={selectedActivity.status}
                  showLabels={false}
                />
              </div>
            </div>

            {/* DEPENDENCY PANEL (Predecessors, Successors, Downstream Impact) */}
            <div className="border border-[#D9DEE5] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8EBF0]">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-[#B5473C]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Dependencies &amp; Downstream Impact
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#596579]">Precedence Diagram</span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Predecessors */}
                <div>
                  <span className="text-[11px] text-[#596579] font-medium block mb-1">Predecessors:</span>
                  {selectedActivity.predecessors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.predecessors.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setSelectedActivityId(p)}
                          className="px-2.5 py-1 rounded bg-[#F7F8FA] hover:bg-[#E8F1F5] border border-[#D9DEE5] font-mono text-[11px] text-[#172033] inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="font-bold text-[#176B87]">{p}</span>
                          <span className="text-[#8A94A6]">[FS + 0d]</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#8A94A6] italic text-[11px]">No driving predecessors</span>
                  )}
                </div>

                {/* Successors */}
                <div>
                  <span className="text-[11px] text-[#596579] font-medium block mb-1">Successors:</span>
                  {selectedActivity.successors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedActivity.successors.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedActivityId(s)}
                          className="px-2.5 py-1 rounded bg-[#F7F8FA] hover:bg-[#E8F1F5] border border-[#D9DEE5] font-mono text-[11px] text-[#172033] inline-flex items-center gap-1 transition-colors"
                        >
                          <span className="font-bold text-[#176B87]">{s}</span>
                          <span className="text-[#8A94A6]">[Downstream]</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[#8A94A6] italic text-[11px]">No direct successors</span>
                  )}
                </div>

                {/* Downstream Impact Alert */}
                {selectedActivity.delayDays > 0 && (
                  <div className="p-2.5 bg-[#FDF0EE] border border-[#E4B0AA] rounded text-[11px] text-[#172033] mt-2 space-y-1">
                    <strong className="text-[#B5473C] block font-semibold">
                      Critical Path Float Erosion Warning:
                    </strong>
                    <p className="text-[#596579]">
                      A +{selectedActivity.delayDays}-day slip on {selectedActivity.id} directly pushes the start of successor{' '}
                      <strong className="text-[#172033] font-mono">{selectedActivity.successors[0] || 'downstream'}</strong>, consuming total float and delaying the commissioning target.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Drawer Trigger */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-[#596579]">
                Full activity record, quantity certificates &amp; audit history
              </span>
              <button
                type="button"
                onClick={() => openActivityDrawer(selectedActivity.id)}
                className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Activity Detail Drawer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT: EXECUTION + EVIDENCE + VERIFICATION (col-span-4) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. EXECUTION PANEL: Linked Execution Events */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8EBF0]">
                <div className="flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Linked Execution Events
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#596579] bg-[#F0F2F5] px-1.5 py-0.2 rounded">
                  {linkedEvents.length} Matched
                </span>
              </div>

              {linkedEvents.length === 0 ? (
                <div className="p-4 bg-[#F7F8FA] border border-[#E8EBF0] rounded text-center text-xs text-[#596579]">
                  No site execution events linked yet for {selectedActivity.id}.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {linkedEvents.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3 border border-[#D9DEE5] rounded-lg bg-white space-y-2 text-xs hover:border-[#176B87] transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#176B87]">{evt.id}</span>
                          <span className="font-mono text-[10px] px-1 py-0.2 rounded bg-[#F0F2F5] text-[#596579]">
                            {evt.source}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#8A94A6]">{evt.eventDate}</span>
                      </div>

                      <p className="p-2 bg-[#F7F8FA] border border-[#E8EBF0] rounded text-[11px] text-[#172033] italic">
                        &quot;{evt.rawText}&quot;
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-[#596579] pt-1">
                        <span>Quantity: <strong className="text-[#172033]">{evt.quantity} {evt.unit}</strong></span>
                        <ConfidenceBadge score={evt.confidence} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. EVIDENCE PANEL: Linked Evidence Vault */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8EBF0]">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Linked QA/QC Evidence
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#596579] bg-[#F0F2F5] px-1.5 py-0.2 rounded">
                  {linkedEvidence.length} Files
                </span>
              </div>

              {linkedEvidence.length === 0 ? (
                <div className="p-4 bg-[#F7F8FA] border border-[#E8EBF0] rounded text-center text-xs text-[#596579]">
                  No verification evidence files currently linked to this activity.
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedEvidence.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 border border-[#D9DEE5] rounded bg-white hover:border-[#176B87] transition-colors text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {item.type === 'PHOTO' ? (
                            <Camera className="w-3.5 h-3.5 text-[#176B87] flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-[#596579] flex-shrink-0" />
                          )}
                          <span className="font-semibold text-[#172033] truncate max-w-[190px]">
                            {item.title}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#8A94A6]">{item.fileSize}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-[#596579]">
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          {item.gpsCoords && (
                            <span className="flex items-center gap-0.5 text-[#2E7D5B]">
                              <MapPin className="w-3 h-3" />
                              GPS Verified
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEvidenceForModal(item)}
                          className="text-[#176B87] hover:underline font-semibold inline-flex items-center gap-0.5 text-[11px]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Doc</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. VERIFICATION PANEL: Confidence, Reason, Review State, Reviewer */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E8EBF0]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Verification &amp; Audit Trail
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#2E7D5B] bg-[#EBF5EF] px-1.5 py-0.2 rounded font-bold">
                  VALIDATED
                </span>
              </div>

              <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#596579]">AI Match Confidence:</span>
                  <ConfidenceBadge score={verificationDetails.confidence} size="sm" />
                </div>

                <div className="pt-1.5 border-t border-[#E8EBF0]">
                  <span className="text-[#596579] block mb-0.5">Semantic Match Justification:</span>
                  <p className="text-[#172033] font-medium text-[11px] bg-white p-2 rounded border border-[#E8EBF0]">
                    {verificationDetails.matchReason}
                  </p>
                </div>

                <div className="flex justify-between pt-1 border-t border-[#E8EBF0]">
                  <span className="text-[#596579]">Review State:</span>
                  <strong className="text-[#172033]">{verificationDetails.reviewState}</strong>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#596579]">Verified By:</span>
                  <strong className="text-[#176B87]">{verificationDetails.reviewer}</strong>
                </div>

                <div className="flex justify-between font-mono text-[10px] text-[#8A94A6]">
                  <span>Verification Timestamp:</span>
                  <span>{verificationDetails.verifiedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EVIDENCE MODAL */}
        {selectedEvidenceForModal && (
          <Modal
            isOpen={Boolean(selectedEvidenceForModal)}
            onClose={() => setSelectedEvidenceForModal(null)}
            title={selectedEvidenceForModal.title}
            subtitle={`Evidence File: ${selectedEvidenceForModal.filename}`}
            maxWidth="md"
            footer={
              <button
                type="button"
                onClick={() => setSelectedEvidenceForModal(null)}
                className="px-3 py-1.5 text-xs text-[#172033] bg-[#F7F8FA] hover:bg-[#E8EBF0] border border-[#D9DEE5] rounded"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#596579]">File Size:</span>
                  <span className="font-mono">{selectedEvidenceForModal.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Uploader:</span>
                  <strong>{selectedEvidenceForModal.uploader}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Timestamp:</span>
                  <span className="font-mono">{selectedEvidenceForModal.timestamp}</span>
                </div>
                {selectedEvidenceForModal.gpsCoords && (
                  <div className="flex justify-between text-[#2E7D5B]">
                    <span>GPS Coordinates:</span>
                    <span className="font-mono">{selectedEvidenceForModal.gpsCoords}</span>
                  </div>
                )}
              </div>

              {selectedEvidenceForModal.notes && (
                <div className="p-3 bg-white border border-[#D9DEE5] rounded">
                  <strong className="text-[#172033] block mb-1">Inspector Notes:</strong>
                  <p className="text-[#596579]">{selectedEvidenceForModal.notes}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
