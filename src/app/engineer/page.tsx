'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Modal } from '../../components/shared/Modal';
import { projectService } from '../../lib/api/projectService';
import { ScheduleActivity, ExecutionEvent } from '../../types';
import {
  MOCK_ACTIVITIES,
  MOCK_EXECUTION_EVENTS,
} from '../../lib/api/mockData';
import {
  HardHat,
  Calendar,
  Clock,
  ClipboardList,
  Plus,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Camera,
  Mic,
  ArrowRight,
  FileText,
  Send,
  Building2,
  ChevronRight,
  FileCheck,
  Check,
  X,
  UploadCloud,
  Zap,
  Sparkles,
} from 'lucide-react';

export interface TodayActivityItem extends ScheduleActivity {
  lastUpdateText: string;
}

export interface TodaySubmission {
  id: string;
  time: string;
  activityId: string;
  activityName: string;
  statement: string;
  quantity: string;
  confidence: number;
  status: 'auto-linked' | 'pending-review' | 'approved';
  isSynced: boolean;
}

export type DPRTab = 'draft' | 'processing' | 'submitted' | 'needs-confirmation';

export interface DPRRecord {
  id: string;
  code: string;
  date: string;
  disciplineSummary: string;
  status: DPRTab;
  progressPercentage: number;
  flagReason?: string;
}

export default function EngineerDashboardPage() {
  const { activeProject } = useApp();
  const { addToast } = useToast();

  // Network Connectivity State (Field Offline Support)
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Field Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedActivityForCapture, setSelectedActivityForCapture] = useState<string>('PIP-24-002');
  const [customStatement, setCustomStatement] = useState('');
  const [quantityValue, setQuantityValue] = useState<number>(4);
  const [quantityUnit, setQuantityUnit] = useState<string>('joints');
  const [attachedPhotoName, setAttachedPhotoName] = useState<string | null>(null);
  const [isSubmittingCapture, setIsSubmittingCapture] = useState(false);

  // DPR Status Tab Filter
  const [activeDPRTab, setActiveDPRTab] = useState<DPRTab>('draft');

  // Today's Assigned Activities for this Site Engineer
  const [todayActivities, setTodayActivities] = useState<TodayActivityItem[]>([
    {
      ...MOCK_ACTIVITIES[1], // PIP-24-001
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      area: 'Unit A - Gas Processing Area',
      plannedStart: '2026-09-10',
      plannedFinish: '2026-09-15',
      actualProgress: 100,
      plannedProgress: 100,
      status: 'completed',
      delayDays: 0,
      lastUpdateText: 'Today, 11:30',
    },
    {
      ...MOCK_ACTIVITIES[2], // PIP-24-002
      id: 'PIP-24-002',
      name: 'Weld Line 24-XX Field Joints & NDT Clearance',
      area: 'Unit A - Gas Processing Area',
      plannedStart: '2026-09-16',
      plannedFinish: '2026-09-20',
      actualProgress: 70,
      plannedProgress: 85,
      status: 'delayed',
      delayDays: 2,
      lastUpdateText: 'Today, 14:15',
    },
    {
      ...MOCK_ACTIVITIES[0], // CIV-11-001
      id: 'CIV-11-001',
      name: 'Foundation Block A - Compressor Pedestal',
      area: 'Compressor House Bay',
      plannedStart: '2026-09-05',
      plannedFinish: '2026-09-14',
      actualProgress: 100,
      plannedProgress: 100,
      status: 'completed',
      delayDays: 0,
      lastUpdateText: 'Today, 09:45',
    },
    {
      ...MOCK_ACTIVITIES[3], // PIP-24-003
      id: 'PIP-24-003',
      name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      area: 'Unit A - Gas Processing Area',
      plannedStart: '2026-09-19',
      plannedFinish: '2026-09-22',
      actualProgress: 0,
      plannedProgress: 0,
      status: 'pending',
      delayDays: 2,
      lastUpdateText: 'Scheduled tomorrow',
    },
    {
      ...MOCK_ACTIVITIES[4], // MEC-08-003
      id: 'MEC-08-003',
      name: 'Align Centrifugal Gas Compressor Skid A',
      area: 'Compressor House Bay',
      plannedStart: '2026-09-16',
      plannedFinish: '2026-09-22',
      actualProgress: 15,
      plannedProgress: 20,
      status: 'on-track',
      delayDays: 0,
      lastUpdateText: 'Today, 12:10',
    },
    {
      ...MOCK_ACTIVITIES[5], // ELE-11-032
      id: 'ELE-11-032',
      name: 'Cable Tray Installation - Substation to Bay',
      area: 'Overhead Gallery Bay 1-4',
      plannedStart: '2026-09-15',
      plannedFinish: '2026-09-23',
      actualProgress: 40,
      plannedProgress: 50,
      status: 'at-risk',
      delayDays: 1,
      lastUpdateText: 'Yesterday, 17:00',
    },
  ]);

  // Today's Submissions Log
  const [todaySubmissions, setTodaySubmissions] = useState<TodaySubmission[]>([
    {
      id: 'SUB-TODAY-01',
      time: 'Today, 14:15',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      statement: 'Completed 4 field butt welds on Header Unit A. Joints #05 to #08 cleared visually.',
      quantity: '4 joints',
      confidence: 94,
      status: 'auto-linked',
      isSynced: true,
    },
    {
      id: 'SUB-TODAY-02',
      time: 'Today, 12:10',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      statement: 'Laser rough alignment verified with OEM technician. Shims placed on footing 2 and 4.',
      quantity: '0.15 skid',
      confidence: 88,
      status: 'approved',
      isSynced: true,
    },
    {
      id: 'SUB-TODAY-03',
      time: 'Today, 09:45',
      activityId: 'CIV-11-001',
      activityName: 'Foundation Block A - Pedestal',
      statement: 'De-shuttering finished and curing compound applied. Cube strength 35 N/mm² confirmed.',
      quantity: '45 m³',
      confidence: 96,
      status: 'auto-linked',
      isSynced: true,
    },
    {
      id: 'SUB-TODAY-04',
      time: 'Today, 15:50',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      statement: 'Joint #09 root pass finished with TIG. Pre-heating maintained at 120°C.',
      quantity: '1 joint',
      confidence: 91,
      status: 'pending-review',
      isSynced: false, // Queued offline
    },
  ]);

  // Daily Progress Report (DPR) Records
  const dprRecords: DPRRecord[] = [
    {
      id: 'DPR-01',
      code: 'DPR-OIL-20260918-DRAFT',
      date: '18 Sep 2026 (Today)',
      disciplineSummary: 'Civil 100% • Piping 70% • Mechanical 15% • Electrical 40%',
      status: 'draft',
      progressPercentage: 65,
    },
    {
      id: 'DPR-02',
      code: 'DPR-OIL-20260917-OCR',
      date: '17 Sep 2026',
      disciplineSummary: 'Piping Spool Rigging & Overhead Tray Gallery Bracket Welding',
      status: 'processing',
      progressPercentage: 90,
    },
    {
      id: 'DPR-03',
      code: 'DPR-OIL-20260916-COMMITTED',
      date: '16 Sep 2026',
      disciplineSummary: 'Compressor Pedestal Curing & Spool Erection (12 Spools Complete)',
      status: 'submitted',
      progressPercentage: 100,
    },
    {
      id: 'DPR-04',
      code: 'DPR-OIL-20260915-FLAGGED',
      date: '15 Sep 2026',
      disciplineSummary: 'Line 24 Cold Pull Flange Parallelism & Torqueing Check',
      status: 'needs-confirmation',
      progressPercentage: 80,
      flagReason: 'Discrepancy between site diary (12 spools) and weld inspection sheet (10 spools).',
    },
  ];

  // Offline / Sync Metrics
  const syncMetrics = useMemo(() => {
    const queued = todaySubmissions.filter((s) => !s.isSynced).length;
    const synced = todaySubmissions.filter((s) => s.isSynced).length;
    const failed = 0;
    return { queued, synced, failed };
  }, [todaySubmissions]);

  const breadcrumbs = [
    { label: 'Site Execution' },
    { label: 'Engineer Dashboard', current: true },
  ];

  // Quick Action: Pre-populate and open modal
  const handleOpenCaptureForActivity = (activityId: string) => {
    setSelectedActivityForCapture(activityId);
    const act = todayActivities.find((a) => a.id === activityId);
    if (act) {
      setCustomStatement(`Progress update on ${act.id} (${act.name}). `);
      setQuantityUnit(act.unit || 'units');
    }
    setIsCaptureModalOpen(true);
  };

  // Sync Action
  const handleSyncNow = () => {
    if (!isOnline) {
      addToast({
        type: 'warning',
        title: 'Offline Mode Active',
        description: 'Cannot sync while network is disconnected. Reconnect to send queued updates.',
      });
      return;
    }

    setIsSyncing(true);
    setTimeout(() => {
      setTodaySubmissions((prev) =>
        prev.map((item) => ({ ...item, isSynced: true }))
      );
      setIsSyncing(false);
      addToast({
        type: 'success',
        title: 'Sync Completed',
        description: 'All offline queued field execution records successfully committed to Schedule Twin.',
      });
    }, 1200);
  };

  // Submit Fast Field Capture Form
  const handleSubmitFastCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatement.trim()) return;

    setIsSubmittingCapture(true);
    const nowTime = `Today, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;

    setTimeout(() => {
      const act = todayActivities.find((a) => a.id === selectedActivityForCapture);

      const newSubmission: TodaySubmission = {
        id: `SUB-TODAY-${Date.now().toString().slice(-4)}`,
        time: nowTime,
        activityId: selectedActivityForCapture,
        activityName: act ? act.name : 'Field Activity',
        statement: customStatement.trim(),
        quantity: `${quantityValue} ${quantityUnit}`,
        confidence: 93,
        status: isOnline ? 'auto-linked' : 'pending-review',
        isSynced: isOnline,
      };

      setTodaySubmissions([newSubmission, ...todaySubmissions]);

      // Update today's activity progress slightly
      if (act) {
        setTodayActivities((prev) =>
          prev.map((item) =>
            item.id === selectedActivityForCapture
              ? {
                  ...item,
                  lastUpdateText: nowTime,
                  actualProgress: Math.min(100, item.actualProgress + 10),
                }
              : item
          )
        );
      }

      setIsSubmittingCapture(false);
      setIsCaptureModalOpen(false);
      setCustomStatement('');
      setAttachedPhotoName(null);

      addToast({
        type: 'success',
        title: 'Field Update Submitted',
        description: isOnline
          ? `Recorded ${quantityValue} ${quantityUnit} on ${selectedActivityForCapture}. Schedule Twin updated.`
          : `Saved locally. Queued for background sync when connection restores.`,
      });
    }, 600);
  };

  return (
    <StateWrapper>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbs} />

        {/* ========================================================= */}
        {/* TOP SECTION: Today's Date, Project, Counts & Primary CTA */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* Date & Site Engineer Role Tag */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-[#176B87] text-white">
                  SITE EXECUTION
                </span>
                <span className="text-xs font-mono font-medium text-[#172033] bg-[#F7F8FA] px-2.5 py-0.5 rounded border border-[#D9DEE5]">
                  Thursday, 18 Sep 2026
                </span>
                <span className="text-xs text-[#596579]">Shift: Day Shift (07:00 – 19:00 IST)</span>
              </div>

              {/* Current Project Title */}
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                  {activeProject.name}
                </h1>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-[#596579] mt-1.5 flex-wrap">
                <span className="font-mono font-semibold text-[#172033]">
                  Project Code: {activeProject.code}
                </span>
                <span>•</span>
                <span>Location: {activeProject.location}</span>
                <span>•</span>
                <span>Engineer: <strong className="text-[#172033]">Debajit Borah (Lead Site Execution)</strong></span>
              </div>
            </div>

            {/* Top Right: Network Indicator & Primary Large CTA */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Online / Offline Mode Badge Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsOnline(!isOnline);
                  addToast({
                    type: isOnline ? 'warning' : 'info',
                    title: isOnline ? 'Switched to Offline Mode' : 'Connected to Field Network',
                    description: isOnline
                      ? 'Field observations will be stored locally in offline queue.'
                      : 'Network active. Live cloud verification enabled.',
                  });
                }}
                className={`px-3 py-2 text-xs rounded-lg border font-mono font-medium inline-flex items-center gap-1.5 transition-colors ${
                  isOnline
                    ? 'bg-[#EBF5EF] text-[#2E7D5B] border-[#B8DCC9]'
                    : 'bg-[#FDF5E8] text-[#D98B32] border-[#F0D4A6]'
                }`}
                title="Click to toggle offline mode simulation"
              >
                {isOnline ? (
                  <>
                    <Wifi className="w-3.5 h-3.5" />
                    <span>ONLINE (4G SITE)</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>OFFLINE QUEUE</span>
                  </>
                )}
              </button>

              {/* PRIMARY CTA: Large, High-Contrast Action Button */}
              <Link
                href="/field/capture"
                className="px-5 py-3 text-sm font-bold text-white bg-[#176B87] hover:bg-[#12546A] active:scale-95 rounded-lg shadow-sm transition-all inline-flex items-center gap-2 tracking-wide"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Capture Field Update</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Strip: Activities Today / Pending Captures / Pending Sync */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[#E8EBF0]">
            <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-lg">
              <span className="text-[11px] text-[#596579] font-medium block">Today&apos;s Activities</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#172033]">{todayActivities.length}</span>
                <span className="text-xs text-[#596579]">packages assigned</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-lg">
              <span className="text-[11px] text-[#D98B32] font-medium block">Pending Captures</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#D98B32]">2</span>
                <span className="text-xs text-[#596579]">activities awaiting logs</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-lg">
              <span className="text-[11px] text-[#176B87] font-medium block">Pending Sync</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#176B87]">{syncMetrics.queued}</span>
                <span className="text-xs text-[#596579]">local updates queued</span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-lg">
              <span className="text-[11px] text-[#2E7D5B] font-medium block">Verified &amp; Committed</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-bold font-mono text-[#2E7D5B]">{todaySubmissions.length}</span>
                <span className="text-xs text-[#596579]">events submitted today</span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION: MY TODAY'S ACTIVITIES */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  My Today&apos;s Activities
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Work packages scheduled for site inspection, fit-up verification, and welding logging today.
              </p>
            </div>

            <span className="text-xs font-mono text-[#596579]">
              Shift Target: 6 Work Packages
            </span>
          </div>

          {/* Activities Table */}
          <div className="border border-[#D9DEE5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                    <th className="py-3 px-3.5 whitespace-nowrap">Activity ID</th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[220px]">Activity</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Area</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Planned Date</th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[170px]">Current Progress</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Last Update</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0]">
                  {todayActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#F9FAFC] transition-colors">
                      {/* 1. Activity ID */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <span className="font-mono font-bold text-[#176B87] bg-[#E8F1F5] px-2 py-0.5 rounded border border-[#C5DCE6]">
                          {act.id}
                        </span>
                      </td>

                      {/* 2. Activity */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="font-semibold text-[#172033]">{act.name}</div>
                        <div className="text-[11px] text-[#596579] mt-0.5">
                          {act.discipline} • WBS {act.wbs} ({act.wbsLevel})
                        </div>
                      </td>

                      {/* 3. Area */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap text-[#596579]">
                        {act.area}
                      </td>

                      {/* 4. Planned Date */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap font-mono text-[11px] text-[#596579]">
                        {act.plannedStart} → {act.plannedFinish}
                      </td>

                      {/* 5. Current Progress */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-[#172033]">{act.actualProgress}%</span>
                            <span className="text-[#596579]">T: {act.plannedProgress}%</span>
                          </div>
                          <ProgressBar
                            actual={act.actualProgress}
                            planned={act.plannedProgress}
                            size="sm"
                            status={act.status}
                            showLabels={false}
                          />
                        </div>
                      </td>

                      {/* 6. Last Update */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap font-mono text-[11px] text-[#596579]">
                        {act.lastUpdateText}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <StatusBadge status={act.status} size="sm" />
                      </td>

                      {/* 8. Action: Fast Quick Capture Button */}
                      <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCaptureForActivity(act.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-[#176B87] hover:text-white bg-[#E8F1F5] hover:bg-[#176B87] rounded transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Quick Log</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TWO-COLUMN GRID: TODAY'S FIELD UPDATES & DPR STATUS */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION: TODAY'S FIELD UPDATES */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Today&apos;s Field Updates ({todaySubmissions.length})
                  </h3>
                </div>
                <span className="text-xs text-[#596579]">Latest Submissions Feed</span>
              </div>

              <div className="space-y-3">
                {todaySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 border border-[#D9DEE5] rounded-lg hover:border-[#176B87] transition-colors space-y-1.5 text-xs bg-white"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B87]">{sub.activityId}</span>
                        <span className="text-[#596579] font-medium truncate max-w-[180px]">
                          {sub.activityName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-[#8A94A6]">{sub.time}</span>
                        {sub.isSynced ? (
                          <span className="text-[#2E7D5B] flex items-center gap-0.5 text-[10px]">
                            <Check className="w-3 h-3" />
                            Synced
                          </span>
                        ) : (
                          <span className="text-[#D98B32] flex items-center gap-0.5 text-[10px] bg-[#FDF5E8] px-1.5 py-0.2 rounded border border-[#F0D4A6]">
                            <Clock className="w-3 h-3" />
                            Queued
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[#172033] bg-[#F7F8FA] p-2 rounded border border-[#E8EBF0] text-[11px] italic">
                      &quot;{sub.statement}&quot;
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#596579]">
                      <span>Extracted Quantity: <strong className="text-[#172033]">{sub.quantity}</strong></span>
                      <ConfidenceBadge score={sub.confidence} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-[#E8EBF0] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#596579]">
                Live NLP parameter extraction and schedule twin linking
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityForCapture('PIP-24-002');
                  setIsCaptureModalOpen(true);
                }}
                className="font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Observation</span>
              </button>
            </div>
          </div>

          {/* SECTION: DPR STATUS (Draft / Processing / Submitted / Needs Confirmation) */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0] mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#176B87]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                    Daily Progress Report (DPR) Status
                  </h3>
                </div>
                <Link
                  href="/field/dpr"
                  className="text-xs font-bold text-[#176B87] hover:underline inline-flex items-center gap-1"
                >
                  <span>Open Time Agent</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* DPR Status Selector Tabs: Draft | Processing | Submitted | Needs Confirmation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setActiveDPRTab('draft')}
                  className={`p-2 rounded border text-center transition-colors text-xs ${
                    activeDPRTab === 'draft'
                      ? 'bg-[#E8F1F5] border-[#176B87] text-[#176B87] font-bold'
                      : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Draft</span>
                  <span className="font-mono text-sm font-bold">1 Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDPRTab('processing')}
                  className={`p-2 rounded border text-center transition-colors text-xs ${
                    activeDPRTab === 'processing'
                      ? 'bg-[#E8F1F5] border-[#176B87] text-[#176B87] font-bold'
                      : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Processing</span>
                  <span className="font-mono text-sm font-bold">1 Report</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDPRTab('submitted')}
                  className={`p-2 rounded border text-center transition-colors text-xs ${
                    activeDPRTab === 'submitted'
                      ? 'bg-[#EBF5EF] border-[#2E7D5B] text-[#2E7D5B] font-bold'
                      : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Submitted</span>
                  <span className="font-mono text-sm font-bold">14 Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDPRTab('needs-confirmation')}
                  className={`p-2 rounded border text-center transition-colors text-xs ${
                    activeDPRTab === 'needs-confirmation'
                      ? 'bg-[#FDF5E8] border-[#D98B32] text-[#D98B32] font-bold'
                      : 'bg-[#F7F8FA] border-[#D9DEE5] text-[#596579] hover:bg-white'
                  }`}
                >
                  <span className="block text-[10px] uppercase">Needs Confirm</span>
                  <span className="font-mono text-sm font-bold">1 Alert</span>
                </button>
              </div>

              {/* DPR List for selected state */}
              <div className="space-y-3">
                {dprRecords
                  .filter((r) => r.status === activeDPRTab)
                  .map((dpr) => (
                    <div
                      key={dpr.id}
                      className="p-3 border border-[#D9DEE5] rounded-lg bg-white space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#172033]">{dpr.code}</span>
                        <span className="font-mono text-[11px] text-[#596579]">{dpr.date}</span>
                      </div>

                      <p className="text-[#596579] text-[11px]">{dpr.disciplineSummary}</p>

                      {dpr.flagReason && (
                        <div className="p-2 bg-[#FDF5E8] border border-[#F0D4A6] rounded text-[11px] text-[#D98B32] flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                          <span>{dpr.flagReason}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#E8EBF0] flex items-center justify-between">
                        <span className="text-[11px] text-[#596579]">
                          DPR Completion: <strong className="font-mono text-[#172033]">{dpr.progressPercentage}%</strong>
                        </span>

                        <Link
                          href="/field/dpr"
                          className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>{dpr.status === 'draft' ? 'Resume Editing' : 'Inspect DPR'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-[#E8EBF0] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#596579]">
                Authorized sign-off for Oil India Limited Resident Engineer
              </span>
              <Link
                href="/field"
                className="font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
              >
                <span>Full Field Ingestion Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION: OFFLINE / SYNC */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#176B87]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Field Connectivity &amp; Offline Sync Queue
                </h3>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Resilient local queue designed for remote oilfield sites with intermittent telemetry or bandwidth loss.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || syncMetrics.queued === 0}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] disabled:opacity-50 rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Queued Updates */}
            <div className="p-3 bg-[#FDF5E8] border border-[#F0D4A6] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#D98B32]">Queued Updates</span>
                <Clock className="w-3.5 h-3.5 text-[#D98B32]" />
              </div>
              <span className="text-2xl font-bold font-mono text-[#D98B32]">
                {syncMetrics.queued}
              </span>
              <p className="text-[10px] text-[#596579] mt-0.5">Awaiting cloud transmission</p>
            </div>

            {/* 2. Syncing */}
            <div className="p-3 bg-[#E8F1F5] border border-[#C5DCE6] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#176B87]">Syncing</span>
                <RefreshCw className={`w-3.5 h-3.5 text-[#176B87] ${isSyncing ? 'animate-spin' : ''}`} />
              </div>
              <span className="text-2xl font-bold font-mono text-[#176B87]">
                {isSyncing ? '1 Active' : 'Idle'}
              </span>
              <p className="text-[10px] text-[#596579] mt-0.5">Payload transmission engine</p>
            </div>

            {/* 3. Failed */}
            <div className="p-3 bg-[#F7F8FA] border border-[#E8EBF0] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#596579]">Failed Transmissions</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B]" />
              </div>
              <span className="text-2xl font-bold font-mono text-[#172033]">0</span>
              <p className="text-[10px] text-[#596579] mt-0.5">Zero network errors</p>
            </div>

            {/* 4. Synced */}
            <div className="p-3 bg-[#EBF5EF] border border-[#B8DCC9] rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-[#2E7D5B]">Synced Today</span>
                <Check className="w-3.5 h-3.5 text-[#2E7D5B]" />
              </div>
              <span className="text-2xl font-bold font-mono text-[#2E7D5B]">
                {syncMetrics.synced}
              </span>
              <p className="text-[10px] text-[#596579] mt-0.5">Committed to Schedule Twin</p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FAST FIELD CAPTURE MODAL (Speed & Minimal Manual Entry) */}
        {/* ========================================================= */}
        <Modal
          isOpen={isCaptureModalOpen}
          onClose={() => setIsCaptureModalOpen(false)}
          title="Capture Field Progress Update"
          subtitle="One-tap progress reporting designed for site execution engineers."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#596579] font-mono">
                Auto-saves offline if network drops
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaptureModalOpen(false)}
                  disabled={isSubmittingCapture}
                  className="px-3.5 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFastCapture}
                  disabled={isSubmittingCapture || !customStatement.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#12546A] rounded transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmittingCapture ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Update</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={handleSubmitFastCapture} className="space-y-4 text-xs">
            {/* Pre-Selected Activity */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Target Scheduled Activity <span className="text-[#B5473C]">*</span>
              </label>
              <select
                value={selectedActivityForCapture}
                onChange={(e) => {
                  setSelectedActivityForCapture(e.target.value);
                  const act = todayActivities.find((a) => a.id === e.target.value);
                  if (act) setQuantityUnit(act.unit || 'units');
                }}
                className="w-full px-3 py-2 text-xs bg-[#F7F8FA] border border-[#D9DEE5] focus:border-[#176B87] focus:bg-white rounded font-medium text-[#172033] outline-none"
              >
                {todayActivities.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.id} — {act.name} ({act.area})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Speed Chips (Minimal Manual Entry) */}
            <div>
              <label className="block text-[11px] font-bold text-[#596579] mb-1.5">
                Quick Observation Chips (Tap to Insert):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Welding completed 4 joints on Header 24-XX.',
                  'Root pass done with TIG; NDT scheduled tonight.',
                  'Rigging & crane hoisting finished without incident.',
                  'Cold pull flange alignment verified within tolerance.',
                  'Rain delay for 2 hours; work resumed.',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomStatement(chip)}
                    className="px-2.5 py-1 text-[11px] rounded bg-[#F0F2F5] hover:bg-[#E8F1F5] hover:text-[#176B87] text-[#596579] border border-[#D9DEE5] transition-colors text-left"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Statement Textarea */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#172033]">
                  Field Statement / Site Observation <span className="text-[#B5473C]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStatement(
                      'Line 24-XX field butt welding completed 4 joints today on Header Unit A. Crane shifted to compressor skid.'
                    );
                    addToast({
                      type: 'info',
                      title: 'Voice Note Transcribed',
                      description: 'Simulated field voice memo parsed into structured statement.',
                    });
                  }}
                  className="text-[11px] text-[#176B87] hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <Mic className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Simulate Voice Note</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={customStatement}
                onChange={(e) => setCustomStatement(e.target.value)}
                placeholder="Type or dictate what was completed on site today..."
                className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded focus:border-[#176B87] focus:bg-white text-[#172033] outline-none"
                required
              />
            </div>

            {/* Quantity Stepper & Unit */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded">
              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Quantity Completed Today
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantityValue(Math.max(1, quantityValue - 1))}
                    className="w-7 h-7 bg-white border border-[#D9DEE5] hover:bg-[#E8EBF0] rounded text-sm font-bold flex items-center justify-center text-[#172033]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantityValue}
                    onChange={(e) => setQuantityValue(Number(e.target.value))}
                    className="w-16 text-center font-mono font-bold text-sm bg-white border border-[#D9DEE5] rounded py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantityValue(quantityValue + 1)}
                    className="w-7 h-7 bg-white border border-[#D9DEE5] hover:bg-[#E8EBF0] rounded text-sm font-bold flex items-center justify-center text-[#172033]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#172033] mb-1">
                  Engineering Unit
                </label>
                <input
                  type="text"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[#D9DEE5] rounded font-mono"
                />
              </div>
            </div>

            {/* Quick Photo Evidence Attachment */}
            <div className="flex items-center justify-between p-2.5 bg-[#F0F2F5] border border-[#D9DEE5] rounded">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#176B87]" />
                <span className="text-[11px] text-[#172033] font-medium">
                  {attachedPhotoName ? attachedPhotoName : 'Attach Geotagged Site Photo'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttachedPhotoName('IMG_20260918_WELD_JOINT.jpg (27.348° N, 95.313° E)');
                  addToast({
                    type: 'success',
                    title: 'GPS Geotag Photo Attached',
                    description: 'Captured image with embedded field coordinates.',
                  });
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#176B87] bg-white border border-[#D9DEE5] hover:bg-[#E8F1F5] rounded transition-colors"
              >
                {attachedPhotoName ? 'Replace Photo' : 'Capture Photo'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </StateWrapper>
  );
}
