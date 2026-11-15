'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useOffline } from '../../context/OfflineContext';
import { usePreferences } from '../../context/PreferencesContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
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
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

export interface TodayActivityItem extends ScheduleActivity {
  lastUpdateText: string;
  priority: 'High' | 'Medium' | 'Normal';
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
  area: string;
  submittedAt: string;
  assignedReviewer: string;
  reviewerRole: string;
  confidence: number;
  status: 'Pending Review' | 'Verified';
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
  const { engineer } = usePreferences();
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
  const [selectedActivityForCapture, setSelectedActivityForCapture] = useState<string>(
    engineer.defaultWorkPackage || 'PIP-24-002'
  );
  const [customStatement, setCustomStatement] = useState('');
  const [quantityValue, setQuantityValue] = useState<number>(4);
  const [quantityUnit, setQuantityUnit] = useState<string>('joints');
  const [attachedPhotoName, setAttachedPhotoName] = useState<string | null>(null);
  const [isSubmittingCapture, setIsSubmittingCapture] = useState(false);

  // Ergonomic touch scale class (WCAG 2.2 AA compliant >= 44px, glove mode scales to >= 52px)
  const isGloveMode = engineer.touchTargetScale === 'glove';
  const touchBtnClass = isGloveMode ? 'min-h-[52px] py-3.5 px-5 text-sm' : 'min-h-[44px] py-2 px-4 text-xs sm:text-sm';

  // Detail Modal for Recent Updates
  const [selectedDetailUpdate, setSelectedDetailUpdate] = useState<TodaySubmission | null>(null);

  // Selected Evidence Modal
  const [selectedEvidence, setSelectedEvidence] = useState<FieldEvidenceItem | null>(null);

  // Filter for Today's Activities
  const [activityFilter, setActivityFilter] = useState<'all' | 'needs-update' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const currentUserName = userSession?.name || 'Debajit Borah';

  // Today's Assigned Activities for this Site Engineer (Anchored to 18 Sep 2026)
  const [todayActivities, setTodayActivities] = useState<TodayActivityItem[]>([
    {
      ...MOCK_ACTIVITIES[1], // PIP-24-001
      id: 'PIP-24-001',
      name: 'Install Spools — Line 24 (Erect High Pressure Header)',
      area: 'Unit A - Gas Processing',
      plannedStart: '2026-09-10',
      plannedFinish: '2026-09-15',
      actualProgress: 100,
      plannedProgress: 100,
      status: 'completed',
      delayDays: 0,
      priority: 'High',
      lastUpdateText: '18 Sep, 11:30 IST',
    },
    {
      ...MOCK_ACTIVITIES[2], // PIP-24-002
      id: 'PIP-24-002',
      name: 'Valve Installation & Field Welds (Line 24-XX)',
      area: 'Unit A - Gas Processing',
      plannedStart: '2026-09-16',
      plannedFinish: '2026-09-20',
      actualProgress: 70,
      plannedProgress: 85,
      status: 'delayed',
      delayDays: 2,
      priority: 'High',
      lastUpdateText: '18 Sep, 14:15 IST',
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
      priority: 'Normal',
      lastUpdateText: '18 Sep, 09:45 IST',
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
      priority: 'Medium',
      lastUpdateText: '18 Sep, 12:10 IST',
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
      priority: 'Medium',
      lastUpdateText: '17 Sep, 17:00 IST',
    },
    {
      ...MOCK_ACTIVITIES[3], // PIP-24-003
      id: 'PIP-24-003',
      name: 'Pressure Testing — Section Line 24-XX (150 bar)',
      area: 'Unit A - Gas Processing',
      plannedStart: '2026-09-19',
      plannedFinish: '2026-09-22',
      actualProgress: 0,
      plannedProgress: 0,
      status: 'pending',
      delayDays: 2,
      priority: 'High',
      lastUpdateText: 'Target 19 Sep 2026',
    },
  ]);

  // Today's Submissions Log (Execution Events)
  const [todaySubmissions, setTodaySubmissions] = useState<TodaySubmission[]>([
    {
      id: 'SUB-TODAY-00',
      time: '18 Sep, 13:40 IST',
      activityId: 'PIP-24-001',
      activityName: 'Install Spools — Line 24',
      statement: '12 spools installed on Line 24 header run. Alignment checked with spirit level.',
      quantity: '12 spools',
      discipline: 'Piping',
      area: 'Unit A',
      status: 'pending-review',
      isSynced: true,
      photoUrl: 'IMG_LINE24_SPOOLS_12.jpg',
    },
    {
      id: 'SUB-TODAY-01',
      time: '18 Sep, 14:15 IST',
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
      time: '18 Sep, 12:10 IST',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      statement: 'Valve installation started. Laser rough alignment verified with OEM technician.',
      quantity: '0.15 skid',
      discipline: 'Mechanical',
      area: 'Compressor House',
      status: 'approved',
      isSynced: true,
    },
    {
      id: 'SUB-TODAY-03',
      time: '18 Sep, 09:45 IST',
      activityId: 'CIV-11-001',
      activityName: 'Foundation Block A - Pedestal',
      statement: 'Foundation completed. De-shuttering finished and curing compound applied. Cube strength 35 N/mm² confirmed.',
      quantity: '45 m³',
      discipline: 'Civil',
      area: 'Compressor Bay',
      status: 'auto-linked',
      isSynced: true,
      photoUrl: 'IMG_CIV_PED_CURE.jpg',
    },
    {
      id: 'SUB-TODAY-04',
      time: '18 Sep, 15:50 IST',
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
      id: 'VER-0918-00',
      activityId: 'PIP-24-001',
      activityName: 'Install Spools — Line 24',
      item: '12 spools installed — Line 24',
      area: 'Unit A',
      submittedAt: '17 Sep, 18:00 IST',
      assignedReviewer: 'R. K. Sharma',
      reviewerRole: 'Piping Lead Inspector',
      confidence: 94,
      status: 'Verified',
      notes: 'Physical crane lifting tickets and spool alignment verified. Committed to Schedule Twin.',
    },
    {
      id: 'VER-0918-01',
      activityId: 'PIP-24-002',
      activityName: 'Weld Line 24-XX Field Joints',
      item: 'Field Butt Joints #05 to #08 (4 Joints)',
      area: 'Unit A',
      submittedAt: '18 Sep, 14:15 IST',
      assignedReviewer: 'R. K. Sharma',
      reviewerRole: 'NDT / QC Level II Inspector',
      confidence: 84,
      status: 'Pending Review',
      notes: 'Visual inspection complete. Awaiting tonight\'s Radiographic Testing (RT) stamp.',
    },
    {
      id: 'VER-0918-02',
      activityId: 'MEC-08-003',
      activityName: 'Align Centrifugal Gas Compressor Skid A',
      item: 'Skid Footing Rough Alignment & Cold Shimming',
      area: 'Compressor House',
      submittedAt: '18 Sep, 12:10 IST',
      assignedReviewer: 'V. Verma',
      reviewerRole: 'Lead Mechanical Planner',
      confidence: 92,
      status: 'Pending Review',
      notes: 'OEM technician co-signature uploaded. Dial gauge runout report attached.',
    },
    {
      id: 'VER-0918-03',
      activityId: 'CIV-11-001',
      activityName: 'Foundation Block A - Pedestal',
      item: 'Compressor Pedestal 7-Day Concrete Cube Strength',
      area: 'Compressor Bay',
      submittedAt: '18 Sep, 09:45 IST',
      assignedReviewer: 'S. Patgiri',
      reviewerRole: 'Civil Quality Lead',
      confidence: 98,
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
      timestamp: '18 Sep 2026, 14:15 IST',
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
      timestamp: '18 Sep 2026, 12:10 IST',
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
      timestamp: '18 Sep 2026, 09:45 IST',
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
      timestamp: '17 Sep 2026, 17:00 IST',
      verified: true,
      notes: 'Galvanized support brackets bolted to structural bay columns.',
    },
  ]);

  // Specific list filters so counters match visible records 1:1
  const [signoffFilter, setSignoffFilter] = useState<'pending' | 'all'>('pending');
  const [eventStreamFilter, setEventStreamFilter] = useState<'all' | 'queued' | 'synced'>('all');

  const filteredPendingVerifications = pendingVerifications.filter((v) => {
    if (signoffFilter === 'pending') return v.status !== 'Verified';
    return true;
  });

  const filteredTodaySubmissions = todaySubmissions.filter((sub) => {
    if (eventStreamFilter === 'queued') return !sub.isSynced;
    if (eventStreamFilter === 'synced') return sub.isSynced;
    return true;
  });

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
      area: act ? act.area : 'Unit A',
      submittedAt: nowTime,
      assignedReviewer: 'R. K. Sharma',
      reviewerRole: 'Field QC Inspector',
      confidence: 85,
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
    <StateWrapper
      loadingMessage="Loading engineer cockpit..."
      emptyTitle="No engineer tasks found in this view"
      emptyDescription="Daily site capture tasks and synchronization queues for your active project area will appear here. Select a different project or reset filters to view tasks."
    >
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-4 rounded-lg bg-[#F8EFDA] dark:bg-[#3D2808] border border-[#E5C185] dark:border-[#523712] flex items-center justify-between gap-3 text-xs text-[#825700] dark:text-[#F3B765] transition-colors">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#81500B] text-white font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                You are working offline. Updates will be synchronized when online mode is restored.
              </span>
            </div>
            <Link
              href="/sync"
              className="px-3 py-1 bg-white dark:bg-[#17221D] border border-[#E5C185] dark:border-[#523712] rounded text-[#825700] dark:text-[#F3B765] hover:bg-[#F8EFDA] dark:hover:bg-[#243832] font-mono font-bold text-[11px] whitespace-nowrap"
            >
              {metrics.pendingUploads} Queued for Sync
            </Link>
          </div>
        )}

        {/* ========================================================= */}
        {/* HEADER & PRACTICAL FIELD CONTEXT */}
        {/* Site Engineer Greeting, Shift, Location & Primary Action Triggers */}
        {/* ========================================================= */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              {/* Engineer identity & connection indicator */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                  {greeting}, <strong className="text-[#006B61] dark:text-[#72C6AD]">{currentUserName}</strong>
                </span>
                <span className="text-[#738A80] dark:text-[#859688] hidden sm:inline">•</span>
                {userSession?.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-semibold">
                    Admin Previewing Engineer Workspace
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#52665D] dark:text-[#B5C1B5]">
                    Site Field Construction Engineer
                  </span>
                )}
                <span className="text-[#738A80] dark:text-[#859688] hidden sm:inline">•</span>
                <div
                  className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-md text-[11px] font-mono font-bold border ${
                    effectiveStatus === 'OFFLINE'
                      ? 'bg-[#F6E4E1] dark:bg-[#3D1418] border-[#DCABA7] dark:border-[#5C2329] text-[#A43B36] dark:text-[#FF9E94]'
                      : 'bg-[#E4F1E9] dark:bg-[#0D3326] border-[#B7DAC3] dark:border-[#1E4D3A] text-[#1F6B4E] dark:text-[#4ADE80]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      effectiveStatus === 'OFFLINE' ? 'bg-[#92372F] dark:bg-[#F87171]' : 'bg-[#2E7D5B] dark:bg-[#4ADE80]'
                    }`}
                  />
                  <span>{effectiveStatus === 'OFFLINE' ? 'Offline (Local)' : 'Simulated Online (Sandbox)'}</span>
                </div>
              </div>

              {/* Project title */}
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                {activeProject.name}
              </h1>

              {/* Practical site context */}
              <div className="flex items-center gap-3 text-xs text-[#52665D] dark:text-[#B5C1B5] mt-2 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Area / Scope: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Unit A & Substation (Multi-Discipline Field Execution)</strong></span>
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#52665D] dark:text-[#B5C1B5]" />
                  <span>Shift: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">Shift A (Day)</strong></span>
                </span>
                <span>•</span>
                <span>Reporting Date: <strong className="text-[#1A2B25] dark:text-[#F2F4E9] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong></span>
              </div>
            </div>

            {/* Fast Action Buttons (Touch-friendly >= 44px, scaling to 52px in glove mode) */}
            <div className="flex items-center gap-2 self-stretch sm:self-start lg:self-center flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityForCapture('PIP-24-002');
                  setIsCaptureModalOpen(true);
                }}
                className={`flex-1 sm:flex-initial ${touchBtnClass} font-bold text-white bg-[#103F39] hover:bg-[#0C312C] dark:bg-[#72C6AD] dark:hover:bg-[#5a8f7b] dark:text-[#0B2822] active:scale-98 rounded-lg shadow-xs transition-all inline-flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>CAPTURE UPDATE</span>
              </button>

              <Link
                href="/messages"
                className={`flex-1 sm:flex-initial ${touchBtnClass} font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] active:scale-98 border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer`}
                title="Message Project Manager (Rajesh Sharma)"
              >
                <MessageSquare className="w-4 h-4 text-[#1A2B25] dark:text-[#72C6AD]" />
                <span>MESSAGES</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#F5EAD4] text-[#765216] dark:bg-[#352712] dark:text-[#E3B66A] text-[10px] font-bold">1</span>
              </Link>

              <Link
                href="/field/dpr"
                className={`flex-1 sm:flex-initial ${touchBtnClass} font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] active:scale-98 border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-all inline-flex items-center justify-center gap-2 cursor-pointer`}
              >
                <FileText className="w-4 h-4 text-[#566159] dark:text-[#B5C1B5]" />
                <span>CONTINUE DPR</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OPERATIONAL COUNTERS (FIELD TASK BOARD STATUS) */}
        {/* Real-time counters: Assigned Today, Pending Uploads, Awaiting Review, High Priority */}
        {/* ========================================================= */}
        <section aria-label="Operational status counters" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 sm:p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Assigned Today</span>
              <HardHat className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{todayActivities.length}</span>
              <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">packages</span>
            </div>
            <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] block mt-1">Direct site execution scope</span>
          </div>

          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 sm:p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Pending Uploads</span>
              <UploadCloud className="w-4 h-4 text-[#825700] dark:text-[#F3B765]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{metrics.pendingUploads}</span>
              <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">in queue</span>
            </div>
            <span className="text-[11px] text-[#825700] dark:text-[#F3B765] block mt-1">
              {isOffline ? 'Queued offline (IndexedDB)' : 'Ready for sync'}
            </span>
          </div>

          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 sm:p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Awaiting Review</span>
              <Clock className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#1A2B25] dark:text-[#F2F4E9]">
                {pendingVerifications.filter((v) => v.status !== 'Verified').length}
              </span>
              <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">items</span>
            </div>
            <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] block mt-1">Pending QC & lead stamp</span>
          </div>

          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-3 sm:p-4 shadow-2xs transition-colors">
            <div className="flex items-center justify-between text-xs text-[#52665D] dark:text-[#B5C1B5] mb-1">
              <span className="font-semibold uppercase tracking-wider text-[11px]">High Priority</span>
              <AlertCircle className="w-4 h-4 text-[#A43B36] dark:text-[#FF9E94]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#A43B36] dark:text-[#FF9E94]">
                {todayActivities.filter((a) => a.priority === 'High').length}
              </span>
              <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">critical</span>
            </div>
            <span className="text-[11px] text-[#A43B36] dark:text-[#FF9E94] font-medium block mt-1">Immediate fit-up / weld priority</span>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 1. TODAY'S WORK (ASSIGNED WORK PACKAGES) */}
        {/* Unified operational board with View Mode switcher (Cards vs Table) */}
        {/* ========================================================= */}
        <section aria-labelledby="todays-work-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] border-l-4 border-l-[#006B61] dark:border-l-[#72C6AD] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <HardHat className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <h2 id="todays-work-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                  Today&apos;s Work Assignments
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] text-xs font-mono font-bold">
                  {todayActivities.length} PACKAGES ASSIGNED
                </span>
              </div>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Work packages scheduled for site execution, fit-up verification, and welding logging today.
              </p>
            </div>

            {/* Filter pills and View Mode Switcher */}
            <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
              <div className="flex items-center gap-1 bg-[#EAF0E9] dark:bg-[#101815] p-1 rounded-md">
                <button
                  type="button"
                  onClick={() => setActivityFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    activityFilter === 'all'
                      ? 'bg-white dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] shadow-2xs'
                      : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                  }`}
                >
                  All ({todayActivities.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('needs-update')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    activityFilter === 'needs-update'
                      ? 'bg-[#81500B] text-white'
                      : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                  }`}
                >
                  Needs Update ({updatesRequiredCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter('completed')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    activityFilter === 'completed'
                      ? 'bg-[#2E7D5B] text-white'
                      : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                  }`}
                >
                  Done ({completedActivitiesCount})
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 border border-[#D9E2DA] dark:border-[#3A5146] p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    viewMode === 'cards'
                      ? 'bg-[#006B61] dark:bg-[#006B61] text-white'
                      : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-[#006B61] dark:bg-[#006B61] text-white'
                      : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* CARDS VIEW */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className={`p-4 rounded-lg border bg-white dark:bg-[#243832] transition-all shadow-2xs flex flex-col justify-between space-y-3 group ${
                    act.priority === 'High'
                      ? 'border-[#DCABA7] dark:border-[#5C2329] border-l-4 border-l-[#92372F] dark:border-l-[#F87171]'
                      : 'border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD]'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Bar: Activity ID, Priority & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#006B61] dark:text-[#72C6AD] px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146]">
                          {act.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${
                            act.priority === 'High'
                              ? 'bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94] border-[#DCABA7] dark:border-[#5C2329]'
                              : act.priority === 'Medium'
                              ? 'bg-[#F8EFDA] dark:bg-[#3D2808] text-[#825700] dark:text-[#F3B765] border-[#E5C185] dark:border-[#523712]'
                              : 'bg-[#EAF0E9] dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146]'
                          }`}
                        >
                          {act.priority} Priority
                        </span>
                      </div>
                      <StatusBadge status={act.status} size="sm" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xs sm:text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] leading-snug">
                      {act.name}
                    </h3>

                    {/* Operational Context: Area & Discipline */}
                    <div className="flex items-center gap-2 text-xs text-[#52665D] dark:text-[#B5C1B5] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#006B61] dark:text-[#72C6AD]" />
                        <span>{act.area}</span>
                      </span>
                      <span>•</span>
                      <span className="font-medium text-[#1A2B25] dark:text-[#F2F4E9]">{act.discipline}</span>
                    </div>

                    {/* Progress Bar with highlighted delta */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                          Progress: <strong className="text-[#006B61] dark:text-[#72C6AD]">{act.actualProgress}%</strong>
                        </span>
                        <span className={act.actualProgress < act.plannedProgress ? 'text-[#A43B36] dark:text-[#FF9E94] font-bold' : 'text-[#52665D] dark:text-[#B5C1B5]'}>
                          Target: {act.plannedProgress}% {act.actualProgress < act.plannedProgress ? '(Delayed)' : ''}
                        </span>
                      </div>
                      <ProgressBar
                        actual={act.actualProgress}
                        planned={act.plannedProgress}
                        size="sm"
                        status={act.status}
                        showLabels={false}
                      />
                    </div>
                  </div>

                  {/* Card Action & Last Update */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#EAF1F5] dark:border-[#3A5146] text-xs">
                    <span className="text-[11px] font-mono text-[#738A80] dark:text-[#859688]">
                      {act.lastUpdateText}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenCaptureForActivity(act.id)}
                      className={`min-h-[36px] px-3 py-1.5 text-xs font-bold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] active:scale-95 rounded-md transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Capture Update</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* COMPACT TABLE VIEW */
            <div className="overflow-x-auto border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
              <table className="w-full min-w-[700px] text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10 bg-[#F6F7F3] dark:bg-[#243832] border-b border-[#D9E2DA] dark:border-[#3A5146] text-[#52665D] dark:text-[#B5C1B5] font-semibold text-[11px] uppercase tracking-wider h-10">
                  <tr>
                    <th scope="col" className="py-2.5 px-3">Activity</th>
                    <th scope="col" className="py-2.5 px-3">Area</th>
                    <th scope="col" className="py-2.5 px-3">Status</th>
                    <th scope="col" className="py-2.5 px-3 min-w-[140px]">Progress</th>
                    <th scope="col" className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2DA]/60 dark:divide-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9]">
                  {filteredActivities.map((act) => (
                    <tr key={act.id} className="h-10 hover:bg-[#F9FAFC] dark:hover:bg-[#243832] transition-colors">
                      <td className="py-2.5 px-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">{act.id}</span>
                          <span className="text-[#1A2B25] dark:text-[#F2F4E9] font-semibold">{act.name}</span>
                          {act.priority === 'High' && (
                            <span className="text-[9px] font-mono font-bold px-1 rounded bg-[#F6E4E1] dark:bg-[#3D1418] text-[#A43B36] dark:text-[#FF9E94] border border-[#DCABA7] dark:border-[#5C2329]">
                              HIGH
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">{act.discipline}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[#52665D] dark:text-[#B5C1B5] whitespace-nowrap">{act.area}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <StatusBadge status={act.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{act.actualProgress}%</span>
                            <span className="text-[#52665D] dark:text-[#B5C1B5]">Target: {act.plannedProgress}%</span>
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
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenCaptureForActivity(act.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] rounded transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                          <span>Capture</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. QUICK ACTIONS */}
        {/* Highlighted primary actions */}
        {/* ========================================================= */}
        <section aria-labelledby="quick-actions-heading" className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 id="quick-actions-heading" className="text-xs font-semibold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] font-heading">
              Fast Field Actions
            </h2>
            <span className="text-[11px] text-[#738A80] dark:text-[#859688] font-mono">
              Direct execution capture
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Action 1: Capture Field Work */}
            <button
              type="button"
              onClick={() => {
                setSelectedActivityForCapture('PIP-24-002');
                setIsCaptureModalOpen(true);
              }}
              className="p-3.5 bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] border-2 border-[#006B61]/30 dark:border-[#72C6AD]/30 hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg shadow-2xs text-left transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] group-hover:bg-[#006B61] dark:group-hover:bg-[#006B61] text-[#006B61] dark:text-[#72C6AD] group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                <Plus className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                  Capture Field Work
                </span>
                <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] block truncate">
                  Record joints, spools, or fit-up
                </span>
              </div>
            </button>

            {/* Action 2: Create DPR */}
            <Link
              href="/field/dpr"
              className="p-3.5 bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#81500B] dark:hover:border-[#F3B765] rounded-lg shadow-2xs text-left transition-all flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F8EFDA] dark:bg-[#3D2808] group-hover:bg-[#81500B] text-[#825700] dark:text-[#F3B765] group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                    Create / Edit DPR
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F8EFDA] dark:bg-[#3D2808] text-[#825700] dark:text-[#F3B765] border border-[#E5C185] dark:border-[#523712]">
                    65% Draft
                  </span>
                </div>
                <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] block truncate">
                  Continue Shift A daily diary
                </span>
              </div>
            </Link>

            {/* Action 3: Add Evidence */}
            <button
              type="button"
              onClick={() => {
                setAttachedPhotoName('IMG_20260918_WELD_09.jpg (27.348° N, 95.313° E)');
                addToast({
                  type: 'success',
                  title: 'GPS Photo Attached',
                  description: 'Embedded site coordinates: 27.348° N, 95.313° E',
                });
                setSelectedActivityForCapture('PIP-24-002');
                setIsCaptureModalOpen(true);
              }}
              className="p-3.5 bg-white dark:bg-[#17221D] hover:bg-[#F9FAFC] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg shadow-2xs text-left transition-all flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] group-hover:bg-[#006B61] dark:group-hover:bg-[#006B61] text-[#52665D] dark:text-[#B5C1B5] group-hover:text-white flex items-center justify-center flex-shrink-0 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-sm font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                  Add Site Evidence
                </span>
                <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] block truncate">
                  Attach geotagged photo or certificate
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. PENDING VERIFICATION */}
        {/* Highlighted items awaiting inspection sign-off */}
        {/* ========================================================= */}
        <section aria-labelledby="pending-verification-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] border-l-4 border-l-[#81500B] dark:border-l-[#F3B765] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#825700] dark:text-[#F3B765]" />
                <h2 id="pending-verification-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                  Pending Verification &amp; Inspection Sign-off
                </h2>
              </div>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Site submissions awaiting quality stamp, NDT report, or supervisor sign-off before schedule twin credit.
              </p>
            </div>

            {/* Filter Tabs matching count to visible list */}
            <div className="flex items-center gap-1.5 p-1 bg-[#F6F7F3] dark:bg-[#243832] rounded-lg border border-[#D9E2DA] dark:border-[#3A5146]">
              <button
                type="button"
                onClick={() => setSignoffFilter('pending')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  signoffFilter === 'pending'
                    ? 'bg-white dark:bg-[#17221D] text-[#825700] dark:text-[#F3B765] shadow-xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
              >
                Awaiting Sign-off ({pendingVerifications.filter((v) => v.status !== 'Verified').length})
              </button>
              <button
                type="button"
                onClick={() => setSignoffFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  signoffFilter === 'all'
                    ? 'bg-white dark:bg-[#17221D] text-[#006B61] dark:text-[#72C6AD] shadow-xs'
                    : 'text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9]'
                }`}
              >
                All Submissions ({pendingVerifications.length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
            {filteredPendingVerifications.map((item) => (
              <div
                key={item.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9]">{item.item}</span>
                    <span className="text-[#738A80] dark:text-[#859688] font-mono">•</span>
                    <span className="text-xs text-[#52665D] dark:text-[#B5C1B5]">
                      Suggested: <strong className="font-mono text-[#006B61] dark:text-[#72C6AD]">{item.activityId}</strong>
                    </span>
                    <span className="text-[11px] text-[#738A80] dark:text-[#859688] font-mono">• {item.submittedAt}</span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5]">
                    {item.notes}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-[#52665D] dark:text-[#B5C1B5] flex-wrap">
                    <span>Reviewer: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{item.assignedReviewer}</strong> ({item.reviewerRole})</span>
                    <span>• Area: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{item.area}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
                  <ConfidenceBadge score={item.confidence} size="sm" />
                  <StatusBadge status={item.status} size="xs" />

                  <Link
                    href={`/review?activityId=${item.activityId}`}
                    className="px-3 py-1 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Review</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. RECENT EXECUTION EVENTS (SITE EVENT LOG) */}
        {/* Chronological site observations, logs, and sync states */}
        {/* ========================================================= */}
        <section aria-labelledby="recent-events-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <h2 id="recent-events-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                  Recent Execution Log &amp; Observations
                </h2>
              </div>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Execution events recorded from the field today ({todaySubmissions.length} total · {metrics.pendingUploads} queued locally for sync).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Queue Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#F6F7F3] dark:bg-[#243832] rounded-lg border border-[#D9E2DA] dark:border-[#3A5146]">
                <button
                  type="button"
                  onClick={() => setEventStreamFilter('all')}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    eventStreamFilter === 'all'
                      ? 'bg-white dark:bg-[#17221D] text-[#006B61] dark:text-[#72C6AD] shadow-xs'
                      : 'text-[#52665D] dark:text-[#B5C1B5]'
                  }`}
                >
                  All Today ({todaySubmissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventStreamFilter('queued')}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    eventStreamFilter === 'queued'
                      ? 'bg-white dark:bg-[#17221D] text-[#825700] dark:text-[#F3BA63] shadow-xs'
                      : 'text-[#52665D] dark:text-[#B5C1B5]'
                  }`}
                >
                  Queued ({todaySubmissions.filter((s) => !s.isSynced).length})
                </button>
                <button
                  type="button"
                  onClick={() => setEventStreamFilter('synced')}
                  className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                    eventStreamFilter === 'synced'
                      ? 'bg-white dark:bg-[#17221D] text-[#1F6B4E] dark:text-[#4ADE80] shadow-xs'
                      : 'text-[#52665D] dark:text-[#B5C1B5]'
                  }`}
                >
                  Confirmed ({todaySubmissions.filter((s) => s.isSynced).length})
                </button>
              </div>

              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || metrics.pendingUploads === 0}
                className="px-3 py-1.5 text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#1f3049] disabled:opacity-50 rounded transition-colors inline-flex items-center gap-2 shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : `Sync ${metrics.pendingUploads} Queued`}</span>
              </button>
            </div>
          </div>

          <div className="divide-y divide-[#D9E2DA] dark:divide-[#3A5146]">
            {filteredTodaySubmissions.map((sub) => (
              <div
                key={sub.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">{sub.activityId}</span>
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] truncate max-w-xs">{sub.activityName}</span>
                    <span className="text-[11px] text-[#738A80] dark:text-[#859688] font-mono">• {sub.time}</span>
                  </div>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] truncate max-w-xl">
                    &ldquo;{sub.statement}&rdquo;
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-[#1A2B25] dark:text-[#F2F4E9] font-bold">{sub.quantity}</span>
                    <span>•</span>
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">{sub.discipline} ({sub.area})</span>
                    <span>•</span>
                    {sub.isSynced ? (
                      <span className="text-[#1F6B4E] dark:text-[#4ADE80] font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Server confirmed
                      </span>
                    ) : (
                      <span className="text-[#825700] dark:text-[#F3B765] font-bold bg-[#F8EFDA] dark:bg-[#3D2808] px-1.5 py-0.5 rounded border border-[#E5C185] dark:border-[#523712]">
                        Saved locally
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailUpdate(sub)}
                    className="px-3 py-1 text-xs font-medium text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
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
        {/* 5. EVIDENCE (GEOTAGGED PHOTOS & TEST CERTIFICATES) */}
        {/* Visual gallery grid of site photos and inspection proofs */}
        {/* ========================================================= */}
        <section aria-labelledby="evidence-heading" className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#D9E2DA] dark:border-[#3A5146] gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <h2 id="evidence-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                  Field Evidence & Site Media
                </h2>
              </div>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Geotagged site photography, weld inspection cards, and test records.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <Link
                href="/evidence"
                className="px-3 py-1.5 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Evidence Vault</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fieldEvidence.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvidence(ev)}
                className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] hover:border-[#006B61] dark:hover:border-[#72C6AD] rounded-lg transition-all cursor-pointer space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-bold text-[#006B61] dark:text-[#72C6AD] px-1.5 py-0.5 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded">
                      {ev.activityId}
                    </span>
                    <StatusBadge status={ev.verified ? 'Verified' : 'Pending Review'} size="xs" />
                  </div>

                  <h3 className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] line-clamp-1">
                    {ev.title}
                  </h3>
                  <p className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] mt-0.5 line-clamp-2">
                    {ev.notes}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-1 text-[10px] font-mono text-[#738A80] dark:text-[#859688]">
                  <div className="flex items-center justify-between">
                    <span className="truncate">{ev.fileName}</span>
                    <span className="text-[#006B61] dark:text-[#72C6AD] font-semibold underline">Inspect</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[#52665D] dark:text-[#B5C1B5]">
                    <span className="truncate inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#006B61] dark:text-[#72C6AD]" />
                      <span>{ev.gps}</span>
                    </span>
                    <span className="text-[#1A2B25] dark:text-[#F2F4E9] font-medium whitespace-nowrap">{ev.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 6. DAILY PROGRESS & SHIFT SUMMARY (Expandable Shift Context) */}
        {/* ========================================================= */}
        <details className="group bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs space-y-4 transition-colors">
          <summary className="flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer list-none select-none gap-2">
            <div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#006B61] dark:text-[#72C6AD]" />
                <h2 id="shift-summary-heading" className="text-base sm:text-lg font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight font-heading">
                  Daily Progress & Shift Summary
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-[#EAF0E9] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] font-semibold hidden sm:inline">
                  Weather • Manpower • Equipment • Handover
                </span>
              </div>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Site staffing, equipment utilization, work permits, and cross-shift handover notes.
              </p>
            </div>
            <div className="flex items-center gap-3 self-start sm:self-center">
              <span className="text-xs font-bold text-[#006B61] dark:text-[#72C6AD] group-open:hidden">Expand Shift Details &darr;</span>
              <span className="text-xs font-bold text-[#006B61] dark:text-[#72C6AD] hidden group-open:inline">Collapse Shift Details &uarr;</span>
            </div>
          </summary>

          <div className="pt-3 border-t border-[#D9E2DA] dark:border-[#3A5146] space-y-4">
            <div className="flex justify-end">
              <Link
                href="/field/dpr"
                className="text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full Daily Progress Report (DPR)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Shift Logistics & Permits */}
              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] block">
                  Shift Logistics & Permits
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Shift Schedule:</span>
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">Shift A (07:00 - 15:30 IST)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Hot Work Permit:</span>
                    <span className="font-mono text-[#1F6B4E] dark:text-[#4ADE80] font-semibold">#HWP-2026-0918 (Active)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Site Weather:</span>
                    <span className="text-[#1A2B25] dark:text-[#F2F4E9] font-medium">Clear · 28°C · Wind 6 km/h</span>
                  </div>
                </div>
              </div>

              {/* Manpower & Resources */}
              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] block">
                  Manpower On Site
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Pipefitters & Fabricators:</span>
                    <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">18 personnel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">6G Certified Welders:</span>
                    <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">6 personnel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">QC & NDT Level II:</span>
                    <span className="font-mono font-bold text-[#1A2B25] dark:text-[#F2F4E9]">2 inspectors</span>
                  </div>
                </div>
              </div>

              {/* Active Plant & Equipment */}
              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#52665D] dark:text-[#B5C1B5] block">
                  Plant & Heavy Equipment
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Hydraulic Mobile Crane:</span>
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">1x 50-Ton (Operating)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Inverter TIG Welding Sets:</span>
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">4x 400A Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#52665D] dark:text-[#B5C1B5]">Hydrostatic Test Skid:</span>
                    <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">1x 250-bar (Standby)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cross-Shift Handover Note */}
            <div className="p-3 bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <span className="font-bold text-[#006B61] dark:text-[#72C6AD] uppercase text-[10px] tracking-wider block font-heading">
                  Shift Handover Note
                </span>
                <p className="text-[#1A2B25] dark:text-[#F2F4E9]">
                  Shift A completed root & hot passes on Line 24 joints #05–#08. Joints handed over to Shift B for radiographic testing (RT) and capping passes.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5] whitespace-nowrap self-start sm:self-center">
                Logged by: D. Borah
              </span>
            </div>
          </div>
        </details>

        {/* ========================================================= */}
        {/* MOBILE STICKY BOTTOM ACTION BAR (One-Hand Reachable) */}
        {/* ========================================================= */}
        <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-[#17221D] border-t border-[#D9E2DA] dark:border-[#3A5146] md:hidden shadow-lg z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedActivityForCapture('PIP-24-002');
              setIsCaptureModalOpen(true);
            }}
            className={`flex-1 ${touchBtnClass} font-bold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] active:bg-[#003D37] rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>CAPTURE UPDATE</span>
          </button>
          <Link
            href="/field/dpr"
            className={`${touchBtnClass} font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] active:bg-[#D9E2DA] rounded-lg flex items-center justify-center gap-1 cursor-pointer`}
          >
            <FileText className="w-4 h-4 text-[#52665D] dark:text-[#B5C1B5]" />
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
              <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] font-mono">
                {isOffline ? 'Offline mode: saving locally' : 'Online mode'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCaptureModalOpen(false)}
                  disabled={isSubmittingCapture}
                  className="px-4 py-2 text-xs font-medium text-[#52665D] dark:text-[#B5C1B5] hover:text-[#1A2B25] dark:hover:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFastCapture}
                  disabled={isSubmittingCapture || !customStatement.trim()}
                  className={`px-4 py-2 text-xs font-bold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] rounded transition-all inline-flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer ${
                    isGloveMode ? 'min-h-[48px]' : ''
                  }`}
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
              <label className="block text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] mb-1">
                Target Scheduled Activity <span className="text-[#A43B36] dark:text-[#FF9E94]">*</span>
              </label>
              <select
                value={selectedActivityForCapture}
                onChange={(e) => {
                  setSelectedActivityForCapture(e.target.value);
                  const act = todayActivities.find((a) => a.id === e.target.value);
                  if (act) setQuantityUnit(act.unit || 'joints');
                }}
                className="w-full px-3 py-2 text-xs bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD] focus:bg-white dark:focus:bg-[#17221D] rounded font-medium text-[#1A2B25] dark:text-[#F2F4E9] outline-none"
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
              <label className="block text-[11px] font-bold text-[#52665D] dark:text-[#B5C1B5] mb-2">
                Quick Observation Chips (Tap to Insert):
              </label>
              <div className="flex flex-wrap gap-2">
                {(engineer.quickCaptureTemplates && engineer.quickCaptureTemplates.length > 0
                  ? engineer.quickCaptureTemplates
                  : [
                      'Welding completed 4 joints on Header 24-XX.',
                      'Root pass done with TIG; NDT scheduled tonight.',
                      'Rigging & crane hoisting finished without incident.',
                      'De-shuttering finished; curing compound applied.',
                    ]
                ).map((chip: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomStatement(chip)}
                    className="px-3 py-1.5 text-[11px] rounded bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#3A5146] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Field Statement */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                  Field Statement / Site Observation <span className="text-[#A43B36] dark:text-[#FF9E94]">*</span>
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
                  className="text-[11px] text-[#006B61] dark:text-[#72C6AD] hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Simulate Voice Note</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={customStatement}
                onChange={(e) => setCustomStatement(e.target.value)}
                placeholder="Type or dictate what was completed on site today..."
                className="w-full p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded focus:border-[#006B61] dark:focus:border-[#72C6AD] focus:bg-white dark:focus:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] outline-none"
                required
              />
            </div>

            {/* Quantity Stepper & Unit */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded">
              <div>
                <label className="block text-[11px] font-bold text-[#1A2B25] dark:text-[#F2F4E9] mb-1">
                  Quantity Completed
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantityValue(Math.max(1, quantityValue - 1))}
                    className="w-8 h-8 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#D9E2DA] dark:hover:bg-[#3A5146] rounded text-sm font-bold flex items-center justify-center text-[#1A2B25] dark:text-[#F2F4E9] cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantityValue}
                    onChange={(e) => setQuantityValue(Number(e.target.value))}
                    className="w-16 text-center font-mono font-bold text-sm bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded py-1"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantityValue(quantityValue + 1)}
                    className="w-8 h-8 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#D9E2DA] dark:hover:bg-[#3A5146] rounded text-sm font-bold flex items-center justify-center text-[#1A2B25] dark:text-[#F2F4E9] cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1A2B25] dark:text-[#F2F4E9] mb-1">
                  Unit
                </label>
                <input
                  type="text"
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-3 py-1 text-xs bg-white dark:bg-[#17221D] text-[#1A2B25] dark:text-[#F2F4E9] border border-[#D9E2DA] dark:border-[#3A5146] rounded font-mono"
                />
              </div>
            </div>

            {/* Photo Attachment */}
            <div className="flex items-center justify-between p-3 bg-[#EAF0E9] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                <span className="text-[11px] text-[#1A2B25] dark:text-[#F2F4E9] font-medium">
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
                className="px-3 py-1 text-[11px] font-semibold text-[#006B61] dark:text-[#72C6AD] bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#1f3049] rounded transition-colors cursor-pointer"
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
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] rounded shadow-xs ml-auto cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
                <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                  Activity Target
                </span>
                <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD] block mt-0.5">
                  {selectedDetailUpdate.activityId}
                </span>
                <p className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9] mt-0.5">
                  {selectedDetailUpdate.activityName}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
                <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                  Field Statement
                </span>
                <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] italic leading-relaxed">
                  &ldquo;{selectedDetailUpdate.statement}&rdquo;
                </p>
                <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px]">
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">Quantity: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{selectedDetailUpdate.quantity}</strong></span>
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">Discipline: <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{selectedDetailUpdate.discipline}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded flex items-center justify-between text-xs">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Sync Status:</span>
                {selectedDetailUpdate.isSynced ? (
                  <span className="text-[#1F6B4E] dark:text-[#4ADE80] font-bold font-mono">Server confirmed</span>
                ) : (
                  <span className="text-[#825700] dark:text-[#F3B765] font-bold font-mono">Saved locally (IndexedDB)</span>
                )}
              </div>

              {selectedDetailUpdate.photoUrl && (
                <div className="p-3 bg-[#E4F1E9] dark:bg-[#0D3326] border border-[#B7DAC3] dark:border-[#1E4D3A] rounded text-xs text-[#1F6B4E] dark:text-[#4ADE80] flex items-center gap-2">
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
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006B61] hover:bg-[#00524A] dark:bg-[#006B61] dark:hover:bg-[#0b96a5] rounded shadow-xs ml-auto cursor-pointer"
              >
                Close
              </button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg">
                <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                  Subject & Target Activity
                </span>
                <span className="font-bold text-[#1A2B25] dark:text-[#F2F4E9] text-sm block mt-0.5">
                  {selectedEvidence.title}
                </span>
                <p className="font-mono text-[#006B61] dark:text-[#72C6AD] text-[11px] mt-0.5">
                  {selectedEvidence.activityId} — {selectedEvidence.activityName}
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg space-y-2">
                <span className="text-[10px] font-mono font-semibold text-[#52665D] dark:text-[#B5C1B5] uppercase block">
                  Inspection Notes & Geotag
                </span>
                <p className="text-xs text-[#1A2B25] dark:text-[#F2F4E9] leading-relaxed">
                  {selectedEvidence.notes}
                </p>
                <div className="pt-2 border-t border-[#D9E2DA] dark:border-[#3A5146] flex items-center justify-between text-[11px]">
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">GPS Tag: <strong className="font-mono text-[#1A2B25] dark:text-[#F2F4E9]">{selectedEvidence.gps}</strong></span>
                  <span className="text-[#52665D] dark:text-[#B5C1B5]">Type: <strong className="uppercase text-[#1A2B25] dark:text-[#F2F4E9]">{selectedEvidence.type}</strong></span>
                </div>
              </div>

              <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded flex items-center justify-between text-xs">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">QC Sign-off:</span>
                {selectedEvidence.verified ? (
                  <span className="text-[#1F6B4E] dark:text-[#4ADE80] font-bold font-mono">QC Verified & Stamped</span>
                ) : (
                  <span className="text-[#825700] dark:text-[#F3B765] font-bold font-mono">Awaiting QC Stamp</span>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </StateWrapper>
  );
}
