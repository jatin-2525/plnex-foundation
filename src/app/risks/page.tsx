'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Drawer } from '../../components/shared/Drawer';
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

export interface ScheduleDelayItem {
  id: string; // e.g. "DLY-CIV-01"
  title: string;
  sourceActivityId: string;
  sourceActivityName: string;
  sourceWbs: string;
  sourceDiscipline: DisciplineType;
  delayDays: number;
  severity: RiskSeverity;
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

const MOCK_SCHEDULE_DELAYS: ScheduleDelayItem[] = [
  {
    id: 'DLY-CIV-01',
    title: 'Foundation Block A Curing & Soil Retest Delay',
    sourceActivityId: 'CIV-11-001',
    sourceActivityName: 'Foundation Block A',
    sourceWbs: '2.1.1',
    sourceDiscipline: 'Civil',
    delayDays: 5.0,
    severity: 'Critical',
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Soil bearing capacity re-test delay & delayed rebar cage delivery',
    evidence: 'EVD-012: Concrete Curing Cylinder Compression Test Report (DPR-014)',
    affectedActivities: ['Column Installation', 'Equipment Installation'],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Delays structural column erection by 5 days and downstream heavy equipment placement by 5 days',
    recommendedAction: 'Mobilize rapid-curing accelerator mix and double-shift column rigger crew to recover 2 days',
    owner: 'S. Ramanathan',
    ownerRole: 'Civil Execution Lead',
    status: 'Active',
    whyDelayed: [
      'Soil bearing capacity re-test delay following monsoon ground saturation',
      'Delayed delivery of high-tensile rebar cage assembly from secondary fabricator',
      'Mandatory 7-day cylinder compressive strength curing hold before anchor bolt pull test',
    ],
    evidenceItems: [
      { id: 'EVD-012', title: 'CONCRETE_CYLINDER_BREAK_REPORT_DPR014.pdf', type: 'DOCUMENT', timestamp: '14:30' },
      { id: 'EVD-013', title: 'IMG_PEDESTAL_REBAR_CAGE_INSPECTION.jpg', type: 'PHOTO', timestamp: '11:15' },
    ],
    delayDurationDetails: {
      grossDelayDays: 5.0,
      absorbedFloatDays: 0.0,
      netCriticalSlipDays: 5.0,
    },
    predecessors: [
      { id: 'CIV-09-002', name: 'Excavation & Sub-Base Lean Concrete Pour', status: 'Completed', finishDate: '30 Sep 2026' },
    ],
    successors: [
      { id: 'STR-02-004', name: 'Column Installation', plannedStart: '16 Oct 2026', projectedStart: '21 Oct 2026', depType: 'FS +0d' },
      { id: 'MEC-03-010', name: 'Equipment Installation', plannedStart: '26 Oct 2026', projectedStart: '31 Oct 2026', depType: 'FS +0d' },
    ],
    affectedDownstream: [
      {
        activityId: 'STR-02-004',
        name: 'Column Installation',
        wbs: '2.2.1',
        originalPlannedFinish: '25 Oct 2026',
        projectedFinish: '30 Oct 2026',
        additionalDelayDays: 5.0,
        floatImpact: 'Float depleted to 0 days (Now Driving Critical Path)',
        isCritical: true,
      },
      {
        activityId: 'MEC-03-010',
        name: 'Equipment Installation',
        wbs: '4.1.2',
        originalPlannedFinish: '10 Nov 2026',
        projectedFinish: '15 Nov 2026',
        additionalDelayDays: 5.0,
        floatImpact: 'Direct 5-day handoff slip from column alignment',
        isCritical: true,
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
        floatRemaining: '0d Float (Driving)',
      },
      {
        step: 'Activity B',
        activityId: 'STR-02-004',
        name: 'Column Installation',
        discipline: 'Civil',
        status: 'Blocked',
        delayText: 'Start pushed by 5 days',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Buffer exhausted',
      },
      {
        step: 'Activity C',
        activityId: 'MEC-03-010',
        name: 'Equipment Installation',
        discipline: 'Mechanical',
        status: 'At Risk',
        delayText: 'Equipment placement delayed by 5 days',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Critical Path Slip',
      },
    ],
  },
  {
    id: 'DLY-PIP-02',
    title: 'Line 24 Hydrotest Critical Path Slip & Hold',
    sourceActivityId: 'PIP-24-002',
    sourceActivityName: 'Weld Line 24-XX Field Joints & NDT Inspection',
    sourceWbs: '3.2.2',
    sourceDiscipline: 'Piping',
    delayDays: 3.5,
    severity: 'Critical',
    affectedCount: 2,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Predecessor spool rigging hold, monsoon rain stoppage, RT inspection backlog',
    evidence: 'EVD-003: IMG_20260918_WELD_BUTT_J04.jpg & WELD_LOG_SHEET_SHIFT_A.pdf',
    affectedActivities: ['Hydrostatic Test Section Line 24-XX', 'Mount Pressure & Temperature Transmitters'],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Absorbs remaining 1.5d buffer; delays pre-commissioning readiness by 2.0 days on critical path',
    recommendedAction: 'Deploy second shift radiographic testing (RT) crew at 19:00 IST to clear 4 butt welds overnight',
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
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '0d Float',
      },
      {
        step: 'Activity B',
        activityId: 'PIP-24-002',
        name: 'Weld Line 24-XX Field Joints',
        discipline: 'Piping',
        status: 'Delayed',
        delayText: '+3.5 Days Delay (65% Actual)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '0d Float (Driving)',
      },
      {
        step: 'Activity C',
        activityId: 'PIP-24-003',
        name: 'Hydrostatic Test Section Line 24-XX',
        discipline: 'Piping',
        status: 'Blocked',
        delayText: 'Held pending weld RT clearance',
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
    severity: 'High',
    affectedCount: 1,
    dependencyType: 'FS (Finish-to-Start)',
    cause: 'Cantilever gallery support brackets delivered 2 days late by fabrication vendor',
    evidence: 'EVD-009: CABLE_TRAY_BRACKET_INSPECTION.pdf',
    affectedActivities: ['Pull Cable Tray TR-04 Main Feeder'],
    dependency: 'FS (Finish-to-Start) +0d',
    currentImpact: 'Delays multi-core control cable pull to Compressor C-101; absorbs 2.0d available float',
    recommendedAction: 'Re-sequence cable tray installation to prioritize Bay 1 to allow instrumentation cabling to commence independently',
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
      { id: 'CIV-11-001', name: 'Foundation Block A Pedestal', status: 'Completed', finishDate: '14 Sep 2026' },
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
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '4d Float',
      },
      {
        step: 'Activity B',
        activityId: 'ELE-11-032',
        name: 'Cable Tray Installation Substation',
        discipline: 'Electrical',
        status: 'Delayed',
        delayText: '+2.0 Days Delay (40% Actual)',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '2d Float Remaining',
      },
      {
        step: 'Activity C',
        activityId: 'ELE-06-004',
        name: 'Pull Main Feeder TR-04',
        discipline: 'Electrical',
        status: 'At Risk',
        delayText: 'Handoff delayed by 2 days',
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
    severity: 'Moderate',
    affectedCount: 1,
    dependencyType: 'SS (Start-to-Start)',
    cause: 'Nozzle N-2 bolt circle orientation required 15mm cold shimming adjustment',
    evidence: 'EVD-010: FLANGE_ALIGNMENT_REPORT.pdf',
    affectedActivities: ['Connect Flare Header Spool to Drum'],
    dependency: 'SS (Start-to-Start) +1d',
    currentImpact: 'Minor nozzle N-2 alignment mismatch requires cold shimming; non-critical float absorbs delay',
    recommendedAction: 'Mechanical shimming crew adjusted pedestal pads; perform final torque check',
    owner: 'Debajit Borah',
    ownerRole: 'Lead Site Execution Engineer',
    status: 'Mitigating',
    whyDelayed: ['Nozzle N-2 bolt circle orientation required 15mm adjustment against inlet spool piping'],
    evidenceItems: [
      { id: 'EVD-010', title: 'FLANGE_ALIGNMENT_REPORT.pdf', type: 'DOCUMENT', timestamp: '14:10' },
    ],
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
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: '6d Float',
      },
      {
        step: 'Activity B',
        activityId: 'MEC-02-008',
        name: 'Align Flare K.O. Drum Vessel',
        discipline: 'Mechanical',
        status: 'Delayed',
        delayText: '+1.0 Day Shimming Adjustment',
        depTypeToNext: 'SS (Start-to-Start) +1d',
        floatRemaining: '5d Float Remaining',
      },
      {
        step: 'Activity C',
        activityId: 'PIP-28-004',
        name: 'Connect Flare Header Spool',
        discipline: 'Piping',
        status: 'At Risk',
        delayText: 'Start pushed by 1 day',
        depTypeToNext: 'FS (Finish-to-Start) +0d',
        floatRemaining: 'Positive float',
      },
    ],
  },
];

export default function DelayDependencyImpactPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  const [delays, setDelays] = useState<ScheduleDelayItem[]>(MOCK_SCHEDULE_DELAYS);
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState<'ALL' | RiskSeverity>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | RiskStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Delay Item for prominent spotlight analysis & Drawer
  const [selectedDelay, setSelectedDelay] = useState<ScheduleDelayItem>(MOCK_SCHEDULE_DELAYS[0]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Top summary metrics calculation
  const summaryMetrics = useMemo(() => {
    const totalDelays = delays.length;
    const criticalDelays = delays.filter((r) => r.severity === 'Critical').length;
    const totalDelayDays = delays.reduce((acc, curr) => acc + curr.delayDays, 0);
    const impactedDeps = delays.reduce((acc, curr) => acc + curr.affectedCount, 0);
    const unresolvedImpacts = delays.filter((r) => r.status === 'Active' || r.status === 'Under Review').length;

    return {
      totalDelays,
      criticalDelays,
      totalDelayDays: totalDelayDays.toFixed(1),
      impactedDependencies: impactedDeps,
      unresolvedImpacts,
    };
  }, [delays]);

  // Filtered Delays
  const filteredDelays = useMemo(() => {
    return delays.filter((r) => {
      if (selectedSeverityFilter !== 'ALL' && r.severity !== selectedSeverityFilter) return false;
      if (selectedStatusFilter !== 'ALL' && r.status !== selectedStatusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = r.id.toLowerCase().includes(q);
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesSource = r.sourceActivityName.toLowerCase().includes(q) || r.sourceActivityId.toLowerCase().includes(q);
        const matchesOwner = r.owner.toLowerCase().includes(q);
        const matchesCause = r.cause.toLowerCase().includes(q);
        return matchesId || matchesTitle || matchesSource || matchesOwner || matchesCause;
      }

      return true;
    });
  }, [delays, selectedSeverityFilter, selectedStatusFilter, searchQuery]);

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
    { label: 'Control' },
    { label: 'Delay & Dependency Impact', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* =========================================================================
            HEADER: Delay & Dependency Impact
            Operational, clean language. Jargon moved to Calculation Details.
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Activity className="w-3.5 h-3.5" />
                  Schedule Variance Tracking
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono text-[#596579] bg-[#F7F8FA] border border-[#D9DEE5]">
                  Active Schedule V3 · Rev 3.2
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Delay & Dependency Impact
              </h1>
              <p className="text-xs text-[#596579] mt-0.5">
                Trace source activity delays, root causes, evidence, and downstream dependency impacts across the project schedule.
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

          {/* OPERATIONAL BANNER */}
          <div className="pt-4">
            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex items-start gap-3 text-xs">
              <GitBranch className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#172033]">
                  Authoritative Delay Propagation
                </h4>
                <p className="text-[#596579] leading-relaxed">
                  Every delay shown here originates from actual verified execution data or site physical inspections. Changes cascade strictly along defined predecessor-successor schedule relationships.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            TOP SUMMARY METRICS
            ========================================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Open Delays */}
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
              Open Delays
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {summaryMetrics.totalDelays}
              </span>
              <span className="text-[11px] text-[#596579]">activities</span>
            </div>
            <span className="text-[11px] text-[#176B87] mt-1 block font-medium">
              Active schedule slips
            </span>
          </button>

          {/* 2. Critical Path Slips */}
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
              Critical Path Slips
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.criticalDelays}
              </span>
              <span className="text-[11px] text-[#596579]">critical</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Zero float driving path
            </span>
          </button>

          {/* 3. Total Delay Days */}
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] block">
              Total Delay Days
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#D98B32] font-mono">
                +{summaryMetrics.totalDelayDays}d
              </span>
              <span className="text-[11px] text-[#596579]">gross</span>
            </div>
            <span className="text-[11px] text-[#D98B32] mt-1 block font-medium">
              Across civil & piping
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
              Active Actions
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.unresolvedImpacts}
              </span>
              <span className="text-[11px] text-[#596579]">pending</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Requires mitigation
            </span>
          </button>
        </div>

        {/* =========================================================================
            PROMINENT CARD: ACTIVE DELAY & IMPACT ANALYSIS + DEPENDENCY CHAIN
            Explicitly shows:
            - Source Activity
            - Actual Delay
            - Cause
            - Evidence
            - Affected Activities
            - Dependency
            - Current Impact
            - Recommended Action
            AND
            Activity A ↓ Activity B ↓ Activity C
            ========================================================================= */}
        <div className="bg-white border-2 border-[#176B87]/40 rounded-xl p-5 md:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9DEE5]/60 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#176B87] text-white">
                Delay & Impact Spotlight
              </span>
              <h2 className="text-sm font-bold text-[#172033] uppercase tracking-wider">
                {selectedDelay.title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityStyle(selectedDelay.severity).bg} ${getSeverityStyle(selectedDelay.severity).border} ${getSeverityStyle(selectedDelay.severity).text}`}
              >
                {selectedDelay.severity} Severity
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="px-3 py-1 bg-[#176B87] hover:bg-[#135A72] text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
              >
                Open Details Drawer &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT (Cols 1-7): 8 CANONICAL DELAY & IMPACT FIELDS */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-xs font-bold text-[#176B87] uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B5473C]" />
                Delay & Impact Assessment
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Source Activity */}
                <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-0.5">
                    Source Activity
                  </span>
                  <div className="font-bold text-[#172033] text-sm">
                    {selectedDelay.sourceActivityName}
                  </div>
                  <div className="font-mono text-xs text-[#176B87] mt-0.5">
                    {selectedDelay.sourceActivityId} · WBS {selectedDelay.sourceWbs} · {selectedDelay.sourceDiscipline}
                  </div>
                </div>

                {/* 2. Actual Delay */}
                <div className="p-3 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA]">
                  <span className="text-[10px] uppercase font-bold text-[#B5473C] tracking-wider block mb-0.5">
                    Actual Delay
                  </span>
                  <div className="font-black font-mono text-xl text-[#B5473C]">
                    +{selectedDelay.delayDays.toFixed(0)} days
                  </div>
                  <span className="text-[11px] text-[#596579]">
                    Verified physical execution slip
                  </span>
                </div>
              </div>

              {/* 3. Cause */}
              <div className="p-3 rounded-lg bg-white border border-[#D9DEE5] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                  Cause
                </span>
                <p className="text-[#172033] font-medium leading-relaxed">
                  {selectedDelay.cause}
                </p>
              </div>

              {/* 4. Evidence */}
              <div className="p-3 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#176B87] tracking-wider block mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Evidence
                </span>
                <p className="font-mono text-[#172033] font-semibold">
                  {selectedDelay.evidence}
                </p>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-[#596579]">
                  <span>{selectedDelay.evidenceItems.length} verified site files attached</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 5. Affected Activities */}
                <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                    Affected Activities ({selectedDelay.affectedActivities.length})
                  </span>
                  <ul className="space-y-1 text-[#172033] font-semibold">
                    {selectedDelay.affectedActivities.map((act, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B5473C]" />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 6. Dependency */}
                <div className="p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block mb-1">
                    Dependency
                  </span>
                  <div className="font-mono font-bold text-xs text-[#176B87]">
                    {selectedDelay.dependency}
                  </div>
                  <span className="text-[11px] text-[#596579] mt-0.5 block">
                    Driving hard relationship constraint
                  </span>
                </div>
              </div>

              {/* 7. Current Impact */}
              <div className="p-3 rounded-lg bg-[#FBEFEE]/60 border border-[#E4B0AA] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#B5473C] tracking-wider block mb-1">
                  Current Impact
                </span>
                <p className="text-[#172033] font-medium leading-relaxed">
                  {selectedDelay.currentImpact}
                </p>
              </div>

              {/* 8. Recommended Action */}
              <div className="p-3 rounded-lg bg-[#EDF7F2] border border-[#B8DCC9] text-xs">
                <span className="text-[10px] uppercase font-bold text-[#2E7D5B] tracking-wider block mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Recommended Action
                </span>
                <p className="text-[#172033] font-semibold leading-relaxed">
                  {selectedDelay.recommendedAction}
                </p>
                <div className="mt-1 pt-1 border-t border-[#B8DCC9]/60 flex items-center justify-between text-[11px] text-[#596579]">
                  <span>Owner: <strong className="text-[#172033]">{selectedDelay.owner}</strong> ({selectedDelay.ownerRole})</span>
                </div>
              </div>
            </div>

            {/* RIGHT (Cols 8-12): DEPENDENCY FLOW Activity A ↓ Activity B ↓ Activity C */}
            <div className="lg:col-span-5 p-4 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#D9DEE5]">
                  <h3 className="text-xs font-bold text-[#176B87] uppercase tracking-wider flex items-center gap-1.5">
                    <GitBranch className="w-3.5 h-3.5" />
                    Dependency
                  </h3>
                  <span className="text-[10px] font-mono text-[#8A94A6]">
                    Actual Dependency Data
                  </span>
                </div>

                <p className="text-[11px] text-[#596579] mt-2 mb-3">
                  Sequential downstream impact chain using actual schedule ties:
                </p>

                {/* VERTICAL DEPENDENCY CHAIN: Activity A ↓ Activity B ↓ Activity C */}
                <div className="space-y-1">
                  {selectedDelay.dependencyChain.map((node, idx) => {
                    const isLast = idx === selectedDelay.dependencyChain.length - 1;
                    return (
                      <React.Fragment key={idx}>
                        <div
                          className={`p-3 rounded-lg border text-xs transition-all ${
                            node.status === 'Delayed'
                              ? 'bg-[#FBEFEE] border-[#E4B0AA] ring-1 ring-[#B5473C]/30'
                              : node.status === 'Blocked'
                              ? 'bg-[#FDF6ED] border-[#F0D4A6]'
                              : node.status === 'At Risk'
                              ? 'bg-white border-[#D9DEE5]'
                              : 'bg-white border-[#D9DEE5]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-xs text-[#176B87]">
                              {node.step}
                            </span>
                            <span
                              className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                                node.status === 'Delayed'
                                  ? 'bg-[#B5473C] text-white'
                                  : node.status === 'Blocked'
                                  ? 'bg-[#D98B32] text-white'
                                  : 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                              }`}
                            >
                              {node.status}
                            </span>
                          </div>

                          <div className="font-bold text-sm text-[#172033]">
                            {node.name}
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-1.5 mt-1.5 border-t border-[#D9DEE5]/60 font-mono">
                            <span className="text-[#8A94A6]">{node.activityId} ({node.discipline})</span>
                            <span className={node.status === 'Delayed' ? 'text-[#B5473C] font-bold' : 'text-[#596579]'}>
                              {node.delayText}
                            </span>
                          </div>
                        </div>

                        {/* DOWNWARD ARROW ↓ */}
                        {!isLast && (
                          <div className="flex items-center justify-center py-1">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-[#D9DEE5] text-[10px] font-mono font-bold text-[#176B87] shadow-2xs">
                              <ArrowDown className="w-3.5 h-3.5 text-[#176B87]" />
                              <span>{node.depTypeToNext || 'FS +0d'}</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-[#D9DEE5] text-center">
                <span className="text-[11px] text-[#596579]">
                  Select any row below to inspect its delay and dependency impact
                </span>
              </div>
            </div>
          </div>
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
              placeholder="Search by source activity, cause, or owner..."
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
            ALL PROJECT DELAYS TABLE:
            Source Activity | Actual Delay | Cause | Evidence | Affected Activities | Dependency | Current Impact | Recommended Action
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 bg-[#F7F8FA] border-b border-[#D9DEE5] flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
              All Project Delays & Downstream Impacts
            </h3>
            <span className="text-xs font-mono text-[#596579]">
              {filteredDelays.length} active schedule items
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                  <th className="p-3.5 min-w-[180px]">Source Activity</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Actual Delay</th>
                  <th className="p-3.5 min-w-[200px]">Cause</th>
                  <th className="p-3.5 min-w-[180px]">Evidence</th>
                  <th className="p-3.5 min-w-[180px]">Affected Activities</th>
                  <th className="p-3.5 whitespace-nowrap">Dependency</th>
                  <th className="p-3.5 min-w-[200px]">Current Impact</th>
                  <th className="p-3.5 min-w-[220px]">Recommended Action</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredDelays.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#596579]">
                      <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#172033]">No delays match your filter parameters</p>
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
                  filteredDelays.map((item) => {
                    const isSelected = selectedDelay.id === item.id;
                    const sevStyle = getSeverityStyle(item.severity);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedDelay(item)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected ? 'bg-[#EDF5F8]/70 ring-1 ring-[#176B87]/30' : 'hover:bg-[#F7F8FA]'
                        }`}
                      >
                        {/* 1. Source Activity */}
                        <td className="p-3.5">
                          <div className="font-bold text-[#172033]">
                            {item.sourceActivityName}
                          </div>
                          <div className="font-mono text-[11px] text-[#176B87] mt-0.5">
                            {item.sourceActivityId} · {item.sourceDiscipline}
                          </div>
                        </td>

                        {/* 2. Actual Delay */}
                        <td className="p-3.5 whitespace-nowrap text-center font-mono font-bold text-[#B5473C] text-sm">
                          +{item.delayDays.toFixed(0)} days
                        </td>

                        {/* 3. Cause */}
                        <td className="p-3.5 text-[#596579]">
                          <p className="text-[11px] leading-relaxed line-clamp-2" title={item.cause}>
                            {item.cause}
                          </p>
                        </td>

                        {/* 4. Evidence */}
                        <td className="p-3.5 text-[#172033]">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <FileText className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                            <span className="truncate max-w-[170px]" title={item.evidence}>
                              {item.evidence}
                            </span>
                          </div>
                        </td>

                        {/* 5. Affected Activities */}
                        <td className="p-3.5">
                          <div className="space-y-0.5">
                            {item.affectedActivities.map((act, i) => (
                              <span
                                key={i}
                                className="inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#F0F2F5] text-[#172033] mr-1 mb-0.5"
                              >
                                {act}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* 6. Dependency */}
                        <td className="p-3.5 whitespace-nowrap font-mono text-[11px] text-[#596579]">
                          {item.dependency}
                        </td>

                        {/* 7. Current Impact */}
                        <td className="p-3.5 text-[#596579]">
                          <p className="text-[11px] leading-relaxed line-clamp-2" title={item.currentImpact}>
                            {item.currentImpact}
                          </p>
                        </td>

                        {/* 8. Recommended Action */}
                        <td className="p-3.5 text-[#172033]">
                          <p className="text-[11px] font-medium leading-relaxed line-clamp-2" title={item.recommendedAction}>
                            {item.recommendedAction}
                          </p>
                        </td>

                        {/* 9. Action */}
                        <td className="p-3.5 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDelay(item);
                              setIsDrawerOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-[#176B87] hover:text-white hover:bg-[#176B87] border border-[#B3CBE0] rounded-lg transition-colors shadow-2xs"
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
            Eliminates jargon headings from the top-level view.
            Places CPM methodology, topological sort, and float math here.
            ========================================================================= */}
        <details className="group bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl overflow-hidden transition-all">
          <summary className="p-4 flex items-center justify-between cursor-pointer font-bold text-xs uppercase tracking-wider text-[#176B87] hover:bg-[#F0F2F5] transition-colors">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#176B87]" />
              <span>Calculation Details</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#596579] font-normal">
              <span className="hidden sm:inline">Topological CPM Model Methodology & Math Formulas</span>
              <ChevronDown className="w-4 h-4 text-[#596579] transition-transform group-open:rotate-180" />
            </div>
          </summary>

          <div className="p-5 border-t border-[#D9DEE5] bg-white space-y-4 text-xs text-[#596579]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1.5">
                <h5 className="font-bold text-[#172033] uppercase text-[11px]">
                  1. Deterministic Network Model
                </h5>
                <p className="leading-relaxed">
                  Evaluates the Critical Path Method (CPM Network Model V3 · Rev 3.2). Activity relationships adhere to directed acyclic graph (DAG) topological constraints.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1.5">
                <h5 className="font-bold text-[#172033] uppercase text-[11px]">
                  2. Float Absorption Logic
                </h5>
                <p className="leading-relaxed">
                  Calculates Total Float using: <code className="text-[#176B87] font-mono font-bold">TF = Late Finish - Early Finish</code>. Delays consume buffer float first; when float drops to 0, delay propagates 1:1 to critical successors.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5] space-y-1.5">
                <h5 className="font-bold text-[#172033] uppercase text-[11px]">
                  3. Relationship Types
                </h5>
                <p className="leading-relaxed">
                  Supports Finish-to-Start (FS +0d), Start-to-Start (SS), and Finish-to-Finish (FF) ties. Field progress delays trigger deterministic forward-pass recalculations across all active successors.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg flex items-center justify-between flex-wrap gap-2 text-[11px]">
              <span className="text-[#172033]">
                Need to test hypothetical what-if scenarios without affecting project baselines?
              </span>
              <Link
                href="/what-if"
                className="font-bold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <span>Launch What-if Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </details>

        {/* =========================================================================
            DEPENDENCY IMPACT DRAWER
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
          }
        >
          <div className="space-y-6 text-xs text-[#172033]">
            {/* HEADER KPI CARD */}
            <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-[#176B87]">
                    {selectedDelay.id}
                  </span>
                  <span className="text-xs font-bold text-[#172033]">
                    {selectedDelay.title}
                  </span>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold border ${getSeverityStyle(selectedDelay.severity).bg} ${getSeverityStyle(selectedDelay.severity).border} ${getSeverityStyle(selectedDelay.severity).text}`}
                >
                  {selectedDelay.severity} Severity
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1 border-t border-[#D9DEE5]/60">
                <div>
                  <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Source Activity</span>
                  <span className="font-mono font-bold text-[#176B87]">{selectedDelay.sourceActivityId}</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Actual Delay</span>
                  <span className="font-mono font-bold text-[#B5473C]">+{selectedDelay.delayDays} Days</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Critical Slip</span>
                  <span className="font-mono font-bold text-[#B5473C]">+{selectedDelay.delayDurationDetails.netCriticalSlipDays} Days</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Owner</span>
                  <span className="font-bold text-[#172033]">{selectedDelay.owner}</span>
                </div>
              </div>
            </div>

            {/* DEPENDENCY CHAIN (Activity A ↓ Activity B ↓ Activity C) */}
            <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Sequential Dependency Chain
                </h4>
                <span className="text-[10px] font-mono text-[#8A94A6]">Predecessor $\to$ Successor Flow</span>
              </div>

              <div className="space-y-2 pt-1">
                {selectedDelay.dependencyChain.map((node, idx) => (
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
                    {idx < selectedDelay.dependencyChain.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#8A94A6]">
                          <ArrowDown className="w-3.5 h-3.5 text-[#176B87]" />
                          <span>{node.depTypeToNext || 'FS +0d'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* WHY DELAYED (ROOT CAUSES) & EVIDENCE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Why Delayed */}
              <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#B5473C] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Why Delayed (Physical Root Causes)
                </h4>
                <ul className="space-y-1.5 text-xs text-[#172033] list-disc list-inside">
                  {selectedDelay.whyDelayed.map((cause, idx) => (
                    <li key={idx} className="leading-relaxed">{cause}</li>
                  ))}
                </ul>
              </div>

              {/* Evidence Attached */}
              <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                  Verified Site Evidence ({selectedDelay.evidenceItems.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedDelay.evidenceItems.map((ev) => (
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
              </div>
            </div>

            {/* AFFECTED DOWNSTREAM ACTIVITIES CASCADE */}
            <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                  Affected Downstream Activities ({selectedDelay.affectedDownstream.length} in Delay Path)
                </h4>
                <span className="text-[11px] text-[#8A94A6]">Cascade Propagation</span>
              </div>

              <div className="border border-[#D9DEE5] rounded-lg overflow-hidden divide-y divide-[#D9DEE5]">
                {selectedDelay.affectedDownstream.map((act) => (
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

            {/* CURRENT MITIGATION & NEXT ACTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mitigation */}
              <div className="p-4 bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87]">
                  Current Schedule Mitigation Plan
                </h4>
                <p className="text-xs text-[#172033] leading-relaxed">
                  {selectedDelay.currentMitigation}
                </p>
              </div>

              {/* Next Action */}
              <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033]">
                  Assigned Next Action
                </h4>
                <p className="text-xs font-semibold text-[#172033]">
                  {selectedDelay.nextAction.action}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-[#D9DEE5]/60 text-[11px] text-[#596579]">
                  <span>Assignee: <strong className="text-[#172033]">{selectedDelay.nextAction.assignee}</strong></span>
                  <span>Due: <strong className="text-[#B5473C] font-mono">{selectedDelay.nextAction.dueDate}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      </div>
    </StateWrapper>
  );
}
