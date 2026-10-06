'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../../components/shared/StateWrapper';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../../components/shared/ConfidenceBadge';
import { VarianceBadge } from '../../../components/shared/VarianceBadge';
import { ProgressBar } from '../../../components/shared/ProgressBar';
import { SCurveChart } from '../../../components/shared/SCurveChart';
import { Drawer } from '../../../components/shared/Drawer';
import { ActivityDetailDrawer } from '../../../components/shared/ActivityDetailDrawer';
import { Modal } from '../../../components/shared/Modal';
import { projectService } from '../../../lib/api/projectService';
import {
  PortfolioProject,
  ScheduleActivity,
  ExecutionEvent,
  EvidenceItem,
  WBSLevel,
  DisciplineType,
} from '../../../types';
import {
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
  MOCK_HEALTH_SCORE,
} from '../../../lib/api/mockData';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../../lib/domain/canonicalModels';
import {
  FolderKanban,
  Calendar,
  ClipboardList,
  GitCompare,
  TrendingDown,
  TrendingUp,
  FileText,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Download,
  Plus,
  Search,
  Filter,
  Eye,
  Camera,
  MapPin,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  SlidersHorizontal,
  Info,
  ExternalLink,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';

export interface HierarchyNode {
  id: string;
  code: string;
  name: string;
  level: WBSLevel;
  levelLabel: string;
  discipline?: DisciplineType;
  plannedProgress: number;
  actualProgress: number;
  variance: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'pending';
  delayDays: number;
  isCritical?: boolean;
  children?: HierarchyNode[];
}

export default function ProjectOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const projectIdParam = (params?.id as string) || '';

  const { allProjects, activeProject, setActiveProjectId } = useApp();
  const { addToast } = useToast();

  // Find Project
  const project: PortfolioProject = useMemo(() => {
    const found = allProjects.find(
      (p) =>
        p.id.toLowerCase() === projectIdParam.toLowerCase() ||
        p.code.toLowerCase() === projectIdParam.toLowerCase()
    );
    return found || activeProject;
  }, [allProjects, projectIdParam, activeProject]);

  // Synchronize active project in AppContext
  useEffect(() => {
    if (project && project.id !== activeProject.id) {
      setActiveProjectId(project.id);
    }
  }, [project, activeProject.id, setActiveProjectId]);

  // Drawer States
  const [isWbsDrawerOpen, setIsWbsDrawerOpen] = useState(false);
  const [selectedAreaForDrawer, setSelectedAreaForDrawer] = useState<HierarchyNode | null>(null);
  const [selectedActivityIdForDrawer, setSelectedActivityIdForDrawer] = useState<string | null>(null);
  const [selectedEvidenceForDrawer, setSelectedEvidenceForDrawer] = useState<EvidenceItem | null>(null);
  const [isDelayDrawerOpen, setIsDelayDrawerOpen] = useState(false);

  // Modals
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Field Capture Form State
  const [fieldReportText, setFieldReportText] = useState('');
  const [fieldSource, setFieldSource] = useState<'FIELD_QUICK_FORM' | 'SITE_DIARY' | 'DPR_PDF'>('FIELD_QUICK_FORM');
  const [isSubmittingField, setIsSubmittingField] = useState(false);

  // WBS Tree Expansion & Filters in Drawer
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'L1-MAIN': true,
    'L2-AREA100': true,
    'L3-PIP': true,
    'L4-WP32': true,
    'L5-PIP24002': true,
  });
  const [hierarchySearch, setHierarchySearch] = useState('');

  // Project activities & events
  const activities = useMemo(() => {
    return MOCK_ACTIVITIES.filter((a) => a.projectId === project.id || a.projectId === 'PRJ-OIL-2026-01');
  }, [project.id]);

  const executionEvents = useMemo(() => {
    return MOCK_EXECUTION_EVENTS.filter((e) => e.projectId === project.id || e.projectId === 'PRJ-OIL-2026-01');
  }, [project.id]);

  const evidenceItems = useMemo(() => {
    return MOCK_EVIDENCE_ITEMS;
  }, []);

  const breadcrumbs = [
    { label: 'Portfolio', href: '/projects' },
    { label: project.code, href: `/projects/${project.id}` },
    { label: 'Project Overview', current: true },
  ];

  // Full 6-Level Hierarchy Tree
  const hierarchyTree: HierarchyNode = useMemo(() => {
    return {
      id: 'L1-MAIN',
      code: project.code,
      name: `${project.name} (L1 Project Master Baseline)`,
      level: 'L1',
      levelLabel: 'L1 Project',
      plannedProgress: project.plannedProgress,
      actualProgress: project.overallProgress,
      variance: project.overallProgress - project.plannedProgress,
      status: project.status,
      delayDays: project.status === 'delayed' ? 4 : project.status === 'at-risk' ? 2 : 0,
      isCritical: true,
      children: [
        {
          id: 'L2-AREA100',
          code: 'AREA-100',
          name: 'Unit A - Gas Processing & Compression Area',
          level: 'L2',
          levelLabel: 'L2 Area',
          plannedProgress: 78,
          actualProgress: 72,
          variance: -6,
          status: 'at-risk',
          delayDays: 2,
          isCritical: true,
          children: [
            {
              id: 'L3-PIP',
              code: 'DISC-PIP',
              name: 'Piping Erection, Field Welding & NDT Manifolds',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Piping',
              plannedProgress: 85,
              actualProgress: 70,
              variance: -15,
              status: 'delayed',
              delayDays: 2,
              isCritical: true,
              children: [
                {
                  id: 'L4-WP32',
                  code: 'WP-3.2',
                  name: 'High-Pressure Header Piping Package (Line 24-XX)',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Piping',
                  plannedProgress: 80,
                  actualProgress: 68,
                  variance: -12,
                  status: 'delayed',
                  delayDays: 2,
                  isCritical: true,
                  children: [
                    {
                      id: 'L5-PIP24001',
                      code: 'PIP-24-001',
                      name: 'Erect Line 24-XX High Pressure Gas Header',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Piping',
                      plannedProgress: 100,
                      actualProgress: 100,
                      variance: 0,
                      status: 'delayed',
                      delayDays: 2,
                      isCritical: true,
                      children: [
                        {
                          id: 'L6-SUB-24-01',
                          code: 'SUB-24-01',
                          name: 'Rigging & Spool Hoisting onto Piperack Section B',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB-24-02',
                          code: 'SUB-24-02',
                          name: 'Flange Alignment & Spring Support Load Setting',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                      ],
                    },
                    {
                      id: 'L5-PIP24002',
                      code: 'PIP-24-002',
                      name: 'Weld Line 24-XX Field Joints & NDT Clearance',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Piping',
                      plannedProgress: 85,
                      actualProgress: 70,
                      variance: -15,
                      status: 'delayed',
                      delayDays: 2,
                      isCritical: true,
                      children: [
                        {
                          id: 'L6-SUB-24-03',
                          code: 'SUB-24-03',
                          name: 'GTAW Root Pass on Field Joint #01 to #08 (8 Joints Done)',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB-24-04',
                          code: 'SUB-24-04',
                          name: 'SMAW Fill & Cap Passes on Joint #09 to #12 (4 Joints)',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 75,
                          actualProgress: 40,
                          variance: -35,
                          status: 'delayed',
                          delayDays: 2,
                          isCritical: true,
                        },
                        {
                          id: 'L6-SUB-24-05',
                          code: 'SUB-24-05',
                          name: '100% Gamma Radiographic Examination (RT) Clearance',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 80,
                          actualProgress: 70,
                          variance: -10,
                          status: 'delayed',
                          delayDays: 1,
                          isCritical: true,
                        },
                      ],
                    },
                    {
                      id: 'L5-PIP24003',
                      code: 'PIP-24-003',
                      name: 'Hydrostatic Pressure Test Line 24-XX (150 bar)',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Piping',
                      plannedProgress: 0,
                      actualProgress: 0,
                      variance: 0,
                      status: 'delayed',
                      delayDays: 2,
                      isCritical: true,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'L2-AREA200',
          code: 'AREA-200',
          name: 'Compressor House Bay & Foundation',
          level: 'L2',
          levelLabel: 'L2 Area',
          plannedProgress: 100,
          actualProgress: 100,
          variance: 0,
          status: 'completed',
          delayDays: 0,
          isCritical: false,
          children: [
            {
              id: 'L3-CIV',
              code: 'DISC-CIV',
              name: 'Civil Reinforced Concrete Foundations',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Civil',
              plannedProgress: 100,
              actualProgress: 100,
              variance: 0,
              status: 'completed',
              delayDays: 0,
              children: [
                {
                  id: 'L4-WP11',
                  code: 'WP-1.1',
                  name: 'Compressor Bay Block A Pedestals',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Civil',
                  plannedProgress: 100,
                  actualProgress: 100,
                  variance: 0,
                  status: 'completed',
                  delayDays: 0,
                  children: [
                    {
                      id: 'L5-CIV11001',
                      code: 'CIV-11-001',
                      name: 'Foundation Block A - Compressor Pedestal',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Civil',
                      plannedProgress: 100,
                      actualProgress: 100,
                      variance: 0,
                      status: 'completed',
                      delayDays: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'L2-AREA300',
          code: 'AREA-300',
          name: 'Overhead Gallery Bay 1-4 & Substation',
          level: 'L2',
          levelLabel: 'L2 Area',
          plannedProgress: 50,
          actualProgress: 40,
          variance: -10,
          status: 'at-risk',
          delayDays: 1,
          isCritical: false,
          children: [
            {
              id: 'L3-ELE',
              code: 'DISC-ELE',
              name: 'Electrical Power & Cabling Infrastructure',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Electrical',
              plannedProgress: 50,
              actualProgress: 40,
              variance: -10,
              status: 'at-risk',
              delayDays: 1,
              children: [
                {
                  id: 'L4-WP41',
                  code: 'WP-4.1',
                  name: 'Substation to Bay Cable Trays',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Electrical',
                  plannedProgress: 50,
                  actualProgress: 40,
                  variance: -10,
                  status: 'at-risk',
                  delayDays: 1,
                  children: [
                    {
                      id: 'L5-ELE11032',
                      code: 'ELE-11-032',
                      name: 'Cable Tray Installation - Substation to Bay',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Electrical',
                      plannedProgress: 50,
                      actualProgress: 40,
                      variance: -10,
                      status: 'at-risk',
                      delayDays: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: 'L2-AREA400',
          code: 'AREA-400',
          name: 'Offsites, Flare Knock-out & Utilities',
          level: 'L2',
          levelLabel: 'L2 Area',
          plannedProgress: 30,
          actualProgress: 45,
          variance: 15,
          status: 'on-track',
          delayDays: 0,
          isCritical: false,
          children: [
            {
              id: 'L3-MEC',
              code: 'DISC-MEC',
              name: 'Mechanical Equipment & Flare Vessels',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Mechanical',
              plannedProgress: 30,
              actualProgress: 45,
              variance: 15,
              status: 'on-track',
              delayDays: 0,
              children: [
                {
                  id: 'L4-WP52',
                  code: 'WP-5.2',
                  name: 'Flare K.O. Drum Erection Package',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Mechanical',
                  plannedProgress: 30,
                  actualProgress: 45,
                  variance: 15,
                  status: 'on-track',
                  delayDays: 0,
                  children: [
                    {
                      id: 'L5-MEC02008',
                      code: 'MEC-02-008',
                      name: 'Erect & Align Flare K.O. Drum Vessel Unit A',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Mechanical',
                      plannedProgress: 30,
                      actualProgress: 45,
                      variance: 15,
                      status: 'on-track',
                      delayDays: 0,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
  }, [project]);

  // Operational Areas (Level 2)
  const operationalAreas = useMemo(() => {
    return hierarchyTree.children || [];
  }, [hierarchyTree]);

  // Toggle tree nodes
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    const allIds: Record<string, boolean> = {};
    const traverse = (node: HierarchyNode) => {
      allIds[node.id] = true;
      if (node.children) node.children.forEach(traverse);
    };
    traverse(hierarchyTree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes({
      'L1-MAIN': true,
    });
  };

  // Submit quick field update
  const handleSubmitFieldReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldReportText.trim()) return;

    setIsSubmittingField(true);
    try {
      const res = await projectService.submitFieldReport(project.id, fieldReportText, fieldSource);
      if (res.data) {
        addToast({
          type: res.data.matchCategory === 'AUTO_LINK' ? 'success' : 'warning',
          title: 'Field Execution Event Recorded',
          description: `Extracted ${res.data.workDescription.slice(0, 45)}... [Confidence: ${res.data.confidence}% · ${res.data.confidence >= 90 ? 'High Confidence' : res.data.confidence >= 70 ? 'Review Required' : 'Unmatched'}]`,
        });
        setFieldReportText('');
        setIsFieldModalOpen(false);
      }
    } catch {
      addToast({
        type: 'critical',
        title: 'Submission Failed',
        description: 'Unable to communicate with extraction engine.',
      });
    } finally {
      setIsSubmittingField(false);
    }
  };

  // Recursive tree renderer for Drawer
  const renderHierarchyNode = (node: HierarchyNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedNodes[node.id]);

    // Search query check
    if (hierarchySearch.trim()) {
      const q = hierarchySearch.toLowerCase();
      const nodeMatches =
        node.name.toLowerCase().includes(q) ||
        node.code.toLowerCase().includes(q) ||
        node.level.toLowerCase().includes(q);

      const hasMatchingChild = (n: HierarchyNode): boolean => {
        if (n.name.toLowerCase().includes(q) || n.code.toLowerCase().includes(q)) return true;
        return Boolean(n.children?.some(hasMatchingChild));
      };

      if (!nodeMatches && !node.children?.some(hasMatchingChild)) {
        return null;
      }
    }

    const levelColorMap: Record<WBSLevel, { bg: string; text: string; border: string }> = {
      L1: { bg: 'bg-[#176B87]/10', text: 'text-[#176B87]', border: 'border-[#176B87]/30' },
      L2: { bg: 'bg-[#3B6EA8]/10', text: 'text-[#3B6EA8]', border: 'border-[#3B6EA8]/30' },
      L3: { bg: 'bg-[#2E7D5B]/10', text: 'text-[#2E7D5B]', border: 'border-[#2E7D5B]/30' },
      L4: { bg: 'bg-[#D98B32]/10', text: 'text-[#D98B32]', border: 'border-[#D98B32]/30' },
      L5: { bg: 'bg-[#7B8798]/10', text: 'text-[#172033]', border: 'border-[#7B8798]/30' },
      L6: { bg: 'bg-[#F1F3F5]', text: 'text-[#596579]', border: 'border-[#D9DEE5]' },
    };

    const colors = levelColorMap[node.level];

    return (
      <React.Fragment key={node.id}>
        <div
          className={`group flex items-center justify-between py-2 px-3 hover:bg-[#F9FAFC] border-b border-[#D9DEE5] text-xs transition-colors ${
            depth === 0 ? 'bg-[#F7F8FA] font-medium' : ''
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 20 + 12)}px` }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#D9DEE5] text-[#596579] flex-shrink-0 transition-colors cursor-pointer"
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-[#7B8798] flex-shrink-0 text-xs">
                &bull;
              </span>
            )}

            <span
              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {node.level}
            </span>

            <span className="font-mono text-[11px] font-bold text-[#172033] flex-shrink-0">
              {node.code}
            </span>

            <span className="truncate text-[#172033]" title={node.name}>
              {node.name}
            </span>

            {node.isCritical && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] flex-shrink-0">
                CRITICAL
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 text-xs">
            <div className="w-24 flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold text-[#172033]">{node.actualProgress}%</span>
              <ProgressBar
                actual={node.actualProgress}
                planned={node.plannedProgress}
                size="sm"
                status={node.status}
                showLabels={false}
              />
            </div>

            <span
              className={`w-12 text-right font-mono text-[11px] font-bold ${
                node.variance < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
              }`}
            >
              {node.variance > 0 ? `+${node.variance}%` : `${node.variance}%`}
            </span>

            <div className="w-20 text-center">
              <StatusBadge status={node.status} size="sm" />
            </div>

            {node.level === 'L5' && (
              <button
                type="button"
                onClick={() => setSelectedActivityIdForDrawer(node.code)}
                className="text-[#176B87] hover:underline font-semibold text-[11px] flex items-center gap-0.5 cursor-pointer"
              >
                <span>Details</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {hasChildren &&
          isExpanded &&
          node.children!.map((child) => renderHierarchyNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <StateWrapper>
      <div className="space-y-6 pb-16 max-w-7xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />

        {/* ========================================================= */}
        {/* 1. PROJECT HEADER */}
        {/* Consistent title, ID, breadcrumbs, and primary action bar */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#176B87] text-white">
                  {project.id}
                </span>
                <span className="font-mono text-xs font-semibold text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded border border-[#D9DEE5]">
                  {project.code}
                </span>
                <span className="text-[#7B8798] hidden sm:inline">&bull;</span>
                <span className="text-xs text-[#596579] font-medium">
                  Project Controls Overview
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                {project.name}
              </h1>
            </div>

            {/* Header Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-start lg:self-center">
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(project.id);
                  router.push('/schedule');
                }}
                className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Open Master Schedule WBS"
              >
                <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                <span>Open Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFieldModalOpen(true)}
                className="px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Record new site progress statement"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Capture Field Update</span>
              </button>

              <Link
                href="/matching"
                onClick={() => setActiveProjectId(project.id)}
                className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="View Match Verification Queue"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#D98B32]" />
                <span>Review Queue</span>
                {(project.openReviews || 0) > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#D98B32] text-white text-[10px] font-mono font-bold">
                    {project.openReviews}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                title="Open Project Dossier & Export Reports"
              >
                <FileText className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. PROJECT STATUS / METADATA */}
        {/* Compact, clean horizontal metadata strip */}
        {/* ========================================================= */}
        <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3 sm:p-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[#596579]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-[#172033]">Status:</span>
                <StatusBadge status={project.status} size="sm" />
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <span className="font-semibold text-[#172033]">Schedule Version:</span>
                <span className="font-mono text-[#172033]">
                  {project.scheduleVersion || CANONICAL_SCHEDULE_VERSION_LABEL}
                </span>
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Cutoff: <strong className="font-mono text-[#172033]">18 Sep 2026</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[#596579]">
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#7B8798]" />
                <span>Client: <strong className="text-[#172033]">{project.organization}</strong></span>
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <span>Contractor: <strong className="text-[#172033]">{project.contractor}</strong></span>
              </div>

              <span>&bull;</span>

              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#7B8798]" />
                <span>{project.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. OVERALL PROGRESS */}
        {/* Focused physical earned progress bar (NOT a wall of KPI cards) */}
        {/* ========================================================= */}
        <section aria-labelledby="overall-progress-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <h2 id="overall-progress-heading" className="text-base sm:text-lg font-bold text-[#172033]">
                Overall Cumulative Progress
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Physical earned progress verified on site against Primavera P6 baseline envelope.
              </p>
            </div>

            {/* Quick Navigation Indicators */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <Link
                href="/matching"
                onClick={() => setActiveProjectId(project.id)}
                className="px-2.5 py-1 rounded bg-[#FDF6ED] border border-[#F0D4A6] text-[#8C5311] font-semibold hover:bg-[#FCEFD9] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{project.openReviews || 3} Pending Reviews</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsDelayDrawerOpen(true)}
                className="px-2.5 py-1 rounded bg-[#FBEFEE] border border-[#E4B0AA] text-[#B5473C] font-semibold hover:bg-[#F8E3E1] transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <TrendingDown className="w-3 h-3" />
                <span>{project.delayedCount || 2} Critical Delays</span>
              </button>

              <span className="px-2.5 py-1 rounded bg-[#EDF7F2] border border-[#B8DCC9] text-[#2E7D5B] font-mono font-bold text-[11px]">
                Health Score: {MOCK_HEALTH_SCORE.overall}/100
              </span>
            </div>
          </div>

          {/* Progress Bar & Variance Breakdown */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black font-mono text-[#172033]">
                  {project.overallProgress}%
                </span>
                <span className="text-xs text-[#596579]">
                  Verified Actual Earned Progress
                </span>
                <span className="text-xs text-[#7B8798]">&bull;</span>
                <span className="text-xs font-mono text-[#596579]">
                  Target Baseline: <strong className="text-[#176B87]">{project.plannedProgress}%</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579]">Schedule Variance:</span>
                <span className="text-lg font-bold font-mono text-[#B5473C]">
                  {project.overallProgress - project.plannedProgress}%
                </span>
                <VarianceBadge daysDelay={project.status === 'delayed' ? 2 : 0} size="sm" />
              </div>
            </div>

            {/* Custom Full-Width Progress Meter */}
            <div className="space-y-1">
              <ProgressBar
                actual={project.overallProgress}
                planned={project.plannedProgress}
                size="md"
                status={project.status}
                showLabels={false}
              />
              <div className="flex justify-between text-[10px] font-mono text-[#7B8798] pt-0.5">
                <span>0% (Project Start)</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% (Target Handover)</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. S-CURVE (PRIMARY PROJECT-CONTROL VISUALIZATION) */}
        {/* Unified, static, clear engineering S-curve */}
        {/* ========================================================= */}
        <section aria-labelledby="scurve-section-heading">
          <SCurveChart
            variant="full"
            title="Project S-Curve — Cumulative Execution Trajectory"
            subtitle={`Master baseline target vs verified execution actuals up to 18 Sep 2026 cutoff.`}
          />
        </section>

        {/* ========================================================= */}
        {/* 5. AREA PROGRESS */}
        {/* WBS Level 2 breakdown by operational plant areas */}
        {/* ========================================================= */}
        <section aria-labelledby="area-progress-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176B87]" />
                <h2 id="area-progress-heading" className="text-base sm:text-lg font-bold text-[#172033]">
                  Operational Area Progress (WBS Level 2)
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Physical progress and schedule health by battery limits and process units.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsWbsDrawerOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer self-start sm:self-center"
            >
              <span>Explore Full 6-Level WBS</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Area Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {operationalAreas.map((area) => (
              <div
                key={area.id}
                className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] hover:border-[#176B87] rounded-lg transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-[#176B87] px-1.5 py-0.5 bg-white border border-[#D9DEE5] rounded">
                      {area.code}
                    </span>
                    <StatusBadge status={area.status} size="sm" />
                  </div>

                  <h3 className="text-xs font-bold text-[#172033]">
                    {area.name}
                  </h3>

                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span>Actual: <strong className="text-[#172033]">{area.actualProgress}%</strong></span>
                      <span className="text-[#596579]">Target: {area.plannedProgress}%</span>
                      <span
                        className={`font-semibold ${
                          area.variance < 0 ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
                        }`}
                      >
                        {area.variance > 0 ? `+${area.variance}%` : `${area.variance}%`}
                      </span>
                    </div>
                    <ProgressBar
                      actual={area.actualProgress}
                      planned={area.plannedProgress}
                      size="sm"
                      status={area.status}
                      showLabels={false}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#596579]">
                    {area.children?.length || 0} Disciplines &bull; {area.delayDays > 0 ? `${area.delayDays}d slip` : 'On target'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAreaForDrawer(area);
                      setIsWbsDrawerOpen(true);
                    }}
                    className="text-[#176B87] hover:underline font-semibold text-xs inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Inspect Area WBS</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. MAJOR DELAYS */}
        {/* Critical path slip, root causes, float erosion & mitigations */}
        {/* ========================================================= */}
        <section aria-labelledby="major-delays-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#B5473C]" />
                <h2 id="major-delays-heading" className="text-base sm:text-lg font-bold text-[#172033]">
                  Major Schedule Delays &amp; Driving Variances
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Work packages on or near the Critical Path causing project finish date slippage.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDelayDrawerOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer self-start sm:self-center"
            >
              <span>Full Delay Chain Simulation</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Primary Driving Delay */}
            <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono font-bold text-[#B5473C]">
                  PIP-24-002: Weld Line 24-XX Field Joints &amp; NDT
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[#B5473C] bg-white border border-[#E4B0AA] text-[11px]">
                  +2 Days Critical Slip
                </span>
              </div>

              <p className="text-[11px] text-[#172033] leading-relaxed">
                <strong>Root Cause:</strong> Delayed delivery of 24-inch 600# carbon steel weld fittings from central stores warehouse voucher #4102 during monsoon transport disruption.
              </p>

              <div className="pt-2 border-t border-[#E4B0AA]/40 space-y-1.5">
                <span className="text-[11px] font-bold text-[#172033] block">
                  Downstream Successors Impacted:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded border border-[#E4B0AA]">
                    <strong className="text-[#172033] block font-mono">PIP-24-003 [FS Precedence]</strong>
                    <span className="text-[#596579]">Hydrostatic Pressure Test 150 bar</span>
                    <span className="text-[#B5473C] block font-semibold mt-0.5">Total float eroded to 0 days</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-[#E4B0AA]">
                    <strong className="text-[#172033] block font-mono">INS-02-005 [SS+3d Precedence]</strong>
                    <span className="text-[#596579]">Pressure Transmitter Tubing</span>
                    <span className="text-[#B5473C] block font-semibold mt-0.5">Start date shifted by +2d</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E4B0AA]/40 flex items-center justify-between">
                <span className="text-[11px] text-[#596579]">
                  Recovery: Second welding gang on night shift to recoup 2 days.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedActivityIdForDrawer('PIP-24-002')}
                  className="text-xs font-bold text-[#176B87] hover:underline cursor-pointer"
                >
                  Activity Details &rarr;
                </button>
              </div>
            </div>

            {/* Secondary Near-Critical Delay */}
            <div className="p-4 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-mono font-bold text-[#D98B32]">
                  ELE-11-032: Cable Tray Installation - Substation to Bay
                </span>
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[#8C5311] bg-white border border-[#F0D4A6] text-[11px]">
                  +1 Day Slip (Near-Critical)
                </span>
              </div>

              <p className="text-[11px] text-[#172033] leading-relaxed">
                <strong>Root Cause:</strong> Scaffolding tag clearance pending inspection by site HSE officer due to rain on Overhead Gallery Bay 1-4.
              </p>

              <div className="pt-2 border-t border-[#F0D4A6]/40 space-y-1.5">
                <span className="text-[11px] font-bold text-[#172033] block">
                  Downstream Successors Impacted:
                </span>
                <div className="p-2 bg-white rounded border border-[#F0D4A6] text-[11px]">
                  <strong className="text-[#172033] block font-mono">ELE-06-004 [FS Precedence]</strong>
                  <span className="text-[#596579]">Pull Cable Tray TR-04 Main Feeder</span>
                  <span className="text-[#D98B32] block font-semibold mt-0.5">Available float reduced to 1 day</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F0D4A6]/40 flex items-center justify-between">
                <span className="text-[11px] text-[#596579]">
                  Recovery: Expedite HSE scaffolding handover inspection at 07:00 tomorrow.
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedActivityIdForDrawer('ELE-11-032')}
                  className="text-xs font-bold text-[#176B87] hover:underline cursor-pointer"
                >
                  Activity Details &rarr;
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 7. RECENT EXECUTION */}
        {/* Clean, compact execution events and verified evidence feed */}
        {/* ========================================================= */}
        <section aria-labelledby="recent-execution-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#176B87]" />
                <h2 id="recent-execution-heading" className="text-base sm:text-lg font-bold text-[#172033]">
                  Recent Site Execution &amp; Evidence
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Continuously ingested site observations, weld inspections, and geotagged field media.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/field"
                onClick={() => setActiveProjectId(project.id)}
                className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Execution Feed ({executionEvents.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column 1: Recent Execution Observations */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#596579] block">
                Execution Events
              </span>

              {executionEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] hover:border-[#176B87] rounded-lg transition-colors space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#176B87]">{event.id}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white text-[#596579] border border-[#D9DEE5]">
                        {event.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge score={event.confidence} />
                      <span className="text-[11px] text-[#7B8798] font-mono">{event.eventDate}</span>
                    </div>
                  </div>

                  <p className="text-[#172033] bg-white p-2 rounded border border-[#D9DEE5] text-[11px] italic">
                    &ldquo;{event.rawText}&rdquo;
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#596579] pt-0.5">
                    <div>
                      Target: <strong className="text-[#172033] font-mono">{event.matchedActivityId || 'Unlinked'}</strong>
                    </div>
                    {event.matchedActivityId && (
                      <button
                        type="button"
                        onClick={() => setSelectedActivityIdForDrawer(event.matchedActivityId!)}
                        className="text-[#176B87] hover:underline font-semibold cursor-pointer"
                      >
                        Inspect Activity
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Column 2: Recent Verified Evidence */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#596579] block">
                Verified Field Evidence Vault
              </span>

              {evidenceItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] hover:border-[#176B87] rounded-lg transition-colors space-y-2 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {item.type === 'PHOTO' ? (
                          <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#596579]" />
                        )}
                        <span className="font-bold text-[#172033] truncate max-w-[200px]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#7B8798]">{item.fileSize}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-[#596579] font-mono">
                      <span>WBS: <strong className="text-[#172033]">{item.activityId || 'Unlinked'}</strong></span>
                      {item.gpsCoords && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-0.5 text-[10px] text-[#2E7D5B]">
                            <MapPin className="w-3 h-3" />
                            {item.gpsCoords.split(',')[0]}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-[11px]">
                    <span className="text-[#7B8798] font-mono">{item.timestamp}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedEvidenceForDrawer(item)}
                      className="text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect Evidence</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* DRAWER 1: WBS HIERARCHY DRILL-DOWN DRAWER */}
        {/* Slides out to show full 6-level breakdown without bloating main page */}
        {/* ========================================================= */}
        <Drawer
          isOpen={isWbsDrawerOpen}
          onClose={() => {
            setIsWbsDrawerOpen(false);
            setSelectedAreaForDrawer(null);
          }}
          title={
            selectedAreaForDrawer
              ? `${selectedAreaForDrawer.code}: ${selectedAreaForDrawer.name}`
              : `Project WBS Hierarchy — ${project.name}`
          }
          subtitle={`Full 6-Level Breakdown (L1 Project → L2 Area → L3 Discipline → L4 Package → L5 Activity → L6 Sub-Activity)`}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#596579] font-mono">Baseline Rev 3.2 (Primavera P6)</span>
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(project.id);
                  router.push('/schedule');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Master Schedule</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Search and Expand Controls */}
            <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-[#D9DEE5]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter WBS code or title..."
                  value={hierarchySearch}
                  onChange={(e) => setHierarchySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-[#F7F8FA] focus:bg-white border border-[#D9DEE5] rounded focus:border-[#176B87] outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={expandAll}
                  className="px-2.5 py-1 text-xs font-medium text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded transition-colors cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="px-2.5 py-1 text-xs font-medium text-[#596579] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded transition-colors cursor-pointer"
                >
                  Collapse
                </button>
              </div>
            </div>

            {/* Tree Table Header */}
            <div className="bg-[#F1F3F5] border border-[#D9DEE5] rounded-t-lg px-3 py-2 text-[11px] font-semibold text-[#596579] flex items-center justify-between">
              <span>WBS CODE &amp; BREAKDOWN HIERARCHY</span>
              <div className="flex items-center gap-6">
                <span className="w-24 text-center">PROGRESS</span>
                <span className="w-12 text-right">VAR</span>
                <span className="w-20 text-center">STATUS</span>
                <span className="w-10 text-center">ACTION</span>
              </div>
            </div>

            {/* Render Tree */}
            <div className="border border-t-0 border-[#D9DEE5] rounded-b-lg divide-y divide-[#D9DEE5] overflow-y-auto max-h-[60vh]">
              {selectedAreaForDrawer
                ? renderHierarchyNode(selectedAreaForDrawer)
                : renderHierarchyNode(hierarchyTree)}
            </div>
          </div>
        </Drawer>

        {/* ========================================================= */}
        {/* DRAWER 2: ACTIVITY DETAIL DRAWER */}
        {/* Reuses shared ActivityDetailDrawer component */}
        {/* ========================================================= */}
        {selectedActivityIdForDrawer && (
          <ActivityDetailDrawer
            activityId={selectedActivityIdForDrawer}
            isOpen={Boolean(selectedActivityIdForDrawer)}
            onClose={() => setSelectedActivityIdForDrawer(null)}
          />
        )}

        {/* ========================================================= */}
        {/* DRAWER 3: EVIDENCE INSPECTION DRAWER */}
        {/* ========================================================= */}
        {selectedEvidenceForDrawer && (
          <Drawer
            isOpen={Boolean(selectedEvidenceForDrawer)}
            onClose={() => setSelectedEvidenceForDrawer(null)}
            title={selectedEvidenceForDrawer.title}
            subtitle={`Evidence ID: ${selectedEvidenceForDrawer.id} • Linked Activity: ${selectedEvidenceForDrawer.activityId || 'Unlinked'}`}
            width="md"
            footer={
              <button
                type="button"
                onClick={() => setSelectedEvidenceForDrawer(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded ml-auto cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#596579]">Filename:</span>
                  <strong className="text-[#172033] font-mono">{selectedEvidenceForDrawer.filename}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">File Size:</span>
                  <span className="font-mono">{selectedEvidenceForDrawer.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Recorded Timestamp:</span>
                  <span className="font-mono">{selectedEvidenceForDrawer.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Site Engineer:</span>
                  <span className="font-semibold text-[#172033]">{selectedEvidenceForDrawer.uploader}</span>
                </div>
                {selectedEvidenceForDrawer.gpsCoords && (
                  <div className="flex justify-between">
                    <span className="text-[#596579]">GPS Coordinates:</span>
                    <span className="font-mono text-[#2E7D5B]">{selectedEvidenceForDrawer.gpsCoords}</span>
                  </div>
                )}
              </div>

              {selectedEvidenceForDrawer.notes && (
                <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-1">
                  <span className="font-bold text-[#172033] block">Field QA/QC Verification Notes:</span>
                  <p className="text-[#596579] leading-relaxed">{selectedEvidenceForDrawer.notes}</p>
                </div>
              )}
            </div>
          </Drawer>
        )}

        {/* ========================================================= */}
        {/* DRAWER 4: CRITICAL DELAY CHAIN DRAWER */}
        {/* ========================================================= */}
        <Drawer
          isOpen={isDelayDrawerOpen}
          onClose={() => setIsDelayDrawerOpen(false)}
          title="Critical Path Delay Chains & Precedence Impact"
          subtitle={`Root cause analysis and float erosion tracking for ${project.name}`}
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-[#596579]">Critical slip: +2 days</span>
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(project.id);
                  router.push('/variance');
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-md transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open What-If Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg space-y-2">
              <span className="font-mono font-bold text-[#B5473C] block">
                Primary Delay Node: PIP-24-002 (Weld Line 24-XX Field Joints)
              </span>
              <p className="text-[11px] text-[#172033]">
                Total Float: <strong>0 days (Critical Path)</strong>. Free float exhausted on 16 Sep 2026.
              </p>
              <p className="text-[11px] text-[#596579]">
                Delayed delivery of 24-inch 600# carbon steel fittings caused 2-day work stoppage. Direct day-for-day slip propagated into hydrotest milestone.
              </p>
            </div>

            <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
              <span className="font-bold text-[#172033] block">Network Precedence Chain:</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5] flex justify-between">
                  <span>PIP-24-001 (Erect Gas Header)</span>
                  <span className="text-[#2E7D5B] font-bold">100% Done</span>
                </div>
                <div className="text-center text-[#7B8798]">&darr; [Finish-to-Start]</div>
                <div className="p-2 bg-[#FBEFEE] rounded border border-[#E4B0AA] flex justify-between text-[#B5473C] font-bold">
                  <span>PIP-24-002 (Weld Field Joints &amp; NDT)</span>
                  <span>70% (2 Days Late)</span>
                </div>
                <div className="text-center text-[#7B8798]">&darr; [Finish-to-Start Precedence]</div>
                <div className="p-2 bg-[#F7F8FA] rounded border border-[#D9DEE5] flex justify-between text-[#596579]">
                  <span>PIP-24-003 (Hydrostatic Test 150 bar)</span>
                  <span className="text-[#B5473C]">Float: 0d (Blocked)</span>
                </div>
              </div>
            </div>
          </div>
        </Drawer>

        {/* ========================================================= */}
        {/* MODAL: Capture Field Update */}
        {/* ========================================================= */}
        <Modal
          isOpen={isFieldModalOpen}
          onClose={() => setIsFieldModalOpen(false)}
          title={`Capture Field Execution Update — ${project.code}`}
          subtitle="Record site daily progress statement for automated AI matching and verification."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(false)}
                disabled={isSubmittingField}
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitFieldReport}
                disabled={isSubmittingField || !fieldReportText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isSubmittingField ? 'Processing Extraction...' : 'Extract & Match'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmitFieldReport} className="space-y-3 text-xs">
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Data Source Format
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFieldSource('FIELD_QUICK_FORM')}
                  className={`p-2 text-center rounded border transition-colors cursor-pointer ${
                    fieldSource === 'FIELD_QUICK_FORM'
                      ? 'bg-[#EDF5F8] text-[#176B87] border-[#176B87] font-semibold'
                      : 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]'
                  }`}
                >
                  Quick Site Note
                </button>
                <button
                  type="button"
                  onClick={() => setFieldSource('SITE_DIARY')}
                  className={`p-2 text-center rounded border transition-colors cursor-pointer ${
                    fieldSource === 'SITE_DIARY'
                      ? 'bg-[#EDF5F8] text-[#176B87] border-[#176B87] font-semibold'
                      : 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]'
                  }`}
                >
                  Supervisor Diary
                </button>
                <button
                  type="button"
                  onClick={() => setFieldSource('DPR_PDF')}
                  className={`p-2 text-center rounded border transition-colors cursor-pointer ${
                    fieldSource === 'DPR_PDF'
                      ? 'bg-[#EDF5F8] text-[#176B87] border-[#176B87] font-semibold'
                      : 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]'
                  }`}
                >
                  DPR Excerpt
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Field Progress Statement <span className="text-[#B5473C]">*</span>
              </label>
              <textarea
                rows={4}
                value={fieldReportText}
                onChange={(e) => setFieldReportText(e.target.value)}
                placeholder="e.g. Line 24 spool welding completed 8 joints today on Header Unit A. Crane shifted to compressor skid."
                className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded focus:border-[#176B87] focus:bg-white text-[#172033] outline-none"
              />
            </div>

            <div className="p-2.5 bg-[#F1F3F5] rounded text-[11px] text-[#596579] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#176B87] flex-shrink-0 mt-0.5" />
              <span>
                PLnEX NLP engine will parse activity quantities, locations, and weld joints, scoring candidates against L5/L6 activities in the schedule twin.
              </span>
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* MODAL: Reports & Dossier */}
        {/* ========================================================= */}
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={`Project Controls Dossier — ${project.code}`}
          subtitle={project.name}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-mono text-[#596579]">Cutoff: 18 Sep 2026</span>
              <button
                type="button"
                onClick={() => {
                  addToast({
                    type: 'info',
                    title: 'Dossier Export Initiated',
                    description: `Generating schedule variance report for ${project.code}.`,
                  });
                  setIsReportModalOpen(false);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Dossier</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-[#596579]">
              Export verified project baseline actuals, schedule health metrics, and delay chains for presentation to the project steering committee.
            </p>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
              <div className="flex justify-between">
                <span>Baseline File:</span>
                <strong className="font-mono text-[#172033]">{project.scheduleVersion || CANONICAL_SCHEDULE_VERSION_LABEL}</strong>
              </div>
              <div className="flex justify-between">
                <span>Physical Completion:</span>
                <strong className="font-mono text-[#176B87]">{project.overallProgress}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Variance:</span>
                <strong className="font-mono text-[#B5473C]">{project.overallProgress - project.plannedProgress}%</strong>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </StateWrapper>
  );
}
