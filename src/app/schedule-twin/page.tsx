'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { VarianceBadge } from '../../components/shared/VarianceBadge';
import { Modal } from '../../components/shared/Modal';
import {
  ScheduleActivity,
  ExecutionEvent,
  EvidenceItem,
  WBSLevel,
} from '../../types';
import {
  MOCK_EXECUTION_EVENTS,
  MOCK_EVIDENCE_ITEMS,
} from '../../lib/api/mockData';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../lib/domain/canonicalModels';
import {
  Calendar,
  Layers,
  ChevronRight,
  ChevronDown,
  Search,
  Maximize2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Camera,
  MapPin,
  Eye,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

// Authoritative Data Date for PLnEX master schedule
const DATA_DATE_STR = '2026-09-18';
const DATA_DATE = new Date(DATA_DATE_STR + 'T00:00:00Z');

// Complete L1 to L6 Schedule Hierarchy with full Planned, Actual, and Forecast data
interface TwinActivityItem extends ScheduleActivity {
  levelNum: number;
  forecastStart: string;
  forecastFinish: string;
  forecastVarianceDays: number;
  childrenIds?: string[];
}

const TWIN_ACTIVITIES_RAW: TwinActivityItem[] = [
  // L1: Project Root
  {
    id: 'PRJ-OIL-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Duliajan Gas Processing & Pipeline Interconnect',
    wbs: '1.0',
    wbsLevel: 'L1',
    levelNum: 1,
    discipline: 'Piping',
    area: 'Entire Field Asset',
    plannedStart: '2026-08-01',
    plannedFinish: '2026-12-15',
    actualStart: '2026-08-01',
    actualFinish: '',
    forecastStart: '2026-08-01',
    forecastFinish: '2026-12-19',
    forecastVarianceDays: 4,
    plannedProgress: 80,
    actualProgress: 73,
    plannedQuantity: 1,
    actualQuantity: 0.73,
    unit: 'project',
    variance: -7,
    status: 'at-risk',
    delayDays: 4,
    predecessors: [],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Rajesh Sharma',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Overall capital investment project master baseline hierarchy',
    parentId: undefined,
    childrenIds: ['AREA-100'],
  },
  // L2: Area
  {
    id: 'AREA-100',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Unit A - Gas Processing & Compression Area',
    wbs: '1.1',
    wbsLevel: 'L2',
    levelNum: 2,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-08-15',
    plannedFinish: '2026-11-30',
    actualStart: '2026-08-15',
    actualFinish: '',
    forecastStart: '2026-08-15',
    forecastFinish: '2026-12-02',
    forecastVarianceDays: 2,
    plannedProgress: 78,
    actualProgress: 72,
    plannedQuantity: 1,
    actualQuantity: 0.72,
    unit: 'facility',
    variance: -6,
    status: 'at-risk',
    delayDays: 2,
    predecessors: [],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Gas dehydration, condensate stabilization, and main header area',
    parentId: 'PRJ-OIL-01',
    childrenIds: ['DISC-CIV-1', 'DISC-PIP-3', 'DISC-MEC-4', 'DISC-ELE-5', 'DISC-INS-6'],
  },
  // L3: Civil Infrastructure
  {
    id: 'DISC-CIV-1',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Civil & Structural Infrastructure Works',
    wbs: '1.1.2',
    wbsLevel: 'L3',
    levelNum: 3,
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-08-20',
    plannedFinish: '2026-10-15',
    actualStart: '2026-08-20',
    actualFinish: '',
    forecastStart: '2026-08-20',
    forecastFinish: '2026-10-15',
    forecastVarianceDays: 0,
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
    childrenIds: ['WP-CIV-01'],
  },
  // L4: Civil Work Package
  {
    id: 'WP-CIV-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Equipment Foundation Packages & Plinths',
    wbs: '1.1.2.1',
    wbsLevel: 'L4',
    levelNum: 4,
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-01',
    actualFinish: '',
    forecastStart: '2026-09-01',
    forecastFinish: '2026-09-20',
    forecastVarianceDays: 0,
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
    childrenIds: ['CIV-11-001'],
  },
  // L5: Civil Activity
  {
    id: 'CIV-11-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Foundation Block A - Compressor Pedestal Pour',
    wbs: '1.1.2.1.1',
    wbsLevel: 'L5',
    levelNum: 5,
    discipline: 'Civil',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    actualStart: '2026-09-05',
    actualFinish: '2026-09-14',
    forecastStart: '2026-09-05',
    forecastFinish: '2026-09-14',
    forecastVarianceDays: 0,
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
    executionEventIds: ['EVT-2026-003'],
    description: 'Reinforced concrete foundation pedestal for 3.5MW compressor package',
    parentId: 'WP-CIV-01',
  },
  // L3: Piping Systems
  {
    id: 'DISC-PIP-3',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Piping Systems & Interconnecting Piperacks',
    wbs: '1.1.3',
    wbsLevel: 'L3',
    levelNum: 3,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-01',
    plannedFinish: '2026-10-31',
    actualStart: '2026-09-01',
    actualFinish: '',
    forecastStart: '2026-09-01',
    forecastFinish: '2026-11-02',
    forecastVarianceDays: 2,
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
    childrenIds: ['WP-3.2'],
  },
  // L4: Piping Work Package
  {
    id: 'WP-3.2',
    projectId: 'PRJ-OIL-2026-01',
    name: 'High-Pressure Header Piping Package (Line 24-XX)',
    wbs: '1.1.3.2',
    wbsLevel: 'L4',
    levelNum: 4,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-25',
    actualStart: '2026-09-11',
    actualFinish: '',
    forecastStart: '2026-09-11',
    forecastFinish: '2026-09-27',
    forecastVarianceDays: 2,
    plannedProgress: 80,
    actualProgress: 68,
    plannedQuantity: 24,
    actualQuantity: 16.3,
    unit: 'joints',
    variance: -12,
    status: 'delayed',
    delayDays: 2,
    predecessors: ['WP-CIV-01'],
    successors: [],
    isCritical: true,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-002', 'EVD-004'],
    executionEventIds: ['EVT-2026-001', 'EVT-2026-002'],
    description: 'Complete 24-inch gas gathering header line from wellhead pad to slug catcher',
    parentId: 'DISC-PIP-3',
    childrenIds: ['PIP-24-001', 'PIP-24-002', 'PIP-24-003'],
  },
  // L5: Piping Activity 1
  {
    id: 'PIP-24-001',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    levelNum: 5,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-17',
    forecastStart: '2026-09-11',
    forecastFinish: '2026-09-17',
    forecastVarianceDays: 2,
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
    childrenIds: ['SUB-24-01', 'SUB-24-02'],
  },
  // L6: Sub-Activity 1
  {
    id: 'SUB-24-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Rigging & Spool Hoisting onto Piperack Section B',
    wbs: '1.1.3.2.1.1',
    wbsLevel: 'L6',
    levelNum: 6,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-13',
    actualStart: '2026-09-11',
    actualFinish: '2026-09-14',
    forecastStart: '2026-09-11',
    forecastFinish: '2026-09-14',
    forecastVarianceDays: 1,
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
    levelNum: 6,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-14',
    plannedFinish: '2026-09-15',
    actualStart: '2026-09-15',
    actualFinish: '2026-09-17',
    forecastStart: '2026-09-15',
    forecastFinish: '2026-09-17',
    forecastVarianceDays: 2,
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
    levelNum: 5,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-20',
    actualStart: '2026-09-16',
    actualFinish: '',
    forecastStart: '2026-09-16',
    forecastFinish: '2026-09-22',
    forecastVarianceDays: 2,
    plannedProgress: 85,
    actualProgress: 70,
    plannedQuantity: 12,
    actualQuantity: 8.4,
    unit: 'joints',
    variance: -15,
    status: 'delayed',
    delayDays: 2,
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-04-015'],
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
    levelNum: 5,
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    actualStart: '',
    actualFinish: '',
    forecastStart: '2026-09-21',
    forecastFinish: '2026-09-24',
    forecastVarianceDays: 2,
    plannedProgress: 0,
    actualProgress: 0,
    plannedQuantity: 1,
    actualQuantity: 0,
    unit: 'test package',
    variance: 0,
    status: 'pending',
    delayDays: 2,
    predecessors: ['PIP-24-002'],
    successors: [],
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
    levelNum: 3,
    discipline: 'Mechanical',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-12',
    plannedFinish: '2026-11-15',
    actualStart: '2026-09-12',
    actualFinish: '',
    forecastStart: '2026-09-12',
    forecastFinish: '2026-11-15',
    forecastVarianceDays: 0,
    plannedProgress: 45,
    actualProgress: 42,
    plannedQuantity: 6,
    actualQuantity: 2.5,
    unit: 'skids',
    variance: -3,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['DISC-CIV-1'],
    successors: ['DISC-ELE-5'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-005'],
    executionEventIds: [],
    description: 'Gas compressors, condensate pumps, and chemical injection skids',
    parentId: 'AREA-100',
    childrenIds: ['WP-MEC-01'],
  },
  // L4: Mechanical Work Package
  {
    id: 'WP-MEC-01',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Gas Compressor Skid Packages & Driver Alignment',
    wbs: '1.1.4.1',
    wbsLevel: 'L4',
    levelNum: 4,
    discipline: 'Mechanical',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-10-10',
    actualStart: '2026-09-15',
    actualFinish: '',
    forecastStart: '2026-09-15',
    forecastFinish: '2026-10-10',
    forecastVarianceDays: 0,
    plannedProgress: 35,
    actualProgress: 30,
    plannedQuantity: 2,
    actualQuantity: 0.6,
    unit: 'trains',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['WP-CIV-01'],
    successors: ['WP-ELE-02'],
    isCritical: false,
    assignedEngineer: 'Debajit Borah',
    evidenceIds: ['EVD-005'],
    executionEventIds: [],
    description: 'Compressor train placement and preliminary motor driver coupling',
    parentId: 'DISC-MEC-4',
    childrenIds: ['MEC-08-003'],
  },
  // L5: Mechanical Activity
  {
    id: 'MEC-08-003',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Align Centrifugal Gas Compressor Skid A',
    wbs: '1.1.4.1.1',
    wbsLevel: 'L5',
    levelNum: 5,
    discipline: 'Mechanical',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-22',
    actualStart: '2026-09-16',
    actualFinish: '',
    forecastStart: '2026-09-16',
    forecastFinish: '2026-09-22',
    forecastVarianceDays: 0,
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
    evidenceIds: ['EVD-005'],
    executionEventIds: [],
    description: 'Laser alignment of high-pressure gas compressor train drive shaft and gearbox coupling',
    parentId: 'WP-MEC-01',
  },
  // L3: Electrical Discipline
  {
    id: 'DISC-ELE-5',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Electrical Infrastructure & Substation Power',
    wbs: '1.1.5',
    wbsLevel: 'L3',
    levelNum: 3,
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-11-20',
    actualStart: '2026-09-10',
    actualFinish: '',
    forecastStart: '2026-09-10',
    forecastFinish: '2026-11-20',
    forecastVarianceDays: 0,
    plannedProgress: 40,
    actualProgress: 38,
    plannedQuantity: 1,
    actualQuantity: 0.38,
    unit: 'substation',
    variance: -2,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['DISC-CIV-1'],
    successors: ['DISC-INS-6'],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: '11kV switchgear, transformer yard, and motor control centers (MCC)',
    parentId: 'AREA-100',
    childrenIds: ['WP-ELE-02'],
  },
  // L4: Electrical Work Package
  {
    id: 'WP-ELE-02',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Cable Tray Galleries & Power Feeders',
    wbs: '1.1.5.2',
    wbsLevel: 'L4',
    levelNum: 4,
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    plannedStart: '2026-09-14',
    plannedFinish: '2026-10-05',
    actualStart: '2026-09-14',
    actualFinish: '',
    forecastStart: '2026-09-14',
    forecastFinish: '2026-10-05',
    forecastVarianceDays: 0,
    plannedProgress: 45,
    actualProgress: 40,
    plannedQuantity: 1200,
    actualQuantity: 480,
    unit: 'meters',
    variance: -5,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['WP-MEC-01'],
    successors: ['WP-INS-03'],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Hot-dip galvanized ladder trays and HT feeder cable pulling',
    parentId: 'DISC-ELE-5',
    childrenIds: ['ELE-11-032'],
  },
  // L5: Electrical Activity
  {
    id: 'ELE-11-032',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Terminate 11kV Feeder Cable to Substation A',
    wbs: '1.1.5.2.1',
    wbsLevel: 'L5',
    levelNum: 5,
    discipline: 'Electrical',
    area: 'Unit A - Substation',
    plannedStart: '2026-09-17',
    plannedFinish: '2026-09-24',
    actualStart: '2026-09-17',
    actualFinish: '',
    forecastStart: '2026-09-17',
    forecastFinish: '2026-09-24',
    forecastVarianceDays: 0,
    plannedProgress: 35,
    actualProgress: 35,
    plannedQuantity: 3,
    actualQuantity: 1.05,
    unit: 'circuits',
    variance: 0,
    status: 'on-track',
    delayDays: 0,
    predecessors: ['MEC-08-003'],
    successors: ['INS-04-015'],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Termination of 3-core 240 sq.mm XLPE cables and high-voltage pothead assembly',
    parentId: 'WP-ELE-02',
  },
  // L3: Instrumentation Discipline
  {
    id: 'DISC-INS-6',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Instrumentation & Process Control Architecture',
    wbs: '1.1.6',
    wbsLevel: 'L3',
    levelNum: 3,
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-11-30',
    actualStart: '2026-09-15',
    actualFinish: '',
    forecastStart: '2026-09-15',
    forecastFinish: '2026-12-01',
    forecastVarianceDays: 1,
    plannedProgress: 20,
    actualProgress: 18,
    plannedQuantity: 1,
    actualQuantity: 0.18,
    unit: 'system',
    variance: -2,
    status: 'on-track',
    delayDays: 1,
    predecessors: ['DISC-PIP-3'],
    successors: [],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: 'Distributed control system (DCS), safety instrumented system (SIS), field transmitters',
    parentId: 'AREA-100',
    childrenIds: ['INS-04-015'],
  },
  // L5: Instrumentation Activity
  {
    id: 'INS-04-015',
    projectId: 'PRJ-OIL-2026-01',
    name: 'Calibrate Pressure Transmitter PT-2401 & Loop Check',
    wbs: '1.1.6.1.1',
    wbsLevel: 'L5',
    levelNum: 5,
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    plannedStart: '2026-09-21',
    plannedFinish: '2026-09-25',
    actualStart: '',
    actualFinish: '',
    forecastStart: '2026-09-22',
    forecastFinish: '2026-09-26',
    forecastVarianceDays: 1,
    plannedProgress: 0,
    actualProgress: 0,
    plannedQuantity: 4,
    actualQuantity: 0,
    unit: 'loops',
    variance: 0,
    status: 'pending',
    delayDays: 1,
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: [],
    isCritical: false,
    assignedEngineer: 'Sunil Gogoi',
    evidenceIds: [],
    executionEventIds: [],
    description: '5-point bench calibration and DCS loop verification of Rosemount 3051 transmitters',
    parentId: 'DISC-INS-6',
  },
];

// Timeline Date Conversion helper
function getDateOffsetPercent(dateStr: string, rangeStart: Date, rangeEnd: Date): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr + 'T00:00:00Z').getTime();
  const start = rangeStart.getTime();
  const end = rangeEnd.getTime();
  if (d <= start) return 0;
  if (d >= end) return 100;
  return ((d - start) / (end - start)) * 100;
}

export default function ScheduleTwinPage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();

  // Selected Activity State (Defaults to PIP-24-002 which shows rich Planned/Actual/Forecast variance)
  const [selectedActivityId, setSelectedActivityId] = useState<string>('PIP-24-002');
  const [selectedEvidenceForModal, setSelectedEvidenceForModal] = useState<EvidenceItem | null>(null);

  // Time Scale Mode: Full Project (5 Months) or Execution Window (60 Days)
  const [timeScaleMode, setTimeScaleMode] = useState<'execution' | 'full'>('execution');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'L1-L2' | 'L3' | 'L4' | 'L5-L6'>('all');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'PRJ-OIL-01': true,
    'AREA-100': true,
    'DISC-PIP-3': true,
    'WP-3.2': true,
    'PIP-24-001': true,
    'DISC-CIV-1': true,
    'WP-CIV-01': true,
    'DISC-MEC-4': true,
    'WP-MEC-01': true,
    'DISC-ELE-5': true,
    'WP-ELE-02': true,
    'DISC-INS-6': true,
  });

  const breadcrumbs = [
    { label: 'Schedule Controls' },
    { label: 'Schedule Twin', current: true },
  ];

  // Compute Active Time Window
  const { timelineStart, timelineEnd, timeAxisBands, weekTicks } = useMemo(() => {
    if (timeScaleMode === 'execution') {
      const start = new Date('2026-09-01T00:00:00Z');
      const end = new Date('2026-10-31T00:00:00Z');
      return {
        timelineStart: start,
        timelineEnd: end,
        timeAxisBands: [
          { label: 'September 2026', widthPct: 50 },
          { label: 'October 2026', widthPct: 50 },
        ],
        weekTicks: [
          { label: '1 Sep', pct: 0 },
          { label: '8 Sep', pct: 11.6 },
          { label: '15 Sep', pct: 23.3 },
          { label: '22 Sep', pct: 35.0 },
          { label: '29 Sep', pct: 46.6 },
          { label: '6 Oct', pct: 58.3 },
          { label: '13 Oct', pct: 70.0 },
          { label: '20 Oct', pct: 81.6 },
          { label: '27 Oct', pct: 93.3 },
        ],
      };
    }
    // Full project: Aug 1 to Dec 31 2026 (153 days)
    const start = new Date('2026-08-01T00:00:00Z');
    const end = new Date('2026-12-31T00:00:00Z');
    return {
      timelineStart: start,
      timelineEnd: end,
      timeAxisBands: [
        { label: 'August 2026', widthPct: 20.4 },
        { label: 'September 2026', widthPct: 19.7 },
        { label: 'October 2026', widthPct: 20.4 },
        { label: 'November 2026', widthPct: 19.7 },
        { label: 'December 2026', widthPct: 19.8 },
      ],
      weekTicks: [
        { label: '1 Aug', pct: 0 },
        { label: '15 Aug', pct: 9.2 },
        { label: '1 Sep', pct: 20.4 },
        { label: '15 Sep', pct: 29.6 },
        { label: '1 Oct', pct: 40.1 },
        { label: '15 Oct', pct: 49.3 },
        { label: '1 Nov', pct: 60.5 },
        { label: '15 Nov', pct: 69.7 },
        { label: '1 Dec', pct: 80.2 },
        { label: '15 Dec', pct: 89.4 },
        { label: '31 Dec', pct: 100 },
      ],
    };
  }, [timeScaleMode]);

  // Data date line percentage on active scale
  const dataDatePct = useMemo(() => {
    return getDateOffsetPercent(DATA_DATE_STR, timelineStart, timelineEnd);
  }, [timelineStart, timelineEnd]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return TWIN_ACTIVITIES_RAW.filter((item) => {
      if (criticalOnly && !item.isCritical) return false;
      if (levelFilter === 'L1-L2' && !['L1', 'L2'].includes(item.wbsLevel)) return false;
      if (levelFilter === 'L3' && item.wbsLevel !== 'L3') return false;
      if (levelFilter === 'L4' && item.wbsLevel !== 'L4') return false;
      if (levelFilter === 'L5-L6' && !['L5', 'L6'].includes(item.wbsLevel)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.wbs.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [criticalOnly, levelFilter, searchQuery]);

  // Selected Activity Object
  const selectedActivity: TwinActivityItem = useMemo(() => {
    const act = TWIN_ACTIVITIES_RAW.find((a) => a.id === selectedActivityId);
    return act || TWIN_ACTIVITIES_RAW[10]; // fallback to PIP-24-002
  }, [selectedActivityId]);

  // Linked Execution Events for selected activity
  const linkedEvents: ExecutionEvent[] = useMemo(() => {
    return MOCK_EXECUTION_EVENTS.filter(
      (e) =>
        e.matchedActivityId === selectedActivity.id ||
        selectedActivity.executionEventIds.includes(e.id)
    );
  }, [selectedActivity]);

  // Linked Evidence Items for selected activity
  const linkedEvidence: EvidenceItem[] = useMemo(() => {
    return MOCK_EVIDENCE_ITEMS.filter(
      (ev) =>
        ev.activityId === selectedActivity.id ||
        selectedActivity.evidenceIds.includes(ev.id) ||
        linkedEvents.some((e) => e.evidenceIds.includes(ev.id))
    );
  }, [selectedActivity, linkedEvents]);

  // Toggle tree node expansion
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Level Badge Helper (matching PLnEX calm neutral design system)
  const getLevelBadgeClass = (level: WBSLevel) => {
    if (level === 'L1') return 'bg-[#172033] text-white border-[#172033] font-bold';
    if (['L2', 'L3', 'L4', 'L5'].includes(level)) {
      return 'bg-[#F1F3F5] text-[#172033] border-[#D9DEE5] font-semibold';
    }
    return 'bg-white text-[#596579] border-[#D9DEE5] font-normal';
  };

  return (
    <StateWrapper>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbs} />

        {/* 1. TOP HEADER & METADATA BAR */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded bg-[#EDF5F8] flex items-center justify-center text-[#176B87]">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#172033] tracking-tight">
                    Schedule Twin — 2D Project-Control Timeline
                  </h1>
                </div>
              </div>
              <p className="text-xs text-[#596579]">
                Interactive correlation of Planned WBS Baseline, Verified Field Actuals, and Projected EAC Forecast.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="font-mono text-[#596579] bg-[#F7F8FA] px-2.5 py-1 rounded border border-[#D9DEE5]">
                BASELINE: {CANONICAL_SCHEDULE_VERSION_LABEL}
              </span>
              <span className="font-mono text-[#B5473C] font-semibold bg-[#FBEFEE] px-2.5 py-1 rounded border border-[#E4B0AA]">
                DATA DATE: 18 Sep 2026
              </span>
              <span className="font-mono text-[#172033] bg-[#F7F8FA] px-2.5 py-1 rounded border border-[#D9DEE5]">
                PROJECT: {activeProject.code}
              </span>
              <button
                type="button"
                onClick={() => openActivityDrawer(selectedActivity.id)}
                className="px-3 py-1 bg-[#176B87] hover:bg-[#135A72] text-white rounded font-medium inline-flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Activity Drawer</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. THREE CORE PROJECT-CONTROL SUMMARY CARDS (Planned, Actual, Forecast) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: What was planned? */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#176B87]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  1. What Was Planned?
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#176B87] font-semibold bg-[#EDF5F8] px-1.5 py-0.5 rounded border border-[#C5DCE6]">
                P6 Baseline
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl font-bold font-mono text-[#172033]">80.0%</span>
                <span className="text-[11px] text-[#596579] block">Target Baseline Progress</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-medium text-[#172033]">15 Dec 2026</span>
                <span className="text-[10px] text-[#7B8798] block">Planned Target Finish</span>
              </div>
            </div>
            <div className="p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-[11px] text-[#596579] space-y-0.5">
              <div>• Frozen Baseline: <strong>V3 · Rev 3.2</strong></div>
              <div>• Critical Path Duration: <strong>137 calendar days</strong></div>
            </div>
          </div>

          {/* Card 2: What actually happened? */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#2E7D5B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  2. What Actually Happened?
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#2E7D5B] font-semibold bg-[#EDF7F2] px-1.5 py-0.5 rounded border border-[#B8DCC9]">
                Verified As-Built
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl font-bold font-mono text-[#2E7D5B]">73.0%</span>
                <span className="text-[11px] text-[#596579] block">Verified Progress to Date</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#B5473C]">-7.0% Lag</span>
                <span className="text-[10px] text-[#7B8798] block">As of 18 Sep 2026</span>
              </div>
            </div>
            <div className="p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-[11px] text-[#596579] space-y-0.5">
              <div>• Field Observations: <strong>8 verified DPR entries</strong></div>
              <div>• Quality Verification: <strong>12 QA/QC evidence records</strong></div>
            </div>
          </div>

          {/* Card 3: What is forecast? */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#D98B32] border border-[#B5473C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  3. What Is Forecast?
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#B5473C] font-semibold bg-[#FBEFEE] px-1.5 py-0.5 rounded border border-[#E4B0AA]">
                Projected EAC
              </span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl font-bold font-mono text-[#B5473C]">19 Dec 2026</span>
                <span className="text-[11px] text-[#596579] block">Forecast Finish (+4d Slip)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#B5473C]">+2d Critical</span>
                <span className="text-[10px] text-[#7B8798] block">Line 24-XX Driving Delay</span>
              </div>
            </div>
            <div className="p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-[11px] text-[#596579] space-y-0.5">
              <div>• Critical Path Float: <strong>-2 days total float erosion</strong></div>
              <div>• Mitigation: <strong>Double welding crew shift from 20 Sep</strong></div>
            </div>
          </div>
        </div>

        {/* 3. TIMELINE TOOLBAR & CONTROLS */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Left: Search & Filter */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-[#7B8798] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by ID, Name, or WBS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#F7F8FA] border border-[#D9DEE5] rounded focus:border-[#176B87] outline-none"
              />
            </div>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="px-2.5 py-1 bg-[#F7F8FA] border border-[#D9DEE5] rounded text-xs text-[#172033] outline-none"
            >
              <option value="all">All WBS Levels</option>
              <option value="L1-L2">L1 &amp; L2 Summary</option>
              <option value="L3">L3 Disciplines</option>
              <option value="L4">L4 Work Packages</option>
              <option value="L5-L6">L5 &amp; L6 Activities</option>
            </select>

            <label className="flex items-center gap-1.5 cursor-pointer text-[#172033] select-none">
              <input
                type="checkbox"
                checked={criticalOnly}
                onChange={(e) => setCriticalOnly(e.target.checked)}
                className="rounded text-[#176B87] border-[#D9DEE5] focus:ring-0"
              />
              <span className="font-medium">Critical Path Only</span>
            </label>
          </div>

          {/* Right: Time Scale Selector & Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-[#D9DEE5] rounded overflow-hidden">
              <button
                type="button"
                onClick={() => setTimeScaleMode('execution')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeScaleMode === 'execution'
                    ? 'bg-[#176B87] text-white'
                    : 'bg-[#F7F8FA] text-[#596579] hover:bg-[#D9DEE5]'
                }`}
              >
                60-Day Lookahead (Sep–Oct)
              </button>
              <button
                type="button"
                onClick={() => setTimeScaleMode('full')}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeScaleMode === 'full'
                    ? 'bg-[#176B87] text-white'
                    : 'bg-[#F7F8FA] text-[#596579] hover:bg-[#D9DEE5]'
                }`}
              >
                Full Project (Aug–Dec)
              </button>
            </div>

            {/* Visual Legend */}
            <div className="flex items-center gap-3 font-mono text-[11px] text-[#596579] pl-2 border-l border-[#D9DEE5]">
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 bg-[#176B87] rounded-xs" />
                <span>P: Planned</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 bg-[#2E7D5B] rounded-xs" />
                <span>A: Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-2 bg-[#D98B32] border border-[#B5473C] rounded-xs" />
                <span>F: Forecast</span>
              </div>
              <div className="flex items-center gap-1 text-[#B5473C] font-semibold">
                <span className="w-1.5 h-3 bg-[#B5473C] rounded-xs" />
                <span>Data Date</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. 2D GANTT / TIMELINE VISUALIZATION TABLE */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
          <div className="overflow-x-auto min-w-[1040px]">
            {/* TIMELINE HEADER */}
            <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] select-none">
              {/* Left Column Header: WBS & Activity info */}
              <div className="w-[370px] flex-shrink-0 p-2.5 border-r border-[#D9DEE5] flex items-center justify-between text-xs font-bold text-[#172033]">
                <span>Activity &amp; WBS Hierarchy</span>
                <span className="text-[10px] font-mono text-[#596579]">
                  {filteredActivities.length} items
                </span>
              </div>

              {/* Dedicated Track Column Header (P / A / F) */}
              <div className="w-7 flex-shrink-0 border-r border-[#D9DEE5] p-2 text-center text-[10px] font-mono font-semibold text-[#596579]">
                Trk
              </div>

              {/* Right Column Header: Time Axis */}
              <div className="flex-1 relative">
                {/* Month bands */}
                <div className="flex border-b border-[#D9DEE5] text-[11px] font-bold text-[#172033]">
                  {timeAxisBands.map((band, idx) => (
                    <div
                      key={idx}
                      style={{ width: `${band.widthPct}%` }}
                      className="py-1 px-2 border-r border-[#D9DEE5] last:border-r-0 truncate text-center"
                    >
                      {band.label}
                    </div>
                  ))}
                </div>

                {/* Day/Week ticks */}
                <div className="h-6 relative text-[10px] font-mono text-[#596579]">
                  {weekTicks.map((tick, idx) => (
                    <div
                      key={idx}
                      style={{ left: `${tick.pct}%` }}
                      className="absolute top-1 -translate-x-1/2 whitespace-nowrap"
                    >
                      {tick.label}
                    </div>
                  ))}

                  {/* Top Data Date Badge - positioned right at Data Date */}
                  <div
                    style={{ left: `${dataDatePct}%` }}
                    className="absolute top-0.5 -translate-x-1/2 bg-[#B5473C] text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded shadow-xs z-20 pointer-events-none whitespace-nowrap"
                  >
                    Data Date
                  </div>
                </div>
              </div>
            </div>

            {/* TIMELINE ROWS CONTAINER */}
            <div className="divide-y divide-[#D9DEE5] relative max-h-[580px] overflow-y-auto">
              {/* Continuous Vertical Data Date Line */}
              <div
                style={{ left: `calc(398px + (calc(100% - 398px) * ${dataDatePct} / 100))` }}
                className="absolute top-0 bottom-0 w-0.5 bg-[#B5473C] z-10 pointer-events-none"
              />

              {filteredActivities.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#596579]">
                  No activities match the current filters.
                </div>
              ) : (
                filteredActivities.map((act) => {
                  const isSelected = act.id === selectedActivityId;
                  const hasChildren = Boolean(act.childrenIds && act.childrenIds.length > 0);

                  // Coordinate math for Planned, Actual, and Forecast bars
                  const plannedLeft = getDateOffsetPercent(act.plannedStart, timelineStart, timelineEnd);
                  const plannedRight = getDateOffsetPercent(act.plannedFinish, timelineStart, timelineEnd);
                  const plannedWidth = Math.max(1, plannedRight - plannedLeft);

                  // Actual bar
                  const hasStarted = Boolean(act.actualStart);
                  const isCompleted = act.status === 'completed' || Boolean(act.actualFinish);
                  const actualStartPct = getDateOffsetPercent(act.actualStart || act.plannedStart, timelineStart, timelineEnd);
                  const actualEndPct = isCompleted
                    ? getDateOffsetPercent(act.actualFinish || act.plannedFinish, timelineStart, timelineEnd)
                    : dataDatePct;
                  const actualWidth = Math.max(1, actualEndPct - actualStartPct);

                  // Forecast bar
                  const forecastStartPct = getDateOffsetPercent(act.forecastStart, timelineStart, timelineEnd);
                  const forecastEndPct = getDateOffsetPercent(act.forecastFinish, timelineStart, timelineEnd);
                  const forecastWidth = Math.max(1, forecastEndPct - forecastStartPct);

                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivityId(act.id)}
                      className={`flex cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EDF5F8]/60 ring-1 ring-inset ring-[#176B87]'
                          : 'hover:bg-[#F7F8FA]'
                      }`}
                    >
                      {/* Left Side: Activity Details */}
                      <div
                        className="w-[370px] flex-shrink-0 p-2 border-r border-[#D9DEE5] flex items-start gap-1.5 min-w-0"
                        style={{ paddingLeft: `${Math.max(6, (act.levelNum - 1) * 12 + 6)}px` }}
                      >
                        {/* Expand/Collapse or Leaf marker */}
                        {hasChildren ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleNode(act.id);
                            }}
                            className="w-4 h-4 mt-0.5 flex items-center justify-center rounded text-[#596579] hover:bg-[#D9DEE5] flex-shrink-0"
                          >
                            {expandedNodes[act.id] ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        ) : (
                          <span className="w-4 text-center font-mono text-[11px] text-[#7B8798] mt-0.5 flex-shrink-0">
                            └
                          </span>
                        )}

                        {/* WBS Level Badge */}
                        <span
                          className={`font-mono text-[9px] px-1 py-0.5 rounded flex-shrink-0 border ${getLevelBadgeClass(
                            act.wbsLevel
                          )}`}
                        >
                          {act.wbsLevel}
                        </span>

                        {/* Activity ID & Name */}
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[11px] font-bold text-[#172033]">
                              {act.id}
                            </span>
                            {act.isCritical && (
                              <span className="font-mono text-[8px] font-bold text-[#B5473C] bg-[#FBEFEE] px-1 rounded border border-[#E4B0AA]">
                                CRITICAL
                              </span>
                            )}
                            <StatusBadge status={act.status} size="sm" />
                          </div>
                          <div className="text-xs text-[#172033] font-medium truncate" title={act.name}>
                            {act.name}
                          </div>
                          <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#596579] mt-0.5">
                            <span>WBS {act.wbs}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{act.area}</span>
                            {act.delayDays > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-[#B5473C]">+{act.delayDays}d slip</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Middle: Dedicated Track Indicators (P / A / F) */}
                      <div className="w-7 flex-shrink-0 border-r border-[#D9DEE5] py-2 flex flex-col justify-between items-center text-[9px] font-mono font-bold select-none">
                        <span className="text-[#176B87]" title="Planned Baseline">P</span>
                        <span className="text-[#2E7D5B]" title="Actual As-Built">A</span>
                        <span className="text-[#D98B32]" title="Forecast EAC">F</span>
                      </div>

                      {/* Right Side: 2D Gantt Timeline Canvas */}
                      <div className="flex-1 relative py-2 px-1 h-[68px] flex flex-col justify-between overflow-hidden">
                        {/* Weekly grid guides */}
                        {weekTicks.map((tick, idx) => (
                          <div
                            key={idx}
                            style={{ left: `${tick.pct}%` }}
                            className="absolute top-0 bottom-0 w-px bg-[#F1F3F5] pointer-events-none"
                          />
                        ))}

                        {/* TRACK 1: PLANNED (Baseline P6) */}
                        <div className="relative h-3.5 w-full flex items-center">
                          <div
                            style={{
                              left: `${plannedLeft}%`,
                              width: `${plannedWidth}%`,
                            }}
                            className="absolute h-3.5 bg-[#176B87] border border-[#0E4355] rounded-xs flex items-center px-1 text-white text-[9px] font-mono truncate"
                            title={`Planned: ${act.plannedStart} → ${act.plannedFinish}`}
                          >
                            {plannedWidth >= 14 ? (
                              <span className="truncate">
                                {act.plannedStart} → {act.plannedFinish}
                              </span>
                            ) : null}
                          </div>
                          {plannedWidth < 14 && (
                            <span
                              style={{ left: `calc(${plannedLeft + plannedWidth}% + 4px)` }}
                              className="absolute text-[9px] font-mono text-[#176B87] whitespace-nowrap font-medium pointer-events-none"
                            >
                              {act.plannedStart} → {act.plannedFinish}
                            </span>
                          )}
                        </div>

                        {/* TRACK 2: ACTUAL (Verified As-Built) */}
                        <div className="relative h-3.5 w-full flex items-center">
                          {hasStarted ? (
                            <>
                              <div
                                style={{
                                  left: `${actualStartPct}%`,
                                  width: `${actualWidth}%`,
                                }}
                                className="absolute h-3.5 bg-[#2E7D5B] border border-[#1E563E] rounded-xs flex items-center px-1 text-white text-[9px] font-mono truncate"
                                title={`Actual: ${act.actualStart} → ${act.actualFinish || 'Data Date'} (${act.actualProgress}% verified)`}
                              >
                                {actualWidth >= 14 ? (
                                  <span className="truncate">
                                    {isCompleted
                                      ? `Done (${act.actualFinish})`
                                      : `${act.actualProgress}% Verified`}
                                  </span>
                                ) : null}
                              </div>
                              {actualWidth < 14 && (
                                <span
                                  style={{ left: `calc(${actualStartPct + actualWidth}% + 4px)` }}
                                  className="absolute text-[9px] font-mono text-[#2E7D5B] whitespace-nowrap font-medium pointer-events-none"
                                >
                                  {isCompleted ? `Done (${act.actualFinish})` : `${act.actualProgress}% Verified`}
                                </span>
                              )}
                            </>
                          ) : (
                            <div
                              style={{
                                left: `${plannedLeft}%`,
                                width: `${plannedWidth}%`,
                              }}
                              className="absolute h-3.5 border border-dashed border-[#D9DEE5] rounded-xs flex items-center px-1 text-[#7B8798] text-[9px] font-mono"
                            >
                              Not Started
                            </div>
                          )}
                        </div>

                        {/* TRACK 3: FORECAST (Projected EAC) */}
                        <div className="relative h-3.5 w-full flex items-center">
                          <div
                            style={{
                              left: `${forecastStartPct}%`,
                              width: `${forecastWidth}%`,
                            }}
                            className={`absolute h-3.5 rounded-xs flex items-center px-1 text-[9px] font-mono truncate ${
                              act.delayDays > 0
                                ? 'bg-[#FDF6ED] text-[#B5473C] border border-[#D98B32] font-bold'
                                : 'bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5]'
                            }`}
                            title={`Forecast: ${act.forecastStart} → ${act.forecastFinish} (${act.delayDays > 0 ? `+${act.delayDays}d slip` : '0d variance'})`}
                          >
                            {forecastWidth >= 14 ? (
                              <span className="truncate">
                                {act.forecastFinish} {act.delayDays > 0 ? `(+${act.delayDays}d)` : '(On-track)'}
                              </span>
                            ) : null}
                          </div>
                          {forecastWidth < 14 && (
                            <span
                              style={{ left: `calc(${forecastStartPct + forecastWidth}% + 4px)` }}
                              className={`absolute text-[9px] font-mono whitespace-nowrap font-medium pointer-events-none ${
                                act.delayDays > 0 ? 'text-[#B5473C]' : 'text-[#596579]'
                              }`}
                            >
                              {act.forecastFinish} {act.delayDays > 0 ? `(+${act.delayDays}d)` : '(On-track)'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 5. SELECTED ACTIVITY TWIN DEEP-DIVE CORRELATION PANEL */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold text-[#176B87] bg-[#EDF5F8] px-2.5 py-0.5 rounded border border-[#C5DCE6]">
                  {selectedActivity.id}
                </span>
                <span className="font-mono text-xs text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded border border-[#D9DEE5]">
                  WBS {selectedActivity.wbs} ({selectedActivity.wbsLevel})
                </span>
                <StatusBadge status={selectedActivity.status} size="sm" />
                {selectedActivity.isCritical && (
                  <span className="font-mono text-[10px] font-bold text-[#B5473C] bg-[#FBEFEE] px-1.5 py-0.5 rounded border border-[#E4B0AA]">
                    CRITICAL PATH
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#172033] mt-1">
                {selectedActivity.name}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {selectedActivity.delayDays > 0 && (
                <button
                  type="button"
                  onClick={() => openWhyExplanation('DELAY', selectedActivity.id)}
                  className="px-2.5 py-1 text-xs text-[#B5473C] bg-[#FBEFEE] hover:bg-[#F5DBD8] border border-[#E4B0AA] rounded font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Why Slipping?</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => openActivityDrawer(selectedActivity.id)}
                className="px-3 py-1 bg-[#176B87] hover:bg-[#135A72] text-white rounded text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open Detail Drawer</span>
              </button>
            </div>
          </div>

          {/* 3 Side-by-Side Deep-Dive Panels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Panel 1: What was planned? */}
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D9DEE5]">
                <span className="font-bold uppercase tracking-wider text-[#172033]">
                  1. What Was Planned?
                </span>
                <span className="font-mono text-[10px] text-[#176B87] font-semibold">P6 Baseline</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#596579]">Planned Dates:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.plannedStart} → {selectedActivity.plannedFinish}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Planned Scope:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.plannedQuantity} {selectedActivity.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Target Progress:</span>
                  <span className="font-bold text-[#172033]">{selectedActivity.plannedProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Total Float:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.isCritical ? '0d (Critical)' : '4d float'}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#596579] pt-1 border-t border-[#D9DEE5]">
                {selectedActivity.description}
              </p>
            </div>

            {/* Panel 2: What actually happened? */}
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D9DEE5]">
                <span className="font-bold uppercase tracking-wider text-[#172033]">
                  2. What Actually Happened?
                </span>
                <span className="font-mono text-[10px] text-[#2E7D5B] font-semibold">Field As-Built</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#596579]">Actual Start:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.actualStart || 'Not Started'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Actual Finish:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.actualFinish || 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Verified Progress:</span>
                  <span className="font-bold text-[#2E7D5B]">{selectedActivity.actualProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Executed Quantity:</span>
                  <span className="font-bold text-[#172033]">
                    {selectedActivity.actualQuantity} {selectedActivity.unit}
                  </span>
                </div>
              </div>

              {/* Linked Evidence Count */}
              <div className="pt-2 border-t border-[#D9DEE5] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#596579]">Linked QA/QC Evidence:</span>
                  <span className="font-mono font-bold text-[#172033]">
                    {linkedEvidence.length} items
                  </span>
                </div>
                {linkedEvidence.length > 0 && (
                  <div className="space-y-1">
                    {linkedEvidence.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className="p-1.5 bg-white border border-[#D9DEE5] rounded flex items-center justify-between text-[10px]"
                      >
                        <span className="truncate max-w-[170px] text-[#172033] font-medium">
                          {item.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedEvidenceForModal(item)}
                          className="text-[#176B87] hover:underline font-bold"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Panel 3: What is forecast? */}
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#D9DEE5]">
                <span className="font-bold uppercase tracking-wider text-[#172033]">
                  3. What Is Forecast?
                </span>
                <span className="font-mono text-[10px] text-[#B5473C] font-semibold">Projected EAC</span>
              </div>
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#596579]">Forecast Finish:</span>
                  <span className={`font-bold ${selectedActivity.delayDays > 0 ? 'text-[#B5473C]' : 'text-[#172033]'}`}>
                    {selectedActivity.forecastFinish}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Schedule Variance:</span>
                  <VarianceBadge daysDelay={selectedActivity.delayDays} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Float Erosion:</span>
                  <span className="font-bold text-[#B5473C]">
                    {selectedActivity.delayDays > 0 ? `-${selectedActivity.delayDays}d` : '0d'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#596579]">Successors:</span>
                  <span className="text-[#172033] truncate max-w-[150px]">
                    {selectedActivity.successors.join(', ') || 'None'}
                  </span>
                </div>
              </div>

              {selectedActivity.delayDays > 0 ? (
                <div className="p-2 bg-[#FBEFEE] border border-[#E4B0AA] rounded text-[11px] text-[#B5473C] mt-2">
                  <strong>Critical Float Erosion:</strong> A +{selectedActivity.delayDays}-day slip directly pushes downstream successor {selectedActivity.successors[0] || 'workfront'}.
                </div>
              ) : (
                <div className="p-2 bg-[#EDF7F2] border border-[#B8DCC9] rounded text-[11px] text-[#2E7D5B] mt-2">
                  <strong>On Schedule:</strong> Zero float erosion. Proceeding according to master baseline logic.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. EVIDENCE MODAL */}
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
                className="px-3 py-1.5 text-xs text-[#172033] bg-[#F7F8FA] hover:bg-[#D9DEE5] border border-[#D9DEE5] rounded"
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
