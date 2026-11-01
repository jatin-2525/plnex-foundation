'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Drawer } from '../../components/shared/Drawer';
import { WhyButton } from '../../components/shared/WhyButton';
import { HorizontalBarChart } from '../../components/shared/charts';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DisciplineType } from '../../types';
import {
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Camera,
  FileText,
  User,
  GitBranch,
  Activity,
  SlidersHorizontal,
  Sliders,
  X,
  ChevronDown,
  Info,
  ShieldCheck,
  Zap,
  Layers,
  TrendingDown,
  Check,
} from 'lucide-react';

export type DelayCriticality = 'Critical Path' | 'Secondary Float' | 'Buffered';
export type MitigationStatus = 'Unmitigated Slip' | 'Recovery In Progress' | 'Schedule Realignment' | 'Recovered';

export interface DownstreamActivityImpact {
  activityId: string;
  stepLabel: string; // e.g. "Activity A", "Activity B", "Activity C"
  name: string;
  wbs: string;
  discipline: DisciplineType;
  originalPlannedFinish: string;
  projectedFinish: string;
  downstreamDelayDays: number; // e.g. +2, +3, +5 days
  floatImpact: string;
  isCritical: boolean;
  relationship: string; // e.g. "FS +0d"
}

export interface DependencyChainNode {
  step: string; // "Activity A", "Activity B", "Activity C"
  activityId: string;
  name: string;
  discipline: DisciplineType;
  status: 'Completed' | 'Delayed' | 'Blocked' | 'At Risk' | 'Milestone';
  delayText: string;
  depTypeToNext?: string; // "FS (Finish-to-Start) +0d"
  floatRemaining: string;
}

export interface ScheduleDelayItem {
  id: string; // e.g. "DLY-CIV-01"
  title: string;
  sourceActivityId: string;
  sourceActivityName: string;
  sourceWbs: string;
  sourceDiscipline: DisciplineType;
  delayDays: number; // e.g. 5.0
  criticality: DelayCriticality;
  criticalPathSlipDays: number;
  totalFloatDays: number;
  remainingFloatDays: number;
  affectedCount: number;
  dependencyType: 'FS (Finish-to-Start)' | 'SS (Start-to-Start)' | 'FF (Finish-to-Finish)';
  cause: string;
  evidence: string;
  affectedActivities: string[];
  dependency: string;
  currentImpact: string;
  recommendedAction: string;
  owner: string;
  ownerRole: string;
  status: MitigationStatus;
  whyDelayed: string[];
  evidenceItems: Array<{
    id: string;
    title: string;
    type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE';
    timestamp: string;
  }>;
  delayDurationDetails: {
    grossDelayDays: number;
    absorbedFloatDays: number;
    netCriticalSlipDays: number;
  };
  downstreamImpacts: DownstreamActivityImpact[];
  projectedImpact: {
    targetCompletionShift: string;
    milestoneExposed: string;
    contingencyConsumed: string;
  };
  currentMitigation: string;
  nextAction: {
    action: string;
    assignee: string;
    dueDate: string;
  };
  dependencyChain: DependencyChainNode[];
}

export const MOCK_SCHEDULE_DELAYS: ScheduleDelayItem[] = [
  {
    id: 'DLY-CIV-01',
    title: 'Compressor Bay Baseplate Grouting & Curing Hold',
    sourceActivityId: 'CIV-11-002',
    sourceActivityName: 'Compressor House Baseplate Grouting & Anchor Setting',
    sourceWbs: '2.1.2',
    sourceDiscipline: 'Civil',
    delayDays: 5.0,
    criticality: 'Critical Path',
    criticalPathSlipDays: 5.0,
    totalFloatDays: 0,
    remainingFloatDays: 0,
    affectedCount: 3,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Soil bearing capacity re-test delay following monsoon ground saturation & delayed rebar cage delivery',
    evidence: 'EVD-012: Concrete Curing Cylinder Compression Test Report (DPR-014)',
    affectedActivities: [
      'Activity A: Column Baseplate Preparation',
      'Activity B: Column Installation',
      'Activity C: Equipment Installation',
    ],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Delays structural column erection by 5 days and downstream heavy equipment placement by 5 days',
    recommendedAction: 'Mobilize rapid-curing accelerator mix and double-shift column rigger crew to recover 2 days',
    owner: 'S. Ramanathan',
    ownerRole: 'Civil Execution Lead',
    status: 'Recovery In Progress',
    whyDelayed: [
      'Soil bearing capacity re-test delay following monsoon ground saturation',
      'Delayed delivery of high-tensile rebar cage assembly from secondary fabricator',
      'Mandatory 7-day cylinder compressive strength curing hold before anchor bolt pull test',
    ],
    evidenceItems: [
      { id: 'EVD-012', title: 'CONCRETE_CYLINDER_BREAK_REPORT_DPR014.pdf', type: 'DOCUMENT', timestamp: '14:30 IST' },
      { id: 'EVD-013', title: 'IMG_PEDESTAL_REBAR_CAGE_INSPECTION.jpg', type: 'PHOTO', timestamp: '11:15 IST' },
    ],
    delayDurationDetails: {
      grossDelayDays: 5.0,
      absorbedFloatDays: 0.0,
      netCriticalSlipDays: 5.0,
    },
    downstreamImpacts: [
      {
        activityId: 'CIV-11-002',
        stepLabel: 'Activity A',
        name: 'Column Baseplate Preparation',
        wbs: '2.1.2',
        discipline: 'Civil',
        originalPlannedFinish: '18 Oct 2026',
        projectedFinish: '20 Oct 2026',
        downstreamDelayDays: 2.0,
        floatImpact: 'Zero Float · Anchor bolt alignment delayed by 2 days',
        isCritical: true,
        relationship: 'FS +0d',
      },
      {
        activityId: 'STR-02-004',
        stepLabel: 'Activity B',
        name: 'Column Installation',
        wbs: '2.2.1',
        discipline: 'Civil',
        originalPlannedFinish: '25 Oct 2026',
        projectedFinish: '28 Oct 2026',
        downstreamDelayDays: 3.0,
        floatImpact: 'Zero Float · Structural steel crane mobilization pushed by 3 days',
        isCritical: true,
        relationship: 'FS +0d',
      },
      {
        activityId: 'MEC-03-010',
        stepLabel: 'Activity C',
        name: 'Equipment Installation',
        wbs: '4.1.2',
        discipline: 'Mechanical',
        originalPlannedFinish: '10 Nov 2026',
        projectedFinish: '15 Nov 2026',
        downstreamDelayDays: 5.0,
        floatImpact: 'Direct 5-day handoff slip from column alignment',
        isCritical: true,
        relationship: 'FS +0d',
      },
    ],
    projectedImpact: {
      targetCompletionShift: '+5.0 Days on Unit A Compressor Hall Civil Milestone',
      milestoneExposed: 'Civil Handover to Mechanical Erection Milestone MS-02',
      contingencyConsumed: '100% of Compressor Hall foundation float consumed',
    },
    currentMitigation:
      'Mobilize rapid-curing accelerator mix and double-shift column rigger crew to recover 2 days.',
    nextAction: {
      action: 'S. Ramanathan to verify 7-day cube compression test at 14:00 IST and approve column anchor baseplate erection.',
      assignee: 'S. Ramanathan',
      dueDate: '19 Sep 2026, 14:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'CIV-11-001',
        name: 'Foundation Block A',
        discipline: 'Civil',
        status: 'Delayed',
        delayText: '+5 days (Actual Delay)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '0d Float (Driving Critical Path)',
      },
      {
        step: 'Activity B',
        activityId: 'STR-02-004',
        name: 'Column Installation',
        discipline: 'Civil',
        status: 'Blocked',
        delayText: 'Activity B +3 days',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Buffer exhausted',
      },
      {
        step: 'Activity C',
        activityId: 'MEC-03-010',
        name: 'Equipment Installation',
        discipline: 'Mechanical',
        status: 'At Risk',
        delayText: 'Activity C +5 days',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Critical Path Slip',
      },
    ],
  },
  {
    id: 'DLY-PIP-02',
    title: 'Line 24 Hydrotest Critical Path Slip & Hold',
    sourceActivityId: 'PIP-24-002',
    sourceActivityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
    sourceWbs: '3.2.2',
    sourceDiscipline: 'Piping',
    delayDays: 3.5,
    criticality: 'Critical Path',
    criticalPathSlipDays: 2.0,
    totalFloatDays: 1.5,
    remainingFloatDays: 0,
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Predecessor spool rigging hold, monsoon rain stoppage, RT inspection backlog',
    evidence: 'EVD-003: IMG_20260918_WELD_BUTT_J04.jpg & WELD_LOG_SHEET_SHIFT_A.pdf',
    affectedActivities: [
      'Activity A: RT Joint Clearance Hold',
      'Activity B: Hydrostatic Test Section Line 24-XX',
      'Activity C: Mount Pressure & Temperature Transmitters',
    ],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Absorbs remaining 1.5d buffer; delays pre-commissioning readiness by 2.0 days on critical path',
    recommendedAction: 'Deploy second shift radiographic testing (RT) crew at 19:00 IST to clear 4 butt welds overnight',
    owner: 'Debajit Borah',
    ownerRole: 'Lead Site Execution Engineer',
    status: 'Recovery In Progress',
    whyDelayed: [
      'Predecessor spool erection finished 2 days late due to crane rigging hold',
      'Monsoon rain squall stoppage on 18 Sep from 11:30 to 13:00 IST',
      'Radiographic testing (RT) inspection crew night-shift backlog (8 joints pending clearance)',
    ],
    evidenceItems: [
      { id: 'EVD-003', title: 'IMG_20260918_WELD_BUTT_J04.jpg', type: 'PHOTO', timestamp: '16:30 IST' },
      { id: 'EVD-004', title: 'WELD_LOG_SHEET_SHIFT_A.pdf', type: 'DOCUMENT', timestamp: '16:15 IST' },
    ],
    delayDurationDetails: {
      grossDelayDays: 3.5,
      absorbedFloatDays: 1.5,
      netCriticalSlipDays: 2.0,
    },
    downstreamImpacts: [
      {
        activityId: 'PIP-24-002-B',
        stepLabel: 'Activity A',
        name: 'Radiographic Inspection Clearance',
        wbs: '3.2.2',
        discipline: 'Piping',
        originalPlannedFinish: '19 Sep 2026',
        projectedFinish: '20 Sep 2026',
        downstreamDelayDays: 1.5,
        floatImpact: 'Absorbed 1.5d buffer; 0d float remaining',
        isCritical: true,
        relationship: 'FS +0d',
      },
      {
        activityId: 'PIP-24-003',
        stepLabel: 'Activity B',
        name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
        wbs: '3.2.3',
        discipline: 'Piping',
        originalPlannedFinish: '22 Sep 2026',
        projectedFinish: '24 Sep 2026',
        downstreamDelayDays: 2.0,
        floatImpact: 'Zero Float · Now driving Project Milestone M4',
        isCritical: true,
        relationship: 'FS +0d',
      },
      {
        activityId: 'INS-04-015',
        stepLabel: 'Activity C',
        name: 'Mount Pressure & Temperature Transmitters',
        wbs: '6.2.1',
        discipline: 'Instrumentation',
        originalPlannedFinish: '28 Sep 2026',
        projectedFinish: '30 Sep 2026',
        downstreamDelayDays: 2.0,
        floatImpact: 'Successor tie shifted by 2.0 days',
        isCritical: true,
        relationship: 'FS +0d',
      },
    ],
    projectedImpact: {
      targetCompletionShift: '+2.0 Days (15 Dec -> 17 Dec 2026)',
      milestoneExposed: 'Gas-In Readiness Milestone MS-04',
      contingencyConsumed: '100% of Line 24 buffer consumed',
    },
    currentMitigation:
      'Deploy second shift radiographic testing (RT) crew at 19:00 IST to clear 4 butt welds overnight. Expedite warehouse delivery of 150 bar test flanges.',
    nextAction: {
      action: 'Debajit Borah to verify morning RT radiograph clearance and inspect flange delivery by 09:00 IST tomorrow.',
      assignee: 'Debajit Borah',
      dueDate: '19 Sep 2026, 09:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'PIP-24-001',
        name: 'Erect Line 24-XX Spool Assembly',
        discipline: 'Piping',
        status: 'Completed',
        delayText: 'Activity A Completed (+2d slip)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '0d Float',
      },
      {
        step: 'Activity B',
        activityId: 'PIP-24-002',
        name: 'Weld Line 24-XX Field Joints',
        discipline: 'Piping',
        status: 'Delayed',
        delayText: 'Activity B +3.5 days Delay (65% Actual)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '0d Float (Driving)',
      },
      {
        step: 'Activity C',
        activityId: 'PIP-24-003',
        name: 'Hydrostatic Test Section Line 24-XX',
        discipline: 'Piping',
        status: 'Blocked',
        delayText: 'Activity C +2.0 days Critical Slip',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Buffer exhausted',
      },
    ],
  },
  {
    id: 'DLY-ELE-03',
    title: 'Overhead Gallery Cable Pull Handover Hold',
    sourceActivityId: 'ELE-11-032',
    sourceActivityName: 'Cable Tray Installation - Substation to Compressor Bay',
    sourceWbs: '5.1.1',
    sourceDiscipline: 'Electrical',
    delayDays: 2.0,
    criticality: 'Secondary Float',
    criticalPathSlipDays: 0.0,
    totalFloatDays: 4.0,
    remainingFloatDays: 2.0,
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Cantilever gallery support brackets delivered 2 days late by fabrication vendor',
    evidence: 'EVD-009: CABLE_TRAY_BRACKET_INSPECTION.pdf',
    affectedActivities: [
      'Activity A: Bracket Mounting & Alignment',
      'Activity B: Pull Cable Tray TR-04 Main Feeder',
      'Activity C: Substation Cable Terminations',
    ],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Delays multi-core control cable pull to Compressor C-101; absorbs 2.0d available float',
    recommendedAction: 'Re-sequence cable tray installation to prioritize Bay 1 to allow instrumentation cabling to commence independently',
    owner: 'Ankur Saikia',
    ownerRole: 'Electrical Execution Engineer',
    status: 'Unmitigated Slip',
    whyDelayed: [
      'Cantilever gallery support brackets delivered 2 days late by fabrication vendor',
      'Cable tray laying rate (40% vs 50% planned) hindered by scaffold sharing with mechanical crew',
    ],
    evidenceItems: [
      { id: 'EVD-009', title: 'CABLE_TRAY_BRACKET_INSPECTION.pdf', type: 'INSPECTION_NOTE', timestamp: '15:00 IST' },
    ],
    delayDurationDetails: {
      grossDelayDays: 2.0,
      absorbedFloatDays: 2.0,
      netCriticalSlipDays: 0.0,
    },
    downstreamImpacts: [
      {
        activityId: 'ELE-11-033',
        stepLabel: 'Activity A',
        name: 'Bracket Mounting & Alignment',
        wbs: '5.1.2',
        discipline: 'Electrical',
        originalPlannedFinish: '19 Sep 2026',
        projectedFinish: '20 Sep 2026',
        downstreamDelayDays: 1.0,
        floatImpact: '3d Float Remaining',
        isCritical: false,
        relationship: 'FS +0d',
      },
      {
        activityId: 'ELE-06-004',
        stepLabel: 'Activity B',
        name: 'Pull Cable Tray TR-04 Main Feeder',
        wbs: '4.1.2',
        discipline: 'Electrical',
        originalPlannedFinish: '22 Sep 2026',
        projectedFinish: '24 Sep 2026',
        downstreamDelayDays: 2.0,
        floatImpact: 'Remaining float reduced from 4d to 2d (Absorbed)',
        isCritical: false,
        relationship: 'FS +0d',
      },
      {
        activityId: 'ELE-08-012',
        stepLabel: 'Activity C',
        name: 'Substation Cable Terminations',
        wbs: '4.2.1',
        discipline: 'Electrical',
        originalPlannedFinish: '28 Sep 2026',
        projectedFinish: '30 Sep 2026',
        downstreamDelayDays: 2.0,
        floatImpact: '2d Float Remaining · No critical path slip',
        isCritical: false,
        relationship: 'FS +0d',
      },
    ],
    projectedImpact: {
      targetCompletionShift: '0.0 Days net project slip (absorbed by secondary float)',
      milestoneExposed: 'Substation Energization Window',
      contingencyConsumed: '50% of electrical gallery float absorbed',
    },
    currentMitigation:
      'Re-sequenced cable tray installation to prioritize Bay 1 to allow instrumentation cabling to commence independently.',
    nextAction: {
      action: 'Ankur Saikia to inspect 80 meters tray section handover on 19 Sep afternoon.',
      assignee: 'Ankur Saikia',
      dueDate: '19 Sep 2026, 14:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'CIV-11-001',
        name: 'Foundation Block A Pedestal',
        discipline: 'Civil',
        status: 'Completed',
        delayText: 'Activity A Completed on schedule',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '4d Float',
      },
      {
        step: 'Activity B',
        activityId: 'ELE-11-032',
        name: 'Cable Tray Installation Substation',
        discipline: 'Electrical',
        status: 'Delayed',
        delayText: 'Activity B +2.0 Days Delay (40% Actual)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '2d Float Remaining',
      },
      {
        step: 'Activity C',
        activityId: 'ELE-06-004',
        name: 'Pull Main Feeder TR-04',
        discipline: 'Electrical',
        status: 'At Risk',
        delayText: 'Activity C Handoff delayed by 2 days',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Secondary float absorbed',
      },
    ],
  },
  {
    id: 'DLY-MEC-04',
    title: 'Flare K.O. Drum Interconnect Piping Clash',
    sourceActivityId: 'MEC-02-008',
    sourceActivityName: 'Align Flare K.O. Drum Vessel',
    sourceWbs: '5.2.4',
    sourceDiscipline: 'Mechanical',
    delayDays: 1.0,
    criticality: 'Buffered',
    criticalPathSlipDays: 0.0,
    totalFloatDays: 20.0,
    remainingFloatDays: 19.0,
    affectedCount: 2,
    dependencyType: 'SS (Start-to-Start)',
    cause: 'Nozzle N-2 bolt circle orientation required 15mm cold shimming adjustment',
    evidence: 'EVD-010: FLANGE_ALIGNMENT_REPORT.pdf',
    affectedActivities: [
      'Activity A: Pedestal Shimming & Re-torque',
      'Activity B: Connect Flare Header Spool to Drum',
      'Activity C: Flare Drum Level Transmitter Loop Check',
    ],
    dependency: 'SS (Start-to-Start) +1d',
    currentImpact: 'Minor nozzle N-2 alignment mismatch requires cold shimming; non-critical float absorbs delay',
    recommendedAction: 'Mechanical shimming crew adjusted pedestal pads; perform final torque check',
    owner: 'Debajit Borah',
    ownerRole: 'Lead Site Execution Engineer',
    status: 'Schedule Realignment',
    whyDelayed: [
      'Nozzle N-2 bolt circle orientation required 15mm cold shimming adjustment',
      'Torque wrench calibration certificate expired on site, replaced within 4 hours',
    ],
    evidenceItems: [
      { id: 'EVD-010', title: 'FLANGE_ALIGNMENT_REPORT.pdf', type: 'INSPECTION_NOTE', timestamp: '10:30 IST' },
    ],
    delayDurationDetails: {
      grossDelayDays: 1.0,
      absorbedFloatDays: 1.0,
      netCriticalSlipDays: 0.0,
    },
    downstreamImpacts: [
      {
        activityId: 'MEC-02-009',
        stepLabel: 'Activity A',
        name: 'Pedestal Shimming & Re-torque',
        wbs: '5.2.4',
        discipline: 'Mechanical',
        originalPlannedFinish: '17 Sep 2026',
        projectedFinish: '18 Sep 2026',
        downstreamDelayDays: 0.5,
        floatImpact: '20d Float Remaining',
        isCritical: false,
        relationship: 'SS +0d',
      },
      {
        activityId: 'PIP-28-004',
        stepLabel: 'Activity B',
        name: 'Connect Flare Header Spool to Drum',
        wbs: '5.2.5',
        discipline: 'Piping',
        originalPlannedFinish: '20 Sep 2026',
        projectedFinish: '21 Sep 2026',
        downstreamDelayDays: 1.0,
        floatImpact: '19d Float Remaining (Ample buffer)',
        isCritical: false,
        relationship: 'FS +0d',
      },
      {
        activityId: 'INS-07-002',
        stepLabel: 'Activity C',
        name: 'Flare Drum Level Transmitter Loop Check',
        wbs: '6.3.1',
        discipline: 'Instrumentation',
        originalPlannedFinish: '24 Sep 2026',
        projectedFinish: '25 Sep 2026',
        downstreamDelayDays: 1.0,
        floatImpact: '19d Float Remaining · No commercial slip',
        isCritical: false,
        relationship: 'FS +0d',
      },
    ],
    projectedImpact: {
      targetCompletionShift: '0.0 Days net project slip (absorbed by 20d float buffer)',
      milestoneExposed: 'None (Absorbed by Flare System contingency float)',
      contingencyConsumed: '5% of Flare KO Drum float consumed',
    },
    currentMitigation:
      'Mechanical shimming crew adjusted pedestal pads; final bolt torquing completed on 18 Sep.',
    nextAction: {
      action: 'Complete N-2 flange joint pneumatic bubble leak test at 0.5 bar by 12:00 IST.',
      assignee: 'Debajit Borah',
      dueDate: '19 Sep 2026, 12:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'CIV-14-001',
        name: 'Pour Flare KO Drum Pad Foundation',
        discipline: 'Civil',
        status: 'Completed',
        delayText: 'Activity A Completed',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '20d Float',
      },
      {
        step: 'Activity B',
        activityId: 'MEC-02-008',
        name: 'Align Flare K.O. Drum Vessel',
        discipline: 'Mechanical',
        status: 'Delayed',
        delayText: 'Activity B +1.0 Day Delay',
        depTypeToNext: 'SS (Start-to-Start) +1d',
        floatRemaining: '19d Float Remaining',
      },
      {
        step: 'Activity C',
        activityId: 'PIP-28-004',
        name: 'Connect Flare Header Spool',
        discipline: 'Piping',
        status: 'At Risk',
        delayText: 'Activity C Start pushed by 1 day',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Positive float',
      },
    ],
  },
];

export default function DelayDependencyImpactPage() {
  const { activeProject, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  const [delays, setDelays] = useState<ScheduleDelayItem[]>(MOCK_SCHEDULE_DELAYS);
  const [selectedCriticalityFilter, setSelectedCriticalityFilter] = useState<'ALL' | DelayCriticality>('ALL');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Delay Item for prominent spotlight analysis & Drawer
  const [selectedDelay, setSelectedDelay] = useState<ScheduleDelayItem>(MOCK_SCHEDULE_DELAYS[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Top summary schedule metrics
  const summaryMetrics = useMemo(() => {
    const totalDelays = delays.length;
    const criticalDelays = delays.filter((r) => r.criticality === 'Critical Path').length;
    const maxCriticalSlip = Math.max(...delays.map((r) => r.criticalPathSlipDays), 0);
    const impactedDeps = delays.reduce((acc, curr) => acc + curr.downstreamImpacts.length, 0);
    const unmitigated = delays.filter((r) => r.status === 'Unmitigated Slip' || r.status === 'Recovery In Progress').length;

    return {
      totalDelays,
      criticalDelays,
      maxCriticalSlip: maxCriticalSlip.toFixed(1),
      impactedDependencies: impactedDeps,
      unmitigated,
    };
  }, [delays]);

  // Filtered Delays
  const filteredDelays = useMemo(() => {
    return delays.filter((r) => {
      if (selectedCriticalityFilter !== 'ALL' && r.criticality !== selectedCriticalityFilter) return false;
      if (selectedDisciplineFilter !== 'ALL' && r.sourceDiscipline !== selectedDisciplineFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSource = r.sourceActivityName.toLowerCase().includes(q) || r.sourceActivityId.toLowerCase().includes(q);
        const matchesOwner = r.owner.toLowerCase().includes(q);
        const matchesCause = r.cause.toLowerCase().includes(q);
        const matchesSuccessor = r.downstreamImpacts.some(
          (d) => d.name.toLowerCase().includes(q) || d.activityId.toLowerCase().includes(q)
        );
        return matchesId || matchesTitle || matchesSource || matchesOwner || matchesCause || matchesSuccessor;
      }

      return true;
    });
  }, [delays, selectedCriticalityFilter, selectedDisciplineFilter, searchQuery]);

  const getCriticalityStyle = (criticality: DelayCriticality) => {
    switch (criticality) {
      case 'Critical Path':
        return { bg: 'bg-[#FCE8E4]', border: 'border-[#E4B0AA]', text: 'text-[#A24335]', badge: 'Critical Path Slip' };
      case 'Secondary Float':
        return { bg: 'bg-[#FFF1D3]', border: 'border-[#F0D4A6]', text: 'text-[#8C5311]', badge: 'Buffer Consumed' };
      case 'Buffered':
      default:
        return { bg: 'bg-[#E4F4EC]', border: 'border-[#B8DCC9]', text: 'text-[#2E7D5B]', badge: 'Float Absorbed' };
    }
  };

  const getStatusStyle = (status: MitigationStatus) => {
    switch (status) {
      case 'Unmitigated Slip':
        return { bg: 'bg-[#FCE8E4]', text: 'text-[#A24335]', border: 'border-[#E4B0AA]' };
      case 'Recovery In Progress':
        return { bg: 'bg-[#FFF1D3]', text: 'text-[#8C5311]', border: 'border-[#F0D4A6]' };
      case 'Schedule Realignment':
        return { bg: 'bg-[#EAF0F5]', text: 'text-[#0F6B68]', border: 'border-[#D8E2EA]' };
      case 'Recovered':
      default:
        return { bg: 'bg-[#E4F4EC]', text: 'text-[#2E7D5B]', border: 'border-[#B8DCC9]' };
    }
  };

  const breadcrumbs = [
    { label: 'Schedule Execution' },
    { label: 'Delay & Dependency Impact', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Delay & Dependency Impact
            100% focused on schedule execution impact, predecessor ties, and float slip.
            ========================================================================= */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8E2EA]/60">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#0F6B68]/10 text-[#0F6B68]">
                  <Activity className="w-3.5 h-3.5" />
                  Schedule Execution Impact
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-[#526779] bg-[#F3F6FA] border border-[#D8E2EA]">
                  Rev 3.2 (P6 XML)
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]">
                  100% Predecessor-Successor Traceability
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#142C3F] tracking-tight">
                Delay & Dependency Impact
              </h1>
              <p className="text-sm text-[#526779] mt-1">
                Rigorous project-control analytics tracking delayed activities, physical field causes, dependent successor ties, downstream cumulative schedule impact, and critical path float consumption.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/progress"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#142C3F] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-lg transition-colors shadow-2xs"
              >
                <TrendingDown className="w-3.5 h-3.5 text-[#0F6B68]" />
                <span>Progress & Variance</span>
              </Link>
              <Link
                href="/what-if"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#142C3F] bg-white border border-[#D8E2EA] hover:bg-[#EAF0F5] rounded-lg transition-colors shadow-2xs"
              >
                <Sliders className="w-3.5 h-3.5 text-[#0F6B68]" />
                <span>What-If Simulator</span>
              </Link>
              <Link
                href="/schedule-twin"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] border border-[#0F6B68] rounded-lg shadow-xs transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Schedule Twin</span>
              </Link>
            </div>
          </div>

          {/* Explicit Compact Header Info Metadata Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#D8E2EA] pt-3 text-xs border-t border-[#D8E2EA]">
            <div className="py-2 sm:py-0 sm:pr-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F3F6FA] border border-[#D8E2EA] flex items-center justify-center text-[#0F6B68] shrink-0 font-medium">
                <GitBranch className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
                  Project & WBS
                </span>
                <span className="font-mono font-medium text-[#142C3F] text-sm block truncate">
                  {activeProject?.code || 'OIL-DUL-01'} · WBS 1.1.3
                </span>
                <span className="text-[12px] text-[#526779] truncate block">
                  {activeProject?.name || 'Duliajan Gas Processing & Pipeline Interconnect'}
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F3F6FA] border border-[#D8E2EA] flex items-center justify-center text-[#0F6B68] shrink-0 font-medium">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
                  Schedule Network Version
                </span>
                <span className="font-medium text-[#142C3F] text-sm block truncate">
                  Rev 3.2 (P6 XML)
                </span>
                <span className="text-[12px] text-[#526779] block">
                  184 Activities · Hard FS/SS Network Relationships
                </span>
              </div>
            </div>

            <div className="py-2 sm:py-0 sm:pl-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#F3F6FA] border border-[#D8E2EA] flex items-center justify-center text-[#0F6B68] shrink-0 font-medium">
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
                  Reporting Cutoff (Data Date)
                </span>
                <span className="font-medium text-[#142C3F] text-sm block">
                  18 Sept 2026, 17:30 IST
                </span>
                <span className="text-[12px] text-[#526779] block">
                  Site Verified Progress Cutoff · 4 Delays Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Schedule Delay & Critical Path Chart */}
        <HorizontalBarChart variant="delayed-activities" />

        {/* =========================================================================
            TOP SUMMARY SCHEDULE METRICS
            Strictly schedule-focused: Delayed Activities, Critical Path Slips, Float
            ========================================================================= */}
        {/* Summary Delay & Impact Metric Strip */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg shadow-xs overflow-hidden grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#D8E2EA]">
          {/* 1. Delayed Activities */}
          <button
            type="button"
            onClick={() => setSelectedCriticalityFilter('ALL')}
            className={`p-4 text-left transition-all flex flex-col justify-between ${
              selectedCriticalityFilter === 'ALL'
                ? 'bg-[#EAF0F5]'
                : 'hover:bg-[#F3F6FA]'
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                Delayed Activities
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#142C3F] font-mono">
                  {summaryMetrics.totalDelays}
                </span>
                <span className="text-[11px] text-[#526779]">activities</span>
              </div>
            </div>
            <span className="text-[12px] text-[#0F6B68] mt-1 block font-medium">
              Verified physical delays
            </span>
          </button>

          {/* 2. Critical Path Delays */}
          <button
            type="button"
            onClick={() => setSelectedCriticalityFilter(selectedCriticalityFilter === 'Critical Path' ? 'ALL' : 'Critical Path')}
            className={`p-4 text-left transition-all flex flex-col justify-between ${
              selectedCriticalityFilter === 'Critical Path'
                ? 'bg-[#FCE8E4]'
                : 'hover:bg-[#F3F6FA]'
            }`}
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                Critical Path Delays
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#A24335] font-mono">
                  {summaryMetrics.criticalDelays}
                </span>
                <span className="text-[11px] text-[#526779]">driving</span>
              </div>
            </div>
            <span className="text-[12px] text-[#A24335] mt-1 block font-medium">
              Zero float driving path
            </span>
          </button>

          {/* 3. Max Critical Path Slip */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                Max Critical Path Slip
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#A24335] font-mono">
                  +{summaryMetrics.maxCriticalSlip}d
                </span>
                <span className="text-[11px] text-[#526779]">net</span>
              </div>
            </div>
            <span className="text-[12px] text-[#A24335] mt-1 block font-medium">
              Milestone MS-02 shifted
            </span>
          </div>

          {/* 4. Dependent Activities Impacted */}
          <div className="p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                Dependent Activities
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#0F6B68] font-mono">
                  {summaryMetrics.impactedDependencies}
                </span>
                <span className="text-[11px] text-[#526779]">successors</span>
              </div>
            </div>
            <span className="text-[12px] text-[#526779] mt-1 block">
              Downstream handoffs exposed
            </span>
          </div>

          {/* 5. Float Consumed */}
          <div className="p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#526779] block">
                Critical Float Consumed
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-[#845006] font-mono">
                  100%
                </span>
                <span className="text-[11px] text-[#526779]">Path 1</span>
              </div>
            </div>
            <span className="text-[12px] text-[#845006] mt-1 block font-medium">
              0d float buffer remaining
            </span>
          </div>
        </div>

        {/* =========================================================================
            PROMINENT CARD: SCHEDULE DELAY SPOTLIGHT & DOWNSTREAM IMPACT CASCADE
            Directly shows the 6 mandated dimensions:
            1. Delayed Activity (Foundation Block A)
            2. Delay Duration (+5 days)
            3. Cause
            4. Dependent Activities
            5. Downstream Impact (Activity A +2d, Activity B +3d, Activity C +5d)
            6. Critical Path Impact
            ========================================================================= */}
        <div className="bg-white border-2 border-[#0F6B68]/50 border-l-4 border-l-[#A24335] rounded-lg p-4 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#D8E2EA]/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#A24335] text-white">
                Schedule Delay Spotlight
              </span>
              <h2 className="text-sm font-bold text-[#142C3F] uppercase tracking-wider">
                {selectedDelay.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-0.5 rounded text-xs font-bold border ${getCriticalityStyle(selectedDelay.criticality).bg} ${getCriticalityStyle(selectedDelay.criticality).border} ${getCriticalityStyle(selectedDelay.criticality).text}`}
              >
                {getCriticalityStyle(selectedDelay.criticality).badge}
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="px-3 py-1 bg-white hover:bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA] font-bold text-xs rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1"
              >
                <span>Open Dependency Drawer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT (Cols 1-7): DELAY PARTICULARS, CAUSE, EVIDENCE & CRITICAL PATH IMPACT */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Delayed Activity (Source Activity) */}
                <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] border-l-4 border-l-[#0F6B68]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] uppercase font-bold text-[#526779] tracking-wider block">
                      Delayed Activity (Source)
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#FCE8E4] text-[#A24335] border border-[#E4B0AA]">
                      0d Float (Driving)
                    </span>
                  </div>
                  <div className="font-bold text-[#142C3F] text-sm mt-1">
                    {selectedDelay.sourceActivityName}
                  </div>
                  <div className="font-mono text-xs text-[#0F6B68] mt-0.5 font-bold">
                    {selectedDelay.sourceActivityId} · WBS {selectedDelay.sourceWbs} · {selectedDelay.sourceDiscipline}
                  </div>
                </div>

                {/* 2. Delay Duration (Actual Delay) */}
                <div className="p-4 rounded-lg bg-[#FCE8E4] border border-[#E4B0AA] border-l-4 border-l-[#A24335]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] uppercase font-bold text-[#A24335] tracking-wider block">
                      Delay Duration (Actual Slip)
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`delay:${selectedDelay.id}`)}
                      title={`Why is ${selectedDelay.sourceActivityName} delayed by ${selectedDelay.delayDays} days?`}
                    />
                  </div>
                  <div className="font-bold font-mono text-[28px] text-[#A24335] leading-none">
                    +{selectedDelay.delayDays.toFixed(0)} days
                  </div>
                  <span className="text-[11px] font-medium text-[#A24335]/80 mt-1 block">
                    Verified physical execution slip from baseline
                  </span>
                </div>
              </div>

              {/* 3. Cause */}
              <div className="p-4 rounded-lg bg-[#FFF9F8] border border-[#E4B0AA] border-l-4 border-l-[#A24335] text-xs space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-[#A24335] tracking-wider block">
                  Root Cause (Physical Site Problem)
                </span>
                <p className="text-[#142C3F] text-sm font-medium leading-relaxed">
                  {selectedDelay.cause}
                </p>
                <div className="pt-2 border-t border-[#E4B0AA]/60 flex items-center gap-2 text-[11px] text-[#526779]">
                  <FileText className="w-3.5 h-3.5 text-[#0F6B68]" />
                  <span><strong>Audit Evidence: </strong><code className="text-[#142C3F] font-mono bg-white px-1.5 py-0.5 rounded border border-[#D8E2EA]">{selectedDelay.evidence}</code></span>
                </div>
              </div>

              {/* 4. Dependent Activities */}
              <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] text-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-semibold text-[#526779] tracking-wider block">
                    Dependent Activities ({selectedDelay.affectedActivities.length} Predecessor Ties)
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#0F6B68] bg-white px-2 py-0.5 rounded border border-[#D8E2EA]">
                    Dependency: {selectedDelay.dependency}
                  </span>
                </div>
                <div className="space-y-1">
                  {selectedDelay.affectedActivities.map((act, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-white border border-[#E5E9EF] font-medium text-[#142C3F]">
                      <span className="w-2 h-2 rounded-full bg-[#A24335] shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. Critical Path Impact & Float Status */}
              <div className="p-4 rounded-lg bg-[#FCE8E4]/70 border border-[#E4B0AA] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#A24335] tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Critical Path Impact & Float Consumption
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-[#A24335] bg-white px-2 py-0.5 rounded border border-[#E4B0AA]">
                      {selectedDelay.criticalPathSlipDays > 0 ? `+${selectedDelay.criticalPathSlipDays}d Net Milestone Slip` : '0d Project Slip (Float Absorbed)'}
                    </span>
                    <WhyButton
                      onClick={() => openWhyExplanation(`impact:${selectedDelay.id}`)}
                      title="Why does this delay impact the critical path?"
                    />
                  </div>
                </div>
                <p className="text-[#142C3F] font-semibold leading-relaxed">
                  Current Impact: {selectedDelay.currentImpact}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-[#526779]">
                  <div className="p-2 bg-white/80 rounded border border-[#E4B0AA]/60">
                    <span className="text-[9px] uppercase font-sans text-[#526779] block">Total Float Before Slip</span>
                    <strong className="text-[#142C3F]">{selectedDelay.totalFloatDays} Days</strong>
                  </div>
                  <div className="p-2 bg-white/80 rounded border border-[#E4B0AA]/60">
                    <span className="text-[9px] uppercase font-sans text-[#526779] block">Remaining Float Buffer</span>
                    <strong className={selectedDelay.remainingFloatDays === 0 ? 'text-[#A24335]' : 'text-[#2E7D5B]'}>
                      {selectedDelay.remainingFloatDays} Days {selectedDelay.remainingFloatDays === 0 ? '(Driving)' : ''}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Recommended Action / Mitigation */}
              <div className="p-4 rounded-lg bg-[#E4F4EC] border border-[#B8DCC9] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#2E7D5B] tracking-wider block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Recommended Action (Schedule Recovery Intervention)
                </span>
                <p className="text-[#142C3F] font-semibold leading-relaxed">
                  {selectedDelay.recommendedAction}
                </p>
                <div className="mt-2 pt-2 border-t border-[#B8DCC9]/60 flex items-center justify-between text-[11px] text-[#526779]">
                  <span>Execution Lead: <strong className="text-[#142C3F]">{selectedDelay.owner}</strong> ({selectedDelay.ownerRole})</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${getStatusStyle(selectedDelay.status).bg} ${getStatusStyle(selectedDelay.status).border} ${getStatusStyle(selectedDelay.status).text}`}>
                    {selectedDelay.status}
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT (Cols 8-12): DOWNSTREAM IMPACT CASCADE & DEPENDENCY CHAIN */}
            <div className="lg:col-span-5 p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#D8E2EA]">
                  <h3 className="text-xs font-semibold text-[#142C3F] uppercase tracking-wider flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5" />
                    Downstream Impact Cascade
                  </h3>
                  <div className="flex items-center gap-2">
                    <WhyButton
                      onClick={() => openWhyExplanation(`impact:${selectedDelay.id}`)}
                      title="Why are these downstream activities impacted?"
                    />
                    <span className="text-[10px] font-mono text-[#7B8798]">
                      Predecessor → Successor Ties
                    </span>
                  </div>
                </div>

                <div className="p-3 my-2 rounded bg-white border border-[#D8E2EA] text-[11px]">
                  <strong className="text-[#142C3F] block mb-0.5">Example Cascading Schedule Rule:</strong>
                  <div className="font-mono text-xs text-[#0F6B68] space-y-0.5">
                    <div>{selectedDelay.sourceActivityName} <span className="text-[#A24335] font-bold">+{selectedDelay.delayDays.toFixed(0)} days</span></div>
                    <div className="text-[10px] uppercase font-semibold text-[#526779] pt-1">Downstream Cascade:</div>
                    {selectedDelay.downstreamImpacts.map((d, i) => (
                      <div key={i} className="pl-2 flex items-center justify-between">
                        <span>
                          {d.stepLabel} <span className="text-[#A24335] font-bold">+{d.downstreamDelayDays} days</span> ({d.name})
                        </span>
                        <WhyButton
                          onClick={() => openWhyExplanation(`impact:${d.activityId}`)}
                          title={`Why is ${d.stepLabel} delayed by +${d.downstreamDelayDays} days?`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* VERTICAL DEPENDENCY CHAIN: Activity A ↓ Activity B ↓ Activity C */}
                <div className="space-y-2 mt-3">
                  {selectedDelay.dependencyChain.map((node, idx) => {
                    const isLast = idx === selectedDelay.dependencyChain.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <div
                          className={`p-3 rounded-lg border text-xs transition-all ${
                            node.status === 'Delayed'
                              ? 'bg-[#FCE8E4] border-[#E4B0AA] ring-1 ring-[#A24335]/30'
                              : node.status === 'Blocked'
                              ? 'bg-[#FFF1D3] border-[#F0D4A6]'
                              : node.status === 'At Risk'
                              ? 'bg-white border-[#D8E2EA]'
                              : 'bg-white border-[#D8E2EA]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#0F6B68]">
                              {node.step}
                            </span>
                            <StatusBadge status={node.status} size="xs" />
                          </div>

                          <div className="font-bold text-sm text-[#142C3F]">
                            {node.name}
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-2 mt-2 border-t border-[#D8E2EA]/60 font-mono">
                            <span className="text-[#7B8798]">{node.activityId} ({node.discipline})</span>
                            <span className={node.status === 'Delayed' ? 'text-[#A24335] font-bold' : 'text-[#142C3F] font-semibold'}>
                              {node.delayText}
                            </span>
                          </div>
                        </div>

                        {/* DOWNWARD ARROW ↓ */}
                        {!isLast && (
                          <div className="flex items-center justify-center py-0.5">
                            <div className="flex items-center gap-1 px-3 py-0.5 rounded bg-white border border-[#D8E2EA] text-[10px] font-mono font-bold text-[#0F6B68] shadow-2xs">
                              <ArrowDown className="w-3.5 h-3.5 text-[#0F6B68]" />
                              <span>{node.depTypeToNext || 'FS +0d'}</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#D8E2EA] text-center">
                <span className="text-[11px] text-[#526779]">
                  Select any row in the schedule table below to inspect its downstream chain
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SEARCH & FILTERS BAR
            ========================================================================= */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by activity ID, name, cause, or successor..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] focus:bg-white border border-[#D8E2EA] focus:border-[#0F6B68] rounded-lg text-xs outline-hidden transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#142C3F]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Criticality Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#7B8798] font-medium text-[11px]">Schedule Impact:</span>
              <select
                value={selectedCriticalityFilter}
                onChange={(e) => setSelectedCriticalityFilter(e.target.value as any)}
                className="p-2 bg-[#FAFAFA] border border-[#D8E2EA] rounded-lg text-xs font-semibold text-[#142C3F]"
              >
                <option value="ALL">All Impacts</option>
                <option value="Critical Path">Critical Path Delays</option>
                <option value="Secondary Float">Secondary Float</option>
                <option value="Buffered">Float Absorbed</option>
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[#7B8798] font-medium text-[11px]">Discipline:</span>
              <select
                value={selectedDisciplineFilter}
                onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                className="p-2 bg-[#FAFAFA] border border-[#D8E2EA] rounded-lg text-xs font-semibold text-[#142C3F]"
              >
                <option value="ALL">All Disciplines</option>
                <option value="Civil">Civil</option>
                <option value="Piping">Piping</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            SCHEDULE DELAY & DEPENDENCY REGISTER TABLE
            Shows the 6 core dimensions:
            - Delayed Activity (Source Activity)
            - Delay Duration (Actual Delay)
            - Cause
            - Dependent Activities (Affected Activities)
            - Downstream Impact
            - Critical Path Impact
            ========================================================================= */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg overflow-hidden shadow-xs">
          <div className="p-4 bg-[#F3F6FA] border-b border-[#D8E2EA] flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-xs uppercase tracking-wider text-[#142C3F]">
                Schedule Delay &amp; Dependency Impact Register
              </h3>
              <p className="text-[11px] text-[#526779] mt-0.5">
                Every record corresponds to verified field deviations propagated through CPM schedule logic.
              </p>
            </div>
            <span className="text-xs font-mono text-[#526779] bg-white px-3 py-1 rounded border border-[#D8E2EA]">
              {filteredDelays.length} active schedule delays
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm border-collapse">
              <thead className="sticky top-0 z-10 bg-[#F3F6FA]">
                <tr className="bg-[#F3F6FA] border-b border-[#D8E2EA] text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-[#526779] h-11">
                  <th className="p-4 min-w-[190px]">Delayed Activity (Source Activity)</th>
                  <th className="p-4 whitespace-nowrap text-center">Delay Duration (Actual Delay)</th>
                  <th className="p-4 min-w-[200px]">Cause</th>
                  <th className="p-4 min-w-[180px]">Dependent Activities (Affected Activities)</th>
                  <th className="p-4 min-w-[220px]">Downstream Impact</th>
                  <th className="p-4 min-w-[180px]">Critical Path Impact</th>
                  <th className="p-4 min-w-[160px]">Evidence</th>
                  <th className="p-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8E2EA]/60">
                {filteredDelays.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-[#526779]">
                      <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#142C3F]">No delays match your filter criteria</p>
                      <p className="text-xs text-[#526779] mt-1 max-w-sm mx-auto">
                        No delay events in the project register match the active criticality level, discipline, or search text.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCriticalityFilter('ALL');
                          setSelectedDisciplineFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-3 text-xs font-semibold text-[#0F6B68] hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredDelays.map((item) => {
                    const isSelected = selectedDelay.id === item.id;
                    const critStyle = getCriticalityStyle(item.criticality);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDelay(item)}
                        className={`h-11 sm:h-12 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[#EAF0F5]/70 ring-1 ring-[#0F6B68]/30' : 'hover:bg-[#F3F6FA]'
                        }`}
                      >
                        {/* 1. Delayed Activity */}
                        <td className="p-4">
                          <div className="font-semibold text-[#142C3F]">
                            {item.sourceActivityName}
                          </div>
                          <div className="font-mono text-[11px] text-[#0F6B68] mt-0.5 font-semibold">
                            {item.sourceActivityId} · WBS {item.sourceWbs} · {item.sourceDiscipline}
                          </div>
                        </td>

                        {/* 2. Delay Duration */}
                        <td className="p-4 whitespace-nowrap text-center font-mono font-bold text-[#A24335] text-sm">
                          <div className="inline-flex items-center gap-2 justify-center">
                            <span>+{item.delayDays % 1 === 0 ? item.delayDays.toFixed(0) : item.delayDays.toFixed(1)} days</span>
                            <WhyButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhyExplanation(`delay:${item.id}`);
                              }}
                              title={`Why is this activity delayed by +${item.delayDays} days?`}
                            />
                          </div>
                        </td>

                        {/* 3. Cause */}
                        <td className="p-4 text-[#526779]">
                          <p className="text-[13px] leading-relaxed line-clamp-2" title={item.cause}>
                            {item.cause}
                          </p>
                        </td>

                        {/* 4. Dependent Activities */}
                        <td className="p-4">
                          <div className="space-y-1">
                            {item.downstreamImpacts.map((d, i) => (
                              <div key={i} className="text-[11px] font-semibold text-[#142C3F] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#0F6B68] shrink-0" />
                                <span className="font-mono text-[#0F6B68]">{d.activityId}:</span>
                                <span className="truncate max-w-[130px]">{d.name}</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* 5. Downstream Impact */}
                        <td className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold uppercase text-[#526779]">Impact Cascade</span>
                            <WhyButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhyExplanation(`impact:${item.id}`);
                              }}
                              title="Why does this activity impact downstream successors?"
                            />
                          </div>
                          <div className="space-y-0.5 font-mono text-[11px]">
                            {item.downstreamImpacts.map((d, i) => (
                              <div key={i} className="text-[#A24335] font-semibold">
                                {d.stepLabel} <span className="font-bold">+{d.downstreamDelayDays} days</span>
                              </div>
                            ))}
                          </div>
                          <span className="text-[11px] text-[#7B8798] mt-1 block font-sans">
                            Dependency: {item.dependency}
                          </span>
                        </td>

                        {/* 6. Critical Path Impact */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${critStyle.bg} ${critStyle.border} ${critStyle.text}`}>
                              {critStyle.badge}
                            </span>
                            <WhyButton
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhyExplanation(`impact:${item.id}`);
                              }}
                              title="Why is this activity on the critical path?"
                            />
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-[#142C3F] font-semibold">
                            {item.criticalPathSlipDays > 0 ? `+${item.criticalPathSlipDays}d Critical Path Slip` : '0d Project Slip'}
                          </div>
                          <span className="text-[11px] text-[#526779] block">
                            Remaining Float: {item.remainingFloatDays}d
                          </span>
                        </td>

                        {/* 7. Evidence */}
                        <td className="p-4 text-[#142C3F]">
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-[#0F6B68] shrink-0" />
                            <span className="truncate max-w-[150px]" title={item.evidence}>
                              {item.evidence}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#7B8798] block mt-0.5">
                            {item.evidenceItems.length} files attached
                          </span>
                        </td>

                        {/* 8. Action */}
                        <td className="p-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDelay(item);
                              setIsDrawerOpen(true);
                            }}
                            className="px-3 py-1 text-[11px] font-bold text-[#0F6B68] hover:text-white hover:bg-[#0F6B68] border border-[#D8E2EA] rounded-lg transition-colors shadow-2xs"
                          >
                            Details &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            CALCULATION DETAILS (COLLAPSIBLE ACCORDION)
            Eliminates jargon headings from top-level view.
            Places CPM methodology, topological sort, and float math here.
            ========================================================================= */}
        <details className="group bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg overflow-hidden transition-all">
          <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs uppercase tracking-wider text-[#0F6B68] hover:bg-[#EAF0F5] transition-colors">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0F6B68]" />
              <span>Calculation Details</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#526779] font-normal">
              <span className="hidden sm:inline">Topological CPM Model Methodology & Math Formulas</span>
              <ChevronDown className="w-4 h-4 text-[#526779] group-open:rotate-180" />
            </div>
          </summary>

          <div className="p-4 sm:p-6 border-t border-[#D8E2EA] bg-white space-y-4 text-xs text-[#526779]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2">
                <h5 className="font-bold text-[#142C3F] uppercase text-[11px]">
                  1. Deterministic Network Model
                </h5>
                <p className="leading-relaxed">
                  Evaluates the Critical Path Method (CPM Network Model Rev 3.2 (P6 XML)). Activity relationships adhere to directed acyclic graph (DAG) topological constraints.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2">
                <h5 className="font-bold text-[#142C3F] uppercase text-[11px]">
                  2. Float Absorption Logic
                </h5>
                <p className="leading-relaxed">
                  Calculates Total Float using: <code className="text-[#0F6B68] font-mono font-bold">TF = Late Finish - Early Finish</code>. Delays consume buffer float first; when float drops to 0, delay propagates 1:1 to critical successors.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-2">
                <h5 className="font-bold text-[#142C3F] uppercase text-[11px]">
                  3. Relationship Types
                </h5>
                <p className="leading-relaxed">
                  Supports Finish-to-Start (FS +0d), Start-to-Start (SS), and Finish-to-Finish (FF) ties. Field progress delays trigger deterministic forward-pass recalculations across all active successors.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#EAF0F5] border border-[#D8E2EA] rounded-lg flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <span className="text-[#142C3F]">
                Need to test hypothetical what-if scenarios without affecting project baselines?
              </span>
              <Link
                href="/what-if"
                className="font-bold text-[#0F6B68] hover:underline inline-flex items-center gap-1"
              >
                <span>Launch What-if Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </details>

        {/* =========================================================================
            DEPENDENCY IMPACT DRAWER
            Full-depth inspection of delayed activity and cascading downstream effects.
            ========================================================================= */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={`Delay & Dependency Impact: ${selectedDelay.id}`}
          subtitle={selectedDelay.title}
          width="xl"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 font-semibold text-[#526779] hover:text-[#142C3F] bg-white border border-[#D8E2EA] rounded-lg"
              >
                Close Drawer
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/schedule-twin"
                  className="px-4 py-2 font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] rounded-lg shadow-sm inline-flex items-center gap-2"
                >
                  <span>Inspect in Schedule Twin</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-[#142C3F]">
            {/* HEADER KPI CARD */}
            <div className="p-4 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#0F6B68]">
                    {selectedDelay.sourceActivityId}
                  </span>
                  <span className="text-xs font-bold text-[#142C3F]">
                    {selectedDelay.sourceActivityName}
                  </span>
                </div>

                <span
                  className={`px-3 py-0.5 rounded text-xs font-bold border ${getCriticalityStyle(selectedDelay.criticality).bg} ${getCriticalityStyle(selectedDelay.criticality).border} ${getCriticalityStyle(selectedDelay.criticality).text}`}
                >
                  {getCriticalityStyle(selectedDelay.criticality).badge}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1 border-t border-[#D8E2EA]/60">
                <div>
                  <span className="text-[#526779] uppercase font-semibold text-[9px] block">Delay Duration</span>
                  <span className="font-mono font-bold text-[#A24335] text-sm">+{selectedDelay.delayDays} Days</span>
                </div>
                <div>
                  <span className="text-[#526779] uppercase font-semibold text-[9px] block">Critical Slip</span>
                  <span className="font-mono font-bold text-[#A24335] text-sm">+{selectedDelay.criticalPathSlipDays} Days</span>
                </div>
                <div>
                  <span className="text-[#526779] uppercase font-semibold text-[9px] block">Remaining Float</span>
                  <span className={`font-mono font-bold text-sm ${selectedDelay.remainingFloatDays === 0 ? 'text-[#A24335]' : 'text-[#2E7D5B]'}`}>
                    {selectedDelay.remainingFloatDays} Days
                  </span>
                </div>
                <div>
                  <span className="text-[#526779] uppercase font-semibold text-[9px] block">Lead Engineer</span>
                  <span className="font-bold text-[#142C3F]">{selectedDelay.owner}</span>
                </div>
              </div>
            </div>

            {/* DOWNSTREAM IMPACT BREAKDOWN */}
            <div className="p-4 bg-white border border-[#D8E2EA] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[#142C3F] flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5" />
                  Downstream Impact Cascade
                </h4>
                <span className="text-[10px] font-mono text-[#7B8798]">Detailed Successor Progression</span>
              </div>

              <div className="space-y-2">
                {selectedDelay.downstreamImpacts.map((d, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#F3F6FA] border border-[#D8E2EA] space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#0F6B68]">{d.stepLabel}</span>
                        <span className="font-mono text-xs font-bold text-[#142C3F]">{d.activityId}</span>
                        <span className="font-semibold text-xs text-[#142C3F]">{d.name}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-[#A24335]">
                        +{d.downstreamDelayDays} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#526779] pt-1 border-t border-[#D8E2EA]/60">
                      <span>Target: {d.originalPlannedFinish} → <strong className="text-[#A24335] font-mono">{d.projectedFinish}</strong></span>
                      <span className="font-mono text-[10px] text-[#7B8798]">{d.relationship}</span>
                    </div>
                    <p className="text-[10px] text-[#526779]">{d.floatImpact}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* DEPENDENCY CHAIN (Activity A ↓ Activity B ↓ Activity C) */}
            <div className="p-4 bg-white border border-[#D8E2EA] rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[#142C3F] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" />
                  Sequential Dependency Chain
                </h4>
                <span className="text-[10px] font-mono text-[#7B8798]">Predecessor → Successor Flow</span>
              </div>

              <div className="space-y-2 pt-1">
                {selectedDelay.dependencyChain.map((node, idx) => (
                  <div key={idx} className="relative">
                    <div className="p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#0F6B68] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#0F6B68] text-xs">
                              {node.activityId}
                            </span>
                            <span className="text-[10px] font-semibold uppercase text-[#526779]">
                              {node.step}
                            </span>
                            <span className="text-[10px] font-semibold text-[#526779] bg-white px-1.5 py-0.5 rounded border border-[#D8E2EA]">
                              {node.discipline}
                            </span>
                          </div>
                          <p className="font-bold text-[#142C3F] text-xs mt-0.5">{node.name}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <StatusBadge status={node.status} size="xs" />
                        <span className="text-[10px] text-[#7B8798] block mt-0.5 font-mono">
                          {node.floatRemaining}
                        </span>
                      </div>
                    </div>

                    {/* Vector Arrow to Next Node */}
                    {idx < selectedDelay.dependencyChain.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[#7B8798]">
                          <ArrowDown className="w-3.5 h-3.5 text-[#0F6B68]" />
                          <span>{node.depTypeToNext || 'FS +0d'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CAUSE & EVIDENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Why Delayed (Physical Root Causes) */}
              <div className="p-4 bg-[#FCE8E4] border border-[#E4B0AA] rounded-lg space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#A24335] flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Why Delayed (Physical Site Causes)
                </h4>
                <ul className="space-y-2 text-xs text-[#142C3F] list-disc list-inside">
                  {selectedDelay.whyDelayed.map((cause, idx) => (
                    <li key={idx} className="leading-relaxed">{cause}</li>
                  ))}
                </ul>
              </div>

              {/* Evidence Attached */}
              <div className="p-4 bg-white border border-[#D8E2EA] rounded-lg space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#526779] flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5 text-[#0F6B68]" />
                  Verified Site Evidence ({selectedDelay.evidenceItems.length})
                </h4>
                <div className="space-y-2">
                  {selectedDelay.evidenceItems.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {ev.type === 'PHOTO' ? (
                          <Camera className="w-3.5 h-3.5 text-[#0F6B68] shrink-0" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#526779] shrink-0" />
                        )}
                        <span className="font-mono truncate">{ev.title}</span>
                      </div>
                      <span className="text-[#7B8798] text-[10px] shrink-0">{ev.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CRITICAL PATH IMPACT & MITIGATION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#EAF0F5] border border-[#D8E2EA] rounded-lg space-y-2">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-[#142C3F]">
                  Schedule Recovery Action
                </h4>
                <p className="text-xs text-[#142C3F] leading-relaxed">
                  {selectedDelay.currentMitigation}
                </p>
              </div>

              <div className="p-4 bg-white border border-[#D8E2EA] rounded-lg space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#142C3F]">
                  Assigned Next Action
                </h4>
                <p className="text-xs font-semibold text-[#142C3F]">
                  {selectedDelay.nextAction.action}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#D8E2EA]/60 text-[11px] text-[#526779]">
                  <span>Assignee: <strong className="text-[#142C3F]">{selectedDelay.nextAction.assignee}</strong></span>
                  <span>Due: <strong className="text-[#A24335] font-mono">{selectedDelay.nextAction.dueDate}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </StateWrapper>
  );
}
