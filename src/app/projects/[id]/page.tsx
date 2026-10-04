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
import {
  FolderKanban,
  Calendar,
  ClipboardList,
  GitCompare,
  TrendingDown,
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
} from 'lucide-react';

interface HierarchyNode {
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

  // Modals
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);

  // Field Capture Form State
  const [fieldReportText, setFieldReportText] = useState('');
  const [fieldSource, setFieldSource] = useState<'FIELD_QUICK_FORM' | 'SITE_DIARY' | 'DPR_PDF'>('FIELD_QUICK_FORM');
  const [isSubmittingField, setIsSubmittingField] = useState(false);

  // Hierarchy UI States
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'L1-MAIN': true,
    'L2-AREA100': true,
    'L3-PIP': true,
    'L4-WP32': true,
    'L5-PIP24002': true,
  });
  const [hierarchyFilterLevel, setHierarchyFilterLevel] = useState<string>('all');
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
    { label: 'Operational Overview', current: true },
  ];

  // Build Full 6-Level Hierarchy (L1 Project -> L2 Area -> L3 Discipline -> L4 Work Package -> L5 Activity -> L6 Sub-Activity)
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
                          status: 'at-risk',
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
                      status: 'pending',
                      delayDays: 2,
                      isCritical: true,
                      children: [
                        {
                          id: 'L6-SUB-24-06',
                          code: 'SUB-24-06',
                          name: 'Test Blind Installation & Demin Water Filling',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 0,
                          actualProgress: 0,
                          variance: 0,
                          status: 'pending',
                          delayDays: 2,
                        },
                        {
                          id: 'L6-SUB-24-07',
                          code: 'SUB-24-07',
                          name: '24-Hour Pressure Hold & Chart Recorder Verification',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Piping',
                          plannedProgress: 0,
                          actualProgress: 0,
                          variance: 0,
                          status: 'pending',
                          delayDays: 2,
                        },
                      ],
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
              levelLabel: 'L3 Discipline',
              discipline: 'Civil',
              plannedProgress: 100,
              actualProgress: 100,
              variance: 0,
              status: 'completed',
              delayDays: 0,
              children: [
                {
                  id: 'L4-WP21',
                  code: 'WP-2.1',
                  name: 'Compressor Bay Foundations',
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
                      children: [
                        {
                          id: 'L6-SUB-CIV-01',
                          code: 'SUB-CIV-01',
                          name: 'Rebar Caging & Foundation Anchor Sleeves Placement',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Civil',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB-CIV-02',
                          code: 'SUB-CIV-02',
                          name: 'M35 Concrete Pour & 28-Day Curing Cube Testing',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
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
              id: 'L3-MEC',
              code: 'DISC-MEC',
              name: 'Mechanical Equipment & Skid Packages',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Mechanical',
              plannedProgress: 20,
              actualProgress: 15,
              variance: -5,
              status: 'on-track',
              delayDays: 0,
              children: [
                {
                  id: 'L4-WP41',
                  code: 'WP-4.1',
                  name: 'Gas Compression Trains Package',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Mechanical',
                  plannedProgress: 20,
                  actualProgress: 15,
                  variance: -5,
                  status: 'on-track',
                  delayDays: 0,
                  children: [
                    {
                      id: 'L5-MEC08003',
                      code: 'MEC-08-003',
                      name: 'Align Centrifugal Gas Compressor Skid A',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Mechanical',
                      plannedProgress: 20,
                      actualProgress: 15,
                      variance: -5,
                      status: 'on-track',
                      delayDays: 0,
                      children: [
                        {
                          id: 'L6-SUB-MEC-01',
                          code: 'SUB-MEC-01',
                          name: 'Baseplate Shimming & Rough Pre-Alignment Check',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Mechanical',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB-MEC-02',
                          code: 'SUB-MEC-02',
                          name: 'Laser Precision Coupling Alignment Under Hot Condition',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Mechanical',
                          plannedProgress: 0,
                          actualProgress: 0,
                          variance: 0,
                          status: 'pending',
                          delayDays: 0,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
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
                  id: 'L4-WP51',
                  code: 'WP-5.1',
                  name: 'Overhead Cable Tray Galleries',
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
                      name: 'Cable Tray Installation - Substation to Compressor Bay',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Electrical',
                      plannedProgress: 50,
                      actualProgress: 40,
                      variance: -10,
                      status: 'at-risk',
                      delayDays: 1,
                      children: [
                        {
                          id: 'L6-SUB-ELE-01',
                          code: 'SUB-ELE-01',
                          name: 'Fabricate & Weld Overhead Support Brackets (32 nos)',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Electrical',
                          plannedProgress: 100,
                          actualProgress: 100,
                          variance: 0,
                          status: 'completed',
                          delayDays: 0,
                        },
                        {
                          id: 'L6-SUB-ELE-02',
                          code: 'SUB-ELE-02',
                          name: 'Run 600mm Galvanized Ladder Trays Across Bay 1-4',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Electrical',
                          plannedProgress: 40,
                          actualProgress: 25,
                          variance: -15,
                          status: 'delayed',
                          delayDays: 1,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: 'L3-INS',
              code: 'DISC-INS',
              name: 'Instrumentation, Control & Loop Tubing',
              level: 'L3',
              levelLabel: 'L3 Discipline',
              discipline: 'Instrumentation',
              plannedProgress: 15,
              actualProgress: 0,
              variance: -15,
              status: 'pending',
              delayDays: 2,
              children: [
                {
                  id: 'L4-WP52',
                  code: 'WP-5.2',
                  name: 'Transmitter & Skid Instrumentation',
                  level: 'L4',
                  levelLabel: 'L4 Work Package',
                  discipline: 'Instrumentation',
                  plannedProgress: 15,
                  actualProgress: 0,
                  variance: -15,
                  status: 'pending',
                  delayDays: 2,
                  children: [
                    {
                      id: 'L5-INS02005',
                      code: 'INS-02-005',
                      name: 'Mount Smart Pressure Transmitters on Line 24-XX',
                      level: 'L5',
                      levelLabel: 'L5 Activity',
                      discipline: 'Instrumentation',
                      plannedProgress: 15,
                      actualProgress: 0,
                      variance: -15,
                      status: 'pending',
                      delayDays: 2,
                      children: [
                        {
                          id: 'L6-SUB-INS-01',
                          code: 'SUB-INS-01',
                          name: 'Install SS316 1/2" Impulse Tubing & 5-Valve Manifold',
                          level: 'L6',
                          levelLabel: 'L6 Sub-Activity',
                          discipline: 'Instrumentation',
                          plannedProgress: 0,
                          actualProgress: 0,
                          variance: 0,
                          status: 'pending',
                          delayDays: 2,
                        },
                      ],
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

  // Toggle Hierarchy Expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (node: HierarchyNode) => {
      all[node.id] = true;
      if (node.children) node.children.forEach(traverse);
    };
    traverse(hierarchyTree);
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes({ 'L1-MAIN': true });
  };

  // Submit Field Update
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
          description: `Extracted ${res.data.workDescription.slice(0, 45)}... [Confidence: ${res.data.confidence}%]`,
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

  // Render Hierarchy Row Component
  const renderHierarchyNode = (node: HierarchyNode, depth: number = 0) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = Boolean(expandedNodes[node.id]);

    // Level Filter Check
    if (hierarchyFilterLevel !== 'all') {
      if (hierarchyFilterLevel === 'L1-L2' && !['L1', 'L2'].includes(node.level)) {
        // Allow rendering if children match or skip
      }
    }

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
      L5: { bg: 'bg-[#8A94A6]/10', text: 'text-[#172033]', border: 'border-[#8A94A6]/30' },
      L6: { bg: 'bg-[#F0F2F5]', text: 'text-[#596579]', border: 'border-[#D9DEE5]' },
    };

    const colors = levelColorMap[node.level];

    return (
      <React.Fragment key={node.id}>
        <div
          className={`group flex items-center justify-between py-2 px-3 hover:bg-[#F9FAFC] border-b border-[#E8EBF0] text-xs transition-colors ${
            depth === 0 ? 'bg-[#F7F8FA] font-medium' : ''
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 24 + 12)}px` }}
        >
          {/* Left: Expand toggle + Level Badge + Name */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleNode(node.id)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#E8EBF0] text-[#596579] flex-shrink-0 transition-colors"
                aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 h-5 flex items-center justify-center text-[#8A94A6] text-[10px] flex-shrink-0">
                •
              </span>
            )}

            <span
              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-bold flex-shrink-0 ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {node.level}
            </span>

            <span className="font-mono text-[11px] font-semibold text-[#172033] flex-shrink-0">
              {node.code}
            </span>

            <span className="text-[#172033] truncate group-hover:text-[#176B87] transition-colors" title={node.name}>
              {node.name}
            </span>

            {node.isCritical && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#FDF0EE] text-[#B5473C] border border-[#E4B0AA] font-mono font-bold flex-shrink-0">
                CRITICAL
              </span>
            )}
          </div>

          {/* Right: Progress Bar + Delay Days + Status + Drill-down Action */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Progress Bar */}
            <div className="w-28 sm:w-36 hidden md:block">
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5 text-[#596579]">
                <span>{node.actualProgress}%</span>
                <span>T: {node.plannedProgress}%</span>
              </div>
              <ProgressBar
                actual={node.actualProgress}
                planned={node.plannedProgress}
                size="sm"
                status={node.status}
                showLabels={false}
              />
            </div>

            {/* Delay Days */}
            <div className="w-14 text-right font-mono text-[11px] hidden sm:block">
              {node.delayDays > 0 ? (
                <span className="text-[#B5473C] font-semibold">+{node.delayDays}d slip</span>
              ) : (
                <span className="text-[#2E7D5B]">0d float</span>
              )}
            </div>

            {/* Status Badge */}
            <StatusBadge status={node.status} size="sm" />

            {/* Drill-down link */}
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(project.id);
                router.push(`/schedule?search=${encodeURIComponent(node.code)}`);
              }}
              className="text-[#176B87] hover:bg-[#E8F1F5] p-1 rounded transition-colors"
              title={`Drill down to ${node.code} in Master Schedule`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children Rows */}
        {hasChildren &&
          isExpanded &&
          node.children!.map((child) => renderHierarchyNode(child, depth + 1))}
      </React.Fragment>
    );
  };

  return (
    <StateWrapper>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />

        {/* TOP: Operational Header */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#176B87] text-white">
                  {project.id}
                </span>
                <span className="font-mono text-xs font-semibold text-[#596579] bg-[#F0F2F5] px-2 py-0.5 rounded border border-[#D9DEE5]">
                  {project.code}
                </span>
                <StatusBadge status={project.status} size="sm" />
                <span className="text-xs text-[#596579] hidden sm:inline">•</span>
                <span className="text-xs font-mono font-medium text-[#172033] bg-[#F7F8FA] px-2 py-0.5 rounded border border-[#D9DEE5]">
                  Baseline: {project.scheduleVersion || 'Rev 3.2 (P6 XML)'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                {project.name}
              </h1>

              <div className="flex items-center gap-3 text-xs text-[#596579] mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#8A94A6]" />
                  <strong className="text-[#172033]">{project.organization}</strong>
                </span>
                <span>•</span>
                <span>Location: {project.location}</span>
                <span>•</span>
                <span>Contractor: {project.contractor}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono text-[#176B87]">
                  <Clock className="w-3.5 h-3.5" />
                  Reporting Period: 18 Sep 2026 (Bi-Weekly Cutoff)
                </span>
              </div>
            </div>

            {/* Actions: Open Schedule | Capture Field Update | Review Queue | Reports */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(project.id);
                  router.push('/schedule');
                }}
                className="px-3 py-2 text-xs font-medium text-[#172033] bg-[#F7F8FA] hover:bg-[#E8EBF0] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-1.5"
                title="Open Master Schedule WBS"
              >
                <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                <span>Open Schedule</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFieldModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded-md transition-colors inline-flex items-center gap-1.5 shadow-sm"
                title="Record new site progress statement"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Capture Field Update</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveProjectId(project.id);
                  router.push('/matching');
                }}
                className="px-3 py-2 text-xs font-medium text-[#172033] bg-[#F7F8FA] hover:bg-[#E8EBF0] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-1.5"
                title="View Match Verification Queue"
              >
                <GitCompare className="w-3.5 h-3.5 text-[#D98B32]" />
                <span>Review Queue</span>
                {(project.openReviews || 0) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#D98B32] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                    {project.openReviews}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                className="px-3 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] bg-white hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-1.5"
                title="Open Project Dossier & Export Reports"
              >
                <FileText className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>

        {/* SUMMARY: Key Operational Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Overall Progress */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-1.5">
            <span className="text-[11px] text-[#596579] font-medium block">Overall Progress</span>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-xl font-bold text-[#172033]">{project.overallProgress}%</span>
              <span className="text-xs text-[#596579]">T: {project.plannedProgress}%</span>
            </div>
            <ProgressBar
              actual={project.overallProgress}
              planned={project.plannedProgress}
              size="sm"
              status={project.status}
              showLabels={false}
            />
          </div>

          {/* 2. Planned vs Actual Variance */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-1">
            <span className="text-[11px] text-[#596579] font-medium block">Planned vs Actual</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold font-mono text-[#B5473C]">
                {project.overallProgress - project.plannedProgress}%
              </span>
              <VarianceBadge daysDelay={project.status === 'delayed' ? 4 : 2} size="sm" />
            </div>
            <span className="text-[10px] text-[#596579] block">Critical path schedule delta</span>
          </div>

          {/* 3. Pending Review */}
          <Link
            href="/matching"
            onClick={() => setActiveProjectId(project.id)}
            className="bg-white border border-[#D9DEE5] hover:border-[#D98B32] rounded-lg p-3.5 transition-colors group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#596579] font-medium">Pending Review</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#D98B32]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#D98B32] block mt-1">
              {project.openReviews || 3}{' '}
              <span className="text-xs font-normal text-[#596579]">items</span>
            </span>
            <span className="text-[10px] text-[#176B87] group-hover:underline flex items-center gap-0.5 mt-0.5">
              <span>Open Queue</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          {/* 4. Unmatched Events */}
          <Link
            href="/field"
            onClick={() => setActiveProjectId(project.id)}
            className="bg-white border border-[#D9DEE5] hover:border-[#B5473C] rounded-lg p-3.5 transition-colors group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#596579] font-medium">Unmatched Events</span>
              <AlertCircle className="w-3.5 h-3.5 text-[#B5473C]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#B5473C] block mt-1">
              1 <span className="text-xs font-normal text-[#596579]">event</span>
            </span>
            <span className="text-[10px] text-[#176B87] group-hover:underline flex items-center gap-0.5 mt-0.5">
              <span>Map Activity</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          {/* 5. Delayed Activities */}
          <Link
            href="/variance"
            onClick={() => setActiveProjectId(project.id)}
            className="bg-white border border-[#D9DEE5] hover:border-[#B5473C] rounded-lg p-3.5 transition-colors group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#596579] font-medium">Delayed Activities</span>
              <TrendingDown className="w-3.5 h-3.5 text-[#B5473C]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#B5473C] block mt-1">
              {project.delayedCount || 2}{' '}
              <span className="text-xs font-normal text-[#596579]">critical</span>
            </span>
            <span className="text-[10px] text-[#176B87] group-hover:underline flex items-center gap-0.5 mt-0.5">
              <span>Inspect Delays</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          {/* 6. Open Risks */}
          <Link
            href="/variance"
            onClick={() => setActiveProjectId(project.id)}
            className="bg-white border border-[#D9DEE5] hover:border-[#176B87] rounded-lg p-3.5 transition-colors group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#596579] font-medium">Open Risks</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#176B87]" />
            </div>
            <span className="text-xl font-bold font-mono text-[#172033] block mt-1">
              {project.openRisks || 2}{' '}
              <span className="text-xs font-normal text-[#596579]">chains</span>
            </span>
            <span className="text-[10px] text-[#176B87] group-hover:underline flex items-center gap-0.5 mt-0.5">
              <span>View Delay Chains</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>

        {/* SECTION: PROJECT HIERARCHY (L1 -> L2 -> L3 -> L4 -> L5 -> L6 Drill-Down) */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#D9DEE5] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F7F8FA]">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                  Project WBS Hierarchy Drill-Down
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Full structured breakdown: <strong className="text-[#172033]">L1 Project</strong> → <strong className="text-[#172033]">L2 Area</strong> → <strong className="text-[#172033]">L3 Discipline</strong> → <strong className="text-[#172033]">L4 Work Package</strong> → <strong className="text-[#172033]">L5 Activity</strong> → <strong className="text-[#172033]">L6 Sub-Activity</strong>.
              </p>
            </div>

            {/* Hierarchy Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search filter */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-[#8A94A6] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter WBS code or title..."
                  value={hierarchySearch}
                  onChange={(e) => setHierarchySearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-[#D9DEE5] rounded focus:border-[#176B87] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-xs font-medium text-[#172033] bg-white border border-[#D9DEE5] rounded hover:bg-[#E8EBF0] transition-colors"
              >
                Expand All
              </button>

              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-xs font-medium text-[#596579] bg-white border border-[#D9DEE5] rounded hover:bg-[#E8EBF0] transition-colors"
              >
                Collapse
              </button>
            </div>
          </div>

          {/* Hierarchy Column Header */}
          <div className="bg-[#F0F2F5] border-b border-[#D9DEE5] px-3 py-2 text-[11px] font-semibold text-[#596579] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>WBS CODE &amp; BREAKDOWN HIERARCHY</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-28 sm:w-36 text-center hidden md:inline">ACTUAL VS PLANNED</span>
              <span className="w-14 text-right hidden sm:inline">VARIANCE</span>
              <span className="w-24 text-center">STATUS</span>
              <span className="w-6 text-center">ACTION</span>
            </div>
          </div>

          {/* Render Recursive Tree */}
          <div className="divide-y divide-[#E8EBF0]">
            {renderHierarchyNode(hierarchyTree)}
          </div>

          {/* Hierarchy Footer */}
          <div className="p-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex items-center justify-between text-xs text-[#596579]">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[11px]">Depth: 6 Levels Ingested</span>
              <span>•</span>
              <span>Target Baseline: Primavera P6 XML Rev 3.2</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveProjectId(project.id);
                router.push('/schedule');
              }}
              className="text-[#176B87] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Explore in Full Master Schedule Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* SECTION: RECENT EXECUTION & RECENT EVIDENCE (Two Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECENT EXECUTION */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Recent Execution Events
                  </h3>
                </div>
                <Link
                  href="/field"
                  onClick={() => setActiveProjectId(project.id)}
                  className="text-xs text-[#176B87] hover:underline font-semibold flex items-center gap-0.5"
                >
                  <span>All Events ({executionEvents.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {executionEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border border-[#D9DEE5] rounded-lg hover:border-[#176B87] transition-colors space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B87]">{event.id}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F0F2F5] text-[#596579]">
                          {event.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ConfidenceBadge score={event.confidence} />
                        <span className="text-[11px] text-[#8A94A6] font-mono">{event.eventDate}</span>
                      </div>
                    </div>

                    <p className="text-[#172033] bg-[#F7F8FA] p-2 rounded border border-[#E8EBF0] text-[11px] italic">
                      &quot;{event.rawText}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#596579] pt-1">
                      <div>
                        Matched: <strong className="text-[#172033]">{event.matchedActivityId || 'Pending'}</strong>
                      </div>
                      <Link
                        href="/matching"
                        onClick={() => setActiveProjectId(project.id)}
                        className="text-[#176B87] hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>Inspect Match</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-[#E8EBF0] flex items-center justify-between">
              <span className="text-[11px] text-[#596579]">
                Continuous Daily Site Progress Ingestion
              </span>
              <button
                type="button"
                onClick={() => setIsFieldModalOpen(true)}
                className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Site Observation</span>
              </button>
            </div>
          </div>

          {/* RECENT EVIDENCE */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Recent Evidence Vault
                  </h3>
                </div>
                <Link
                  href="/evidence"
                  onClick={() => setActiveProjectId(project.id)}
                  className="text-xs text-[#176B87] hover:underline font-semibold flex items-center gap-0.5"
                >
                  <span>Evidence Vault ({evidenceItems.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {evidenceItems.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border border-[#D9DEE5] rounded-lg hover:border-[#176B87] transition-colors space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'PHOTO' ? (
                          <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#596579]" />
                        )}
                        <span className="font-semibold text-[#172033] truncate max-w-[220px]">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A94A6]">{item.fileSize}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#596579]">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span>WBS: <strong className="text-[#172033]">{item.activityId || 'Unlinked'}</strong></span>
                        {item.gpsCoords && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-[10px]">
                              <MapPin className="w-3 h-3 text-[#2E7D5B]" />
                              {item.gpsCoords.split(',')[0]}
                            </span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedEvidence(item)}
                        className="text-[#176B87] hover:underline font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-[#E8EBF0] flex items-center justify-between">
              <span className="text-[11px] text-[#596579]">
                Tamper-Evident Audit Trail &amp; QA/QC Documentation
              </span>
              <Link
                href="/evidence"
                onClick={() => setActiveProjectId(project.id)}
                className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <span>Browse Full Vault</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION: DEPENDENCY IMPACT & SCHEDULE HEALTH (Two Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* DEPENDENCY IMPACT */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-[#B5473C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Critical Path Dependency Impact
                </h3>
              </div>
              <Link
                href="/variance"
                onClick={() => setActiveProjectId(project.id)}
                className="text-xs text-[#176B87] hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>Delay Chain Simulator</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 text-xs">
              {/* Primary Driving Delay Chain */}
              <div className="p-3.5 bg-[#FDF0EE] border border-[#E4B0AA] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-[#B5473C]">PIP-24-002: Line 24-XX Field Joints</span>
                  <span className="text-xs font-mono font-bold text-[#B5473C] bg-white px-2 py-0.5 rounded border border-[#E4B0AA]">
                    +2 Days Critical Slip
                  </span>
                </div>
                <p className="text-[11px] text-[#172033]">
                  <strong>Root Cause:</strong> Delayed delivery of 24-inch 600# carbon steel weld fittings from central stores warehouse voucher #4102.
                </p>
                <div className="pt-2 border-t border-[#E4B0AA]/40 space-y-1">
                  <span className="text-[11px] font-bold text-[#172033] block">
                    Immediate Downstream Successors Blocked:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded border border-[#E4B0AA]">
                      <strong className="text-[#172033] block font-mono">PIP-24-003 [FS Precedence]</strong>
                      <span className="text-[#596579]">Hydrostatic Pressure Test 150 bar</span>
                      <span className="text-[#B5473C] block font-semibold mt-0.5">Float eroded to 0 days</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-[#E4B0AA]">
                      <strong className="text-[#172033] block font-mono">INS-02-005 [SS+3d Precedence]</strong>
                      <span className="text-[#596579]">Pressure Transmitter Tubing</span>
                      <span className="text-[#B5473C] block font-semibold mt-0.5">Start date shifted by +2d</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Item */}
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between">
                <div>
                  <span className="font-semibold text-[#172033] block">Recommended Recovery Action</span>
                  <span className="text-[#596579] text-[11px]">
                    Assign second welding gang on night shift to recoup 2 days before hydrotest.
                  </span>
                </div>
                <Link
                  href="/variance"
                  onClick={() => setActiveProjectId(project.id)}
                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded transition-colors whitespace-nowrap"
                >
                  Simulate Recovery
                </Link>
              </div>
            </div>
          </div>

          {/* SCHEDULE HEALTH */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Baseline Schedule Health
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#176B87] bg-[#E8F1F5] px-2 py-0.5 rounded">
                Health Score: {MOCK_HEALTH_SCORE.overall} / 100
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#596579]">Schedule Performance</span>
                    <strong className="text-[#172033]">{MOCK_HEALTH_SCORE.schedulePerformance}%</strong>
                  </div>
                  <ProgressBar actual={MOCK_HEALTH_SCORE.schedulePerformance} size="sm" showLabels={false} />
                </div>

                <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#596579]">Milestone Integrity</span>
                    <strong className="text-[#172033]">{MOCK_HEALTH_SCORE.milestonePerformance}%</strong>
                  </div>
                  <ProgressBar actual={MOCK_HEALTH_SCORE.milestonePerformance} size="sm" showLabels={false} />
                </div>

                <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#596579]">Float Preservation</span>
                    <strong className="text-[#B5473C]">{MOCK_HEALTH_SCORE.openRisks}%</strong>
                  </div>
                  <ProgressBar actual={MOCK_HEALTH_SCORE.openRisks} size="sm" status="at-risk" showLabels={false} />
                </div>

                <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
                  <div className="flex justify-between font-mono">
                    <span className="text-[#596579]">Verification Coverage</span>
                    <strong className="text-[#2E7D5B]">{MOCK_HEALTH_SCORE.dataQuality}%</strong>
                  </div>
                  <ProgressBar actual={MOCK_HEALTH_SCORE.dataQuality} size="sm" status="on-track" showLabels={false} />
                </div>
              </div>

              {/* Health Analysis Notes */}
              <div className="space-y-1.5 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-[11px] text-[#596579]">
                <strong className="text-[#172033] block">Institutional Health Assessment:</strong>
                <ul className="list-disc pl-4 space-y-1 text-[#596579]">
                  {MOCK_HEALTH_SCORE.breakdownNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* MODAL: Capture Field Update */}
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
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitFieldReport}
                disabled={isSubmittingField || !fieldReportText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
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
                  className={`p-2 text-center rounded border transition-colors ${
                    fieldSource === 'FIELD_QUICK_FORM'
                      ? 'bg-[#E8F1F5] text-[#176B87] border-[#176B87] font-semibold'
                      : 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]'
                  }`}
                >
                  Quick Site Note
                </button>
                <button
                  type="button"
                  onClick={() => setFieldSource('SITE_DIARY')}
                  className={`p-2 text-center rounded border transition-colors ${
                    fieldSource === 'SITE_DIARY'
                      ? 'bg-[#E8F1F5] text-[#176B87] border-[#176B87] font-semibold'
                      : 'bg-[#F7F8FA] text-[#596579] border-[#D9DEE5]'
                  }`}
                >
                  Supervisor Diary
                </button>
                <button
                  type="button"
                  onClick={() => setFieldSource('DPR_PDF')}
                  className={`p-2 text-center rounded border transition-colors ${
                    fieldSource === 'DPR_PDF'
                      ? 'bg-[#E8F1F5] text-[#176B87] border-[#176B87] font-semibold'
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

            <div className="p-2.5 bg-[#F0F2F5] rounded text-[11px] text-[#596579] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#176B87] flex-shrink-0 mt-0.5" />
              <span>
                PLnEX NLP engine will parse activity quantities, locations, and weld joints, scoring candidates against L5/L6 activities in the schedule twin.
              </span>
            </div>
          </form>
        </Modal>

        {/* MODAL: Evidence Inspection */}
        {selectedEvidence && (
          <Modal
            isOpen={Boolean(selectedEvidence)}
            onClose={() => setSelectedEvidence(null)}
            title={selectedEvidence.title}
            subtitle={`Evidence ID: ${selectedEvidence.id} • Linked Activity: ${selectedEvidence.activityId || 'Unlinked'}`}
            maxWidth="md"
            footer={
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="px-3.5 py-1.5 text-xs text-[#172033] bg-[#F7F8FA] hover:bg-[#E8EBF0] border border-[#D9DEE5] rounded"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#596579]">Filename:</span>
                  <strong className="text-[#172033] font-mono">{selectedEvidence.filename}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">File Size:</span>
                  <span className="font-mono">{selectedEvidence.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Recorded Timestamp:</span>
                  <span className="font-mono">{selectedEvidence.timestamp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Site Engineer:</span>
                  <span className="font-semibold text-[#172033]">{selectedEvidence.uploader}</span>
                </div>
                {selectedEvidence.gpsCoords && (
                  <div className="flex justify-between">
                    <span className="text-[#596579]">GPS Coordinates:</span>
                    <span className="font-mono text-[#2E7D5B]">{selectedEvidence.gpsCoords}</span>
                  </div>
                )}
              </div>

              {selectedEvidence.notes && (
                <div className="p-3 bg-white border border-[#D9DEE5] rounded">
                  <span className="font-bold text-[#172033] block mb-1">Field QA/QC Verification Notes:</span>
                  <p className="text-[#596579]">{selectedEvidence.notes}</p>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* MODAL: Reports & Dossier */}
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
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded inline-flex items-center gap-1.5"
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
                <strong className="font-mono text-[#172033]">{project.scheduleVersion || 'Rev 3.2 (P6 XML)'}</strong>
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
