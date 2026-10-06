'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
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
  Sparkles,
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
  const { isOffline, captureFieldUpdate } = useOffline();

  // Workflow: 'form' | 'completed'
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. What happened?
  const [whatHappened, setWhatHappened] = useState(
    '12 spools installed on Line 24. Work started at 09:00.'
  );

  // Voice recording simulation
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  // 2. Quantity
  const [quantity, setQuantity] = useState<number>(12);

  // 3. Unit
  const [unit, setUnit] = useState<string>('spools');
  const [customUnit, setCustomUnit] = useState<string>('');
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  // 4. Area
  const [area, setArea] = useState<string>('Line 24-XX');
  const [customArea, setCustomArea] = useState<string>('');
  const [showCustomArea, setShowCustomArea] = useState(false);

  // 5. Evidence
  const [attachedPhoto, setAttachedPhoto] = useState<string | null>(
    'IMG_LINE24_SPOOL_12.jpg'
  );
  const [attachedDoc, setAttachedDoc] = useState<string | null>(null);
  const [showEvidenceTray, setShowEvidenceTray] = useState(false);

  // Verification state & matched activity
  const [verificationState, setVerificationState] = useState<FieldVerificationState>('Confirmed');
  const [activityId, setActivityId] = useState<string>('PIP-24-001');

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
    setQuantity((prev) => Math.max(1, prev + delta));
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
    if (!whatHappened.trim()) {
      addToast({
        type: 'warning',
        title: 'Description Required',
        description: 'Please describe what happened in the field.',
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
    <StateWrapper>
      <div className="space-y-4 pb-28 md:pb-12 max-w-2xl mx-auto">
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-3 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-between gap-3 text-xs text-[#8C5311]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#D98B32] text-white font-mono font-bold text-[10px] uppercase">
                OFFLINE MODE
              </span>
              <span className="font-semibold">
                Updates will be synchronized when online mode is restored.
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#D98B32] shrink-0">
              Saved locally
            </span>
          </div>
        )}

        {/* PAGE HEADER: Mobile-First, Calm, Uncluttered */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs text-[#596579]">
                <HardHat className="w-4 h-4 text-[#176B87]" />
                <span className="font-mono font-bold text-[#176B87]">
                  {activeProject.code}
                </span>
                <span>•</span>
                <span className="font-mono text-[#172033]">
                  {formatProjectDate(PROJECT_REPORT_DATE, true)}
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight mt-1">
                Field Capture
              </h1>
            </div>

            <Link
              href="/engineer"
              className="px-3 py-1.5 text-xs text-[#596579] hover:text-[#172033] bg-[#F7F8FA] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors font-medium shrink-0"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* COMPLETED SUCCESS STATE */}
        {isCompleted ? (
          <div className="bg-white border border-[#D9DEE5] rounded-lg p-6 sm:p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-[#EDF7F2] border border-[#B8DCC9] flex items-center justify-center text-[#2E7D5B] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#172033]">
                Field Report Recorded
              </h2>
              <p className="text-xs text-[#596579]">
                {isOffline
                  ? 'Saved locally to IndexedDB queue. Updates will be synchronized when online mode is restored.'
                  : 'Successfully submitted and verified against master schedule baseline.'}
              </p>
            </div>

            <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg max-w-sm mx-auto text-xs text-left font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#596579]">Target Activity:</span>
                <strong className="text-[#176B87]">{activityId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">Quantity Logged:</span>
                <strong className="text-[#172033]">{quantity} {unit}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">Area / Line:</span>
                <strong className="text-[#172033]">{area}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#596579]">Evidence Attached:</span>
                <strong className="text-[#2E7D5B]">{attachedPhoto ? '1 Photo' : 'None'}</strong>
              </div>
              <div className="flex justify-between border-t border-[#D9DEE5] pt-1.5">
                <span className="text-[#596579]">Sync Status:</span>
                <strong className={isOffline ? 'text-[#D98B32]' : 'text-[#2E7D5B]'}>
                  {isOffline ? 'Saved locally' : 'Server Confirmed'}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setWhatHappened('');
                  setQuantity(1);
                  setAttachedPhoto(null);
                  setAttachedDoc(null);
                  setIsCompleted(false);
                }}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold text-[#172033] bg-[#F7F8FA] hover:bg-[#F1F3F5] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Another Entry</span>
              </button>

              <Link
                href="/engineer"
                className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-[#172033] block">
                  1. What happened?
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`min-h-[44px] h-11 px-3.5 text-xs font-semibold rounded-lg border transition-all inline-flex items-center gap-2 cursor-pointer ${
                    isRecordingVoice
                      ? 'bg-[#FBEFEE] text-[#B5473C] border-[#B5473C] font-bold'
                      : 'bg-[#F7F8FA] text-[#176B87] border-[#D9DEE5] hover:bg-[#EDF5F8]'
                  }`}
                >
                  {isRecordingVoice ? (
                    <>
                      <MicOff className="w-4 h-4 text-[#B5473C]" />
                      <span>Stop ({voiceSeconds}s)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 text-[#176B87]" />
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
                className="w-full p-3.5 text-sm sm:text-base bg-[#F7F8FA] focus:bg-white border-2 border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] placeholder-[#7B8798] outline-none transition-colors leading-relaxed"
              />

              {/* Quick Tap Chips to minimize typing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-[#596579] block">
                  Quick Tap Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWhatHappened(chip)}
                      className="min-h-[36px] py-1.5 px-3 text-xs rounded-full bg-[#F1F3F5] hover:bg-[#EDF5F8] text-[#172033] hover:text-[#176B87] border border-[#D9DEE5] transition-colors text-left"
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
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 space-y-3">
              <label className="text-base font-bold text-[#172033] block">
                2. Quantity
              </label>

              {/* Large Stepper Controls */}
              <div className="flex items-center gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => handleQuantityDelta(-1)}
                  className="min-h-[44px] h-12 w-14 rounded-lg bg-[#F1F3F5] hover:bg-[#D9DEE5] active:bg-[#C5CCD6] border border-[#D9DEE5] font-black text-xl text-[#172033] flex items-center justify-center cursor-pointer transition-colors"
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
                    className="w-full min-h-[44px] h-12 text-center font-mono font-bold text-2xl bg-[#F7F8FA] border-2 border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-[#172033] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleQuantityDelta(1)}
                  className="min-h-[44px] h-12 w-14 rounded-lg bg-[#F1F3F5] hover:bg-[#D9DEE5] active:bg-[#C5CCD6] border border-[#D9DEE5] font-black text-xl text-[#172033] flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Count Preset Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-[#596579] mr-1">Count:</span>
                {[1, 4, 8, 12, 20, 45, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`min-h-[36px] px-3 text-xs font-mono font-bold rounded-md border transition-colors ${
                      quantity === num
                        ? 'bg-[#176B87] text-white border-[#176B87]'
                        : 'bg-[#F7F8FA] text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
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
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 space-y-3">
              <label className="text-base font-bold text-[#172033] block">
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
                    className={`min-h-[44px] h-11 px-4 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      unit === u && !showCustomUnit
                        ? 'bg-[#176B87] text-white border-[#176B87]'
                        : 'bg-[#F7F8FA] text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    {u}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomUnit(!showCustomUnit)}
                  className={`min-h-[44px] h-11 px-3.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    showCustomUnit
                      ? 'bg-[#176B87] text-white border-[#176B87]'
                      : 'bg-white text-[#596579] border-[#D9DEE5] hover:bg-[#F1F3F5]'
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
                    className="w-full min-h-[44px] h-11 px-3 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none"
                  />
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 4. AREA (Touch-Friendly Location Pills) */}
            {/* ========================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 space-y-3">
              <label className="text-base font-bold text-[#172033] block">
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
                    className={`min-h-[44px] h-11 px-3.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                      area === a && !showCustomArea
                        ? 'bg-[#176B87] text-white border-[#176B87]'
                        : 'bg-[#F7F8FA] text-[#172033] border-[#D9DEE5] hover:bg-[#F1F3F5]'
                    }`}
                  >
                    {a}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setShowCustomArea(!showCustomArea)}
                  className={`min-h-[44px] h-11 px-3.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    showCustomArea
                      ? 'bg-[#176B87] text-white border-[#176B87]'
                      : 'bg-white text-[#596579] border-[#D9DEE5] hover:bg-[#F1F3F5]'
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
                    className="w-full min-h-[44px] h-11 px-3 text-xs bg-white border border-[#D9DEE5] rounded-lg text-[#172033] outline-none"
                  />
                </div>
              )}
            </div>

            {/* ========================================================= */}
            {/* 5. EVIDENCE (Secondary Action: Add Evidence) */}
            {/* ========================================================= */}
            <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-bold text-[#172033] block">
                  5. Evidence
                </label>
                <button
                  type="button"
                  onClick={() => setShowEvidenceTray(!showEvidenceTray)}
                  className="min-h-[44px] h-11 px-3 text-xs font-semibold text-[#176B87] hover:underline cursor-pointer"
                >
                  {showEvidenceTray ? 'Done' : 'Add Evidence'}
                </button>
              </div>

              {/* Evidence Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
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
                  className="min-h-[44px] h-11 px-3.5 text-xs font-bold text-[#172033] bg-[#F7F8FA] hover:bg-[#EDF5F8] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-[#176B87]" />
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
                  className="min-h-[44px] h-11 px-3.5 text-xs font-bold text-[#172033] bg-[#F7F8FA] hover:bg-[#EDF5F8] border border-[#D9DEE5] rounded-lg transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Paperclip className="w-4 h-4 text-[#176B87]" />
                  <span>Document</span>
                </button>
              </div>

              {/* Attached Evidence Pills */}
              {(attachedPhoto || attachedDoc) ? (
                <div className="p-3 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg space-y-1.5 text-xs text-[#2E7D5B]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Attached Files:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedPhoto(null);
                        setAttachedDoc(null);
                      }}
                      className="text-[11px] text-[#B5473C] font-semibold hover:underline"
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
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-xs text-[#7B8798] text-center">
                  Optional: Attach photo or shift sign-off sheet for rapid QA verification.
                </div>
              )}
            </div>

            {/* VERIFICATION STATE & TARGET MAPPING (Compact, inline preview) */}
            <div className="bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg p-3.5 flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#596579] block">
                  Target WBS Activity
                </span>
                <span className="font-mono font-bold text-[#176B87]">
                  {activityId}
                </span>
                <span className="text-[#596579] ml-1.5 hidden sm:inline">
                  • Erect Line 24-XX Header
                </span>
              </div>

              {/* Verification State Dropdown (Confirmed | Needs Confirmation | Unknown | Conflict) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#596579] font-medium hidden sm:inline">State:</span>
                <select
                  value={verificationState}
                  onChange={(e) => setVerificationState(e.target.value as FieldVerificationState)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#D9DEE5] rounded-md text-[#172033] outline-none"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Needs Confirmation">Needs Confirmation</option>
                  <option value="Unknown">Unknown</option>
                  <option value="Conflict">Conflict</option>
                </select>
              </div>
            </div>

            {/* ========================================================= */}
            {/* 6. PRIMARY CTA: SAVE FIELD REPORT (Desktop & In-Flow) */}
            {/* ========================================================= */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveReport}
                disabled={isSubmitting}
                className="w-full min-h-[48px] h-12 py-3 px-6 text-base font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] rounded-lg shadow-sm transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Saving Report...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {isOffline ? 'Save Locally to Offline Queue' : 'Save Field Report'}
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
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-[#D9DEE5] md:hidden shadow-lg z-30">
            <button
              type="button"
              onClick={handleSaveReport}
              disabled={isSubmitting}
              className="w-full min-h-[48px] h-12 py-3 px-4 text-base font-bold text-white bg-[#176B87] active:bg-[#135A72] rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {isOffline ? 'Save Locally to Offline Queue' : 'Save Field Report'}
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
