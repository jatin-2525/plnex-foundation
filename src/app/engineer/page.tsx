'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { Modal } from '../../components/shared/Modal';
import { ScheduleActivity } from '../../types';
import { MOCK_ACTIVITIES } from '../../lib/api/mockData';
import { formatProjectDate, PROJECT_REPORT_DATE } from '../../lib/domain/dateUtils';
import {
  HardHat,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Camera,
  Mic,
  ArrowRight,
  FileText,
  Send,
  Check,
  UploadCloud,
  ChevronRight,
  Eye,
  FileCheck,
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
  discipline: string;
  area: string;
  status: 'approved' | 'pending-review' | 'auto-linked';
  isSynced: boolean;
  photoUrl?: string;
}

export default function EngineerDashboardPage() {
  const { activeProject, userSession } = useApp();
  const { addToast } = useToast();
  const {
    isOffline,
    effectiveStatus,
    isSyncing,
    metrics,
    syncNow,
    captureFieldUpdate,
  } = useOffline();

  // Field Capture Modal State
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
  const [selectedActivityForCapture, setSelectedActivityForCapture] = useState<string>('PIP-24-002');
  const [customStatement, setCustomStatement] = useState('');
  const [quantityValue, setQuantityValue] = useState<number>(4);
  const [quantityUnit, setQuantityUnit] = useState<string>('joints');
  const [attachedPhotoName, setAttachedPhotoName] = useState<string | null>(null);
  const [isSubmittingCapture, setIsSubmittingCapture] = useState(false);

  // Detail Modal for Recent Updates
  const [selectedDetailUpdate, setSelectedDetailUpdate] = useState<TodaySubmission | null>(null);

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const currentUserName = userSession?.name || 'Debajit Borah';

  // Today's Assigned Activities for this Site Engineer
  const [todayActivities, setTodayActivities] = useState<TodayActivityItem[]>([
    {
      ...MOCK_ACTIVITIES[1], // PIP-24-001
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      area: 'Unit A - Gas Processing',
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
      area: 'Unit A - Gas Processing',
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
    {
      ...MOCK_ACTIVITIES[3], // PIP-24-003
      id: 'PIP-24-003',
      name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      area: 'Unit A - Gas Processing',
      plannedStart: '2026-09-19',
      plannedFinish: '2026-09-22',
      actualProgress: 0,
      plannedProgress: 0,
      status: 'pending',
      delayDays: 2,
      lastUpdateText: 'Scheduled tomorrow',
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
      discipline: 'Piping',
      area: 'Unit A',
      status: 'auto-linked',
      isSynced: true,
      photoUrl: 'IMG_LINE24_WELD_08.jpg',
    },
    {
      id: 'SUB-TODAY-02',
      time: 'Today, 12:10',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      statement: 'Laser rough alignment verified with OEM technician. Shims placed on footing 2 and 4.',
      quantity: '0.15 skid',
      discipline: 'Mechanical',
      area: 'Compressor House',
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
      discipline: 'Civil',
      area: 'Compressor Bay',
      status: 'auto-linked',
      isSynced: true,
      photoUrl: 'IMG_CIV_PED_CURE.jpg',
    },
    {
      id: 'SUB-TODAY-04',
      time: 'Today, 15:50',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      statement: 'Joint #09 root pass finished with TIG. Pre-heating maintained at 120°C.',
      quantity: '1 joint',
      discipline: 'Piping',
      area: 'Unit A',
      status: 'pending-review',
      isSynced: false, // Queued offline
    },
  ]);

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
      setQuantityUnit(act.unit || 'joints');
    }
    setIsCaptureModalOpen(true);
  };

  // Sync Action
  const handleSyncNow = async () => {
    if (isOffline) {
      addToast({
        type: 'warning',
        title: 'Offline Mode Active',
        description: 'Cannot sync while in Offline Mode. Reconnect to internet or switch connection mode.',
      });
      return;
    }

    const res = await syncNow();
    if (res.success) {
      setTodaySubmissions((prev) =>
        prev.map((item) => ({ ...item, isSynced: true }))
      );
      addToast({
        type: 'success',
        title: 'Sync Completed: Server Confirmed',
        description: res.message,
      });
    } else {
      addToast({
        type: 'error',
        title: 'Sync Failed',
        description: res.message,
      });
    }
  };

  // Submit Fast Field Capture Form
  const handleSubmitFastCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStatement.trim()) return;

    setIsSubmittingCapture(true);
    const nowTime = `Today, ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
    const act = todayActivities.find((a) => a.id === selectedActivityForCapture);

    // Save in IndexedDB through useOffline
    await captureFieldUpdate({
      projectId: activeProject.id,
      activityId: selectedActivityForCapture,
      activityName: act ? act.name : 'Field Activity',
      quantity: quantityValue,
      unit: quantityUnit,
      date: '2026-09-18',
      discipline: act?.discipline || 'Piping',
      areaLine: act?.area || 'Unit A',
      remarks: customStatement.trim(),
      verificationState: 'Confirmed',
    });

    const newSubmission: TodaySubmission = {
      id: `SUB-TODAY-${Date.now().toString().slice(-4)}`,
      time: nowTime,
      activityId: selectedActivityForCapture,
      activityName: act ? act.name : 'Field Activity',
      statement: customStatement.trim(),
      quantity: `${quantityValue} ${quantityUnit}`,
      discipline: act?.discipline || 'Piping',
      area: act?.area || 'Unit A',
      status: !isOffline ? 'approved' : 'pending-review',
      isSynced: !isOffline,
      photoUrl: attachedPhotoName || undefined,
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
      type: isOffline ? 'warning' : 'success',
      title: isOffline ? 'Saved locally' : 'Server confirmed',
      description: isOffline
        ? 'Saved locally in IndexedDB queue. Updates will synchronize when online mode is restored.'
        : `Recorded ${quantityValue} ${quantityUnit} on ${selectedActivityForCapture}. Schedule Twin updated.`,
    });
  };

  const updatesRequiredCount = todayActivities.filter((a) => a.status !== 'completed').length;

  return (
    <StateWrapper>
      <div className="space-y-5 pb-20 md:pb-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-3.5 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-between gap-3 text-xs text-[#92400E]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#92400E] text-white font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                Updates will be synchronized when online mode is restored.
              </span>
            </div>
            <Link
              href="/sync"
              className="px-2.5 py-1 bg-white border border-[#FDE68A] rounded text-[#92400E] hover:bg-[#FDF6ED] font-mono font-bold text-[11px]"
            >
              {metrics.pendingUploads} Queued
            </Link>
          </div>
        )}

        {/* ========================================================= */}
        {/* TOP: Current User Greeting, Project, Date, Connection & Primary Actions */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* User Greeting & Status Indicator */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-[#172033]">
                  {greeting}, <strong className="text-[#176B87]">{currentUserName}</strong>
                </span>
                <span className="text-[#8A94A6] hidden sm:inline">•</span>
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                    effectiveStatus === 'OFFLINE'
                      ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
                      : 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveStatus === 'OFFLINE' ? 'bg-[#DC2626]' : 'bg-[#16A34A] animate-pulse'
                    }`}
                  />
                  <span>{effectiveStatus === 'OFFLINE' ? 'Offline' : 'Online'}</span>
                </div>
              </div>

              {/* Project & Date */}
              <h1 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
                {activeProject.name}
              </h1>

              <div className="flex items-center gap-2 text-xs text-[#596579] mt-1 flex-wrap">
                <span className="font-mono font-semibold text-[#172033]">
                  ID: {activeProject.code}
                </span>
                <span>•</span>
                <span>Date: <strong className="text-[#172033] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong></span>
                <span>•</span>
                <span>Field Question: <strong className="text-[#176B87]">What do I need to record today?</strong></span>
              </div>
            </div>

            {/* Top Primary & Secondary Action Buttons */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-start lg:self-center">
              {/* Primary: CAPTURE FIELD UPDATE */}
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityForCapture('PIP-24-002');
                  setIsCaptureModalOpen(true);
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#12546A] active:scale-98 rounded-lg shadow-xs transition-all inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ CAPTURE FIELD UPDATE</span>
              </button>

              {/* Secondary: OPEN DPR */}
              <Link
                href="/field/dpr"
                className="flex-1 sm:flex-initial px-4 py-2.5 text-xs sm:text-sm font-bold text-[#172033] bg-white hover:bg-[#F0F2F5] active:scale-98 border border-[#D9DEE5] rounded-lg transition-all inline-flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-[#596579]" />
                <span>OPEN DPR</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TODAY: Compact Metrics Strip */}
        {/* Activities Today | Updates Required | Draft DPR | Pending Sync */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. Activities Today */}
          <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold text-[#596579] block">Activities Today</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-[#172033]">{todayActivities.length}</span>
              <span className="text-[11px] text-[#596579]">assigned</span>
            </div>
          </div>

          {/* 2. Updates Required */}
          <div className="p-3 bg-white border border-[#F0D4A6] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold text-[#D98B32] block">Updates Required</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-[#D98B32]">{updatesRequiredCount}</span>
              <span className="text-[11px] text-[#596579]">awaiting logs</span>
            </div>
          </div>

          {/* 3. Draft DPR */}
          <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold text-[#596579] block">Draft DPR</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-[#176B87]">1</span>
              <span className="text-[11px] text-[#596579]">65% complete</span>
            </div>
          </div>

          {/* 4. Pending Sync */}
          <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold text-[#596579] block">Pending Sync</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-black font-mono text-[#172033]">{metrics.pendingUploads}</span>
              <span className="text-[11px] text-[#596579]">local queue</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MY ACTIVITIES */}
        {/* Columns: Activity, Area, Progress, Status, Last Update, Action */}
        {/* ========================================================= */}
        <section aria-labelledby="my-activities-heading" className="bg-white border border-[#D9DEE5] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] gap-2">
            <div>
              <h2 id="my-activities-heading" className="text-sm font-bold uppercase tracking-wider text-[#172033]">
                My Activities
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Work packages scheduled for site inspection, fit-up verification, and welding logging today.
              </p>
            </div>
            <span className="text-xs font-mono text-[#596579] self-start sm:self-center">
              Target: {todayActivities.length} Packages
            </span>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block border border-[#D9DEE5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[220px]">Activity</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Area</th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[150px]">Progress</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Last Update</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EBF0]">
                  {todayActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#F9FAFC] transition-colors">
                      {/* 1. Activity */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#176B87]">{act.id}</span>
                          <span className="font-semibold text-[#172033]">{act.name}</span>
                        </div>
                        <div className="text-[11px] text-[#596579] mt-0.5">
                          {act.discipline}
                        </div>
                      </td>

                      {/* 2. Area */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap text-[#596579]">
                        {act.area}
                      </td>

                      {/* 3. Progress */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-bold text-[#172033]">{act.actualProgress}%</span>
                            <span className="text-[#596579]">Target: {act.plannedProgress}%</span>
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

                      {/* 4. Status */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <StatusBadge status={act.status} size="sm" />
                      </td>

                      {/* 5. Last Update */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap font-mono text-[11px] text-[#596579]">
                        {act.lastUpdateText}
                      </td>

                      {/* 6. Action: Capture Update */}
                      <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCaptureForActivity(act.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#12546A] active:scale-95 rounded transition-all inline-flex items-center gap-1 shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Capture Update</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARD VIEW (Reach-friendly touch cards) */}
          <div className="space-y-3 md:hidden">
            {todayActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-lg border border-[#D9DEE5] bg-white space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#176B87]">{act.id}</span>
                    <h3 className="text-xs font-bold text-[#172033] leading-snug">{act.name}</h3>
                    <span className="text-[11px] text-[#596579]">{act.area}</span>
                  </div>
                  <StatusBadge status={act.status} size="sm" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="font-bold text-[#172033]">Progress: {act.actualProgress}%</span>
                    <span className="text-[#596579]">Target: {act.plannedProgress}%</span>
                  </div>
                  <ProgressBar
                    actual={act.actualProgress}
                    planned={act.plannedProgress}
                    size="sm"
                    status={act.status}
                    showLabels={false}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F0F2F5] text-xs">
                  <span className="text-[11px] font-mono text-[#8A94A6]">
                    Updated: {act.lastUpdateText}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCaptureForActivity(act.id)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-[#176B87] active:bg-[#12546A] rounded transition-colors inline-flex items-center gap-1 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Capture Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* FIELD UPDATES */}
        {/* Show recent updates. Keep details minimal. Click: View Details */}
        {/* ========================================================= */}
        <section aria-labelledby="field-updates-heading" className="bg-white border border-[#D9DEE5] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0]">
            <div>
              <h2 id="field-updates-heading" className="text-sm font-bold uppercase tracking-wider text-[#172033]">
                Field Updates
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Recent progress observations recorded on site.
              </p>
            </div>
            <span className="text-xs font-mono text-[#596579]">
              {todaySubmissions.length} Recorded
            </span>
          </div>

          <div className="divide-y divide-[#E8EBF0]">
            {todaySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#176B87]">{sub.activityId}</span>
                    <span className="font-semibold text-[#172033] truncate max-w-xs">{sub.activityName}</span>
                    <span className="text-[11px] text-[#8A94A6] font-mono">• {sub.time}</span>
                  </div>
                  <p className="text-[11px] text-[#596579] truncate max-w-xl">
                    &ldquo;{sub.statement}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-[#172033] font-bold">{sub.quantity}</span>
                    <span>•</span>
                    {sub.isSynced ? (
                      <span className="text-[#2E7D5B] font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Server confirmed
                      </span>
                    ) : (
                      <span className="text-[#D98B32] font-bold bg-[#FEF7EE] px-1.5 py-0.2 rounded border border-[#ECD1A4]">
                        Saved locally
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailUpdate(sub)}
                    className="px-2.5 py-1 text-xs font-medium text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* SYNC */}
        {/* Show: Online / Offline, Pending, Syncing, Failed */}
        {/* Strict Rule: Do not show large manager analytics. */}
        {/* ========================================================= */}
        <section aria-labelledby="sync-heading" className="bg-white border border-[#D9DEE5] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#E8EBF0] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#176B87]" />
                <h2 id="sync-heading" className="text-sm font-bold uppercase tracking-wider text-[#172033]">
                  Sync
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Local queue status and network transmission control.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || metrics.pendingUploads === 0}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#12546A] disabled:opacity-50 rounded transition-colors inline-flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            </div>
          </div>

          {/* 4 Compact Sync Status Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* 1. Online / Offline */}
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <span className="text-[11px] font-bold text-[#596579] block mb-1">Status</span>
              <span
                className={`text-sm font-mono font-bold block ${
                  effectiveStatus === 'OFFLINE' ? 'text-[#B5473C]' : 'text-[#2E7D5B]'
                }`}
              >
                {effectiveStatus === 'OFFLINE' ? 'Offline' : 'Online'}
              </span>
            </div>

            {/* 2. Pending */}
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <span className="text-[11px] font-bold text-[#596579] block mb-1">Pending</span>
              <span className="text-xl font-bold font-mono text-[#D98B32] block">
                {metrics.pendingUploads}
              </span>
            </div>

            {/* 3. Syncing */}
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <span className="text-[11px] font-bold text-[#596579] block mb-1">Syncing</span>
              <span className="text-xl font-bold font-mono text-[#176B87] block">
                {isSyncing ? '1 Active' : '0'}
              </span>
            </div>

            {/* 4. Failed */}
            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
              <span className="text-[11px] font-bold text-[#596579] block mb-1">Failed</span>
              <span className="text-xl font-bold font-mono text-[#172033] block">
                {metrics.failedCount}
              </span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* MOBILE STICKY BOTTOM ACTION BAR (One-Hand Reachable) */}
        {/* ========================================================= */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[#D9DEE5] md:hidden shadow-lg z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedActivityForCapture('PIP-24-002');
              setIsCaptureModalOpen(true);
            }}
            className="flex-1 py-3 px-4 text-xs font-bold text-white bg-[#176B87] active:bg-[#12546A] rounded-lg shadow-sm flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ CAPTURE UPDATE</span>
          </button>
          <Link
            href="/field/dpr"
            className="py-3 px-4 text-xs font-bold text-[#172033] bg-[#F7F8FA] border border-[#D9DEE5] active:bg-[#E8EBF0] rounded-lg flex items-center justify-center gap-1"
          >
            <FileText className="w-4 h-4 text-[#596579]" />
            <span>DPR</span>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* FAST FIELD CAPTURE MODAL */}
        {/* ========================================================= */}
        <Modal
          isOpen={isCaptureModalOpen}
          onClose={() => setIsCaptureModalOpen(false)}
          title="Capture Field Progress Update"
          subtitle="Record site observations quickly. Saves locally to IndexedDB if offline."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-[#596579] font-mono">
                {isOffline ? 'Offline mode: saving locally' : 'Online mode'}
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
                  className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#12546A] rounded transition-all inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50"
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
            {/* Target Activity */}
            <div>
              <label className="block text-xs font-bold text-[#172033] mb-1">
                Target Scheduled Activity <span className="text-[#B5473C]">*</span>
              </label>
              <select
                value={selectedActivityForCapture}
                onChange={(e) => {
                  setSelectedActivityForCapture(e.target.value);
                  const act = todayActivities.find((a) => a.id === e.target.value);
                  if (act) setQuantityUnit(act.unit || 'joints');
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

            {/* Quick Observation Chips */}
            <div>
              <label className="block text-[11px] font-bold text-[#596579] mb-1.5">
                Quick Observation Chips (Tap to Insert):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Welding completed 4 joints on Header 24-XX.',
                  'Root pass done with TIG; NDT scheduled tonight.',
                  'Rigging & crane hoisting finished without incident.',
                  'De-shuttering finished; curing compound applied.',
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

            {/* Field Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#172033]">
                  Field Statement / Site Observation <span className="text-[#B5473C]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setCustomStatement(
                      'Line 24-XX field butt welding completed 4 joints today on Header Unit A. Pre-heating checked at 120°C.'
                    );
                    addToast({
                      type: 'info',
                      title: 'Voice Note Transcribed',
                      description: 'Simulated voice memo parsed into statement.',
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
                  Quantity Completed
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
                  Unit
                </label>
                <input
                  type="text"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-2.5 py-1 text-xs bg-white border border-[#D9DEE5] rounded font-mono"
                />
              </div>
            </div>

            {/* Photo Attachment */}
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
                  setAttachedPhotoName('IMG_20260918_WELD_09.jpg (27.348° N, 95.313° E)');
                  addToast({
                    type: 'success',
                    title: 'GPS Photo Attached',
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

        {/* ========================================================= */}
        {/* VIEW DETAILS MODAL FOR FIELD UPDATE */}
        {/* ========================================================= */}
        {selectedDetailUpdate && (
          <Modal
            isOpen={!!selectedDetailUpdate}
            onClose={() => setSelectedDetailUpdate(null)}
            title={`Field Update: ${selectedDetailUpdate.id}`}
            subtitle={`${selectedDetailUpdate.activityId} • ${selectedDetailUpdate.time}`}
            maxWidth="md"
            footer={
              <button
                type="button"
                onClick={() => setSelectedDetailUpdate(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#12546A] rounded shadow-xs ml-auto"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                <span className="text-[10px] font-mono font-bold text-[#8A94A6] uppercase block">
                  Activity Target
                </span>
                <span className="font-mono font-bold text-[#176B87] block mt-0.5">
                  {selectedDetailUpdate.activityId}
                </span>
                <p className="font-semibold text-[#172033] mt-0.5">
                  {selectedDetailUpdate.activityName}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#8A94A6] uppercase block">
                  Field Statement
                </span>
                <p className="text-xs text-[#172033] italic leading-relaxed">
                  &ldquo;{selectedDetailUpdate.statement}&rdquo;
                </p>
                <div className="pt-2 border-t border-[#E8EBF0] flex items-center justify-between text-[11px]">
                  <span className="text-[#596579]">Quantity: <strong className="text-[#172033]">{selectedDetailUpdate.quantity}</strong></span>
                  <span className="text-[#596579]">Discipline: <strong className="text-[#172033]">{selectedDetailUpdate.discipline}</strong></span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between text-xs">
                <span className="text-[#596579]">Sync Status:</span>
                {selectedDetailUpdate.isSynced ? (
                  <span className="text-[#2E7D5B] font-bold font-mono">Server confirmed</span>
                ) : (
                  <span className="text-[#D98B32] font-bold font-mono">Saved locally (IndexedDB)</span>
                )}
              </div>

              {selectedDetailUpdate.photoUrl && (
                <div className="p-2.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded text-xs text-[#2E7D5B] flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span>Attached Photo: <strong>{selectedDetailUpdate.photoUrl}</strong></span>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
