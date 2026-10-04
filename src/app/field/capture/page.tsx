'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../../components/shared/StateWrapper';
import { ConfidenceBadge } from '../../../components/shared/ConfidenceBadge';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { WhyButton } from '../../../components/shared/WhyButton';
import { DisciplineType } from '../../../types';
import { formatProjectDate, PROJECT_REPORT_DATE } from '../../../lib/domain/dateUtils';
import {
  FileText,
  Camera,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  Calendar,
  Building2,
  Check,
  Plus,
  Minus,
  HardHat,
  UploadCloud,
  FileCheck,
  RefreshCw,
  X,
} from 'lucide-react';

// Verification states per requirement: Confirmed | Needs Confirmation | Unknown | Conflict
export type FieldVerificationState = 'Confirmed' | 'Needs Confirmation' | 'Unknown' | 'Conflict';

export interface ExtractedFieldItem<T = string | number> {
  value: T;
  state: FieldVerificationState;
  reason: string;
}

export interface ExtractedDataModel {
  quantity: ExtractedFieldItem<number>;
  unit: ExtractedFieldItem<string>;
  line: ExtractedFieldItem<string>;
  workType: ExtractedFieldItem<string>;
  date: ExtractedFieldItem<string>;
  time: ExtractedFieldItem<string>;
  discipline: ExtractedFieldItem<DisciplineType>;
  remarks: ExtractedFieldItem<string>;
}

// Initial default state based on the exact user prompt example:
// "12 spools installed on Line 24. Work started at 09:00."
const INITIAL_EXTRACTED_DATA: ExtractedDataModel = {
  quantity: {
    value: 12,
    state: 'Confirmed',
    reason: 'Exact count "12" parsed from statement',
  },
  unit: {
    value: 'spools',
    state: 'Confirmed',
    reason: 'Recognized industrial piping spool unit',
  },
  line: {
    value: '24',
    state: 'Confirmed',
    reason: 'Asset tag "Line 24" identified',
  },
  workType: {
    value: 'Spool Installation',
    state: 'Confirmed',
    reason: 'Action verb "installed" mapped to Spool Installation',
  },
  date: {
    value: '2026-09-18',
    state: 'Confirmed',
    reason: 'Current project reporting date',
  },
  time: {
    value: '09:00',
    state: 'Confirmed',
    reason: 'Start time 09:00 detected',
  },
  discipline: {
    value: 'Piping',
    state: 'Confirmed',
    reason: 'Line 24 pipe spools mapped to Piping discipline',
  },
  remarks: {
    value: '12 spools installed on Line 24. Work started at 09:00.',
    state: 'Confirmed',
    reason: 'Complete field statement logged',
  },
};

export default function FieldCapturePage() {
  const router = useRouter();
  const { activeProject, openWhyExplanation } = useApp();
  const { addToast } = useToast();
  const { isOffline, captureFieldUpdate } = useOffline();

  // Workflow Step: 'primary' (Input screen) | 'review' (Extracted data & confirmation) | 'completed'
  const [step, setStep] = useState<'primary' | 'review' | 'completed'>('primary');

  // Primary Input Text
  const [fieldText, setFieldText] = useState(
    '12 spools installed on Line 24. Work started at 09:00.'
  );

  // Extracted Data (Editable by user)
  const [extractedData, setExtractedData] = useState<ExtractedDataModel>(INITIAL_EXTRACTED_DATA);

  // Voice recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  // Evidence states (Photo, Document, Field Note) - on this screen without forcing another page
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>('IMG_LINE24_SPOOL_12.jpg');
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);
  const [fieldNote, setFieldNote] = useState<string>('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Candidate Activity & Match Info
  const [selectedActivityId, setSelectedActivityId] = useState('PIP-24-001');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Voice Dictation Toggle
  const toggleVoiceRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      addToast({
        type: 'info',
        title: 'Voice Recording Started',
        description: 'Listening for field observation statement...',
      });
    } else {
      setIsRecordingVoice(false);
      setFieldText((prev) =>
        prev
          ? `${prev} Crane shifted to Laydown B. Work completed at 16:30.`
          : '12 spools installed on Line 24. Work started at 09:00.'
      );
      addToast({
        type: 'success',
        title: 'Voice Transcribed',
        description: 'Observation converted to text statement.',
      });
    }
  };

  // Heuristic Natural Language Parser for Field Statement
  const runExtraction = (text: string): ExtractedDataModel => {
    const lower = text.toLowerCase();

    // 1. Quantity Extraction
    let quantity = 12;
    let quantityState: FieldVerificationState = 'Confirmed';
    let quantityReason = 'Extracted numeric value';
    const numMatch = text.match(/\b(\d+)\b/);
    if (numMatch) {
      quantity = parseInt(numMatch[1], 10);
    } else {
      quantityState = 'Needs Confirmation';
      quantityReason = 'Could not detect unambiguous number; verify quantity';
    }

    // 2. Unit Extraction
    let unit = 'spools';
    let unitState: FieldVerificationState = 'Confirmed';
    let unitReason = 'Recognized unit from keywords';
    if (lower.includes('spool')) {
      unit = 'spools';
    } else if (lower.includes('joint') || lower.includes('weld')) {
      unit = 'joints';
    } else if (lower.includes('meter') || lower.includes('m ')) {
      unit = 'meters';
    } else if (lower.includes('m3') || lower.includes('cubic')) {
      unit = 'm³';
    } else if (lower.includes('ton')) {
      unit = 'tons';
    } else {
      unitState = 'Needs Confirmation';
      unitReason = 'Defaulted to units; verify engineering unit';
    }

    // 3. Line / Asset Extraction
    let line = '24';
    let lineState: FieldVerificationState = 'Confirmed';
    let lineReason = 'Asset tag extracted from statement';
    const lineMatch = text.match(/line\s*([0-9a-zA-Z-]+)/i);
    if (lineMatch) {
      line = lineMatch[1];
    } else if (lower.includes('unit a')) {
      line = 'Unit A';
    } else if (lower.includes('compressor')) {
      line = 'Skid C-101';
    } else {
      lineState = 'Needs Confirmation';
      lineReason = 'Line reference not found; manual verification required';
    }

    // 4. Work Type Extraction
    let workType = 'Spool Installation';
    let workTypeState: FieldVerificationState = 'Confirmed';
    let workTypeReason = 'Mapped from action verb';
    if (lower.includes('install') || lower.includes('erect')) {
      workType = 'Spool Installation';
    } else if (lower.includes('weld')) {
      workType = 'Field Joint Welding';
    } else if (lower.includes('pour') || lower.includes('concrete')) {
      workType = 'Concrete Pouring';
    } else if (lower.includes('pull') || lower.includes('cable')) {
      workType = 'Cable Pulling';
    } else if (lower.includes('align')) {
      workType = 'Equipment Alignment';
    } else {
      workTypeState = 'Needs Confirmation';
      workTypeReason = 'Action verb ambiguous; verify work type';
    }

    // 5. Time Extraction
    let time = '09:00';
    let timeState: FieldVerificationState = 'Confirmed';
    let timeReason = 'Shift start time detected';
    const timeMatch = text.match(/(\d{1,2}:\d{2})/);
    if (timeMatch) {
      time = timeMatch[1];
    } else {
      time = '09:00';
      timeState = 'Needs Confirmation';
      timeReason = 'Assumed standard morning shift start';
    }

    // 6. Discipline
    let discipline: DisciplineType = 'Piping';
    let disciplineState: FieldVerificationState = 'Confirmed';
    let disciplineReason = 'Discipline matched via engineering keywords';
    if (lower.includes('spool') || lower.includes('pipe') || lower.includes('weld') || lower.includes('line')) {
      discipline = 'Piping';
    } else if (lower.includes('concrete') || lower.includes('foundation') || lower.includes('civil')) {
      discipline = 'Civil';
    } else if (lower.includes('cable') || lower.includes('tray') || lower.includes('electrical')) {
      discipline = 'Electrical';
    } else if (lower.includes('skid') || lower.includes('compressor') || lower.includes('mechanical')) {
      discipline = 'Mechanical';
    } else {
      disciplineState = 'Unknown';
      disciplineReason = 'Discipline undetermined from text';
    }

    return {
      quantity: { value: quantity, state: quantityState, reason: quantityReason },
      unit: { value: unit, state: unitState, reason: unitReason },
      line: { value: line, state: lineState, reason: lineReason },
      workType: { value: workType, state: workTypeState, reason: workTypeReason },
      date: { value: '2026-09-18', state: 'Confirmed', reason: 'Current reporting date' },
      time: { value: time, state: timeState, reason: timeReason },
      discipline: { value: discipline, state: disciplineState, reason: disciplineReason },
      remarks: { value: text, state: 'Confirmed', reason: 'User input statement' },
    };
  };

  // Step 1 -> Step 2: Extract & Continue
  const handleExtractAndContinue = () => {
    if (!fieldText.trim()) {
      addToast({
        type: 'warning',
        title: 'Input Required',
        description: 'Please describe what happened in the field.',
      });
      return;
    }

    const parsed = runExtraction(fieldText);
    setExtractedData(parsed);

    // Auto select activity based on line
    if (parsed.line.value.includes('24') && parsed.workType.value.includes('Install')) {
      setSelectedActivityId('PIP-24-001');
    } else if (parsed.line.value.includes('24') && parsed.workType.value.includes('Weld')) {
      setSelectedActivityId('PIP-24-002');
    } else {
      setSelectedActivityId('PIP-24-001');
    }

    setStep('review');
  };

  // Step 2: Confirm & Commit
  const handleConfirm = async () => {
    setIsSubmitting(true);

    try {
      await captureFieldUpdate({
        projectId: activeProject?.id || 'PRJ-OIL-2026-01',
        activityId: selectedActivityId,
        activityName:
          selectedActivityId === 'PIP-24-001'
            ? 'Erect Line 24-XX High Pressure Gas Header'
            : 'Weld Line 24-XX Field Joints & NDT Clearance',
        quantity: extractedData.quantity.value,
        unit: extractedData.unit.value,
        date: extractedData.date.value,
        time: extractedData.time.value,
        discipline: extractedData.discipline.value,
        areaLine: `Line ${extractedData.line.value}`,
        remarks: fieldText + (fieldNote ? ` [Note: ${fieldNote}]` : ''),
        verificationState: 'Confirmed',
      });

      setIsSubmitting(false);
      setStep('completed');

      if (isOffline) {
        addToast({
          type: 'warning',
          title: 'Saved locally',
          description: 'Saved locally in IndexedDB queue. Updates will synchronize when online mode is restored.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Server confirmed',
          description: `Logged ${extractedData.quantity.value} ${extractedData.unit.value} to ${selectedActivityId}. Schedule Twin updated.`,
        });
      }
    } catch {
      setIsSubmitting(false);
      addToast({
        type: 'error',
        title: 'Capture Failed',
        description: 'An error occurred while saving the field update.',
      });
    }
  };

  // Verification State Badge Helper
  const renderStateBadge = (
    state: FieldVerificationState,
    onStateChange: (newState: FieldVerificationState) => void
  ) => {
    const configs: Record<
      FieldVerificationState,
      { label: string; bg: string; text: string; border: string; icon: any }
    > = {
      Confirmed: {
        label: 'Confirmed',
        bg: 'bg-[#EDF7F2]',
        text: 'text-[#2E7D5B]',
        border: 'border-[#B8DCC9]',
        icon: CheckCircle2,
      },
      'Needs Confirmation': {
        label: 'Needs Confirmation',
        bg: 'bg-[#FDF6ED]',
        text: 'text-[#D98B32]',
        border: 'border-[#F0D4A6]',
        icon: AlertTriangle,
      },
      Unknown: {
        label: 'Unknown',
        bg: 'bg-[#F0F2F5]',
        text: 'text-[#596579]',
        border: 'border-[#D9DEE5]',
        icon: HelpCircle,
      },
      Conflict: {
        label: 'Conflict',
        bg: 'bg-[#FBEFEE]',
        text: 'text-[#B5473C]',
        border: 'border-[#E4B0AA]',
        icon: AlertCircle,
      },
    };

    const cfg = configs[state] || configs.Confirmed;
    const Icon = cfg.icon;

    return (
      <div className="relative inline-block">
        <select
          value={state}
          onChange={(e) => onStateChange(e.target.value as FieldVerificationState)}
          className={`appearance-none pl-6 pr-6 py-0.5 text-[11px] font-bold rounded-full border cursor-pointer outline-none transition-colors ${cfg.bg} ${cfg.text} ${cfg.border}`}
        >
          <option value="Confirmed">Confirmed</option>
          <option value="Needs Confirmation">Needs Confirmation</option>
          <option value="Unknown">Unknown</option>
          <option value="Conflict">Conflict</option>
        </select>
        <Icon className={`w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${cfg.text}`} />
      </div>
    );
  };

  const breadcrumbs = [
    { label: 'Site Execution', href: '/engineer' },
    { label: 'Field Capture', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-5 pb-24 md:pb-12 max-w-4xl mx-auto">
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
            <span className="text-[11px] font-mono text-[#92400E]">
              IndexedDB Active
            </span>
          </div>
        )}

        {/* ========================================================= */}
        {/* TOP CONTEXT HEADER: Project & Date */}
        {/* ========================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <HardHat className="w-4 h-4 text-[#176B87]" />
                <span className="font-mono text-xs font-bold text-[#176B87]">
                  {activeProject.code}
                </span>
                <span className="text-[#8A94A6]">•</span>
                <span className="text-xs text-[#596579]">
                  Date: <strong className="text-[#172033] font-mono">{formatProjectDate(PROJECT_REPORT_DATE, true)}</strong>
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#172033] tracking-tight">
                {activeProject.name}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/engineer"
                className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] bg-[#F7F8FA] hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-lg transition-colors font-medium inline-flex items-center gap-1"
              >
                <span>Engineer Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* STEP 1: PRIMARY SCREEN — "What happened?" */}
        {/* ========================================================= */}
        {step === 'primary' && (
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
            {/* Large Prompt */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#172033] tracking-tight">
                What happened?
              </h2>
              <p className="text-xs text-[#596579] mt-0.5">
                Type or dictate what was completed on site today. PLnEX will extract engineering quantities and suggest the matching schedule activity.
              </p>
            </div>

            {/* Input Textarea */}
            <div className="space-y-2">
              <textarea
                rows={4}
                value={fieldText}
                onChange={(e) => setFieldText(e.target.value)}
                placeholder="Type what happened in the field..."
                className="w-full p-3.5 text-sm sm:text-base font-normal bg-[#F7F8FA] focus:bg-white border-2 border-[#D9DEE5] focus:border-[#176B87] rounded-xl text-[#172033] placeholder-[#8A94A6] outline-none transition-all leading-relaxed shadow-2xs"
              />

              {/* Minimal Typing Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-bold text-[#596579] mr-1">Quick Tap:</span>
                {[
                  '12 spools installed on Line 24. Work started at 09:00.',
                  '4 field welds completed on Line 24-XX.',
                  'Foundation concrete pour 45 m³ completed at Unit A.',
                  'Pulled 350 meters cable on Tray TR-04.',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFieldText(chip)}
                    className="px-2.5 py-1 text-[11px] rounded-full bg-[#F0F2F5] hover:bg-[#E8F1F5] hover:text-[#176B87] text-[#596579] border border-[#D9DEE5] transition-colors"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions: Record Voice, Add Photo, Add Document, Field Note */}
            <div className="pt-2 border-t border-[#E8EBF0] space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Record Voice */}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-2 ${
                    isRecordingVoice
                      ? 'bg-[#FBEFEE] text-[#B5473C] border-[#E4B0AA] animate-pulse'
                      : 'bg-white text-[#172033] border-[#D9DEE5] hover:bg-[#F0F2F5]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <>
                      <MicOff className="w-4 h-4 text-[#B5473C]" />
                      <span>Recording ({voiceSeconds}s) • Tap to Stop</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#176B87]" />
                      <span>Record Voice</span>
                    </>
                  )}
                </button>

                {/* 2. Add Photo */}
                <button
                  type="button"
                  onClick={() => {
                    setAttachedPhoto('IMG_LINE24_SPOOL_12.jpg (27.348° N, 95.313° E)');
                    addToast({
                      type: 'success',
                      title: 'Photo Added',
                      description: 'Geotagged site image attached directly.',
                    });
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-[#176B87]" />
                  <span>{attachedPhoto ? 'Photo Attached' : 'Add Photo'}</span>
                </button>

                {/* 3. Add Document */}
                <button
                  type="button"
                  onClick={() => {
                    setAttachedDoc('DPR_SHIFT_LOG_20260918.pdf');
                    addToast({
                      type: 'success',
                      title: 'Document Added',
                      description: 'Shift inspection report attached directly.',
                    });
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4 text-[#176B87]" />
                  <span>{attachedDoc ? 'Document Attached' : 'Add Document'}</span>
                </button>

                {/* 4. Add Field Note */}
                <button
                  type="button"
                  onClick={() => setIsAddingNote(!isAddingNote)}
                  className="px-3.5 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F0F2F5] rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-[#176B87]" />
                  <span>{fieldNote ? 'Field Note Attached' : 'Add Field Note'}</span>
                </button>
              </div>

              {/* Inline Field Note Input (Without navigating to another page) */}
              {isAddingNote && (
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-[#172033]">
                    <span>Attached Field Note</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNote(false)}
                      className="text-[#8A94A6] hover:text-[#172033]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fieldNote}
                    onChange={(e) => setFieldNote(e.target.value)}
                    placeholder="e.g. Crane mobilized from Laydown B at 08:30..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#D9DEE5] rounded outline-none text-[#172033]"
                  />
                </div>
              )}

              {/* Evidence Summary Strip */}
              {(attachedPhoto || attachedDoc || fieldNote) && (
                <div className="p-2.5 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg text-xs text-[#2E7D5B] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Evidence Attached:
                    </span>
                    {attachedPhoto && <span className="font-mono text-[11px]">{attachedPhoto}</span>}
                    {attachedDoc && <span className="font-mono text-[11px]">[{attachedDoc}]</span>}
                    {fieldNote && <span className="text-[11px] truncate max-w-xs">&ldquo;{fieldNote}&rdquo;</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAttachedPhoto(null);
                      setAttachedDoc(null);
                      setFieldNote('');
                    }}
                    className="text-[11px] text-[#B5473C] hover:underline font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* PRIMARY BUTTON: Extract & Continue (Large, high-contrast touch target) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleExtractAndContinue}
                className="w-full py-3.5 px-6 text-sm sm:text-base font-bold text-white bg-[#176B87] hover:bg-[#12546A] active:scale-99 rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2"
              >
                <span>Extract &amp; Continue</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 2: NEXT STEP — Review Extracted Data & Candidate Activity */}
        {/* ========================================================= */}
        {step === 'review' && (
          <div className="space-y-5">
            {/* Notice: AI is an editable hypothesis */}
            <div className="p-3.5 rounded-xl bg-[#FDF6ED] border border-[#F0D4A6] text-xs text-[#9A5B13] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D98B32] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-[#172033]">AI Extraction Hypothesis</strong>
                <span>
                  Every extracted field is editable. Review and confirm values below. AI extractions are not guaranteed truth.
                </span>
              </div>
            </div>

            {/* REVIEW EXTRACTED DATA CARD */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EBF0]">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">
                    Review Extracted Data
                  </h2>
                  <p className="text-xs text-[#596579] mt-0.5">
                    Extracted from statement: &ldquo;{fieldText}&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('primary')}
                  className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Edit Original Statement</span>
                </button>
              </div>

              {/* EDITABLE EXTRACTED FIELDS MATRIX */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* 1. Quantity */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Quantity</label>
                    {renderStateBadge(extractedData.quantity.state, (s) =>
                      setExtractedData({ ...extractedData, quantity: { ...extractedData.quantity, state: s } })
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          quantity: {
                            ...extractedData.quantity,
                            value: Math.max(1, extractedData.quantity.value - 1),
                          },
                        })
                      }
                      className="w-8 h-8 rounded bg-white border border-[#D9DEE5] font-bold text-sm text-[#172033] flex items-center justify-center hover:bg-[#F0F2F5]"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={extractedData.quantity.value}
                      onChange={(e) =>
                        setExtractedData({
                          ...extractedData,
                          quantity: {
                            ...extractedData.quantity,
                            value: parseInt(e.target.value, 10) || 0,
                          },
                        })
                      }
                      className="w-full text-center font-mono font-bold text-base bg-white border border-[#D9DEE5] rounded py-1 text-[#172033]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setExtractedData({
                          ...extractedData,
                          quantity: {
                            ...extractedData.quantity,
                            value: extractedData.quantity.value + 1,
                          },
                        })
                      }
                      className="w-8 h-8 rounded bg-white border border-[#D9DEE5] font-bold text-sm text-[#172033] flex items-center justify-center hover:bg-[#F0F2F5]"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.quantity.reason}</span>
                </div>

                {/* 2. Unit */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Unit</label>
                    {renderStateBadge(extractedData.unit.state, (s) =>
                      setExtractedData({ ...extractedData, unit: { ...extractedData.unit, state: s } })
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.unit.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        unit: { ...extractedData.unit, value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-bold text-sm bg-white border border-[#D9DEE5] rounded text-[#172033]"
                  />
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.unit.reason}</span>
                </div>

                {/* 3. Line */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Line / Area</label>
                    {renderStateBadge(extractedData.line.state, (s) =>
                      setExtractedData({ ...extractedData, line: { ...extractedData.line, state: s } })
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.line.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        line: { ...extractedData.line, value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-bold text-sm bg-white border border-[#D9DEE5] rounded text-[#172033]"
                  />
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.line.reason}</span>
                </div>

                {/* 4. Work Type */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Work Type</label>
                    {renderStateBadge(extractedData.workType.state, (s) =>
                      setExtractedData({ ...extractedData, workType: { ...extractedData.workType, state: s } })
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.workType.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        workType: { ...extractedData.workType, value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-bold text-sm bg-white border border-[#D9DEE5] rounded text-[#172033]"
                  />
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.workType.reason}</span>
                </div>

                {/* 5. Date */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Date</label>
                    {renderStateBadge(extractedData.date.state, (s) =>
                      setExtractedData({ ...extractedData, date: { ...extractedData.date, state: s } })
                    )}
                  </div>
                  <input
                    type="date"
                    value={extractedData.date.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        date: { ...extractedData.date, value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-medium text-sm bg-white border border-[#D9DEE5] rounded text-[#172033]"
                  />
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.date.reason}</span>
                </div>

                {/* 6. Time */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Time</label>
                    {renderStateBadge(extractedData.time.state, (s) =>
                      setExtractedData({ ...extractedData, time: { ...extractedData.time, state: s } })
                    )}
                  </div>
                  <input
                    type="text"
                    value={extractedData.time.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        time: { ...extractedData.time, value: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-mono font-medium text-sm bg-white border border-[#D9DEE5] rounded text-[#172033]"
                  />
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.time.reason}</span>
                </div>

                {/* 7. Discipline */}
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-[#596579] uppercase">Discipline</label>
                    {renderStateBadge(extractedData.discipline.state, (s) =>
                      setExtractedData({ ...extractedData, discipline: { ...extractedData.discipline, state: s } })
                    )}
                  </div>
                  <select
                    value={extractedData.discipline.value}
                    onChange={(e) =>
                      setExtractedData({
                        ...extractedData,
                        discipline: {
                          ...extractedData.discipline,
                          value: e.target.value as DisciplineType,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 font-bold text-sm bg-white border border-[#D9DEE5] rounded text-[#172033] outline-none"
                  >
                    <option value="Piping">Piping</option>
                    <option value="Civil">Civil</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Instrumentation">Instrumentation</option>
                  </select>
                  <span className="text-[10px] text-[#8A94A6] block truncate">{extractedData.discipline.reason}</span>
                </div>
              </div>
            </div>

            {/* CANDIDATE ACTIVITY & MATCH CONFIDENCE */}
            <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-[#E8EBF0]">
                <span className="text-[10px] font-mono font-bold uppercase text-[#8A94A6] tracking-wider block">
                  Schedule Twin Target Matching
                </span>
                <h3 className="text-base font-bold text-[#172033]">
                  Candidate Activity &amp; Confidence
                </h3>
              </div>

              {/* Target Activity Selector & Confidence Badge */}
              <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#D9DEE5] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#172033] block">
                      Candidate Activity Target:
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono font-bold text-sm text-[#176B87]">
                        {selectedActivityId}
                      </span>
                      <span className="text-xs font-semibold text-[#172033]">
                        {selectedActivityId === 'PIP-24-001'
                          ? 'Erect Line 24-XX High Pressure Gas Header'
                          : 'Weld Line 24-XX Field Joints & NDT Clearance'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <ConfidenceBadge score={94} size="md" />
                    <WhyButton
                      onClick={() => openWhyExplanation('confidence:EVT-2026-001', 'EVT-2026-001')}
                      title="Why this match?"
                    />
                  </div>
                </div>

                {/* Why this match? Explanation Section */}
                <div className="p-3 bg-white rounded-lg border border-[#E8EBF0] space-y-1.5 text-xs">
                  <span className="font-bold text-[#172033] block">Why this match?</span>
                  <ul className="space-y-1 text-[#596579] text-[11px]">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span>Line 24 identifier matches P6 WBS 1.1.3.2.1 directly.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span>Work type &ldquo;Spool Installation&rdquo; semantically corresponds to active erection activity.</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0" />
                      <span>Shift date 18 Sep 2026 falls within baseline window.</span>
                    </li>
                  </ul>
                </div>

                {/* Candidate Switcher Dropdown */}
                <div className="text-xs">
                  <span className="text-[#596579] font-medium mr-2">Or switch candidate:</span>
                  <select
                    value={selectedActivityId}
                    onChange={(e) => setSelectedActivityId(e.target.value)}
                    className="p-1.5 text-xs bg-white border border-[#D9DEE5] rounded font-medium text-[#172033] outline-none"
                  >
                    <option value="PIP-24-001">PIP-24-001 — Erect Line 24-XX High Pressure Gas Header</option>
                    <option value="PIP-24-002">PIP-24-002 — Weld Line 24-XX Field Joints & NDT Clearance</option>
                  </select>
                </div>
              </div>

              {/* Evidence Summary in Step 2 */}
              <div className="p-3 rounded-lg border border-[#D9DEE5] bg-white text-xs flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#176B87]" />
                  <span className="font-semibold text-[#172033]">Attached Evidence:</span>
                  <span className="text-[#596579]">
                    {attachedPhoto ? attachedPhoto : 'No photo'}
                    {attachedDoc ? ` • [${attachedDoc}]` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedPhoto('IMG_REPLACE_24.jpg');
                    addToast({ type: 'info', title: 'Photo Updated', description: 'Replaced site photo.' });
                  }}
                  className="text-xs text-[#176B87] hover:underline font-semibold"
                >
                  Change Evidence
                </button>
              </div>

              {/* PRIMARY ACTION: Confirm */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep('primary')}
                  className="px-4 py-2.5 text-xs font-bold text-[#596579] hover:text-[#172033] bg-[#F7F8FA] hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-initial px-6 py-3 text-sm sm:text-base font-bold text-white bg-[#176B87] hover:bg-[#12546A] active:scale-99 rounded-xl shadow-sm transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Schedule Twin...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>{isOffline ? 'Save Locally to Offline Queue' : 'Confirm & Commit Update'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* STEP 3: COMPLETED SUCCESS SCREEN */}
        {/* ========================================================= */}
        {step === 'completed' && (
          <div className="bg-white border border-[#D9DEE5] rounded-xl p-8 shadow-xs text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EDF7F2] border border-[#B8DCC9] flex items-center justify-center text-[#2E7D5B] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-[#172033]">
                Field Update Successfully Recorded!
              </h2>
              <p className="text-xs text-[#596579] max-w-md mx-auto">
                {isOffline
                  ? 'Update saved locally in IndexedDB offline storage. It will synchronize to server when online.'
                  : `Successfully linked ${extractedData.quantity.value} ${extractedData.unit.value} to activity ${selectedActivityId}. Schedule Twin updated.`}
              </p>
            </div>

            <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg max-w-sm mx-auto text-xs text-left font-mono space-y-1">
              <div>Activity: <strong className="text-[#176B87]">{selectedActivityId}</strong></div>
              <div>Quantity: <strong>{extractedData.quantity.value} {extractedData.unit.value}</strong></div>
              <div>Date &amp; Time: <strong>{extractedData.date.value} {extractedData.time.value}</strong></div>
              <div>State: <strong className="text-[#2E7D5B]">{isOffline ? 'Saved locally' : 'Server confirmed'}</strong></div>
            </div>

            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFieldText('');
                  setAttachedPhoto(null);
                  setAttachedDoc(null);
                  setFieldNote('');
                  setStep('primary');
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-[#172033] bg-white hover:bg-[#F0F2F5] border border-[#D9DEE5] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Record Another Event</span>
              </button>

              <Link
                href="/engineer"
                className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#12546A] rounded-xl transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <span>Back to Engineer Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* MOBILE STICKY BOTTOM ACTION BAR (When on primary screen) */}
        {step === 'primary' && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[#D9DEE5] md:hidden shadow-lg z-30">
            <button
              type="button"
              onClick={handleExtractAndContinue}
              className="w-full py-3.5 px-4 text-sm font-bold text-white bg-[#176B87] active:bg-[#12546A] rounded-xl shadow-sm flex items-center justify-center gap-2"
            >
              <span>Extract &amp; Continue</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </StateWrapper>
  );
}
