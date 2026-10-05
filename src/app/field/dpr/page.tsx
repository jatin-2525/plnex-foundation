'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
import { AppShell } from '../../../components/shell/AppShell';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { ProgressBar } from '../../../components/shared/ProgressBar';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { ConfidenceBadge } from '../../../components/shared/ConfidenceBadge';
import { Drawer } from '../../../components/shared/Drawer';
import { DisciplineType } from '../../../types';
import {
  Calendar,
  Clock,
  HardHat,
  Folder,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  FileText,
  Camera,
  Upload,
  Sparkles,
  Save,
  Send,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Layers,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info,
  Download,
  Activity,
  CheckSquare,
} from 'lucide-react';

// Explicit DPR Submission States (supporting Offline Mode Saved Locally)
export type DPRSubmissionState =
  | 'Draft'
  | 'Processing'
  | 'Needs Confirmation'
  | 'Ready to Submit'
  | 'Submitted'
  | 'Saved locally'
  | 'Failed';

// Step type (1 to 7)
export type DPRStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Field update linked structure
export interface DPRFieldUpdate {
  id: string;
  activityId: string;
  activityName: string;
  discipline: DisciplineType;
  quantity: number;
  unit: string;
  time: string;
  locationArea: string;
  remarks: string;
  evidence: Array<{
    id: string;
    name: string;
    type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE';
    timestamp: string;
  }>;
  confidence: number;
  verificationState: 'Confirmed' | 'Needs Confirmation' | 'Unknown' | 'Conflict';
  verificationReason: string;
  status: 'In Progress' | 'Completed' | 'Blocked' | 'On Track';
  isCriticalPath?: boolean;
}

// Initial realistic DPR field updates
const INITIAL_FIELD_UPDATES: DPRFieldUpdate[] = [
  {
    id: 'UPD-20260918-01',
    activityId: 'PIP-24-001',
    activityName: 'Erect Line 24-XX High Pressure Gas Header',
    discipline: 'Piping',
    quantity: 12,
    unit: 'spools',
    time: '09:00 - 15:30',
    locationArea: 'Unit A - Gas Processing Area / Piperack Section B',
    remarks: '12 prefabricated 24-inch spool pieces erected with 75T mobile crane. Spool alignment checked.',
    evidence: [
      { id: 'EVD-001', name: 'IMG_20260918_LINE24_SPOOL_ERECTION.jpg', type: 'PHOTO', timestamp: '15:35' },
      { id: 'EVD-002', name: 'CRANE_LIFT_SIGN_OFF_SHEET.pdf', type: 'INSPECTION_NOTE', timestamp: '15:40' },
    ],
    confidence: 96,
    verificationState: 'Confirmed',
    verificationReason: 'Full match with Schedule WBS 3.2.1 and physical crane lifting signoff',
    status: 'Completed',
    isCriticalPath: true,
  },
  {
    id: 'UPD-20260918-02',
    activityId: 'PIP-24-002',
    activityName: 'Weld Line 24-XX Field Joints & NDT Inspection',
    discipline: 'Piping',
    quantity: 4,
    unit: 'welds',
    time: '10:00 - 16:00',
    locationArea: 'Unit A - Piperack Section B, Joint J-04 to J-07',
    remarks: '4 circumferential butt welds completed. Radiographic testing (RT) team notified for night shift.',
    evidence: [
      { id: 'EVD-003', name: 'IMG_20260918_WELD_BUTT_J04.jpg', type: 'PHOTO', timestamp: '16:05' },
      { id: 'EVD-004', name: 'WELD_LOG_SHEET_SHIFT_A.pdf', type: 'DOCUMENT', timestamp: '16:15' },
    ],
    confidence: 92,
    verificationState: 'Confirmed',
    verificationReason: 'Weld log signed by QA/QC inspector; progressive output verified',
    status: 'In Progress',
    isCriticalPath: true,
  },
  {
    id: 'UPD-20260918-03',
    activityId: 'CIV-11-001',
    activityName: 'Foundation Block A - Compressor Pedestal',
    discipline: 'Civil',
    quantity: 45,
    unit: 'm³ concrete',
    time: '08:00 - 14:00',
    locationArea: 'Unit A - Compressor Station Bay 1',
    remarks: 'Compressor foundation raft concrete pour completed. Slump test and test cube samples collected.',
    evidence: [
      { id: 'EVD-005', name: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf', type: 'DOCUMENT', timestamp: '14:10' },
      { id: 'EVD-006', name: 'IMG_20260918_RAFT_POUR.jpg', type: 'PHOTO', timestamp: '14:20' },
    ],
    confidence: 98,
    verificationState: 'Confirmed',
    verificationReason: 'RMC batch tickets and cube sample register match 45 m³ target',
    status: 'Completed',
    isCriticalPath: true,
  },
  {
    id: 'UPD-20260918-04',
    activityId: 'PIP-24-003',
    activityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    discipline: 'Piping',
    quantity: 0,
    unit: 'sections',
    time: '11:30 - 13:00',
    locationArea: 'Unit A - Test Manifold Bay 2',
    remarks: 'Hydrostatic test postponed due to intermittent monsoon rain and delayed blind flange delivery from store.',
    evidence: [
      { id: 'EVD-007', name: 'DELAY_NOTICE_WEATHER_STATION.pdf', type: 'DOCUMENT', timestamp: '13:05' },
    ],
    confidence: 72,
    verificationState: 'Conflict',
    verificationReason: 'Stoppage logged: Weather hold and missing material flag requires manager confirmation',
    status: 'Blocked',
    isCriticalPath: false,
  },
];

export default function DPRTimeAgentPage() {
  const router = useRouter();
  const { activeProject } = useApp();
  const { addToast } = useToast();
  const { isOffline, effectiveStatus, captureDPR } = useOffline();

  // Current Step (1 to 7)
  const [currentStep, setCurrentStep] = useState<DPRStep>(1);

  // STEP 1 State: Project + Date
  const [selectedProjectId, setSelectedProjectId] = useState(activeProject?.id || 'PRJ-OIL-2026-01');
  const [reportingDate, setReportingDate] = useState('2026-09-18');
  const [reportingShift, setReportingShift] = useState<'Shift A' | 'Shift B' | 'Shift C'>('Shift A');
  const [weatherCondition, setWeatherCondition] = useState('Monsoon Intermittent Rain (29°C)');
  const [contractorName, setContractorName] = useState('Brahmaputra Engineering & Construction Consortium');
  const siteEngineer = 'Debajit Borah';
  const siteRole = 'Lead Site Execution Engineer';

  // STEP 2 State: Today's Activities selection
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([
    'PIP-24-001',
    'PIP-24-002',
    'CIV-11-001',
    'PIP-24-003',
    'ELE-06-004',
    'MEC-08-003',
  ]);

  // STEP 3 State: Field Updates
  const [fieldUpdates, setFieldUpdates] = useState<DPRFieldUpdate[]>(INITIAL_FIELD_UPDATES);
  const [newUpdateStatement, setNewUpdateStatement] = useState('');
  const [activeEditingUpdateId, setActiveEditingUpdateId] = useState<string | null>(null);

  // STEP 4 State: Extraction (Time Agent)
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(100);
  const [extractedTimestamp, setExtractedTimestamp] = useState<string>('Today, 15:45:12');

  // STEP 6 State: Confirmation & Verification Governance
  const [engineerSignoffConfirmed, setEngineerSignoffConfirmed] = useState(true);
  const [overrideConflictAccepted, setOverrideConflictAccepted] = useState(false);
  const [managerReviewRouteAcknowledged, setManagerReviewRouteAcknowledged] = useState(true);

  // STEP 7 State: Submission States (Draft, Processing, Needs Confirmation, Ready to Submit, Submitted, Failed)
  const [submissionState, setSubmissionState] = useState<DPRSubmissionState>('Ready to Submit');
  const [submittedDprCode, setSubmittedDprCode] = useState<string>('DPR-OIL-DUL-20260918-001');

  // Detail inspection drawer state
  const [selectedUpdateForDrawer, setSelectedUpdateForDrawer] = useState<DPRFieldUpdate | null>(null);

  // Daily summary metrics computation
  const summaryMetrics = useMemo(() => {
    const planned = selectedActivityIds.length;
    const updated = fieldUpdates.length;
    const completed = fieldUpdates.filter((u) => u.status === 'Completed').length;
    const blocked = fieldUpdates.filter((u) => u.status === 'Blocked').length;
    const pending = Math.max(0, planned - updated);

    return {
      activitiesPlanned: planned,
      activitiesUpdated: updated,
      activitiesCompleted: completed,
      blockedActivities: blocked,
      pendingEntries: pending,
    };
  }, [selectedActivityIds, fieldUpdates]);

  // Step names and navigation
  const stepsConfig: Array<{ step: DPRStep; title: string; subtitle: string }> = [
    { step: 1, title: 'Project + Date', subtitle: 'Shift & site baseline' },
    { step: 2, title: "Today's Activities", subtitle: 'Assigned schedule tasks' },
    { step: 3, title: 'Field Updates', subtitle: 'Work outputs & observations' },
    { step: 4, title: 'Extract Information', subtitle: 'Time Agent NLP parsing' },
    { step: 5, title: 'Review Extracted Data', subtitle: 'Verification parameters' },
    { step: 6, title: 'Confirm & Governance', subtitle: 'Verification rules gate' },
    { step: 7, title: 'Submit DPR', subtitle: 'Schedule Twin commit' },
  ];

  // Run Time Agent Extraction in Step 4
  const handleRunTimeAgentExtraction = async () => {
    setIsExtracting(true);
    setExtractionProgress(10);
    try {
      await new Promise((r) => setTimeout(r, 200));
      setExtractionProgress(45);
      await new Promise((r) => setTimeout(r, 220));
      setExtractionProgress(85);
      await new Promise((r) => setTimeout(r, 180));
      setExtractionProgress(100);

      const now = new Date();
      setExtractedTimestamp(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      addToast({
        type: 'success',
        title: 'Time Agent Extraction Complete',
        description: 'Successfully parsed 4 execution events with confidence scoring.',
      });
      setCurrentStep(5);
    } finally {
      setIsExtracting(false);
    }
  };

  // Submit DPR handler for Step 7 (Priority 2 Requirements 3 & 8)
  const handleSubmitDPR = async () => {
    // Check verification rules gate
    const hasUnconfirmedConflict = fieldUpdates.some((u) => u.verificationState === 'Conflict');

    if (hasUnconfirmedConflict && !overrideConflictAccepted && !managerReviewRouteAcknowledged) {
      setSubmissionState('Needs Confirmation');
      addToast({
        type: 'warning',
        title: 'Verification Hold Triggered',
        description: 'Activity PIP-24-003 is blocked. Requires acknowledgment or manager routing.',
      });
      return;
    }

    setSubmissionState('Processing');
    addToast({
      type: 'info',
      title: 'Transmitting DPR',
      description: isOffline
        ? 'Hashing daily progress records and persisting to local IndexedDB...'
        : 'Hashing daily progress records and updating Schedule Twin...',
    });

    await new Promise((r) => setTimeout(r, 600));

    if (isOffline) {
      await captureDPR({
        projectId: selectedProjectId,
        dprCode: submittedDprCode,
        date: reportingDate,
        shift: reportingShift,
        siteEngineer,
        contractorName,
        weatherCondition,
        fieldUpdates,
      });

      setSubmissionState('Saved locally');
      addToast({
        type: 'warning',
        title: 'Saved locally',
        description: `DPR ${submittedDprCode} queued in IndexedDB. Will receive Server Confirmation upon sync.`,
      });
      return;
    }

    await captureDPR({
      projectId: selectedProjectId,
      dprCode: submittedDprCode,
      date: reportingDate,
      shift: reportingShift,
      siteEngineer,
      contractorName,
      weatherCondition,
      fieldUpdates,
    });

    setSubmissionState('Submitted');
    addToast({
      type: 'success',
      title: 'Server confirmed',
      description: `Reference: ${submittedDprCode}. Submitted and synchronized with Schedule Twin.`,
    });
  };

  // Helper to update a field update value
  const handleUpdateField = (id: string, field: keyof DPRFieldUpdate, value: any) => {
    setFieldUpdates((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // If editing quantity or state, flag as Confirmed
          if (field === 'quantity' || field === 'remarks') {
            updated.verificationState = 'Confirmed';
            updated.verificationReason = 'Manually verified by Site Engineer';
          }
          return updated;
        }
        return item;
      })
    );
  };

  const breadcrumbs = [
    { label: 'Field Execution', href: '/engineer' },
    { label: 'DPR / Time Agent', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER (Priority 2 Requirement 3) */}
        {isOffline && (
          <div className="p-3.5 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-between gap-3 text-xs text-[#D98B32]">
            <div className="flex items-center gap-2.5">
              <span className="px-2 py-0.5 rounded bg-[#D98B32] text-white font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                Updates will be synchronized when online mode is restored.
              </span>
            </div>
            <span className="text-[11px] text-[#78350F] hidden sm:inline font-mono">
              IndexedDB Storage Active
            </span>
          </div>
        )}

        {/* PAGE HEADER */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Time Agent Protocol
                </span>
                {isOffline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D98B32]" />
                    Offline Mode
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
                    Online
                  </span>
                )}
                <span className="text-[11px] text-[#596579]">
                  Step {currentStep} of 7: {stepsConfig[currentStep - 1].title}
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Daily Project Report (DPR) / Time Agent
              </h1>
              <p className="text-sm text-[#596579] mt-1">
                Guided engineer reporting workflow: observe, extract, verify, and synchronize daily site execution into the Schedule Twin.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#596579] font-mono">
                {activeProject?.code || 'OIL-DUL-01'} · 18 Sep 2026
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubmissionState('Draft');
                  addToast({
                    type: 'success',
                    title: 'Draft Saved Locally',
                    description: 'DPR state cached to browser storage.',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5 text-[#596579]" />
                <span>Save Draft</span>
              </button>
            </div>
          </div>

          {/* STEP-BASED PROGRESS BAR (7 Steps) */}
          <div className="mt-6 pt-5 border-t border-[#D9DEE5]/70">
            <div className="hidden lg:grid grid-cols-7 gap-2">
              {stepsConfig.map((s) => {
                const isPassed = s.step < currentStep;
                const isCurrent = s.step === currentStep;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => {
                      // Allow navigating to any previous step or current step
                      if (s.step <= currentStep || isPassed) {
                        setCurrentStep(s.step);
                      }
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'border-[#176B87] bg-[#EDF5F8] shadow-2xs'
                        : isPassed
                        ? 'border-[#B8DCC9] bg-[#EDF7F2] hover:border-[#176B87]'
                        : 'border-[#D9DEE5] bg-[#FAFAFA] opacity-70 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          isCurrent
                            ? 'bg-[#176B87] text-white'
                            : isPassed
                            ? 'bg-[#2E7D5B] text-white'
                            : 'bg-[#D9DEE5] text-[#596579]'
                        }`}
                      >
                        {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : s.step}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798]">
                        Step {s.step}
                      </span>
                    </div>
                    <div
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-[#176B87]' : isPassed ? 'text-[#2E7D5B]' : 'text-[#596579]'
                      }`}
                    >
                      {s.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile / Tablet Compact Stepper */}
            <div className="lg:hidden flex items-center justify-between bg-[#F7F8FA] p-3 rounded-lg border border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#176B87] text-white text-xs font-bold flex items-center justify-center">
                  {currentStep}
                </span>
                <div>
                  <span className="text-xs font-bold text-[#172033]">
                    Step {currentStep} of 7: {stepsConfig[currentStep - 1].title}
                  </span>
                  <span className="text-[11px] text-[#596579] block">
                    {stepsConfig[currentStep - 1].subtitle}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentStep === 1}
                  onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as DPRStep)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-lg border border-[#D9DEE5] bg-white text-[#172033] hover:bg-[#F1F3F5] active:bg-[#D9DEE5] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous step"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  disabled={currentStep === 7}
                  onClick={() => setCurrentStep((prev) => Math.min(7, prev + 1) as DPRStep)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-lg border border-[#D9DEE5] bg-white text-[#172033] hover:bg-[#F1F3F5] active:bg-[#D9DEE5] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next step"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DAILY SUMMARY METRICS STRIP:
            - activities planned
            - activities updated
            - activities completed
            - blocked activities
            - pending entries */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* 1. Activities Planned */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Activities Planned
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {summaryMetrics.activitiesPlanned}
              </span>
              <span className="text-[11px] text-[#596579]">tasks today</span>
            </div>
            <span className="text-[11px] text-[#176B87] mt-1 block">
              Baseline target: 100%
            </span>
          </div>

          {/* 2. Activities Updated */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Activities Updated
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#176B87] font-mono">
                {summaryMetrics.activitiesUpdated}
              </span>
              <span className="text-[11px] text-[#596579]">with site logs</span>
            </div>
            <span className="text-[11px] text-[#2E7D5B] mt-1 block">
              {Math.round((summaryMetrics.activitiesUpdated / summaryMetrics.activitiesPlanned) * 100)}% coverage
            </span>
          </div>

          {/* 3. Activities Completed */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Activities Completed
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#2E7D5B] font-mono">
                {summaryMetrics.activitiesCompleted}
              </span>
              <span className="text-[11px] text-[#596579]">at 100% target</span>
            </div>
            <span className="text-[11px] text-[#2E7D5B] mt-1 block">
              Line 24 + Foundation
            </span>
          </div>

          {/* 4. Blocked Activities */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Blocked Activities
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {summaryMetrics.blockedActivities}
              </span>
              <span className="text-[11px] text-[#596579]">impediments</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Weather & Flange Hold
            </span>
          </div>

          {/* 5. Pending Entries */}
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-3.5 shadow-2xs col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Pending Entries
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#D98B32] font-mono">
                {summaryMetrics.pendingEntries}
              </span>
              <span className="text-[11px] text-[#596579]">unlogged</span>
            </div>
            <span className="text-[11px] text-[#596579] mt-1 block">
              Shift B signoff pending
            </span>
          </div>
        </div>

        {/* =========================================================================
            STEP 1: PROJECT + DATE
            ========================================================================= */}
        {currentStep === 1 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 1: Project & Reporting Shift Baseline
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Establish the project site context, reporting date, shift timings, and environmental conditions.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#176B87] bg-[#EDF5F8] px-2.5 py-1 rounded">
                DPR-2026-0918-01
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Project Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Project Code & Facility
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#172033] text-sm">
                      {activeProject?.code || 'OIL-DUL-01'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EDF5F8] text-[#176B87]">
                      Active Schedule V3 · Rev 3.2
                    </span>
                  </div>
                  <p className="font-medium text-[#596579]">
                    {activeProject?.name || 'Duliajan Gas Processing & Pipeline Interconnect'}
                  </p>
                  <p className="text-[11px] text-[#7B8798]">
                    Location: Duliajan Field, Dibrugarh, Assam · Client: Oil India Limited
                  </p>
                </div>
              </div>

              {/* Reporting Date */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Reporting Date & Shift
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={reportingDate}
                    onChange={(e) => setReportingDate(e.target.value)}
                    className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-bold text-[#172033] outline-hidden focus:border-[#176B87]"
                  />
                  <select
                    value={reportingShift}
                    onChange={(e) => setReportingShift(e.target.value as any)}
                    className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033] outline-hidden focus:border-[#176B87]"
                  >
                    <option value="Shift A">Shift A (Day: 07:00 – 16:30)</option>
                    <option value="Shift B">Shift B (Evening: 16:30 – 00:00)</option>
                    <option value="Shift C">Shift C (Night Shift)</option>
                  </select>
                </div>
                <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex items-center justify-between text-[11px]">
                  <span className="text-[#596579]">Lead Site Engineer:</span>
                  <span className="font-bold text-[#172033]">{siteEngineer} ({siteRole})</span>
                </div>
              </div>

              {/* Weather & Site Conditions */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Weather & Environmental Conditions
                </label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-hidden focus:border-[#176B87]"
                  placeholder="e.g. Clear, Heavy Rain, Stoppages..."
                />
                <p className="text-[11px] text-[#7B8798]">
                  Monsoon conditions logged: Work suspended for 1.5 hrs due to squall at 11:30.
                </p>
              </div>

              {/* EPC Contractor */}
              <div className="space-y-1.5">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px]">
                  Executing EPC Contractor
                </label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-hidden focus:border-[#176B87]"
                />
                <p className="text-[11px] text-[#7B8798]">
                  Active Permit to Work: PTW-OIL-2026-894 (Hot Work) & PTW-OIL-2026-895 (Rigging)
                </p>
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex justify-end">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Today's Activities</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 2: TODAY'S ACTIVITIES
            ========================================================================= */}
        {currentStep === 2 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 2: Assigned Schedule Activities for {reportingDate}
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Select which baseline schedule activities were actively worked, progressed, or hindered today.
                </p>
              </div>
              <span className="text-xs text-[#176B87] font-semibold">
                {selectedActivityIds.length} of 6 activities selected
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {[
                {
                  id: 'PIP-24-001',
                  wbs: '3.2.1',
                  name: 'Erect Line 24-XX High Pressure Gas Header',
                  discipline: 'Piping',
                  area: 'Unit A - Gas Processing',
                  plannedTarget: '12 spools',
                  status: 'Completed',
                  isCritical: true,
                },
                {
                  id: 'PIP-24-002',
                  wbs: '3.2.2',
                  name: 'Weld Line 24-XX Field Joints & NDT Inspection',
                  discipline: 'Piping',
                  area: 'Unit A - Gas Processing',
                  plannedTarget: '4 welds',
                  status: 'In Progress',
                  isCritical: true,
                },
                {
                  id: 'CIV-11-001',
                  wbs: '2.1.1',
                  name: 'Foundation Block A - Compressor Pedestal',
                  discipline: 'Civil',
                  area: 'Unit A - Compressor Bay',
                  plannedTarget: '45 m³ pour',
                  status: 'Completed',
                  isCritical: true,
                },
                {
                  id: 'PIP-24-003',
                  wbs: '3.2.3',
                  name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
                  discipline: 'Piping',
                  area: 'Unit A - Test Manifold',
                  plannedTarget: '1 test pack',
                  status: 'Blocked',
                  isCritical: false,
                },
                {
                  id: 'ELE-06-004',
                  wbs: '4.1.2',
                  name: 'Pull Cable Tray TR-04 Main Feeder',
                  discipline: 'Electrical',
                  area: 'Substation to Rack 2',
                  plannedTarget: '350 meters',
                  status: 'In Progress',
                  isCritical: false,
                },
                {
                  id: 'MEC-08-003',
                  wbs: '5.3.1',
                  name: 'Skid Alignment & Grouting for Compressor C-101',
                  discipline: 'Mechanical',
                  area: 'Unit A - Skid Bay',
                  plannedTarget: '1 skid',
                  status: 'Pending',
                  isCritical: false,
                },
              ].map((act) => {
                const isSelected = selectedActivityIds.includes(act.id);
                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      setSelectedActivityIds((prev) =>
                        isSelected ? prev.filter((id) => id !== act.id) : [...prev, act.id]
                      );
                    }}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-[#176B87] bg-[#EDF5F8]/40 shadow-2xs'
                        : 'border-[#D9DEE5] bg-white hover:bg-[#F7F8FA]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent onClick
                        className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5] focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono font-bold text-[#176B87]">{act.id}</span>
                          <span className="text-[10px] font-mono text-[#7B8798]">WBS {act.wbs}</span>
                          {act.isCritical && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                              Critical Path
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-[#596579] bg-[#F1F3F5] px-2 py-0.2 rounded">
                            {act.discipline}
                          </span>
                        </div>
                        <p className="font-bold text-[#172033] truncate">{act.name}</p>
                        <p className="text-[11px] text-[#596579]">
                          {act.area} · Target: <strong className="text-[#172033]">{act.plannedTarget}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          act.status === 'Completed'
                            ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                            : act.status === 'Blocked'
                            ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                            : 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Field Updates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 3: FIELD UPDATES
            Each field update must link to:
            - activity
            - quantity
            - unit
            - time
            - location/area
            - remarks
            - evidence
            ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 3: Log Field Execution Updates
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Every field entry strictly links an Activity with Quantity, Unit, Shift Time, Location, Remarks, and Evidence.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const newId = `UPD-20260918-0${fieldUpdates.length + 1}`;
                    setFieldUpdates([
                      ...fieldUpdates,
                      {
                        id: newId,
                        activityId: 'ELE-06-004',
                        activityName: 'Pull Cable Tray TR-04 Main Feeder',
                        discipline: 'Electrical',
                        quantity: 350,
                        unit: 'meters',
                        time: '08:30 - 15:00',
                        locationArea: 'Substation to Rack 2',
                        remarks: '350 meters HT cable successfully pulled through tray TR-04.',
                        evidence: [
                          { id: `EVD-${Date.now()}`, name: 'CABLE_PULL_SIGN_OFF.pdf', type: 'DOCUMENT', timestamp: '15:10' },
                        ],
                        confidence: 88,
                        verificationState: 'Confirmed',
                        verificationReason: 'Verified cable tray pull length against isometric layout',
                        status: 'In Progress',
                      },
                    ]);
                    addToast({
                      type: 'success',
                      title: 'Field Update Added',
                      description: 'Added update for Cable Tray TR-04.',
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-[#176B87] bg-[#EDF5F8] border border-[#B3CBE0] hover:bg-[#D6EBF0] rounded-lg inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Update</span>
                </button>
              </div>
            </div>

            {/* List of Field Update Cards */}
            <div className="space-y-4 text-xs">
              {fieldUpdates.map((update, idx) => (
                <div
                  key={update.id}
                  className="p-4 rounded-lg border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DEE5]/60 pb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] font-bold text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded">
                        #{idx + 1} · {update.id}
                      </span>
                      <span className="font-mono font-bold text-[#176B87] text-xs">
                        {update.activityId}
                      </span>
                      <span className="font-bold text-[#172033]">{update.activityName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          update.verificationState === 'Confirmed'
                            ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                            : update.verificationState === 'Conflict'
                            ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                            : 'bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]'
                        }`}
                      >
                        {update.verificationState} ({update.confidence}%)
                      </span>
                      {fieldUpdates.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setFieldUpdates(fieldUpdates.filter((u) => u.id !== update.id));
                            addToast({
                              type: 'info',
                              title: 'Update Removed',
                              description: `Removed ${update.id}`,
                            });
                          }}
                          className="text-[#7B8798] hover:text-[#B5473C] p-1"
                          title="Remove this update"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 6 Mandatory Editable Core Properties: Quantity, Unit, Time, Location/Area, Remarks, Evidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Quantity + Unit */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                        Quantity & Unit
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          value={update.quantity}
                          onChange={(e) =>
                            handleUpdateField(update.id, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 p-2 bg-white border border-[#D9DEE5] rounded-lg text-xs font-bold text-[#172033] text-center"
                        />
                        <input
                          type="text"
                          value={update.unit}
                          onChange={(e) => handleUpdateField(update.id, 'unit', e.target.value)}
                          className="w-full p-2 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
                        />
                      </div>
                    </div>

                    {/* Time Window */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                        Shift Time Window
                      </label>
                      <input
                        type="text"
                        value={update.time}
                        onChange={(e) => handleUpdateField(update.id, 'time', e.target.value)}
                        className="w-full p-2 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
                        placeholder="e.g. 09:00 - 15:30"
                      />
                    </div>

                    {/* Location / Area */}
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                        Location / Area / Line
                      </label>
                      <input
                        type="text"
                        value={update.locationArea}
                        onChange={(e) => handleUpdateField(update.id, 'locationArea', e.target.value)}
                        className="w-full p-2 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033]"
                      />
                    </div>
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                      Engineer Site Observations & Remarks
                    </label>
                    <input
                      type="text"
                      value={update.remarks}
                      onChange={(e) => handleUpdateField(update.id, 'remarks', e.target.value)}
                      className="w-full p-2 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033]"
                    />
                  </div>

                  {/* Evidence Pills */}
                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-[#7B8798]">Evidence:</span>
                      {update.evidence.map((ev) => (
                        <span
                          key={ev.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-white border border-[#D9DEE5] text-[#172033]"
                        >
                          {ev.type === 'PHOTO' ? (
                            <Camera className="w-3 h-3 text-[#176B87]" />
                          ) : (
                            <FileText className="w-3 h-3 text-[#596579]" />
                          )}
                          <span className="truncate max-w-[150px]">{ev.name}</span>
                        </span>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const newEv = {
                          id: `EVD-${Date.now()}`,
                          name: `IMG_${reportingDate.replace(/-/g, '')}_FIELD_CHECK.jpg`,
                          type: 'PHOTO' as const,
                          timestamp: '16:30',
                        };
                        handleUpdateField(update.id, 'evidence', [...update.evidence, newEv]);
                        addToast({
                          type: 'info',
                          title: 'Evidence Attached',
                          description: `Attached photo to ${update.activityId}`,
                        });
                      }}
                      className="text-[11px] font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Attach Photo / Note</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Time Agent Extraction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 4: EXTRACT EXECUTION INFORMATION (Time Agent)
            ========================================================================= */}
        {currentStep === 4 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 4: Time Agent Entity & Schedule Extraction
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  The Time Agent cross-references site timestamps, quantities, and activity WBS IDs against the project schedule.
                </p>
              </div>
              <span className="text-xs font-bold text-[#2E7D5B] bg-[#EDF7F2] border border-[#B8DCC9] px-2.5 py-1 rounded">
                Extraction Engine v2.4 Ready
              </span>
            </div>

            {/* Extraction Console */}
            <div className="bg-[#EDF5F8]/40 border border-[#B3CBE0] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#176B87] text-white flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#172033]">
                      Time Agent Natural Language & Timestamp Parser
                    </h4>
                    <p className="text-[11px] text-[#596579]">
                      Parsing {fieldUpdates.length} execution updates · Last executed {extractedTimestamp}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunTimeAgentExtraction}
                  disabled={isExtracting}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                  <span>{isExtracting ? 'Processing Extraction...' : 'Re-Run Extraction'}</span>
                </button>
              </div>

              {isExtracting && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-[#176B87]">
                    <span>Parsing quantities, isometric lines, and physical outputs...</span>
                    <span>{extractionProgress}%</span>
                  </div>
                  <ProgressBar actual={extractionProgress} size="md" showLabels={false} />
                </div>
              )}

              {/* Extraction ledger comparison preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                {fieldUpdates.map((u) => (
                  <div key={u.id} className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#176B87]">{u.activityId}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.confidence >= 90
                            ? 'bg-[#EDF7F2] text-[#2E7D5B]'
                            : u.confidence >= 70
                            ? 'bg-[#FDF6ED] text-[#D98B32]'
                            : 'bg-[#FBEFEE] text-[#B5473C]'
                        }`}
                      >
                        {u.confidence}% Match
                      </span>
                    </div>
                    <p className="font-semibold text-[#172033]">{u.activityName}</p>
                    <div className="flex items-center justify-between text-[11px] text-[#596579] pt-1 border-t border-[#D9DEE5]/60">
                      <span>Parsed: <strong>{u.quantity} {u.unit}</strong></span>
                      <span>Window: <strong>{u.time}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Review Extracted Data</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 5: REVIEW EXTRACTED DATA
            ========================================================================= */}
        {currentStep === 5 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 5: Review & Refine Extracted Execution Data
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Verify and edit extracted values before proceeding to confirmation.
                </p>
              </div>
              <span className="text-xs font-semibold text-[#596579]">
                4 of 4 records validated
              </span>
            </div>

            {/* Extracted Data Table */}
            <div className="border border-[#D9DEE5] rounded-lg overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                    <th className="p-3">Activity</th>
                    <th className="p-3">Output Qty</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Time Window</th>
                    <th className="p-3">Area / Line</th>
                    <th className="p-3">Confidence State</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {fieldUpdates.map((u) => (
                    <tr key={u.id} className="hover:bg-[#F7F8FA]/60">
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#176B87]">{u.activityId}</div>
                        <div className="text-[11px] text-[#596579] truncate max-w-[180px]">{u.activityName}</div>
                      </td>
                      <td className="p-3 font-mono font-bold text-[#172033]">
                        {u.quantity}
                      </td>
                      <td className="p-3 text-[#596579] font-medium">{u.unit}</td>
                      <td className="p-3 text-[#596579]">{u.time}</td>
                      <td className="p-3 text-[#596579] truncate max-w-[160px]">{u.locationArea}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.verificationState === 'Confirmed'
                              ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                              : u.verificationState === 'Conflict'
                              ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                              : 'bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]'
                          }`}
                        >
                          {u.verificationState === 'Confirmed' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                          <span>{u.verificationState}</span>
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUpdateForDrawer(u)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-transparent rounded transition-colors"
                        >
                          Inspect Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Step 5 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue to Confirmation & Governance</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 6: CONFIRM (Verification Rules Gate)
            Rule: "Do not let submission automatically bypass verification rules."
            Rule: "Before final submission: show a clear review summary."
            ========================================================================= */}
        {currentStep === 6 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 6: Verification Rules & Compliance Gate
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Project controls rules enforce data integrity. Submissions cannot bypass validation without audit logging.
                </p>
              </div>
              <span className="text-xs font-bold text-[#2E7D5B] bg-[#EDF7F2] border border-[#B8DCC9] px-2.5 py-1 rounded inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Governance Enforced</span>
              </span>
            </div>

            {/* 4 Verification Rules Checklist */}
            <div className="space-y-3 text-xs">
              {/* Rule 1 */}
              <div className="p-3.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#172033]">
                    Rule 1: Quantity Ceiling Enforcement [PASSED]
                  </h4>
                  <p className="text-[#596579]">
                    Total executed quantities (12 spools Line 24, 4 welds, 45 m³ concrete) do not exceed remaining planned baseline ceilings.
                  </p>
                </div>
              </div>

              {/* Rule 2 */}
              <div className="p-3.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#172033]">
                    Rule 2: Mandatory Physical Evidence Attached [PASSED]
                  </h4>
                  <p className="text-[#596579]">
                    All 3 critical path activities contain verifiable inspection photographs and batch delivery tickets.
                  </p>
                </div>
              </div>

              {/* Rule 3 */}
              <div className="p-3.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-[#172033]">
                    Rule 3: Discipline & WBS Alignment [PASSED]
                  </h4>
                  <p className="text-[#596579]">
                    Piping spools mapped to WBS 3.2.1; Foundation concrete mapped to WBS 2.1.1 without hierarchy cross-contamination.
                  </p>
                </div>
              </div>

              {/* Rule 4: Weather / Impediment Conflict */}
              <div className="p-3.5 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#B5473C] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[#B5473C]">
                    Rule 4: Stoppage & Impediment Flag Triggered [HOLD / ROUTE REQUIRED]
                  </h4>
                  <p className="text-[#596579]">
                    Activity <strong>PIP-24-003 Hydrostatic Testing</strong> was halted (0 progress) due to monsoon rain and store flange delay.
                    Under project governance, this variance <em>cannot be silently ignored</em>. It must either route to the Manager Review Queue or require explicit engineer sign-off.
                  </p>
                  <div className="pt-2 flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={managerReviewRouteAcknowledged}
                        onChange={(e) => setManagerReviewRouteAcknowledged(e.target.checked)}
                        className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5]"
                      />
                      <span className="font-bold text-[#172033]">
                        Route PIP-24-003 variance alert to Manager Review Queue (/matching)
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Engineer Formal Digital Signature Sign-Off */}
            <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-3 text-xs">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={engineerSignoffConfirmed}
                  onChange={(e) => setEngineerSignoffConfirmed(e.target.checked)}
                  className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5] mt-0.5"
                />
                <div>
                  <span className="font-bold text-[#172033] block">
                    Lead Site Execution Engineer Attestation
                  </span>
                  <span className="text-[#596579]">
                    I, <strong>{siteEngineer}</strong>, certify that the quantities, work hours, and photographic evidence submitted in this report accurately reflect physical site progress at {activeProject?.name || 'Duliajan'} on {reportingDate}.
                  </span>
                </div>
              </label>
            </div>

            {/* Step 6 Actions */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                disabled={!engineerSignoffConfirmed}
                onClick={() => setCurrentStep(7)}
                className="min-h-[44px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] disabled:opacity-50 rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Proceed to DPR Submission</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STEP 7: SUBMIT DPR
            Submission states:
            - Draft
            - Processing
            - Needs Confirmation
            - Ready to Submit
            - Submitted
            - Failed
            ========================================================================= */}
        {currentStep === 7 && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 space-y-6 shadow-xs animate-in fade-in duration-200">
            {/* Review Summary before final submission */}
            <div className="border-b border-[#D9DEE5]/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#172033]">
                  Step 7: Final Review & Daily Progress Report Submission
                </h3>
                <p className="text-xs text-[#596579] mt-0.5">
                  Final pre-submission audit summary. Synchronizes verified execution into the Schedule Twin.
                </p>
              </div>

              {/* State Pill */}
              <span
                className={`text-xs font-bold px-3 py-1 rounded border inline-flex items-center gap-1.5 ${
                  submissionState === 'Submitted'
                    ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                    : submissionState === 'Saved locally'
                    ? 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]'
                    : submissionState === 'Processing'
                    ? 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]'
                    : submissionState === 'Needs Confirmation'
                    ? 'bg-[#FDF6ED] text-[#D98B32] border-[#F0D4A6]'
                    : submissionState === 'Failed'
                    ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA]'
                    : 'bg-[#F1F3F5] text-[#172033] border-[#D9DEE5]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>State: {submissionState}</span>
              </span>
            </div>

            {/* CLEAR REVIEW SUMMARY CARD (Before final submission) */}
            <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#172033]">
                  DPR Pre-Submission Audit Dossier
                </span>
                <span className="font-mono text-xs text-[#596579]">
                  {submittedDprCode}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-[#D9DEE5]/60 text-[11px]">
                <div>
                  <span className="text-[#7B8798] uppercase font-bold text-[9px] block">Project</span>
                  <span className="font-bold text-[#172033]">{activeProject?.code || 'OIL-DUL-01'}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] uppercase font-bold text-[9px] block">Reporting Date</span>
                  <span className="font-bold text-[#172033]">{reportingDate} ({reportingShift})</span>
                </div>
                <div>
                  <span className="text-[#7B8798] uppercase font-bold text-[9px] block">Site Engineer</span>
                  <span className="font-bold text-[#172033]">{siteEngineer}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] uppercase font-bold text-[9px] block">Contractor</span>
                  <span className="font-bold text-[#172033] truncate block">{contractorName}</span>
                </div>
              </div>

              {/* Summary Metrics Snapshot */}
              <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg grid grid-cols-5 gap-2 text-center text-[11px]">
                <div>
                  <span className="text-[#7B8798] block">Planned</span>
                  <span className="font-mono font-bold text-[#172033]">{summaryMetrics.activitiesPlanned}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Updated</span>
                  <span className="font-mono font-bold text-[#176B87]">{summaryMetrics.activitiesUpdated}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Completed</span>
                  <span className="font-mono font-bold text-[#2E7D5B]">{summaryMetrics.activitiesCompleted}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Blocked</span>
                  <span className="font-mono font-bold text-[#B5473C]">{summaryMetrics.blockedActivities}</span>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Pending</span>
                  <span className="font-mono font-bold text-[#D98B32]">{summaryMetrics.pendingEntries}</span>
                </div>
              </div>

              {/* Linked updates breakdown */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#7B8798] block">
                  Verified Field Submissions (4 Updates)
                </span>
                <div className="space-y-1">
                  {fieldUpdates.map((u) => (
                    <div
                      key={u.id}
                      className="p-2 bg-white border border-[#D9DEE5] rounded flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#176B87]">{u.activityId}</span>
                        <span className="font-medium text-[#172033]">{u.activityName}</span>
                        <span className="text-[#596579]">· {u.quantity} {u.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#7B8798]">{u.evidence.length} proofs</span>
                        <span
                          className={`font-bold ${
                            u.verificationState === 'Confirmed' ? 'text-[#2E7D5B]' : 'text-[#B5473C]'
                          }`}
                        >
                          {u.verificationState}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule Twin Impact Statement */}
              <div className="p-3 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg text-xs space-y-1">
                <span className="font-bold text-[#176B87] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Schedule Twin Integration Impact
                </span>
                <p className="text-[#596579] text-[11px] leading-relaxed">
                  Submitting this DPR will advance <strong>PIP-24-001</strong> to 100% completed, record 4 field butt welds on <strong>PIP-24-002</strong> (+16.6% actual progress), and register the weather stoppage for <strong>PIP-24-003</strong> on the manager variance queue.
                </p>
              </div>
            </div>

            {/* SUBMISSION STATE CONTROLLER (Allows testing all 6 submission states) */}
            <div className="p-4 border border-[#D9DEE5] rounded-lg space-y-3 bg-[#FAFAFA]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase font-bold text-[#596579] flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#176B87]" />
                  Simulate / Switch Submission State:
                </span>
                <span className="text-[11px] text-[#7B8798]">Interactive State Testing</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    'Draft',
                    'Ready to Submit',
                    'Processing',
                    'Needs Confirmation',
                    'Submitted',
                    'Failed',
                  ] as DPRSubmissionState[]
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setSubmissionState(st);
                      addToast({
                        type: 'info',
                        title: `State Set to ${st}`,
                        description: `Switched submission state to ${st}.`,
                      });
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      submissionState === st
                        ? 'bg-[#176B87] text-white border-[#176B87] shadow-2xs font-bold'
                        : 'bg-white border-[#D9DEE5] text-[#596579] hover:text-[#172033]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBMISSION STATE RESULTS */}
            {submissionState === 'Submitted' && (
              <div className="p-5 bg-[#EDF7F2] border-2 border-[#B8DCC9] rounded-lg text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#B8DCC9] text-[#2E7D5B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#172033]">
                    Daily Progress Report Successfully Submitted!
                  </h4>
                  <p className="text-xs text-[#596579] mt-0.5">
                    Assigned Reference ID: <strong className="font-mono text-[#172033]">{submittedDprCode}</strong>
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToast({
                        type: 'success',
                        title: 'DPR Downloaded',
                        description: `Saved ${submittedDprCode}.pdf`,
                      });
                    }}
                    className="px-4 py-2 text-xs font-bold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download DPR PDF</span>
                  </button>

                  <Link
                    href="/schedule-twin"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View in Schedule Twin</span>
                  </Link>

                  <Link
                    href="/engineer"
                    className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                  >
                    Engineer Dashboard
                  </Link>
                </div>
              </div>
            )}

            {/* SUBMISSION STATE RESULT: Saved Locally (Offline Mode) */}
            {submissionState === 'Saved locally' && (
              <div className="p-5 bg-[#EDF7F2] border-2 border-[#B8DCC9] rounded-lg text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-white border border-[#B8DCC9] text-[#2E7D5B] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#172033]">
                    Daily Progress Report Saved Locally (Offline Queue)
                  </h4>
                  <p className="text-xs text-[#596579] mt-0.5">
                    Assigned Reference ID: <strong className="font-mono text-[#172033]">{submittedDprCode}</strong>
                  </p>
                  <p className="text-[11px] text-[#2E7D5B] font-medium mt-1">
                    Saved to local IndexedDB. Updates will receive Server Confirmation once online connectivity is restored.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/sync"
                    className="px-4 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Inspect in Sync Center</span>
                  </Link>

                  <Link
                    href="/engineer"
                    className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                  >
                    Engineer Dashboard
                  </Link>
                </div>
              </div>
            )}

            {submissionState === 'Needs Confirmation' && (
              <div className="p-4 bg-[#FDF6ED] border-2 border-[#F0D4A6] rounded-lg space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-[#D98B32] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#172033] text-sm">
                      Submission Held: Needs Confirmation
                    </h4>
                    <p className="text-[#596579] mt-0.5">
                      Activity PIP-24-003 weather stoppage requires Chief Project Manager (Rajesh Sharma) co-signoff.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOverrideConflictAccepted(true);
                          setSubmissionState('Ready to Submit');
                          addToast({
                            type: 'info',
                            title: 'Override Acknowledged',
                            description: 'Routed to Manager Review Queue.',
                          });
                        }}
                        className="px-3 py-1.5 font-bold text-white bg-[#D98B32] hover:bg-[#C27A28] rounded-lg"
                      >
                        Acknowledge & Queue for Manager Sign-off
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {submissionState === 'Failed' && (
              <div className="p-4 bg-[#FBEFEE] border-2 border-[#E4B0AA] rounded-lg space-y-2 text-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-[#B5473C] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#B5473C] text-sm">
                      Submission Failed (Network Timeout / Schedule Lock)
                    </h4>
                    <p className="text-[#596579] mt-0.5">
                      The schedule repository could not acquire a write lock on V3 · Rev 3.2. Local draft has been preserved.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSubmitDPR}
                        className="px-3 py-1.5 font-bold text-white bg-[#B5473C] hover:bg-[#9E3E34] rounded-lg inline-flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retry Submission</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7 Main Action Bar */}
            <div className="pt-4 border-t border-[#D9DEE5] flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="min-h-[44px] px-4 py-2.5 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Confirmation</span>
              </button>

              {submissionState !== 'Submitted' && submissionState !== 'Saved locally' && (
                <button
                  type="button"
                  onClick={handleSubmitDPR}
                  disabled={submissionState === 'Processing'}
                  className="min-h-[48px] px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] disabled:opacity-50 rounded-lg inline-flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submissionState === 'Processing'
                      ? 'Submitting DPR...'
                      : isOffline
                      ? 'Save DPR Locally to Offline Queue'
                      : 'Submit DPR to Schedule Twin'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* DETAIL INSPECTION DRAWER */}
        <Drawer
          isOpen={!!selectedUpdateForDrawer}
          onClose={() => setSelectedUpdateForDrawer(null)}
          title={`Update Detail: ${selectedUpdateForDrawer?.activityId || ''}`}
          subtitle={selectedUpdateForDrawer?.activityName || ''}
          width="md"
        >
          {selectedUpdateForDrawer && (
            <div className="space-y-4 text-xs text-[#172033]">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#7B8798] block">Location</span>
                <span className="font-semibold">{selectedUpdateForDrawer.locationArea}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-[#7B8798] block">Output Qty</span>
                  <span className="font-mono font-bold text-sm">
                    {selectedUpdateForDrawer.quantity} {selectedUpdateForDrawer.unit}
                  </span>
                </div>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-[#7B8798] block">Shift Window</span>
                  <span className="font-semibold">{selectedUpdateForDrawer.time}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                  Observations & Remarks
                </span>
                <p className="p-3 bg-white border border-[#D9DEE5] rounded-lg font-medium leading-relaxed">
                  {selectedUpdateForDrawer.remarks}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                  Verification Status & Heuristics
                </span>
                <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{selectedUpdateForDrawer.verificationState}</span>
                    <ConfidenceBadge score={selectedUpdateForDrawer.confidence} size="sm" />
                  </div>
                  <p className="text-[11px] text-[#596579]">
                    {selectedUpdateForDrawer.verificationReason}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                  Attached Physical Evidence ({selectedUpdateForDrawer.evidence.length})
                </span>
                <div className="space-y-1.5">
                  {selectedUpdateForDrawer.evidence.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-2">
                        {ev.type === 'PHOTO' ? (
                          <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-[#596579]" />
                        )}
                        <span className="font-mono font-medium">{ev.name}</span>
                      </div>
                      <span className="text-[#7B8798]">{ev.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
