'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
import { AppShell } from '../../../components/shell/AppShell';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { Drawer } from '../../../components/shared/Drawer';
import { ProgressBar } from '../../../components/shared/ProgressBar';
import { ConfidenceBadge } from '../../../components/shared/ConfidenceBadge';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { DisciplineType } from '../../../types';
import {
  FileText,
  Camera,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  Save,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  Calendar,
  User,
  Folder,
  Layers,
  ChevronDown,
  Info,
  Check,
  Plus,
  Minus,
  Edit3,
  ShieldAlert,
  SlidersHorizontal,
  HardHat,
  Share2,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

// Field confidence / verification state per requirement
export type FieldConfidenceState = 'Confirmed' | 'Needs Confirmation' | 'Unknown' | 'Conflict';

export interface FieldItem<T = string | number> {
  value: T;
  state: FieldConfidenceState;
  reason: string;
  isUserModified?: boolean;
}

export interface ExtractedExecutionInfo {
  workType: FieldItem<string>;
  quantity: FieldItem<number>;
  unit: FieldItem<string>;
  areaLine: FieldItem<string>;
  date: FieldItem<string>;
  time: FieldItem<string>;
  discipline: FieldItem<DisciplineType>;
  remarks: FieldItem<string>;
}

const DEFAULT_EXTRACTED_INFO: ExtractedExecutionInfo = {
  workType: {
    value: 'Installation',
    state: 'Confirmed',
    reason: 'Extracted from action verb "installed"',
  },
  quantity: {
    value: 12,
    state: 'Confirmed',
    reason: 'Exact count "12" detected in statement',
  },
  unit: {
    value: 'spools',
    state: 'Confirmed',
    reason: 'Industrial unit "spools" recognized for piping',
  },
  areaLine: {
    value: 'Line 24',
    state: 'Confirmed',
    reason: 'Asset tag "Line 24" matches schedule WBS PIP-24',
  },
  date: {
    value: '2026-09-18',
    state: 'Confirmed',
    reason: 'Shift execution date aligned with current reporting period',
  },
  time: {
    value: '09:00 - 15:30',
    state: 'Confirmed',
    reason: 'Shift window "09:00 to 15:30" parsed (6.5 hours)',
  },
  discipline: {
    value: 'Piping',
    state: 'Confirmed',
    reason: 'Piping spools and line erection discipline match',
  },
  remarks: {
    value: '12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.',
    state: 'Confirmed',
    reason: 'Complete field statement logged without safety impediments',
  },
};

const SAMPLE_STATEMENTS = [
  {
    label: 'Standard Piping (Line 24)',
    text: '12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.',
    discipline: 'Piping',
  },
  {
    label: 'Civil Raft Pour (Unit 02)',
    text: 'Foundation raft concrete pour completed at Unit 02 flare knock-out drum. 45 m3 poured from 08:00 to 16:00.',
    discipline: 'Civil',
  },
  {
    label: 'Electrical Cable Pulling',
    text: 'Pulled 350 meters HT power cable on Tray TR-04. Shift 08:30 to 14:00. Tagging verification pending.',
    discipline: 'Electrical',
  },
  {
    label: 'Weather Delay & Conflict',
    text: 'Welding paused due to heavy monsoon rain. 2 spools remaining on Line 24. Only 3 welders reported on site.',
    discipline: 'Piping',
  },
];

export default function FieldCapturePage() {
  const router = useRouter();
  const { activeProject } = useApp();
  const { addToast } = useToast();
  const { isOffline, effectiveStatus, captureFieldUpdate } = useOffline();
  const [offlineSubmissionSaved, setOfflineSubmissionSaved] = useState(false);

  // Header metadata
  const projectCode = activeProject?.code || 'OIL-DUL-01';
  const projectName = activeProject?.name || 'Duliajan Gas Gathering Station-4';
  const reportingDate = '18 Sep 2026';
  const siteEngineer = 'Debajit Borah';
  const engineerRole = 'Lead Site Execution Engineer';

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'text' | 'photo' | 'document' | 'structured'>('text');

  // Input states
  const [fieldText, setFieldText] = useState(
    '12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.'
  );
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Photo & Document state
  const [selectedPhoto, setSelectedPhoto] = useState<string>('photo_line24.jpg');
  const [selectedDoc, setSelectedDoc] = useState<string>('DPR_OIL_DULIAJAN_SHIFT_A.pdf');

  // Extraction lifecycle state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractionStepText, setExtractionStepText] = useState('');
  const [hasExtracted, setHasExtracted] = useState(true); // Default to extracted for instant reviewability
  const [extractionFailed, setExtractionFailed] = useState(false);
  const [manualFallbackActive, setManualFallbackActive] = useState(false);

  // Extracted Execution Information (all 8 fields editable)
  const [executionInfo, setExecutionInfo] = useState<ExtractedExecutionInfo>(DEFAULT_EXTRACTED_INFO);

  // Draft state
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>('Today, 10:15 AM');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Review drawer state
  const [isReviewDrawerOpen, setIsReviewDrawerOpen] = useState(false);

  // Voice recording timer simulation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Voice dictation toggle
  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      addToast({
        type: 'info',
        title: 'Voice Dictation Started',
        description: 'Listening for field observation statement...',
      });
    } else {
      setIsRecordingVoice(false);
      setFieldText((prev) =>
        prev
          ? `${prev} Additional observation recorded via voice: inspection completed at 15:30 with zero incidents.`
          : '12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.'
      );
      addToast({
        type: 'success',
        title: 'Voice Transcribed',
        description: 'Audio statement converted to text field log.',
      });
    }
  };

  // Heuristic parser to extract execution information from text
  const parseStatement = (text: string): ExtractedExecutionInfo => {
    const lower = text.toLowerCase();

    // 1. Discipline
    let discipline: DisciplineType = 'Piping';
    let disciplineState: FieldConfidenceState = 'Confirmed';
    let disciplineReason = 'Discipline matched via industrial keywords';
    if (lower.includes('civil') || lower.includes('concrete') || lower.includes('raft') || lower.includes('foundation') || lower.includes('excavation')) {
      discipline = 'Civil';
      disciplineReason = 'Detected civil engineering keywords (concrete / foundation / raft)';
    } else if (lower.includes('cable') || lower.includes('tray') || lower.includes('electrical') || lower.includes('power') || lower.includes('substation')) {
      discipline = 'Electrical';
      disciplineReason = 'Detected electrical keywords (cable / tray / substation)';
    } else if (lower.includes('pump') || lower.includes('compressor') || lower.includes('skid') || lower.includes('mechanical')) {
      discipline = 'Mechanical';
      disciplineReason = 'Detected mechanical equipment keywords (compressor / skid / pump)';
    } else if (lower.includes('instrument') || lower.includes('transmitter') || lower.includes('gauge') || lower.includes('sensor')) {
      discipline = 'Instrumentation';
      disciplineReason = 'Detected instrumentation & controls keywords';
    } else if (lower.includes('spool') || lower.includes('line') || lower.includes('pipe') || lower.includes('weld')) {
      discipline = 'Piping';
      disciplineReason = 'Detected piping keywords (spools / line / welding)';
    } else {
      disciplineState = 'Unknown';
      disciplineReason = 'Discipline could not be inferred unambiguously';
    }

    // 2. Work Type
    let workType = 'Installation';
    let workTypeState: FieldConfidenceState = 'Confirmed';
    let workTypeReason = 'Standard installation action verb';
    if (lower.includes('install')) {
      workType = 'Installation';
      workTypeReason = 'Extracted from verb "installed"';
    } else if (lower.includes('weld')) {
      workType = 'Welding';
      workTypeReason = 'Extracted from action "welding"';
    } else if (lower.includes('erect')) {
      workType = 'Erection';
      workTypeReason = 'Extracted from structural "erection"';
    } else if (lower.includes('pour')) {
      workType = 'Concrete Pour';
      workTypeReason = 'Extracted from "concrete pour"';
    } else if (lower.includes('pull')) {
      workType = 'Cable Pulling';
      workTypeReason = 'Extracted from "cable pulling"';
    } else if (lower.includes('hydrotest') || lower.includes('test')) {
      workType = 'Hydrostatic Testing';
      workTypeReason = 'Extracted from testing procedures';
    } else if (lower.includes('excavat')) {
      workType = 'Excavation';
      workTypeReason = 'Extracted from earthwork excavation';
    } else {
      workType = 'General Execution';
      workTypeState = 'Needs Confirmation';
      workTypeReason = 'No standard work verb detected';
    }

    // 3. Quantity & Unit
    let quantity = 12;
    let unit = 'spools';
    let qtyState: FieldConfidenceState = 'Confirmed';
    let unitState: FieldConfidenceState = 'Confirmed';
    let qtyReason = 'Numeric quantity detected';
    let unitReason = 'Recognized unit of measure';

    const qtyMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(spools|meters|m3|m³|joints|cables|units|tons|welders)?/i);
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
      qtyReason = `Exact numeric "${quantity}" extracted from text`;
      if (qtyMatch[2]) {
        unit = qtyMatch[2].toLowerCase();
        unitReason = `Unit "${unit}" matched industrial vocabulary`;
        if (unit === 'welders') {
          qtyState = 'Needs Confirmation';
          unitState = 'Conflict';
          unitReason = 'Unit "welders" indicates labor resource, not installed progress output';
        }
      } else {
        unit = 'units';
        unitState = 'Unknown';
        unitReason = 'Missing explicit unit of measure; defaulted to generic units';
      }
    } else {
      quantity = 0;
      qtyState = 'Unknown';
      qtyReason = 'No numeric quantity found in field statement';
      unitState = 'Unknown';
      unitReason = 'Unit undetermined';
    }

    // 4. Area / Line
    let areaLine = 'Line 24';
    let areaLineState: FieldConfidenceState = 'Confirmed';
    let areaLineReason = 'Target line/area identified';
    const lineMatch = text.match(/(?:line|tray|unit|rack|area)[-\s]?([0-9]+[a-z0-9-]*)/i);
    if (lineMatch) {
      areaLine = lineMatch[0];
      areaLineReason = `Extracted location identifier "${areaLine}"`;
      if (lower.includes('r-2') || lower.includes('tr-04')) {
        areaLineState = 'Needs Confirmation';
        areaLineReason = `Location "${areaLine}" requires exact WBS mapping verification`;
      }
    } else {
      areaLine = 'Site Unassigned Area';
      areaLineState = 'Unknown';
      areaLineReason = 'No line number or unit area detected';
    }

    // 5. Shift Times
    let time = '09:00 - 15:30';
    let timeState: FieldConfidenceState = 'Confirmed';
    let timeReason = 'Shift start and end times identified';
    const timeMatch = text.match(/([0-2]?[0-9]:[0-5][0-9])\s*(?:to|-|and finished at)\s*([0-2]?[0-9]:[0-5][0-9])/i);
    if (timeMatch) {
      time = `${timeMatch[1]} - ${timeMatch[2]}`;
      timeReason = `Parsed work window from ${timeMatch[1]} to ${timeMatch[2]}`;
    } else if (text.match(/([0-2]?[0-9]:[0-5][0-9])/)) {
      const single = text.match(/([0-2]?[0-9]:[0-5][0-9])/)![1];
      time = single;
      timeState = 'Needs Confirmation';
      timeReason = `Single timestamp "${single}" found; duration unconfirmed`;
    } else {
      time = 'Shift General Hours';
      timeState = 'Unknown';
      timeReason = 'No timestamp or shift range found in text';
    }

    // 6. Conflict / Rain / Weather detection in Remarks
    let remarksState: FieldConfidenceState = 'Confirmed';
    let remarksReason = 'Field log recorded without impediment flags';
    if (lower.includes('rain') || lower.includes('pause') || lower.includes('delay') || lower.includes('weather') || lower.includes('incident')) {
      remarksState = 'Conflict';
      remarksReason = 'Impediment keyword detected (weather / delay / stoppage flag)';
    }

    return {
      workType: { value: workType, state: workTypeState, reason: workTypeReason },
      quantity: { value: quantity, state: qtyState, reason: qtyReason },
      unit: { value: unit, state: unitState, reason: unitReason },
      areaLine: { value: areaLine, state: areaLineState, reason: areaLineReason },
      date: { value: '2026-09-18', state: 'Confirmed', reason: 'Matches project reporting date 18 Sep 2026' },
      time: { value: time, state: timeState, reason: timeReason },
      discipline: { value: discipline, state: disciplineState, reason: disciplineReason },
      remarks: { value: text, state: remarksState, reason: remarksReason },
    };
  };

  // Primary Action: Extract Information with animated processing state
  const handleExtractInformation = async () => {
    if (!fieldText.trim()) {
      addToast({
        type: 'warning',
        title: 'Input Required',
        description: 'Please describe today’s field execution observation before extracting.',
      });
      return;
    }

    setIsExtracting(true);
    setExtractionProgress(10);
    setExtractionStepText('1/4 Analyzing natural language field statement...');
    setExtractionFailed(false);
    setManualFallbackActive(false);

    try {
      // Step 1
      await new Promise((r) => setTimeout(r, 220));
      setExtractionProgress(35);
      setExtractionStepText('2/4 Identifying discipline, asset tags & line references...');

      // Step 2
      await new Promise((r) => setTimeout(r, 240));
      setExtractionProgress(70);
      setExtractionStepText('3/4 Normalizing quantities, units & shift work windows...');

      // Step 3
      await new Promise((r) => setTimeout(r, 240));
      setExtractionProgress(95);
      setExtractionStepText('4/4 Evaluating confidence thresholds & conflict heuristics...');

      // Step 4
      await new Promise((r) => setTimeout(r, 180));
      setExtractionProgress(100);

      const parsed = parseStatement(fieldText);
      setExecutionInfo(parsed);
      setHasExtracted(true);

      addToast({
        type: 'success',
        title: 'Information Extracted',
        description: 'Parameters extracted into editable execution ledger.',
      });
    } catch {
      setExtractionFailed(true);
      setManualFallbackActive(true);
      addToast({
        type: 'critical',
        title: 'Extraction Error',
        description: 'Automated extraction service failed. Manual fallback enabled.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Simulate Extraction Failure / Manual Fallback Test
  const handleSimulateExtractionFailure = () => {
    setIsExtracting(true);
    setExtractionProgress(20);
    setExtractionStepText('Connecting to NLP extraction service...');

    setTimeout(() => {
      setIsExtracting(false);
      setExtractionFailed(true);
      setManualFallbackActive(true);
      setHasExtracted(true);
      addToast({
        type: 'critical',
        title: 'Extraction Timed Out',
        description: 'Switched to Manual Entry Fallback. Enter execution details directly.',
      });
    }, 450);
  };

  // Handle direct switch to manual fallback
  const handleSwitchToManualFallback = () => {
    setManualFallbackActive(true);
    setExtractionFailed(false);
    setHasExtracted(true);
    addToast({
      type: 'info',
      title: 'Manual Entry Fallback Active',
      description: 'You can now manually specify all 8 execution parameters.',
    });
  };

  // Update a field's value and automatically mark it as Confirmed (User Verified)
  const handleUpdateFieldValue = <K extends keyof ExtractedExecutionInfo>(
    fieldKey: K,
    val: ExtractedExecutionInfo[K]['value']
  ) => {
    setExecutionInfo((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        value: val,
        state: 'Confirmed',
        isUserModified: true,
        reason: 'Manually verified and confirmed by Site Engineer',
      },
    }));
  };

  // Manually update a field's confidence state
  const handleUpdateFieldState = (
    fieldKey: keyof ExtractedExecutionInfo,
    newState: FieldConfidenceState
  ) => {
    setExecutionInfo((prev) => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        state: newState,
        isUserModified: true,
      },
    }));
    addToast({
      type: 'info',
      title: 'Confidence Status Updated',
      description: `Marked "${fieldKey}" as ${newState}.`,
    });
  };

  // Secondary Action: Save Draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Store structured draft in IndexedDB
    await captureFieldUpdate({
      projectId: activeProject?.id || 'PRJ-OIL-2026-01',
      activityId: 'PIP-24-001',
      activityName: 'Erect Line 24-XX High Pressure Gas Header',
      quantity: executionInfo.quantity.value,
      unit: executionInfo.unit.value,
      date: executionInfo.date.value,
      time: executionInfo.time.value,
      discipline: executionInfo.discipline.value,
      areaLine: executionInfo.areaLine.value,
      remarks: executionInfo.remarks.value || fieldText,
      verificationState: 'Draft',
    });

    setDraftSavedAt(`Today, ${timeStr}`);
    setIsSavingDraft(false);

    addToast({
      type: 'success',
      title: 'Draft Saved Locally',
      description: `Saved to IndexedDB storage at ${timeStr}. Safe to close or resume offline.`,
    });
  };

  // Next: Review Extracted Data
  const handleOpenReview = () => {
    setIsReviewDrawerOpen(true);
  };

  const handleConfirmAndProceedToMatching = async () => {
    setIsReviewDrawerOpen(false);

    const res = await captureFieldUpdate({
      projectId: activeProject?.id || 'PRJ-OIL-2026-01',
      activityId: 'PIP-24-001',
      activityName: 'Erect Line 24-XX High Pressure Gas Header',
      quantity: executionInfo.quantity.value,
      unit: executionInfo.unit.value,
      date: executionInfo.date.value,
      time: executionInfo.time.value,
      discipline: executionInfo.discipline.value,
      areaLine: executionInfo.areaLine.value,
      remarks: executionInfo.remarks.value || fieldText,
      verificationState: 'Confirmed',
    });

    if (isOffline) {
      setOfflineSubmissionSaved(true);
      addToast({
        type: 'warning',
        title: 'Saved locally',
        description: 'Offline Mode active. Update queued in IndexedDB. Will become Server Confirmed once online.',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Server confirmed',
        description: 'Execution data successfully submitted and verified against schedule baseline.',
      });
      router.push('/matching');
    }
  };

  // Helper styles for Confidence/State badges
  const getFieldStateStyle = (state: FieldConfidenceState) => {
    switch (state) {
      case 'Confirmed':
        return {
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
          icon: CheckCircle2,
          description: 'High Confidence · Verified',
        };
      case 'Needs Confirmation':
        return {
          bg: 'bg-[#FDF6ED]',
          border: 'border-[#F0D4A6]',
          text: 'text-[#D98B32]',
          icon: AlertTriangle,
          description: 'Ambiguous · Requires Site Review',
        };
      case 'Conflict':
        return {
          bg: 'bg-[#FBEFEE]',
          border: 'border-[#E4B0AA]',
          text: 'text-[#B5473C]',
          icon: AlertCircle,
          description: 'Conflict / Impediment Flag',
        };
      case 'Unknown':
      default:
        return {
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
          icon: HelpCircle,
          description: 'Missing · Undetermined',
        };
    }
  };

  const breadcrumbItems = [
    { label: 'Field Execution', href: '/engineer' },
    { label: 'Field Capture', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* OFFLINE MODE BANNER (Priority 2 Requirement 3) */}
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
            <span className="text-[11px] text-[#78350F] hidden sm:inline font-mono">
              IndexedDB Storage Active
            </span>
          </div>
        )}

        {/* Offline Submission Confirmation (Priority 2 Requirement 8) */}
        {offlineSubmissionSaved && (
          <div className="p-4 bg-[#EDF7F2] border-2 border-[#B8DCC9] rounded-xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#2E7D5B] font-bold">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>Saved locally in offline queue. Will show as Server Confirmed once synchronized.</span>
            </div>
            <Link href="/sync" className="px-3 py-1.5 bg-[#176B87] hover:bg-[#135A72] text-white rounded-lg font-bold">
              View Sync Queue
            </Link>
          </div>
        )}

        {/* 1. HEADER: Field Capture, Project, Date, Engineer */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <HardHat className="w-3.5 h-3.5" />
                  Field Ingestion
                </span>
                {isOffline ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D98B32]" />
                    Offline Mode · Local Storage
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B] animate-pulse" />
                    Online · Live Transmission
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Field Capture</h1>
              <p className="text-xs text-[#596579] mt-0.5">
                Fast site observation intake with deterministic entity extraction and engineer verification.
              </p>
            </div>

            {/* Quick Actions in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] active:scale-95 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 text-[#596579]" />
                <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
              </button>

              <Link
                href="/engineer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#176B87] hover:text-[#135A72] hover:bg-[#EDF5F8] border border-transparent rounded-lg transition-colors"
              >
                <span>Engineer Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Explicit Header Info Matrix: Project / Date / Engineer */}
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

            {/* Date */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]/80">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Date
                </span>
                <span className="font-bold text-[#172033] block">
                  {reportingDate}
                </span>
                <span className="text-[11px] text-[#596579] block">
                  Shift A (07:00 – 16:30)
                </span>
              </div>
            </div>

            {/* Engineer */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F7F8FA] border border-[#D9DEE5]/80">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D9DEE5] flex items-center justify-center text-[#176B87] shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider block">
                  Site Engineer
                </span>
                <span className="font-bold text-[#172033] block truncate">
                  {siteEngineer}
                </span>
                <span className="text-[11px] text-[#596579] block truncate">
                  {engineerRole}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. INPUT METHODS BAR: Text | Photo | Document | Structured Entry */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
          <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] overflow-x-auto">
            {[
              { id: 'text', label: 'Text Field Statement', icon: FileText, badge: 'Recommended' },
              { id: 'photo', label: 'Photo & Inspection OCR', icon: Camera },
              { id: 'document', label: 'Document & DPR Upload', icon: Upload },
              { id: 'structured', label: 'Structured Entry Form', icon: SlidersHorizontal },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors min-h-[48px] ${
                    isActive
                      ? 'border-[#176B87] text-[#176B87] bg-white'
                      : 'border-transparent text-[#596579] hover:text-[#172033] hover:bg-[#F0F2F5]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#EDF5F8] text-[#176B87]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-5 md:p-6 space-y-5">
            {/* TAB CONTENT: 1. TEXT (Large Primary Input) */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label
                    htmlFor="field-statement"
                    className="text-base font-bold text-[#172033] flex items-center gap-2"
                  >
                    <span>What happened today?</span>
                    <span className="text-xs font-normal text-[#8A94A6]">
                      (Primary field log)
                    </span>
                  </label>

                  {/* Voice recording toggle button */}
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isRecordingVoice
                        ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA] animate-pulse'
                        : 'bg-[#F0F2F5] text-[#172033] border-[#D9DEE5] hover:bg-[#E8EBF0]'
                    }`}
                  >
                    {isRecordingVoice ? (
                      <>
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Stop Voice Recording ({recordingSeconds}s)</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-[#176B87]" />
                        <span>Dictate Voice Note</span>
                      </>
                    )}
                  </button>
                </div>

                {/* LARGE PRIMARY INPUT WITH EXACT PLACEHOLDER */}
                <div className="relative">
                  <textarea
                    id="field-statement"
                    rows={4}
                    value={fieldText}
                    onChange={(e) => setFieldText(e.target.value)}
                    placeholder="12 spools installed on Line 24. Work started at 09:00 and finished at 15:30."
                    className="w-full p-4 text-sm md:text-base text-[#172033] bg-[#FAFAFA] focus:bg-white border-2 border-[#D9DEE5] focus:border-[#176B87] rounded-xl outline-hidden font-normal leading-relaxed transition-all shadow-inner placeholder:text-[#8A94A6]"
                  />
                  {fieldText && (
                    <button
                      type="button"
                      onClick={() => setFieldText('')}
                      className="absolute top-3 right-3 text-xs text-[#8A94A6] hover:text-[#172033] bg-white/80 px-2 py-0.5 rounded border border-[#D9DEE5]"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Voice recording wave animation */}
                {isRecordingVoice && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FBEFEE] border border-[#E4B0AA] text-xs text-[#B5473C]">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-4 bg-[#B5473C] rounded-full animate-bounce" />
                      <span className="w-1.5 h-6 bg-[#B5473C] rounded-full animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-3 bg-[#B5473C] rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                    <span className="font-medium">
                      Audio engine listening... Speak clearly regarding activity, line number, and units completed.
                    </span>
                  </div>
                )}

                {/* Quick Presets / Observation Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                    Sample Field Presets (Tap to load):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_STATEMENTS.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFieldText(s.text);
                          addToast({
                            type: 'info',
                            title: 'Sample Statement Loaded',
                            description: `Loaded: ${s.label}`,
                          });
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left ${
                          fieldText === s.text
                            ? 'bg-[#EDF5F8] border-[#176B87] text-[#176B87] font-semibold'
                            : 'bg-white border-[#D9DEE5] text-[#596579] hover:text-[#172033] hover:border-[#B0B8C9]'
                        }`}
                      >
                        <span className="font-semibold text-[#172033]">{s.label}: </span>
                        <span className="truncate max-w-[200px] inline-block align-bottom text-[#596579]">
                          "{s.text.slice(0, 32)}..."
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. PHOTO */}
            {activeTab === 'photo' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#D9DEE5] rounded-xl p-6 text-center hover:bg-[#F7F8FA] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87] mx-auto mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Upload or Capture Site Inspection Photo
                  </h3>
                  <p className="text-xs text-[#596579] max-w-md mx-auto mt-1 mb-4">
                    PLnEX will automatically extract line identifiers, spool numbers, and work progress from timestamped EXIF and visual tags.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPhoto('IMG_20260918_LINE24_SPOOL_ERECTION.jpg');
                        setFieldText('12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.');
                        addToast({
                          type: 'success',
                          title: 'Photo Uploaded & OCR Scanned',
                          description: 'Detected Line 24 spool assembly with 12 completed welds.',
                        });
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
                    >
                      Load Sample Site Photo (Line 24)
                    </button>
                    <label className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg">
                      <span>Choose From Camera Roll</span>
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                {/* Photo details preview */}
                <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D5B]" />
                    <span className="font-mono font-medium text-[#172033]">{selectedPhoto}</span>
                    <span className="text-[#8A94A6]">· GPS: 27.3582° N, 95.3194° E (Unit A)</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#176B87] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                    OCR Ready
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. DOCUMENT */}
            {activeTab === 'document' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-[#D9DEE5] rounded-xl p-6 text-center hover:bg-[#F7F8FA] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87] mx-auto mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#172033]">
                    Upload Daily Progress Report (DPR PDF / Excel)
                  </h3>
                  <p className="text-xs text-[#596579] max-w-md mx-auto mt-1 mb-4">
                    Ingest formal contractor daily reports, inspector sign-off memos, or shift handovers.
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDoc('DPR_OIL_DULIAJAN_20260918_SHIFT_A.pdf');
                        setFieldText('12 spools installed on Line 24. Work started at 09:00 and finished at 15:30.');
                        addToast({
                          type: 'success',
                          title: 'DPR Document Parsed',
                          description: 'Extracted Section 3.2: Line 24 Spool Progress.',
                        });
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs"
                    >
                      Load Sample Shift A DPR
                    </button>
                    <label className="cursor-pointer px-4 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg">
                      <span>Browse Files (.pdf, .xlsx)</span>
                      <input type="file" accept=".pdf,.xlsx,.csv" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#176B87]" />
                    <span className="font-mono font-medium text-[#172033]">{selectedDoc}</span>
                    <span className="text-[#8A94A6]">· 2.4 MB · Shift A Verified</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#2E7D5B] bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#B8DCC9]">
                    Tables Extracted
                  </span>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 4. STRUCTURED ENTRY */}
            {activeTab === 'structured' && (
              <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033] flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-[#176B87]" />
                    Direct Structured Mode
                  </span>
                  <span className="text-[11px] text-[#596579]">
                    Bypasses natural language processing directly into the execution ledger.
                  </span>
                </div>
                <p className="text-[#596579]">
                  Edit fields directly in the Execution Information section below. All changes will be saved to your shift submission.
                </p>
              </div>
            )}

            {/* ACTION ROW: Primary Action "Extract Information" & Fallback Controls */}
            <div className="pt-2 border-t border-[#D9DEE5]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* PRIMARY ACTION: Extract Information */}
                <button
                  type="button"
                  onClick={handleExtractInformation}
                  disabled={isExtracting || !fieldText.trim()}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 text-sm font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-all inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>{isExtracting ? 'Extracting Information...' : 'Extract Information'}</span>
                </button>

                {/* Secondary helper: Test fallback */}
                <button
                  type="button"
                  onClick={handleSwitchToManualFallback}
                  className="px-3.5 py-3 min-h-[48px] text-xs font-semibold text-[#596579] hover:text-[#172033] hover:bg-[#F0F2F5] border border-transparent rounded-xl transition-colors whitespace-nowrap"
                  title="Directly enter fields without running AI entity extraction"
                >
                  Enter Manually
                </button>
              </div>

              {/* Status indicator and simulation tool */}
              <div className="flex items-center gap-3 text-xs text-[#596579] w-full sm:w-auto justify-end">
                {draftSavedAt && (
                  <span className="text-[11px] text-[#8A94A6]">
                    Draft saved: {draftSavedAt}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSimulateExtractionFailure}
                  className="text-[11px] text-[#8A94A6] hover:text-[#B5473C] underline transition-colors"
                  title="Simulate parser error to test fallback behavior"
                >
                  Simulate Failure
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. EXTRACTION PROCESSING STATE (Realistic animated stepper) */}
        {isExtracting && (
          <div className="bg-white border border-[#176B87]/30 rounded-xl p-6 shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87]">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[#172033]">
                  Processing Field Execution Statement
                </h4>
                <p className="text-xs text-[#176B87] font-medium mt-0.5">
                  {extractionStepText}
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-[#176B87]">
                {extractionProgress}%
              </span>
            </div>
            <ProgressBar actual={extractionProgress} size="md" showLabels={false} />
            <div className="mt-3 text-[11px] text-[#8A94A6] flex justify-between">
              <span>Deterministic NLP Pipeline & Heuristics</span>
              <span>Matching against project schedule baseline...</span>
            </div>
          </div>
        )}

        {/* 4. MANUAL ENTRY FALLBACK BANNER (When extraction fails or fallback is triggered) */}
        {(extractionFailed || manualFallbackActive) && (
          <div className="bg-[#FDF6ED] border-2 border-[#F0D4A6] rounded-xl p-4 md:p-5 text-xs text-[#D98B32] space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-[#D98B32] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-bold text-[#172033] text-sm">
                  Manual Entry Fallback Active
                </h4>
                <p className="text-[#596579] leading-relaxed">
                  {extractionFailed
                    ? 'Automated entity extraction encountered an ambiguity or communication interruption. Manual entry fallback has been engaged so you are never blocked.'
                    : 'Manual mode enabled. All 8 execution parameters are unlocked below for direct editing and validation.'}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleExtractInformation}
                    className="font-bold text-[#176B87] hover:underline inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Retry Automatic Extraction
                  </button>
                  <span className="text-[#D9DEE5]">|</span>
                  <span className="text-[11px] text-[#8A94A6]">
                    Fields edited manually will be tagged as "Confirmed (User Verified)"
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. HONEST AI / SYSTEM NOTICE: Do not claim extraction is always correct */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 md:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#EDF5F8] border border-[#B3CBE0] flex items-center justify-center text-[#176B87] shrink-0 mt-0.5">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-[#172033] text-sm">
                  Assistive Extraction Notice
                </h4>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  Human-in-the-Loop Protocol
                </span>
              </div>
              <p className="text-[#596579] leading-relaxed">
                PLnEX entity extraction is <strong>assistive and probabilistic</strong>. System heuristics may misinterpret shorthand, colloquial jargon, or uncalibrated units. <strong>Every extracted field must be verified by the Site Engineer</strong> before committing to the Schedule Twin and project baseline.
              </p>
              <div className="flex items-center gap-4 pt-1 text-[11px] text-[#8A94A6] flex-wrap">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                  <strong>Confirmed:</strong> High lexical match
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#D98B32]" />
                  <strong>Needs Confirmation:</strong> Ambiguous unit/location
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#596579]" />
                  <strong>Unknown:</strong> Missing parameter
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#B5473C]" />
                  <strong>Conflict:</strong> Discrepancy flag
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 6. EXTRACTED EXECUTION INFORMATION SECTION (All 8 Fields Editable) */}
        {hasExtracted && (
          <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
            {/* Section Header */}
            <div className="p-5 md:p-6 border-b border-[#D9DEE5] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#F7F8FA]">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg font-bold text-[#172033]">
                    Execution Information
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                    8 Parameters Extracted
                  </span>
                </div>
                <p className="text-xs text-[#596579]">
                  Every extracted field is directly editable. Adjust values or confidence ratings as needed before review.
                </p>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    // Mark all as Confirmed
                    setExecutionInfo((prev) => ({
                      workType: { ...prev.workType, state: 'Confirmed', isUserModified: true },
                      quantity: { ...prev.quantity, state: 'Confirmed', isUserModified: true },
                      unit: { ...prev.unit, state: 'Confirmed', isUserModified: true },
                      areaLine: { ...prev.areaLine, state: 'Confirmed', isUserModified: true },
                      date: { ...prev.date, state: 'Confirmed', isUserModified: true },
                      time: { ...prev.time, state: 'Confirmed', isUserModified: true },
                      discipline: { ...prev.discipline, state: 'Confirmed', isUserModified: true },
                      remarks: { ...prev.remarks, state: 'Confirmed', isUserModified: true },
                    }));
                    addToast({
                      type: 'success',
                      title: 'All Fields Confirmed',
                      description: 'Marked all 8 execution parameters as engineer-verified.',
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-[#D9DEE5] text-[#172033] hover:bg-[#F0F2F5] transition-colors"
                >
                  Confirm All Fields
                </button>
              </div>
            </div>

            {/* Form Grid: 8 Mandatory Fields */}
            <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* FIELD 1: Work Type */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Work Type
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.workType.state}
                    onSelect={(s) => handleUpdateFieldState('workType', s)}
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={executionInfo.workType.value}
                    onChange={(e) => handleUpdateFieldValue('workType', e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                  >
                    <option value="Installation">Installation</option>
                    <option value="Welding">Welding</option>
                    <option value="Erection">Erection</option>
                    <option value="Concrete Pour">Concrete Pour</option>
                    <option value="Cable Pulling">Cable Pulling</option>
                    <option value="Excavation">Excavation</option>
                    <option value="Hydrostatic Testing">Hydrostatic Testing</option>
                    <option value="Inspection">Inspection</option>
                    <option value="General Execution">General Execution</option>
                  </select>
                </div>
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.workType.reason}
                </p>
              </div>

              {/* FIELD 2: Quantity */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Quantity
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.quantity.state}
                    onSelect={(s) => handleUpdateFieldState('quantity', s)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateFieldValue(
                        'quantity',
                        Math.max(0, executionInfo.quantity.value - 1)
                      )
                    }
                    className="w-11 h-11 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F0F2F5] text-[#172033] flex items-center justify-center font-bold"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="any"
                    value={executionInfo.quantity.value}
                    onChange={(e) => handleUpdateFieldValue('quantity', parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-bold text-[#172033] outline-hidden min-h-[44px] text-center"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateFieldValue('quantity', executionInfo.quantity.value + 1)
                    }
                    className="w-11 h-11 rounded-lg border border-[#D9DEE5] bg-white hover:bg-[#F0F2F5] text-[#172033] flex items-center justify-center font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.quantity.reason}
                </p>
              </div>

              {/* FIELD 3: Unit */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Unit
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.unit.state}
                    onSelect={(s) => handleUpdateFieldState('unit', s)}
                  />
                </div>
                <select
                  value={executionInfo.unit.value}
                  onChange={(e) => handleUpdateFieldValue('unit', e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                >
                  <option value="spools">spools</option>
                  <option value="meters">meters</option>
                  <option value="m3">m3 (cubic meters)</option>
                  <option value="joints">joints</option>
                  <option value="cables">cables</option>
                  <option value="units">units</option>
                  <option value="tons">tons</option>
                  <option value="hours">hours</option>
                </select>
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.unit.reason}
                </p>
              </div>

              {/* FIELD 4: Area / Line */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Area / Line
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.areaLine.state}
                    onSelect={(s) => handleUpdateFieldState('areaLine', s)}
                  />
                </div>
                <input
                  type="text"
                  value={executionInfo.areaLine.value}
                  onChange={(e) => handleUpdateFieldValue('areaLine', e.target.value)}
                  placeholder="e.g. Line 24, Unit A, Flare Area"
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                />
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.areaLine.reason}
                </p>
              </div>

              {/* FIELD 5: Date */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Date
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.date.state}
                    onSelect={(s) => handleUpdateFieldState('date', s)}
                  />
                </div>
                <input
                  type="date"
                  value={executionInfo.date.value}
                  onChange={(e) => handleUpdateFieldValue('date', e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                />
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.date.reason}
                </p>
              </div>

              {/* FIELD 6: Time */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Time / Shift Duration
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.time.state}
                    onSelect={(s) => handleUpdateFieldState('time', s)}
                  />
                </div>
                <input
                  type="text"
                  value={executionInfo.time.value}
                  onChange={(e) => handleUpdateFieldValue('time', e.target.value)}
                  placeholder="e.g. 09:00 - 15:30"
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                />
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.time.reason}
                </p>
              </div>

              {/* FIELD 7: Discipline */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Discipline
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.discipline.state}
                    onSelect={(s) => handleUpdateFieldState('discipline', s)}
                  />
                </div>
                <select
                  value={executionInfo.discipline.value}
                  onChange={(e) =>
                    handleUpdateFieldValue('discipline', e.target.value as DisciplineType)
                  }
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-semibold text-[#172033] outline-hidden min-h-[44px]"
                >
                  <option value="Piping">Piping</option>
                  <option value="Civil">Civil</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Instrumentation">Instrumentation</option>
                </select>
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.discipline.reason}
                </p>
              </div>

              {/* FIELD 8: Remarks */}
              <div className="p-4 rounded-xl border border-[#D9DEE5] bg-[#FAFAFA] hover:bg-white transition-colors space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#172033] text-xs uppercase tracking-wider">
                    Remarks & Site Observations
                  </label>
                  <FieldStateSelector
                    currentState={executionInfo.remarks.state}
                    onSelect={(s) => handleUpdateFieldState('remarks', s)}
                  />
                </div>
                <textarea
                  rows={2}
                  value={executionInfo.remarks.value}
                  onChange={(e) => handleUpdateFieldValue('remarks', e.target.value)}
                  placeholder="Site conditions, safety signoffs, weather remarks..."
                  className="w-full p-2.5 bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs font-medium text-[#172033] outline-hidden resize-none"
                />
                <p className="text-[11px] text-[#8A94A6]">
                  {executionInfo.remarks.reason}
                </p>
              </div>
            </div>

            {/* Bottom Actions Footer: Secondary "Save Draft" & Next "Review Extracted Data" */}
            <div className="p-5 md:p-6 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#596579]">
                <CheckCircle className="w-4 h-4 text-[#2E7D5B]" />
                <span>
                  All 8 parameters verified by {siteEngineer}. Ready for schedule candidate evaluation.
                </span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* SECONDARY ACTION: Save Draft */}
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 text-xs font-bold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] active:scale-95 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-2xs"
                >
                  <Save className="w-4 h-4 text-[#596579]" />
                  <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
                </button>

                {/* NEXT ACTION: Review Extracted Data */}
                <button
                  type="button"
                  onClick={handleOpenReview}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:scale-95 rounded-xl transition-all inline-flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Review Extracted Data</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. MOBILE STICKY BOTTOM BAR (Mobile-First Interaction Quality) */}
        <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-[#D9DEE5] p-3 px-4 md:hidden z-40 flex items-center justify-between gap-3 shadow-lg">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSavingDraft}
            className="flex-1 min-h-[48px] px-3 py-2 text-xs font-bold text-[#172033] bg-white border border-[#D9DEE5] rounded-xl flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4 text-[#596579]" />
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={hasExtracted ? handleOpenReview : handleExtractInformation}
            className="flex-1 min-h-[48px] px-4 py-2 text-xs font-bold text-white bg-[#176B87] rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
          >
            {hasExtracted ? (
              <>
                <span>Review Data</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract Info</span>
              </>
            )}
          </button>
        </div>

        {/* 8. REVIEW EXTRACTED DATA DRAWER (Next: Review Extracted Data) */}
        <Drawer
          isOpen={isReviewDrawerOpen}
          onClose={() => setIsReviewDrawerOpen(false)}
          title="Review Extracted Execution Data"
          subtitle="Pre-submission review & Candidate Schedule Activity Linking"
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setIsReviewDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
              >
                Back to Editing
              </button>
              <button
                type="button"
                onClick={handleConfirmAndProceedToMatching}
                className="px-5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-sm inline-flex items-center gap-2"
              >
                <span>
                  {isOffline ? 'Save Locally to Offline Queue' : 'Proceed to Match & Verify Queue'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          }
        >
          <div className="space-y-6 text-xs text-[#172033]">
            {/* Header info */}
            <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#172033] text-sm">
                  Field Capture Ledger Summary
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  Ready for Ingestion
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[#8A94A6] block uppercase font-bold text-[9px]">Project</span>
                  <span className="font-bold text-[#172033]">{projectCode}</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] block uppercase font-bold text-[9px]">Engineer</span>
                  <span className="font-bold text-[#172033]">{siteEngineer}</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] block uppercase font-bold text-[9px]">Reporting Date</span>
                  <span className="font-bold text-[#172033]">{reportingDate}</span>
                </div>
                <div>
                  <span className="text-[#8A94A6] block uppercase font-bold text-[9px]">Discipline</span>
                  <span className="font-bold text-[#172033]">{executionInfo.discipline.value}</span>
                </div>
              </div>
            </div>

            {/* Extracted 8 Fields Matrix */}
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579] mb-3">
                Extracted Execution Parameters
              </h4>
              <div className="border border-[#D9DEE5] rounded-xl overflow-hidden divide-y divide-[#D9DEE5]">
                {[
                  { label: 'Work Type', item: executionInfo.workType },
                  { label: 'Quantity', item: executionInfo.quantity },
                  { label: 'Unit', item: executionInfo.unit },
                  { label: 'Area / Line', item: executionInfo.areaLine },
                  { label: 'Date', item: executionInfo.date },
                  { label: 'Time', item: executionInfo.time },
                  { label: 'Discipline', item: executionInfo.discipline },
                  { label: 'Remarks', item: executionInfo.remarks },
                ].map((row, idx) => {
                  const style = getFieldStateStyle(row.item.state);
                  const Icon = style.icon;
                  return (
                    <div
                      key={idx}
                      className="p-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#F7F8FA]"
                    >
                      <div className="sm:w-1/3">
                        <span className="font-bold text-[#172033]">{row.label}</span>
                      </div>
                      <div className="sm:w-1/3 font-medium text-[#172033] break-all">
                        {String(row.item.value)}
                      </div>
                      <div className="sm:w-1/3 flex items-center sm:justify-end gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${style.bg} ${style.border} ${style.text}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{row.item.state}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schedule Candidate Matching Preview */}
            <div className="bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#176B87] text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Candidate Schedule Activity Match
                </span>
                <span className="text-xs font-bold text-[#2E7D5B] bg-white px-2 py-0.5 rounded border border-[#B8DCC9]">
                  94% Match Confidence
                </span>
              </div>
              <div className="bg-white rounded-lg p-3 border border-[#B3CBE0]/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-[#176B87]">
                    PIP-24-002
                  </span>
                  <span className="text-[11px] text-[#596579]">
                    WBS 3.2.1 · Unit A Gas Gathering
                  </span>
                </div>
                <p className="font-semibold text-xs text-[#172033]">
                  Erect Line 24-XX (Gas Gathering Header Spool Assembly)
                </p>
                <div className="pt-2 border-t border-[#D9DEE5]/60 flex items-center justify-between text-[11px] text-[#596579]">
                  <span>Baseline Progress: <strong>30%</strong></span>
                  <ArrowRight className="w-3 h-3 text-[#176B87]" />
                  <span>
                    With this capture: <strong className="text-[#2E7D5B]">42% (+12 spools)</strong>
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#596579] leading-relaxed">
                Clicking <strong>Proceed to Match & Verify Queue</strong> will forward this execution event to the manager verification ledger for final schedule twin progression.
              </p>
            </div>
          </div>
        </Drawer>
      </div>
    </AppShell>
  );
}

// Field State Picker Component for inline confidence tweaking
interface FieldStateSelectorProps {
  currentState: FieldConfidenceState;
  onSelect: (state: FieldConfidenceState) => void;
}

function FieldStateSelector({ currentState, onSelect }: FieldStateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const getStateBadge = (state: FieldConfidenceState) => {
    switch (state) {
      case 'Confirmed':
        return {
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
          icon: CheckCircle2,
        };
      case 'Needs Confirmation':
        return {
          bg: 'bg-[#FDF6ED]',
          border: 'border-[#F0D4A6]',
          text: 'text-[#D98B32]',
          icon: AlertTriangle,
        };
      case 'Conflict':
        return {
          bg: 'bg-[#FBEFEE]',
          border: 'border-[#E4B0AA]',
          text: 'text-[#B5473C]',
          icon: AlertCircle,
        };
      case 'Unknown':
      default:
        return {
          bg: 'bg-[#F0F2F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
          icon: HelpCircle,
        };
    }
  };

  const currentBadge = getStateBadge(currentState);
  const CurrentIcon = currentBadge.icon;

  const states: FieldConfidenceState[] = [
    'Confirmed',
    'Needs Confirmation',
    'Unknown',
    'Conflict',
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all ${currentBadge.bg} ${currentBadge.border} ${currentBadge.text} hover:opacity-90`}
        title="Change confidence status for this field"
      >
        <CurrentIcon className="w-3 h-3" />
        <span>{currentState}</span>
        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#D9DEE5] rounded-lg shadow-lg z-30 py-1 text-xs animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8A94A6] border-b border-[#D9DEE5]/60">
            Set Confidence State
          </div>
          {states.map((st) => {
            const b = getStateBadge(st);
            const Icon = b.icon;
            const isSelected = st === currentState;
            return (
              <button
                key={st}
                type="button"
                onClick={() => {
                  onSelect(st);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between hover:bg-[#F0F2F5] transition-colors ${
                  isSelected ? 'font-bold bg-[#F7F8FA]' : ''
                }`}
              >
                <span className={`inline-flex items-center gap-1.5 ${b.text}`}>
                  <Icon className="w-3 h-3" />
                  <span>{st}</span>
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#176B87]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
