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
  Users,
  Wrench,
  ShieldCheck,
  MapPin,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ExternalLink,
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

export interface PendingVerificationItem {
  id: string;
  activityId: string;
  activityName: string;
  item: string;
  submittedAt: string;
  assignedReviewer: string;
  reviewerRole: string;
  status: 'Pending Review' | 'Verified' | 'Under Review';
  notes: string;
}

export interface FieldEvidenceItem {
  id: string;
  title: string;
  activityId: string;
  activityName: string;
  type: 'photo' | 'report' | 'cert';
  fileName: string;
  gps: string;
  timestamp: string;
  verified: boolean;
  notes: string;
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

  // Selected Evidence Modal
  const [selectedEvidence, setSelectedEvidence] = useState<FieldEvidenceItem | null>(null);

  // Filter for Today's Activities
  const [activityFilter, setActivityFilter] = useState<'all' | 'needs-update' | 'completed'>('all');

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

  // Today's Submissions Log (Execution Events)
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

  // Pending Verification Items (Awaiting QC / Lead Sign-off)
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerificationItem[]>([
    {
      id: 'VER-0918-01',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      item: 'Field Butt Joints #05 to #08 (4 Joints)',
      submittedAt: 'Today, 14:15',
      assignedReviewer: 'R. K. Sharma',
      reviewerRole: 'NDT / QC Level II Inspector',
      status: 'Pending Review',
      notes: 'Visual inspection complete. Awaiting tonight\'s Radiographic Testing (RT) stamp.',
    },
    {
      id: 'VER-0918-02',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      item: 'Skid Footing Rough Alignment & Cold Shimming',
      submittedAt: 'Today, 12:10',
      assignedReviewer: 'V. Verma',
      reviewerRole: 'Lead Mechanical Planner',
      status: 'Under Review',
      notes: 'OEM technician co-signature uploaded. Dial gauge runout report attached.',
    },
    {
      id: 'VER-0918-03',
      activityId: 'CIV-11-001',
      activityName: 'Foundation Block A - Pedestal',
      item: 'Compressor Pedestal 7-Day Concrete Cube Strength',
      submittedAt: 'Today, 09:45',
      assignedReviewer: 'S. Patgiri',
      reviewerRole: 'Civil Quality Lead',
      status: 'Verified',
      notes: 'Verified 35.2 N/mm² against 30 N/mm² specified minimum. De-shuttering approved.',
    },
  ]);

  // Field Evidence Items (Photos, Geotagged Records, NDT Sheets)
  const [fieldEvidence, setFieldEvidence] = useState<FieldEvidenceItem[]>([
    {
      id: 'EVD-01',
      title: 'Joint #08 Root Pass & Visual Inspection',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      type: 'photo',
      fileName: 'IMG_LINE24_WELD_08.jpg',
      gps: '27.348° N, 95.313° E',
      timestamp: 'Today, 14:15 IST',
      verified: false,
      notes: 'TIG root pass inspection on 12-inch schedule 80 carbon steel header.',
    },
    {
      id: 'EVD-02',
      title: 'Compressor Skid Base Footing Dial Indicator',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      type: 'photo',
      fileName: 'IMG_MEC_SKID_ALIGN.jpg',
      gps: '27.349° N, 95.312° E',
      timestamp: 'Today, 12:10 IST',
      verified: true,
      notes: 'Laser alignment reading with OEM representative witness.',
    },
    {
      id: 'EVD-03',
      title: 'Pedestal 7-Day Cube Strength Test Certificate',
      activityId: 'CIV-11-001',
      activityName: 'Foundation Block A - Pedestal',
      type: 'cert',
      fileName: 'CIV_PED_CUBE_35MPA.pdf',
      gps: '27.347° N, 95.314° E',
      timestamp: 'Today, 09:45 IST',
      verified: true,
      notes: 'Civil test lab certificate. Average strength 35.2 MPa at 7 days.',
    },
    {
      id: 'EVD-04',
      title: 'Overhead Cable Tray Tier 1 Bracket Inspection',
      activityId: 'ELE-11-032',
      activityName: 'Cable Tray Installation - Substation to Bay',
      type: 'photo',
      fileName: 'IMG_ELE_TRAY_BRACKET.jpg',
      gps: '27.350° N, 95.315° E',
      timestamp: 'Yesterday, 17:00 IST',
      verified: true,
      notes: 'Galvanized support brackets bolted to structural bay columns.',
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
        description: 'Cannot sync while in Offline Mode. Switch to online mode in the header to transmit local queue.',
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
  const handleSubmitFastCapture = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
      verificationState: isOffline ? 'Queued' : 'Confirmed',
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

    // Add to pending verifications if newly captured
    const newVer: PendingVerificationItem = {
      id: `VER-${Date.now().toString().slice(-4)}`,
      activityId: selectedActivityForCapture,
      activityName: act ? act.name : 'Field Activity',
      item: `${quantityValue} ${quantityUnit} — ${customStatement.slice(0, 40)}...`,
      submittedAt: nowTime,
      assignedReviewer: 'R. K. Sharma',
      reviewerRole: 'Field QC Inspector',
      status: 'Pending Review',
      notes: isOffline ? 'Saved locally in IndexedDB queue. Awaiting sync.' : 'Transmitted to server. Awaiting inspection sign-off.',
    };
    setPendingVerifications((prev) => [newVer, ...prev]);

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

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === 'needs-update') {
      return todayActivities.filter((a) => a.status !== 'completed');
    }
    if (activityFilter === 'completed') {
      return todayActivities.filter((a) => a.status === 'completed');
    }
    return todayActivities;
  }, [todayActivities, activityFilter]);

  const completedActivitiesCount = todayActivities.filter((a) => a.status === 'completed').length;
  const updatesRequiredCount = todayActivities.filter((a) => a.status !== 'completed').length;

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-10 max-w-7xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-3.5 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-between gap-3 text-xs text-[#D98B32]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#D98B32] text-white font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                You are working offline. Site logs and photos are saved safely in your browser.
              </span>
            </div>
            <Link
              href="/sync"
              className="px-2.5 py-1 bg-white border border-[#F0D4A6] rounded text-[#D98B32] hover:bg-[#FDF6ED] font-mono font-bold text-[11px] whitespace-nowrap"
            >
              {metrics.pendingUploads} Queued for Sync
            </Link>
          </div>
        )}

        {/* ========================================================= */}
        {/* HEADER & PRACTICAL FIELD CONTEXT */}
        {/* Site Engineer Greeting, Shift, Location & Primary Action Triggers */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* Engineer identity & connection indicator */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-[#172033]">
                  {greeting}, <strong className="text-[#176B87]">{currentUserName}</strong>
                </span>
                <span className="text-[#7B8798] hidden sm:inline">•</span>
                <span className="text-xs font-semibold text-[#596579]">
                  Site Piping & Field Engineer
                </span>
                <span className="text-[#7B8798] hidden sm:inline">•</span>
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                    effectiveStatus === 'OFFLINE'
                      ? 'bg-[#FBEFEE] border-[#E4B0AA] text-[#B5473C]'
                      : 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveStatus === 'OFFLINE' ? 'bg-[#B5473C]' : 'bg-[#2E7D5B]'
                    }`}
                  />
                  <span>{effectiveStatus === 'OFFLINE' ? 'Offline' : 'Online'}</span>
                </div>
              </div>

              {/* Project title */}
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                {activeProject.name}
              </h1>

              {/* Practical site context */}
              <div className="flex items-center gap-3 text-xs text-[#596579] mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#176B87]" />
                  <span>Area: <strong className="text-[#172033]">Unit A & Compressor Bay</strong></span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#596579]" />
                  <span>Shift: <strong className="text-[#172033]">Shift A (07:00–16:00)</strong></span>
                </span>
                <span>•</span>
                <span>Date: <strong className="text-[#172033] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong></span>
              </div>
            </div>

            {/* Fast Action Buttons (Touch-friendly >= 44px) */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-start lg:self-center">
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityForCapture('PIP-24-002');
                  setIsCaptureModalOpen(true);
                }}
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:scale-98 rounded-lg shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>CAPTURE UPDATE</span>
              </button>

              <Link
                href="/field/dpr"
                className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2.5 text-xs sm:text-sm font-bold text-[#172033] bg-white hover:bg-[#F1F3F5] active:scale-98 border border-[#D9DEE5] rounded-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#596579]" />
                <span>CONTINUE DPR</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PRACTICAL ACTION STRIP (NO EXECUTIVE METRICS) */}
        {/* Quick ground-level summary for the site engineer's shift */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Today's Assigned Packages */}
          <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
              Assigned Packages
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-[#172033]">
                {todayActivities.length}
              </span>
              <span className="text-xs text-[#596579]">
                ({completedActivitiesCount} done, {updatesRequiredCount} active)
              </span>
            </div>
          </div>

          {/* 2. Updates Needed */}
          <div className="p-3.5 bg-white border border-[#F0D4A6] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#D98B32] block">
              Updates Awaiting Log
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-[#D98B32]">
                {updatesRequiredCount}
              </span>
              <span className="text-xs text-[#596579]">activities today</span>
            </div>
          </div>

          {/* 3. Daily Shift DPR */}
          <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B87] block">
              Daily Report Status
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-[#176B87]">
                65%
              </span>
              <span className="text-xs text-[#596579]">Draft in progress</span>
            </div>
          </div>

          {/* 4. Verification Queue */}
          <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg shadow-2xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579] block">
              Pending QC Stamp
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black font-mono text-[#172033]">
                {pendingVerifications.filter((v) => v.status !== 'Verified').length}
              </span>
              <span className="text-xs text-[#596579]">items awaiting check</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. TODAY'S WORK (ASSIGNED ACTIVITIES) */}
        {/* Highest priority: Tactical cards/list with planned vs actual, */}
        {/* status, area, discipline, and direct capture triggers */}
        {/* ========================================================= */}
        <section aria-labelledby="todays-work-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HardHat className="w-5 h-5 text-[#176B87]" />
                <h2 id="todays-work-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Today&apos;s Work
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Work packages scheduled for site inspection, fit-up verification, and welding logging today.
              </p>
            </div>

            {/* Practical filter pills */}
            <div className="flex items-center gap-1.5 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setActivityFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  activityFilter === 'all'
                    ? 'bg-[#176B87] text-white'
                    : 'bg-[#F1F3F5] text-[#596579] hover:bg-[#E5E9EE]'
                }`}
              >
                All ({todayActivities.length})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('needs-update')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  activityFilter === 'needs-update'
                    ? 'bg-[#D98B32] text-white'
                    : 'bg-[#F1F3F5] text-[#596579] hover:bg-[#E5E9EE]'
                }`}
              >
                Needs Update ({updatesRequiredCount})
              </button>
              <button
                type="button"
                onClick={() => setActivityFilter('completed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded ${
                  activityFilter === 'completed'
                    ? 'bg-[#2E7D5B] text-white'
                    : 'bg-[#F1F3F5] text-[#596579] hover:bg-[#E5E9EE]'
                }`}
              >
                Done ({completedActivitiesCount})
              </button>
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block border border-[#D9DEE5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[#596579] font-medium">
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[220px]">Activity Package</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Area / Bay</th>
                    <th className="py-3 px-3.5 whitespace-nowrap min-w-[160px]">Progress (Actual vs Target)</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Status</th>
                    <th className="py-3 px-3.5 whitespace-nowrap">Last Observation</th>
                    <th className="py-3 px-3.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {filteredActivities.map((act) => (
                    <tr key={act.id} className="hover:bg-[#F9FAFC] transition-colors">
                      {/* Activity */}
                      <td className="py-3 px-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#176B87]">{act.id}</span>
                          <span className="font-semibold text-[#172033]">{act.name}</span>
                        </div>
                        <div className="text-[11px] text-[#596579] mt-0.5">
                          Discipline: <strong className="text-[#172033]">{act.discipline}</strong>
                        </div>
                      </td>

                      {/* Area */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap text-[#596579]">
                        {act.area}
                      </td>

                      {/* Progress */}
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

                      {/* Status */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                        <StatusBadge status={act.status} size="sm" />
                      </td>

                      {/* Last Update */}
                      <td className="py-3 px-3.5 align-middle whitespace-nowrap font-mono text-[11px] text-[#596579]">
                        {act.lastUpdateText}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCaptureForActivity(act.id)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:scale-95 rounded transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
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
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-lg border border-[#D9DEE5] bg-white space-y-2.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#176B87]">{act.id}</span>
                    <h3 className="text-xs font-bold text-[#172033] leading-snug">{act.name}</h3>
                    <span className="text-[11px] text-[#596579]">{act.area} • {act.discipline}</span>
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

                <div className="flex items-center justify-between pt-2 border-t border-[#F1F3F5] text-xs">
                  <span className="text-[11px] font-mono text-[#7B8798]">
                    Last: {act.lastUpdateText}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenCaptureForActivity(act.id)}
                    className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Capture Update</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. FIELD CAPTURE (PRACTICAL FAST INPUT) */}
        {/* Direct on-page fast logger with voice note & photo triggers */}
        {/* ========================================================= */}
        <section aria-labelledby="field-capture-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#176B87]" />
                <h2 id="field-capture-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Field Capture
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Fast site entry. Dictate or tap quick observation chips to record actual progress on site.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/field/capture"
                className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Full Capture Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Quick inline capture form */}
          <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3.5 sm:p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Activity selector */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Target Activity
                </label>
                <select
                  value={selectedActivityForCapture}
                  onChange={(e) => {
                    setSelectedActivityForCapture(e.target.value);
                    const act = todayActivities.find((a) => a.id === e.target.value);
                    if (act) setQuantityUnit(act.unit || 'joints');
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded font-medium text-[#172033] outline-none"
                >
                  {todayActivities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.id} — {act.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Stepper */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Quantity Completed
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantityValue(Math.max(1, quantityValue - 1))}
                    className="min-h-[38px] w-10 bg-white border border-[#D9DEE5] hover:bg-[#E5E9EE] rounded text-sm font-bold flex items-center justify-center text-[#172033] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantityValue}
                    onChange={(e) => setQuantityValue(Number(e.target.value))}
                    className="w-16 min-h-[38px] text-center font-mono font-bold text-sm bg-white border border-[#D9DEE5] rounded py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantityValue(quantityValue + 1)}
                    className="min-h-[38px] w-10 bg-white border border-[#D9DEE5] hover:bg-[#E5E9EE] rounded text-sm font-bold flex items-center justify-center text-[#172033] cursor-pointer"
                  >
                    +
                  </button>
                  <input
                    type="text"
                    value={quantityUnit}
                    onChange={(e) => setQuantityUnit(e.target.value)}
                    placeholder="unit"
                    className="w-20 min-h-[38px] px-2 text-xs bg-white border border-[#D9DEE5] rounded font-mono"
                  />
                </div>
              </div>

              {/* Media actions */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1">
                  Site Evidence
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedPhotoName('IMG_20260918_WELD_09.jpg (27.348° N, 95.313° E)');
                      addToast({
                        type: 'success',
                        title: 'GPS Photo Attached',
                        description: 'Embedded site coordinates: 27.348° N, 95.313° E',
                      });
                    }}
                    className={`flex-1 min-h-[38px] px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer ${
                      attachedPhotoName
                        ? 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                        : 'bg-white border-[#D9DEE5] text-[#176B87] hover:bg-[#EDF5F8]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="truncate">{attachedPhotoName ? 'Photo Attached' : 'Attach Photo'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCustomStatement(
                        'Line 24-XX field butt welding completed 4 joints today on Header Unit A. Pre-heating checked at 120°C.'
                      );
                      addToast({
                        type: 'info',
                        title: 'Voice Note Transcribed',
                        description: 'Simulated voice memo parsed into observation.',
                      });
                    }}
                    className="min-h-[38px] px-2.5 py-1.5 text-xs font-semibold bg-white border border-[#D9DEE5] hover:bg-[#EDF5F8] text-[#176B87] rounded inline-flex items-center justify-center gap-1 cursor-pointer"
                    title="Simulate Voice Dictation"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Voice</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick observation chips */}
            <div>
              <span className="text-[11px] font-bold text-[#596579] block mb-1">
                Quick Observation Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Welding completed 4 joints on Header 24-XX.',
                  'Root pass done with TIG; preheat 120°C verified.',
                  'Laser rough alignment verified with OEM technician.',
                  'De-shuttering finished; curing compound applied.',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomStatement(chip)}
                    className="px-2 py-0.5 text-[11px] rounded bg-white hover:bg-[#EDF5F8] hover:text-[#176B87] text-[#596579] border border-[#D9DEE5] transition-colors cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Statement text area & submit */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5">
              <div className="flex-1">
                <input
                  type="text"
                  value={customStatement}
                  onChange={(e) => setCustomStatement(e.target.value)}
                  placeholder="Enter site observation, joint IDs, or inspection notes..."
                  className="w-full min-h-[44px] px-3 py-2 text-xs bg-white border border-[#D9DEE5] rounded focus:border-[#176B87] text-[#172033] outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleSubmitFastCapture()}
                disabled={isSubmittingCapture || !customStatement.trim()}
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] disabled:opacity-50 rounded-lg transition-all inline-flex items-center justify-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                {isSubmittingCapture ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Record Progress</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. DAILY PROGRESS REPORT (DPR / SHIFT DIARY) */}
        {/* Shift status, manpower count, equipment active, weather & draft actions */}
        {/* ========================================================= */}
        <section aria-labelledby="dpr-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#176B87]" />
                <h2 id="dpr-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Daily Progress Report (DPR)
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Shift log, trade manpower count, deployed equipment, and weather conditions.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/field/dpr"
                className="min-h-[38px] px-3.5 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue DPR Draft</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Shift Overview Bar */}
          <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-[#EDF5F8] text-[#176B87] font-mono font-bold text-[11px] border border-[#B3CBE0]">
                DPR-2026-09-18-A
              </span>
              <span className="font-semibold text-[#172033]">
                Shift A — Day Shift (07:00 – 16:00 IST)
              </span>
              <span className="text-[#7B8798]">•</span>
              <span className="text-[#596579]">
                Weather: <strong className="text-[#172033]">Clear • 28°C • Dry Ground</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-[#596579]">Draft Completion:</span>
              <span className="font-bold text-[#176B87]">65%</span>
              <span className="text-[#2E7D5B] font-bold bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#B8DCC9]">
                On Schedule
              </span>
            </div>
          </div>

          {/* Manpower & Equipment Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Manpower card */}
            <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#176B87]" />
                  <span>Trade Manpower</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#176B87]">18 Tradesmen</span>
              </div>
              <div className="text-[11px] text-[#596579] space-y-1 pt-1 border-t border-[#F1F3F5]">
                <div className="flex justify-between">
                  <span>6 Pipe Welders (TIG/SMAW)</span>
                  <span className="font-mono font-semibold text-[#172033]">100% Present</span>
                </div>
                <div className="flex justify-between">
                  <span>8 Heavy Riggers & Fitters</span>
                  <span className="font-mono font-semibold text-[#172033]">100% Present</span>
                </div>
                <div className="flex justify-between">
                  <span>4 General Field Helpers</span>
                  <span className="font-mono font-semibold text-[#172033]">100% Present</span>
                </div>
              </div>
            </div>

            {/* Equipment card */}
            <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-[#176B87]" />
                  <span>Equipment Active</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#176B87]">7 Units</span>
              </div>
              <div className="text-[11px] text-[#596579] space-y-1 pt-1 border-t border-[#F1F3F5]">
                <div className="flex justify-between">
                  <span>2 Mobile Cranes (50T & 80T)</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span>4 Welding Inverters (400A)</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Operational</span>
                </div>
                <div className="flex justify-between">
                  <span>1 Diesel Air Compressor</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Operational</span>
                </div>
              </div>
            </div>

            {/* Safety & Pre-Start card */}
            <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                  <span>HSE & Pre-Start</span>
                </span>
                <span className="text-xs font-mono font-bold text-[#2E7D5B]">0 Incidents</span>
              </div>
              <div className="text-[11px] text-[#596579] space-y-1 pt-1 border-t border-[#F1F3F5]">
                <div className="flex justify-between">
                  <span>Toolbox Talk @ 07:15</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span>Hot Work Permit (HWP-0918)</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Scaffolding Tag Status</span>
                  <span className="font-mono font-semibold text-[#2E7D5B]">Green Tagged</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. PENDING VERIFICATION (PENDING REVIEW) */}
        {/* Items submitted from site awaiting QC / Lead Inspector sign-off */}
        {/* ========================================================= */}
        <section aria-labelledby="pending-verification-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#176B87]" />
                <h2 id="pending-verification-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Pending Verification
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Site submissions awaiting quality stamp, NDT report, or supervisor sign-off before schedule twin credit.
              </p>
            </div>

            <span className="text-xs font-mono text-[#596579] self-start sm:self-center">
              {pendingVerifications.filter((v) => v.status !== 'Verified').length} Awaiting Sign-off
            </span>
          </div>

          <div className="divide-y divide-[#D9DEE5]">
            {pendingVerifications.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#176B87]">{item.activityId}</span>
                    <span className="font-bold text-[#172033]">{item.item}</span>
                    <span className="text-[11px] text-[#7B8798] font-mono">• {item.submittedAt}</span>
                  </div>
                  <p className="text-[11px] text-[#596579]">
                    {item.notes}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#596579] flex-wrap">
                    <span>Reviewer: <strong className="text-[#172033]">{item.assignedReviewer}</strong> ({item.reviewerRole})</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border ${
                      item.status === 'Verified'
                        ? 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                        : item.status === 'Under Review'
                        ? 'bg-[#EDF5F8] border-[#B3CBE0] text-[#176B87]'
                        : 'bg-[#FDF6ED] border-[#F0D4A6] text-[#D98B32]'
                    }`}
                  >
                    {item.status}
                  </span>

                  <Link
                    href="/review"
                    className="px-2.5 py-1 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Track</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 5. RECENT EXECUTION EVENTS (SITE EVENT LOG) */}
        {/* Chronological site observations, logs, and sync states */}
        {/* ========================================================= */}
        <section aria-labelledby="recent-events-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#176B87]" />
                <h2 id="recent-events-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Recent Execution Events
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Execution events and observations recorded from the field today.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || metrics.pendingUploads === 0}
                className="px-3 py-1.5 text-xs font-bold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] disabled:opacity-50 rounded transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `Sync Queue (${metrics.pendingUploads})`}</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#D9DEE5]">
            {todaySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#176B87]">{sub.activityId}</span>
                    <span className="font-semibold text-[#172033] truncate max-w-xs">{sub.activityName}</span>
                    <span className="text-[11px] text-[#7B8798] font-mono">• {sub.time}</span>
                  </div>
                  <p className="text-[11px] text-[#596579] truncate max-w-xl">
                    &ldquo;{sub.statement}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-[#172033] font-bold">{sub.quantity}</span>
                    <span>•</span>
                    <span className="text-[#596579]">{sub.discipline} ({sub.area})</span>
                    <span>•</span>
                    {sub.isSynced ? (
                      <span className="text-[#2E7D5B] font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Server confirmed
                      </span>
                    ) : (
                      <span className="text-[#D98B32] font-bold bg-[#FDF6ED] px-1.5 py-0.2 rounded border border-[#F0D4A6]">
                        Saved locally
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailUpdate(sub)}
                    className="px-2.5 py-1 text-xs font-medium text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
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
        {/* 6. EVIDENCE (GEOTAGGED PHOTOS & TEST CERTIFICATES) */}
        {/* Visual gallery grid of site photos and inspection proofs */}
        {/* ========================================================= */}
        <section aria-labelledby="evidence-heading" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9DEE5] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#176B87]" />
                <h2 id="evidence-heading" className="text-lg sm:text-xl font-bold uppercase tracking-wide text-[#172033]">
                  Field Evidence & Site Media
                </h2>
              </div>
              <p className="text-xs text-[#596579] mt-0.5">
                Geotagged site photography, weld visual inspection cards, and laboratory cube strength records.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/evidence"
                className="px-3 py-1.5 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Evidence Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {fieldEvidence.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] hover:border-[#176B87] rounded-lg transition-all cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#176B87] px-1.5 py-0.5 bg-white border border-[#D9DEE5] rounded">
                      {ev.activityId}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        ev.verified
                          ? 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                          : 'bg-[#FDF6ED] border-[#F0D4A6] text-[#D98B32]'
                      }`}
                    >
                      {ev.verified ? 'QC Verified' : 'QC Pending'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#172033] line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-[11px] text-[#596579] mt-0.5 line-clamp-2">
                    {ev.notes}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#D9DEE5] space-y-1 text-[10px] font-mono text-[#7B8798]">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{ev.fileName}</span>
                    <span className="text-[#176B87] font-semibold underline">Inspect</span>
                  </div>
                  <div className="flex items-center gap-1 text-[#596579]">
                    <MapPin className="w-3 h-3 text-[#176B87]" />
                    <span className="truncate">{ev.gps}</span>
                  </div>
                </div>
              </div>
            ))}
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
            className="flex-1 min-h-[44px] py-3 px-4 text-xs font-bold text-white bg-[#176B87] active:bg-[#135A72] rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CAPTURE UPDATE</span>
          </button>
          <Link
            href="/field/dpr"
            className="min-h-[44px] py-3 px-4 text-xs font-bold text-[#172033] bg-[#F7F8FA] border border-[#D9DEE5] active:bg-[#D9DEE5] rounded-lg flex items-center justify-center gap-1 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#596579]" />
            <span>DPR (65%)</span>
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
                  className="px-3.5 py-2 text-xs font-medium text-[#596579] hover:text-[#172033] border border-[#D9DEE5] rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFastCapture}
                  disabled={isSubmittingCapture || !customStatement.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded transition-all inline-flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
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
                    className="px-2.5 py-1 text-[11px] rounded bg-[#F1F3F5] hover:bg-[#EDF5F8] hover:text-[#176B87] text-[#596579] border border-[#D9DEE5] transition-colors text-left cursor-pointer"
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
                  className="text-[11px] text-[#176B87] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
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
                    className="w-7 h-7 bg-white border border-[#D9DEE5] hover:bg-[#D9DEE5] rounded text-sm font-bold flex items-center justify-center text-[#172033] cursor-pointer"
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
                    className="w-7 h-7 bg-white border border-[#D9DEE5] hover:bg-[#D9DEE5] rounded text-sm font-bold flex items-center justify-center text-[#172033] cursor-pointer"
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
            <div className="flex items-center justify-between p-2.5 bg-[#F1F3F5] border border-[#D9DEE5] rounded">
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
                className="px-2.5 py-1 text-[11px] font-semibold text-[#176B87] bg-white border border-[#D9DEE5] hover:bg-[#EDF5F8] rounded transition-colors cursor-pointer"
              >
                {attachedPhotoName ? 'Replace Photo' : 'Capture Photo'}
              </button>
            </div>
          </form>
        </Modal>

        {/* ========================================================= */}
        {/* VIEW DETAILS MODAL FOR EXECUTION EVENT */}
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
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded shadow-xs ml-auto cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                <span className="text-[10px] font-mono font-bold text-[#7B8798] uppercase block">
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
                <span className="text-[10px] font-mono font-bold text-[#7B8798] uppercase block">
                  Field Statement
                </span>
                <p className="text-xs text-[#172033] italic leading-relaxed">
                  &ldquo;{selectedDetailUpdate.statement}&rdquo;
                </p>
                <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-[11px]">
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

        {/* ========================================================= */}
        {/* VIEW DETAILS MODAL FOR FIELD EVIDENCE */}
        {/* ========================================================= */}
        {selectedEvidence && (
          <Modal
            isOpen={!!selectedEvidence}
            onClose={() => setSelectedEvidence(null)}
            title={`Evidence Record: ${selectedEvidence.fileName}`}
            subtitle={`${selectedEvidence.activityId} • ${selectedEvidence.timestamp}`}
            maxWidth="md"
            footer={
              <button
                type="button"
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded shadow-xs ml-auto cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                <span className="text-[10px] font-mono font-bold text-[#7B8798] uppercase block">
                  Subject & Target Activity
                </span>
                <span className="font-bold text-[#172033] text-sm block mt-0.5">
                  {selectedEvidence.title}
                </span>
                <p className="font-mono text-[#176B87] text-[11px] mt-0.5">
                  {selectedEvidence.activityId} — {selectedEvidence.activityName}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2">
                <span className="text-[10px] font-mono font-bold text-[#7B8798] uppercase block">
                  Inspection Notes & Geotag
                </span>
                <p className="text-xs text-[#172033] leading-relaxed">
                  {selectedEvidence.notes}
                </p>
                <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between text-[11px]">
                  <span className="text-[#596579]">GPS Tag: <strong className="font-mono text-[#172033]">{selectedEvidence.gps}</strong></span>
                  <span className="text-[#596579]">Type: <strong className="uppercase text-[#172033]">{selectedEvidence.type}</strong></span>
                </div>
              </div>

              <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between text-xs">
                <span className="text-[#596579]">QC Sign-off:</span>
                {selectedEvidence.verified ? (
                  <span className="text-[#2E7D5B] font-bold font-mono">QC Verified & Stamped</span>
                ) : (
                  <span className="text-[#D98B32] font-bold font-mono">Awaiting QC Stamp</span>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
