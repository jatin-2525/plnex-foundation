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
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  Layers,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Calendar,
  Camera,
  FileText,
  User,
  ShieldAlert,
  GitBranch,
  Activity,
  ChevronRight,
  ExternalLink,
  RotateCcw,
  SlidersHorizontal,
  Sliders,
  X,
  Sparkles,
} from 'lucide-react';

export type RiskSeverity = 'Critical' | 'High' | 'Moderate' | 'Low';
export type RiskStatus = 'Active' | 'Mitigating' | 'Under Review' | 'Resolved';

export interface DownstreamActivityImpact {
  activityId: string;
  name: string;
  wbs: string;
  originalPlannedFinish: string;
  projectedFinish: string;
  additionalDelayDays: number;
  floatImpact: string;
  isCritical: boolean;
}

export interface DependencyChainNode {
  step: string; // e.g. "Activity A", "Activity B", "Activity C"
  activityId: string;
  name: string;
  discipline: DisciplineType;
  status: 'Completed' | 'Delayed' | 'Blocked' | 'At Risk' | 'Milestone';
  delayText?: string;
  depTypeToNext?: string; // e.g. "FS (Finish-to-Start) +0d"
  floatRemaining?: string;
}

export interface ScheduleRisk {
  id: string; // e.g. "RSK-PIP-01"
  title: string;
  sourceActivityId: string;
  sourceActivityName: string;
  sourceWbs: string;
  sourceDiscipline: DisciplineType;
  delayDays: number;
  severity: RiskSeverity;
  affectedCount: number;
  dependencyType: 'FS (Finish-to-Start)' | 'SS (Start-to-Start)' | 'FF (Finish-to-Finish)';
  impactDescription: string;
  owner: string;
  ownerRole: string;
  status: RiskStatus;
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
  predecessors: Array<{
    id: string;
    name: string;
    status: 'Completed' | 'Delayed';
    finishDate: string;
  }>;
  successors: Array<{
    id: string;
    name: string;
    plannedStart: string;
    projectedStart: string;
    depType: string;
  }>;
  affectedDownstream: DownstreamActivityImpact[];
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

const MOCK_SCHEDULE_RISKS: ScheduleRisk[] = [
  {
    id: 'RSK-PIP-01',
    title: 'Line 24 Hydrotest Critical Path Slip & Hold',
    sourceActivityId: 'PIP-24-002',
    sourceActivityName: 'Weld Line 24-XX Field Joints & NDT Inspection',
    sourceWbs: '3.2.2',
    sourceDiscipline: 'Piping',
    delayDays: 3.5,
    severity: 'Critical',
    affectedCount: 3,
    dependencyType: 'FS (Finish-to-Start)',
    impactDescription: 'Absorbs remaining 1.5d buffer; delays pre-commissioning readiness by 2.0 days on critical path',
    owner: 'Debajit Borah',
    ownerRole: 'Lead Site Execution Engineer',
    status: 'Mitigating',
    whyDelayed: [
      'Predecessor spool erection finished 2 days late due to crane rigging hold',
      'Monsoon rain squall stoppage on 18 Sep from 11:30 to 13:00',
      'Radiographic testing (RT) inspection crew night-shift backlog (8 joints pending clearance)',
    ],
    evidenceItems: [
      { id: 'EVD-003', title: 'IMG_20260918_WELD_BUTT_J04.jpg', type: 'PHOTO', timestamp: '16:30' },
      { id: 'EVD-004', title: 'WELD_LOG_SHEET_SHIFT_A.pdf', type: 'DOCUMENT', timestamp: '16:15' },
    ],
    delayDurationDetails: {
      grossDelayDays: 3.5,
      absorbedFloatDays: 1.5,
      netCriticalSlipDays: 2.0,
    },
    predecessors: [
      { id: 'PIP-24-001', name: 'Erect Line 24-XX High Pressure Gas Header', status: 'Completed', finishDate: '14 Sep 2026' },
    ],
    successors: [
      { id: 'PIP-24-003', name: 'Hydrostatic Test Section Line 24-XX (150 bar)', plannedStart: '18 Sep 2026', projectedStart: '21 Sep 2026', depType: 'FS +0d' },
      { id: 'INS-04-015', name: 'Mount Pressure & Temperature Transmitters', plannedStart: '22 Sep 2026', projectedStart: '25 Sep 2026', depType: 'FS +0d' },
    ],
    affectedDownstream: [
      {
        activityId: 'PIP-24-003',
        name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
        wbs: '3.2.3',
        originalPlannedFinish: '22 Sep 2026',
        projectedFinish: '26 Sep 2026',
        additionalDelayDays: 3.5,
        floatImpact: 'Float depleted to 0 days (Now Driving Critical Path)',
        isCritical: true,
      },
      {
        activityId: 'INS-04-015',
        name: 'Mount Pressure & Temperature Transmitters Unit A',
        wbs: '6.2.1',
        originalPlannedFinish: '28 Sep 2026',
        projectedFinish: '02 Oct 2026',
        additionalDelayDays: 2.5,
        floatImpact: 'Successor buffer reduced by 2.0 days',
        isCritical: true,
      },
      {
        activityId: 'COMM-01-001',
        name: 'Gas Gathering Unit A Integrated Pre-Commissioning',
        wbs: '7.1.0',
        originalPlannedFinish: '15 Dec 2026',
        projectedFinish: '17 Dec 2026',
        additionalDelayDays: 2.0,
        floatImpact: 'Direct milestone slip exposure of +2 days',
        isCritical: true,
      },
    ],
    projectedImpact: {
      targetCompletionShift: '+2.0 Days (15 Dec -> 17 Dec 2026)',
      milestoneExposed: 'Gas-In Readiness Milestone MS-04',
      contingencyConsumed: '100% of Line 24 buffer consumed',
    },
    currentMitigation:
      'Deploy second shift radiographic testing (RT) crew at 19:00 IST to clear 4 butt welds overnight. Expedite warehouse delivery of 150 bar test flanges from Numaligarh refinery depot.',
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
        delayText: 'Completed (+2d slip)',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '0d',
      },
      {
        step: 'Activity B (Source of Variance)',
        activityId: 'PIP-24-002',
        name: 'Weld Line 24-XX Field Joints',
        discipline: 'Piping',
        status: 'Delayed',
        delayText: '+3.5 Days Delay (65% Actual)',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '0d Float (Driving)',
      },
      {
        step: 'Activity C (Blocked Successor)',
        activityId: 'PIP-24-003',
        name: 'Hydrostatic Test Section Line 24-XX',
        discipline: 'Piping',
        status: 'Blocked',
        delayText: 'Held pending weld RT clearance',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: 'Buffer exhausted',
      },
      {
        step: 'Activity D (Downstream Instrumentation)',
        activityId: 'INS-04-015',
        name: 'Mount Pressure Transmitters',
        discipline: 'Instrumentation',
        status: 'At Risk',
        delayText: 'Start pushed from 22 Sep to 25 Sep',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: 'Critical Path Slip',
      },
      {
        step: 'Activity E (Target Milestone)',
        activityId: 'COMM-01-001',
        name: 'Unit A Integrated Gas-In Milestone',
        discipline: 'Piping',
        status: 'Milestone',
        delayText: 'Milestone exposed (+2d projected slip)',
        floatRemaining: 'Negative Float',
      },
    ],
  },
  {
    id: 'RSK-ELE-02',
    title: 'Overhead Gallery Cable Pull Handover Hold',
    sourceActivityId: 'ELE-11-032',
    sourceActivityName: 'Cable Tray Installation - Substation to Compressor Bay',
    sourceWbs: '5.1.1',
    sourceDiscipline: 'Electrical',
    delayDays: 2.0,
    severity: 'High',
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    impactDescription: 'Delays multi-core control cable pull to Compressor C-101; absorbs 2.0d available float',
    owner: 'Ankur Saikia',
    ownerRole: 'Electrical Execution Engineer',
    status: 'Active',
    whyDelayed: [
      'Cantilever gallery support brackets delivered 2 days late by fabrication vendor',
      'Cable tray laying rate (40% vs 50% planned) hindered by scaffold sharing with mechanical crew',
    ],
    evidenceItems: [
      { id: 'EVD-009', title: 'CABLE_TRAY_BRACKET_INSPECTION.pdf', type: 'INSPECTION_NOTE', timestamp: '15:00' },
    ],
    delayDurationDetails: {
      grossDelayDays: 2.0,
      absorbedFloatDays: 2.0,
      netCriticalSlipDays: 0.0,
    },
    predecessors: [
      { id: 'CIV-11-001', name: 'Foundation Block A - Compressor Pedestal', status: 'Completed', finishDate: '14 Sep 2026' },
    ],
    successors: [
      { id: 'ELE-06-004', name: 'Pull Cable Tray TR-04 Main Feeder', plannedStart: '20 Sep 2026', projectedStart: '22 Sep 2026', depType: 'FS +0d' },
    ],
    affectedDownstream: [
      {
        activityId: 'ELE-06-004',
        name: 'Pull Cable Tray TR-04 Main Feeder',
        wbs: '4.1.2',
        originalPlannedFinish: '22 Sep 2026',
        projectedFinish: '24 Sep 2026',
        additionalDelayDays: 2.0,
        floatImpact: 'Remaining float reduced from 4d to 2d',
        isCritical: false,
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
        delayText: 'Completed on schedule',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '4d Float',
      },
      {
        step: 'Activity B (Source of Variance)',
        activityId: 'ELE-11-032',
        name: 'Cable Tray Installation Substation',
        discipline: 'Electrical',
        status: 'Delayed',
        delayText: '+2.0 Days Delay (40% Actual)',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '2d Float Remaining',
      },
      {
        step: 'Activity C (Downstream Feeder)',
        activityId: 'ELE-06-004',
        name: 'Pull Main Feeder TR-04',
        discipline: 'Electrical',
        status: 'At Risk',
        delayText: 'Handoff delayed by 2 days',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: 'Secondary float absorbed',
      },
    ],
  },
  {
    id: 'RSK-PIP-04',
    title: 'Hydrotest Manifold High-Pressure Flange Availability',
    sourceActivityId: 'PIP-24-003',
    sourceActivityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    sourceWbs: '3.2.3',
    sourceDiscipline: 'Piping',
    delayDays: 4.0,
    severity: 'Critical',
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    impactDescription: 'Pre-commissioning gas-in readiness delayed by 3.5 days without store expedited transfer',
    owner: 'Rajesh Sharma',
    ownerRole: 'Chief Project Controls Manager',
    status: 'Active',
    whyDelayed: [
      '150 bar test blind flanges held at central store pending material gate pass clearance',
      'Weather stoppage on 18 Sep delayed water filling manifold setup',
    ],
    evidenceItems: [
      { id: 'EVD-007', title: 'DELAY_NOTICE_WEATHER_STATION.pdf', type: 'DOCUMENT', timestamp: '13:05' },
    ],
    delayDurationDetails: {
      grossDelayDays: 4.0,
      absorbedFloatDays: 0.5,
      netCriticalSlipDays: 3.5,
    },
    predecessors: [
      { id: 'PIP-24-002', name: 'Weld Line 24-XX Field Joints', status: 'Delayed', finishDate: '21 Sep 2026' },
    ],
    successors: [
      { id: 'COMM-01-001', name: 'Gas-In Pre-Commissioning', plannedStart: '15 Dec 2026', projectedStart: '18 Dec 2026', depType: 'FS +0d' },
    ],
    affectedDownstream: [
      {
        activityId: 'INS-04-015',
        name: 'Mount Pressure & Temperature Transmitters',
        wbs: '6.2.1',
        originalPlannedFinish: '28 Sep 2026',
        projectedFinish: '03 Oct 2026',
        additionalDelayDays: 3.5,
        floatImpact: 'Critical driving constraint',
        isCritical: true,
      },
    ],
    projectedImpact: {
      targetCompletionShift: '+3.5 Days slip to critical milestone',
      milestoneExposed: 'Pre-Commissioning Target Date',
      contingencyConsumed: '100% of test manifold float exhausted',
    },
    currentMitigation: 'Emergency store transfer authorization dispatched; test water filling pump tested and staged.',
    nextAction: {
      action: 'Confirm arrival of 150 bar blind flanges at Duliajan Field gate by 14:00.',
      assignee: 'Rajesh Sharma',
      dueDate: '19 Sep 2026, 14:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'PIP-24-002',
        name: 'Weld Line 24-XX Field Joints',
        discipline: 'Piping',
        status: 'Delayed',
        delayText: 'Weld completion slipped',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '0d',
      },
      {
        step: 'Activity B (Source of Variance)',
        activityId: 'PIP-24-003',
        name: 'Hydrostatic Test Line 24-XX (150 bar)',
        discipline: 'Piping',
        status: 'Blocked',
        delayText: '+4.0 Days Delay (0% Progress)',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: 'Negative Float',
      },
      {
        step: 'Activity C (Terminal Milestone)',
        activityId: 'COMM-01-001',
        name: 'Pre-Commissioning Gas-In',
        discipline: 'Piping',
        status: 'Milestone',
        delayText: 'Milestone slip +3.5 days',
        floatRemaining: 'Critical Slip',
      },
    ],
  },
  {
    id: 'RSK-INS-05',
    title: 'Transmitter Tubing Loop Package Postponement',
    sourceActivityId: 'INS-04-015',
    sourceActivityName: 'Mount Pressure & Temperature Transmitters Unit A',
    sourceWbs: '6.2.1',
    sourceDiscipline: 'Instrumentation',
    delayDays: 2.5,
    severity: 'High',
    affectedCount: 1,
    dependencyType: 'FS (Finish-to-Start)',
    impactDescription: 'Final DCS loop testing start pushed back into October commissioning cycle',
    owner: 'Pranab Phukan',
    ownerRole: 'Project Manager (Facilities)',
    status: 'Under Review',
    whyDelayed: ['Blocked by piping hydrotest; instrument impulse lines cannot be connected until hydrotest is blown down and dried'],
    evidenceItems: [],
    delayDurationDetails: {
      grossDelayDays: 2.5,
      absorbedFloatDays: 0.5,
      netCriticalSlipDays: 2.0,
    },
    predecessors: [
      { id: 'PIP-24-003', name: 'Hydrostatic Test Section Line 24-XX', status: 'Delayed', finishDate: '26 Sep 2026' },
    ],
    successors: [
      { id: 'COMM-01-001', name: 'Gas-In Integrated Commissioning', plannedStart: '15 Dec 2026', projectedStart: '17 Dec 2026', depType: 'FS +0d' },
    ],
    affectedDownstream: [
      {
        activityId: 'COMM-01-001',
        name: 'Unit A Integrated Pre-Commissioning',
        wbs: '7.1.0',
        originalPlannedFinish: '15 Dec 2026',
        projectedFinish: '17 Dec 2026',
        additionalDelayDays: 2.0,
        floatImpact: 'Critical path slip',
        isCritical: true,
      },
    ],
    projectedImpact: {
      targetCompletionShift: '+2.0 Days to pre-commissioning loop tests',
      milestoneExposed: 'DCS Loop Sign-Off',
      contingencyConsumed: 'Float depleted',
    },
    currentMitigation: 'Pre-calibrate all 18 pressure transmitters in site instrumentation lab so field hookup requires zero calibration downtime.',
    nextAction: {
      action: 'Verify bench calibration certificates for 18 smart transmitters.',
      assignee: 'Pranab Phukan',
      dueDate: '20 Sep 2026, 17:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'PIP-24-003',
        name: 'Hydrotest Line 24-XX',
        discipline: 'Piping',
        status: 'Delayed',
        delayText: 'Hydrotest delayed +3.5d',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '0d',
      },
      {
        step: 'Activity B (Source of Variance)',
        activityId: 'INS-04-015',
        name: 'Mount Smart Transmitters Unit A',
        discipline: 'Instrumentation',
        status: 'At Risk',
        delayText: '+2.5 Days Delay',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: 'Float 0d',
      },
      {
        step: 'Activity C (Terminal Milestone)',
        activityId: 'COMM-01-001',
        name: 'Integrated DCS Loop Commissioning',
        discipline: 'Piping',
        status: 'Milestone',
        delayText: 'Commissioning delayed by 2 days',
        floatRemaining: 'Milestone Slip',
      },
    ],
  },
  {
    id: 'RSK-MEC-06',
    title: 'Flare K.O. Drum Interconnect Piping Clash',
    sourceActivityId: 'MEC-02-008',
    sourceActivityName: 'Erect & Align Flare K.O. Drum Vessel',
    sourceWbs: '5.2.4',
    sourceDiscipline: 'Mechanical',
    delayDays: 1.0,
    severity: 'Moderate',
    affectedCount: 2,
    dependencyType: 'SS (Start-to-Start)',
    impactDescription: 'Minor nozzle N-2 alignment mismatch requires cold shimming; non-critical float absorbs delay',
    owner: 'Debajit Borah',
    ownerRole: 'Lead Site Execution Engineer',
    status: 'Mitigating',
    whyDelayed: ['Nozzle N-2 bolt circle orientation required 15mm adjustment against inlet spool piping'],
    evidenceItems: [],
    delayDurationDetails: {
      grossDelayDays: 1.0,
      absorbedFloatDays: 1.0,
      netCriticalSlipDays: 0.0,
    },
    predecessors: [
      { id: 'CIV-11-001', name: 'Foundation Block A Pedestal', status: 'Completed', finishDate: '14 Sep 2026' },
    ],
    successors: [
      { id: 'PIP-28-004', name: 'Connect Flare Header Spool to Drum', plannedStart: '24 Sep 2026', projectedStart: '25 Sep 2026', depType: 'SS +1d' },
    ],
    affectedDownstream: [],
    projectedImpact: {
      targetCompletionShift: '0.0 Days net project slip',
      milestoneExposed: 'None (Absorbed by 6d available float)',
      contingencyConsumed: '15% of flare area float consumed',
    },
    currentMitigation: 'Mechanical shimming crew adjusted pedestal pads on 18 Sep afternoon.',
    nextAction: {
      action: 'Final torque wrench check on anchor bolts.',
      assignee: 'Debajit Borah',
      dueDate: '19 Sep 2026, 12:00',
    },
    dependencyChain: [
      {
        step: 'Activity A',
        activityId: 'CIV-11-001',
        name: 'Foundation Block A',
        discipline: 'Civil',
        status: 'Completed',
        delayText: 'Foundations ready',
        depTypeToNext: 'FS (Finish-to-Start)',
        floatRemaining: '6d Float',
      },
      {
        step: 'Activity B (Source of Variance)',
        activityId: 'MEC-02-008',
        name: 'Align Flare K.O. Drum Vessel',
        discipline: 'Mechanical',
        status: 'Delayed',
        delayText: '+1.0 Day Shimming Adjustment',
        depTypeToNext: 'SS (Start-to-Start)',
        floatRemaining: '5d Float Remaining',
      },
      {
        step: 'Activity C (Successor Connection)',
        activityId: 'PIP-28-004',
        name: 'Connect Flare Header Spool',
        discipline: 'Piping',
        status: 'At Risk',
        delayText: 'Start pushed by 1 day',
        floatRemaining: 'Positive float',
      },
    ],
  },
];

export default function RisksDependencyImpactPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  const [risks, setRisks] = useState<ScheduleRisk[]>(MOCK_SCHEDULE_RISKS);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | RiskSeverity>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | RiskStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Risk for Dependency Impact Drawer
  const [selectedRisk, setSelectedRisk] = useState<ScheduleRisk | null>(null);

  // Top summary metrics calculation
  const summaryMetrics = useMemo(() => {
    const totalRisks = risks.length;
    const criticalRisks = risks.filter((r) => r.severity === 'Critical').length;
    const delayedActs = new Set(risks.filter((r) => r.delayDays > 0).map((r) => r.sourceActivityId)).size;
    const impactedDeps = risks.reduce((acc, curr) => acc + curr.affectedCount, 0);
    const unresolvedImpacts = risks.filter((r) => r.status === 'Active' || r.status === 'Under Review').length;

    return {
      openRisks: totalRisks,
      criticalRisks,
      delayedActivities: delayedActs,
      impactedDependencies: impactedDeps,
      unresolvedImpacts,
    };
  }, [risks]);

  // Filtered Risks
  const filteredRisks = useMemo(() => {
    return risks.filter((r) => {
      if (selectedSeverityFilter !== 'ALL' && r.severity !== selectedSeverityFilter) return false;
      if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSource = r.sourceActivityName.toLowerCase().includes(q) || r.sourceActivityId.toLowerCase().includes(q);
        const matchesOwner = r.owner.toLowerCase().includes(q);
        return matchesId || matchesTitle || matchesSource || matchesOwner;
      }

      return true;
    });
  }, [risks, selectedSeverityFilter, selectedStatusFilter, searchQuery]);

  const getSeverityStyle = (severity: RiskSeverity) => {
    switch (severity) {
      case 'Critical':
        return { bg: 'bg-[#FBEFEE]', border: 'border-[#E4B0AA]', text: 'text-[#B5473C]' };
      case 'High':
        return { bg: 'bg-[#FDF6ED]', border: 'border-[#F0D4A6]', text: 'text-[#D98B32]' };
      case 'Moderate':
        return { bg: 'bg-[#EDF5F8]', border: 'border-[#B3CBE0]', text: 'text-[#176B87]' };
      case 'Low':
      default:
        return { bg: 'bg-[#EDF7F2]', border: 'border-[#B8DCC9]', text: 'text-[#2E7D5B]' };
    }
  };

  const getStatusStyle = (status: RiskStatus) => {
    switch (status) {
      case 'Active':
        return { bg: 'bg-[#FBEFEE]', text: 'text-[#B5473C]', border: 'border-[#E4B0AA]' };
      case 'Mitigating':
        return { bg: 'bg-[#FDF6ED]', text: 'text-[#D98B32]', border: 'border-[#F0D4A6]' };
      case 'Under Review':
        return { bg: 'bg-[#EDF5F8]', text: 'text-[#176B87]', border: 'border-[#B3CBE0]' };
      case 'Resolved':
      default:
        return { bg: 'bg-[#EDF7F2]', text: 'text-[#2E7D5B]', border: 'border-[#B8DCC9]' };
    }
  };

  const breadcrumbs = [
    { label: 'Schedule Linking & Impact' },
    { label: 'Risks & Dependency Impact', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Risks & Dependency Impact
            Translates schedule/execution variance into downstream project impact
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#B5473C]/10 text-[#B5473C]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Deterministic Delay Propagation
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  CPM Network Model V3 · Rev 3.2
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Risks & Dependency Impact
              </h1>
              <p className="text-xs text-[#596579] mt-0.5">
                Translates physical execution variances into downstream critical path impacts, float consumption, and milestone exposure.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#596579] font-mono">
                {activeProject?.code || 'OIL-DUL-01'} · 18 Sep 2026
              </span>
              <Link
                href="/what-if"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#176B87] bg-[#EDF5F8] border border-[#B3CBE0] hover:bg-[#EDF5F8]/80 rounded-lg transition-colors"
              >
                <Sliders className="w-3.5 h-3.5 text-[#176B87]" />
                <span>What-If Simulator</span>
              </Link>
            </div>
          </div>

          {/* POLICY BANNER: Relationship-oriented, Zero generic disconnected risk widgets */}
          <div className="pt-4">
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex items-start gap-3 text-xs">
              <GitBranch className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#172033]">
                  Relationship-Oriented Risk Network
                </h4>
                <p className="text-[#596579] leading-relaxed">
                  Risks are strictly computed from CPM predecessor-successor relationships and verified field execution events. Every risk traces directly from a source activity slip through its downstream handoffs to project milestones.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOP SUMMARY:
            - Open Risks
            - Critical Risks
            - Delayed Activities
            - Impacted Dependencies
            - Unresolved Impacts
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Open Risks */}
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter('ALL')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedSeverityFilter === 'ALL'
                ? 'bg-[#EDF5F8] border-[#176B87] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Open Risks
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {summaryMetrics.openRisks}
              </span>
              <span className="text-[11px] text-[#596579]">total</span>
            </div>
            <span className="text-[11px] text-[#176B87] mt-1 block">
              CPM Network Active
            </span>
          </button>

          {/* 2. Critical Risks */}
          <button
            type="button"
            onClick={() => setSelectedSeverityFilter(selectedSeverityFilter === 'Critical' ? 'ALL' : 'Critical')}
            className={`p-4 rounded-xl border text-left transition-all ${
              selectedSeverityFilter === 'Critical'
                ? 'bg-[#FBEFEE] border-[#B5473C] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Critical Risks
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.criticalRisks}
              </span>
              <span className="text-[11px] text-[#596579]">critical</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Zero float driving path
            </span>
          </button>

          {/* 3. Delayed Activities */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Delayed Activities
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#D98B32] font-mono">
                {summaryMetrics.delayedActivities}
              </span>
              <span className="text-[11px] text-[#596579]">sources</span>
            </div>
            <span className="text-[11px] text-[#D98B32] mt-1 block font-medium">
              Piping & Electrical
            </span>
          </div>

          {/* 4. Impacted Dependencies */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Impacted Dependencies
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#176B87] font-mono">
                {summaryMetrics.impactedDependencies}
              </span>
              <span className="text-[11px] text-[#596579]">handoffs</span>
            </div>
            <span className="text-[11px] text-[#596579] mt-1 block">
              Successor ties exposed
            </span>
          </div>

          {/* 5. Unresolved Impacts */}
          <button
            type="button"
            onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Active' ? 'ALL' : 'Active')}
            className={`p-4 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
              selectedStatusFilter === 'Active'
                ? 'bg-[#FBEFEE] border-[#B5473C] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Unresolved Impacts
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.unresolvedImpacts}
              </span>
              <span className="text-[11px] text-[#596579]">unmitigated</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Requires immediate action
            </span>
          </button>
        </div>

        {/* =========================================================================
            CONTROLS & SEARCH BAR
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search risks by title, source activity, or owner..."
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
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8A94A6] font-medium text-[11px]">Severity:</span>
              <select
                value={selectedSeverityFilter}
                onChange={(e) => setSelectedSeverityFilter(e.target.value as any)}
                className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Moderate">Moderate</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8A94A6] font-medium text-[11px]">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
                className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
              >
                <option value="ALL">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Mitigating">Mitigating</option>
                <option value="Under Review">Under Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MAIN TABLE:
            - Risk
            - Source Activity
            - Delay
            - Severity
            - Affected Activities
            - Dependency Type
            - Impact
            - Owner
            - Status
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                  <th className="p-3.5 min-w-[200px]">Risk</th>
                  <th className="p-3.5 min-w-[200px]">Source Activity</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Delay</th>
                  <th className="p-3.5 whitespace-nowrap">Severity</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Affected Activities</th>
                  <th className="p-3.5 whitespace-nowrap">Dependency Type</th>
                  <th className="p-3.5 min-w-[240px]">Impact</th>
                  <th className="p-3.5 whitespace-nowrap">Owner</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredRisks.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#596579]">
                      <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#172033]">No risks match your filter parameters</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSeverityFilter('ALL');
                          setSelectedStatusFilter('ALL');
                          setSearchQuery('');
                        }}
                        className="mt-2 text-xs font-semibold text-[#176B87] hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredRisks.map((risk) => {
                    const sevStyle = getSeverityStyle(risk.severity);
                    const statStyle = getStatusStyle(risk.status);

                    return (
                      <tr
                        key={risk.id}
                        onClick={() => setSelectedRisk(risk)}
                        className="hover:bg-[#EDF5F8]/50 transition-colors cursor-pointer group"
                      >
                        {/* 1. Risk */}
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-[#176B87] group-hover:underline">
                            {risk.id}
                          </div>
                          <div className="font-bold text-[#172033] mt-0.5">{risk.title}</div>
                        </td>

                        {/* 2. Source Activity */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-[#176B87]">{risk.sourceActivityId}</span>
                            <span className="text-[10px] font-mono text-[#8A94A6]">WBS {risk.sourceWbs}</span>
                          </div>
                          <p className="text-[11px] text-[#596579] truncate" title={risk.sourceActivityName}>
                            {risk.sourceActivityName}
                          </p>
                        </td>

                        {/* 3. Delay */}
                        <td className="p-3.5 whitespace-nowrap text-center font-mono font-bold text-[#B5473C]">
                          +{risk.delayDays.toFixed(1)} Days
                        </td>

                        {/* 4. Severity */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${sevStyle.bg} ${sevStyle.border} ${sevStyle.text}`}
                          >
                            {risk.severity}
                          </span>
                        </td>

                        {/* 5. Affected Activities */}
                        <td className="p-3.5 whitespace-nowrap text-center font-mono font-bold text-[#172033]">
                          <span className="px-2 py-0.5 rounded bg-[#F0F2F5] text-[#172033]">
                            {risk.affectedCount} Downstream
                          </span>
                        </td>

                        {/* 6. Dependency Type */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#596579]">
                          {risk.dependencyType}
                        </td>

                        {/* 7. Impact */}
                        <td className="p-3.5 text-[#596579]">
                          <p className="text-[11px] leading-relaxed truncate max-w-[280px]" title={risk.impactDescription}>
                            {risk.impactDescription}
                          </p>
                        </td>

                        {/* 8. Owner */}
                        <td className="p-3.5 whitespace-nowrap text-[#172033]">
                          <span className="font-bold block truncate max-w-[130px]">{risk.owner}</span>
                          <span className="text-[10px] text-[#8A94A6] block truncate">{risk.ownerRole}</span>
                        </td>

                        {/* 9. Status */}
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${statStyle.bg} ${statStyle.border} ${statStyle.text}`}
                          >
                            {risk.status}
                          </span>
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
              Showing <strong>{filteredRisks.length}</strong> of <strong>{risks.length}</strong> schedule-linked risks
            </span>
            <span className="text-[11px] text-[#8A94A6]">
              Click any risk to open the Dependency Impact Drawer & relationship visualizer
            </span>
          </div>
        </div>

        {/* =========================================================================
            DEPENDENCY IMPACT DRAWER:
            - Source activity
            - Why delayed
            - Evidence
            - Delay duration
            - Predecessors
            - Successors
            - Affected downstream activities
            - Projected impact
            - Current mitigation
            - Next action
            - Dependency visualization: Activity A -> Activity B -> Activity C
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedRisk}
          onClose={() => setSelectedRisk(null)}
          title={`Dependency Impact: ${selectedRisk?.id || ''}`}
          subtitle={selectedRisk?.title || ''}
          width="xl"
          footer={
            selectedRisk && (
              <div className="flex items-center justify-between w-full text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                  className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                >
                  Close Drawer
                </button>

                <div className="flex items-center gap-2">
                  <Link
                    href="/schedule-twin"
                    className="px-4 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-sm inline-flex items-center gap-1.5"
                  >
                    <span>Inspect in Schedule Twin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )
          }
        >
          {selectedRisk && (
            <div className="space-y-6 text-xs text-[#172033]">
              {/* HEADER KPI CARD */}
              <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-[#176B87]">
                      {selectedRisk.id}
                    </span>
                    <span className="text-xs font-bold text-[#172033]">
                      {selectedRisk.title}
                    </span>
                  </div>

                  {(() => {
                    const sev = getSeverityStyle(selectedRisk.severity);
                    return (
                      <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${sev.bg} ${sev.border} ${sev.text}`}>
                        {selectedRisk.severity} Risk
                      </span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1 border-t border-[#D9DEE5]/60">
                  <div>
                    <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Source Activity</span>
                    <span className="font-mono font-bold text-[#176B87]">{selectedRisk.sourceActivityId}</span>
                  </div>
                  <div>
                    <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Gross Delay</span>
                    <span className="font-mono font-bold text-[#B5473C]">+{selectedRisk.delayDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Critical Path Slip</span>
                    <span className="font-mono font-bold text-[#B5473C]">+{selectedRisk.delayDurationDetails.netCriticalSlipDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Accountable Owner</span>
                    <span className="font-bold text-[#172033]">{selectedRisk.owner}</span>
                  </div>
                </div>
              </div>

              {/* =========================================================================
                  DEPENDENCY VISUALIZATION:
                  Activity A -> Activity B -> Activity C
                  Real relationship-oriented visual node chain
                  ========================================================================= */}
              <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Relationship-Oriented Dependency Chain
                  </h4>
                  <span className="text-[10px] font-mono text-[#8A94A6]">CPM Predecessor $\to$ Successor Topology</span>
                </div>

                {/* CHAIN VISUALIZER NODES */}
                <div className="space-y-2 pt-1">
                  {selectedRisk.dependencyChain.map((node, idx) => (
                    <div key={idx} className="relative">
                      <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-[#176B87] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#176B87] text-xs">
                                {node.activityId}
                              </span>
                              <span className="text-[10px] font-bold uppercase text-[#8A94A6]">
                                {node.step}
                              </span>
                              <span className="text-[10px] font-semibold text-[#596579] bg-white px-1.5 py-0.2 rounded border border-[#D9DEE5]">
                                {node.discipline}
                              </span>
                            </div>
                            <p className="font-bold text-[#172033] text-xs mt-0.5">{node.name}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                              node.status === 'Completed'
                                ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                                : node.status === 'Delayed'
                                ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                : node.status === 'Blocked'
                                ? 'bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]'
                                : node.status === 'Milestone'
                                ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                                : 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                            }`}
                          >
                            {node.delayText || node.status}
                          </span>
                          <span className="text-[10px] text-[#8A94A6] block mt-0.5 font-mono">
                            {node.floatRemaining}
                          </span>
                        </div>
                      </div>

                      {/* Vector Arrow to Next Node */}
                      {idx < selectedRisk.dependencyChain.length - 1 && (
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8A94A6]">
                            <ArrowRight className="w-3.5 h-3.5 rotate-90 text-[#176B87]" />
                            <span>{node.depTypeToNext || 'FS (Finish-to-Start)'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 1. WHY DELAYED (ROOT CAUSES) & EVIDENCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Why Delayed */}
                <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-xl space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#B5473C] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Why Delayed (Physical Root Causes)
                  </h4>
                  <ul className="space-y-1.5 text-xs text-[#172033] list-disc list-inside">
                    {selectedRisk.whyDelayed.map((cause, idx) => (
                      <li key={idx} className="leading-relaxed">{cause}</li>
                    ))}
                  </ul>
                </div>

                {/* Evidence Attached */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                    Verified Site Evidence ({selectedRisk.evidenceItems.length})
                  </h4>
                  {selectedRisk.evidenceItems.length === 0 ? (
                    <p className="text-xs text-[#8A94A6] italic p-3 bg-[#F7F8FA] rounded-lg">
                      No physical photos or test certificates attached.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedRisk.evidenceItems.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {ev.type === 'PHOTO' ? (
                              <Camera className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                            ) : (
                              <FileText className="w-3.5 h-3.5 text-[#596579] shrink-0" />
                            )}
                            <span className="font-mono truncate">{ev.title}</span>
                          </div>
                          <span className="text-[#8A94A6] text-[10px] shrink-0">{ev.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. PREDECESSORS & SUCCESSORS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Predecessors */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                    Immediate Predecessor Activities
                  </span>
                  <div className="space-y-1.5">
                    {selectedRisk.predecessors.map((p) => (
                      <div key={p.id} className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#176B87]">{p.id}</span>
                          <p className="text-[11px] text-[#172033] font-medium">{p.name}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#2E7D5B] bg-[#EDF7F2] px-1.5 py-0.5 rounded">
                          {p.status} ({p.finishDate})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Successors */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                    Immediate Successor Activities
                  </span>
                  <div className="space-y-1.5">
                    {selectedRisk.successors.map((s) => (
                      <div key={s.id} className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <span className="font-mono font-bold text-[#176B87]">{s.id}</span>
                          <p className="text-[11px] text-[#172033] font-medium">{s.name}</p>
                        </div>
                        <span className="text-[10px] font-mono text-[#B5473C] bg-[#FBEFEE] px-1.5 py-0.5 rounded font-bold">
                          Start: {s.projectedStart}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. AFFECTED DOWNSTREAM ACTIVITIES CASCADE */}
              <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                    Affected Downstream Activities ({selectedRisk.affectedDownstream.length} in Delay Path)
                  </h4>
                  <span className="text-[11px] text-[#8A94A6]">CPM Downstream Propagation</span>
                </div>

                <div className="border border-[#D9DEE5] rounded-lg overflow-hidden divide-y divide-[#D9DEE5]">
                  {selectedRisk.affectedDownstream.map((act) => (
                    <div key={act.activityId} className="p-3 bg-white hover:bg-[#F7F8FA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#176B87]">{act.activityId}</span>
                          <span className="font-bold text-[#172033]">{act.name}</span>
                          {act.isCritical && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C]">
                              Critical Path
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#596579]">{act.floatImpact}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-[11px] text-[#596579]">
                          Target: {act.originalPlannedFinish} $\to$ <strong className="text-[#B5473C]">{act.projectedFinish}</strong>
                        </div>
                        <span className="text-[10px] font-bold text-[#B5473C]">
                          +{act.additionalDelayDays}d downstream slip
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. CURRENT MITIGATION & NEXT ACTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Mitigation */}
                <div className="p-4 bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87]">
                    Current Schedule Mitigation Plan
                  </h4>
                  <p className="text-xs text-[#172033] leading-relaxed">
                    {selectedRisk.currentMitigation}
                  </p>
                </div>

                {/* Next Action */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                    Assigned Next Action
                  </h4>
                  <p className="text-xs font-semibold text-[#172033]">
                    {selectedRisk.nextAction.action}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#D9DEE5]/60 text-[11px] text-[#596579]">
                    <span>Assignee: <strong className="text-[#172033]">{selectedRisk.nextAction.assignee}</strong></span>
                    <span>Due: <strong className="text-[#B5473C] font-mono">{selectedRisk.nextAction.dueDate}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
