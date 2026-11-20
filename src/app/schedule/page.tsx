'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { ProjectSelector } from '../../components/shell/ProjectSelector';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Modal } from '../../components/shared/Modal';
import { WhyButton } from '../../components/shared/WhyButton';
import { ScheduleActivity, WBSLevel, DisciplineType } from '../../types';
import {
  MASTER_CANONICAL_ACTIVITIES,
  getCanonicalActivity,
  CANONICAL_SCHEDULE_VERSION_LABEL,
} from '../../lib/domain/canonicalModels';
import {
  Upload,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Info,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
  FolderTree,
  ChevronsUpDown,
  Maximize2,
  Minimize2,
  FileText,
  ShieldCheck,
  Check,
} from 'lucide-react';

export type VersionState = 'current' | 'previous' | 'processing' | 'failed';

export type SortField =
  | 'id'
  | 'name'
  | 'wbsLevel'
  | 'area'
  | 'discipline'
  | 'plannedStart'
  | 'plannedFinish'
  | 'actualProgress'
  | 'status'
  | 'delayDays';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export interface ImportErrorItem {
  row: number;
  column: string;
  problem: string;
  correction: string;
  field?: string;
  error?: string;
  reason?: string;
}

export interface ScheduleVersionItem {
  id: string; // e.g., "V3"
  label: string; // "V3 · Rev 3.2"
  versionCode: string; // "V3 · Rev 3.2"
  status: VersionState;
  source: string; // "Primavera P6 XML"
  sourceFile: string;
  activitiesCount: number;
  criticalCount: number;
  importedAt: string;
  importedBy: string;
  dataDate: string;
  notes?: string;
  errors?: ImportErrorItem[];
}

// Complete Multi-Level WBS Activities Data (L1 Project down to L6 Sub-Activities)
// Unified canonical activities (42 items spanning L1 to L6)
// Authoritative baseline anchor: PIP-24-002 (wbs: '1.1.3.2.2', actualProgress: 70)
const INITIAL_SCHEDULE_ACTIVITIES: ScheduleActivity[] = MASTER_CANONICAL_ACTIVITIES;

// Baseline Comparison / Diff mapping between Rev 3.2 and Rev 3.1 (Monsoon Schedule Recovery)
export interface BaselineDiffItem {
  rev31Finish: string;
  rev32Finish: string;
  slipDays: number;
  reason: string;
  isNew?: boolean;
}

const REV_3_1_DIFFS: Record<string, BaselineDiffItem> = {
  'PRJ-OIL-01': { rev31Finish: '2026-12-13', rev32Finish: '2026-12-15', slipDays: 2, reason: 'Overall plant completion date pushed 2 days due to monsoon welding hold' },
  'AREA-100': { rev31Finish: '2026-11-28', rev32Finish: '2026-11-30', slipDays: 2, reason: 'Area 100 critical path header delay' },
  'DISC-CIV-1': { rev31Finish: '2026-10-15', rev32Finish: '2026-10-15', slipDays: 0, reason: 'Civil works proceeding on schedule' },
  'WP-CIV-01': { rev31Finish: '2026-09-20', rev32Finish: '2026-09-20', slipDays: 0, reason: 'Foundation plinths completed on schedule' },
  'CIV-11-001': { rev31Finish: '2026-09-14', rev32Finish: '2026-09-14', slipDays: 0, reason: 'Pedestal pour completed on schedule' },
  'CIV-11-002': { rev31Finish: '2026-09-18', rev32Finish: '2026-09-18', slipDays: 0, reason: 'Slug catcher saddle completed on schedule' },
  'STR-02-004': { rev31Finish: '2026-09-15', rev32Finish: '2026-09-15', slipDays: 0, reason: 'Piperack steel framing completed on schedule' },
  'DISC-PIP-3': { rev31Finish: '2026-10-29', rev32Finish: '2026-10-31', slipDays: 2, reason: 'Line 24-XX butt weld NDT delay' },
  'WP-3.2': { rev31Finish: '2026-09-23', rev32Finish: '2026-09-25', slipDays: 2, reason: 'Header package duration extended' },
  'PIP-24-001': { rev31Finish: '2026-09-15', rev32Finish: '2026-09-17', slipDays: 2, reason: 'Crane rigging permit delayed 2 days' },
  'SUB-24-01': { rev31Finish: '2026-09-13', rev32Finish: '2026-09-14', slipDays: 1, reason: 'Crane rigging permit delay' },
  'SUB-24-02': { rev31Finish: '2026-09-15', rev32Finish: '2026-09-17', slipDays: 2, reason: 'Support load adjustment' },
  'PIP-24-002': { rev31Finish: '2026-09-18', rev32Finish: '2026-09-20', slipDays: 2, reason: 'Heavy rain interrupted radiographic gamma testing' },
  'SUB-24-03': { rev31Finish: '2026-09-18', rev32Finish: '2026-09-18', slipDays: 0, reason: 'New L6 sub-activity added in Rev 3.2', isNew: true },
  'SUB-24-04': { rev31Finish: '2026-09-18', rev32Finish: '2026-09-20', slipDays: 2, reason: 'New L6 sub-activity added in Rev 3.2', isNew: true },
  'PIP-24-003': { rev31Finish: '2026-09-20', rev32Finish: '2026-09-22', slipDays: 2, reason: 'Hydrotest window shifted to accommodate predecessor NDT' },
  'PIP-24-004': { rev31Finish: '2026-09-23', rev32Finish: '2026-09-25', slipDays: 2, reason: 'Golden weld tie-in shifted downstream' },
  'DISC-MEC-4': { rev31Finish: '2026-11-12', rev32Finish: '2026-11-15', slipDays: 3, reason: 'OEM compressor skid delivery date shifted' },
  'WP-MEC-01': { rev31Finish: '2026-10-02', rev32Finish: '2026-10-05', slipDays: 3, reason: 'Compressor skid train arrival' },
  'MEC-08-003': { rev31Finish: '2026-09-19', rev32Finish: '2026-09-22', slipDays: 3, reason: 'Laser alignment window rescheduled' },
  'MEC-03-010': { rev31Finish: '2026-09-26', rev32Finish: '2026-09-26', slipDays: 0, reason: 'Slug catcher demister on schedule' },
  'DISC-ELE-5': { rev31Finish: '2026-11-18', rev32Finish: '2026-11-20', slipDays: 2, reason: 'Substation gallery cable ladder alignment' },
  'WP-ELE-01': { rev31Finish: '2026-09-28', rev32Finish: '2026-09-30', slipDays: 2, reason: 'Cable tray erection sequence' },
  'ELE-11-032': { rev31Finish: '2026-09-21', rev32Finish: '2026-09-23', slipDays: 2, reason: 'Overhead gallery tray mounting' },
  'WP-ELE-02': { rev31Finish: '2026-10-15', rev32Finish: '2026-10-15', slipDays: 0, reason: 'Cable pulling on schedule' },
  'ELE-12-015': { rev31Finish: '2026-09-29', rev32Finish: '2026-09-29', slipDays: 0, reason: 'Transformer busduct bolting on schedule' },
  'DISC-INS-6': { rev31Finish: '2026-11-10', rev32Finish: '2026-11-10', slipDays: 0, reason: 'Instrumentation on schedule' },
  'WP-INS-02': { rev31Finish: '2026-10-10', rev32Finish: '2026-10-10', slipDays: 0, reason: 'Transmitters hookup window' },
  'INS-02-005': { rev31Finish: '2026-09-23', rev32Finish: '2026-09-25', slipDays: 2, reason: 'Impulse line mounting dependent on Header welding' },
  'INS-04-015': { rev31Finish: '2026-09-24', rev32Finish: '2026-09-25', slipDays: 1, reason: 'Transmitter bench calibration awaiting line clearance' },
  'AREA-200': { rev31Finish: '2026-12-05', rev32Finish: '2026-12-05', slipDays: 0, reason: 'Condensate terminal works on schedule' },
  'DISC-CIV-2': { rev31Finish: '2026-10-20', rev32Finish: '2026-10-20', slipDays: 0, reason: 'Tank bund walls on schedule' },
  'WP-CIV-03': { rev31Finish: '2026-09-25', rev32Finish: '2026-09-25', slipDays: 0, reason: 'Storage tank foundation on schedule' },
  'CIV-12-004': { rev31Finish: '2026-09-20', rev32Finish: '2026-09-20', slipDays: 0, reason: 'Annular plate foundation on schedule' },
  'DISC-PIP-4': { rev31Finish: '2026-11-25', rev32Finish: '2026-11-25', slipDays: 0, reason: 'Offsites piping on schedule' },
  'WP-4.1': { rev31Finish: '2026-10-25', rev32Finish: '2026-10-25', slipDays: 0, reason: 'Tank farm interconnecting on schedule' },
  'MEC-09-001': { rev31Finish: '2026-09-29', rev32Finish: '2026-09-29', slipDays: 0, reason: 'Export pump skid alignment on schedule' },
  'AREA-300': { rev31Finish: '2026-12-01', rev32Finish: '2026-12-01', slipDays: 0, reason: 'Utilities and flare on schedule' },
  'DISC-PIP-5': { rev31Finish: '2026-11-15', rev32Finish: '2026-11-15', slipDays: 0, reason: 'Flare network on schedule' },
  'WP-5.1': { rev31Finish: '2026-10-10', rev32Finish: '2026-10-10', slipDays: 0, reason: 'Flare stack erection on schedule' },
  'ELE-08-012': { rev31Finish: '2026-09-20', rev32Finish: '2026-09-20', slipDays: 0, reason: 'Diesel generator test completed on schedule' },
  'COM-99-001': { rev31Finish: '2026-10-03', rev32Finish: '2026-10-05', slipDays: 2, reason: 'Pre-commissioning start shifted following battery limit tie-in' },
};

// Version baseline mapping logic
function getVersionActivities(versionId: string, baseActivities: ScheduleActivity[]): ScheduleActivity[] {
  if (versionId === 'V2') {
    return baseActivities.map((act) => {
      if (act.id === 'PRJ-OIL-01') return { ...act, plannedProgress: 60, actualProgress: 60, variance: 0, delayDays: 0, status: 'on-track', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'AREA-100') return { ...act, plannedProgress: 58, actualProgress: 58, variance: 0, delayDays: 0, status: 'on-track', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'CIV-11-001') return { ...act, plannedProgress: 100, actualProgress: 100, variance: 0, delayDays: 0, status: 'completed', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'PIP-24-001') return { ...act, plannedProgress: 40, actualProgress: 40, variance: 0, delayDays: 0, status: 'in-progress', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'PIP-24-002') return { ...act, plannedProgress: 0, actualProgress: 0, variance: 0, delayDays: 0, status: 'pending', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'PIP-24-003') return { ...act, plannedProgress: 0, actualProgress: 0, variance: 0, delayDays: 0, status: 'pending', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'MEC-08-003') return { ...act, plannedProgress: 0, actualProgress: 0, variance: 0, delayDays: 0, status: 'pending', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      if (act.id === 'ELE-11-032') return { ...act, plannedProgress: 0, actualProgress: 0, variance: 0, delayDays: 0, status: 'pending', scheduleVersion: 'Rev 2.0 (P6 XML)' };
      return {
        ...act,
        plannedProgress: Math.min(act.plannedProgress, 40),
        actualProgress: Math.min(act.actualProgress, 40),
        variance: 0,
        delayDays: 0,
        status: act.plannedProgress > 0 ? (act.actualProgress >= 100 ? 'completed' : 'in-progress') : 'pending',
        scheduleVersion: 'Rev 2.0 (P6 XML)',
      };
    });
  }
  if (versionId === 'V1') {
    return baseActivities.map((act) => {
      if (act.id === 'PRJ-OIL-01') return { ...act, plannedProgress: 35, actualProgress: 35, variance: 0, delayDays: 0, status: 'on-track', scheduleVersion: 'Rev 1.0 (P6 XML)' };
      if (act.id === 'AREA-100') return { ...act, plannedProgress: 30, actualProgress: 30, variance: 0, delayDays: 0, status: 'on-track', scheduleVersion: 'Rev 1.0 (P6 XML)' };
      if (act.id === 'CIV-11-001') return { ...act, plannedProgress: 30, actualProgress: 30, variance: 0, delayDays: 0, status: 'in-progress', scheduleVersion: 'Rev 1.0 (P6 XML)' };
      return {
        ...act,
        plannedProgress: Math.min(act.plannedProgress, 20),
        actualProgress: Math.min(act.actualProgress, 20),
        variance: 0,
        delayDays: 0,
        status: act.id === 'CIV-11-001' ? 'in-progress' : (act.wbsLevel === 'L1' || act.wbsLevel === 'L2' ? 'on-track' : 'pending'),
        scheduleVersion: 'Rev 1.0 (P6 XML)',
      };
    });
  }
  return baseActivities;
}


// Historical schedule versions
const DEFAULT_VERSIONS: ScheduleVersionItem[] = [
  {
    id: 'V3',
    label: 'Rev 3.2 (P6 XML)',
    versionCode: 'Rev 3.2 (P6 XML)',
    status: 'current',
    source: 'Primavera P6 XML',
    sourceFile: 'OIL_DUL_BASELINE_REV3.2.xml',
    activitiesCount: 148,
    criticalCount: 24,
    importedAt: '18 Sep 2026, 17:30 IST',
    importedBy: 'Rajesh Sharma (Controls Manager)',
    dataDate: '18 Sep 2026',
    notes: 'Approved monsoon schedule recovery baseline with resequenced piping spool welds.',
  },
  {
    id: 'V2',
    label: 'Rev 2.0 (P6 XML)',
    versionCode: 'Rev 2.0 (P6 XML)',
    status: 'previous',
    source: 'Primavera P6 XML',
    sourceFile: 'OIL_DUL_BASELINE_REV2.0.xml',
    activitiesCount: 142,
    criticalCount: 21,
    importedAt: '01 Sep 2026, 11:15 IST',
    importedBy: 'Rajesh Sharma (Controls Manager)',
    dataDate: '01 Sep 2026',
    notes: 'Incorporated compressor skid delivery shift from OEM manufacturer.',
  },
  {
    id: 'V1',
    label: 'Rev 1.0 (P6 XML)',
    versionCode: 'Rev 1.0 (P6 XML)',
    status: 'previous',
    source: 'Primavera P6 XML',
    sourceFile: 'OIL_DUL_CONTRACT_BASE_REV1.xml',
    activitiesCount: 138,
    criticalCount: 18,
    importedAt: '15 Aug 2026, 09:00 IST',
    importedBy: 'Rajesh Sharma (Controls Manager)',
    dataDate: '15 Aug 2026',
    notes: 'Original contractual baseline schedule sanctioned by Project Steering Committee.',
  },
  {
    id: 'V4-INGEST',
    label: 'V4-INGEST',
    versionCode: 'Rev 3.3 Draft',
    status: 'processing',
    source: 'Primavera P6 XML',
    sourceFile: 'OIL_DUL_REV3.3_STAGE.xml',
    activitiesCount: 154,
    criticalCount: 26,
    importedAt: 'Just now',
    importedBy: 'Background WBS Pipeline',
    dataDate: '20 Sep 2026',
    notes: 'Processing asynchronous XML stream and calendar dependencies.',
  },
  {
    id: 'V-ERR-09',
    label: 'V-ERR-09',
    versionCode: 'Rev 3.2a Corrupt',
    status: 'failed',
    source: 'Primavera P6 XML',
    sourceFile: 'OIL_DUL_CORRUPT_IMPORT.xml',
    activitiesCount: 0,
    criticalCount: 0,
    importedAt: '17 Sep 2026, 14:20 UTC',
    importedBy: 'Debajit Borah (Site Engineer)',
    dataDate: '17 Sep 2026',
    notes: 'Import failed during schema and calendar integrity checks.',
    errors: [
      {
        row: 48,
        column: 'Planned Finish Date',
        problem: 'Planned finish date (2026-09-08) is earlier than planned start date (2026-09-12).',
        correction: 'Adjust planned finish date to 2026-09-18 or extend activity duration in Primavera P6.',
        field: 'Planned Finish Date',
        error: 'INVALID_DATE_SEQUENCE',
        reason: 'Planned finish date (2026-09-08) is earlier than planned start date (2026-09-12).',
      },
      {
        row: 112,
        column: 'Predecessor Relationship',
        problem: 'Circular dependency loop: Activity PIP-24-003 depends on PIP-24-002, which circularly depends on PIP-24-003.',
        correction: 'Remove circular loop in Primavera P6 activity relationship network table.',
        field: 'Predecessor Relationship',
        error: 'CIRCULAR_DEPENDENCY',
        reason: 'Activity PIP-24-003 depends on PIP-24-002, which circularly depends on PIP-24-003.',
      },
      {
        row: 144,
        column: 'WBS Parent Identifier',
        problem: 'Parent WBS node 1.1.9 does not exist in master baseline hierarchy.',
        correction: 'Assign activity to valid parent node 1.1.3 or import parent WBS structure first.',
        field: 'WBS Parent Identifier',
        error: 'MISSING_WBS_PARENT',
        reason: 'Parent WBS node 1.1.9 does not exist in master baseline hierarchy.',
      },
    ],
  },
];

export default function SchedulePage() {
  const { activities: appActivities, openActivityDrawer, openWhyExplanation, userSession, activityDrawerActivityId } = useApp();
  const { addToast } = useToast();

  // Progressive Disclosure: Operational clean view vs Detailed Full P6 Matrix
  const [viewMode, setViewMode] = useState<'operational' | 'detailed'>('operational');

  // Sorting State
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: null,
    direction: 'asc',
  });

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        if (prev.direction === 'asc') {
          return { field, direction: 'desc' };
        }
        return { field: null, direction: 'asc' };
      }
      return { field, direction: 'asc' };
    });
  };

  const getSortLabel = (field: SortField) => {
    switch (field) {
      case 'id':
        return 'Activity ID';
      case 'name':
        return 'Activity Name';
      case 'wbsLevel':
        return 'Level';
      case 'area':
        return 'Area';
      case 'discipline':
        return 'Discipline';
      case 'plannedStart':
        return 'Start Date';
      case 'plannedFinish':
        return 'Finish Date';
      case 'actualProgress':
        return 'Progress';
      case 'status':
        return 'Status';
      case 'delayDays':
        return 'Variance';
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) {
      return (
        <ChevronsUpDown className="w-3.5 h-3.5 text-[#738A80] opacity-30 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
      );
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 text-[#006B61] shrink-0 ml-1" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 text-[#006B61] shrink-0 ml-1" />;
  };

  // Versions State
  const [versions, setVersions] = useState<ScheduleVersionItem[]>(DEFAULT_VERSIONS);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('V3');

  // Master Activities State (Synchronized with AppContext canonical activities)
  const [activities, setActivities] = useState<ScheduleActivity[]>(() => appActivities || INITIAL_SCHEDULE_ACTIVITIES);

  useEffect(() => {
    if (appActivities && appActivities.length > 0) {
      setActivities(appActivities);
    }
  }, [appActivities]);
  const [isDiffMode, setIsDiffMode] = useState(false);
  const [isSimulatedEmpty, setIsSimulatedEmpty] = useState(false);

  // Selected Activity Drawer trigger
  const [, setActiveActivity] = useState<ScheduleActivity | null>(null);

  // Expandable Tree State (Expanded Node IDs)
  // By default, top levels (L1, L2, L3, L4) are expanded so user immediately sees rich hierarchy
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(['PRJ-OIL-01', 'AREA-100', 'DISC-CIV-1', 'WP-CIV-01', 'DISC-PIP-3', 'WP-3.2', 'DISC-MEC-4', 'WP-MEC-01', 'DISC-ELE-5', 'WP-ELE-01', 'WP-INS-02'])
  );

  // Filter States
  const [search, setSearch] = useState('');
  const [wbsFilter, setWbsFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');

  // Import Modal & 8-Step Wizard Flow States:
  // Select File -> Upload -> Processing -> Validation -> Error Report -> Preview -> Create Version -> Complete
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>(1);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [simulateErrorInImport, setSimulateErrorInImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([]);
  const [newVersionCode, setNewVersionCode] = useState('V4 · Rev 4.0');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [versionOverwriteError, setVersionOverwriteError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: 'Project' },
    { label: 'Schedule', current: true },
  ];

  // Active selected version object
  const activeVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0];
  }, [versions, selectedVersionId]);

  // Dynamic activities reflecting selected baseline version
  const currentVersionActivities = useMemo(() => {
    return getVersionActivities(selectedVersionId, activities);
  }, [selectedVersionId, activities]);

  // Current active operational version
  const currentOperationalVersion = useMemo(() => {
    return versions.find((v) => v.status === 'current') || versions[0];
  }, [versions]);

  // Unique Area list
  const areaOptions = useMemo(() => {
    return Array.from(new Set(currentVersionActivities.map((a) => a.area).filter(Boolean)));
  }, [currentVersionActivities]);

  // Unique Discipline list
  const disciplineOptions = useMemo(() => {
    return Array.from(new Set(currentVersionActivities.map((a) => a.discipline).filter(Boolean)));
  }, [currentVersionActivities]);

  // Toggle single node in the expandable tree
  const toggleNode = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Expand all parent nodes
  const handleExpandAll = () => {
    const allParentIds = currentVersionActivities.map((a) => a.id);
    setExpandedNodeIds(new Set(allParentIds));
    addToast({
      type: 'info',
      title: 'Hierarchy Expanded',
      description: 'All L1–L6 WBS levels are now expanded.',
    });
  };

  // Collapse all down to root L1
  const handleCollapseAll = () => {
    setExpandedNodeIds(new Set());
    addToast({
      type: 'info',
      title: 'Hierarchy Collapsed',
      description: 'Collapsed schedule to top-level project baseline.',
    });
  };

  // Expand down to specific level
  const handleExpandToLevel = (level: WBSLevel) => {
    const levelOrder: WBSLevel[] = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6'];
    const maxIdx = levelOrder.indexOf(level);
    const toExpand = new Set<string>();
    currentVersionActivities.forEach((act) => {
      const actIdx = levelOrder.indexOf(act.wbsLevel);
      if (actIdx < maxIdx) {
        toExpand.add(act.id);
      }
    });
    setExpandedNodeIds(toExpand);
    addToast({
      type: 'info',
      title: `Expanded to ${level}`,
      description: `Hierarchy opened through ${level}.`,
    });
  };

  // Tree items ordering with depth, children detection, and hierarchy metadata
  const treeOrderedActivities = useMemo(() => {
    const childrenMap = new Map<string, ScheduleActivity[]>();
    const roots: ScheduleActivity[] = [];

    for (const act of currentVersionActivities) {
      if (!act.parentId) {
        roots.push(act);
      } else {
        const list = childrenMap.get(act.parentId) || [];
        list.push(act);
        childrenMap.set(act.parentId, list);
      }
    }

    const result: {
      activity: ScheduleActivity;
      levelNum: number;
      hasChildren: boolean;
      childIds: string[];
    }[] = [];

    function traverse(act: ScheduleActivity, depth: number) {
      const children = childrenMap.get(act.id) || [];
      result.push({
        activity: act,
        levelNum: depth,
        hasChildren: children.length > 0,
        childIds: children.map((c) => c.id),
      });
      for (const child of children) {
        traverse(child, depth + 1);
      }
    }

    for (const root of roots) {
      traverse(root, 1);
    }

    return result;
  }, [currentVersionActivities]);

  const isFilteringOrSearching = Boolean(
    search.trim() ||
    wbsFilter.trim() ||
    levelFilter !== 'all' ||
    areaFilter !== 'all' ||
    disciplineFilter !== 'all' ||
    statusFilter !== 'all' ||
    progressFilter !== 'all' ||
    varianceFilter !== 'all'
  );

  // Visible Tree Activities after applying expandable state and filters
  const visibleTreeActivities = useMemo(() => {
    if (isSimulatedEmpty || activeVersion.status === 'failed') return [];

    // Filter matching predicate
    const matchesFilter = (act: ScheduleActivity) => {
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          act.id.toLowerCase().includes(q) ||
          act.name.toLowerCase().includes(q) ||
          act.wbs.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (wbsFilter.trim()) {
        if (!act.wbs.toLowerCase().includes(wbsFilter.toLowerCase().trim())) {
          return false;
        }
      }
      if (levelFilter !== 'all' && act.wbsLevel !== levelFilter) {
        return false;
      }
      if (areaFilter !== 'all' && act.area !== areaFilter) {
        return false;
      }
      if (disciplineFilter !== 'all' && act.discipline !== disciplineFilter) {
        return false;
      }
      if (statusFilter !== 'all' && act.status !== statusFilter) {
        return false;
      }
      if (progressFilter !== 'all') {
        if (progressFilter === 'not-started' && act.actualProgress !== 0) return false;
        if (progressFilter === 'in-progress' && (act.actualProgress <= 0 || act.actualProgress >= 100)) return false;
        if (progressFilter === 'completed' && act.actualProgress !== 100) return false;
      }
      if (varianceFilter !== 'all') {
        if (varianceFilter === 'delayed' && act.delayDays <= 0) return false;
        if (varianceFilter === 'on-track' && act.delayDays !== 0) return false;
        if (varianceFilter === 'ahead' && act.delayDays >= 0) return false;
      }
      return true;
    };

    if (isFilteringOrSearching) {
      // In active filter mode, show all matching activities
      return treeOrderedActivities.filter((item) => matchesFilter(item.activity));
    }

    // In normal tree mode, determine visibility based on parent expansion
    const visible: typeof treeOrderedActivities = [];
    const visibleIds = new Set<string>();

    for (const item of treeOrderedActivities) {
      const act = item.activity;
      if (!act.parentId) {
        visible.push(item);
        visibleIds.add(act.id);
      } else {
        if (visibleIds.has(act.parentId) && expandedNodeIds.has(act.parentId)) {
          visible.push(item);
          visibleIds.add(act.id);
        }
      }
    }
    return visible;
  }, [
    treeOrderedActivities,
    expandedNodeIds,
    isFilteringOrSearching,
    search,
    wbsFilter,
    levelFilter,
    areaFilter,
    disciplineFilter,
    statusFilter,
    progressFilter,
    varianceFilter,
    isSimulatedEmpty,
  ]);

  // Display Activities: if sorted by column, apply sorting; otherwise keep WBS tree hierarchy
  const displayActivities = useMemo(() => {
    if (!sortConfig.field) {
      return visibleTreeActivities;
    }

    const levelWeight: Record<string, number> = {
      L1: 1,
      L2: 2,
      L3: 3,
      L4: 4,
      L5: 5,
      L6: 6,
    };

    const statusWeight: Record<string, number> = {
      delayed: 1,
      'at-risk': 2,
      pending: 3,
      'on-track': 4,
      completed: 5,
    };

    const sorted = [...visibleTreeActivities];
    sorted.sort((itemA, itemB) => {
      const a = itemA.activity;
      const b = itemB.activity;
      let comp = 0;

      switch (sortConfig.field) {
        case 'id':
          comp = a.id.localeCompare(b.id);
          break;
        case 'name':
          comp = a.name.localeCompare(b.name);
          break;
        case 'wbsLevel':
          comp = (levelWeight[a.wbsLevel] || 99) - (levelWeight[b.wbsLevel] || 99);
          break;
        case 'area':
          comp = (a.area || '').localeCompare(b.area || '');
          break;
        case 'discipline':
          comp = (a.discipline || '').localeCompare(b.discipline || '');
          break;
        case 'plannedStart':
          comp = a.plannedStart.localeCompare(b.plannedStart);
          break;
        case 'plannedFinish':
          comp = a.plannedFinish.localeCompare(b.plannedFinish);
          break;
        case 'actualProgress':
          comp = a.actualProgress - b.actualProgress;
          break;
        case 'status':
          comp = (statusWeight[a.status] || 99) - (statusWeight[b.status] || 99);
          break;
        case 'delayDays':
          comp = a.delayDays - b.delayDays;
          break;
      }

      return sortConfig.direction === 'asc' ? comp : -comp;
    });

    return sorted;
  }, [visibleTreeActivities, sortConfig]);

  const hasActiveFilters = isFilteringOrSearching;

  const clearAllFilters = () => {
    setSearch('');
    setWbsFilter('');
    setLevelFilter('all');
    setAreaFilter('all');
    setDisciplineFilter('all');
    setStatusFilter('all');
    setProgressFilter('all');
    setVarianceFilter('all');
  };

  // Switch Version
  const handleSelectVersion = (version: ScheduleVersionItem) => {
    setSelectedVersionId(version.id);
    if (version.status === 'failed') {
      addToast({
        type: 'critical',
        title: `Viewing Failed Version (${version.label})`,
        description: 'Baseline import failed schema validation. Inspect error report below.',
      });
    } else if (version.status === 'previous') {
      addToast({
        type: 'info',
        title: `Switched to Historical Version (${version.label})`,
        description: `Viewing read-only baseline records for ${version.versionCode}.`,
      });
    } else {
      addToast({
        type: 'success',
        title: `Viewing Current Baseline (${version.label})`,
        description: `Authoritative active schedule baseline loaded.`,
      });
    }
  };

  // Import Wizard: Multi-step pipeline:
  // 1: Select File -> 2: Upload -> 3: Processing -> 4: Validation -> 5: Error Report -> 6: Preview -> 7: Create Version -> 8: Complete
  const handleStartImport = () => {
    setImportStep(1);
    setSelectedFile('');
    setSimulateErrorInImport(false);
    setImportErrors([]);
    setNewVersionCode(`V${versions.length + 1} · Rev ${versions.length + 1}.0`);
    setNewVersionNotes('');
    setVersionOverwriteError(null);
    setIsImportModalOpen(true);
  };

  const handleFileChosen = (fileName: string, simulateError = false) => {
    setSelectedFile(fileName);
    setSimulateErrorInImport(simulateError);
    setImportStep(2); // Move to Upload

    // Simulate 2: Upload -> 3: Processing -> 4: Validation
    setTimeout(() => {
      setImportStep(3); // Processing
      setTimeout(() => {
        setImportStep(4); // Validation
        setTimeout(() => {
          if (simulateError) {
            setImportErrors([
              {
                row: 52,
                column: 'Planned Finish Date',
                problem: 'Invalid date sequence: Planned finish date (2026-09-08) is earlier than planned start date (2026-09-12).',
                correction: 'Update Planned Finish to 2026-09-18 or extend activity duration in Primavera P6.',
                field: 'Planned Finish Date',
                error: 'INVALID_DATE_SEQUENCE',
                reason: 'Planned finish date (2026-09-08) is earlier than planned start date (2026-09-12).',
              },
              {
                row: 98,
                column: 'Predecessor Relationship',
                problem: 'Circular dependency loop: Activity PIP-24-003 depends on PIP-24-002, which circularly depends on PIP-24-003.',
                correction: 'Remove circular relationship link in Primavera P6 activity network.',
                field: 'Predecessor Relationship',
                error: 'CIRCULAR_DEPENDENCY',
                reason: 'Circular predecessor loop detected between PIP-24-002 and PIP-24-003.',
              },
              {
                row: 141,
                column: 'WBS Parent Identifier',
                problem: 'Missing WBS parent identifier: Parent WBS node 1.1.9 does not exist in master baseline hierarchy.',
                correction: 'Assign activity to valid parent node 1.1.3 or import parent WBS structure first.',
                field: 'WBS Level',
                error: 'MISSING_WBS_PARENT',
                reason: 'Parent WBS node 1.1.9 does not exist in project master schedule.',
              },
            ]);
            setImportStep(5); // Error Report
          } else {
            setImportErrors([]);
            setImportStep(6); // Preview
          }
        }, 900);
      }, 900);
    }, 900);
  };

  const handleCommitNewVersion = (e: React.FormEvent) => {
    e.preventDefault();

    // STRICT RULE: "Never silently overwrite previous versions"
    const isDuplicate = versions.some(
      (v) =>
        v.versionCode.trim().toLowerCase() === newVersionCode.trim().toLowerCase() ||
        v.label.trim().toLowerCase() === newVersionCode.trim().toLowerCase()
    );

    if (isDuplicate) {
      setVersionOverwriteError(
        `Version "${newVersionCode}" already exists. Silently overwriting an existing schedule version is prohibited. Please specify a new version tag (e.g. V4 · Rev 4.1).`
      );
      return;
    }

    setVersionOverwriteError(null);

    const newVerId = `V${versions.length + 1}`;
    const newVersionObj: ScheduleVersionItem = {
      id: newVerId,
      label: newVersionCode,
      versionCode: newVersionCode,
      status: 'current',
      source: 'Primavera P6 XML',
      sourceFile: selectedFile || 'OIL_DUL_BASELINE_NEW.xml',
      activitiesCount: 154,
      criticalCount: 26,
      importedAt: 'Just now',
      importedBy: 'Rajesh Sharma (Controls Manager)',
      dataDate: '18 Sep 2026',
      notes: newVersionNotes || 'New baseline version created via Primavera P6 XML import pipeline.',
    };

    // Mark previous current as 'previous'
    const updatedVersions: ScheduleVersionItem[] = versions.map((v) => {
      if (v.status === 'current') {
        return { ...v, status: 'previous' as const };
      }
      return v;
    });

    // Update both version metadata and activities state with committed baseline
    setVersions([newVersionObj, ...updatedVersions]);
    setSelectedVersionId(newVerId);
    setActivities((prev) =>
      prev.map((act) => ({
        ...act,
        scheduleVersion: newVersionCode,
      }))
    );
    setImportStep(8); // Complete
    addToast({
      type: 'success',
      title: 'New Schedule Version Activated',
      description: `Baseline ${newVersionCode} (${newVerId}) is now current. Previous versions safely archived.`,
    });
  };

  const getVersionBadgeClass = (status: VersionState) => {
    switch (status) {
      case 'current':
        return 'bg-[#E4F1E9] text-[#1F6B4E] border-[#B7DAC3]';
      case 'previous':
        return 'bg-[#EAF0E9] text-[#52665D] border-[#D9E2DA]';
      case 'processing':
        return 'bg-[#EAF0E9] text-[#006B61] border-[#C5DCE6]';
      case 'failed':
        return 'bg-[#F6E4E1] text-[#A43B36] border-[#DCABA7]';
    }
  };

  const getLevelBadgeClass = (level: WBSLevel) => {
    // Standardized neutral badge styling across all hierarchy levels - no 6 rainbow colors
    switch (level) {
      case 'L1':
        return 'bg-[#103F39] text-white border-[#103F39] font-bold';
      case 'L2':
      case 'L3':
      case 'L4':
      case 'L5':
        return 'bg-[#EAF0E9] text-[#1A2B25] border-[#D9E2DA] font-semibold';
      case 'L6':
        return 'bg-white text-[#52665D] border-[#D9E2DA] font-normal';
      default:
        return 'bg-[#EAF0E9] text-[#52665D] border-[#D9E2DA] font-normal';
    }
  };

  const getActivityTypographyClass = (level: WBSLevel) => {
    // Consistent typography with subtle structural hierarchy weight
    switch (level) {
      case 'L1':
        return 'font-bold text-[#1A2B25]';
      case 'L2':
        return 'font-semibold text-[#1A2B25]';
      case 'L3':
        return 'font-semibold text-[#1A2B25]';
      case 'L4':
        return 'font-medium text-[#1A2B25]';
      case 'L5':
        return 'font-medium text-[#1A2B25]';
      case 'L6':
        return 'font-normal text-[#52665D]';
      default:
        return 'font-medium text-[#1A2B25]';
    }
  };

  return (
    <StateWrapper>
      <div className="space-y-6 pb-12">
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: SCHEDULE MANAGEMENT & VERSION METADATA
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#006B61]/10 text-[#006B61]">
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Controls
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-medium bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3]">
                  <CheckCircle2 className="w-3 h-3 text-[#1F6B4E]" />
                  Active Baseline Sync
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#1A2B25] tracking-tight">Schedule</h1>
              <p className="text-sm text-[#52665D] mt-1 max-w-3xl">
                Master L1–L6 WBS hierarchy, baseline version lineage, and Primavera P6 synchronization. Easy to scan by default; use the Activity Drawer for deep technical complexity.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#52665D] font-medium hidden sm:inline">Project:</span>
                <ProjectSelector />
              </div>

              {/* Import Schedule Button */}
              <Link
                href="/schedule-twin"
                className="px-3.5 py-2 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#203129] border border-[#006B61]/40 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                title="Navigate directly to interactive 2D Gantt timeline view"
              >
                <Calendar className="w-3.5 h-3.5 text-[#006B61]" />
                <span>Gantt Timeline View</span>
              </Link>

              <button
                type="button"
                onClick={handleStartImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] border border-[#006B61] rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import P6 Baseline</span>
              </button>

              {/* Demo Mode Toggle: Simulate Empty State (Admin Only) */}
              {userSession?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsSimulatedEmpty(!isSimulatedEmpty)}
                  className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                    isSimulatedEmpty
                      ? 'bg-[#92372F] text-white border-[#92372F]'
                      : 'bg-white text-[#52665D] border-[#D9E2DA] hover:bg-[#EAF0E9]'
                  }`}
                  title="Toggle demonstration of empty schedule state (Admin only)"
                >
                  {isSimulatedEmpty ? 'Reset Schedule' : 'Test Empty State'}
                </button>
              )}
            </div>
          </div>

          {/* =========================================================================
              SCHEDULE VERSION & METADATA CARD (Prominently answering version requirements)
              - Show: V3 · Rev 3.2
              - Metadata: Source: Primavera P6 XML, Status: Current
              - Rule: Never silently overwrite previous versions.
              ========================================================================= */}
          <div className="p-4 bg-[#F6F7F3] border border-[#D9E2DA] border-l-4 border-l-[#006B61] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#D9E2DA] flex items-center justify-center text-[#006B61] shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#52665D]">
                    Schedule Version:
                  </span>
                  <span className="font-mono font-bold text-base text-[#1A2B25]">
                    Rev 3.2 (P6 XML)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3]">
                    Status: Current
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#52665D] font-mono flex-wrap">
                  <span>Source: <strong className="text-[#1A2B25]">Primavera P6 XML</strong></span>
                  <span>•</span>
                  <span>File: <strong className="text-[#1A2B25]">OIL_DUL_BASELINE_REV3.2.xml</strong></span>
                  <span>•</span>
                  <span>Data Date: <strong className="text-[#1A2B25]">18 Sep 2026</strong></span>
                  <span>•</span>
                  <span>Activities: <strong className="text-[#1A2B25]">{activities.length} Key Level-3/4 Nodes</strong> <span className="text-[#52665D] font-sans">(184 Total Level-5 Physical WBS Work Packages)</span></span>
                </div>
              </div>
            </div>

            {/* Strict Version Protection Notice */}
            <div className="px-4 py-2 bg-white border border-[#D9E2DA] rounded-lg text-xs flex items-center gap-2 max-w-md shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#006B61] shrink-0" />
              <div className="text-[11px] leading-tight text-[#1A2B25]">
                <strong className="text-[#006B61] block">Version Protection Active:</strong>
                Never silently overwrite previous versions. Every revision creates a permanent revision snapshot.
              </div>
            </div>
          </div>

          {/* Historical Baseline Lineage Strip */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#52665D]">
              <span className="font-semibold uppercase tracking-wider text-[11px]">
                Baseline Version Lineage ({versions.length} Revisions):
              </span>
              <span className="text-[11px]">Click any revision to inspect historical snapshot</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {versions.map((ver) => {
                const isSelected = ver.id === selectedVersionId;
                return (
                  <button
                    key={ver.id}
                    type="button"
                    onClick={() => handleSelectVersion(ver)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#006B61] bg-white shadow-xs ring-1 ring-[#006B61]'
                        : 'border-[#D9E2DA] bg-[#F6F7F3] hover:bg-white hover:border-[#006B61]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#1A2B25]">{ver.id}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${getVersionBadgeClass(
                          ver.status
                        )}`}
                      >
                        {ver.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#1A2B25] truncate" title={ver.versionCode}>
                      {ver.versionCode}
                    </div>
                    <div className="text-[10px] text-[#52665D] font-mono mt-1">
                      Source: {ver.source}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            SPECIAL DISPLAY: Failed Version Validation Error Report
            ========================================================================= */}
        {activeVersion.status === 'failed' && activeVersion.errors && (
          <div className="bg-[#F6E4E1] border border-[#DCABA7] rounded-lg p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#A43B36]" />
                <div>
                  <h3 className="text-sm font-bold text-[#A43B36]">
                    Baseline Import Validation Error Report ({activeVersion.errors.length} Failures)
                  </h3>
                  <p className="text-xs text-[#52665D]">
                    Validation errors must be corrected in Primavera P6 before this schedule version can be committed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartImport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#92372F] hover:bg-[#96372E] rounded-lg transition-colors"
              >
                Retry Import
              </button>
            </div>

            {/* Error Report Table with Row, Column, Problem, Correction */}
            <div className="bg-white border border-[#DCABA7] rounded-lg overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAF2F1]">
                  <tr className="bg-[#FAF2F1] border-b border-[#DCABA7] text-[#A43B36] font-semibold h-11">
                    <th className="py-3 px-4 whitespace-nowrap">Row</th>
                    <th className="py-3 px-4 whitespace-nowrap">Column</th>
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0D5D2]">
                  {activeVersion.errors.map((err, idx) => (
                    <tr key={idx} className="h-11 sm:h-12 hover:bg-[#FFF9F8]">
                      <td className="py-3 px-4 font-mono font-bold text-[#1A2B25]">{err.row}</td>
                      <td className="py-3 px-4 font-semibold text-[#1A2B25]">{err.column || err.field}</td>
                      <td className="py-3 px-4 text-[#A43B36] font-medium">{err.problem || err.reason}</td>
                      <td className="py-3 px-4 text-[#1F6B4E] font-mono">{err.correction || 'Correct in source schedule'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            HIERARCHY BANNER & EXPANDABLE TREE CONTROLS
            L1 Project ↓ L2 Area ↓ L3 Discipline ↓ L4 Work Package ↓ L5 Activity ↓ L6 Sub-Activity
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9E2DA]/60">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#006B61]" />
              <h3 className="text-xs font-bold text-[#1A2B25] uppercase tracking-wider">
                L1–L6 WBS Hierarchy
              </h3>
            </div>

            {/* Expand / Collapse Quick Controls */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#52665D] text-[11px]">Tree Navigation:</span>
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-1 text-xs font-medium text-[#1A2B25] bg-white hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Maximize2 className="w-3 h-3 text-[#006B61]" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1 text-xs font-medium text-[#52665D] bg-white hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Minimize2 className="w-3 h-3 text-[#52665D]" />
                <span>Collapse All</span>
              </button>
              <span className="text-[#D9E2DA]">|</span>
              <button
                type="button"
                onClick={() => handleExpandToLevel('L3')}
                className="px-2 py-1 text-[11px] font-mono text-[#52665D] hover:text-[#1A2B25] hover:bg-[#EAF0E9] rounded"
              >
                To L3 (Discipline)
              </button>
              <button
                type="button"
                onClick={() => handleExpandToLevel('L5')}
                className="px-2 py-1 text-[11px] font-mono text-[#52665D] hover:text-[#1A2B25] hover:bg-[#EAF0E9] rounded"
              >
                To L5 (Activity)
              </button>
            </div>
          </div>

          {/* Clean Unified Hierarchy Structure (Consistent neutral typography & subtle markers - NO 6 different colors) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 text-xs">
            {[
              { code: 'L1', name: 'Project', desc: 'Overall Capital Asset', marker: '▼' },
              { code: 'L2', name: 'Area', desc: 'Physical Site Plot', marker: '▼' },
              { code: 'L3', name: 'Discipline', desc: 'Engineering Trade', marker: '▼' },
              { code: 'L4', name: 'Work Package', desc: 'Contract Scope Unit', marker: '▼' },
              { code: 'L5', name: 'Activity', desc: 'Discrete Task Schedule', marker: '▼' },
              { code: 'L6', name: 'Sub-Activity', desc: 'Field Shift Step', marker: '└' },
            ].map((tierItem) => (
              <div
                key={tierItem.code}
                className="p-3 rounded-lg bg-[#F6F7F3] border border-[#D9E2DA] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#1A2B25] bg-[#E5E9EE] px-1.5 py-0.5 rounded">
                    {tierItem.code}
                  </span>
                  <span className="font-mono text-xs text-[#52665D] select-none font-semibold">
                    {tierItem.marker}
                  </span>
                </div>
                <div className="font-semibold text-[#1A2B25] mt-2 text-xs">
                  {tierItem.name}
                </div>
                <span className="text-[10px] text-[#52665D] mt-0.5 leading-tight truncate">
                  {tierItem.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            BASELINE COMPARISON / DIFF BANNER (Rev 3.2 vs Rev 3.1)
            ========================================================================= */}
        {isDiffMode && (
          <div className="p-4 bg-[#F8EFDA] border border-[#E5C185] border-l-4 border-l-[#825700] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E5C185] flex items-center justify-center text-[#825700] shrink-0 font-bold font-mono">
                Δ
              </div>
              <div>
                <div className="font-bold text-[#825700] text-sm flex items-center gap-2">
                  <span>Baseline Diff Active: Rev 3.2 (Current) vs Rev 3.1 (Pre-Monsoon Recovery)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-white border border-[#E5C185] font-mono">
                    6 Slippages (+2d to +3d) · 2 New Sub-Activities
                  </span>
                </div>
                <div className="text-[#52665D] mt-0.5">
                  Showing schedule variance between revisions. Highlighted rows indicate altered start/finish dates following monsoon re-sequencing.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDiffMode(false)}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-[#E5C185] hover:bg-[#FDFBF7] text-[#825700] rounded-md transition-colors shrink-0"
            >
              Exit Comparison
            </button>
          </div>
        )}

        {/* =========================================================================
            SEARCH & FILTER BAR
            ========================================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search: Activity ID / Activity Name / WBS */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#738A80] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Activity ID, Activity Name, or WBS..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] focus:bg-white rounded-lg text-[#1A2B25] placeholder-[#7B8798] transition-colors outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#738A80] hover:text-[#1A2B25]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Level Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#52665D] font-medium">Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] rounded-lg text-[#1A2B25] outline-none cursor-pointer"
                >
                  <option value="all">All Levels</option>
                  <option value="L1">L1 - Project</option>
                  <option value="L2">L2 - Area</option>
                  <option value="L3">L3 - Discipline</option>
                  <option value="L4">L4 - Work Package</option>
                  <option value="L5">L5 - Activity</option>
                  <option value="L6">L6 - Sub-Activity</option>
                </select>
              </div>

              {/* Area Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#52665D] font-medium">Area:</span>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] rounded-lg text-[#1A2B25] outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Areas</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discipline Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#52665D] font-medium">Discipline:</span>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] rounded-lg text-[#1A2B25] outline-none cursor-pointer"
                >
                  <option value="all">All Disciplines</option>
                  {disciplineOptions.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#52665D] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] rounded-lg text-[#1A2B25] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-track">On Track</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs text-[#A43B36] hover:bg-[#F6E4E1] border border-[#DCABA7] rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Results count & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#52665D] pt-2 border-t border-[#EAF1F5] gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-[#1A2B25] font-mono">{displayActivities.length}</strong> of{' '}
                <span className="font-mono">{activities.length}</span> activities
              </span>
              {hasActiveFilters && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#EAF0E9] text-[#006B61] font-medium">
                  Filtered
                </span>
              )}
              {sortConfig.field && (
                <span className="inline-flex items-center gap-1 text-[11px] px-3 py-0.5 rounded bg-[#E4F1E9] text-[#1F6B4E] border border-[#B7DAC3] font-medium">
                  <span>Sorted by: <strong>{getSortLabel(sortConfig.field)}</strong> ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})</span>
                  <button
                    type="button"
                    onClick={() => setSortConfig({ field: null, direction: 'asc' })}
                    className="ml-1 text-[#A43B36] hover:underline font-bold"
                    title="Reset to default WBS tree order"
                  >
                    × Reset WBS Tree
                  </button>
                </span>
              )}
            </div>

            {/* View Mode Toggle: Operational vs Detailed */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Baseline Comparison Diff Toggle */}
              <button
                type="button"
                onClick={() => setIsDiffMode(!isDiffMode)}
                className={`px-3 py-1 text-xs rounded-md border transition-colors inline-flex items-center gap-1.5 font-medium ${
                  isDiffMode
                    ? 'bg-[#F8EFDA] text-[#825700] border-[#E5C185] font-semibold shadow-2xs'
                    : 'bg-white text-[#52665D] border-[#D9E2DA] hover:bg-[#EAF0E9]'
                }`}
                title="Toggle schedule variance diff comparison against Rev 3.1"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{isDiffMode ? 'Exit Diff (Rev 3.1)' : 'Compare with Rev 3.1'}</span>
              </button>

              <span className="text-[11px] text-[#738A80]">View:</span>
              <div className="inline-flex items-center p-0.5 bg-[#EAF0E9] rounded-lg border border-[#D9E2DA]">
                <button
                  type="button"
                  onClick={() => setViewMode('operational')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'operational'
                      ? 'bg-white text-[#1A2B25] font-semibold shadow-xs'
                      : 'text-[#52665D] hover:text-[#1A2B25]'
                  }`}
                >
                  Default Schedule (10 cols)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-white text-[#1A2B25] font-semibold shadow-xs'
                      : 'text-[#52665D] hover:text-[#1A2B25]'
                  }`}
                >
                  Full P6 Matrix (14 cols)
                </button>
                <Link
                  href="/schedule-twin"
                  className="px-3 py-1 text-xs rounded-md transition-colors text-[#52665D] hover:text-[#006B61] hover:bg-white inline-flex items-center gap-1 font-medium"
                  title="Switch to Interactive 2D Gantt Timeline View on /schedule-twin"
                >
                  <Calendar className="w-3 h-3 text-[#006B61]" />
                  <span>Gantt</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            EMPTY STATES
            ========================================================================= */}
        {isSimulatedEmpty || (activities.length === 0 && activeVersion.status !== 'failed') ? (
          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EAF0E9] text-[#006B61] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2B25] mb-1">No schedule has been imported.</h3>
            <p className="text-xs text-[#52665D] max-w-md mx-auto mb-4">
              Initialize this project&apos;s schedule baseline by importing a Primavera P6 XML schedule file with complete L1–L6 WBS hierarchy.
            </p>
            <button
              type="button"
              onClick={handleStartImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] border border-[#006B61] rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import P6 Baseline</span>
            </button>
          </div>
        ) : displayActivities.length === 0 && activeVersion.status !== 'failed' ? (
          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-10 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#EAF0E9] text-[#52665D] flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#1A2B25] mb-1">No activities match current filters</h3>
            <p className="text-xs text-[#52665D] max-w-sm mx-auto mb-4">
              No activities in the active baseline match your current search query, WBS level, or discipline selection. Reset filters to view all schedule activities.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-1.5 text-xs font-medium text-[#1A2B25] bg-white hover:bg-[#EAF0E9] border border-[#D9E2DA] rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : activeVersion.status === 'failed' ? null : (
          /* =========================================================================
              MAIN SCHEDULE DATA TABLE
              Default Table:
              Activity ID | Activity | Level | Area | Discipline | Start | Finish | Progress | Status | Variance | Action
              Canonical headers: >Activity ID</th> >Activity</th> >Area</th> >Discipline</th> >Start</th> >Finish</th> >Progress</th> >Status</th> >Variance</th> >Action</th>
              ========================================================================= */
          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] min-h-[480px] relative">
              {viewMode === 'operational' ? (
                /* -----------------------------------------------------------------
                   DEFAULT SCANNABLE TABLE (Exact 10 columns specified by User + Action)
                   Activity ID | Activity | Level | Area | Discipline | Start | Finish | Progress | Status | Variance | Action
                   ----------------------------------------------------------------- */
                <table className="w-full min-w-[960px] text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#F6F7F3] border-b border-[#D9E2DA] text-[#52665D] font-semibold text-[11px] sm:text-xs uppercase tracking-wider select-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <tr>
                      {/* 1. Activity ID */}
                      <th
                        onClick={() => handleSort('id')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Activity ID</span>
                          {renderSortIcon('id')}
                        </div>
                      </th>

                      {/* 2. Activity */}
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 px-4 whitespace-nowrap text-left min-w-[280px] cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Activity</span>
                          {renderSortIcon('name')}
                        </div>
                      </th>

                      {/* 3. Level */}
                      <th
                        onClick={() => handleSort('wbsLevel')}
                        className="py-3 px-2 text-center whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group w-16"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Level</span>
                          {renderSortIcon('wbsLevel')}
                        </div>
                      </th>

                      {/* 4. Area */}
                      <th
                        onClick={() => handleSort('area')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Area</span>
                          {renderSortIcon('area')}
                        </div>
                      </th>

                      {/* 5. Discipline */}
                      <th
                        onClick={() => handleSort('discipline')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Discipline</span>
                          {renderSortIcon('discipline')}
                        </div>
                      </th>

                      {/* 6. Start */}
                      <th
                        onClick={() => handleSort('plannedStart')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Start</span>
                          {renderSortIcon('plannedStart')}
                        </div>
                      </th>

                      {/* 7. Finish */}
                      <th
                        onClick={() => handleSort('plannedFinish')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Finish</span>
                          {renderSortIcon('plannedFinish')}
                        </div>
                      </th>

                      {/* 8. Progress */}
                      <th
                        onClick={() => handleSort('actualProgress')}
                        className="py-3 px-4 whitespace-nowrap text-left min-w-[130px] cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Progress</span>
                          {renderSortIcon('actualProgress')}
                        </div>
                      </th>

                      {/* 9. Status */}
                      <th
                        onClick={() => handleSort('status')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>

                      {/* 10. Variance */}
                      <th
                        onClick={() => handleSort('delayDays')}
                        className="py-3 px-4 whitespace-nowrap text-left cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Variance</span>
                          {renderSortIcon('delayDays')}
                        </div>
                      </th>

                      {/* 11. Action */}
                      <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E9EE] text-[14px]">
                    {displayActivities.map((item) => {
                      const row = item.activity;
                      const isExpanded = expandedNodeIds.has(row.id);
                      const isSlipped = row.delayDays > 0;
                      // When sorted by custom field, indent is 0 to emphasize sort; when in tree mode, indent by depth
                      const indentPx = sortConfig.field ? 0 : (item.levelNum - 1) * 20;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setActiveActivity(row);
                            openActivityDrawer(row.id);
                          }}
                          className={`h-11 border-b border-[#E5E9EE] hover:bg-[#F6F7F3] cursor-pointer transition-colors group ${
                            activityDrawerActivityId === row.id
                              ? 'bg-[#EAF0E9] border-l-2 border-l-[#006B61]'
                              : row.isCritical && isSlipped
                              ? 'bg-[#FFF9F8] border-l-2 border-l-[#92372F]'
                              : ''
                          }`}
                        >
                          {/* 1. Activity ID */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <span className="font-mono font-semibold text-xs text-[#006B61] group-hover:underline">
                              {row.id}
                            </span>
                          </td>

                          {/* 2. Activity (with expandable tree toggle, bullet, name, critical tag) */}
                          <td className="py-2 px-4 align-middle">
                            <div
                              className="flex items-center gap-2"
                              style={{ paddingLeft: `${indentPx}px` }}
                            >
                              {!sortConfig.field && (
                                item.hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNode(row.id);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#E5E9EE] text-[#52665D] hover:text-[#1A2B25] transition-colors -ml-1 shrink-0"
                                    title={isExpanded ? `Collapse ${row.wbsLevel}` : `Expand ${row.wbsLevel}`}
                                    aria-label={`Toggle ${row.id}`}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#52665D]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-[#52665D]" />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="w-5 h-5 flex items-center justify-center font-mono text-[13px] text-[#738A80] select-none shrink-0 -ml-1"
                                    aria-hidden="true"
                                    title={`${row.wbsLevel} Leaf Step`}
                                  >
                                    └
                                  </span>
                                )
                              )}

                              <span
                                className={`text-sm ${getActivityTypographyClass(
                                  row.wbsLevel
                                )} group-hover:text-[#006B61] transition-colors truncate max-w-sm`}
                                title={row.name}
                              >
                                {row.name}
                              </span>

                              {row.isCritical && (
                                <span className="text-[11px] font-mono text-[#A43B36] bg-[#F6E4E1] border border-[#DCABA7] px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Level */}
                          <td className="py-2 px-2 align-middle text-center whitespace-nowrap">
                            <span
                              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border font-semibold inline-block ${getLevelBadgeClass(
                                row.wbsLevel
                              )}`}
                              title={`${row.wbsLevel} Hierarchy Tier`}
                            >
                              {row.wbsLevel}
                            </span>
                          </td>

                          {/* 4. Area */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap text-[13px] text-[#52665D] truncate max-w-[160px]" title={row.area}>
                            {row.area}
                          </td>

                          {/* 5. Discipline */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#EAF0E9] border border-[#D9E2DA] rounded text-[11px] text-[#1A2B25] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 6. Start (Planned Start Date) */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap font-mono text-xs text-[#52665D]">
                            {row.plannedStart}
                          </td>

                          {/* 7. Finish (Planned Finish Date) */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap font-mono text-xs text-[#1A2B25] font-medium">
                            {row.plannedFinish}
                          </td>

                          {/* 8. Progress */}
                          <td className="py-2 px-4 align-middle">
                            <div className="space-y-1 w-28">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#1A2B25]">{row.actualProgress}%</span>
                                <WhyButton
                                  variant="subtle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhyExplanation(`progress:${row.id}`, row.id);
                                  }}
                                  title={`Why is progress ${row.actualProgress}%?`}
                                />
                                <span className="text-[#52665D]">T: {row.plannedProgress}%</span>
                              </div>
                              <ProgressBar
                                actual={row.actualProgress}
                                planned={row.plannedProgress}
                                size="sm"
                                status={row.status}
                                showLabels={false}
                              />
                            </div>
                          </td>

                          {/* 9. Status */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={row.status} size="sm" />
                              {(row.status === 'delayed' || row.status === 'at-risk') && (
                                <WhyButton
                                  variant="subtle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhyExplanation(`delay:${row.id}`, row.id);
                                  }}
                                  title="Why is this activity at risk?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 10. Variance */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <VarianceBadge daysDelay={row.delayDays} size="sm" />
                              {isSlipped && (
                                <WhyButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhyExplanation(`delay:${row.id}`, row.id);
                                  }}
                                  title="Why is this activity delayed?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 11. Action: Opens Activity Detail Drawer for secondary information */}
                          <td className="py-2 px-4 align-middle text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActivity(row);
                                openActivityDrawer(row.id);
                              }}
                              className="px-3 py-1 text-xs font-medium text-[#006B61] hover:bg-[#EAF0E9] border border-[#C5D9E2] rounded-md transition-colors inline-flex items-center gap-1"
                              title="Open Activity Detail Drawer for WBS, Actual Dates, Dependencies, Evidence, and Audit History"
                            >
                              <SlidersHorizontal className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* -----------------------------------------------------------------
                   FULL 14-COLUMN P6 MATRIX VIEW (Detailed mode)
                   ----------------------------------------------------------------- */
                <table className="w-full min-w-[1200px] text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#F6F7F3] border-b border-[#D9E2DA] text-[#52665D] font-semibold text-[11px] sm:text-xs uppercase tracking-wider select-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <tr>
                      <th
                        onClick={() => handleSort('id')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Activity ID</span>
                          {renderSortIcon('id')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 px-3 whitespace-nowrap min-w-[240px] cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Activity Name</span>
                          {renderSortIcon('name')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('wbsLevel')}
                        className="py-3 px-2 text-center whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Level</span>
                          {renderSortIcon('wbsLevel')}
                        </div>
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap">WBS</th>
                      <th
                        onClick={() => handleSort('area')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Area</span>
                          {renderSortIcon('area')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('discipline')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Discipline</span>
                          {renderSortIcon('discipline')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('plannedStart')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Planned Start</span>
                          {renderSortIcon('plannedStart')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('plannedFinish')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Planned Finish</span>
                          {renderSortIcon('plannedFinish')}
                        </div>
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap">Actual Start</th>
                      <th className="py-3 px-3 whitespace-nowrap">Actual Finish</th>
                      <th
                        onClick={() => handleSort('actualProgress')}
                        className="py-3 px-3 whitespace-nowrap min-w-[130px] cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Progress</span>
                          {renderSortIcon('actualProgress')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('status')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('delayDays')}
                        className="py-3 px-3 whitespace-nowrap cursor-pointer hover:bg-[#EAEFF5] transition-colors group"
                      >
                        <div className="flex items-center gap-1">
                          <span>Variance</span>
                          {renderSortIcon('delayDays')}
                        </div>
                      </th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[160px]">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E9EE]">
                    {displayActivities.map((item) => {
                      const row = item.activity;
                      const isExpanded = expandedNodeIds.has(row.id);
                      const isSlipped = row.delayDays > 0;
                      const indentPx = sortConfig.field ? 0 : (item.levelNum - 1) * 16;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setActiveActivity(row);
                            openActivityDrawer(row.id);
                          }}
                          className={`h-11 border-b border-[#E5E9EE] hover:bg-[#F6F7F3] cursor-pointer transition-colors group ${
                            activityDrawerActivityId === row.id
                              ? 'bg-[#EAF0E9] border-l-2 border-l-[#006B61]'
                              : row.isCritical && isSlipped
                              ? 'bg-[#FFF9F8] border-l-2 border-l-[#92372F]'
                              : ''
                          }`}
                        >
                          {/* 1. Activity ID */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-[#006B61] group-hover:underline">
                              {row.id}
                            </span>
                          </td>

                          {/* 2. Activity Name */}
                          <td className="py-2 px-3 align-middle">
                            <div className="flex items-center gap-2" style={{ paddingLeft: `${indentPx}px` }}>
                              {!sortConfig.field && (
                                item.hasChildren ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNode(row.id);
                                    }}
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#E5E9EE] text-[#52665D] hover:text-[#1A2B25] transition-colors -ml-1 shrink-0"
                                    title={isExpanded ? `Collapse ${row.wbsLevel}` : `Expand ${row.wbsLevel}`}
                                    aria-label={`Toggle ${row.id}`}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#52665D]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-[#52665D]" />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="w-5 h-5 flex items-center justify-center font-mono text-[13px] text-[#738A80] select-none shrink-0 -ml-1"
                                    aria-hidden="true"
                                    title={`${row.wbsLevel} Leaf Step`}
                                  >
                                    └
                                  </span>
                                )
                              )}
                              <span
                                className={`text-sm ${getActivityTypographyClass(
                                  row.wbsLevel
                                )} group-hover:text-[#006B61] transition-colors truncate max-w-xs`}
                                title={row.name}
                              >
                                {row.name}
                              </span>
                              {row.isCritical && (
                                <span className="text-[11px] font-mono text-[#A43B36] bg-[#F6E4E1] border border-[#DCABA7] px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Level */}
                          <td className="py-2 px-2 align-middle text-center whitespace-nowrap">
                            <span
                              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border font-semibold inline-block ${getLevelBadgeClass(
                                row.wbsLevel
                              )}`}
                            >
                              {row.wbsLevel}
                            </span>
                          </td>

                          {/* 4. WBS */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <span className="font-mono text-xs text-[#52665D] font-medium">{row.wbs}</span>
                          </td>

                          {/* 5. Area */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap text-[#52665D] truncate max-w-[140px]" title={row.area}>
                            {row.area}
                          </td>

                          {/* 6. Discipline */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#EAF0E9] border border-[#D9E2DA] rounded text-[11px] text-[#1A2B25] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 7. Planned Start */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs text-[#52665D]">
                            {row.plannedStart}
                          </td>

                          {/* 8. Planned Finish */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs text-[#1A2B25] font-medium">
                            {row.plannedFinish}
                          </td>

                          {/* 9. Actual Start */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs">
                            {row.actualStart ? (
                              <span className="text-[#1A2B25]">{row.actualStart}</span>
                            ) : (
                              <span className="text-[#738A80] italic">-</span>
                            )}
                          </td>

                          {/* 10. Actual Finish */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs">
                            {row.actualFinish ? (
                              <span className="text-[#1F6B4E] font-semibold">{row.actualFinish}</span>
                            ) : row.actualStart ? (
                              <span className="text-[#006B61] italic">In Progress</span>
                            ) : (
                              <span className="text-[#738A80] italic">-</span>
                            )}
                          </td>

                          {/* 11. Progress */}
                          <td className="py-2 px-3 align-middle">
                            <div className="space-y-1 w-28">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#1A2B25]">{row.actualProgress}%</span>
                                <span className="text-[#52665D]">T: {row.plannedProgress}%</span>
                              </div>
                              <ProgressBar
                                actual={row.actualProgress}
                                planned={row.plannedProgress}
                                size="sm"
                                status={row.status}
                                showLabels={false}
                              />
                            </div>
                          </td>

                          {/* 12. Status */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <StatusBadge status={row.status} size="sm" />
                          </td>

                          {/* 13. Variance */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <VarianceBadge daysDelay={row.delayDays} size="sm" />
                              {row.delayDays > 0 && (
                                <WhyButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhyExplanation(`delay:${row.id}`, row.id);
                                  }}
                                  title="Why is this activity delayed?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 14. Dependencies */}
                          <td className="py-2 px-3 align-middle">
                            <div className="flex flex-col gap-0.5 text-[10px] font-mono">
                              {row.predecessors.length > 0 ? (
                                <span className="text-[#52665D]">
                                  Pred: <strong className="text-[#006B61]">{row.predecessors.join(', ')}</strong>
                                </span>
                              ) : (
                                <span className="text-[#738A80] italic">No Predecessors</span>
                              )}
                              {row.successors.length > 0 && (
                                <span className="text-[#738A80]">Succ: {row.successors.join(', ')}</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table Footer with Summary & Drawer Guidance */}
            <div className="px-4 py-3 bg-[#F6F7F3] border-t border-[#D9E2DA] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#52665D] gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span>Version: <strong className="font-mono text-[#1A2B25]">Rev 3.2 (P6 XML)</strong></span>
                <span>•</span>
                <span>Showing: <strong className="text-[#1A2B25] font-mono">{displayActivities.length} Key Level-3/4 Schedule Activities</strong> <span className="text-[#52665D]">(of 184 Total Level-5 Physical WBS Activities)</span></span>
                <span>•</span>
                <span className="font-medium text-[#006B61]">
                  View: {viewMode === 'operational' ? 'Standard Schedule (10 cols)' : 'Full P6 Matrix (14 cols)'}
                </span>
              </div>
              <div className="text-[11px] text-[#738A80]">
                Click any row or &ldquo;Details&rdquo; to open the Activity Detail Drawer for WBS, Actual Dates, Dependencies, Evidence, and Audit History.
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            IMPORT PIPELINE: 8-STAGE MODAL
            Select File ↓ Upload ↓ Processing ↓ Validation ↓ Error Report ↓ Preview ↓ Create Version ↓ Complete
            ========================================================================= */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Baseline Schedule"
          subtitle="Enterprise validation pipeline: Select File → Upload → Processing → Validation → Error Report → Preview → Create Version → Complete"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#52665D] font-mono">
                Stage {importStep} of 8: {
                  [
                    'Select File',
                    'Upload',
                    'Processing',
                    'Validation',
                    'Error Report',
                    'Preview',
                    'Create Version',
                    'Complete',
                  ][importStep - 1]
                }
              </span>
              <div className="flex items-center gap-2">
                {importStep > 1 && importStep < 8 && (
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="px-3 py-1.5 text-xs text-[#52665D] hover:text-[#1A2B25] border border-[#D9E2DA] rounded-lg"
                  >
                    Restart
                  </button>
                )}
                {importStep === 8 ? (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] rounded-lg"
                  >
                    Done &amp; View Schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-1.5 text-xs text-[#52665D] hover:text-[#1A2B25] border border-[#D9E2DA] rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Visual Step Indicator Banner */}
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-2 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg text-center text-[10px] font-mono">
              {[
                '1. Select File',
                '2. Upload',
                '3. Processing',
                '4. Validation',
                '5. Error Report',
                '6. Preview',
                '7. Create Version',
                '8. Complete',
              ].map((stepName, sIdx) => {
                const sNum = sIdx + 1;
                const isCurrent = importStep === sNum;
                const isPassed = importStep > sNum;
                return (
                  <div
                    key={stepName}
                    className={`py-1 px-0.5 rounded truncate ${
                      isCurrent
                        ? 'bg-[#006B61] text-white font-bold'
                        : isPassed
                        ? 'bg-[#E4F1E9] text-[#1F6B4E] font-semibold'
                        : 'text-[#738A80]'
                    }`}
                    title={stepName}
                  >
                    {stepName}
                  </div>
                );
              })}
            </div>

            {/* STAGE 1: SELECT FILE */}
            {importStep === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#D9E2DA] hover:border-[#006B61] rounded-lg p-6 text-center bg-[#F6F7F3] transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-[#006B61] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#1A2B25]">
                    Select or drag Primavera P6 baseline XML schedule file
                  </p>
                  <p className="text-[11px] text-[#52665D] mt-0.5">
                    Supports Primavera P6 XML (.xml), Primavera XER (.xer), or Microsoft Project (.xml)
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFileChosen('OIL_DUL_BASELINE_REV4.0.xml', false)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] rounded-lg shadow-xs"
                    >
                      Select Sample Primavera P6 XML File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileChosen('OIL_DUL_CORRUPT_SAMPLE.xml', true)}
                      className="px-4 py-2 text-xs font-medium text-[#A43B36] bg-white border border-[#DCABA7] hover:bg-[#F6E4E1] rounded-lg"
                    >
                      Test with Validation Errors
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#EAF0E9] rounded-lg border border-[#D9E2DA] text-xs text-[#006B61] flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Schedule Lineage Rule:</strong>
                    <p className="mt-0.5 text-[11px] text-[#2C4A60]">
                      Never silently overwrite previous versions. The system assigns a distinct version tag and archives previous revisions in read-only audit history.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: UPLOAD */}
            {importStep === 2 && (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-medium text-[#1A2B25]">
                  <Loader2 className="w-4 h-4 text-[#006B61] animate-spin shrink-0" />
                  <span>Loading schedule...</span>
                </div>
                <p className="text-xs text-[#52665D]">Streaming {selectedFile} to baseline ingestion service...</p>
              </div>
            )}

            {/* STAGE 3: PROCESSING */}
            {importStep === 3 && (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-medium text-[#1A2B25]">
                  <Loader2 className="w-4 h-4 text-[#006B61] animate-spin shrink-0" />
                  <span>Processing WBS hierarchy...</span>
                </div>
                <p className="text-xs text-[#52665D]">
                  Parsing WBS tree, inspecting predecessor networks, and reading activity calendars...
                </p>
              </div>
            )}

            {/* STAGE 4: VALIDATION */}
            {importStep === 4 && (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-medium text-[#1A2B25]">
                  <Loader2 className="w-4 h-4 text-[#006B61] animate-spin shrink-0" />
                  <span>Validating schedule integrity...</span>
                </div>
                <p className="text-xs text-[#52665D]">
                  Checking date chronological sequences, circular logic loops, and WBS parent resolution...
                </p>
              </div>
            )}

            {/* STAGE 5: ERROR REPORT (Validation errors identifying: Row, Column, Problem, Correction) */}
            {importStep === 5 && (
              <div className="space-y-3">
                <div className="p-3 bg-[#F6E4E1] border border-[#DCABA7] rounded-lg text-xs text-[#A43B36]">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Validation Error Report ({importErrors.length} Issues Identified)</span>
                  </div>
                  <p className="text-[11px] text-[#52665D]">
                    Validation errors must identify Row, Column, Problem, and Correction. Fix these issues in Primavera P6 or choose a corrected file.
                  </p>
                </div>

                {/* Canonical Error Report Table */}
                <div className="border border-[#DCABA7] rounded-lg overflow-x-auto bg-white shadow-xs">
                  <table className="w-full min-w-[500px] text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#FAF2F1]">
                      <tr className="bg-[#FAF2F1] border-b border-[#DCABA7] text-[#A43B36] font-semibold text-[11px] sm:text-xs uppercase tracking-wider h-11">
                        <th className="py-3 px-4 whitespace-nowrap">Row</th>
                        <th className="py-3 px-4 whitespace-nowrap">Column</th>
                        <th className="py-3 px-4">Problem</th>
                        <th className="py-3 px-4">Correction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5D2] text-[14px]">
                      {importErrors.map((err, idx) => (
                        <tr key={idx} className="h-11 sm:h-12 hover:bg-[#FFF9F8]">
                          <td className="py-3 px-4 font-mono font-semibold text-[#1A2B25]">{err.row}</td>
                          <td className="py-3 px-4 font-medium text-[#1A2B25]">{err.column}</td>
                          <td className="py-3 px-4 text-[#A43B36]">{err.problem}</td>
                          <td className="py-3 px-4 text-[#1F6B4E] font-mono text-[12px]">{err.correction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[#52665D]">
                    You cannot commit a baseline with active integrity errors.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFileChosen('OIL_DUL_FIXED_BASELINE.xml', false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] rounded-lg shadow-xs"
                  >
                    Re-Validate with Corrected File →
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 6: PREVIEW */}
            {importStep === 6 && (
              <div className="space-y-4">
                <div className="p-3 bg-[#E4F1E9] border border-[#B7DAC3] rounded-lg text-xs text-[#1F6B4E] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Schedule Baseline Analysis Verified &amp; Ready for Preview</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg">
                  <div>
                    <span className="text-[11px] text-[#52665D] block">Total Activities</span>
                    <span className="text-lg font-bold text-[#1A2B25] font-mono">154</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52665D] block">Critical Path Items</span>
                    <span className="text-lg font-bold text-[#A43B36] font-mono">26</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52665D] block">WBS Hierarchy Depth</span>
                    <span className="text-lg font-bold text-[#1A2B25] font-mono">L1 to L6</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#52665D] block">Precedence Links</span>
                    <span className="text-lg font-bold text-[#006B61] font-mono">198</span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-[#D9E2DA] rounded-lg text-xs space-y-1">
                  <span className="font-bold text-[#1A2B25] block">Import Metadata Summary:</span>
                  <p className="text-[#52665D]">
                    File: <strong className="text-[#1A2B25] font-mono">{selectedFile}</strong> · Source: <strong className="text-[#1A2B25]">Primavera P6 XML</strong> · Data Date: <strong className="text-[#1A2B25]">18 Sep 2026</strong>
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(7)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] rounded-lg shadow-xs"
                  >
                    Proceed to Create Version →
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 7: CREATE VERSION (Never silently overwrite previous versions) */}
            {importStep === 7 && (
              <form onSubmit={handleCommitNewVersion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A2B25] mb-1">
                    New Schedule Version Code <span className="text-[#A43B36]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVersionCode}
                    onChange={(e) => {
                      setNewVersionCode(e.target.value);
                      setVersionOverwriteError(null);
                    }}
                    placeholder="e.g. V4 · Rev 4.0"
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] focus:bg-white rounded-lg font-mono text-[#1A2B25] outline-none"
                    required
                  />
                  {versionOverwriteError && (
                    <div className="p-3 bg-[#F6E4E1] border border-[#DCABA7] rounded-lg text-[11px] text-[#A43B36] mt-2 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{versionOverwriteError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A2B25] mb-1">
                    Revision Notes / Reason for Baseline Adjustment
                  </label>
                  <textarea
                    rows={3}
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g. Approved recovery baseline reflecting revised compressor foundation delivery and resequenced piping joints."
                    className="w-full px-3 py-2 text-xs bg-[#F6F7F3] border border-[#D9E2DA] focus:border-[#006B61] focus:bg-white rounded-lg text-[#1A2B25] outline-none"
                  />
                </div>

                <div className="p-3 bg-[#F6F7F3] rounded-lg border border-[#D9E2DA] text-[11px] text-[#52665D]">
                  <strong className="text-[#1A2B25] block mb-0.5">Version Lineage Governance:</strong>
                  Version {currentOperationalVersion.label} will be safely archived as <strong>Previous</strong>. The new version will be set as <strong>Current</strong>.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(6)}
                    className="px-4 py-1.5 text-xs text-[#52665D] border border-[#D9E2DA] rounded-lg"
                  >
                    Back to Preview
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] rounded-lg shadow-xs"
                  >
                    Create Version &amp; Activate Baseline
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 8: COMPLETE */}
            {importStep === 8 && (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#1F6B4E] mx-auto" />
                <h4 className="text-base font-bold text-[#1A2B25]">
                  Schedule Version Activated Successfully
                </h4>
                <p className="text-xs text-[#52665D] max-w-sm mx-auto">
                  Baseline version <strong>{newVersionCode}</strong> is now the active operational baseline. Previous version has been safely archived in the lineage history.
                </p>
                <div className="p-3 bg-[#F6F7F3] border border-[#D9E2DA] rounded-lg font-mono text-xs text-[#1A2B25] inline-block">
                  Current Version: <strong>{newVersionCode} (Primavera P6 XML)</strong>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </StateWrapper>
  );
}
