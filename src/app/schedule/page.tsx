'use client';

import React, { useState, useMemo } from 'react';
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
import { Drawer } from '../../components/shared/Drawer';
import { WhyButton } from '../../components/shared/WhyButton';
import { ScheduleActivity, WBSLevel, DisciplineType } from '../../types';
import {
  Upload,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Search,
  Filter,
  X,
  ChevronRight,
  ArrowRight,
  Info,
  RefreshCw,
  FolderKanban,
  Check,
  FileText,
  Loader2,
  ShieldAlert,
  ArrowUpRight,
  ListFilter,
} from 'lucide-react';

export type VersionState = 'current' | 'previous' | 'processing' | 'failed';

export interface ImportErrorItem {
  row: number;
  field: string;
  error: string;
  reason: string;
}

export interface ScheduleVersionItem {
  id: string; // e.g., "V3"
  label: string; // "V3"
  versionCode: string; // "Rev 3.2 (P6 XML)"
  status: VersionState;
  sourceFile: string;
  activitiesCount: number;
  criticalCount: number;
  importedAt: string;
  importedBy: string;
  dataDate: string;
  notes?: string;
  errors?: ImportErrorItem[];
}

// Full Multi-Level WBS Activities Data (L1 Project down to L6 Sub-Activities)
const INITIAL_SCHEDULE_ACTIVITIES: ScheduleActivity[] = [
  {
    id: 'PRJ-OIL-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Duliajan Gas Processing & Pipeline Interconnect',
    wbs: '1.0',
    wbsLevel: 'L1',
    discipline: 'Piping',
    area: 'Entire Field Asset',
    plannedStart: '2026-08-01',
    plannedFinish: '2026-12-15',
    actualStart: '2026-08-01',
    actualFinish: '',
    plannedProgress: 80,
    actualProgress: 73,
    plannedQuantity: 1,
    actualQuantity: 0.73,
    unit: 'project',
    variance: -7,
    status: 'at-risk',
    delayDays: 2,
    predecessors: [],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Rajesh Sharma',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Overall capital investment project master baseline hierarchy',
  },
  {
    id: 'AREA-100',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Unit A - Gas Processing & Compression Area',
    wbs: '1.1',
    wbsLevel: 'L2',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-08-15',
    plannedFinish: '2026-11-30',
    actualStart: '2026-08-15',
    actualFinish: '',
    plannedProgress: 78,
    actualProgress: 72,
    plannedQuantity: 1,
    actualQuantity: 0.72,
    unit: 'facility',
    variance: -6,
    status: 'at-risk',
    delayDays: 2,
    predecessors: [],
    successors: ['AREA-200'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Gas dehydration, condensate stabilization, and main header area',
  },
  {
    id: 'DISC-PIP-3',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Piping Systems & Interconnecting Piperacks',
    wbs: '1.1.3',
    wbsLevel: 'L3',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-10-31',
    actualStart: '2026-09-01',
    actualFinish: '',
    plannedProgress: 85,
    actualProgress: 70,
    plannedQuantity: 420,
    actualQuantity: 294,
    unit: 'spools',
    variance: -15,
    status: 'delayed',
    delayDays: 2,
    predecessors: ['DISC-CIV-2'],
    successors: ['DISC-MEC-4'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-003'],
    executionEventIds: ['EVT-2026-001'],
    description: 'All carbon steel and stainless process lines on Rack B',
  },
  {
    id: 'WP-3.2',
    projectId: 'PRJ-OIL-2026-01',
    name: 'High-Pressure Header Piping Package (Line 24-XX)',
    wbs: '1.1.3.2',
    wbsLevel: 'L4',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-25',
    actualStart: '2026-09-11',
    actualFinish: '',
    plannedProgress: 80,
    actualProgress: 68,
    plannedQuantity: 24,
    actualQuantity: 16.3,
    unit: 'joints',
    variance: -12,
    status: 'delayed',
    delayDays: 2,
    predecessors: [],
    successors: ['WP-3.3'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-004'],
    executionEventIds: ['EVT-2026-001', 'EVT-2026-002'],
    description: 'Complete 24-inch gas gathering header line from wellhead pad to slug catcher',
  },
  {
    id: 'PIP-24-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-17',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 12,
    actualQuantity: 12,
    unit: 'spools',
    variance: 0,
    status: 'delayed',
    delayDays: 2,
    predecessors: [],
    successors: ['PIP-24-002'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-003'],
    executionEventIds: ['EVT-2026-001'],
    description: 'Erection of prefabricated 24-inch spool pieces on piperack section B',
  },
  {
    id: 'SUB-24-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Rigging & Spool Hoisting onto Piperack Section B',
    wbs: '1.1.3.2.1.1',
    wbsLevel: 'L6',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-13',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-14',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 12,
    actualQuantity: 12,
    unit: 'hoists',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['SUB-24-02'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002'],
    executionEventIds: ['EVT-2026-001'],
    description: 'Heavy crane rigging and placement of spools onto spring hangers',
  },
  {
    id: 'SUB-24-02',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Flange Alignment & Spring Support Load Setting',
    wbs: '1.1.3.2.1.2',
    wbsLevel: 'L6',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-14',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-15',
    actualFinish: '2026-09-17',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 12,
    actualQuantity: 12,
    unit: 'flanges',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: ['SUB-24-01'],
    successors: ['PIP-24-002'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002'],
    executionEventIds: ['EVT-2026-001'],
    description: 'Cold pull check, flange parallelism verification, and torqueing',
  },
  {
    id: 'PIP-24-002',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-16',
    actualFinish: '',
    plannedProgress: 85,
    actualProgress: 70,
    plannedQuantity: 12,
    actualQuantity: 8.4,
    unit: 'joints',
    variance: -15,
    status: 'delayed',
    delayDays: 2,
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-02-005'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-004'],
    executionEventIds: ['EVT-2026-002'],
    description: 'Field butt welding and 100% radiographic inspection of Line 24-XX joints',
  },
  {
    id: 'PIP-24-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    actualStart: '',
    actualFinish: '',
    plannedProgress: 0,
    actualProgress: 0,
    plannedQuantity: 1,
    actualQuantity: 0,
    unit: 'test package',
    variance: 0,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002'],
    successors: ['PIP-24-004'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Hydrostatic pressure integrity validation at 1.5x design pressure',
  },
  {
    id: 'CIV-11-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Foundation Block A - Compressor Pedestal',
    wbs: '1.1.2.1.1',
    wbsLevel: 'L5',
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    actualStart: '2026-09-05',
    actualFinish: '2026-09-14',
    plannedProgress: 100,
    actualProgress: 100,
    plannedQuantity: 45,
    actualQuantity: 45,
    unit: 'm³ concrete',
    variance: 0,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['MEC-08-003'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001'],
    executionEventIds: [],
    description: 'Reinforced concrete foundation pedestal for 3.5MW compressor package',
  },
  {
    id: 'MEC-08-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Align Centrifugal Gas Compressor Skid A',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-22',
    actualStart: '2026-09-16',
    actualFinish: '',
    plannedProgress: 20,
    actualProgress: 15,
    plannedQuantity: 1,
    actualQuantity: 0.15,
    unit: 'skid package',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['CIV-11-001'],
    successors: ['ELE-11-032'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Precision laser alignment of motor and compressor shafts on foundation block A',
  },
  {
    id: 'ELE-11-032',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '1.1.5.1.1',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Unit A - Overhead Gallery',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-09-23',
    actualStart: '2026-09-15',
    actualFinish: '',
    plannedProgress: 50,
    actualProgress: 40,
    plannedQuantity: 320,
    actualQuantity: 128,
    unit: 'meters',
    variance: -10,
    status: 'at-risk',
    delayDays: 1,
    predecessors: ['MEC-08-003'],
    successors: ['INS-02-005'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Heavy duty perforated ladder cable tray along pipe rack levels 1 & 2',
  },
  {
    id: 'INS-02-005',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Mount Smart Pressure Transmitters on Line 24-XX',
    wbs: '1.1.5.2.1',
    wbsLevel: 'L5',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-21',
    plannedFinish: '2026-09-25',
    actualStart: '',
    actualFinish: '',
    plannedProgress: 15,
    actualProgress: 0,
    plannedQuantity: 6,
    actualQuantity: 0,
    unit: 'transmitters',
    variance: -15,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Installation and tubing of smart transmitters on Line 24-XX header',
  },
];

// Sample historical schedule versions
const DEFAULT_VERSIONS: ScheduleVersionItem[] = [
  {
    id: 'V3',
    label: 'V3 · Rev 3.2',
    versionCode: 'V3 · Rev 3.2',
    status: 'current',
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
    label: 'V2 · Rev 2.0',
    versionCode: 'V2 · Rev 2.0',
    status: 'previous',
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
    label: 'V1 · Rev 1.0',
    versionCode: 'V1 · Rev 1.0',
    status: 'previous',
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
        field: 'Planned Finish Date',
        error: 'INVALID_DATE_SEQUENCE',
        reason: 'Planned finish date (2026-09-08) is earlier than planned start date (2026-09-12).',
      },
      {
        row: 112,
        field: 'Predecessor Relationship',
        error: 'CIRCULAR_DEPENDENCY',
        reason: 'Activity PIP-24-003 depends on PIP-24-002, which circularly depends on PIP-24-003.',
      },
      {
        row: 144,
        field: 'WBS Parent Identifier',
        error: 'MISSING_WBS_PARENT',
        reason: 'Parent WBS node 1.1.9 does not exist in master baseline hierarchy.',
      },
    ],
  },
];

export default function SchedulePage() {
  const { activeProject, openActivityDrawer, openWhyExplanation, userSession } = useApp();
  const { addToast } = useToast();

  // Progressive Disclosure: Operational view (8 cols) vs Detailed Full P6 Matrix (14 cols)
  const [viewMode, setViewMode] = useState<'operational' | 'detailed'>('operational');

  // Versions State
  const [versions, setVersions] = useState<ScheduleVersionItem[]>(DEFAULT_VERSIONS);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('V3');

  // Master Activities State
  const [activities, setActivities] = useState<ScheduleActivity[]>(INITIAL_SCHEDULE_ACTIVITIES);
  const [isSimulatedEmpty, setIsSimulatedEmpty] = useState(false);

  // Selected Activity Drawer
  const [activeActivity, setActiveActivity] = useState<ScheduleActivity | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [wbsFilter, setWbsFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');

  // Import Modal & Wizard Flow States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [simulateErrorInImport, setSimulateErrorInImport] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportErrorItem[]>([]);
  const [newVersionCode, setNewVersionCode] = useState('Rev 4.0 (P6 XML)');
  const [newVersionNotes, setNewVersionNotes] = useState('');
  const [versionOverwriteError, setVersionOverwriteError] = useState<string | null>(null);

  const breadcrumbs = [
    { label: 'Schedule Controls' },
    { label: 'Schedule Management', current: true },
  ];

  // Active selected version object
  const activeVersion = useMemo(() => {
    return versions.find((v) => v.id === selectedVersionId) || versions[0];
  }, [versions, selectedVersionId]);

  // Current active operational version
  const currentOperationalVersion = useMemo(() => {
    return versions.find((v) => v.status === 'current') || versions[0];
  }, [versions]);

  // Unique Area list
  const areaOptions = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.area).filter(Boolean)));
  }, [activities]);

  // Unique Discipline list
  const disciplineOptions = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.discipline).filter(Boolean)));
  }, [activities]);

  // Filtering Logic
  const filteredActivities = useMemo(() => {
    if (isSimulatedEmpty || activeVersion.status === 'failed') return [];

    return activities.filter((act) => {
      // Search: Activity ID / Activity Name / WBS
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          act.id.toLowerCase().includes(q) ||
          act.name.toLowerCase().includes(q) ||
          act.wbs.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter: WBS substring
      if (wbsFilter.trim()) {
        if (!act.wbs.toLowerCase().includes(wbsFilter.toLowerCase().trim())) {
          return false;
        }
      }

      // Filter: L1-L6 Level
      if (levelFilter !== 'all' && act.wbsLevel !== levelFilter) {
        return false;
      }

      // Filter: Area
      if (areaFilter !== 'all' && act.area !== areaFilter) {
        return false;
      }

      // Filter: Discipline
      if (disciplineFilter !== 'all' && act.discipline !== disciplineFilter) {
        return false;
      }

      // Filter: Status
      if (statusFilter !== 'all' && act.status !== statusFilter) {
        return false;
      }

      // Filter: Progress
      if (progressFilter !== 'all') {
        if (progressFilter === 'not-started' && act.actualProgress !== 0) return false;
        if (progressFilter === 'in-progress' && (act.actualProgress <= 0 || act.actualProgress >= 100)) return false;
        if (progressFilter === 'completed' && act.actualProgress !== 100) return false;
      }

      // Filter: Variance
      if (varianceFilter !== 'all') {
        if (varianceFilter === 'delayed' && act.delayDays <= 0) return false;
        if (varianceFilter === 'on-track' && act.delayDays !== 0) return false;
        if (varianceFilter === 'ahead' && act.delayDays >= 0) return false;
      }

      return true;
    });
  }, [
    activities,
    search,
    wbsFilter,
    levelFilter,
    areaFilter,
    disciplineFilter,
    statusFilter,
    progressFilter,
    varianceFilter,
    isSimulatedEmpty,
    activeVersion,
  ]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    Boolean(wbsFilter.trim()) ||
    levelFilter !== 'all' ||
    areaFilter !== 'all' ||
    disciplineFilter !== 'all' ||
    statusFilter !== 'all' ||
    progressFilter !== 'all' ||
    varianceFilter !== 'all';

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
        description: 'Baseline import failed schema validation. Inspect errors below.',
      });
    } else if (version.status === 'previous') {
      addToast({
        type: 'info',
        title: `Switched to Historical Version (${version.label})`,
        description: `Viewing read-only baseline records for ${version.versionCode}.`,
      });
    }
  };

  // Import Wizard: Step Transition Logic
  const handleStartImport = () => {
    setImportStep(1);
    setSelectedFile('');
    setSimulateErrorInImport(false);
    setImportErrors([]);
    setNewVersionCode(`Rev ${versions.length}.0 (P6 XML)`);
    setNewVersionNotes('');
    setVersionOverwriteError(null);
    setIsImportModalOpen(true);
  };

  const handleFileChosen = (fileName: string) => {
    setSelectedFile(fileName);
    setImportStep(2); // Move to Upload

    // Simulate upload -> processing -> validation
    setTimeout(() => {
      setImportStep(3); // Processing
      setTimeout(() => {
        if (simulateErrorInImport) {
          setImportErrors([
            {
              row: 52,
              field: 'Planned Finish Date',
              error: 'INVALID_DATE_SEQUENCE',
              reason: 'Planned finish date (2026-09-08) is prior to planned start date (2026-09-12).',
            },
            {
              row: 98,
              field: 'Predecessor Activity',
              error: 'CIRCULAR_DEPENDENCY',
              reason: 'Circular predecessor loop detected between PIP-24-002 and PIP-24-003.',
            },
            {
              row: 141,
              field: 'WBS Level',
              error: 'MISSING_WBS_PARENT',
              reason: 'Parent WBS node 1.1.9 does not exist in project master schedule.',
            },
          ]);
          setImportStep(4); // Validation (will show error view)
        } else {
          setImportStep(4); // Validation passed
          setTimeout(() => {
            setImportStep(5); // Import Summary
          }, 600);
        }
      }, 1000);
    }, 1000);
  };

  const handleCommitNewVersion = (e: React.FormEvent) => {
    e.preventDefault();

    // RULE: "Never silently overwrite an existing schedule version"
    const isDuplicate = versions.some(
      (v) => v.versionCode.trim().toLowerCase() === newVersionCode.trim().toLowerCase()
    );

    if (isDuplicate) {
      setVersionOverwriteError(
        `Version "${newVersionCode}" already exists. Silently overwriting an existing schedule version is prohibited. Please specify a new version tag (e.g. Rev 4.1).`
      );
      return;
    }

    setVersionOverwriteError(null);

    const newVerId = `V${versions.length + 1}`;
    const newVersionObj: ScheduleVersionItem = {
      id: newVerId,
      label: newVerId,
      versionCode: newVersionCode,
      status: 'current',
      sourceFile: selectedFile || 'OIL_DUL_BASELINE_NEW.xml',
      activitiesCount: 154,
      criticalCount: 26,
      importedAt: 'Just now',
      importedBy: 'Rajesh Sharma (Controls Manager)',
      dataDate: '18 Sep 2026',
      notes: newVersionNotes || 'New baseline version created via P6 XML import flow.',
    };

    // Mark previous current as 'previous'
    const updatedVersions: ScheduleVersionItem[] = versions.map((v) => {
      if (v.status === 'current') {
        return { ...v, status: 'previous' as const };
      }
      return v;
    });

    setVersions([newVersionObj, ...updatedVersions]);
    setSelectedVersionId(newVerId);
    setImportStep(7); // Complete
    addToast({
      type: 'success',
      title: 'New Schedule Version Activated',
      description: `Baseline ${newVersionCode} (${newVerId}) is now the current operational baseline.`,
    });
  };

  const getVersionBadgeClass = (status: VersionState) => {
    switch (status) {
      case 'current':
        return 'bg-[#EBF5EF] text-[#2E7D5B] border-[#B8DCC9]';
      case 'previous':
        return 'bg-[#F0F2F5] text-[#596579] border-[#D9DEE5]';
      case 'processing':
        return 'bg-[#EDF5F8] text-[#176B87] border-[#C5DCE6] animate-pulse';
      case 'failed':
        return 'bg-[#FDF0EE] text-[#B5473C] border-[#E4B0AA]';
    }
  };

  return (
    <StateWrapper>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />

        {/* HEADER: Schedule Management */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                <div className="w-8 h-8 rounded bg-[#E8F1F5] flex items-center justify-center text-[#176B87]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#172033] tracking-tight">Schedule</h1>
                </div>
              </div>
              <p className="text-xs text-[#596579]">
                Enterprise baseline schedule repository, L1–L6 WBS hierarchy, version lineage, and Primavera P6 synchronization.
              </p>
            </div>

            {/* Header Controls: Project Selector + Current Version + Import Button */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Project Selector Component */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium hidden sm:inline">Project:</span>
                <ProjectSelector />
              </div>

              {/* Current Schedule Version Tag */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs font-mono">
                <span className="text-[#596579]">Current Version:</span>
                <strong className="text-[#176B87] font-bold">
                  {currentOperationalVersion.label} ({currentOperationalVersion.versionCode})
                </strong>
              </div>

              {/* Import Schedule Button */}
              <button
                type="button"
                onClick={handleStartImport}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded-md transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Schedule</span>
              </button>

              {/* Demo Mode Toggle: Simulate Empty State (Admin Only) */}
              {userSession?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setIsSimulatedEmpty(!isSimulatedEmpty)}
                  className={`px-2.5 py-2 text-xs rounded-md border transition-colors ${
                    isSimulatedEmpty
                      ? 'bg-[#B5473C] text-white border-[#B5473C]'
                      : 'bg-white text-[#596579] border-[#D9DEE5] hover:bg-[#F0F2F5]'
                  }`}
                  title="Toggle demonstration of empty schedule state (Admin only)"
                >
                  {isSimulatedEmpty ? 'Reset Schedule' : 'Test Empty State'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SCHEDULE VERSION AREA: V1, V2, V3, Processing, Failed */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-[#E8EBF0] gap-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#176B87]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Schedule Baseline Version Lineage
              </h3>
            </div>
            <div className="text-[11px] text-[#596579]">
              Strict policy: Schedule baselines are immutable. Every import creates a new revision.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {versions.map((ver) => {
              const isSelected = ver.id === selectedVersionId;

              return (
                <button
                  key={ver.id}
                  type="button"
                  onClick={() => handleSelectVersion(ver)}
                  className={`p-3 rounded-lg border text-left transition-all relative ${
                    isSelected
                      ? 'border-[#176B87] bg-[#F7FAFC] shadow-xs ring-1 ring-[#176B87]'
                      : 'border-[#D9DEE5] bg-white hover:border-[#176B87]/50 hover:bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-bold text-sm text-[#172033]">
                      {ver.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${getVersionBadgeClass(
                        ver.status
                      )}`}
                    >
                      {ver.status}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-[#172033] truncate" title={ver.versionCode}>
                    {ver.versionCode}
                  </p>

                  <div className="mt-2 pt-2 border-t border-[#E8EBF0] text-[11px] text-[#596579] space-y-0.5">
                    <div className="flex justify-between">
                      <span>Activities:</span>
                      <strong className="text-[#172033] font-mono">{ver.activitiesCount}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Date:</span>
                      <span className="font-mono">{ver.dataDate}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Version Status Notice */}
          <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-md text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#172033]">Active Inspection:</span>
              <span className="font-mono font-bold text-[#176B87]">
                {activeVersion.label} — {activeVersion.versionCode}
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getVersionBadgeClass(
                  activeVersion.status
                )}`}
              >
                {activeVersion.status}
              </span>
            </div>

            <div className="text-[11px] text-[#596579]">
              Source File: <span className="font-mono text-[#172033]">{activeVersion.sourceFile}</span>
            </div>
          </div>
        </div>

        {/* SPECIAL DISPLAY: Failed Version Import Errors View */}
        {activeVersion.status === 'failed' && activeVersion.errors && (
          <div className="bg-[#FDF0EE] border border-[#E4B0AA] rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#B5473C]" />
                <div>
                  <h3 className="text-sm font-bold text-[#B5473C]">
                    Baseline Import Validation Errors ({activeVersion.errors.length} Failures Detected)
                  </h3>
                  <p className="text-xs text-[#596579]">
                    This schedule version failed pre-commit integrity rules. Correct the issues in Primavera P6 or MS Project and re-upload.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartImport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B5473C] hover:bg-[#96372E] rounded transition-colors"
              >
                Retry Import
              </button>
            </div>

            {/* Error Ledger Table */}
            <div className="bg-white border border-[#E4B0AA] rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF2F1] border-b border-[#E4B0AA] text-[#B5473C] font-semibold">
                    <th className="py-2.5 px-3 whitespace-nowrap">Row</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Field</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Error Code</th>
                    <th className="py-2.5 px-3">Reason / Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0D5D2]">
                  {activeVersion.errors.map((err, idx) => (
                    <tr key={idx} className="hover:bg-[#FFF9F8]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#172033]">{err.row}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#172033]">{err.field}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#B5473C] font-bold">
                        {err.error}
                      </td>
                      <td className="py-2.5 px-3 text-[#596579]">{err.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search: Activity ID / activity name / WBS */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Activity ID, Activity Name, or WBS..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] placeholder-[#8A94A6] transition-colors outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A94A6] hover:text-[#172033]"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter 1: WBS Code */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">WBS:</span>
                <input
                  type="text"
                  placeholder="e.g. 1.1.3"
                  value={wbsFilter}
                  onChange={(e) => setWbsFilter(e.target.value)}
                  className="w-24 px-2 py-1.5 text-xs bg-[#F7F8FA] focus:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-md font-mono text-[#172033] outline-none"
                />
              </div>

              {/* Filter 2: L1-L6 Level */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
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

              {/* Filter 3: Area */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Area:</span>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Areas</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Discipline */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Discipline:</span>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Disciplines</option>
                  {disciplineOptions.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 5: Status */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="on-track">On Track</option>
                  <option value="at-risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Filter 6: Progress */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Progress:</span>
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Progress</option>
                  <option value="not-started">Not Started (0%)</option>
                  <option value="in-progress">In Progress (1-99%)</option>
                  <option value="completed">Completed (100%)</option>
                </select>
              </div>

              {/* Filter 7: Variance */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#596579] font-medium">Variance:</span>
                <select
                  value={varianceFilter}
                  onChange={(e) => setVarianceFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Variance</option>
                  <option value="delayed">Critical Delayed (&gt; 0d)</option>
                  <option value="on-track">On Schedule (0d)</option>
                  <option value="ahead">Ahead (&lt; 0d)</option>
                </select>
              </div>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2.5 py-1.5 text-xs text-[#B5473C] hover:bg-[#FDF0EE] border border-[#E4B0AA] rounded-md transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Results count strip & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#596579] pt-2 border-t border-[#F0F2F5] gap-2">
            <div className="flex items-center gap-2">
              <span>
                Showing <strong className="text-[#172033] font-mono">{filteredActivities.length}</strong> of{' '}
                <span className="font-mono">{activities.length}</span> activities
              </span>
              {hasActiveFilters && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#E8F1F5] text-[#176B87] font-medium">
                  Filters Active
                </span>
              )}
            </div>

            {/* View Mode Toggle: Progressive Disclosure */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#8A94A6]">View Mode:</span>
              <div className="inline-flex items-center p-0.5 bg-[#F0F2F5] rounded-md border border-[#D9DEE5]">
                <button
                  type="button"
                  onClick={() => setViewMode('operational')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    viewMode === 'operational'
                      ? 'bg-white text-[#172033] font-semibold shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  Operational (8 cols)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-white text-[#172033] font-semibold shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  Full P6 Matrix (14 cols)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EMPTY STATE: "No schedule has been imported." */}
        {isSimulatedEmpty || (activities.length === 0 && activeVersion.status !== 'failed') ? (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E8F1F5] text-[#176B87] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No schedule has been imported.</h3>
            <p className="text-xs text-[#596579] max-w-md mx-auto mb-5">
              Initialize this project&apos;s schedule twin by importing a Primavera P6 XML/XER or MS Project schedule file with complete L1–L6 WBS hierarchy.
            </p>
            <button
              type="button"
              onClick={handleStartImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded-md transition-colors inline-flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import Schedule</span>
            </button>
          </div>
        ) : filteredActivities.length === 0 && activeVersion.status !== 'failed' ? (
          /* Filter Empty State */
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-10 text-center">
            <div className="w-10 h-10 rounded-full bg-[#F0F2F5] text-[#596579] flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No activities match current filters</h3>
            <p className="text-xs text-[#596579] max-w-sm mx-auto mb-4">
              Try adjusting your WBS code, level, area, or discipline filter criteria.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-3.5 py-1.5 text-xs font-medium text-[#176B87] bg-[#E8F1F5] hover:bg-[#D9EAF0] rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : activeVersion.status === 'failed' ? null : (
          /* MAIN SCHEDULE DATA TABLE */
          <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              {viewMode === 'operational' ? (
                /* 8-COLUMN OPERATIONAL CLEAN VIEW */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                      <th className="py-3 px-3.5 whitespace-nowrap">Activity ID</th>
                      <th className="py-3 px-3.5 whitespace-nowrap min-w-[220px]">Activity</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Area</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Discipline</th>
                      <th className="py-3 px-3.5 whitespace-nowrap min-w-[140px]">Progress</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Variance</th>
                      <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                      <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0]">
                    {filteredActivities.map((row) => {
                      const isSlipped = row.delayDays > 0;
                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setActiveActivity(row);
                            openActivityDrawer(row.id);
                          }}
                          className="hover:bg-[#F9FAFC] cursor-pointer transition-colors group"
                        >
                          {/* 1. Activity ID */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <span className="font-mono font-bold text-[#176B87] group-hover:underline">
                              {row.id}
                            </span>
                          </td>

                          {/* 2. Activity */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#172033] group-hover:text-[#176B87] transition-colors">
                                {row.name}
                              </span>
                              {row.isCritical && (
                                <span className="text-[10px] font-mono text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-1 py-0.2 rounded font-bold flex-shrink-0">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Area */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap text-[#596579]">
                            {row.area}
                          </td>

                          {/* 4. Discipline */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#F0F2F5] border border-[#D9DEE5] rounded text-[11px] text-[#172033] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 5. Progress */}
                          <td className="py-3 px-3.5 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#172033]">{row.actualProgress}%</span>
                                <span className="text-[#596579]">Target: {row.plannedProgress}%</span>
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

                          {/* 6. Variance */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <VarianceBadge daysDelay={row.delayDays} size="sm" />
                              {isSlipped && (
                                <WhyButton
                                  onClick={() => openWhyExplanation(`delay:${row.id}`, row.id)}
                                  title="Why is this activity delayed?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 7. Status */}
                          <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={row.status} size="sm" />
                              {(row.status === 'delayed' || row.status === 'at-risk') && (
                                <WhyButton
                                  variant="subtle"
                                  onClick={() => openWhyExplanation(`delay:${row.id}`, row.id)}
                                  title="Why is this activity at risk?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 8. Action */}
                          <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActivity(row);
                                openActivityDrawer(row.id);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-[#176B87] hover:bg-[#E8F1F5] border border-[#C5D9E2] rounded transition-colors"
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                /* FULL 14-COLUMN P6 MATRIX VIEW */
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                      <th className="py-3 px-3 whitespace-nowrap">Activity ID</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[220px]">Activity Name</th>
                      <th className="py-3 px-2 text-center whitespace-nowrap">Level</th>
                      <th className="py-3 px-3 whitespace-nowrap">WBS</th>
                      <th className="py-3 px-3 whitespace-nowrap">Area</th>
                      <th className="py-3 px-3 whitespace-nowrap">Discipline</th>
                      <th className="py-3 px-3 whitespace-nowrap">Planned Start</th>
                      <th className="py-3 px-3 whitespace-nowrap">Planned Finish</th>
                      <th className="py-3 px-3 whitespace-nowrap">Actual Start</th>
                      <th className="py-3 px-3 whitespace-nowrap">Actual Finish</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[140px]">Progress</th>
                      <th className="py-3 px-3 whitespace-nowrap">Status</th>
                      <th className="py-3 px-3 whitespace-nowrap">Variance</th>
                      <th className="py-3 px-3 whitespace-nowrap min-w-[180px]">Dependencies</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EBF0]">
                    {filteredActivities.map((row) => {
                      const levelColors: Record<WBSLevel, { bg: string; text: string; border: string }> = {
                        L1: { bg: 'bg-[#176B87]/10', text: 'text-[#176B87]', border: 'border-[#176B87]/30' },
                        L2: { bg: 'bg-[#3B6EA8]/10', text: 'text-[#3B6EA8]', border: 'border-[#3B6EA8]/30' },
                        L3: { bg: 'bg-[#2E7D5B]/10', text: 'text-[#2E7D5B]', border: 'border-[#2E7D5B]/30' },
                        L4: { bg: 'bg-[#D98B32]/10', text: 'text-[#D98B32]', border: 'border-[#D98B32]/30' },
                        L5: { bg: 'bg-[#8A94A6]/10', text: 'text-[#172033]', border: 'border-[#8A94A6]/30' },
                        L6: { bg: 'bg-[#F0F2F5]', text: 'text-[#596579]', border: 'border-[#D9DEE5]' },
                      };
                      const badge = levelColors[row.wbsLevel] || levelColors.L5;

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setActiveActivity(row);
                            openActivityDrawer(row.id);
                          }}
                          className="hover:bg-[#F9FAFC] cursor-pointer transition-colors group"
                        >
                          {/* 1. Activity ID */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <span className="font-mono font-bold text-[#176B87] group-hover:underline">
                              {row.id}
                            </span>
                          </td>

                          {/* 2. Activity Name */}
                          <td className="py-3 px-3 align-middle">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[#172033] group-hover:text-[#176B87] transition-colors">
                                {row.name}
                              </span>
                              {row.isCritical && (
                                <span className="text-[10px] font-mono text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-1 py-0.2 rounded font-bold flex-shrink-0">
                                  CRITICAL
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Level */}
                          <td className="py-3 px-2 align-middle text-center whitespace-nowrap">
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded border font-bold ${badge.bg} ${badge.text} ${badge.border}`}
                            >
                              {row.wbsLevel}
                            </span>
                          </td>

                          {/* 4. WBS */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <span className="font-mono text-xs text-[#596579] font-medium">
                              {row.wbs}
                            </span>
                          </td>

                          {/* 5. Area */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap text-[#596579]">
                            {row.area}
                          </td>

                          {/* 6. Discipline */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#F0F2F5] border border-[#D9DEE5] rounded text-[11px] text-[#172033] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 7. Planned Start */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-[11px] text-[#596579]">
                            {row.plannedStart}
                          </td>

                          {/* 8. Planned Finish */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-[11px] text-[#172033] font-medium">
                            {row.plannedFinish}
                          </td>

                          {/* 9. Actual Start */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-[11px]">
                            {row.actualStart ? (
                              <span className="text-[#172033]">{row.actualStart}</span>
                            ) : (
                              <span className="text-[#8A94A6] italic">-</span>
                            )}
                          </td>

                          {/* 10. Actual Finish */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap font-mono text-[11px]">
                            {row.actualFinish ? (
                              <span className="text-[#2E7D5B] font-semibold">{row.actualFinish}</span>
                            ) : row.actualStart ? (
                              <span className="text-[#176B87] italic">In Progress</span>
                            ) : (
                              <span className="text-[#8A94A6] italic">-</span>
                            )}
                          </td>

                          {/* 11. Progress */}
                          <td className="py-3 px-3 align-middle">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#172033]">{row.actualProgress}%</span>
                                <span className="text-[#596579]">T: {row.plannedProgress}%</span>
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
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={row.status} size="sm" />
                              {(row.status === 'delayed' || row.status === 'at-risk') && (
                                <WhyButton
                                  variant="subtle"
                                  onClick={() => openWhyExplanation(`delay:${row.id}`, row.id)}
                                  title="Why is this activity at risk?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 13. Variance */}
                          <td className="py-3 px-3 align-middle whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <VarianceBadge daysDelay={row.delayDays} size="sm" />
                              {row.delayDays > 0 && (
                                <WhyButton
                                  onClick={() => openWhyExplanation(`delay:${row.id}`, row.id)}
                                  title="Why is this activity delayed?"
                                />
                              )}
                            </div>
                          </td>

                          {/* 14. Dependencies */}
                          <td className="py-3 px-3 align-middle">
                            <div className="flex flex-col gap-0.5 text-[10px] font-mono">
                              {row.predecessors.length > 0 ? (
                                <span className="text-[#596579]">
                                  Pred:{' '}
                                  <strong className="text-[#176B87]">{row.predecessors.join(', ')}</strong> [FS]
                                </span>
                              ) : (
                                <span className="text-[#8A94A6] italic">No Predecessors</span>
                              )}
                              {row.successors.length > 0 && (
                                <span className="text-[#8A94A6]">
                                  Succ: {row.successors.join(', ')}
                                </span>
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

            {/* Table Footer */}
            <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#596579] gap-2">
              <div className="flex items-center gap-2">
                <span>Active Version: <strong className="font-mono text-[#172033]">{activeVersion.versionCode}</strong></span>
                <span>•</span>
                <span>Total Activities: {filteredActivities.length}</span>
                <span>•</span>
                <span className="font-medium text-[#176B87]">Mode: {viewMode === 'operational' ? 'Operational Clean' : 'Full P6 Matrix'}</span>
              </div>
              <div className="text-[11px] text-[#8A94A6]">
                Click any activity row to view complete dependencies, baseline dates, and audit evidence.
              </div>
            </div>
          </div>
        )}

        {/* IMPORT FLOW 7-STEP MODAL */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Baseline Schedule"
          subtitle="Multi-step validation pipeline: Choose file → Upload → Processing → Validation → Summary → Version → Complete"
          maxWidth="2xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#596579] font-mono">
                Step {importStep} of 7: {
                  [
                    'Choose File',
                    'Upload',
                    'Processing',
                    'Validation',
                    'Import Summary',
                    'Create Schedule Version',
                    'Complete',
                  ][importStep - 1]
                }
              </span>
              <div className="flex items-center gap-2">
                {importStep > 1 && importStep < 7 && importErrors.length === 0 && (
                  <button
                    type="button"
                    onClick={() => setImportStep(1)}
                    className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded"
                  >
                    Restart
                  </button>
                )}
                {importStep === 7 ? (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded"
                  >
                    Done &amp; View Schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-3.5 py-1.5 text-xs text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Step 1: Choose File */}
            {importStep === 1 && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#D9DEE5] hover:border-[#176B87] rounded-lg p-6 text-center bg-[#F7F8FA] transition-colors">
                  <FileSpreadsheet className="w-9 h-9 text-[#176B87] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#172033]">
                    Select or drag baseline schedule file
                  </p>
                  <p className="text-[11px] text-[#596579] mt-0.5">
                    Supports Primavera P6 XML (.xml), Primavera XER (.xer), MS Project (.xml, .mpp), or Normalized CSV
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFileChosen('OIL_DUL_BASELINE_REV4.0.xml')}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded shadow-xs"
                    >
                      Choose Sample P6 XML File
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSimulateErrorInImport(true);
                        handleFileChosen('OIL_DUL_CORRUPT_SAMPLE.xml');
                      }}
                      className="px-3 py-2 text-xs font-medium text-[#B5473C] bg-white border border-[#E4B0AA] hover:bg-[#FDF0EE] rounded"
                    >
                      Test with Validation Errors
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#E8F1F5] rounded border border-[#C5DCE6] text-xs text-[#176B87] flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Data Protection Rule:</strong>
                    <p className="mt-0.5 text-[11px] text-[#2C4A60]">
                      Never silently overwrite an existing schedule version. Once validated, this baseline will be assigned a new explicit version code and archived in the lineage history.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Upload */}
            {importStep === 2 && (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#176B87] animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-[#172033]">Uploading {selectedFile}...</h4>
                <div className="w-64 mx-auto bg-[#E8EBF0] rounded-full h-2 overflow-hidden">
                  <div className="bg-[#176B87] h-2 rounded-full w-2/3 animate-pulse" />
                </div>
                <p className="text-[11px] text-[#596579]">Transmitting payload to secure baseline ingestion service...</p>
              </div>
            )}

            {/* Step 3: Processing */}
            {importStep === 3 && (
              <div className="p-8 text-center space-y-3">
                <Layers className="w-8 h-8 text-[#3B6EA8] animate-bounce mx-auto" />
                <h4 className="text-sm font-bold text-[#172033]">Parsing WBS Hierarchy &amp; Logic</h4>
                <p className="text-[11px] text-[#596579]">
                  Extracting L1 to L6 tree structure, reading activity calendars, and analyzing predecessor/successor links...
                </p>
              </div>
            )}

            {/* Step 4: Validation (Either Pass or Show Errors) */}
            {importStep === 4 && (
              <div className="space-y-3">
                {importErrors.length > 0 ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#FDF0EE] border border-[#E4B0AA] rounded text-xs text-[#B5473C]">
                      <div className="flex items-center gap-2 font-bold mb-1">
                        <ShieldAlert className="w-4 h-4" />
                        <span>Validation Check Failed ({importErrors.length} Errors Found)</span>
                      </div>
                      <p className="text-[11px] text-[#596579]">
                        Errors were encountered during schedule verification. You cannot create a version with corrupted data.
                      </p>
                    </div>

                    {/* Import Errors Ledger */}
                    <div className="border border-[#E4B0AA] rounded overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#FAF2F1] border-b border-[#E4B0AA] text-[#B5473C] font-semibold">
                            <th className="py-2 px-3">Row</th>
                            <th className="py-2 px-3">Field</th>
                            <th className="py-2 px-3">Error</th>
                            <th className="py-2 px-3">Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F0D5D2]">
                          {importErrors.map((err, idx) => (
                            <tr key={idx} className="bg-white">
                              <td className="py-2 px-3 font-mono font-bold">{err.row}</td>
                              <td className="py-2 px-3 font-semibold">{err.field}</td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[#B5473C] font-bold">
                                {err.error}
                              </td>
                              <td className="py-2 px-3 text-[#596579]">{err.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSimulateErrorInImport(false);
                          handleFileChosen('OIL_DUL_FIXED_BASELINE.xml');
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded"
                      >
                        Re-validate with Fixed File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto" />
                    <h4 className="text-sm font-bold text-[#172033]">Validation Passed</h4>
                    <p className="text-xs text-[#596579]">Zero circular loops, valid date chronology, and all WBS parents resolved.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Import Summary */}
            {importStep === 5 && (
              <div className="space-y-4">
                <div className="p-3 bg-[#EBF5EF] border border-[#B8DCC9] rounded text-xs text-[#2E7D5B] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">Schedule Baseline Analysis Complete &amp; Verified</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
                  <div>
                    <span className="text-[11px] text-[#596579] block">Total Activities</span>
                    <span className="text-lg font-bold text-[#172033] font-mono">154</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#596579] block">Critical Path Items</span>
                    <span className="text-lg font-bold text-[#B5473C] font-mono">26</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#596579] block">WBS Hierarchy Depth</span>
                    <span className="text-lg font-bold text-[#172033] font-mono">L1 to L6</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#596579] block">Precedence Links</span>
                    <span className="text-lg font-bold text-[#176B87] font-mono">198</span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(6)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded shadow-xs"
                  >
                    Proceed to Create Schedule Version →
                  </button>
                </div>
              </div>
            )}

            {/* Step 6: Create Schedule Version */}
            {importStep === 6 && (
              <form onSubmit={handleCommitNewVersion} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    New Schedule Version Code <span className="text-[#B5473C]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newVersionCode}
                    onChange={(e) => {
                      setNewVersionCode(e.target.value);
                      setVersionOverwriteError(null);
                    }}
                    placeholder="e.g. Rev 4.0 (P6 XML)"
                    className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded font-mono text-[#172033] outline-none"
                    required
                  />
                  {versionOverwriteError && (
                    <div className="p-2 bg-[#FDF0EE] border border-[#E4B0AA] rounded text-[11px] text-[#B5473C] mt-2 flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{versionOverwriteError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Revision Notes / Reason for Change
                  </label>
                  <textarea
                    rows={3}
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g. Schedule baseline update after joint alignment with Brahmaputra Consortium."
                    className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded text-[#172033] outline-none"
                  />
                </div>

                <div className="p-3 bg-[#F7F8FA] rounded border border-[#D9DEE5] text-[11px] text-[#596579]">
                  <strong className="text-[#172033] block mb-0.5">Version Lineage Governance:</strong>
                  Version {currentOperationalVersion.label} will be archived as <strong>Previous</strong>. The new version will be set as <strong>Current</strong>.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(5)}
                    className="px-3.5 py-1.5 text-xs text-[#596579] border border-[#D9DEE5] rounded"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded shadow-xs"
                  >
                    Create Version &amp; Activate Baseline
                  </button>
                </div>
              </form>
            )}

            {/* Step 7: Complete */}
            {importStep === 7 && (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#2E7D5B] mx-auto" />
                <h4 className="text-base font-bold text-[#172033]">
                  Schedule Version Activated Successfully
                </h4>
                <p className="text-xs text-[#596579] max-w-sm mx-auto">
                  The new baseline schedule version has been deployed. All future daily field progress updates will automatically match against this WBS structure.
                </p>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded font-mono text-xs text-[#172033] inline-block">
                  Current Version: <strong>{newVersionCode}</strong>
                </div>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </StateWrapper>
  );
}
