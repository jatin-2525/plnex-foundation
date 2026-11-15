'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
import { usePreferences } from '../../../context/PreferencesContext';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../../components/shared/StateWrapper';
import { DisciplineType } from '../../../types';
import { formatProjectDate, PROJECT_REPORT_DATE } from '../../../lib/domain/dateUtils';
import {
  Mic,
  MicOff,
  Camera,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Plus,
  Minus,
  HardHat,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  RefreshCw,
  MapPin,
} from 'lucide-react';

export type FieldVerificationState = 'Confirmed' | 'Needs Confirmation' | 'Unknown' | 'Conflict';

const COMMON_UNITS = ['spools', 'joints', 'm³', 'meters', 'tons', 'circuits', 'loops'];

const COMMON_AREAS = [
  'Line 24-XX',
  'Unit A - Gas Processing',
  'Piperack B',
  'Compressor House',
  'Substation A',
  'Laydown Yard',
];

const QUICK_CHIPS = [
  '12 spools installed on Line 24. Work started at 09:00.',
  '4 field butt welds completed on Line 24-XX.',
  'Foundation concrete pour 45 m³ completed at Unit A.',
  'Pulled 350 meters cable on Tray TR-04.',
  'Laser alignment verified on Skid C-101.',
];

export default function FieldCapturePage() {
  const router = useRouter();
  const { activeProject } = useApp();
  const { addToast } = useToast();
  const { isOffline, isSyncing, metrics, captureFieldUpdate } = useOffline();
  const { preferences } = usePreferences();

  const isGloveMode = preferences.engineer.touchTargetScale === 'glove';
  const touchClass = isGloveMode ? 'min-h-[52px]' : 'min-h-[44px]';
  const availableChips = (preferences.engineer.quickCaptureTemplates && preferences.engineer.quickCaptureTemplates.length > 0)
    ? preferences.engineer.quickCaptureTemplates
    : QUICK_CHIPS;

  // Workflow: 'form' | 'completed'
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);

  // 1. What happened? (Starts blank by default; sample loaded on demand)
  const [whatHappened, setWhatHappened] = useState('');

  // Voice recording simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  // 2. Quantity
  const [quantity, setQuantity] = useState<number>(0);

  // 3. Unit
  const [unit, setUnit] = useState<string>('spools');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  // 4. Area
  const [area, setArea] = useState<string>('Line 24-XX');
  const [customArea, setCustomArea] = useState<string>('');
  const [showCustomArea, setShowCustomArea] = useState(false);

  // 5. Evidence
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(null);
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);
  const [showEvidenceTray, setShowEvidenceTray] = useState(false);

  // Verification state & matched activity
  const [verificationState, setVerificationState] = useState<FieldVerificationState>('Needs Confirmation');
  const [activityId, setActivityId] = useState<string>('PIP-24-001');

  // Form validity rule: note must be non-empty and quantity must be positive
  const isFormValid = whatHappened.trim().length >= 5 && quantity > 0;

  // Load sample content preset
  const handleLoadSample = () => {
    setWhatHappened('12 spools installed on Line 24. Work started at 09:00.');
    setQuantity(12);
    setUnit('spools');
    setArea('Line 24-XX');
    setAttachedPhoto('IMG_LINE24_SPOOL_12.jpg');
    setVerificationState('Confirmed');
    setActivityId('PIP-24-001');
    setIsSampleLoaded(true);
    addToast({
      type: 'info',
      title: 'Sample Content Loaded',
      description: 'Loaded Line 24 demo observation with attached sample photo.',
    });
  };

  // Clear form to clean blank state
  const handleClearForm = () => {
    setWhatHappened('');
    setQuantity(0);
    setAttachedPhoto(null);
    setAttachedDoc(null);
    setIsSampleLoaded(false);
    addToast({
      type: 'info',
      title: 'Form Cleared',
      description: 'Ready for new field entry.',
    });
  };

  // Voice Timer Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecordingVoice) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setVoiceSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecordingVoice]);

  // Voice dictation toggle
  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      addToast({
        type: 'info',
        title: 'Voice Recording Started',
        description: 'Speak field observations clearly...',
      });
    } else {
      setIsRecordingVoice(false);
      setWhatHappened(
        (prev) =>
          (prev ? prev + ' ' : '') +
          'Additional 4 spools aligned and torqued on Piperack B.'
      );
      addToast({
        type: 'success',
        title: 'Voice Transcribed',
        description: 'Observation added to report.',
      });
    }
  };

  // Adjust quantity
  const handleQuantityDelta = (delta: number) => {
    setQuantity((prev) => Math.max(0, prev + delta));
  };

  // Auto-detect activity & discipline based on area/unit
  useEffect(() => {
    if (area.includes('Line 24') || unit === 'spools') {
      setActivityId('PIP-24-001');
    } else if (unit === 'joints') {
      setActivityId('PIP-24-002');
    } else if (unit === 'm³' || area.includes('Foundation')) {
      setActivityId('CIV-11-001');
    } else if (area.includes('Substation') || unit === 'meters') {
      setActivityId('ELE-11-032');
    } else if (area.includes('Compressor')) {
      setActivityId('MEC-08-003');
    }
  }, [area, unit]);

  // Save Field Report (Primary CTA)
  const handleSaveReport = async () => {
    if (!whatHappened.trim() || whatHappened.trim().length < 5) {
      addToast({
        type: 'warning',
        title: 'Description Required',
        description: 'Please describe what happened in the field (minimum 5 characters).',
      });
      return;
    }

    if (quantity <= 0) {
      addToast({
        type: 'warning',
        title: 'Quantity Required',
        description: 'Please enter an installed quantity greater than 0.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const discipline: DisciplineType =
        unit === 'spools' || unit === 'joints'
          ? 'Piping'
          : unit === 'm³'
          ? 'Civil'
          : unit === 'meters'
          ? 'Electrical'
          : 'Mechanical';

      await captureFieldUpdate({
        projectId: activeProject?.id || 'PRJ-OIL-2026-01',
        activityId,
        activityName:
          activityId === 'PIP-24-001'
            ? 'Erect Line 24-XX High Pressure Gas Header'
            : activityId === 'PIP-24-002'
            ? 'Weld Line 24-XX Field Joints & NDT Clearance'
            : 'Field Site Activity',
        quantity,
        unit: showCustomUnit && customUnit ? customUnit : unit,
        date: '2026-09-18',
        time: '09:00',
        discipline,
        areaLine: showCustomArea && customArea ? customArea : area,
        remarks: whatHappened,
        verificationState,
      });

      setIsSubmitting(false);
      setIsCompleted(true);

      if (isOffline) {
        addToast({
          type: 'warning',
          title: 'Saved locally',
          description:
            'Saved locally in IndexedDB offline queue. Updates will be synchronized when online mode is restored.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Field Report Saved',
          description: `Logged ${quantity} ${unit} to ${activityId}. Schedule Twin updated.`,
        });
      }
    } catch {
      setIsSubmitting(false);
      addToast({
        type: 'error',
        title: 'Save Failed',
        description: 'Could not record field update. Please retry.',
      });
    }
  };

  const breadcrumbs = [
    { label: 'Site Execution', href: '/engineer' },
    { label: 'Field Capture', current: true },
  ];

  return (
    <StateWrapper
      loadingMessage="Loading field capture workspace..."
      emptyTitle="No field capture activities found in this view"
      emptyDescription="Activities available for rapid physical progress recording and evidence upload will appear here. Select an active work area or reset filters to continue."
    >
      <div className="space-y-4 pb-36 sm:pb-20 max-w-2xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />

        {/* CONNECTION & SYNC QUEUE STATUS BAR */}
        <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 rounded-lg bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#52665D] dark:text-[#B5C1B5] text-[11px] uppercase tracking-wider">Sync State:</span>
            {isSyncing ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0F3FC] dark:bg-[#1C283F] text-[#405AA3] dark:text-[#E5C185] border border-[#C8D7F7] dark:border-[#2B3D5E]">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#405AA3] dark:text-[#E5C185]" />
                <span>Syncing</span>
              </span>
            ) : isOffline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F8EFDA] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border border-[#E5C185] dark:border-[#523B19]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#825700] dark:text-[#F3BA63]" />
                <span>Offline</span>
              </span>
            ) : metrics && metrics.failedCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323]">
                <AlertCircle className="w-3.5 h-3.5 text-[#A43B36] dark:text-[#F18B82]" />
                <span>Error ({metrics.failedCount} Failed)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E4F1E9] dark:bg-[#122A22] text-[#176B53] dark:text-[#72C6AD] border border-[#BCE7D2] dark:border-[#1E4A3B]">
                <Check className="w-3.5 h-3.5 text-[#176B53] dark:text-[#72C6AD]" />
                <span>Online</span>
              </span>
            )}

            {metrics && metrics.pendingUploads > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#F8EFDA] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border border-[#E5C185] dark:border-[#523B19]">
                <span>Saved Locally ({metrics.pendingUploads} Queued)</span>
              </span>
            )}
          </div>

          <span className="text-[11px] font-mono text-[#52665D] dark:text-[#B5C1B5]">
            Data Cutoff: {PROJECT_REPORT_DATE}
          </span>
        </div>

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-3 rounded-lg bg-[#F8EFDA] dark:bg-[#2C2114] border border-[#E5C185] dark:border-[#523B19] flex items-center justify-between gap-3 text-xs text-[#825700] dark:text-[#F3BA63]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#81500B] dark:bg-[#F3BA63] text-white dark:text-[#0B2822] font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                Updates will be synchronized when online mode is restored.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#825700] dark:text-[#F3BA63] shrink-0">
              Saved locally
            </span>
          </div>
        )}

        {/* PAGE HEADER: Mobile-First, Calm, Uncluttered */}
        <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#52665D] dark:text-[#B5C1B5]">
                <HardHat className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                  {activeProject.code}
                </span>
                <span>•</span>
                <span className="font-mono text-[#1A2B25] dark:text-[#F2F4E9]">
                  {formatProjectDate(PROJECT_REPORT_DATE, true)}
                </span>
              </div>
              <h1 className="font-heading text-[28px] sm:text-3xl font-bold text-[#1A2B25] dark:text-[#F2F4E9] tracking-tight mt-1">
                Field Capture
              </h1>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5] mt-0.5">
                Quick mobile telemetry entry for single events • For end-of-shift contractor submission, use{' '}
                <Link href="/field/dpr" className="text-[#006B61] dark:text-[#72C6AD] underline font-medium hover:text-[#00524A] dark:hover:text-[#6ee7d5]">
                  Daily Progress Report (DPR)
                </Link>
              </p>
            </div>

            <Link
              href="/engineer"
              className="min-h-[40px] px-3.5 py-2 text-xs text-[#1A2B25] dark:text-[#F2F4E9] bg-white dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-colors font-semibold shrink-0 inline-flex items-center justify-center shadow-2xs"
            >
              Engineer Dashboard
            </Link>
          </div>
        </div>

        {/* DEMO PRESET / CLEAR CONTROL TOOLBAR */}
        {!isCompleted && (
          <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1A2B25] dark:text-[#F2F4E9]">Form Mode:</span>
              {isSampleLoaded ? (
                <span className="px-2 py-0.5 rounded bg-[#F8EFDA] dark:bg-[#2C2114] text-[#825700] dark:text-[#F3BA63] border border-[#E5C185] dark:border-[#523B19] text-[11px] font-mono font-bold">
                  Sample Demo Content Loaded
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-white dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border border-[#D9E2DA] dark:border-[#3A5146] text-[11px] font-mono">
                  Blank Form (Ready for Site Input)
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isSampleLoaded ? (
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-3 py-1.5 bg-white dark:bg-[#17221D] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] rounded font-semibold text-xs transition-colors cursor-pointer"
                >
                  Load Sample Preset (Line 24)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="px-3 py-1.5 bg-white dark:bg-[#17221D] hover:bg-[#F6E4E1] dark:hover:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border border-[#DCABA7] dark:border-[#5C2323] rounded font-semibold text-xs transition-colors cursor-pointer"
                >
                  Clear Form & Start Blank
                </button>
              )}
            </div>
          </div>
        )}

        {/* COMPLETED SUCCESS STATE */}
        {isCompleted ? (
          <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#E4F1E9] dark:bg-[#122A22] border border-[#B7DAC3] dark:border-[#1E4A3B] flex items-center justify-center text-[#176B53] dark:text-[#72C6AD] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="font-heading text-xl font-bold text-[#1A2B25] dark:text-[#F2F4E9]">
                Field Report Recorded
              </h2>
              <p className="text-xs text-[#52665D] dark:text-[#B5C1B5]">
                {isOffline
                  ? 'Saved locally to IndexedDB queue. Updates will be synchronized when online mode is restored.'
                  : 'Successfully submitted and verified against master schedule baseline.'}
              </p>
            </div>

            <div className="p-4 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg max-w-sm mx-auto text-xs text-left font-mono space-y-2">
              <div className="flex justify-between">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Target Activity:</span>
                <strong className="text-[#006B61] dark:text-[#72C6AD]">{activityId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Quantity Logged:</span>
                <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{quantity} {unit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Area / Line:</span>
                <strong className="text-[#1A2B25] dark:text-[#F2F4E9]">{area}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Evidence Attached:</span>
                <strong className="text-[#176B53] dark:text-[#72C6AD]">{attachedPhoto ? '1 Photo' : 'None'}</strong>
              </div>
              <div className="flex justify-between border-t border-[#D9E2DA] dark:border-[#3A5146] pt-2">
                <span className="text-[#52665D] dark:text-[#B5C1B5]">Sync Status:</span>
                <strong className={isOffline ? 'text-[#825700] dark:text-[#F3BA63]' : 'text-[#176B53] dark:text-[#72C6AD]'}>
                  {isOffline ? 'Saved locally' : 'Server Confirmed'}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWhatHappened('');
                  setQuantity(1);
                  setAttachedPhoto(null);
                  setAttachedDoc(null);
                  setIsCompleted(false);
                }}
                className={`w-full sm:w-auto ${touchClass} px-4 sm:px-6 py-2 text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-[#F6F7F3] dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer`}
              >
                <Plus className="w-4 h-4" />
                <span>Record Another Entry</span>
              </button>

              <Link
                href="/engineer"
                className={`w-full sm:w-auto ${touchClass} px-4 sm:px-6 py-2 text-xs font-bold text-white dark:text-[#0B2822] bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer`}
              >
                <span>Return to Engineer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* SINGLE-TASK FORM — RECOMMENDED ORDER */
          <div className="space-y-4">
            {/* ========================================================= */}
            {/* 1. WHAT HAPPENED? */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                  1. What happened?
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`${touchClass} h-11 px-4 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-2 cursor-pointer ${
                    isRecordingVoice
                      ? 'bg-[#F6E4E1] dark:bg-[#2C1819] text-[#A43B36] dark:text-[#F18B82] border-[#92372F] dark:border-[#F18B82] font-bold'
                      : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#006B61] dark:text-[#72C6AD] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <>
                      <MicOff className="w-4 h-4 text-[#A43B36] dark:text-[#F18B82]" />
                      <span>Stop ({voiceSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                      <span>Record Voice</span>
                    </>
                  )}
                </button>
              </div>

              {/* Text Input */}
              <textarea
                rows={3}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="Type or dictate what was completed on site today..."
                className="w-full p-4 text-sm sm:text-base bg-[#F6F7F3] dark:bg-[#243832] focus:bg-white dark:focus:bg-[#17221D] border-2 border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] placeholder-[#7B8798] dark:placeholder-[#64748B] outline-none transition-colors leading-relaxed"
              />

              {/* Quick Tap Chips to minimize typing */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-[#52665D] dark:text-[#B5C1B5] block">
                  Quick Tap Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableChips.map((chip: string, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWhatHappened(chip)}
                      className={`${touchClass} py-2 px-4 text-xs rounded-full bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] hover:text-[#006B61] dark:hover:text-[#72C6AD] border border-[#D9E2DA] dark:border-[#3A5146] transition-colors text-left inline-flex items-center`}
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 2. QUANTITY (Large, Thumb-Friendly Stepper) */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 space-y-3">
              <label className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                2. Quantity
              </label>

              {/* Large Stepper Controls */}
              <div className="flex items-center gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityDelta(-1)}
                  className={`${touchClass} h-12 w-14 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#243832] active:bg-[#D9E2DA] dark:active:bg-[#2D443D] border border-[#D9E2DA] dark:border-[#3A5146] font-black text-xl text-[#1A2B25] dark:text-[#F2F4E9] flex items-center justify-center cursor-pointer transition-colors`}
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className={`w-full ${touchClass} h-12 text-center font-mono font-bold text-2xl bg-[#F6F7F3] dark:bg-[#243832] border-2 border-[#D9E2DA] dark:border-[#3A5146] focus:border-[#006B61] dark:focus:border-[#72C6AD] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-none`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleQuantityDelta(1)}
                  className={`${touchClass} h-12 w-14 rounded-lg bg-[#EAF0E9] dark:bg-[#243832] hover:bg-[#D9E2DA] dark:hover:bg-[#243832] active:bg-[#D9E2DA] dark:active:bg-[#2D443D] border border-[#D9E2DA] dark:border-[#3A5146] font-black text-xl text-[#1A2B25] dark:text-[#F2F4E9] flex items-center justify-center cursor-pointer transition-colors`}
                  aria-label="Increase quantity"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Count Preset Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-[#52665D] dark:text-[#B5C1B5] mr-1">Count:</span>
                {[1, 4, 8, 12, 20, 45, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`${touchClass} px-4 text-xs font-mono font-bold rounded-md border transition-colors inline-flex items-center justify-center ${
                      quantity === num
                        ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                        : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* 3. UNIT (Touch-Friendly Pills) */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 space-y-3">
              <label className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                3. Unit
              </label>

              <div className="flex flex-wrap gap-2">
                {COMMON_UNITS.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      setUnit(u);
                      setShowCustomUnit(false);
                    }}
                    className={`${touchClass} h-11 px-4 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      unit === u && !showCustomUnit
                        ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                        : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                  >
                    {u}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomUnit(!showCustomUnit)}
                  className={`${touchClass} h-11 px-4 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    showCustomUnit
                      ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                      : 'bg-white dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  + Other Unit
                </button>
              </div>

              {showCustomUnit && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customUnit}
                    onChange={(e) => {
                      setCustomUnit(e.target.value);
                      setUnit(e.target.value);
                    }}
                    placeholder="Enter custom engineering unit..."
                    className="w-full min-h-[44px] h-11 px-3 text-xs bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-none"
                  />
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 4. AREA (Touch-Friendly Location Pills) */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 space-y-3">
              <label className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                4. Area &amp; Workfront
              </label>

              <div className="flex flex-wrap gap-2">
                {COMMON_AREAS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setArea(a);
                      setShowCustomArea(false);
                    }}
                    className={`${touchClass} h-11 px-4 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      area === a && !showCustomArea
                        ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                        : 'bg-[#F6F7F3] dark:bg-[#243832] text-[#1A2B25] dark:text-[#F2F4E9] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                    }`}
                  >
                    {a}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomArea(!showCustomArea)}
                  className={`${touchClass} h-11 px-4 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    showCustomArea
                      ? 'bg-[#006B61] dark:bg-[#72C6AD] text-white dark:text-[#0B2822] border-[#006B61] dark:border-[#72C6AD]'
                      : 'bg-white dark:bg-[#17221D] text-[#52665D] dark:text-[#B5C1B5] border-[#D9E2DA] dark:border-[#3A5146] hover:bg-[#EAF0E9] dark:hover:bg-[#243832]'
                  }`}
                >
                  + Other Area
                </button>
              </div>

              {showCustomArea && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={customArea}
                    onChange={(e) => {
                      setCustomArea(e.target.value);
                      setArea(e.target.value);
                    }}
                    placeholder="Enter area or line name..."
                    className="w-full min-h-[44px] h-11 px-3 text-xs bg-white dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-[#1A2B25] dark:text-[#F2F4E9] outline-none"
                  />
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5. EVIDENCE (Secondary Action: Add Evidence) */}
            {/* ========================================================= */}
            <div className="bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-heading text-base font-bold text-[#1A2B25] dark:text-[#F2F4E9] block">
                  5. Evidence
                </label>
                <button
                  type="button"
                  onClick={() => setShowEvidenceTray(!showEvidenceTray)}
                  className="min-h-[44px] h-11 px-3 text-xs font-semibold text-[#006B61] dark:text-[#72C6AD] hover:underline cursor-pointer"
                >
                  {showEvidenceTray ? 'Done' : 'Add Evidence'}
                </button>
              </div>

              {/* Evidence Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAttachedPhoto('IMG_LINE24_SPOOL_12.jpg (27.348° N, 95.313° E)');
                    addToast({
                      type: 'success',
                      title: 'Photo Added',
                      description: 'Geotagged site image attached.',
                    });
                  }}
                  className={`${touchClass} h-11 px-4 text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-[#F6F7F3] dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <Camera className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAttachedDoc('DPR_SHIFT_LOG_20260918.pdf');
                    addToast({
                      type: 'success',
                      title: 'Document Added',
                      description: 'Shift inspection report attached.',
                    });
                  }}
                  className={`${touchClass} h-11 px-4 text-xs font-bold text-[#1A2B25] dark:text-[#F2F4E9] bg-[#F6F7F3] dark:bg-[#243832] hover:bg-[#EAF0E9] dark:hover:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer`}
                >
                  <Paperclip className="w-4 h-4 text-[#006B61] dark:text-[#72C6AD]" />
                  <span>Document</span>
                </button>
              </div>

              {/* Attached Evidence Pills */}
              {(attachedPhoto || attachedDoc) ? (
                <div className="p-3 bg-[#E4F1E9] dark:bg-[#122A22] border border-[#B7DAC3] dark:border-[#1E4A3B] rounded-lg space-y-2 text-xs text-[#176B53] dark:text-[#72C6AD]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Attached Files:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedPhoto(null);
                        setAttachedDoc(null);
                      }}
                      className="text-[11px] text-[#A43B36] dark:text-[#F18B82] font-semibold hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {attachedPhoto && (
                    <div className="font-mono text-[11px] flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      <span>{attachedPhoto}</span>
                    </div>
                  )}

                  {attachedDoc && (
                    <div className="font-mono text-[11px] flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{attachedDoc}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg text-xs text-[#738A80] dark:text-[#B5C1B5] text-center">
                  Optional: Attach photo or shift sign-off sheet for rapid QA verification.
                </div>
              )}
            </div>

            {/* VERIFICATION STATE & TARGET MAPPING (Compact, inline preview) */}
            <div className="bg-[#F6F7F3] dark:bg-[#243832] border border-[#D9E2DA] dark:border-[#3A5146] rounded-lg p-4 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#52665D] dark:text-[#B5C1B5] block">
                  Target WBS Activity
                </span>
                <span className="font-mono font-bold text-[#006B61] dark:text-[#72C6AD]">
                  {activityId}
                </span>
                <span className="text-[#52665D] dark:text-[#B5C1B5] ml-2 hidden sm:inline">
                  • Erect Line 24-XX Header
                </span>
              </div>

              {/* Verification State Dropdown (Confirmed | Needs Confirmation | Unknown | Conflict) */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#52665D] dark:text-[#B5C1B5] font-medium hidden sm:inline">State:</span>
                <select
                  value={verificationState}
                  onChange={(e) => setVerificationState(e.target.value as FieldVerificationState)}
                  className="min-h-[44px] px-3 py-2 text-xs font-semibold bg-white dark:bg-[#17221D] border border-[#D9E2DA] dark:border-[#3A5146] rounded-md text-[#1A2B25] dark:text-[#F2F4E9] outline-none"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Needs Confirmation">Needs Confirmation</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Conflict">Conflict</option>
                </select>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 6. PRIMARY CTA: SUBMIT FIELD OBSERVATION (Desktop & In-Flow) */}
            {/* ========================================================= */}
            <div className="pt-2 space-y-2">
              {!isFormValid && (
                <div className="p-2.5 rounded-lg bg-[#F8EFDA] dark:bg-[#3A3120] border border-[#E5C185] dark:border-[#5B4A2B] text-xs text-[#825700] dark:text-[#E5C185] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#825700] dark:text-[#E5C185]" />
                  <span>
                    Required: {whatHappened.trim().length < 5 ? '• Observation note (min 5 characters) ' : ''}
                    {quantity <= 0 ? '• Quantity must be greater than 0' : ''}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveReport}
                disabled={isSubmitting || !isFormValid}
                title={!isFormValid ? 'Description (min 5 chars) and quantity (> 0) required to submit' : 'Submit Field Observation'}
                className={`w-full ${touchClass} py-3 px-4 text-sm font-bold text-white dark:text-[#0B2822] bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] border border-[#006B61] dark:border-[#72C6AD] rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Observation...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>
                      {!isFormValid
                        ? 'Enter Note & Quantity to Submit'
                        : isOffline
                        ? 'Save Locally to Offline Queue'
                        : 'Submit Field Observation'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* MOBILE STICKY BOTTOM BAR (Always Thumb-Reachable with One Hand) */}
        {/* ========================================================= */}
        {!isCompleted && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-[#17221D] border-t border-[#D9E2DA] dark:border-[#3A5146] md:hidden shadow-lg z-30 space-y-2">
            {!isFormValid && (
              <p className="text-[11px] text-[#825700] dark:text-[#E5C185] text-center font-medium">
                Note & quantity &gt; 0 required to submit
              </p>
            )}
            <button
              type="button"
              onClick={handleSaveReport}
              disabled={isSubmitting || !isFormValid}
              title={!isFormValid ? 'Description (min 5 chars) and quantity (> 0) required to submit' : 'Submit Field Observation'}
              className={`w-full ${touchClass} py-3 px-4 text-sm font-bold text-white dark:text-[#0B2822] bg-[#006B61] hover:bg-[#00524A] dark:bg-[#72C6AD] dark:hover:bg-[#5CB69C] border border-[#006B61] dark:border-[#72C6AD] rounded-lg shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {!isFormValid
                      ? 'Note & Quantity Required'
                      : isOffline
                      ? 'Save Locally'
                      : 'Submit Field Observation'}
                  </span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </StateWrapper>
  );
}
