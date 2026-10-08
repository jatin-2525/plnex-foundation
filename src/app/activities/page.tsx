'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { ProjectSelector } from '../../components/shell/ProjectSelector';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Drawer } from '../../components/shared/Drawer';
import { Modal } from '../../components/shared/Modal';
import { WhyButton } from '../../components/shared/WhyButton';
import { ActivityStatus, DisciplineType } from '../../types';
import {
  ListChecks,
  Calendar,
  Clock,
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  X,
  ChevronRight,
  ArrowRight,
  Send,
  Building2,
  HardHat,
  Lock,
  Camera,
  Layers,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';

export type ExtendedActivityStatus = 'not-started' | 'in-progress' | 'completed' | 'blocked' | 'delayed';

export interface AssignedActivity {
  id: string;
  name: string;
  wbs: string;
  wbsLevel: string;
  discipline: DisciplineType;
  area: string;
  plannedStart: string;
  plannedFinish: string;
  actualProgress: number; // 0-100
  plannedProgress: number; // 0-100
  lastUpdate: string;
  status: ExtendedActivityStatus;
  delayDays: number;
  blockedReason?: string;
  predecessors: string[];
  successors: string[];
  isCritical: boolean;
  unit: string;
  quantityDone: number;
  quantityTarget: number;
}

const INITIAL_ASSIGNED_ACTIVITIES: AssignedActivity[] = [
  {
    id: 'PIP-24-002',
    name: 'Weld Line 24-XX Field Joints & NDT Clearance',
    wbs: '1.1.3.2.2',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-20',
    actualProgress: 70,
    plannedProgress: 85,
    lastUpdate: 'Today, 14:15',
    status: 'delayed',
    delayDays: 2,
    predecessors: ['PIP-24-001'],
    successors: ['PIP-24-003', 'INS-02-005'],
    isCritical: true,
    unit: 'joints',
    quantityDone: 8.4,
    quantityTarget: 12,
  },
  {
    id: 'PIP-24-001',
    name: 'Erect Line 24-XX High Pressure Gas Header',
    wbs: '1.1.3.2.1',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    plannedStart: '2026-09-10',
    plannedFinish: '2026-09-15',
    actualProgress: 100,
    plannedProgress: 100,
    lastUpdate: 'Today, 11:30',
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['PIP-24-002'],
    isCritical: true,
    unit: 'spools',
    quantityDone: 12,
    quantityTarget: 12,
  },
  {
    id: 'MEC-08-003',
    name: 'Align Centrifugal Gas Compressor Skid A',
    wbs: '1.1.2.4.1',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Compressor House Bay',
    plannedStart: '2026-09-16',
    plannedFinish: '2026-09-22',
    actualProgress: 15,
    plannedProgress: 20,
    lastUpdate: 'Today, 12:10',
    status: 'in-progress',
    delayDays: 0,
    predecessors: ['CIV-11-001'],
    successors: ['ELE-11-032'],
    isCritical: false,
    unit: 'skid',
    quantityDone: 0.15,
    quantityTarget: 1,
  },
  {
    id: 'ELE-11-032',
    name: 'Cable Tray Installation - Substation to Bay',
    wbs: '1.1.4.1.2',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Overhead Gallery Bay 1-4',
    plannedStart: '2026-09-15',
    plannedFinish: '2026-09-23',
    actualProgress: 40,
    plannedProgress: 50,
    lastUpdate: 'Yesterday, 17:00',
    status: 'in-progress',
    delayDays: 1,
    predecessors: ['MEC-08-003'],
    successors: ['INS-02-005'],
    isCritical: false,
    unit: 'meters',
    quantityDone: 128,
    quantityTarget: 320,
  },
  {
    id: 'PIP-24-003',
    name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    wbs: '1.1.3.2.3',
    wbsLevel: 'L5',
    discipline: 'Piping',
    area: 'Unit A - Gas Processing Area',
    plannedStart: '2026-09-19',
    plannedFinish: '2026-09-22',
    actualProgress: 0,
    plannedProgress: 0,
    lastUpdate: 'Scheduled 19 Sep',
    status: 'blocked',
    delayDays: 2,
    blockedReason: 'Blocked by predecessor PIP-24-002: Welding and 100% NDT clearance required before pressure test.',
    predecessors: ['PIP-24-002'],
    successors: ['PIP-24-004'],
    isCritical: true,
    unit: 'test package',
    quantityDone: 0,
    quantityTarget: 1,
  },
  {
    id: 'INS-02-005',
    name: 'Mount Smart Pressure Transmitters on Line 24-XX',
    wbs: '1.1.5.2.1',
    wbsLevel: 'L5',
    discipline: 'Instrumentation',
    area: 'Unit A - Gas Processing Area',
    plannedStart: '2026-09-21',
    plannedFinish: '2026-09-25',
    actualProgress: 0,
    plannedProgress: 15,
    lastUpdate: '16 Sep, 10:00',
    status: 'blocked',
    delayDays: 2,
    blockedReason: 'Blocked on SS+3d link: Field welds must be completed on Header Unit A before mounting impulse tubing.',
    predecessors: ['PIP-24-002', 'ELE-11-032'],
    successors: [],
    isCritical: true,
    unit: 'transmitters',
    quantityDone: 0,
    quantityTarget: 6,
  },
  {
    id: 'CIV-11-001',
    name: 'Foundation Block A - Compressor Pedestal',
    wbs: '1.1.2.1.1',
    wbsLevel: 'L5',
    discipline: 'Civil',
    area: 'Compressor House Bay',
    plannedStart: '2026-09-05',
    plannedFinish: '2026-09-14',
    actualProgress: 100,
    plannedProgress: 100,
    lastUpdate: 'Today, 09:45',
    status: 'completed',
    delayDays: 0,
    predecessors: [],
    successors: ['MEC-08-003'],
    isCritical: true,
    unit: 'm³ concrete',
    quantityDone: 45,
    quantityTarget: 45,
  },
  {
    id: 'CIV-12-004',
    name: 'Excavate Drainage Trench along Pipe Rack West',
    wbs: '1.1.2.3.1',
    wbsLevel: 'L5',
    discipline: 'Civil',
    area: 'Unit A - Piperack West',
    plannedStart: '2026-09-17',
    plannedFinish: '2026-09-21',
    actualProgress: 60,
    plannedProgress: 60,
    lastUpdate: 'Today, 08:30',
    status: 'in-progress',
    delayDays: 0,
    predecessors: [],
    successors: [],
    isCritical: false,
    unit: 'meters',
    quantityDone: 72,
    quantityTarget: 120,
  },
  {
    id: 'MEC-09-001',
    name: 'Mount Lube Oil Cooler & Piping Spool Loop',
    wbs: '1.1.4.2.1',
    wbsLevel: 'L5',
    discipline: 'Mechanical',
    area: 'Compressor House Bay',
    plannedStart: '2026-09-24',
    plannedFinish: '2026-09-29',
    actualProgress: 0,
    plannedProgress: 0,
    lastUpdate: 'Not started',
    status: 'not-started',
    delayDays: 0,
    predecessors: ['MEC-08-003'],
    successors: [],
    isCritical: false,
    unit: 'skid loop',
    quantityDone: 0,
    quantityTarget: 1,
  },
  {
    id: 'ELE-12-015',
    name: 'High Voltage Transformer Busduct Flange Bolting',
    wbs: '1.1.5.3.2',
    wbsLevel: 'L5',
    discipline: 'Electrical',
    area: 'Substation Yard',
    plannedStart: '2026-09-28',
    plannedFinish: '2026-10-02',
    actualProgress: 0,
    plannedProgress: 0,
    lastUpdate: 'Not started',
    status: 'not-started',
    delayDays: 0,
    predecessors: [],
    successors: [],
    isCritical: false,
    unit: 'flanges',
    quantityDone: 0,
    quantityTarget: 16,
  },
];

export default function MyActivitiesPage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  const [activities, setActivities] = useState<AssignedActivity[]>(INITIAL_ASSIGNED_ACTIVITIES);
  const [selectedActivity, setSelectedActivity] = useState<AssignedActivity | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [progressFilter, setProgressFilter] = useState<string>('all');

  // Quick Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [captureTargetActivity, setCaptureTargetActivity] = useState<AssignedActivity | null>(null);
  const [captureStatement, setCaptureStatement] = useState('');
  const [captureQuantity, setCaptureQuantity] = useState<number>(1);
  const [isSubmittingCapture, setIsSubmittingCapture] = useState(false);

  const breadcrumbs = [
    { label: 'Site Execution' },
    { label: 'My Activities', current: true },
  ];

  // Unique Area & Discipline options
  const areaOptions = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.area)));
  }, [activities]);

  const disciplineOptions = useMemo(() => {
    return Array.from(new Set(activities.map((a) => a.discipline)));
  }, [activities]);

  // Filtered Activities Logic
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matches =
          act.id.toLowerCase().includes(q) ||
          act.name.toLowerCase().includes(q) ||
          act.wbs.toLowerCase().includes(q) ||
          act.area.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Filter: Status
      if (statusFilter !== 'all' && act.status !== statusFilter) {
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

      // Filter: Progress
      if (progressFilter !== 'all') {
        if (progressFilter === '0' && act.actualProgress !== 0) return false;
        if (progressFilter === '1-49' && (act.actualProgress < 1 || act.actualProgress > 49)) return false;
        if (progressFilter === '50-99' && (act.actualProgress < 50 || act.actualProgress > 99)) return false;
        if (progressFilter === '100' && act.actualProgress !== 100) return false;
      }

      // Filter: Date
      if (dateFilter !== 'all') {
        if (dateFilter === 'this-week') {
          // Planned finish between 16 and 22 Sep
          const fin = new Date(act.plannedFinish).getTime();
          const start = new Date('2026-09-14').getTime();
          const end = new Date('2026-09-22').getTime();
          if (fin < start || fin > end) return false;
        } else if (dateFilter === 'delayed') {
          if (act.delayDays <= 0) return false;
        } else if (dateFilter === 'upcoming') {
          if (new Date(act.plannedStart).getTime() <= new Date('2026-09-18').getTime()) return false;
        }
      }

      return true;
    });
  }, [activities, search, statusFilter, areaFilter, disciplineFilter, progressFilter, dateFilter]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    statusFilter !== 'all' ||
    areaFilter !== 'all' ||
    disciplineFilter !== 'all' ||
    dateFilter !== 'all' ||
    progressFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setAreaFilter('all');
    setDisciplineFilter('all');
    setDateFilter('all');
    setProgressFilter('all');
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const total = activities.length;
    const inProgress = activities.filter((a) => a.status === 'in-progress').length;
    const delayed = activities.filter((a) => a.status === 'delayed').length;
    const blocked = activities.filter((a) => a.status === 'blocked').length;
    const completed = activities.filter((a) => a.status === 'completed').length;
    const avgProgress = Math.round(
      activities.reduce((acc, curr) => acc + curr.actualProgress, 0) / (total || 1)
    );
    return { total, inProgress, delayed, blocked, completed, avgProgress };
  }, [activities]);

  // Handle open capture modal
  const handleOpenCapture = (e: React.MouseEvent, act: AssignedActivity) => {
    e.stopPropagation(); // Avoid triggering row click drawer
    setCaptureTargetActivity(act);
    setCaptureStatement(`Work performed on ${act.id} (${act.name}). `);
    setCaptureQuantity(1);
    setIsCaptureModalOpen(true);
  };

  // Handle open drawer
  const handleOpenDrawer = (act: AssignedActivity) => {
    openActivityDrawer(act.id);
  };

  // Handle quick capture submit
  const handleQuickCaptureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!captureTargetActivity || !captureStatement.trim()) return;

    setIsSubmittingCapture(true);
    const nowText = `Today, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    setTimeout(() => {
      setActivities((prev) =>
        prev.map((a) =>
          a.id === captureTargetActivity.id
            ? {
                ...a,
                lastUpdate: nowText,
                actualProgress: Math.min(100, a.actualProgress + 10),
                quantityDone: a.quantityDone + captureQuantity,
                status: a.actualProgress + 10 >= 100 ? 'completed' : a.status,
              }
            : a
        )
      );

      setIsSubmittingCapture(false);
      setIsCaptureModalOpen(false);

      addToast({
        type: 'success',
        title: 'Field Update Captured',
        description: `Logged update for ${captureTargetActivity.id}. Progress synchronized with Schedule Twin.`,
      });
    }, 600);
  };

  // Render Status Badge for the 5 required statuses
  const renderStatusBadge = (status: ExtendedActivityStatus) => {
    switch (status) {
      case 'not-started':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-medium bg-[#F1F3F5] text-[#596579] border border-[#D9DEE5]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7B8798]" />
            Not Started
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-medium bg-[#EDF5F8] text-[#176B87] border border-[#C5DCE6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#176B87]" />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
            Completed
          </span>
        );
      case 'blocked':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-medium bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
            <Lock className="w-3 h-3 text-[#D98B32]" />
            Blocked
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-xs font-medium bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B5473C]" />
            Delayed
          </span>
        );
    }
  };

  return (
    <StateWrapper>
      <div className="space-y-6 pb-12">
        <Breadcrumbs items={breadcrumbs} />

        {/* HEADER: My Activities, Project Selector, Reporting Date */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded bg-[#EDF5F8] flex items-center justify-center text-[#176B87]">
                  <ListChecks className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[#172033] tracking-tight">My Activities</h1>
                </div>
              </div>
              <p className="text-xs text-[#596579]">
                Assigned work package execution schedule for{' '}
                <strong className="text-[#172033]">Debajit Borah (Lead Site Execution Engineer)</strong>.
              </p>
            </div>

            {/* Header Controls: Project Selector & Reporting Date */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium hidden sm:inline">Project:</span>
                <ProjectSelector />
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs font-mono">
                <Calendar className="w-3.5 h-3.5 text-[#176B87]" />
                <span className="text-[#596579]">Reporting Date:</span>
                <strong className="text-[#172033] font-bold">18 Sep 2026</strong>
              </div>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[#D9DEE5]">
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#596579] font-medium block">Total Assigned</span>
              <span className="text-lg font-bold text-[#172033] font-mono">{metrics.total} packages</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#176B87] font-medium block">In Progress</span>
              <span className="text-lg font-bold text-[#176B87] font-mono">{metrics.inProgress} active</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#B5473C] font-medium block">Delayed / Blocked</span>
              <span className="text-lg font-bold text-[#B5473C] font-mono">{metrics.delayed + metrics.blocked} attention</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#2E7D5B] font-medium block">Completed</span>
              <span className="text-lg font-bold text-[#2E7D5B] font-mono">{metrics.completed} finished</span>
            </div>
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <span className="text-[11px] text-[#596579] font-medium block">Avg Progress</span>
              <span className="text-lg font-bold text-[#172033] font-mono">{metrics.avgProgress}%</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assigned activity ID, title, or area..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded-md text-[#172033] placeholder-[#7B8798] transition-colors outline-none"
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

            {/* Filter Controls Row: Status | Area | Discipline | Date | Progress */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter 1: Status (Not Started, In Progress, Completed, Blocked, Delayed) */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="in-progress">In Progress</option>
                  <option value="delayed">Delayed</option>
                  <option value="blocked">Blocked</option>
                  <option value="completed">Completed</option>
                  <option value="not-started">Not Started</option>
                </select>
              </div>

              {/* Filter 2: Area */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Area:</span>
                <select
                  value={areaFilter}
                  onChange={(e) => setAreaFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="all">All Areas</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Discipline */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Discipline:</span>
                <select
                  value={disciplineFilter}
                  onChange={(e) => setDisciplineFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Disciplines</option>
                  {disciplineOptions.map((disc) => (
                    <option key={disc} value={disc}>
                      {disc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Date */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Date:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="this-week">Due This Week</option>
                  <option value="delayed">Past Target Date</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              {/* Filter 5: Progress */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#596579] font-medium">Progress:</span>
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] rounded-md text-[#172033] outline-none cursor-pointer"
                >
                  <option value="all">All Progress</option>
                  <option value="0">0% (Not Started)</option>
                  <option value="1-49">1% – 49%</option>
                  <option value="50-99">50% – 99%</option>
                  <option value="100">100% (Done)</option>
                </select>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-3 py-1.5 text-xs text-[#B5473C] hover:bg-[#FBEFEE] border border-[#E4B0AA] rounded-md transition-colors inline-flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#596579] pt-2 border-t border-[#F1F3F5]">
            <span>
              Showing <strong className="text-[#172033] font-mono">{filteredActivities.length}</strong> of{' '}
              <span className="font-mono">{activities.length}</span> assigned activities
            </span>
            <span className="text-[11px] text-[#7B8798]">Click any row to open the Activity Detail Drawer</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP TABLE VIEW (hidden on mobile) */}
        {/* ========================================================= */}
        <div className="hidden md:block bg-white border border-[#D9DEE5] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                  <th className="py-3 px-4 whitespace-nowrap">Activity ID</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[240px]">Activity</th>
                  <th className="py-3 px-4 whitespace-nowrap">Area</th>
                  <th className="py-3 px-4 whitespace-nowrap">Discipline</th>
                  <th className="py-3 px-4 whitespace-nowrap min-w-[150px]">Progress</th>
                  <th className="py-3 px-4 whitespace-nowrap">Variance</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredActivities.map((act) => {
                  const isSlipped = act.delayDays > 0;
                  const isBehindProgress = act.actualProgress < act.plannedProgress;

                  return (
                    <tr
                      key={act.id}
                      onClick={() => handleOpenDrawer(act)}
                      className="hover:bg-[#F9FAFC] cursor-pointer transition-colors group"
                    >
                      {/* 1. Activity ID */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="font-mono font-bold text-[#176B87] group-hover:underline">
                          {act.id}
                        </span>
                      </td>

                      {/* 2. Activity (Clean title without cluttered inline WBS) */}
                      <td className="py-3 px-4 align-middle">
                        <div className="font-semibold text-[#172033] group-hover:text-[#176B87] transition-colors">
                          {act.name}
                        </div>
                        {act.isCritical && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono text-[#B5473C] font-bold">
                            CRITICAL PATH
                          </span>
                        )}
                      </td>

                      {/* 3. Area */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap text-[#596579]">
                        {act.area}
                      </td>

                      {/* 4. Discipline */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-[#F1F3F5] border border-[#D9DEE5] rounded text-[11px] text-[#172033] font-medium">
                          {act.discipline}
                        </span>
                      </td>

                      {/* 5. Progress */}
                      <td className="py-3 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-[#172033]">{act.actualProgress}%</span>
                            <span className="text-[#596579]">Target: {act.plannedProgress}%</span>
                          </div>
                          <ProgressBar
                            actual={act.actualProgress}
                            planned={act.plannedProgress}
                            size="sm"
                            status={act.status as any}
                            showLabels={false}
                          />
                        </div>
                      </td>

                      {/* 6. Variance (with contextual Why? explanation) */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        {isSlipped ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                              +{act.delayDays}d slip
                            </span>
                            <WhyButton
                              onClick={() =>
                                openWhyExplanation(`delay:${act.id}`, act.id)
                              }
                              title="Why is this activity delayed?"
                            />
                          </div>
                        ) : isBehindProgress ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FDF6ED] text-[#8C5311] border border-[#F0D4A6]">
                              {act.actualProgress - act.plannedProgress}% lag
                            </span>
                            <WhyButton
                              onClick={() =>
                                openWhyExplanation(`variance:${act.id}`, act.id)
                              }
                              title="Why is progress lagging planned baseline?"
                            />
                          </div>
                        ) : (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                            On Track
                          </span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(act.status)}
                          {isSlipped && (
                            <WhyButton
                              variant="subtle"
                              onClick={() =>
                                openWhyExplanation(`delay:${act.id}`, act.id)
                              }
                            />
                          )}
                        </div>
                      </td>

                      {/* 8. Action (Primary: Capture Update | Secondary: Details) */}
                      <td className="py-3 px-4 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {act.status !== 'completed' && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenCapture(e, act)}
                              className="px-3 py-1 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Capture field progress for this activity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Capture Update</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(act);
                            }}
                            className="px-2 py-1 text-xs font-medium text-[#596579] hover:text-[#172033] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded transition-colors inline-flex items-center gap-1"
                            title="Open Activity Detail Drawer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#7B8798]" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MOBILE VIEW: COMPACT ACTIVITY CARDS (block on mobile) */}
        {/* ========================================================= */}
        <div className="block md:hidden space-y-3">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              onClick={() => handleOpenDrawer(act)}
              className="bg-white border border-[#D9DEE5] rounded-lg p-4 space-y-3 shadow-xs active:bg-[#F9FAFC]"
            >
              {/* Top Row: Activity ID + Discipline + Status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#176B87]">
                    {act.id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#F1F3F5] border border-[#D9DEE5] text-[#596579]">
                    {act.discipline}
                  </span>
                </div>
                {renderStatusBadge(act.status)}
              </div>

              {/* Title & Area */}
              <div>
                <h3 className="font-bold text-sm text-[#172033] leading-snug">{act.name}</h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  {act.area} • WBS {act.wbs}
                </p>
                {act.blockedReason && (
                  <p className="text-[11px] text-[#8C5311] mt-1 bg-[#FDF6ED] p-2 rounded border border-[#F0D4A6]">
                    {act.blockedReason}
                  </p>
                )}
              </div>

              {/* Dates & Progress */}
              <div className="p-3 bg-[#F7F8FA] rounded border border-[#D9DEE5] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#596579] text-[11px]">
                  <span>Planned: {act.plannedStart} → {act.plannedFinish}</span>
                  <span>{act.lastUpdate}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Actual: <strong className="text-[#176B87]">{act.actualProgress}%</strong></span>
                  <span>Target: {act.plannedProgress}%</span>
                </div>
                <ProgressBar
                  actual={act.actualProgress}
                  planned={act.plannedProgress}
                  size="sm"
                  status={act.status as any}
                  showLabels={false}
                />
              </div>

              {/* Bottom Card Actions: Primary Capture Update & Secondary View Activity */}
              <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDrawer(act);
                  }}
                  className="min-h-[44px] px-3 py-2 text-xs font-medium text-[#596579] hover:bg-[#F1F3F5] active:bg-[#D9DEE5] border border-[#D9DEE5] rounded-lg flex-1 text-center transition-colors cursor-pointer"
                >
                  View Activity
                </button>

                <button
                  type="button"
                  onClick={(e) => handleOpenCapture(e, act)}
                  className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg flex-1 inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Capture Update</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* QUICK CAPTURE MODAL */}
        {captureTargetActivity && (
          <Modal
            isOpen={isCaptureModalOpen}
            onClose={() => setIsCaptureModalOpen(false)}
            title={`Capture Update: ${captureTargetActivity.id}`}
            subtitle={captureTargetActivity.name}
            maxWidth="md"
            footer={
              <div className="flex items-center justify-end gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setIsCaptureModalOpen(false)}
                  disabled={isSubmittingCapture}
                  className="px-3 py-1.5 text-xs text-[#596579] border border-[#D9DEE5] rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickCaptureSubmit}
                  disabled={isSubmittingCapture || !captureStatement.trim()}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded inline-flex items-center gap-2 shadow-xs"
                >
                  {isSubmittingCapture ? 'Submitting...' : 'Submit Progress Update'}
                </button>
              </div>
            }
          >
            <form onSubmit={handleQuickCaptureSubmit} className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded space-y-1">
                <div className="flex justify-between font-mono">
                  <span>Current Actual: {captureTargetActivity.actualProgress}%</span>
                  <span>Target: {captureTargetActivity.plannedProgress}%</span>
                </div>
                <div className="flex justify-between text-[#596579]">
                  <span>Total Target: {captureTargetActivity.quantityTarget} {captureTargetActivity.unit}</span>
                  <span>Done so far: {captureTargetActivity.quantityDone} {captureTargetActivity.unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Field Progress Statement <span className="text-[#B5473C]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={captureStatement}
                  onChange={(e) => setCaptureStatement(e.target.value)}
                  placeholder="Record work completed on site today..."
                  className="w-full p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded focus:border-[#176B87] focus:bg-white text-[#172033] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Quantity Done in Shift
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={captureQuantity}
                    onChange={(e) => setCaptureQuantity(Number(e.target.value))}
                    className="w-full px-2 py-1 bg-white border border-[#D9DEE5] rounded font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#172033] mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    disabled
                    value={captureTargetActivity.unit}
                    className="w-full px-2 py-1 bg-[#F1F3F5] border border-[#D9DEE5] rounded font-mono text-[#596579]"
                  />
                </div>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
