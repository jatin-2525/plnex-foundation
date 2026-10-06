'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Drawer } from '../../components/shared/Drawer';
import { Modal } from '../../components/shared/Modal';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { SCurveChart } from '../../components/shared/SCurveChart';
import { BarChart, LineChart, HorizontalBarChart } from '../../components/shared/charts';
import { DisciplineType } from '../../types';
import { WhyButton } from '../../components/shared/WhyButton';
import { CANONICAL_SCHEDULE_VERSION_LABEL } from '../../lib/domain/canonicalModels';
import { formatProjectDateTime, PROJECT_REPORT_DATE } from '../../lib/domain/dateUtils';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  History as HistoryIcon,
  ArrowRight,
  Search,
  Filter,
  Layers,
  Activity,
  FileText,
  Camera,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  ShieldCheck,
  Folder,
  HardHat,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  User,
  Hash,
  Lock,
  Target,
  MapPin,
} from 'lucide-react';

// Semantics per requirement: Positive, Neutral, Negative
export type VarianceSemantic = 'Positive' | 'Neutral' | 'Negative';

export type ActivityProgressStatus = 'Ahead' | 'On Track' | 'Behind' | 'Completed';

export interface ProgressHistoryStep {
  id: string;
  previousPercent: number;
  newPercent: number;
  deltaPercent: number;
  executionEventId: string;
  evidenceId: string;
  evidenceTitle: string;
  verifiedBy: string;
  timestamp: string;
  statement: string;
  auditHash: string;
}

export interface ProgressActivityRow {
  id: string; // e.g. "PIP-24-001"
  name: string;
  wbs: string;
  wbsLevel: string;
  discipline: DisciplineType;
  area: string;
  plannedPercent: number; // 0-100%
  actualPercent: number; // 0-100%
  variancePercent: number; // actual - planned
  varianceSemantic: VarianceSemantic;
  plannedFinish: string;
  forecastFinish: string;
  status: ActivityProgressStatus;
  lastVerifiedUpdate: string;
  assignedEngineer: string;
  isCritical: boolean;
  history: ProgressHistoryStep[];
  delayReasons?: string[];
  downstreamImpact?: string;
}

// Time series data points for the Main Chart: Planned vs Actual over time
export interface TimeSeriesPoint {
  period: string;
  dateLabel: string;
  planned: number;
  actual: number | null;
  forecast: number;
  isDataDate?: boolean;
  notes?: string;
}

const TIME_SERIES_DATA: TimeSeriesPoint[] = [
  { period: 'May 2026', dateLabel: '31 May 2026', planned: 12, actual: 12, forecast: 12, notes: 'Site mobilization & earthworks started' },
  { period: 'Jun 2026', dateLabel: '30 Jun 2026', planned: 28, actual: 30, forecast: 30, notes: 'Civil foundations ahead of schedule' },
  { period: 'Jul 2026', dateLabel: '31 Jul 2026', planned: 46, actual: 48, forecast: 48, notes: 'Compressor foundation block poured' },
  { period: 'Aug 2026', dateLabel: '31 Aug 2026', planned: 65, actual: 64, forecast: 64, notes: 'Piperack steel structure erected' },
  { period: '18 Sep 2026', dateLabel: '18 Sep 2026', planned: 80, actual: 73, forecast: 73, isDataDate: true, notes: 'Reporting Date: Line 24 welding delayed by rain' },
  { period: 'Oct 2026', dateLabel: '31 Oct 2026', planned: 92, actual: null, forecast: 88, notes: 'Forecast recovery with double shift RT inspection' },
  { period: 'Nov 2026', dateLabel: '30 Nov 2026', planned: 98, actual: null, forecast: 95, notes: 'Pre-commissioning hydrotests' },
  { period: 'Dec 2026', dateLabel: '15 Dec 2026', planned: 100, actual: null, forecast: 100, notes: 'Target commercial completion' },
];

// Data Models for Detailed Project-Control Analytics
export interface DisciplineProgressItem {
  discipline: DisciplineType;
  planned: number;
  actual: number;
  variance: number;
  weight: number; // % of total scope
  activitiesCount: number;
  status: 'Ahead' | 'On Track' | 'Behind';
  criticalLagDriver: string;
}

export const DISCIPLINE_PROGRESS_DATA: DisciplineProgressItem[] = [
  {
    discipline: 'Piping',
    planned: 82.0,
    actual: 68.0,
    variance: -14.0,
    weight: 35,
    activitiesCount: 64,
    status: 'Behind',
    criticalLagDriver: 'Line 24 field butt welding hold (4 joints pending RT) & weather delay on test manifold prep.',
  },
  {
    discipline: 'Civil',
    planned: 94.0,
    actual: 97.0,
    variance: 3.0,
    weight: 25,
    activitiesCount: 42,
    status: 'Ahead',
    criticalLagDriver: 'Compressor foundation pedestal (Block A) 45 m³ pour completed 6 hrs ahead of schedule.',
  },
  {
    discipline: 'Electrical',
    planned: 70.0,
    actual: 65.0,
    variance: -5.0,
    weight: 15,
    activitiesCount: 28,
    status: 'Behind',
    criticalLagDriver: '350m cable pull on TR-04 complete; overhead gallery bracket delivery delayed by 2 days.',
  },
  {
    discipline: 'Mechanical',
    planned: 75.0,
    actual: 78.0,
    variance: 3.0,
    weight: 15,
    activitiesCount: 30,
    status: 'Ahead',
    criticalLagDriver: 'Compressor C-101 laser alignment running ahead; Flare KO drum vessel positioned on pads.',
  },
  {
    discipline: 'Instrumentation',
    planned: 45.0,
    actual: 40.0,
    variance: -5.0,
    weight: 10,
    activitiesCount: 20,
    status: 'Behind',
    criticalLagDriver: 'Transmitter bracket installation held awaiting Line 24 hydrostatic test clearance sign-off.',
  },
];

export interface AreaProgressItem {
  area: string;
  code: string;
  planned: number;
  actual: number;
  variance: number;
  weight: number;
  isCriticalPath: boolean;
  totalFloatDays: number;
  status: 'Ahead' | 'On Track' | 'Behind';
  summary: string;
}

export const AREA_PROGRESS_DATA: AreaProgressItem[] = [
  {
    area: 'Unit A - Gas Processing',
    code: 'AREA-01',
    planned: 84.0,
    actual: 72.0,
    variance: -12.0,
    weight: 45,
    isCriticalPath: true,
    totalFloatDays: 0,
    status: 'Behind',
    summary: 'Directly on project critical path. Drives 85% of net project schedule lag due to Line 24 piping.',
  },
  {
    area: 'Unit A - Compressor Station',
    code: 'AREA-02',
    planned: 92.0,
    actual: 95.0,
    variance: 3.0,
    weight: 25,
    isCriticalPath: false,
    totalFloatDays: 8,
    status: 'Ahead',
    summary: 'Civil pedestal complete; mechanical alignment running smoothly with 8 days buffer float.',
  },
  {
    area: 'Unit B - Offsites & Utilities',
    code: 'AREA-03',
    planned: 65.0,
    actual: 60.0,
    variance: -5.0,
    weight: 15,
    isCriticalPath: false,
    totalFloatDays: 14,
    status: 'Behind',
    summary: 'Drainage piping completed; pipe support grouting ongoing. Ample float absorbs delay.',
  },
  {
    area: 'Unit 02 - Flare System',
    code: 'AREA-04',
    planned: 70.0,
    actual: 68.0,
    variance: -2.0,
    weight: 15,
    isCriticalPath: false,
    totalFloatDays: 20,
    status: 'Behind',
    summary: 'Flare KO drum vessel erected on foundation pads; anchor bolts aligned. Float absorbs delay.',
  },
];

export interface VarianceRootCauseItem {
  id: string;
  category: string;
  factor: string;
  varianceContribution: number;
  floatImpactDays: number;
  criticality: 'Critical Path' | 'Secondary Float' | 'Positive Gain';
  activityRef: string;
  mitigationPlan: string;
}

export const VARIANCE_ROOT_CAUSES: VarianceRootCauseItem[] = [
  {
    id: 'VRC-01',
    category: 'Quality & NDT',
    factor: 'Radiographic Testing Clearance Hold on Line 24 Field Welds',
    varianceContribution: -4.0,
    floatImpactDays: -3,
    criticality: 'Critical Path',
    activityRef: 'PIP-24-002 (Weld Line 24 Field Joints)',
    mitigationPlan: 'Mobilize dedicated evening shift RT inspection team on 20 Sep to clear 4 joints.',
  },
  {
    id: 'VRC-02',
    category: 'Procurement & Stores',
    factor: 'Stores Inspection Delay on 150 Bar High-Pressure Blind Flanges',
    varianceContribution: -3.0,
    floatImpactDays: -2,
    criticality: 'Critical Path',
    activityRef: 'PIP-24-003 (Hydrostatic Test Line 24)',
    mitigationPlan: 'Expedited QC store release note issued under priority concession authorization.',
  },
  {
    id: 'VRC-03',
    category: 'Environmental',
    factor: 'Monsoon Rain Squall Stoppage on Hydrotest Manifold Setup',
    varianceContribution: -2.0,
    floatImpactDays: -1,
    criticality: 'Secondary Float',
    activityRef: 'PIP-24-003 (Hydrostatic Test Line 24)',
    mitigationPlan: 'Waterproof habitat and all-weather canopy erected over the test manifold station.',
  },
  {
    id: 'VRC-04',
    category: 'Civil Productivity',
    factor: 'Continuous Transit Mixer RMC Pour on Compressor Pedestal',
    varianceContribution: 2.0,
    floatImpactDays: 2,
    criticality: 'Positive Gain',
    activityRef: 'CIV-11-001 (Foundation Block A)',
    mitigationPlan: 'Early handover to mechanical contractors for preliminary laser alignment tooling setup.',
  },
];

const MOCK_PROGRESS_ACTIVITIES: ProgressActivityRow[] = [
  {
    id: 'PIP-24-001',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedPercent: 100,
    actualPercent: 100,
    variancePercent: 0,
    varianceSemantic: 'Neutral',
    plannedFinish: '15 Sep 2026',
    forecastFinish: '15 Sep 2026',
    status: 'Completed',
    lastVerifiedUpdate: '14 Sep 2026: 12 spools erected with 75T mobile crane (Debajit Borah)',
    assignedEngineer: 'Debajit Borah',
    isCritical: true,
    history: [
      {
        id: 'H-01',
        previousPercent: 30,
        newPercent: 100,
        deltaPercent: 70,
        executionEventId: 'EVT-2026-001',
        evidenceId: 'EVD-001',
        evidenceTitle: 'IMG_20260914_Line24_Erect.jpg',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '14 Sep 2026, 17:15 IST',
        statement: 'Spool erection completed on Line 24. 12 spools erected today with crane support.',
        auditHash: '0x8f3c7d1e4a9b2c3d',
      },
      {
        id: 'H-02',
        previousPercent: 0,
        newPercent: 30,
        deltaPercent: 30,
        executionEventId: 'EVT-2026-000',
        evidenceId: 'EVD-000',
        evidenceTitle: 'STAGING_MANIFEST_RACK_B.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '10 Sep 2026, 09:00 IST',
        statement: 'Crane rigged at Piperack Section B. 4 initial spools staged and hoisted.',
        auditHash: '0x2a1b3c4d5e6f7a8b',
      },
    ],
  },
  {
    id: 'PIP-24-002',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedPercent: 85,
    actualPercent: 70,
    variancePercent: -15,
    varianceSemantic: 'Negative',
    plannedFinish: '20 Sep 2026',
    forecastFinish: '22 Sep 2026',
    status: 'Behind',
    lastVerifiedUpdate: '18 Sep 2026, 17:30 IST: 70% verified (65% as of 16 Sep) · Debajit Borah',
    assignedEngineer: 'Debajit Borah',
    isCritical: true,
    delayReasons: [
      'Predecessor spool erection finished 2 days late due to crane rigging hold',
      'Monsoon squall stoppage on 18 Sep from 11:30 to 13:00',
      'Radiographic inspection crew scheduled for night shift (8 welds pending RT)',
    ],
    downstreamImpact: 'Successor PIP-24-003 Hydrostatic Test postponed by 2 days; absorbs 1.5d float',
    history: [
      {
        id: 'H-03',
        previousPercent: 65,
        newPercent: 70,
        deltaPercent: 5,
        executionEventId: 'EVT-2026-002',
        evidenceId: 'EVD-004',
        evidenceTitle: 'IMG_20260918_WELD_BUTT_J05.jpg',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '18 Sep 2026, 17:30 IST',
        statement: '70% verified as of 18 Sep 2026. Joint J-05 completed. 8 open joints pending RT clearance.',
        auditHash: '0x5c8e9f2a1b3d4e6a',
      },
      {
        id: 'H-04',
        previousPercent: 20,
        newPercent: 65,
        deltaPercent: 45,
        executionEventId: 'EVT-2026-002',
        evidenceId: 'EVD-003',
        evidenceTitle: 'WELD_LOG_SHEET_SHIFT_A.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '16 Sep 2026, 17:30 IST (65% as of 16 Sep)',
        statement: '65% as of 16 Sep 2026. 4 butt welds completed on J-01 through J-04. Weld inspection memo logged.',
        auditHash: '0x3d4e5f6a7b8c9d0e',
      },
      {
        id: 'H-05',
        previousPercent: 0,
        newPercent: 20,
        deltaPercent: 20,
        executionEventId: 'EVT-2026-001',
        evidenceId: 'EVD-002',
        evidenceTitle: 'FIT_UP_INSPECTION_NOTE.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '14 Sep 2026, 08:30 IST',
        statement: 'Fit-up and tack welding initiated on Line 24 root joints.',
        auditHash: '0x1a2b3c4d5e6f7a8b',
      },
    ],
  },
  {
    id: 'CIV-11-001',
    name: 'Foundation Block A - Compressor Pedestal',
    wbs: '1.1.1.1.1',
    wbsLevel: 'L5',
    discipline: 'Civil',
    area: 'Unit A - Compressor Station',
    plannedPercent: 100,
    actualPercent: 100,
    variancePercent: 0,
    varianceSemantic: 'Neutral',
    plannedFinish: '14 Sep 2026',
    forecastFinish: '14 Sep 2026',
    status: 'Completed',
    lastVerifiedUpdate: '14 Sep 2026: 45 m³ concrete poured and certified (Debajit Borah)',
    assignedEngineer: 'Debajit Borah',
    isCritical: true,
    history: [
      {
        id: 'H-06',
        previousPercent: 50,
        newPercent: 100,
        deltaPercent: 50,
        executionEventId: 'EVT-2026-006',
        evidenceId: 'EVD-005',
        evidenceTitle: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '14 Sep 2026, 14:00 IST',
        statement: 'Foundation Block A reinforced concrete pour completed with RMC transit mixers.',
        auditHash: '0x9a8b7c6d5e4f3a2b',
      },
      {
        id: 'H-07',
        previousPercent: 0,
        newPercent: 50,
        deltaPercent: 50,
        executionEventId: 'EVT-2026-000',
        evidenceId: 'EVD-000',
        evidenceTitle: 'REBAR_INSPECTION_SIGN_OFF.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '08 Sep 2026, 17:00 IST',
        statement: 'Rebar reinforcement tying and foundation anchor bolt templates positioned.',
        auditHash: '0x4b3a2c1d0e9f8a7b',
      },
    ],
  },
  {
    id: 'MEC-08-003',
    name: 'Skid Alignment & Grouting for Compressor C-101',
    wbs: '1.1.2.4.1',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Unit A - Compressor Bay',
    plannedPercent: 20,
    actualPercent: 25,
    variancePercent: 5,
    varianceSemantic: 'Positive',
    plannedFinish: '24 Sep 2026',
    forecastFinish: '23 Sep 2026',
    status: 'Ahead',
    lastVerifiedUpdate: '17 Sep 2026: Laser alignment preliminary run completed (Debajit Borah)',
    assignedEngineer: 'Debajit Borah',
    isCritical: false,
    history: [
      {
        id: 'H-08',
        previousPercent: 0,
        newPercent: 25,
        deltaPercent: 25,
        executionEventId: 'EVT-2026-009',
        evidenceId: 'EVD-008',
        evidenceTitle: 'LASER_ALIGNMENT_TICKET_C101.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '17 Sep 2026, 15:30 IST',
        statement: 'Laser alignment tooling set up on pedestal. Shimming commenced early.',
        auditHash: '0x7e8f9a0b1c2d3e4f',
      },
    ],
  },
  {
    id: 'ELE-11-032',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Unit A - Overhead Gallery',
    plannedPercent: 50,
    actualPercent: 40,
    variancePercent: -10,
    varianceSemantic: 'Negative',
    plannedFinish: '23 Sep 2026',
    forecastFinish: '25 Sep 2026',
    status: 'Behind',
    lastVerifiedUpdate: '17 Sep 2026: 45 meters ladder tray mounted on gallery steel (Voice Agent)',
    assignedEngineer: 'Debajit Borah',
    isCritical: false,
    delayReasons: ['Gallery structural steel bracket delivery delayed by 2 days'],
    history: [
      {
        id: 'H-09',
        previousPercent: 20,
        newPercent: 40,
        deltaPercent: 20,
        executionEventId: 'EVT-2026-003',
        evidenceId: 'EVD-009',
        evidenceTitle: 'VOICE_TRANSCRIPT_LOG_VA_032.txt',
        verifiedBy: 'Supervisor Voice Note',
        timestamp: '17 Sep 2026, 16:00 IST',
        statement: 'Cable ladder tray installation done from sub to comp bay about 45 meters.',
        auditHash: '0x2c3d4e5f6a7b8c9d',
      },
      {
        id: 'H-10',
        previousPercent: 0,
        newPercent: 20,
        deltaPercent: 20,
        executionEventId: 'EVT-2026-000',
        evidenceId: 'EVD-000',
        evidenceTitle: 'BRACKET_MOUNTING_DIARY.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '15 Sep 2026, 11:00 IST',
        statement: 'Overhead cantilever bracket installation along gallery column line 4.',
        auditHash: '0x5a6b7c8d9e0f1a2b',
      },
    ],
  },
  {
    id: 'ELE-06-004',
    name: 'Pull Cable Tray TR-04 Main Feeder',
    wbs: '4.1.2',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Substation to Rack 2',
    plannedPercent: 60,
    actualPercent: 70,
    variancePercent: 10,
    varianceSemantic: 'Positive',
    plannedFinish: '22 Sep 2026',
    forecastFinish: '20 Sep 2026',
    status: 'Ahead',
    lastVerifiedUpdate: '18 Sep 2026: 350 meters HT cable pulled through tray TR-04 (Debajit Borah)',
    assignedEngineer: 'Debajit Borah',
    isCritical: false,
    history: [
      {
        id: 'H-11',
        previousPercent: 35,
        newPercent: 70,
        deltaPercent: 35,
        executionEventId: 'EVT-2026-010',
        evidenceId: 'EVD-010',
        evidenceTitle: 'CABLE_PULL_TENSION_CHART.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '18 Sep 2026, 15:00 IST',
        statement: '350 meters HT power cable pulled smoothly with motorized winch.',
        auditHash: '0x8b9c0d1e2f3a4b5c',
      },
    ],
  },
  {
    id: 'PIP-24-003',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Test Manifold',
    plannedPercent: 40,
    actualPercent: 0,
    variancePercent: -40,
    varianceSemantic: 'Negative',
    plannedFinish: '22 Sep 2026',
    forecastFinish: '26 Sep 2026',
    status: 'Behind',
    lastVerifiedUpdate: '18 Sep 2026: Preparation halted due to weather & blind flange hold',
    assignedEngineer: 'Debajit Borah',
    isCritical: true,
    delayReasons: [
      'Predecessor PIP-24-002 field butt welding incomplete (open joints pending RT)',
      '150 bar high-pressure blind test flanges not yet released from stores',
      'Monsoon rain squall delayed test manifold pressurization setup',
    ],
    downstreamImpact: 'Critical path commission hold: delay of +4 days propagates to pre-commissioning',
    history: [
      {
        id: 'H-12',
        previousPercent: 0,
        newPercent: 0,
        deltaPercent: 0,
        executionEventId: 'EVT-2026-005',
        evidenceId: 'EVD-007',
        evidenceTitle: 'DELAY_NOTICE_WEATHER_STATION.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '18 Sep 2026, 13:15 IST',
        statement: 'Hydrostatic test prep paused at 11:30. Stoppage notice issued.',
        auditHash: '0x4f5a6b7c8d9e0f1a',
      },
    ],
  },
  {
    id: 'INS-04-015',
    name: 'Mount Pressure & Temperature Transmitters Unit A',
    wbs: '6.2.1',
    wbsLevel: 'L5',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing',
    plannedPercent: 0,
    actualPercent: 0,
    variancePercent: 0,
    varianceSemantic: 'Neutral',
    plannedFinish: '28 Sep 2026',
    forecastFinish: '30 Sep 2026',
    status: 'On Track',
    lastVerifiedUpdate: 'Pending predecessor completion (Scheduled start 22 Sep)',
    assignedEngineer: 'Debajit Borah',
    isCritical: true,
    history: [],
  },
  {
    id: 'MEC-02-008',
    name: 'Erect & Align Flare K.O. Drum Vessel',
    wbs: '5.2.4',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Unit 02 - Flare Area',
    plannedPercent: 30,
    actualPercent: 45,
    variancePercent: 15,
    varianceSemantic: 'Positive',
    plannedFinish: '26 Sep 2026',
    forecastFinish: '24 Sep 2026',
    status: 'Ahead',
    lastVerifiedUpdate: '16 Sep 2026: K.O. Drum placed on foundation pads (Debajit Borah)',
    assignedEngineer: 'Debajit Borah',
    isCritical: false,
    history: [
      {
        id: 'H-13',
        previousPercent: 0,
        newPercent: 45,
        deltaPercent: 45,
        executionEventId: 'EVT-2026-008',
        evidenceId: 'EVD-011',
        evidenceTitle: 'VESSEL_RIGGING_SIGN_OFF.pdf',
        verifiedBy: 'Debajit Borah (Lead Site Engineer)',
        timestamp: '16 Sep 2026, 16:00 IST',
        statement: 'Flare knock-out drum vessel positioning completed on foundation pads.',
        auditHash: '0x1c2d3e4f5a6b7c8d',
      },
    ],
  },
];

export default function ProgressVariancePage() {
  const { activeProject, userSession, openActivityDrawer, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  const [activities, setActivities] = useState<ProgressActivityRow[]>(MOCK_PROGRESS_ACTIVITIES);
  const [selectedSemanticFilter, setSelectedSemanticFilter] = useState<'ALL' | VarianceSemantic>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Activity for Detail Drawer
  const [selectedActivity, setSelectedActivity] = useState<ProgressActivityRow | null>(null);

  // Selected time point on chart
  const [selectedChartPoint, setSelectedChartPoint] = useState<TimeSeriesPoint>(TIME_SERIES_DATA[4]); // 18 Sep Data Date

  // Calibrate Progress Modal State (Strict Rule: No Arbitrary Editing without 5 Audited Fields)
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [newProgressInput, setNewProgressInput] = useState<number>(75);
  const [editReason, setEditReason] = useState<string>('');
  const [editSource, setEditSource] = useState<string>('DPR-014 / Field Walkdown Memo');
  const [editAuditHash, setEditAuditHash] = useState<string>('AUD-PRG-8F3C-20260918');

  // Header Context
  const projectCode = activeProject?.code || 'OIL-DUL-01';
  const projectName = activeProject?.name || 'Duliajan Gas Processing & Pipeline Interconnect';
  const scheduleVersion = CANONICAL_SCHEDULE_VERSION_LABEL;
  const reportingDate = formatProjectDateTime(PROJECT_REPORT_DATE, { includeTime: true, includeTimezone: true });

  // Top summary metrics calculation
  const summaryMetrics = useMemo(() => {
    const planned = 80.0;
    const actual = 73.0;
    const variance = actual - planned; // -7.0%

    const aheadCount = activities.filter((a) => a.varianceSemantic === 'Positive').length;
    const onTrackCount = activities.filter((a) => a.varianceSemantic === 'Neutral').length;
    const behindCount = activities.filter((a) => a.varianceSemantic === 'Negative').length;

    return {
      plannedProgress: planned,
      actualProgress: actual,
      variance,
      activitiesAhead: aheadCount,
      activitiesOnTrack: onTrackCount,
      activitiesBehind: behindCount,
    };
  }, [activities]);

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (selectedSemanticFilter !== 'ALL' && act.varianceSemantic !== selectedSemanticFilter) {
        return false;
      }
      if (selectedStatusFilter !== 'ALL' && act.status !== selectedStatusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = act.id.toLowerCase().includes(q);
        const matchesName = act.name.toLowerCase().includes(q);
        const matchesWbs = act.wbs.toLowerCase().includes(q);
        const matchesArea = act.area.toLowerCase().includes(q);
        const matchesDiscipline = act.discipline.toLowerCase().includes(q);
        return matchesId || matchesName || matchesWbs || matchesArea || matchesDiscipline;
      }
      return true;
    });
  }, [activities, selectedSemanticFilter, selectedStatusFilter, searchQuery]);

  // Variance styling helper
  const getVarianceStyle = (semantic: VarianceSemantic, value: number) => {
    switch (semantic) {
      case 'Positive':
        return {
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
          label: `+${value.toFixed(1)}%`,
          tag: 'Ahead',
        };
      case 'Negative':
        return {
          bg: 'bg-[#FBEFEE]',
          border: 'border-[#E4B0AA]',
          text: 'text-[#B5473C]',
          label: `${value.toFixed(1)}%`,
          tag: 'Behind',
        };
      case 'Neutral':
      default:
        return {
          bg: 'bg-[#F1F3F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
          label: '0.0%',
          tag: 'On Track',
        };
    }
  };

  // Open Activity Drawer
  const handleSelectActivity = (act: ProgressActivityRow) => {
    setSelectedActivity(act);
    setNewProgressInput(act.actualPercent);
    setEditReason('');
    setEditSource('DPR-014 / Daily Progress Report');
    setEditAuditHash(`AUD-PRG-${act.id}-${Date.now().toString(16).toUpperCase()}`);
  };

  // Commit Audited Progress Update (Requires reason, source, user, timestamp, audit record)
  const handleCommitAuditedProgress = () => {
    if (!selectedActivity) return;

    if (!editReason.trim() || !editSource.trim()) {
      addToast({
        type: 'critical',
        title: 'Validation Blocked',
        description: 'Progress edits without an audited reason and evidence source reference are prohibited.',
      });
      return;
    }

    const prevPct = selectedActivity.actualPercent;
    const newPct = Number(newProgressInput);
    const delta = newPct - prevPct;

    const newStep: ProgressHistoryStep = {
      id: `H-${Date.now().toString().slice(-4)}`,
      previousPercent: prevPct,
      newPercent: newPct,
      deltaPercent: delta,
      executionEventId: `EVT-VER-${Date.now().toString().slice(-4)}`,
      evidenceId: editSource.includes('DPR') ? 'EVD-DPR-014' : 'EVD-QC-MEMO',
      evidenceTitle: editSource,
      verifiedBy: userSession?.name || 'Debajit Borah (Site Engineer)',
      timestamp: formatProjectDateTime(new Date().toISOString(), { includeTime: true, includeTimezone: true }),
      statement: editReason,
      auditHash: editAuditHash,
    };

    const newVariance = newPct - selectedActivity.plannedPercent;
    const newSemantic: VarianceSemantic = newVariance > 0 ? 'Positive' : newVariance < 0 ? 'Negative' : 'Neutral';
    const newStatus: ActivityProgressStatus = newPct >= 100 ? 'Completed' : newVariance > 0 ? 'Ahead' : newVariance < 0 ? 'Behind' : 'On Track';

    const updatedActivity: ProgressActivityRow = {
      ...selectedActivity,
      actualPercent: newPct,
      variancePercent: newVariance,
      varianceSemantic: newSemantic,
      status: newStatus,
      lastVerifiedUpdate: `${formatProjectDateTime(new Date().toISOString(), { includeTime: true })}: ${newPct}% verified (${editReason}) · ${userSession?.name || 'Debajit Borah'}`,
      history: [newStep, ...selectedActivity.history],
    };

    setActivities(activities.map((a) => (a.id === selectedActivity.id ? updatedActivity : a)));
    setSelectedActivity(updatedActivity);
    setIsCalibrateModalOpen(false);

    addToast({
      type: 'success',
      title: 'Audited Progress Committed',
      description: `Verified progress updated from ${prevPct}% to ${newPct}% with complete audit trail.`,
    });
  };

  const breadcrumbs = [
    { label: 'Schedule Execution' },
    { label: 'Progress & Variance', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* HEADER CONTEXT */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Activity className="w-3.5 h-3.5" />
                  Schedule Execution
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
                  Physical S-Curve Tracking
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
                  Every Verified Value Traceable to Execution
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Progress & Variance
              </h1>
              <p className="text-sm text-[#596579] mt-1">
                Every verified progress value must be traceable to an underlying execution update, physical evidence, and engineer attestation.
              </p>
            </div>

            {/* Quick Navigation Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/risks"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] hover:bg-[#FBEFEE]/80 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Delay & Dependency Impact</span>
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Review Queue</span>
              </Link>
              <Link
                href="/schedule-twin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Schedule Twin</span>
              </Link>
            </div>
          </div>

          {/* Explicit Header Info Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D9DEE5] pt-3 text-xs border-t border-[#D9DEE5]">
            <div className="py-2 sm:py-0 sm:pr-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-medium">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                  Project
                </span>
                <span className="font-mono font-medium text-[#172033] text-sm block truncate">
                  {projectCode}
                </span>
                <span className="text-[12px] text-[#596579] truncate block" title={projectName}>
                  {projectName}
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-medium">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                  Schedule Version
                </span>
                <span className="font-medium text-[#172033] text-sm block truncate">
                  {scheduleVersion}
                </span>
                <span className="text-[12px] text-[#596579] block">
                  184 Physical Activities · CPM Baseline
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:pl-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F7F8FA] border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-medium">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#596579] tracking-wider block">
                  Reporting Date (Data Date)
                </span>
                <span className="font-medium text-[#172033] text-sm block">
                  {reportingDate}
                </span>
                <span className="text-[12px] text-[#596579] block">
                  Cutoff: 17:30 IST · Verified Progress Ingested
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOP SECTION:
            1. Planned Progress
            2. Actual Verified Progress
            3. Variance
            ========================================================================= */}
        {/* =========================================================================
            2. SUMMARY METRICS
            Planned Progress | Actual Verified Progress | Variance | Forecast at Completion
            ========================================================================= */}
        <div className="space-y-3">
          {/* Performance Summary Metric Row */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D9DEE5]">
            {/* 1. Planned Progress */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#596579] block">
                  Planned Progress
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[28px] sm:text-3xl font-bold text-[#172033] font-mono leading-none">
                    {summaryMetrics.plannedProgress.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#596579] font-medium">CPM Baseline</span>
                </div>
              </div>
              <p className="text-[13px] text-[#596579] mt-2">
                Cumulative baseline target as of {reportingDate.split(' ')[0]} (Data Date).
              </p>
            </div>

            {/* 2. Actual Verified Progress */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#2E7D5B] block">
                    Actual Verified Progress
                  </span>
                  <WhyButton
                    onClick={() => openWhyExplanation('progress:verified')}
                    title="Why is verified progress 73.0%?"
                  />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[28px] sm:text-3xl font-bold text-[#176B87] font-mono leading-none">
                    {summaryMetrics.actualProgress.toFixed(1)}%
                  </span>
                  <span className="text-xs text-[#2E7D5B] font-medium">100% Traceable</span>
                </div>
              </div>
              <p className="text-[13px] text-[#596579] mt-2">
                Physically verified field output substantiated by engineering inspection records.
              </p>
            </div>

            {/* 3. Variance */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#B5473C] block">
                    Variance
                  </span>
                  <WhyButton
                    onClick={() => openWhyExplanation('variance:portfolio')}
                    title="Why is variance -7.0%?"
                  />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[28px] sm:text-3xl font-bold text-[#B5473C] font-mono leading-none">
                    {summaryMetrics.variance.toFixed(1)}%
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                    Negative (- Behind)
                  </span>
                </div>
              </div>
              <p className="text-[13px] text-[#596579] mt-2">
                Physical lag driven by Line 24 field butt welding and monsoon stoppages.
              </p>
            </div>

            {/* 4. Forecast at Completion */}
            <div className="p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#D98B32] block">
                    Forecast at Completion
                  </span>
                  <WhyButton
                    onClick={() => openWhyExplanation('impact:forecast')}
                    title="Why is forecast completion delayed by +4 days?"
                  />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-[28px] sm:text-3xl font-bold text-[#D98B32] font-mono leading-none">
                    100.0%
                  </span>
                  <span className="text-xs text-[#D98B32] font-semibold">+4 Days Slip</span>
                </div>
              </div>
              <p className="text-[13px] text-[#596579] mt-2">
                Target completion shifted to 15 Dec 2026 (contractual baseline 11 Dec 2026).
              </p>
            </div>
          </div>

          {/* Summary Metrics Interpretation */}
          <div className="p-3 bg-[#F7F8FA] border-l-4 border-[#176B87] rounded-r-lg text-xs text-[#172033] leading-relaxed">
            <strong className="text-[#176B87]">Summary Performance Interpretation: </strong>
            Cumulative verified physical progress is currently <strong>7.0 percentage points behind baseline (-7.0% variance)</strong>. The project critical path has consumed 4 days of total float, shifting projected commercial completion to 15 Dec 2026 unless recovery shifts on Line 24 are mobilized.
          </div>
        </div>

        {/* =========================================================================
            3. MANDATORY S-CURVE
            Planned Progress | Actual Verified Progress | Forecast Progress | Variance
            ========================================================================= */}
        <div className="space-y-2">
          <div className="px-3 py-1.5 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg flex items-center justify-between text-xs text-[#176B87] font-medium flex-wrap gap-2">
            <span>Project Question: Is cumulative physical progress tracking the approved CPM baseline over time?</span>
            <span className="font-mono text-[11px] font-bold">Planned vs. Actual vs. Forecast Trajectory</span>
          </div>
          <SCurveChart
            variant="full"
            title="Project S-Curve — Planned vs. Actual vs. Forecast"
            subtitle={`Compares cumulative scheduled baseline progress against verified site execution up to ${reportingDate}.`}
          />
        </div>

        {/* =========================================================================
            4. PROGRESS BY DISCIPLINE
            Project Question: Which engineering discipline is driving project variance?
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DEE5]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-base font-bold text-[#172033] tracking-tight">Progress by Discipline</h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Physical progress breakdown across engineering scopes compared against baseline weightage.
              </p>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[11px] font-mono text-[#176B87] font-semibold self-start sm:self-auto">
              Project Question: Which engineering discipline is driving project variance?
            </div>
          </div>

          {/* Bar Chart: Progress by Discipline */}
          <BarChart variant="discipline" className="border-0 p-0 shadow-none" />

          {/* Discipline Progress Table */}
          <div className="border border-[#D9DEE5] rounded-md bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-semibold uppercase text-[#596579] tracking-wider">
                  <th className="py-2.5 px-3">Discipline</th>
                  <th className="py-2.5 px-3 text-right">Planned Target</th>
                  <th className="py-2.5 px-3 text-right">Verified Actual</th>
                  <th className="py-2.5 px-3 text-center">Variance</th>
                  <th className="py-2.5 px-3 w-44">Trajectory vs Baseline</th>
                  <th className="py-2.5 px-3">Schedule Lag Driver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {DISCIPLINE_PROGRESS_DATA.map((d) => {
                  const isBehind = d.variance < 0;
                  const isAhead = d.variance > 0;
                  return (
                    <tr key={d.discipline} className="hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#172033]">{d.discipline}</span>
                          <span className="text-[11px] font-mono text-[#596579] bg-[#F1F3F5] px-1.5 py-0.5 rounded border border-[#D9DEE5]">
                            {d.weight}% Scope
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#176B87] font-medium">
                        {d.planned.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        <span className={isBehind ? 'text-[#B5473C]' : 'text-[#2E7D5B]'}>
                          {d.actual.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                            isBehind
                              ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                              : isAhead
                              ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                              : 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]'
                          }`}
                        >
                          {isAhead ? `+${d.variance.toFixed(1)}%` : `${d.variance.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="relative w-full h-2.5 bg-[#E5E9EF] rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isBehind ? 'bg-[#D98B32]' : 'bg-[#2E7D5B]'}`}
                              style={{ width: `${d.actual}%` }}
                              title={`Actual: ${d.actual}%`}
                            />
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-[#172033] z-10"
                              style={{ left: `${d.planned}%` }}
                              title={`Planned Target: ${d.planned}%`}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-[#7B8798] font-mono">
                            <span>0%</span>
                            <span className="text-[#172033]">Marker: {d.planned}%</span>
                            <span>100%</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[#596579]">
                        {d.criticalLagDriver}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Concise Engineering Interpretation */}
          <div className="p-3 bg-[#F7F8FA] border-l-4 border-[#176B87] rounded-r-lg text-xs text-[#172033] leading-relaxed">
            <strong className="text-[#176B87]">Discipline Analytics Interpretation: </strong>
            Piping is the primary schedule lag driver with a <strong>-14.0% variance</strong> (weighted 35% of overall project scope) due to unresolved Line 24 field butt welds and monsoon stoppages. Civil (+3.0%) and Mechanical (+3.0%) are running ahead of baseline, preventing foundation delays from impacting the pre-commissioning critical path.
          </div>
        </div>

        {/* =========================================================================
            5. PROGRESS BY AREA
            Project Question: Which physical plant battery limit has progress bottlenecks?
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DEE5]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-base font-bold text-[#172033] tracking-tight">Progress by Area</h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Geographical battery limit performance tracking with critical path and total float mapping.
              </p>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[11px] font-mono text-[#176B87] font-semibold self-start sm:self-auto">
              Project Question: Which physical plant battery limit has progress bottlenecks?
            </div>
          </div>

          {/* Bar Chart: Progress by Area */}
          <BarChart variant="area" className="border-0 p-0 shadow-none" />

          {/* Area Performance Table */}
          <div className="border border-[#D9DEE5] rounded-md bg-white overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-semibold uppercase text-[#596579] tracking-wider">
                  <th className="py-2.5 px-3">Area & Battery Limit</th>
                  <th className="py-2.5 px-3">CPM Path / Float</th>
                  <th className="py-2.5 px-3 text-right">Planned</th>
                  <th className="py-2.5 px-3 text-right">Actual</th>
                  <th className="py-2.5 px-3 text-center">Variance</th>
                  <th className="py-2.5 px-3 w-36">Progress</th>
                  <th className="py-2.5 px-3">Operational Status & Constraints</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {AREA_PROGRESS_DATA.map((area) => {
                  const isBehind = area.variance < 0;
                  const isAhead = area.variance > 0;
                  return (
                    <tr key={area.code} className="hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div>
                          <span className="font-mono text-[11px] text-[#7B8798] block">{area.code}</span>
                          <span className="font-medium text-[#172033]">{area.area}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {area.isCriticalPath ? (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] inline-block">
                            Critical Path
                          </span>
                        ) : (
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-[#F1F3F5] text-[#596579] inline-block">
                            Float: {area.totalFloatDays}d
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-[#176B87] font-medium">
                        {area.planned.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        <span className={isBehind ? 'text-[#B5473C]' : 'text-[#2E7D5B]'}>
                          {area.actual.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${
                            isBehind
                              ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                              : isAhead
                              ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                              : 'bg-[#F1F3F5] text-[#596579] border-[#D9DEE5]'
                          }`}
                        >
                          {isAhead ? `+${area.variance.toFixed(0)}%` : `${area.variance.toFixed(0)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="relative w-full h-2 bg-[#E5E9EF] rounded-full overflow-hidden">
                          <div
                            className={`h-full ${isBehind ? 'bg-[#D98B32]' : 'bg-[#2E7D5B]'}`}
                            style={{ width: `${area.actual}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-[#172033]"
                            style={{ left: `${area.planned}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[#596579]">
                        {area.summary}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Concise Engineering Interpretation */}
          <div className="p-3 bg-[#F7F8FA] border-l-4 border-[#176B87] rounded-r-lg text-xs text-[#172033] leading-relaxed">
            <strong className="text-[#176B87]">Area Analytics Interpretation: </strong>
            <strong>Unit A - Gas Processing</strong> contains 85% of total schedule slippage and is the sole battery limit on the zero-float critical path. By contrast, Unit A Compressor Station is ahead (+3.0%), and offsite drainage/flare packages carry healthy float buffers (14 to 20 days) that insulate the milestone completion date.
          </div>
        </div>

        {/* =========================================================================
            6. VARIANCE ANALYSIS & ROOT CAUSES
            Project Question: What are the root causes and schedule impacts of current variances?
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DEE5]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-base font-bold text-[#172033] tracking-tight">Variance Analysis & Root Causes</h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Rigorous causal analysis linking variance drivers to CPM critical path float consumption and recovery actions.
              </p>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[11px] font-mono text-[#176B87] font-semibold self-start sm:self-auto">
              Project Question: What are the root causes and schedule impacts of current variances?
            </div>
          </div>

          {/* Line Chart: Variance Trend */}
          <LineChart variant="variance-trend" className="border-0 p-0 shadow-none" />

          {/* 3-Part Analysis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-[#D9DEE5]/60">
            {/* Part 1: Causal Factors Ledger */}
            <div className="lg:col-span-2 space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B8798] block">
                Primary Variance Drivers & Mitigation Protocols
              </span>
              <div className="space-y-2">
                {VARIANCE_ROOT_CAUSES.map((rc) => (
                  <div
                    key={rc.id}
                    className="p-3 rounded-lg border border-[#D9DEE5] bg-[#F7F8FA] hover:bg-white transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-[#7B8798]">{rc.id}</span>
                        <span className="font-bold text-[#172033]">{rc.category}</span>
                        <span className="text-[#7B8798]">•</span>
                        <span className="font-mono text-[11px] text-[#176B87]">{rc.activityRef}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <span
                          className={`px-1.5 py-0.2 rounded font-bold ${
                            rc.varianceContribution < 0
                              ? 'bg-[#FBEFEE] text-[#B5473C]'
                              : 'bg-[#EDF7F2] text-[#2E7D5B]'
                          }`}
                        >
                          {rc.varianceContribution < 0 ? `${rc.varianceContribution}%` : `+${rc.varianceContribution}%`} var
                        </span>
                        <span className="text-[#596579]">
                          ({rc.floatImpactDays < 0 ? `${rc.floatImpactDays}d float` : `+${rc.floatImpactDays}d float`})
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#172033] font-medium leading-snug">
                      {rc.factor}
                    </div>

                    <div className="p-2 bg-white rounded border border-[#E5E9EF] text-[11px] text-[#596579]">
                      <strong className="text-[#2E7D5B]">Mitigation Plan: </strong>
                      {rc.mitigationPlan}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Part 2: Critical Path Impact Callout Box */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B8798] block">
                Critical Path Float Consumption
              </span>

              <div className="p-4 rounded-lg bg-[#FBEFEE]/60 border border-[#E4B0AA] space-y-3 text-xs">
                <div className="flex items-center gap-2 text-[#B5473C] font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Path 1 Float Consumed: 4 Days</span>
                </div>

                <div className="text-[11px] text-[#596579] space-y-1">
                  <p>
                    The critical chain sequence <code>CIV-11-001 → PIP-24-001 → PIP-24-002 → PIP-24-003</code> has exhausted all baseline float.
                  </p>
                  <p>
                    Forecast commercial completion is currently <strong>15 Dec 2026</strong> (+4 days slip vs. 11 Dec 2026 contract baseline).
                  </p>
                </div>

                <div className="pt-2 border-t border-[#E4B0AA]/60 text-[11px]">
                  <span className="font-bold text-[#172033] block mb-1">Approved Recovery Intervention:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[#596579]">
                    <li>20 Sep: Mobilize 2nd shift RT inspection team</li>
                    <li>22 Sep: Pre-clear 150 bar blind flanges from stores</li>
                    <li>01 Oct: Recover 4 days float before hydrotesting</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Concise Engineering Interpretation */}
          <div className="p-3 bg-[#F7F8FA] border-l-4 border-[#176B87] rounded-r-lg text-xs text-[#172033] leading-relaxed">
            <strong className="text-[#176B87]">Variance Analysis Interpretation: </strong>
            The -7.0% net variance is attributable to 3 localized operational bottlenecks on Line 24 rather than chronic site labor shortages. Executing the approved 2-shift NDT clearance and expediting stores material release will recover the 4 days of consumed critical path float by Milestone M4 (Hydrotesting).
          </div>
        </div>

        {/* =========================================================================
            7. TOP VARIANCES & SCHEDULE ACTIVITIES LEDGER
            Project Question: Which specific activities deviate most from baseline, and how is each verified?
            Activity | Planned % | Verified Actual % | Variance | Forecast Finish | Status | Last Verified Update
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs space-y-0">
          <div className="p-4 border-b border-[#D9DEE5]/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-base font-bold text-[#172033] tracking-tight">Top Variances & Schedule Activities</h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Activity-level variance ledger with 100% execution event traceability and verified history audit trails.
              </p>
            </div>
            <div className="px-2.5 py-1 rounded bg-[#EDF5F8] border border-[#B3CBE0] text-[11px] font-mono text-[#176B87] font-semibold self-start md:self-auto">
              Project Question: Which specific activities deviate most from baseline, and how is each verified?
            </div>
          </div>

          {/* Horizontal Bar Chart: Top Variances */}
          <HorizontalBarChart variant="top-variances" className="border-0 border-b border-[#D9DEE5]/60 rounded-none shadow-none" />

          {/* Activity Category Filter Bar */}
          <div className="p-3 bg-[#F7F8FA] border-b border-[#D9DEE5]/60 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[#596579] mr-1">Filter by Status:</span>
            <button
              type="button"
              onClick={() => setSelectedSemanticFilter(selectedSemanticFilter === 'Positive' ? 'ALL' : 'Positive')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all inline-flex items-center gap-2 ${
                selectedSemanticFilter === 'Positive'
                  ? 'bg-[#EDF7F2] border-[#2E7D5B] text-[#2E7D5B] shadow-2xs font-semibold'
                  : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F7F8FA]'
              }`}
            >
              <span>Ahead of Schedule</span>
              <span className="font-mono font-bold text-[#2E7D5B] bg-[#EDF7F2] px-1.5 py-0.5 rounded text-[11px]">
                {summaryMetrics.activitiesAhead}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSemanticFilter(selectedSemanticFilter === 'Neutral' ? 'ALL' : 'Neutral')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all inline-flex items-center gap-2 ${
                selectedSemanticFilter === 'Neutral'
                  ? 'bg-[#EDF5F8] border-[#176B87] text-[#176B87] shadow-2xs font-semibold'
                  : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F7F8FA]'
              }`}
            >
              <span>On Track</span>
              <span className="font-mono font-bold text-[#172033] bg-[#F1F3F5] px-1.5 py-0.5 rounded text-[11px]">
                {summaryMetrics.activitiesOnTrack}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSemanticFilter(selectedSemanticFilter === 'Negative' ? 'ALL' : 'Negative')}
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-all inline-flex items-center gap-2 ${
                selectedSemanticFilter === 'Negative'
                  ? 'bg-[#FBEFEE] border-[#B5473C] text-[#B5473C] shadow-2xs font-semibold'
                  : 'bg-white border-[#D9DEE5] text-[#596579] hover:bg-[#F7F8FA]'
              }`}
            >
              <span>Behind Schedule</span>
              <span className="font-mono font-bold text-[#B5473C] bg-[#FBEFEE] px-1.5 py-0.5 rounded text-[11px]">
                {summaryMetrics.activitiesBehind}
              </span>
            </button>

            {selectedSemanticFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedSemanticFilter('ALL')}
                className="text-xs text-[#176B87] hover:underline font-medium ml-auto"
              >
                Clear Filter
              </button>
            )}
          </div>
          <div className="p-4 border-b border-[#D9DEE5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search activities by ID, name, WBS, or area..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] focus:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[#7B8798] font-medium text-[11px]">Semantics:</span>
                <select
                  value={selectedSemanticFilter}
                  onChange={(e) => setSelectedSemanticFilter(e.target.value as any)}
                  className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
                >
                  <option value="ALL">All Semantics ({activities.length})</option>
                  <option value="Positive">Positive (+ Ahead)</option>
                  <option value="Neutral">Neutral (0.0% On Track)</option>
                  <option value="Negative">Negative (- Behind)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[#7B8798] font-medium text-[11px]">Status:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Ahead">Ahead</option>
                  <option value="On Track">On Track</option>
                  <option value="Behind">Behind</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE CONTAINER WITH MANDATED 7 COLUMNS */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#596579]">
                  <th className="p-3.5 min-w-[240px]">Activity</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Planned %</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Verified Actual %</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Variance</th>
                  <th className="p-3.5 whitespace-nowrap">Forecast Finish</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 min-w-[260px]">Last Verified Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5] text-[14px]">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#596579]">
                      <Info className="w-8 h-8 text-[#7B8798] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#172033]">No activities match your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const varStyle = getVarianceStyle(act.varianceSemantic, act.variancePercent);

                    return (
                      <tr
                        key={act.id}
                        onClick={() => handleSelectActivity(act)}
                        className="hover:bg-[#EDF5F8]/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. Activity (ID, Name, WBS, Area) */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-xs text-[#176B87] group-hover:underline">
                              {act.id}
                            </span>
                            {act.isCritical && (
                              <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                                CP
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-sm text-[#172033] mt-0.5">{act.name}</div>
                          <div className="text-[12px] text-[#596579] flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[#7B8798]">WBS {act.wbs}</span>
                            <span>•</span>
                            <span>{act.discipline}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{act.area}</span>
                          </div>
                        </td>

                        {/* 2. Planned % */}
                        <td className="p-3.5 whitespace-nowrap text-right font-mono font-semibold text-[#596579]">
                          {act.plannedPercent}%
                        </td>

                        {/* 3. Verified Actual % */}
                        <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-[#172033]">
                          {act.actualPercent}%
                        </td>

                        {/* 4. Variance */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${varStyle.bg} ${varStyle.border} ${varStyle.text}`}
                            >
                              {act.varianceSemantic === 'Positive' && <TrendingUp className="w-3 h-3" />}
                              {act.varianceSemantic === 'Negative' && <TrendingDown className="w-3 h-3" />}
                              {act.varianceSemantic === 'Neutral' && <Check className="w-3 h-3" />}
                              <span>{varStyle.label}</span>
                            </span>
                            <WhyButton
                              onClick={() => openWhyExplanation(`variance:${act.id}`)}
                              title={`Why is variance ${varStyle.label}?`}
                            />
                          </div>
                        </td>

                        {/* 5. Forecast Finish */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#172033] font-bold">
                          {act.forecastFinish}
                        </td>

                        {/* 6. Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              act.status === 'Completed'
                                ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                : act.status === 'Ahead'
                                ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                : act.status === 'Behind'
                                ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                : 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                            }`}
                          >
                            {act.status}
                          </span>
                        </td>

                        {/* 7. Last Verified Update */}
                        <td className="p-3.5 text-[#596579]">
                          <p className="truncate text-[11px] max-w-[280px]" title={act.lastVerifiedUpdate}>
                            {act.lastVerifiedUpdate}
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3.5 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#596579]">
            <span>
              Showing <strong>{filteredActivities.length}</strong> of <strong>{activities.length}</strong> schedule activities
            </span>
            <span className="text-[11px] text-[#7B8798]">
              Click any activity row to view complete execution lineage and verification history
            </span>
          </div>
        </div>

        {/* =========================================================================
            PROGRESS DETAIL DRAWER:
            Previous Progress ↓ Execution Event ↓ Evidence ↓ Verification ↓ New Progress
            History Progression: 53% → 65% → 72% with dates and source evidence
            Important: Prohibit arbitrary edits without reason, source, user, timestamp, audit record
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedActivity}
          onClose={() => setSelectedActivity(null)}
          title={`Progress Lineage: ${selectedActivity?.id || ''}`}
          subtitle={`Verified Physical Execution Audit · ${selectedActivity?.name || ''}`}
          width="xl"
          footer={
            selectedActivity && (
              <div className="flex items-center justify-between w-full text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => setIsCalibrateModalOpen(true)}
                  className="px-4 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Record Audited Progress Update</span>
                </button>
              </div>
            )
          }
        >
          {selectedActivity && (
            <div className="space-y-6 text-sm text-[#172033]">
              {/* Top Activity Card */}
              <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm sm:text-base font-bold text-[#176B87]">
                      {selectedActivity.id}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white text-[#176B87] font-semibold border border-[#B3CBE0]">
                      WBS {selectedActivity.wbs}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-white text-[#596579] font-medium border border-[#D9DEE5]">
                      {selectedActivity.discipline}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-medium text-[#596579]">
                    Engineer: {selectedActivity.assignedEngineer}
                  </span>
                </div>

                <h3 className="text-[15px] font-semibold text-[#172033]">
                  {selectedActivity.name}
                </h3>

                {/* Progress Bar & Status */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-xs">
                    <span>
                      Verified Actual: <strong className="font-mono text-[#2E7D5B] font-semibold">{selectedActivity.actualPercent}%</strong>
                    </span>
                    <span>
                      Planned Target: <strong className="font-mono text-[#596579] font-semibold">{selectedActivity.plannedPercent}%</strong>
                    </span>
                  </div>
                  <ProgressBar
                    actual={selectedActivity.actualPercent}
                    planned={selectedActivity.plannedPercent}
                  />
                </div>
              </div>

              {/* =====================================================================
                  MANDATED TRACEABILITY CHAIN:
                  Previous Progress ↓ Execution Event ↓ Evidence ↓ Verification ↓ New Progress
                  ===================================================================== */}
              <div className="p-5 bg-white border border-[#D9DEE5] rounded-lg space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#176B87]" />
                    <h4 className="font-semibold text-xs uppercase tracking-wider text-[#172033]">
                      Verified Progress Execution Lineage
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#7B8798]">
                    Mandatory 5-Stage Audit Chain
                  </span>
                </div>

                {selectedActivity.history.length > 0 ? (
                  (() => {
                    const latest = selectedActivity.history[0];
                    return (
                      <div className="space-y-3 pt-1">
                        {/* 1. Previous Progress */}
                        <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-white border border-[#D9DEE5] flex items-center justify-center font-mono font-bold text-xs text-[#596579]">
                              1
                            </span>
                            <span className="font-medium text-xs text-[#596579]">Previous Progress:</span>
                          </div>
                          <span className="font-mono text-base font-bold text-[#596579]">
                            {latest.previousPercent}%
                          </span>
                        </div>

                        <div className="flex justify-center text-[#7B8798]">
                          <ChevronDown className="w-4 h-4" />
                        </div>

                        {/* 2. Execution Event */}
                        <div className="p-3 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#176B87] text-white flex items-center justify-center font-mono font-bold text-xs">
                              2
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-[#176B87] block">Execution Event:</span>
                              <span className="text-[11px] text-[#596579] italic truncate max-w-[280px] block">
                                &ldquo;{latest.statement}&rdquo;
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-semibold px-2 py-1 bg-white text-[#176B87] border border-[#B3CBE0] rounded">
                            {latest.executionEventId}
                          </span>
                        </div>

                        <div className="flex justify-center text-[#7B8798]">
                          <ChevronDown className="w-4 h-4" />
                        </div>

                        {/* 3. Evidence */}
                        <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2E7D5B] text-white flex items-center justify-center font-mono font-bold text-xs">
                              3
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-[#2E7D5B] block">Evidence Proof:</span>
                              <span className="text-[11px] text-[#596579] block">
                                {latest.evidenceTitle}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xs font-semibold px-2 py-1 bg-white text-[#2E7D5B] border border-[#B8DCC9] rounded">
                            {latest.evidenceId}
                          </span>
                        </div>

                        <div className="flex justify-center text-[#7B8798]">
                          <ChevronDown className="w-4 h-4" />
                        </div>

                        {/* 4. Verification */}
                        <div className="p-3 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#D98B32] text-white flex items-center justify-center font-mono font-bold text-xs">
                              4
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-[#D98B32] block">Verified By:</span>
                              <span className="text-[11px] text-[#596579] block">
                                {latest.verifiedBy}
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-[11px] text-[#596579] bg-white px-2 py-1 rounded border border-[#F0D4A6]">
                            {latest.timestamp}
                          </span>
                        </div>

                        <div className="flex justify-center text-[#7B8798]">
                          <ChevronDown className="w-4 h-4" />
                        </div>

                        {/* 5. New Progress */}
                        <div className="p-3 bg-[#EDF7F2] border border-[#2E7D5B] rounded-lg flex items-center justify-between ring-1 ring-[#2E7D5B]/30">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#2E7D5B] text-white flex items-center justify-center font-mono font-bold text-xs">
                              5
                            </span>
                            <div>
                              <span className="font-semibold text-xs text-[#2E7D5B] block">New Verified Progress:</span>
                              <span className="text-[11px] text-[#596579]">
                                Delta: +{latest.deltaPercent}% committed to Schedule Twin
                              </span>
                            </div>
                          </div>
                          <span className="font-mono text-xl font-bold text-[#2E7D5B]">
                            {latest.newPercent}%
                          </span>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-center text-[#7B8798] italic">
                    No verified progress increments logged yet. Activity is in pre-execution stage.
                  </div>
                )}
              </div>

              {/* =====================================================================
                  MANDATED PROGRESS HISTORY:
                  Show: 53% → 65% → 72% with dates and source evidence
                  ===================================================================== */}
              <div className="p-5 bg-white border border-[#D9DEE5] rounded-lg space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="w-4 h-4 text-[#176B87]" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                      Progress History Progression
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-[#7B8798]">
                    Sequential Verified Updates
                  </span>
                </div>

                {/* Horizontal Step Progression Indicator: e.g. 20% → 65% → 70% */}
                {selectedActivity.history.length > 0 && (
                  <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg overflow-x-auto">
                    <div className="flex items-center gap-2 min-w-max">
                      <span className="text-[11px] font-semibold uppercase text-[#7B8798] mr-1">
                        Progression:
                      </span>
                      {selectedActivity.history
                        .slice()
                        .reverse()
                        .map((step, idx, arr) => (
                          <React.Fragment key={step.id}>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-[#D9DEE5] font-mono text-xs">
                              <span className="font-semibold text-[#172033]">{step.newPercent}%</span>
                              <span className="text-[11px] text-[#7B8798]">({step.timestamp.split(',')[0]})</span>
                            </div>
                            {idx < arr.length - 1 && (
                              <ArrowRight className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                    </div>
                  </div>
                )}

                {/* Chronological Step List with Dates and Source Evidence */}
                <div className="space-y-3 pt-1">
                  {selectedActivity.history.map((step) => (
                    <div
                      key={step.id}
                      className="p-3.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg space-y-2 text-xs hover:border-[#B3CBE0] transition-colors"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded bg-white border border-[#D9DEE5] text-[#176B87]">
                            {step.previousPercent}% → {step.newPercent}%
                          </span>
                          <span className="text-[11px] font-semibold text-[#2E7D5B]">
                            (+{step.deltaPercent}%)
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-[#596579]">
                          {step.timestamp}
                        </span>
                      </div>

                      <p className="text-[13px] text-[#172033] font-normal leading-relaxed">
                        {step.statement}
                      </p>

                      <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between flex-wrap gap-2 text-[11px] text-[#596579] font-mono">
                        <div className="flex items-center gap-3">
                          <span>Event: <strong>{step.executionEventId}</strong></span>
                          <span>Evidence: <strong>{step.evidenceTitle}</strong> ({step.evidenceId})</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#7B8798]">
                          <span>By: {step.verifiedBy}</span>
                          <span>·</span>
                          <span title={`Audit Hash: ${step.auditHash}`}>Hash: {step.auditHash}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* =========================================================================
            CALIBRATE PROGRESS MODAL:
            Strictly requires: reason, source, user, timestamp, audit record
            Do not allow arbitrary progress editing without these 5 fields
            ========================================================================= */}
        <Modal
          isOpen={isCalibrateModalOpen}
          onClose={() => setIsCalibrateModalOpen(false)}
          title="Record Audited Progress Update"
          subtitle="Strict Governance: Arbitrary progress edits without an audited reason and physical evidence reference are prohibited."
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsCalibrateModalOpen(false)}
                className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5] text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCommitAuditedProgress}
                disabled={!editReason.trim() || !editSource.trim()}
                className="px-4 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded shadow-xs disabled:opacity-40 text-xs inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Commit Verified Progress</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Target Verified Progress */}
            <div>
              <label className="font-bold text-[#172033] block mb-1">
                New Verified Progress (%):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={newProgressInput}
                  onChange={(e) => setNewProgressInput(Number(e.target.value))}
                  className="w-32 p-2 bg-white border border-[#D9DEE5] rounded-lg font-mono font-bold text-sm text-[#172033] outline-none focus:border-[#176B87]"
                />
                <span className="text-xs text-[#596579]">
                  Previous was <strong>{selectedActivity?.actualPercent}%</strong> (Delta: {newProgressInput - (selectedActivity?.actualPercent || 0)}%)
                </span>
              </div>
            </div>

            {/* 1. Reason (Mandatory) */}
            <div>
              <label className="font-bold text-[#172033] block mb-1">
                1. Verification Reason / Justification <span className="text-[#B5473C]">* (Mandatory)</span>
              </label>
              <textarea
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="State technical justification (e.g., Physical walkdown and inspection verified completion of 8 welded spools on rack section B)..."
                rows={3}
                className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87] text-xs"
              />
            </div>

            {/* 2. Source Evidence (Mandatory) */}
            <div>
              <label className="font-bold text-[#172033] block mb-1">
                2. Source Evidence Reference <span className="text-[#B5473C]">* (Mandatory)</span>
              </label>
              <input
                type="text"
                value={editSource}
                onChange={(e) => setEditSource(e.target.value)}
                placeholder="e.g. DPR-014, WELD_LOG_SHEET_SHIFT_A.pdf, Site Diary Log"
                className="w-full p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87] text-xs"
              />
            </div>

            {/* 3. User & 4. Timestamp (Pre-filled & Audited) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-[#7B8798] block mb-1">3. Authenticated User</label>
                <div className="p-2 bg-[#F1F3F5] rounded border border-[#D9DEE5] text-[#596579] font-mono text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>{userSession?.name || 'Debajit Borah'}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#7B8798] block mb-1">4. Verification Timestamp</label>
                <div className="p-2 bg-[#F1F3F5] rounded border border-[#D9DEE5] text-[#596579] font-mono text-[11px] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{reportingDate}</span>
                </div>
              </div>
            </div>

            {/* 5. Audit Record Hash */}
            <div>
              <label className="font-bold text-[#7B8798] block mb-1">5. Immutable Audit Hash</label>
              <div className="p-2 bg-[#F1F3F5] rounded border border-[#D9DEE5] text-[#596579] font-mono text-[11px] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>{editAuditHash}</span>
              </div>
            </div>

            {/* Warning when required fields are missing */}
            {(!editReason.trim() || !editSource.trim()) && (
              <div className="p-2.5 bg-[#FDF6ED] border border-[#F0D4A6] rounded-lg text-[11px] text-[#D98B32] flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Arbitrary edits are blocked: Reason and Source Evidence must be specified.</span>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </StateWrapper>
  );
}
