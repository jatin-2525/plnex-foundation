'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AppShell } from '../../components/shell/AppShell';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Drawer } from '../../components/shared/Drawer';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { DisciplineType } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
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
  Info,
  ExternalLink,
  ShieldCheck,
  Folder,
  HardHat,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

// Semantics per requirement: Positive, Neutral, Negative
export type VarianceSemantic = 'Positive' | 'Neutral' | 'Negative';

export type ActivityProgressStatus = 'Ahead' | 'On Track' | 'Behind' | 'Completed';

export interface ProgressHistoryEntry {
  id: string;
  date: string;
  progressPercent: number;
  deltaPercent: number;
  quantityExecuted: number;
  unit: string;
  verifiedBy: string;
  statement: string;
  evidenceId?: string;
  evidenceTitle?: string;
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
  history: ProgressHistoryEntry[];
  delayReasons?: string[];
  downstreamImpact?: string;
}

// Time series data points for the Main Chart: Planned vs Actual over time
export interface TimeSeriesPoint {
  period: string; // e.g. "15 May", "15 Jun"
  dateLabel: string;
  planned: number; // 0-100
  actual: number | null; // null for future forecast
  forecast: number; // 0-100
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

const MOCK_PROGRESS_ACTIVITIES: ProgressActivityRow[] = [
  {
    id: 'PIP-24-001',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '3.2.1',
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
        date: '14 Sep 2026, 17:15',
        progressPercent: 100,
        deltaPercent: 70,
        quantityExecuted: 12,
        unit: 'spools',
        verifiedBy: 'Debajit Borah',
        statement: 'Spool erection completed on Line 24. 12 spools erected with crane support.',
        evidenceId: 'EVD-001',
        evidenceTitle: 'IMG_20260914_Line24_Erect.jpg',
      },
      {
        id: 'H-02',
        date: '10 Sep 2026, 09:00',
        progressPercent: 30,
        deltaPercent: 30,
        quantityExecuted: 4,
        unit: 'spools',
        verifiedBy: 'Debajit Borah',
        statement: 'Crane rigged at Piperack Section B. 4 initial spools staged and hoisted.',
      },
    ],
  },
  {
    id: 'PIP-24-002',
    name: 'Weld Line 24-XX Field Joints & NDT Inspection',
    wbs: '3.2.2',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing',
    plannedPercent: 100,
    actualPercent: 65,
    variancePercent: -35,
    varianceSemantic: 'Negative',
    plannedFinish: '18 Sep 2026',
    forecastFinish: '21 Sep 2026',
    status: 'Behind',
    lastVerifiedUpdate: '18 Sep 2026: 4 circumferential butt welds verified (Debajit Borah)',
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
        date: '18 Sep 2026, 16:30',
        progressPercent: 65,
        deltaPercent: 15,
        quantityExecuted: 4,
        unit: 'welds',
        verifiedBy: 'Debajit Borah',
        statement: '4 butt welds completed on J-04 to J-07. RT crew alerted for evening inspection.',
        evidenceId: 'EVD-003',
        evidenceTitle: 'IMG_20260918_WELD_BUTT_J04.jpg',
      },
      {
        id: 'H-04',
        date: '16 Sep 2026, 17:00',
        progressPercent: 50,
        deltaPercent: 30,
        quantityExecuted: 8,
        unit: 'welds',
        verifiedBy: 'Debajit Borah',
        statement: 'Line 24 spool welding 8 joints completed. Weld inspection memo logged.',
        evidenceId: 'EVD-004',
        evidenceTitle: 'WELD_LOG_SHEET_SHIFT_A.pdf',
      },
      {
        id: 'H-05',
        date: '14 Sep 2026, 08:30',
        progressPercent: 20,
        deltaPercent: 20,
        quantityExecuted: 4,
        unit: 'welds',
        verifiedBy: 'Debajit Borah',
        statement: 'Fit-up and tack welding initiated on Line 24 root joints.',
      },
    ],
  },
  {
    id: 'CIV-11-001',
    name: 'Foundation Block A - Compressor Pedestal',
    wbs: '2.1.1',
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
        date: '14 Sep 2026, 14:00',
        progressPercent: 100,
        deltaPercent: 50,
        quantityExecuted: 45,
        unit: 'm³ concrete',
        verifiedBy: 'Debajit Borah',
        statement: 'Foundation Block A reinforced concrete pour completed with RMC transit mixers.',
        evidenceId: 'EVD-005',
        evidenceTitle: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf',
      },
      {
        id: 'H-07',
        date: '08 Sep 2026, 17:00',
        progressPercent: 50,
        deltaPercent: 50,
        quantityExecuted: 1,
        unit: 'rebar cage',
        verifiedBy: 'Debajit Borah',
        statement: 'Rebar reinforcement tying and foundation anchor bolt templates positioned.',
      },
    ],
  },
  {
    id: 'MEC-08-003',
    name: 'Skid Alignment & Grouting for Compressor C-101',
    wbs: '5.3.1',
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
        date: '17 Sep 2026, 15:30',
        progressPercent: 25,
        deltaPercent: 25,
        quantityExecuted: 1,
        unit: 'alignment check',
        verifiedBy: 'Debajit Borah',
        statement: 'Laser alignment tooling set up on pedestal. Shimming commenced early.',
      },
    ],
  },
  {
    id: 'ELE-11-032',
    name: 'Cable Tray Installation - Substation to Compressor Bay',
    wbs: '5.1.1',
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
        date: '17 Sep 2026, 16:00',
        progressPercent: 40,
        deltaPercent: 20,
        quantityExecuted: 45,
        unit: 'meters',
        verifiedBy: 'Supervisor Voice Note',
        statement: 'Cable ladder tray installation done from sub to comp bay about 45 meters.',
      },
      {
        id: 'H-10',
        date: '15 Sep 2026, 11:00',
        progressPercent: 20,
        deltaPercent: 20,
        quantityExecuted: 60,
        unit: 'meters',
        verifiedBy: 'Debajit Borah',
        statement: 'Overhead cantilever bracket installation along gallery column line 4.',
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
        date: '18 Sep 2026, 15:00',
        progressPercent: 70,
        deltaPercent: 35,
        quantityExecuted: 350,
        unit: 'meters',
        verifiedBy: 'Debajit Borah',
        statement: '350 meters HT power cable pulled smoothly with motorized winch.',
      },
    ],
  },
  {
    id: 'PIP-24-003',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '3.2.3',
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
        date: '18 Sep 2026, 13:15',
        progressPercent: 0,
        deltaPercent: 0,
        quantityExecuted: 0,
        unit: 'sections',
        verifiedBy: 'Debajit Borah',
        statement: 'Hydrostatic test prep paused at 11:30. Stoppage notice issued.',
        evidenceId: 'EVD-007',
        evidenceTitle: 'DELAY_NOTICE_WEATHER_STATION.pdf',
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
        date: '16 Sep 2026, 16:00',
        progressPercent: 45,
        deltaPercent: 45,
        quantityExecuted: 1,
        unit: 'vessel',
        verifiedBy: 'Debajit Borah',
        statement: 'Flare knock-out drum vessel positioning completed on foundation pads.',
      },
    ],
  },
];

export default function ProgressVariancePage() {
  const { activeProject, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  const [activities, setActivities] = useState<ProgressActivityRow[]>(MOCK_PROGRESS_ACTIVITIES);
  const [selectedSemanticFilter, setSelectedSemanticFilter] = useState<'ALL' | VarianceSemantic>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Activity for Detail Drawer
  const [selectedActivity, setSelectedActivity] = useState<ProgressActivityRow | null>(null);

  // Selected time point on chart
  const [selectedChartPoint, setSelectedChartPoint] = useState<TimeSeriesPoint>(TIME_SERIES_DATA[4]); // 18 Sep Data Date

  // Header Context
  const projectCode = activeProject?.code || 'OIL-DUL-01';
  const projectName = activeProject?.name || 'Duliajan Gas Processing & Pipeline Interconnect';
  const scheduleVersion = 'Rev 3.2 (P6 XML Baseline)';
  const reportingDate = '18 Sep 2026';

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
      // Semantic filter (Positive, Neutral, Negative)
      if (selectedSemanticFilter !== 'ALL' && act.varianceSemantic !== selectedSemanticFilter) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'ALL' && act.status !== selectedStatusFilter) {
        return false;
      }
      // Search
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
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
          label: '0.0%',
          tag: 'On Track',
        };
    }
  };

  const breadcrumbs = [
    { label: 'Schedule Execution' },
    { label: 'Progress & Variance', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Progress & Variance, Project, Schedule Version, Reporting Date
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Activity className="w-3.5 h-3.5" />
                  Schedule Execution
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B] animate-pulse" />
                  Physical S-Curve Tracking
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  Pure Physical Progress · Non-EVM
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Progress & Variance
              </h1>
              <p className="text-xs text-[#596579] mt-0.5">
                Physical progress tracking and time variance analytics. Zero financial formulas (SPI/CPI/EV/PV excluded).
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/risks"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#B5473C] bg-[#FBEFEE] border border-[#E4B0AA] hover:bg-[#FBEFEE]/80 rounded-lg transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Dependency Risks</span>
              </Link>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#596579]" />
                <span>Master Schedule</span>
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

          {/* EXPLICIT HEADER INFO MATRIX: Project / Schedule Version / Reporting Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
            {/* Project */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]/80">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-bold">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Project
                </span>
                <span className="font-mono font-bold text-[#172033] block truncate">
                  {projectCode}
                </span>
                <span className="text-[11px] text-[#596579] truncate block" title={projectName}>
                  {projectName}
                </span>
              </div>
            </div>

            {/* Schedule Version */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]/80">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Schedule Version
                </span>
                <span className="font-bold text-[#172033] block truncate">
                  {scheduleVersion}
                </span>
                <span className="text-[11px] text-[#596579] block">
                  184 Physical Activities · CPM Baseline
                </span>
              </div>
            </div>

            {/* Reporting Date */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]/80">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0 font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Reporting Date (Data Date)
                </span>
                <span className="font-bold text-[#172033] block">
                  {reportingDate}
                </span>
                <span className="text-[11px] text-[#596579] block">
                  Cutoff: 17:30 IST · Shift A Ingested
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOP SUMMARY:
            - Planned Progress
            - Actual Progress
            - Variance
            - Activities Ahead
            - Activities On Track
            - Activities Behind
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {/* 1. Planned Progress */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Planned Progress
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {summaryMetrics.plannedProgress.toFixed(1)}%
              </span>
            </div>
            <span className="text-[11px] text-[#596579] mt-1 block">
              Baseline target
            </span>
          </div>

          {/* 2. Actual Progress */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Actual Progress
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#176B87] font-mono">
                {summaryMetrics.actualProgress.toFixed(1)}%
              </span>
            </div>
            <span className="text-[11px] text-[#2E7D5B] mt-1 block font-medium">
              Verified field outputs
            </span>
          </div>

          {/* 3. Variance */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Physical Variance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.variance.toFixed(1)}%
              </span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Behind by 7.0%
            </span>
          </div>

          {/* 4. Activities Ahead (Positive) */}
          <button
            type="button"
            onClick={() => {
              setSelectedSemanticFilter(selectedSemanticFilter === 'Positive' ? 'ALL' : 'Positive');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedSemanticFilter === 'Positive'
                ? 'bg-[#EDF7F2] border-[#2E7D5B] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Activities Ahead
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#2E7D5B] font-mono">
                {summaryMetrics.activitiesAhead}
              </span>
              <span className="text-[11px] text-[#596579]">tasks</span>
            </div>
            <span className="text-[11px] text-[#2E7D5B] mt-1 block font-medium">
              Positive (+ Variance)
            </span>
          </button>

          {/* 5. Activities On Track (Neutral) */}
          <button
            type="button"
            onClick={() => {
              setSelectedSemanticFilter(selectedSemanticFilter === 'Neutral' ? 'ALL' : 'Neutral');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedSemanticFilter === 'Neutral'
                ? 'bg-[#EDF5F8] border-[#176B87] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Activities On Track
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {summaryMetrics.activitiesOnTrack}
              </span>
              <span className="text-[11px] text-[#596579]">tasks</span>
            </div>
            <span className="text-[11px] text-[#596579] mt-1 block font-medium">
              Neutral (0.0% Variance)
            </span>
          </button>

          {/* 6. Activities Behind (Negative) */}
          <button
            type="button"
            onClick={() => {
              setSelectedSemanticFilter(selectedSemanticFilter === 'Negative' ? 'ALL' : 'Negative');
            }}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedSemanticFilter === 'Negative'
                ? 'bg-[#FBEFEE] border-[#B5473C] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Activities Behind
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.activitiesBehind}
              </span>
              <span className="text-[11px] text-[#596579]">tasks</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Negative (- Variance)
            </span>
          </button>
        </div>

        {/* =========================================================================
            MAIN CHART: Planned vs Actual over time (Physical Progress S-Curve)
            Pure schedule physical progress — zero financial EVM formulas
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D9DEE5]/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#172033]">
                  Physical Progress Tracking: Planned vs Actual Over Time
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                  S-Curve Trajectory
                </span>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Compares cumulative scheduled baseline progress against verified site execution up to {reportingDate}.
              </p>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#596579] inline-block" />
                <span className="w-2 h-2 rounded-full bg-[#596579] inline-block" />
                <span className="text-[#596579] font-medium">Planned Baseline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#2E7D5B] inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#2E7D5B] inline-block" />
                <span className="text-[#2E7D5B] font-bold">Actual Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-[#D98B32] border-t border-dashed border-[#D98B32] inline-block" />
                <span className="w-2 h-2 rounded-full bg-[#D98B32] inline-block" />
                <span className="text-[#D98B32] font-medium">Forecast Path</span>
              </div>
            </div>
          </div>

          {/* SVG S-CURVE VISUALIZATION */}
          <div className="relative pt-2">
            <div className="w-full h-64 sm:h-72">
              <svg viewBox="0 0 800 260" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Horizontal Grid lines (0%, 25%, 50%, 75%, 100%) */}
                {[0, 25, 50, 75, 100].map((val) => {
                  const y = 220 - (val / 100) * 200;
                  return (
                    <g key={val}>
                      <line x1="50" y1={y} x2="780" y2={y} stroke="#E8EBF0" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="42" y={y + 4} textAnchor="end" fontSize="10" fill="#8A94A6" fontFamily="monospace">
                        {val}%
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Data Date Line (18 Sep 2026) */}
                <line x1="467" y1="20" x2="467" y2="220" stroke="#176B87" strokeWidth="1.5" strokeDasharray="4 2" />
                <rect x="420" y="8" width="94" height="18" rx="4" fill="#EDF5F8" stroke="#B3CBE0" strokeWidth="1" />
                <text x="467" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#176B87">
                  Data Date (18 Sep)
                </text>

                {/* 1. PLANNED CURVE: Blue/Slate Baseline Line */}
                <path
                  d="M 50 196 L 154 164 L 258 130 L 362 90 L 467 60 L 571 36 L 675 24 L 780 20"
                  fill="none"
                  stroke="#8A94A6"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />

                {/* 2. FORECAST PROJECTION: Amber Line after Data Date */}
                <path
                  d="M 467 74 L 571 44 L 675 30 L 780 20"
                  fill="none"
                  stroke="#D98B32"
                  strokeWidth="2.5"
                  strokeDasharray="3 3"
                />

                {/* 3. ACTUAL VERIFIED CURVE: Green Solid Line up to Data Date */}
                <path
                  d="M 50 196 L 154 160 L 258 124 L 362 92 L 467 74"
                  fill="none"
                  stroke="#2E7D5B"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Fill area beneath actual */}
                <path
                  d="M 50 196 L 154 160 L 258 124 L 362 92 L 467 74 L 467 220 L 50 220 Z"
                  fill="#EDF7F2"
                  opacity="0.35"
                />

                {/* Data Points */}
                {TIME_SERIES_DATA.map((pt, idx) => {
                  const x = 50 + idx * 104.28;
                  const yPlanned = 220 - (pt.planned / 100) * 200;
                  const yActual = pt.actual !== null ? 220 - (pt.actual / 100) * 200 : null;
                  const isSelected = selectedChartPoint.period === pt.period;

                  return (
                    <g key={pt.period} className="cursor-pointer" onClick={() => setSelectedChartPoint(pt)}>
                      {/* X-axis label */}
                      <text x={x} y="240" textAnchor="middle" fontSize="10" fill={pt.isDataDate ? '#176B87' : '#596579'} fontWeight={pt.isDataDate ? 'bold' : 'normal'}>
                        {pt.period}
                      </text>

                      {/* Planned node */}
                      <circle cx={x} cy={yPlanned} r="3.5" fill="#FFFFFF" stroke="#8A94A6" strokeWidth="2" />

                      {/* Actual node */}
                      {yActual !== null && (
                        <circle
                          cx={x}
                          cy={yActual}
                          r={isSelected ? '6' : '4.5'}
                          fill={isSelected ? '#176B87' : '#2E7D5B'}
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Period Snapshot Banner */}
            <div className="mt-3 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#172033]">
                  Selected Period: <strong className="text-[#176B87] font-mono">{selectedChartPoint.dateLabel}</strong>
                </span>
                <span className="text-[#8A94A6]">·</span>
                <span className="text-[#596579]">{selectedChartPoint.notes}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span>Planned: <strong>{selectedChartPoint.planned}%</strong></span>
                {selectedChartPoint.actual !== null ? (
                  <>
                    <span>Actual: <strong className="text-[#2E7D5B]">{selectedChartPoint.actual}%</strong></span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        selectedChartPoint.actual - selectedChartPoint.planned < 0
                          ? 'bg-[#FBEFEE] text-[#B5473C]'
                          : 'bg-[#EDF7F2] text-[#2E7D5B]'
                      }`}
                    >
                      Variance: {(selectedChartPoint.actual - selectedChartPoint.planned).toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <span>Forecast: <strong className="text-[#D98B32]">{selectedChartPoint.forecast}%</strong></span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN TABLE:
            - Activity ID
            - Activity
            - Planned %
            - Actual %
            - Variance (Positive, Neutral, Negative semantics)
            - Planned Finish
            - Forecast Finish
            - Status
            - Last Verified Update
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs space-y-0">
          {/* Table Header & Controls */}
          <div className="p-4 border-b border-[#D9DEE5]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A94A6] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Variance Semantic Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[#8A94A6] font-medium text-[11px]">Variance Semantics:</span>
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

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[#8A94A6] font-medium text-[11px]">Status:</span>
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

          {/* TABLE CONTAINER */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                  <th className="p-3.5 whitespace-nowrap">Activity ID</th>
                  <th className="p-3.5 min-w-[220px]">Activity</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Planned %</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Actual %</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Variance</th>
                  <th className="p-3.5 whitespace-nowrap">Planned Finish</th>
                  <th className="p-3.5 whitespace-nowrap">Forecast Finish</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 min-w-[240px]">Last Verified Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#596579]">
                      <Info className="w-8 h-8 text-[#8A94A6] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#172033]">No activities match your filters</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSemanticFilter('ALL');
                          setSelectedStatusFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-2 text-xs font-semibold text-[#176B87] hover:underline"
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map((act) => {
                    const varStyle = getVarianceStyle(act.varianceSemantic, act.variancePercent);

                    return (
                      <tr
                        key={act.id}
                        onClick={() => {
                          setSelectedActivity(act);
                          openActivityDrawer(act.id, 'plan-vs-actual');
                        }}
                        className="hover:bg-[#EDF5F8]/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. Activity ID */}
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold text-[#176B87] group-hover:underline">
                          <div className="flex items-center gap-1.5">
                            <span>{act.id}</span>
                            {act.isCritical && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                                CP
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Activity Name & WBS */}
                        <td className="p-3.5">
                          <div className="font-bold text-[#172033]">{act.name}</div>
                          <div className="text-[11px] text-[#596579] flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[#8A94A6]">WBS {act.wbs}</span>
                            <span>•</span>
                            <span>{act.discipline}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{act.area}</span>
                          </div>
                        </td>

                        {/* 3. Planned % */}
                        <td className="p-3.5 whitespace-nowrap text-right font-mono font-semibold text-[#596579]">
                          {act.plannedPercent}%
                        </td>

                        {/* 4. Actual % */}
                        <td className="p-3.5 whitespace-nowrap text-right font-mono font-bold text-[#172033]">
                          {act.actualPercent}%
                        </td>

                        {/* 5. Variance (Semantics: Positive, Neutral, Negative) */}
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold border ${varStyle.bg} ${varStyle.border} ${varStyle.text}`}
                          >
                            {act.varianceSemantic === 'Positive' && <TrendingUp className="w-3 h-3" />}
                            {act.varianceSemantic === 'Negative' && <TrendingDown className="w-3 h-3" />}
                            {act.varianceSemantic === 'Neutral' && <Check className="w-3 h-3" />}
                            <span>{varStyle.label}</span>
                          </span>
                        </td>

                        {/* 6. Planned Finish */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#596579]">
                          {act.plannedFinish}
                        </td>

                        {/* 7. Forecast Finish */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#172033] font-bold">
                          {act.forecastFinish}
                        </td>

                        {/* 8. Status */}
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

                        {/* 9. Last Verified Update */}
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

          {/* Table Footer */}
          <div className="p-3.5 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#596579]">
            <span>
              Showing <strong>{filteredActivities.length}</strong> of <strong>{activities.length}</strong> schedule activities
            </span>
            <span className="text-[11px] text-[#8A94A6]">
              Click any activity to inspect progress history in the Activity Detail Drawer
            </span>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
