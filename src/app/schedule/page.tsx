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
import { WhyButton } from '../../components/shared/WhyButton';
import { ScheduleActivity, WBSLevel, DisciplineType } from '../../types';
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
const INITIAL_SCHEDULE_ACTIVITIES: ScheduleActivity[] = [
  // L1: Project (Root)
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
    parentId: undefined,
  },
  // L2: Area
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
    parentId: 'PRJ-OIL-01',
  },
  // L3: Civil Infrastructure
  {
    id: 'DISC-CIV-1',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Civil & Structural Infrastructure Works',
    wbs: '1.1.2',
    wbsLevel: 'L3',
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-08-20',
    plannedFinish: '2026-10-15',
    actualStart: '2026-08-20',
    actualFinish: '',
    plannedProgress: 95,
    actualProgress: 92,
    plannedQuantity: 180,
    actualQuantity: 165.6,
    unit: 'm³ concrete',
    variance: -3,
    status: 'on-track',
    delayDays: 0,
    predecessors: [],
    successors: ['DISC-PIP-3'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001'],
    executionEventIds: [],
    description: 'Foundations, equipment plinths, and structural concrete trenches',
    parentId: 'AREA-100',
  },
  // L4: Civil Work Package
  {
    id: 'WP-CIV-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Equipment Foundation Packages & Plinths',
    wbs: '1.1.2.1',
    wbsLevel: 'L4',
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-01',
    actualFinish: '',
    plannedProgress: 100,
    actualProgress: 98,
    plannedQuantity: 90,
    actualQuantity: 88.2,
    unit: 'm³ concrete',
    variance: -2,
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['WP-3.2'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-001'],
    executionEventIds: [],
    description: 'Reinforced concrete foundation blocks for high pressure machinery',
    parentId: 'DISC-CIV-1',
  },
  // L5: Civil Activity
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
    parentId: 'WP-CIV-01',
  },
  // L3: Piping Discipline
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
    predecessors: ['DISC-CIV-1'],
    successors: ['DISC-MEC-4'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-003'],
    executionEventIds: ['EVT-2026-001'],
    description: 'All carbon steel and stainless process lines on Rack B',
    parentId: 'AREA-100',
  },
  // L4: Piping Work Package
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
    predecessors: ['WP-CIV-01'],
    successors: ['WP-3.3'],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-004'],
    executionEventIds: ['EVT-2026-001', 'EVT-2026-002'],
    description: 'Complete 24-inch gas gathering header line from wellhead pad to slug catcher',
    parentId: 'DISC-PIP-3',
  },
  // L5: Piping Activity 1
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
    parentId: 'WP-3.2',
  },
  // L6: Sub-Activity 1
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
    parentId: 'PIP-24-001',
  },
  // L6: Sub-Activity 2
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
    parentId: 'PIP-24-001',
  },
  // L5: Piping Activity 2
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
    parentId: 'WP-3.2',
  },
  // L5: Piping Activity 3
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
    parentId: 'WP-3.2',
  },
  // L3: Mechanical Discipline
  {
    id: 'DISC-MEC-4',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Mechanical Systems & Rotating Equipment',
    wbs: '1.1.4',
    wbsLevel: 'L3',
    discipline: 'Mechanical',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-11-15',
    actualStart: '2026-09-10',
    actualFinish: '',
    plannedProgress: 35,
    actualProgress: 30,
    plannedQuantity: 8,
    actualQuantity: 2.4,
    unit: 'skid packages',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['DISC-CIV-1'],
    successors: ['DISC-ELE-5'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Heavy rotating compressors, pumps, and separator equipment skids',
    parentId: 'AREA-100',
  },
  // L4: Mechanical Work Package
  {
    id: 'WP-MEC-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Gas Compressor Skid Packages & Driver Alignment',
    wbs: '1.1.4.1',
    wbsLevel: 'L4',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor House',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-10-05',
    actualStart: '2026-09-15',
    actualFinish: '',
    plannedProgress: 25,
    actualProgress: 20,
    plannedQuantity: 2,
    actualQuantity: 0.4,
    unit: 'skids',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['WP-CIV-01'],
    successors: ['WP-ELE-01'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Compressor trains skid rigging and preliminary shaft alignment',
    parentId: 'DISC-MEC-4',
  },
  // L5: Mechanical Activity
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
    parentId: 'WP-MEC-01',
  },
  // L3: Electrical Discipline
  {
    id: 'DISC-ELE-5',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Electrical, Power & Instrumentation Systems',
    wbs: '1.1.5',
    wbsLevel: 'L3',
    discipline: 'Electrical',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-12',
    plannedFinish: '2026-11-20',
    actualStart: '2026-09-12',
    actualFinish: '',
    plannedProgress: 45,
    actualProgress: 35,
    plannedQuantity: 1200,
    actualQuantity: 420,
    unit: 'meters',
    variance: -10,
    status: 'at-risk',
    delayDays: 1,
    predecessors: ['DISC-PIP-3'],
    successors: [],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Power distribution, tray raceways, junction boxes, and field control loops',
    parentId: 'AREA-100',
  },
  // L4: Electrical Work Package
  {
    id: 'WP-ELE-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Cable Tray & Substation Infrastructure',
    wbs: '1.1.4.1',
    wbsLevel: 'L4',
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    plannedStart: '2026-09-14',
    plannedFinish: '2026-09-30',
    actualStart: '2026-09-14',
    actualFinish: '',
    plannedProgress: 55,
    actualProgress: 45,
    plannedQuantity: 450,
    actualQuantity: 202.5,
    unit: 'meters',
    variance: -10,
    status: 'at-risk',
    delayDays: 1,
    predecessors: ['WP-3.2'],
    successors: ['WP-INS-02'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'High-voltage cable ladders from main switchgear building to process units',
    parentId: 'DISC-ELE-5',
  },
  // L5: Electrical Activity
  {
    id: 'ELE-11-032',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Unit A - Substation',
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
    parentId: 'WP-ELE-01',
  },
  // L4: Instrumentation Work Package
  {
    id: 'WP-INS-02',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Field Instrumentation & Transmitter Loops',
    wbs: '1.1.5.2',
    wbsLevel: 'L4',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-18',
    plannedFinish: '2026-10-10',
    actualStart: '',
    actualFinish: '',
    plannedProgress: 15,
    actualProgress: 0,
    plannedQuantity: 24,
    actualQuantity: 0,
    unit: 'transmitters',
    variance: -15,
    status: 'pending',
    delayDays: 2,
    predecessors: ['WP-3.2'],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Pressure, temperature, and differential flow transmitter hookups',
    parentId: 'DISC-ELE-5',
  },
  // L5: Instrumentation Activity
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
    parentId: 'WP-INS-02',
  },
];

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
  const { openActivityDrawer, openWhyExplanation, userSession, activityDrawerActivityId } = useApp();
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
        <ChevronsUpDown className="w-3.5 h-3.5 text-[#7B8798] opacity-30 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
      );
    }
    if (sortConfig.direction === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 text-[#176B87] shrink-0 ml-1" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 text-[#176B87] shrink-0 ml-1" />;
  };

  // Versions State
  const [versions, setVersions] = useState<ScheduleVersionItem[]>(DEFAULT_VERSIONS);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('V3');

  // Master Activities State
  const [activities] = useState<ScheduleActivity[]>(INITIAL_SCHEDULE_ACTIVITIES);
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
    const allParentIds = activities.map((a) => a.id);
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
    activities.forEach((act) => {
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

    for (const act of activities) {
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
  }, [activities]);

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

    setVersions([newVersionObj, ...updatedVersions]);
    setSelectedVersionId(newVerId);
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
        return 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]';
      case 'previous':
        return 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]';
      case 'processing':
        return 'bg-[#EDF5F8] text-[#176B87] border-[#C5DCE6]';
      case 'failed':
        return 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]';
    }
  };

  const getLevelBadgeClass = (level: WBSLevel) => {
    // Standardized neutral badge styling across all hierarchy levels - no 6 rainbow colors
    switch (level) {
      case 'L1':
        return 'bg-[#172033] text-white border-[#172033] font-bold';
      case 'L2':
      case 'L3':
      case 'L4':
      case 'L5':
        return 'bg-[#F1F3F5] text-[#172033] border-[#D9DEE5] font-semibold';
      case 'L6':
        return 'bg-white text-[#596579] border-[#D9DEE5] font-normal';
      default:
        return 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5] font-normal';
    }
  };

  const getActivityTypographyClass = (level: WBSLevel) => {
    // Consistent typography with subtle structural hierarchy weight
    switch (level) {
      case 'L1':
        return 'font-bold text-[#172033]';
      case 'L2':
        return 'font-semibold text-[#172033]';
      case 'L3':
        return 'font-semibold text-[#172033]';
      case 'L4':
        return 'font-medium text-[#172033]';
      case 'L5':
        return 'font-medium text-[#172033]';
      case 'L6':
        return 'font-normal text-[#596579]';
      default:
        return 'font-medium text-[#172033]';
    }
  };

  return (
    <StateWrapper>
      <div className="space-y-6 pb-12">
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: SCHEDULE MANAGEMENT & VERSION METADATA
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Calendar className="w-3.5 h-3.5" />
                  Schedule Controls
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <CheckCircle2 className="w-3 h-3 text-[#2E7D5B]" />
                  Active Baseline Sync
                </span>
              </div>

              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">Schedule</h1>
              <p className="text-sm text-[#596579] mt-1 max-w-3xl">
                Master L1–L6 WBS hierarchy, baseline version lineage, and Primavera P6 synchronization. Easy to scan by default; use the Activity Drawer for deep technical complexity.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium hidden sm:inline">Project:</span>
                <ProjectSelector />
              </div>

              {/* Import Schedule Button */}
              <button
                type="button"
                onClick={handleStartImport}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] border border-[#176B87] rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm"
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
                      ? 'bg-[#B5473C] text-white border-[#B5473C]'
                      : 'bg-white text-[#596579] border-[#D9DEE5] hover:bg-[#F1F3F5]'
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
          <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] border-l-4 border-l-[#176B87] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start md:items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shadow-xs shrink-0">
                <Layers className="w-5 h-5" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                    Schedule Version:
                  </span>
                  <span className="font-mono font-bold text-base text-[#172033]">
                    Rev 3.2 (P6 XML)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                    Status: Current
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#596579] font-mono flex-wrap">
                  <span>Source: <strong className="text-[#172033]">Primavera P6 XML</strong></span>
                  <span>•</span>
                  <span>File: <strong className="text-[#172033]">OIL_DUL_BASELINE_REV3.2.xml</strong></span>
                  <span>•</span>
                  <span>Data Date: <strong className="text-[#172033]">18 Sep 2026</strong></span>
                  <span>•</span>
                  <span>Activities: <strong className="text-[#172033]">{activities.length}</strong></span>
                </div>
              </div>
            </div>

            {/* Strict Version Protection Notice */}
            <div className="px-4 py-2 bg-white border border-[#B3CBE0] rounded-lg text-xs flex items-center gap-2 max-w-md shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#176B87] shrink-0" />
              <div className="text-[11px] leading-tight text-[#172033]">
                <strong className="text-[#176B87] block">Version Protection Active:</strong>
                Never silently overwrite previous versions. Every revision creates a permanent revision snapshot.
              </div>
            </div>
          </div>

          {/* Historical Baseline Lineage Strip */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-[#596579]">
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
                        ? 'border-[#176B87] bg-white shadow-xs ring-1 ring-[#176B87]'
                        : 'border-[#D9DEE5] bg-[#F7F8FA] hover:bg-white hover:border-[#176B87]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono font-bold text-xs text-[#172033]">{ver.id}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold uppercase ${getVersionBadgeClass(
                          ver.status
                        )}`}
                      >
                        {ver.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#172033] truncate" title={ver.versionCode}>
                      {ver.versionCode}
                    </div>
                    <div className="text-[10px] text-[#596579] font-mono mt-1">
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
          <div className="bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#B5473C]" />
                <div>
                  <h3 className="text-sm font-bold text-[#B5473C]">
                    Baseline Import Validation Error Report ({activeVersion.errors.length} Failures)
                  </h3>
                  <p className="text-xs text-[#596579]">
                    Validation errors must be corrected in Primavera P6 before this schedule version can be committed.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartImport}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#B5473C] hover:bg-[#96372E] rounded-lg transition-colors"
              >
                Retry Import
              </button>
            </div>

            {/* Error Report Table with Row, Column, Problem, Correction */}
            <div className="bg-white border border-[#E4B0AA] rounded-lg overflow-x-auto">
              <table className="w-full min-w-[500px] text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#FAF2F1]">
                  <tr className="bg-[#FAF2F1] border-b border-[#E4B0AA] text-[#B5473C] font-semibold h-11">
                    <th className="py-3 px-4 whitespace-nowrap">Row</th>
                    <th className="py-3 px-4 whitespace-nowrap">Column</th>
                    <th className="py-3 px-4">Problem</th>
                    <th className="py-3 px-4">Correction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0D5D2]">
                  {activeVersion.errors.map((err, idx) => (
                    <tr key={idx} className="h-11 sm:h-12 hover:bg-[#FFF9F8]">
                      <td className="py-3 px-4 font-mono font-bold text-[#172033]">{err.row}</td>
                      <td className="py-3 px-4 font-semibold text-[#172033]">{err.column || err.field}</td>
                      <td className="py-3 px-4 text-[#B5473C] font-medium">{err.problem || err.reason}</td>
                      <td className="py-3 px-4 text-[#2E7D5B] font-mono">{err.correction || 'Correct in source schedule'}</td>
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
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D9DEE5]/60">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#176B87]" />
              <h3 className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                L1–L6 WBS Hierarchy
              </h3>
            </div>

            {/* Expand / Collapse Quick Controls */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-[#596579] text-[11px]">Tree Navigation:</span>
              <button
                type="button"
                onClick={handleExpandAll}
                className="px-3 py-1 text-xs font-medium text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Maximize2 className="w-3 h-3 text-[#176B87]" />
                <span>Expand All</span>
              </button>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="px-3 py-1 text-xs font-medium text-[#596579] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-md transition-colors inline-flex items-center gap-1 shadow-2xs"
              >
                <Minimize2 className="w-3 h-3 text-[#596579]" />
                <span>Collapse All</span>
              </button>
              <span className="text-[#D9DEE5]">|</span>
              <button
                type="button"
                onClick={() => handleExpandToLevel('L3')}
                className="px-2 py-1 text-[11px] font-mono text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded"
              >
                To L3 (Discipline)
              </button>
              <button
                type="button"
                onClick={() => handleExpandToLevel('L5')}
                className="px-2 py-1 text-[11px] font-mono text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] rounded"
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
                className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-[#172033] bg-[#E5E9EE] px-1.5 py-0.5 rounded">
                    {tierItem.code}
                  </span>
                  <span className="font-mono text-xs text-[#596579] select-none font-semibold">
                    {tierItem.marker}
                  </span>
                </div>
                <div className="font-semibold text-[#172033] mt-2 text-xs">
                  {tierItem.name}
                </div>
                <span className="text-[10px] text-[#596579] mt-0.5 leading-tight truncate">
                  {tierItem.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* =========================================================================
            SEARCH & FILTER BAR
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3 shadow-xs">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search: Activity ID / Activity Name / WBS */}
            <div className="relative flex-1 min-w-[260px]">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Activity ID, Activity Name, or WBS..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-lg text-[#172033] placeholder-[#7B8798] transition-colors outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033]"
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
                <span className="text-xs text-[#596579] font-medium">Level:</span>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] outline-none cursor-pointer"
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
                <span className="text-xs text-[#596579] font-medium">Area:</span>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] outline-none cursor-pointer max-w-[150px] truncate"
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
                <span className="text-xs text-[#596579] font-medium">Discipline:</span>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] outline-none cursor-pointer"
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
                <span className="text-xs text-[#596579] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] outline-none cursor-pointer"
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
                  className="px-3 py-1.5 text-xs text-[#B5473C] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Results count & View Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#596579] pt-2 border-t border-[#F1F3F5] gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                Showing <strong className="text-[#172033] font-mono">{displayActivities.length}</strong> of{' '}
                <span className="font-mono">{activities.length}</span> activities
              </span>
              {hasActiveFilters && (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87] font-medium">
                  Filtered
                </span>
              )}
              {sortConfig.field && (
                <span className="inline-flex items-center gap-1 text-[11px] px-3 py-0.5 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9] font-medium">
                  <span>Sorted by: <strong>{getSortLabel(sortConfig.field)}</strong> ({sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})</span>
                  <button
                    type="button"
                    onClick={() => setSortConfig({ field: null, direction: 'asc' })}
                    className="ml-1 text-[#B5473C] hover:underline font-bold"
                    title="Reset to default WBS tree order"
                  >
                    × Reset WBS Tree
                  </button>
                </span>
              )}
            </div>

            {/* View Mode Toggle: Operational vs Detailed */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#7B8798]">Table View:</span>
              <div className="inline-flex items-center p-0.5 bg-[#F1F3F5] rounded-lg border border-[#D9DEE5]">
                <button
                  type="button"
                  onClick={() => setViewMode('operational')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                    viewMode === 'operational'
                      ? 'bg-white text-[#172033] font-semibold shadow-xs'
                      : 'text-[#596579] hover:text-[#172033]'
                  }`}
                >
                  Default Schedule (10 cols)
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
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

        {/* =========================================================================
            EMPTY STATES
            ========================================================================= */}
        {isSimulatedEmpty || (activities.length === 0 && activeVersion.status !== 'failed') ? (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#EDF5F8] text-[#176B87] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No schedule has been imported.</h3>
            <p className="text-xs text-[#596579] max-w-md mx-auto mb-4">
              Initialize this project&apos;s schedule baseline by importing a Primavera P6 XML schedule file with complete L1–L6 WBS hierarchy.
            </p>
            <button
              type="button"
              onClick={handleStartImport}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] border border-[#176B87] rounded-lg transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Upload className="w-4 h-4" />
              <span>Import P6 Baseline</span>
            </button>
          </div>
        ) : displayActivities.length === 0 && activeVersion.status !== 'failed' ? (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-10 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-[#F1F3F5] text-[#596579] flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mb-1">No activities match current filters</h3>
            <p className="text-xs text-[#596579] max-w-sm mx-auto mb-4">
              No activities in the active baseline match your current search query, WBS level, or discipline selection. Reset filters to view all schedule activities.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-1.5 text-xs font-medium text-[#172033] bg-white hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors cursor-pointer shadow-2xs"
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
          <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] min-h-[480px] relative">
              {viewMode === 'operational' ? (
                /* -----------------------------------------------------------------
                   DEFAULT SCANNABLE TABLE (Exact 10 columns specified by User + Action)
                   Activity ID | Activity | Level | Area | Discipline | Start | Finish | Progress | Status | Variance | Action
                   ----------------------------------------------------------------- */
                <table className="w-full min-w-[960px] text-left text-sm border-collapse">
                  <thead className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-semibold text-[11px] sm:text-xs uppercase tracking-wider select-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
                          className={`h-11 border-b border-[#E5E9EE] hover:bg-[#F4F7FA] cursor-pointer transition-colors group ${
                            activityDrawerActivityId === row.id
                              ? 'bg-[#EDF5F8] border-l-2 border-l-[#176B87]'
                              : row.isCritical && isSlipped
                              ? 'bg-[#FFF9F8] border-l-2 border-l-[#B5473C]'
                              : ''
                          }`}
                        >
                          {/* 1. Activity ID */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <span className="font-mono font-semibold text-xs text-[#176B87] group-hover:underline">
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
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#E5E9EE] text-[#596579] hover:text-[#172033] transition-colors -ml-1 shrink-0"
                                    title={isExpanded ? `Collapse ${row.wbsLevel}` : `Expand ${row.wbsLevel}`}
                                    aria-label={`Toggle ${row.id}`}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#596579]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-[#596579]" />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="w-5 h-5 flex items-center justify-center font-mono text-[13px] text-[#7B8798] select-none shrink-0 -ml-1"
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
                                )} group-hover:text-[#176B87] transition-colors truncate max-w-sm`}
                                title={row.name}
                              >
                                {row.name}
                              </span>

                              {row.isCritical && (
                                <span className="text-[11px] font-mono text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-1.5 py-0.5 rounded font-semibold shrink-0">
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
                          <td className="py-2 px-4 align-middle whitespace-nowrap text-[13px] text-[#596579] truncate max-w-[160px]" title={row.area}>
                            {row.area}
                          </td>

                          {/* 5. Discipline */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#F1F3F5] border border-[#D9DEE5] rounded text-[11px] text-[#172033] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 6. Start (Planned Start Date) */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap font-mono text-xs text-[#596579]">
                            {row.plannedStart}
                          </td>

                          {/* 7. Finish (Planned Finish Date) */}
                          <td className="py-2 px-4 align-middle whitespace-nowrap font-mono text-xs text-[#172033] font-medium">
                            {row.plannedFinish}
                          </td>

                          {/* 8. Progress */}
                          <td className="py-2 px-4 align-middle">
                            <div className="space-y-1 w-28">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-[#172033]">{row.actualProgress}%</span>
                                <WhyButton
                                  variant="subtle"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openWhyExplanation(`progress:${row.id}`, row.id);
                                  }}
                                  title={`Why is progress ${row.actualProgress}%?`}
                                />
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
                              className="px-3 py-1 text-xs font-medium text-[#176B87] hover:bg-[#EDF5F8] border border-[#C5D9E2] rounded-md transition-colors inline-flex items-center gap-1"
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
                  <thead className="sticky top-0 z-20 bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-semibold text-[11px] sm:text-xs uppercase tracking-wider select-none shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
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
                          className={`h-11 border-b border-[#E5E9EE] hover:bg-[#F4F7FA] cursor-pointer transition-colors group ${
                            activityDrawerActivityId === row.id
                              ? 'bg-[#EDF5F8] border-l-2 border-l-[#176B87]'
                              : row.isCritical && isSlipped
                              ? 'bg-[#FFF9F8] border-l-2 border-l-[#B5473C]'
                              : ''
                          }`}
                        >
                          {/* 1. Activity ID */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-[#176B87] group-hover:underline">
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
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#E5E9EE] text-[#596579] hover:text-[#172033] transition-colors -ml-1 shrink-0"
                                    title={isExpanded ? `Collapse ${row.wbsLevel}` : `Expand ${row.wbsLevel}`}
                                    aria-label={`Toggle ${row.id}`}
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-3.5 h-3.5 text-[#596579]" />
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-[#596579]" />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="w-5 h-5 flex items-center justify-center font-mono text-[13px] text-[#7B8798] select-none shrink-0 -ml-1"
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
                                )} group-hover:text-[#176B87] transition-colors truncate max-w-xs`}
                                title={row.name}
                              >
                                {row.name}
                              </span>
                              {row.isCritical && (
                                <span className="text-[11px] font-mono text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] px-1.5 py-0.5 rounded font-semibold shrink-0">
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
                            <span className="font-mono text-xs text-[#596579] font-medium">{row.wbs}</span>
                          </td>

                          {/* 5. Area */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap text-[#596579] truncate max-w-[140px]" title={row.area}>
                            {row.area}
                          </td>

                          {/* 6. Discipline */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-[#F1F3F5] border border-[#D9DEE5] rounded text-[11px] text-[#172033] font-medium">
                              {row.discipline}
                            </span>
                          </td>

                          {/* 7. Planned Start */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs text-[#596579]">
                            {row.plannedStart}
                          </td>

                          {/* 8. Planned Finish */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs text-[#172033] font-medium">
                            {row.plannedFinish}
                          </td>

                          {/* 9. Actual Start */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs">
                            {row.actualStart ? (
                              <span className="text-[#172033]">{row.actualStart}</span>
                            ) : (
                              <span className="text-[#7B8798] italic">-</span>
                            )}
                          </td>

                          {/* 10. Actual Finish */}
                          <td className="py-2 px-3 align-middle whitespace-nowrap font-mono text-xs">
                            {row.actualFinish ? (
                              <span className="text-[#2E7D5B] font-semibold">{row.actualFinish}</span>
                            ) : row.actualStart ? (
                              <span className="text-[#176B87] italic">In Progress</span>
                            ) : (
                              <span className="text-[#7B8798] italic">-</span>
                            )}
                          </td>

                          {/* 11. Progress */}
                          <td className="py-2 px-3 align-middle">
                            <div className="space-y-1 w-28">
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
                                <span className="text-[#596579]">
                                  Pred: <strong className="text-[#176B87]">{row.predecessors.join(', ')}</strong>
                                </span>
                              ) : (
                                <span className="text-[#7B8798] italic">No Predecessors</span>
                              )}
                              {row.successors.length > 0 && (
                                <span className="text-[#7B8798]">Succ: {row.successors.join(', ')}</span>
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
            <div className="px-4 py-3 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#596579] gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span>Version: <strong className="font-mono text-[#172033]">Rev 3.2 (P6 XML)</strong></span>
                <span>•</span>
                <span>Visible Nodes: <strong className="text-[#172033] font-mono">{displayActivities.length}</strong></span>
                <span>•</span>
                <span className="font-medium text-[#176B87]">
                  View: {viewMode === 'operational' ? 'Standard Schedule (10 cols)' : 'Full P6 Matrix (14 cols)'}
                </span>
              </div>
              <div className="text-[11px] text-[#7B8798]">
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
              <span className="text-[11px] text-[#596579] font-mono">
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
                    className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded-lg"
                  >
                    Restart
                  </button>
                )}
                {importStep === 8 ? (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg"
                  >
                    Done &amp; View Schedule
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-4 py-1.5 text-xs text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded-lg"
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
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-center text-[10px] font-mono">
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
                        ? 'bg-[#176B87] text-white font-bold'
                        : isPassed
                        ? 'bg-[#EDF7F2] text-[#2E7D5B] font-semibold'
                        : 'text-[#7B8798]'
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
                <div className="border-2 border-dashed border-[#D9DEE5] hover:border-[#176B87] rounded-lg p-6 text-center bg-[#F7F8FA] transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-[#176B87] mx-auto mb-2" />
                  <p className="font-semibold text-sm text-[#172033]">
                    Select or drag Primavera P6 baseline XML schedule file
                  </p>
                  <p className="text-[11px] text-[#596579] mt-0.5">
                    Supports Primavera P6 XML (.xml), Primavera XER (.xer), or Microsoft Project (.xml)
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFileChosen('OIL_DUL_BASELINE_REV4.0.xml', false)}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
                    >
                      Select Sample Primavera P6 XML File
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFileChosen('OIL_DUL_CORRUPT_SAMPLE.xml', true)}
                      className="px-4 py-2 text-xs font-medium text-[#B5473C] bg-white border border-[#E4B0AA] hover:bg-[#FBEFEE] rounded-lg"
                    >
                      Test with Validation Errors
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#EDF5F8] rounded-lg border border-[#B3CBE0] text-xs text-[#176B87] flex items-start gap-2">
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
                <div className="flex items-center gap-2 text-sm font-medium text-[#172033]">
                  <Loader2 className="w-4 h-4 text-[#176B87] animate-spin shrink-0" />
                  <span>Loading schedule...</span>
                </div>
                <p className="text-xs text-[#596579]">Streaming {selectedFile} to baseline ingestion service...</p>
              </div>
            )}

            {/* STAGE 3: PROCESSING */}
            {importStep === 3 && (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-medium text-[#172033]">
                  <Loader2 className="w-4 h-4 text-[#176B87] animate-spin shrink-0" />
                  <span>Processing WBS hierarchy...</span>
                </div>
                <p className="text-xs text-[#596579]">
                  Parsing WBS tree, inspecting predecessor networks, and reading activity calendars...
                </p>
              </div>
            )}

            {/* STAGE 4: VALIDATION */}
            {importStep === 4 && (
              <div className="p-8 flex flex-col items-center justify-center gap-2 text-center" role="status" aria-live="polite">
                <div className="flex items-center gap-2 text-sm font-medium text-[#172033]">
                  <Loader2 className="w-4 h-4 text-[#176B87] animate-spin shrink-0" />
                  <span>Validating schedule integrity...</span>
                </div>
                <p className="text-xs text-[#596579]">
                  Checking date chronological sequences, circular logic loops, and WBS parent resolution...
                </p>
              </div>
            )}

            {/* STAGE 5: ERROR REPORT (Validation errors identifying: Row, Column, Problem, Correction) */}
            {importStep === 5 && (
              <div className="space-y-3">
                <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg text-xs text-[#B5473C]">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>Validation Error Report ({importErrors.length} Issues Identified)</span>
                  </div>
                  <p className="text-[11px] text-[#596579]">
                    Validation errors must identify Row, Column, Problem, and Correction. Fix these issues in Primavera P6 or choose a corrected file.
                  </p>
                </div>

                {/* Canonical Error Report Table */}
                <div className="border border-[#E4B0AA] rounded-lg overflow-x-auto bg-white shadow-xs">
                  <table className="w-full min-w-[500px] text-left text-sm border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#FAF2F1]">
                      <tr className="bg-[#FAF2F1] border-b border-[#E4B0AA] text-[#B5473C] font-semibold text-[11px] sm:text-xs uppercase tracking-wider h-11">
                        <th className="py-3 px-4 whitespace-nowrap">Row</th>
                        <th className="py-3 px-4 whitespace-nowrap">Column</th>
                        <th className="py-3 px-4">Problem</th>
                        <th className="py-3 px-4">Correction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0D5D2] text-[14px]">
                      {importErrors.map((err, idx) => (
                        <tr key={idx} className="h-11 sm:h-12 hover:bg-[#FFF9F8]">
                          <td className="py-3 px-4 font-mono font-semibold text-[#172033]">{err.row}</td>
                          <td className="py-3 px-4 font-medium text-[#172033]">{err.column}</td>
                          <td className="py-3 px-4 text-[#B5473C]">{err.problem}</td>
                          <td className="py-3 px-4 text-[#2E7D5B] font-mono text-[12px]">{err.correction}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-[#596579]">
                    You cannot commit a baseline with active integrity errors.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleFileChosen('OIL_DUL_FIXED_BASELINE.xml', false)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
                  >
                    Re-Validate with Corrected File →
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 6: PREVIEW */}
            {importStep === 6 && (
              <div className="space-y-4">
                <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg text-xs text-[#2E7D5B] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">Schedule Baseline Analysis Verified &amp; Ready for Preview</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
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

                <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs space-y-1">
                  <span className="font-bold text-[#172033] block">Import Metadata Summary:</span>
                  <p className="text-[#596579]">
                    File: <strong className="text-[#172033] font-mono">{selectedFile}</strong> · Source: <strong className="text-[#172033]">Primavera P6 XML</strong> · Data Date: <strong className="text-[#172033]">18 Sep 2026</strong>
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(7)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
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
                    placeholder="e.g. V4 · Rev 4.0"
                    className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-lg font-mono text-[#172033] outline-none"
                    required
                  />
                  {versionOverwriteError && (
                    <div className="p-3 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg text-[11px] text-[#B5473C] mt-2 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{versionOverwriteError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Revision Notes / Reason for Baseline Adjustment
                  </label>
                  <textarea
                    rows={3}
                    value={newVersionNotes}
                    onChange={(e) => setNewVersionNotes(e.target.value)}
                    placeholder="e.g. Approved recovery baseline reflecting revised compressor foundation delivery and resequenced piping joints."
                    className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-lg text-[#172033] outline-none"
                  />
                </div>

                <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#D9DEE5] text-[11px] text-[#596579]">
                  <strong className="text-[#172033] block mb-0.5">Version Lineage Governance:</strong>
                  Version {currentOperationalVersion.label} will be safely archived as <strong>Previous</strong>. The new version will be set as <strong>Current</strong>.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setImportStep(6)}
                    className="px-4 py-1.5 text-xs text-[#596579] border border-[#D9DEE5] rounded-lg"
                  >
                    Back to Preview
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
                  >
                    Create Version &amp; Activate Baseline
                  </button>
                </div>
              </form>
            )}

            {/* STAGE 8: COMPLETE */}
            {importStep === 8 && (
              <div className="p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#2E7D5B] mx-auto" />
                <h4 className="text-base font-bold text-[#172033]">
                  Schedule Version Activated Successfully
                </h4>
                <p className="text-xs text-[#596579] max-w-sm mx-auto">
                  Baseline version <strong>{newVersionCode}</strong> is now the active operational baseline. Previous version has been safely archived in the lineage history.
                </p>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg font-mono text-xs text-[#172033] inline-block">
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
