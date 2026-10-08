'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import { useOffline } from '../../../context/OfflineContext';
import { AppShell } from '../../../components/shell/AppShell';
import { Breadcrumbs } from '../../../components/shell/Breadcrumbs';
import { Drawer } from '../../../components/shared/Drawer';
import { DisciplineType } from '../../../types';
import {
  FileText,
  Calendar,
  Clock,
  HardHat,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Save,
  Send,
  Plus,
  Trash2,
  Camera,
  Layers,
  ShieldCheck,
  Download,
  ArrowLeft,
  ArrowRight,
  Info,
  Check,
  ChevronDown,
  ExternalLink,
  RotateCcw,
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

// Step / Section navigation config for engineering workflow
export const stepsConfig = [
  { step: 1, title: 'Project + Date', sectionId: 'sec-project-date' },
  { step: 2, title: 'Area & Location', sectionId: 'sec-area' },
  { step: 3, title: 'Discipline & Crew', sectionId: 'sec-discipline' },
  { step: 4, title: 'Work Completed', sectionId: 'sec-work-completed' },
  { step: 5, title: 'Quantity Log', sectionId: 'sec-quantity' },
  { step: 6, title: 'Issues & Blockers', sectionId: 'sec-issues' },
  { step: 7, title: 'Submit DPR', sectionId: 'sec-summary' },
];

// Work narrative log item
export interface DPRWorkItem {
  id: string;
  activityId: string;
  wbs: string;
  title: string;
  discipline: DisciplineType;
  area: string;
  narrative: string;
  hoursWorked: number;
  crewCount: number;
}

// Measured quantity record
export interface DPRQuantityItem {
  id: string;
  activityId: string;
  description: string;
  discipline: DisciplineType;
  plannedToday: number;
  actualToday: number;
  unit: string;
  cumulativeQty: number;
  targetTotal: number;
  status: 'Completed' | 'In Progress' | 'Blocked' | 'On Track';
  variance: number; // percentage variance
  isCriticalPath?: boolean;
}

// Issues / Blockers record
export interface DPRIssueItem {
  id: string;
  activityId: string;
  category: 'Weather' | 'Material Delay' | 'Permit' | 'Equipment' | 'Engineering Clarification';
  severity: 'High' | 'Medium' | 'Low';
  durationHours: number;
  description: string;
  actionTaken: string;
  requiresManagerReview: boolean;
}

// Attached Evidence item
export interface DPREvidenceItem {
  id: string;
  name: string;
  type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE';
  timestamp: string;
  activityId: string;
  locationArea: string;
  fileSize: string;
  geotag?: string;
  signoffBy?: string;
}

export default function DPRPage() {
  const router = useRouter();
  const { activeProject } = useApp();
  const { addToast } = useToast();
  const { isOffline, captureDPR } = useOffline();

  // Active step / focused section
  const [activeStep, setActiveStep] = useState<number>(1);

  // SECTION 2: Date & Shift State
  const [reportingDate, setReportingDate] = useState('2026-09-18');
  const [reportingShift, setReportingShift] = useState<'Shift A' | 'Shift B' | 'Shift C'>('Shift A');
  const [shiftHours, setShiftHours] = useState('8.5');
  const [weatherCondition, setWeatherCondition] = useState('Monsoon Intermittent Rain, 29°C, Wind 14 km/h SW');
  const [groundCondition, setGroundCondition] = useState<'Wet / Saturated' | 'Dry' | 'Muddy'>('Wet / Saturated');

  // SECTION 3: Project State
  const [projectId, setProjectId] = useState(activeProject?.id || 'PRJ-OIL-2026-01');
  const [projectCode, setProjectCode] = useState(activeProject?.code || 'OIL-DUL-01');
  const [projectName, setProjectName] = useState(
    activeProject?.name || 'Duliajan Gas Processing & Pipeline Interconnect'
  );
  const [contractPackage, setContractPackage] = useState('EPC Package 04 - Cross-Country Interconnect & Terminal Station');
  const [clientOwner, setClientOwner] = useState('Oil India Limited (OIL)');
  const [contractorName, setContractorName] = useState('Brahmaputra Engineering & Construction Consortium');
  const [siteEngineer, setSiteEngineer] = useState('Debajit Borah');
  const [siteRole, setSiteRole] = useState('Lead Site Execution Engineer (PE #88412)');
  const [scheduleBaseline, setScheduleBaseline] = useState('Schedule V3 · Rev 3.2 (Approved)');

  // SECTION 4: Area State
  const [selectedArea, setSelectedArea] = useState('Unit A - Gas Processing Area');
  const [specificWorkfront, setSpecificWorkfront] = useState(
    'Piperack Section B, Joint J-04 to J-07 & Compressor Station Bay 1'
  );
  const [ptwPermits, setPtwPermits] = useState(
    'PTW-OIL-2026-894 (Hot Work) · PTW-OIL-2026-895 (Rigging & Crane Lift)'
  );

  // SECTION 5: Discipline & Crew State
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([
    'Piping',
    'Civil / Structural',
  ]);
  const [pipingCrew, setPipingCrew] = useState('1 Foreman, 4 Fitters, 4 Welders, 2 Riggers, 4 Helpers (15 Pax)');
  const [civilCrew, setCivilCrew] = useState('1 Supervisor, 2 Masons, 6 Helpers, 1 RMC Operator (10 Pax)');
  const [electricalCrew, setElectricalCrew] = useState('4 Cable Pullers (4 Pax)');
  const totalHeadcount = 29;

  // SECTION 6: Work Completed Log
  const [workCompletedList, setWorkCompletedList] = useState<DPRWorkItem[]>([
    {
      id: 'WRK-01',
      activityId: 'PIP-24-001',
      wbs: '3.2.1',
      title: 'Erect Line 24-XX High Pressure Gas Header',
      discipline: 'Piping',
      area: 'Unit A - Piperack Section B',
      narrative:
        '12 prefabricated 24-inch spool pieces rigged and positioned onto piperack structural steel beams using 75T mobile crane. Spool alignment, elevation leveling, and flange facing completed per drawing ISO-PIP-24-01-A.',
      hoursWorked: 6.5,
      crewCount: 10,
    },
    {
      id: 'WRK-02',
      activityId: 'PIP-24-002',
      wbs: '3.2.2',
      title: 'Weld Line 24-XX Field Joints & NDT Inspection',
      discipline: 'Piping',
      area: 'Unit A - Piperack Section B (Joints J-04 to J-07)',
      narrative:
        '4 circumferential butt welds (Joints J-04, J-05, J-06, J-07) completed by qualified welders (IDs W-12, W-19). Root pass and visual inspection accepted by site QC. Radiographic testing (RT) scheduled for night shift.',
      hoursWorked: 6.0,
      crewCount: 8,
    },
    {
      id: 'WRK-03',
      activityId: 'CIV-11-001',
      wbs: '2.1.1',
      title: 'Foundation Block A - Compressor Pedestal',
      discipline: 'Civil',
      area: 'Unit A - Compressor Station Bay 1',
      narrative:
        'Compressor foundation pedestal concrete placement completed continuously using ready-mix concrete (RMC). 45 m³ M35 grade concrete poured with poker vibrators. Slump verified at 120mm; 6 standard test cubes cast for 7/28 day curing.',
      hoursWorked: 6.0,
      crewCount: 10,
    },
  ]);

  // SECTION 7: Quantity Log
  const [quantityItems, setQuantityItems] = useState<DPRQuantityItem[]>([
    {
      id: 'QTY-01',
      activityId: 'PIP-24-001',
      description: 'Erect Line 24-XX High Pressure Gas Header',
      discipline: 'Piping',
      plannedToday: 12,
      actualToday: 12,
      unit: 'spools',
      cumulativeQty: 48,
      targetTotal: 48,
      status: 'Completed',
      variance: 0,
      isCriticalPath: true,
    },
    {
      id: 'QTY-02',
      activityId: 'PIP-24-002',
      description: 'Weld Line 24-XX Field Joints & NDT Inspection',
      discipline: 'Piping',
      plannedToday: 4,
      actualToday: 4,
      unit: 'welds',
      cumulativeQty: 18,
      targetTotal: 24,
      status: 'In Progress',
      variance: 0,
      isCriticalPath: true,
    },
    {
      id: 'QTY-03',
      activityId: 'CIV-11-001',
      description: 'Foundation Block A - Compressor Pedestal',
      discipline: 'Civil',
      plannedToday: 45,
      actualToday: 45,
      unit: 'm³ concrete',
      cumulativeQty: 180,
      targetTotal: 180,
      status: 'Completed',
      variance: 0,
      isCriticalPath: true,
    },
    {
      id: 'QTY-04',
      activityId: 'PIP-24-003',
      description: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      discipline: 'Piping',
      plannedToday: 1,
      actualToday: 0,
      unit: 'test pack',
      cumulativeQty: 0,
      targetTotal: 1,
      status: 'Blocked',
      variance: -100,
      isCriticalPath: false,
    },
  ]);

  // SECTION 8: Issues / Blockers
  const [issuesList, setIssuesList] = useState<DPRIssueItem[]>([
    {
      id: 'ISS-01',
      activityId: 'PIP-24-003',
      category: 'Weather',
      severity: 'High',
      durationHours: 3.5,
      description:
        'Intermittent monsoon squall at 11:30 forced suspension of outdoor pressure manifold rigging. Heavy localized downpour saturated manifold trenches.',
      actionTaken:
        'Site rigging suspended in accordance with safety protocol. Temporary tarpaulin cover secured over test header. Re-testing rescheduled to 19 Sep 07:30 shift.',
      requiresManagerReview: true,
    },
    {
      id: 'ISS-02',
      activityId: 'PIP-24-003',
      category: 'Material Delay',
      severity: 'Medium',
      durationHours: 2.0,
      description:
        'Store issue requisition for 24-inch Class 1500 blind test flanges delayed at central warehouse due to stock count verification.',
      actionTaken:
        'Warehouse expediter assigned; physical flanges located and staged at site manifold laydown ready for morning installation.',
      requiresManagerReview: false,
    },
  ]);

  // Safety & Toolbox talk records
  const safetyRecord = {
    incidentCount: 0,
    nearMissCount: 0,
    firstAidCases: 0,
    toolboxTopic: 'Working at Heights & Heavy Rigging Safety in Wet Monsoon Conditions',
    toolboxAttendees: 29,
  };

  // SECTION 9: Evidence List
  const [evidenceList, setEvidenceList] = useState<DPREvidenceItem[]>([
    {
      id: 'EVD-01',
      name: 'IMG_20260918_LINE24_SPOOL_ERECTION.jpg',
      type: 'PHOTO',
      timestamp: '15:35',
      activityId: 'PIP-24-001',
      locationArea: 'Unit A - Piperack Section B',
      fileSize: '3.4 MB',
      geotag: '27.3512° N, 95.3129° E',
    },
    {
      id: 'EVD-02',
      name: 'CRANE_LIFT_SIGN_OFF_SHEET.pdf',
      type: 'INSPECTION_NOTE',
      timestamp: '15:40',
      activityId: 'PIP-24-001',
      locationArea: 'Unit A - Piperack Section B',
      fileSize: '840 KB',
      signoffBy: 'Rigging Superintendent & HSE Officer',
    },
    {
      id: 'EVD-03',
      name: 'IMG_20260918_WELD_BUTT_J04.jpg',
      type: 'PHOTO',
      timestamp: '16:05',
      activityId: 'PIP-24-002',
      locationArea: 'Unit A - Joint J-04',
      fileSize: '2.8 MB',
      geotag: '27.3514° N, 95.3131° E',
    },
    {
      id: 'EVD-04',
      name: 'WELD_LOG_SHEET_SHIFT_A.pdf',
      type: 'DOCUMENT',
      timestamp: '16:15',
      activityId: 'PIP-24-002',
      locationArea: 'Unit A - Pipeline Rack',
      fileSize: '1.2 MB',
      signoffBy: 'Lead QA/QC Welding Inspector',
    },
    {
      id: 'EVD-05',
      name: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf',
      type: 'DOCUMENT',
      timestamp: '14:10',
      activityId: 'CIV-11-001',
      locationArea: 'Unit A - Compressor Bay 1',
      fileSize: '1.5 MB',
      signoffBy: 'RMC Plant QC & Site Engineer',
    },
    {
      id: 'EVD-06',
      name: 'DELAY_NOTICE_WEATHER_STATION.pdf',
      type: 'DOCUMENT',
      timestamp: '13:05',
      activityId: 'PIP-24-003',
      locationArea: 'Duliajan Field Met Office',
      fileSize: '410 KB',
      signoffBy: 'Site Met Station Observer',
    },
  ]);

  // Submission State
  const [submissionState, setSubmissionState] = useState<DPRSubmissionState>('Ready to Submit');
  const dprDocumentNo = 'DPR-OIL-DUL-20260918-001';
  const dprRevision = 'Rev 0 (Official Draft)';

  // Verification & Signoff State
  const [engineerSignoffConfirmed, setEngineerSignoffConfirmed] = useState(true);
  const [managerReviewRouteAcknowledged, setManagerReviewRouteAcknowledged] = useState(true);

  // Detail drawer
  const [selectedQuantityForDrawer, setSelectedQuantityForDrawer] = useState<DPRQuantityItem | null>(null);

  // Computed summary metrics
  const summaryMetrics = useMemo(() => {
    const plannedTasks = quantityItems.length;
    const completedTasks = quantityItems.filter((q) => q.status === 'Completed').length;
    const inProgressTasks = quantityItems.filter((q) => q.status === 'In Progress').length;
    const blockedTasks = quantityItems.filter((q) => q.status === 'Blocked').length;
    const totalManHours = totalHeadcount * parseFloat(shiftHours || '8.5');

    return {
      plannedTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      totalManHours,
      verifiedProofsCount: evidenceList.length,
      scheduleDeltaPercent: 0.42,
    };
  }, [quantityItems, evidenceList, shiftHours]);

  // Handler: Update quantity
  const handleUpdateQuantity = (id: string, field: 'actualToday' | 'unit', value: any) => {
    setQuantityItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'actualToday') {
            const num = parseFloat(value) || 0;
            const variance = item.plannedToday > 0 ? Math.round(((num - item.plannedToday) / item.plannedToday) * 100) : 0;
            updated.actualToday = num;
            updated.variance = variance;
            updated.status = num >= item.plannedToday ? 'Completed' : num > 0 ? 'In Progress' : 'Blocked';
          }
          return updated;
        }
        return item;
      })
    );
  };

  // Handler: Save Draft
  const handleSaveDraft = async () => {
    try {
      if (captureDPR) {
        await captureDPR({
          projectId,
          dprCode: dprDocumentNo,
          date: reportingDate,
          shift: reportingShift,
          siteEngineer,
          contractorName,
          weatherCondition,
          fieldUpdates: quantityItems.map((q) => ({
            id: q.id,
            activityId: q.activityId,
            activityName: q.description,
            discipline: q.discipline,
            quantity: q.actualToday,
            unit: q.unit,
            time: '07:00 - 16:30',
            locationArea: selectedArea,
            remarks: 'Saved in DPR draft',
            evidence: [],
            confidence: 95,
            verificationState: 'Confirmed' as const,
            verificationReason: 'Engineer Draft',
            status: q.status,
            isCriticalPath: q.isCriticalPath,
          })),
        });
      }
      setSubmissionState('Draft');
      addToast({
        type: 'success',
        title: 'Draft Saved',
        description: `Daily Progress Report ${dprDocumentNo} saved to local repository.`,
      });
    } catch {
      setSubmissionState('Draft');
      addToast({
        type: 'success',
        title: 'Draft Saved Locally',
        description: 'DPR state recorded.',
      });
    }
  };

  // Handler: Submit DPR
  const handleSubmitDPR = async () => {
    if (!engineerSignoffConfirmed) {
      addToast({
        type: 'warning',
        title: 'Sign-off Required',
        description: 'Please confirm Site Execution Engineer Attestation before submitting.',
      });
      return;
    }

    setSubmissionState('Processing');
    addToast({
      type: 'info',
      title: 'Submitting DPR',
      description: isOffline
        ? 'Queueing Daily Progress Report to local IndexedDB repository...'
        : 'Synchronizing Daily Progress Report to Schedule Twin...',
    });

    await new Promise((r) => setTimeout(r, 600));

    try {
      if (captureDPR) {
        await captureDPR({
          projectId,
          dprCode: dprDocumentNo,
          date: reportingDate,
          shift: reportingShift,
          siteEngineer,
          contractorName,
          weatherCondition,
          fieldUpdates: quantityItems.map((q) => ({
            id: q.id,
            activityId: q.activityId,
            activityName: q.description,
            discipline: q.discipline,
            quantity: q.actualToday,
            unit: q.unit,
            time: '07:00 - 16:30',
            locationArea: selectedArea,
            remarks: 'Submitted via Daily Progress Report form',
            evidence: evidenceList.map((e) => ({
              id: e.id,
              name: e.name,
              type: e.type,
              timestamp: e.timestamp,
            })),
            confidence: 96,
            verificationState: q.status === 'Blocked' ? ('Conflict' as const) : ('Confirmed' as const),
            verificationReason: 'Certified by Lead Site Execution Engineer',
            status: q.status,
            isCriticalPath: q.isCriticalPath,
          })),
        });
      }

      if (isOffline) {
        setSubmissionState('Saved locally');
        addToast({
          type: 'warning',
          title: 'Saved locally',
          description: `DPR ${dprDocumentNo} queued in offline storage. Will sync when online.`,
        });
      } else {
        setSubmissionState('Submitted');
        addToast({
          type: 'success',
          title: 'DPR Submitted',
          description: `Report ${dprDocumentNo} synchronized with Schedule Twin.`,
        });
      }
    } catch {
      if (isOffline) {
        setSubmissionState('Saved locally');
      } else {
        setSubmissionState('Submitted');
      }
    }
  };

  const breadcrumbs = [
    { label: 'Field Execution', href: '/engineer' },
    { label: 'Daily Progress Report', current: true },
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* OFFLINE MODE BANNER */}
        {isOffline && (
          <div className="p-4 rounded-lg bg-[#FDF6ED] border border-[#F0D4A6] flex items-center justify-between gap-3 text-xs text-[#8C5311]">
            <div className="flex items-center gap-2">
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

        {/* =========================================================================
            SECTION 1: DAILY PROGRESS REPORT (Document Header & Top Actions)
            ========================================================================= */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs font-bold px-3 py-0.5 rounded bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5]">
                  {dprDocumentNo}
                </span>
                <span className="font-mono text-[11px] text-[#596579] bg-[#FAFAFA] px-2 py-0.5 rounded border border-[#E5E7EB]">
                  {dprRevision}
                </span>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded border inline-flex items-center gap-2 ${
                    submissionState === 'Submitted'
                      ? 'bg-[#EDF7F2] text-[#2E7D5B] border-[#B8DCC9]'
                      : submissionState === 'Saved locally'
                      ? 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]'
                      : submissionState === 'Processing'
                      ? 'bg-[#EDF5F8] text-[#176B87] border-[#B3CBE0]'
                      : submissionState === 'Needs Confirmation'
                      ? 'bg-[#FDF6ED] text-[#8C5311] border-[#F0D4A6]'
                      : 'bg-[#F1F3F5] text-[#172033] border-[#D9DEE5]'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{submissionState}</span>
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Daily Progress Report
              </h1>
              <p className="text-xs sm:text-sm text-[#596579] mt-1">
                Official EPC project site execution record, labor allocation, quantity progress, and Schedule Twin log sheet.
              </p>
            </div>

            {/* Top Primary Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] active:bg-[#E5E7EB] rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
              >
                <Save className="w-4 h-4 text-[#596579]" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={handleSubmitDPR}
                disabled={submissionState === 'Processing'}
                className="min-h-[48px] px-4 sm:px-6 py-2 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] disabled:opacity-50 rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Submit DPR</span>
              </button>
            </div>
          </div>

          {/* Structured Document Metadata Strip / Section Quick Jumps */}
          <div className="mt-4 pt-1 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 text-[#596579] flex-wrap">
              <span>
                Project: <strong className="text-[#172033]">{projectCode}</strong>
              </span>
              <span>•</span>
              <span>
                Date: <strong className="text-[#172033]">{reportingDate}</strong> ({reportingShift})
              </span>
              <span>•</span>
              <span>
                Engineer: <strong className="text-[#172033]">{siteEngineer}</strong>
              </span>
              <span>•</span>
              <span>
                Crew: <strong className="text-[#172033]">{totalHeadcount} Pax</strong>
              </span>
            </div>

            {/* Stepper Touch Target Buttons */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-[11px] font-semibold text-[#596579] mr-1 hidden sm:inline">
                Section Jump:
              </span>
              <button
                type="button"
                disabled={activeStep <= 1}
                onClick={() => setActiveStep((prev) => Math.max(1, prev - 1))}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg border border-[#D9DEE5] bg-white text-[#172033] hover:bg-[#F1F3F5] active:bg-[#E5E7EB] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous section"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs px-3 py-1.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-md font-bold text-[#176B87]">
                {activeStep} / 7: {stepsConfig[activeStep - 1]?.title}
              </span>
              <button
                type="button"
                disabled={activeStep >= 7}
                onClick={() => setActiveStep((prev) => Math.min(7, prev + 1))}
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg border border-[#D9DEE5] bg-white text-[#172033] hover:bg-[#F1F3F5] active:bg-[#E5E7EB] disabled:opacity-40 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next section"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Structured Engineering Form Body */}
        <div className="space-y-6">
          {/* =========================================================================
              SECTION 2: DATE
              ========================================================================= */}
          <section id="sec-project-date" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Date & Shift Information
                </h2>
              </div>
              <span className="text-xs text-[#596579]">Shift Working Baseline</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Reporting Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={reportingDate}
                    onChange={(e) => setReportingDate(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-bold text-[#172033] outline-hidden focus:border-[#176B87]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Shift Timing
                </label>
                <select
                  value={reportingShift}
                  onChange={(e) => setReportingShift(e.target.value as any)}
                  className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033] outline-hidden focus:border-[#176B87]"
                >
                  <option value="Shift A">Shift A (Day: 07:00 – 16:30)</option>
                  <option value="Shift B">Shift B (Evening: 16:30 – 00:00)</option>
                  <option value="Shift C">Shift C (Night: 00:00 – 07:00)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Working Hours
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={shiftHours}
                    onChange={(e) => setShiftHours(e.target.value)}
                    className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-bold text-[#172033] outline-hidden focus:border-[#176B87]"
                  />
                  <span className="text-[#596579] font-medium shrink-0">Hours</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Ground Condition
                </label>
                <select
                  value={groundCondition}
                  onChange={(e) => setGroundCondition(e.target.value as any)}
                  className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033] outline-hidden focus:border-[#176B87]"
                >
                  <option value="Wet / Saturated">Wet / Saturated (Monsoon)</option>
                  <option value="Dry">Dry / Stable</option>
                  <option value="Muddy">Muddy / Soft Soil</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Weather & Environmental Parameters
                </label>
                <input
                  type="text"
                  value={weatherCondition}
                  onChange={(e) => setWeatherCondition(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-hidden focus:border-[#176B87]"
                  placeholder="e.g. Temperature, rainfall, humidity, wind conditions"
                />
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 3: PROJECT
              ========================================================================= */}
          <section className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Project Particulars
                </h2>
              </div>
              <span className="font-mono text-xs text-[#176B87] font-semibold">
                {scheduleBaseline}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Project Code & Name
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-mono font-bold text-[#172033] block">{projectCode}</span>
                  <span className="text-[#596579] font-medium text-[11px]">{projectName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Contract / Package
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-bold text-[#172033] block">{contractPackage}</span>
                  <span className="text-[#596579] text-[11px]">Client: {clientOwner}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Executing EPC Contractor
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-bold text-[#172033] block">{contractorName}</span>
                  <span className="text-[#596579] text-[11px]">Consortium Partner: Brahmaputra Infra Ltd</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Site Execution Engineer
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-bold text-[#172033] block">{siteEngineer}</span>
                  <span className="text-[#596579] text-[11px]">{siteRole}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Schedule Twin Integration
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-bold text-[#2E7D5B] block">Connected & Synchronized</span>
                  <span className="text-[#596579] text-[11px]">Primavera P6 XML / Level 5 WBS</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#596579] uppercase tracking-wider text-[10px] block">
                  Contract Status
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="font-bold text-[#172033] block">Active Execution (Month 7 of 18)</span>
                  <span className="text-[#596579] text-[11px]">Target COD: 31 March 2027</span>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 4: AREA
              ========================================================================= */}
          <section id="sec-area" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Area & Workfront Location
                </h2>
              </div>
              <span className="text-xs text-[#596579]">Site Zones & Active Fronts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Primary Site Area / Plant Section
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033] outline-hidden focus:border-[#176B87]"
                >
                  <option value="Unit A - Gas Processing Area">Unit A - Gas Processing Area</option>
                  <option value="Unit B - Compressor & Compression Station">Unit B - Compressor & Compression Station</option>
                  <option value="Unit C - Piperack Section B & Tie-in Manifold">Unit C - Piperack Section B & Tie-in Manifold</option>
                  <option value="Offsite - Pipeline Interconnect Corridor KM 0+000 to 14+500">
                    Offsite - Pipeline Corridor KM 0+000 to 14+500
                  </option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Specific Workfront / Isometric Grid / Chainage
                </label>
                <input
                  type="text"
                  value={specificWorkfront}
                  onChange={(e) => setSpecificWorkfront(e.target.value)}
                  className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs font-medium text-[#172033] outline-hidden focus:border-[#176B87]"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                  Permit to Work (PTW) Coverage
                </label>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D5B]" />
                    <span className="font-mono font-medium text-[#172033]">{ptwPermits}</span>
                  </div>
                  <span className="text-[11px] text-[#2E7D5B] font-bold bg-[#EDF7F2] border border-[#B8DCC9] px-2 py-0.5 rounded">
                    PTW Valid until 18:00 IST
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 5: DISCIPLINE
              ========================================================================= */}
          <section id="sec-discipline" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Discipline & Manpower Deployment
                </h2>
              </div>
              <span className="text-xs font-bold text-[#172033]">
                Total Site Deployment: {totalHeadcount} Pax
              </span>
            </div>

            {/* Discipline Checkboxes */}
            <div className="space-y-2">
              <label className="font-bold text-[#172033] uppercase tracking-wider text-[11px] block">
                Disciplines Active Today
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {['Piping', 'Civil / Structural', 'Mechanical', 'Electrical & Instrumentation'].map((d) => {
                  const isChecked = selectedDisciplines.includes(d);
                  return (
                    <label
                      key={d}
                      className={`p-3 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#176B87] bg-[#EDF5F8] text-[#176B87] font-bold'
                          : 'border-[#D9DEE5] bg-white text-[#596579] hover:bg-[#F7F8FA]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedDisciplines((prev) =>
                            isChecked ? prev.filter((item) => item !== d) : [...prev, d]
                          );
                        }}
                        className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5]"
                      />
                      <span>{d}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Manpower Breakdown Table */}
            <div className="border border-[#D9DEE5] rounded-lg overflow-hidden text-xs">
              <div className="bg-[#F7F8FA] p-3 border-b border-[#D9DEE5] font-bold text-[#172033] flex items-center justify-between">
                <span>Discipline Crew Allocation</span>
                <span className="text-[11px] text-[#596579] font-normal">Direct Labor on Site</span>
              </div>
              <div className="divide-y divide-[#D9DEE5] p-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-[#172033] w-32 shrink-0">Piping Crew:</span>
                  <input
                    type="text"
                    value={pipingCrew}
                    onChange={(e) => setPipingCrew(e.target.value)}
                    className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded text-xs text-[#172033]"
                  />
                  <span className="font-mono font-bold text-[#176B87] shrink-0 text-right w-16">15 Pax</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <span className="font-bold text-[#172033] w-32 shrink-0">Civil Crew:</span>
                  <input
                    type="text"
                    value={civilCrew}
                    onChange={(e) => setCivilCrew(e.target.value)}
                    className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded text-xs text-[#172033]"
                  />
                  <span className="font-mono font-bold text-[#176B87] shrink-0 text-right w-16">10 Pax</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
                  <span className="font-bold text-[#172033] w-32 shrink-0">E&I Crew:</span>
                  <input
                    type="text"
                    value={electricalCrew}
                    onChange={(e) => setElectricalCrew(e.target.value)}
                    className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded text-xs text-[#172033]"
                  />
                  <span className="font-mono font-bold text-[#176B87] shrink-0 text-right w-16">4 Pax</span>
                </div>
              </div>
            </div>
          </section>

          {/* =========================================================================
              SECTION 6: WORK COMPLETED
              ========================================================================= */}
          <section id="sec-work-completed" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Work Completed Narrative
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newId = `WRK-0${workCompletedList.length + 1}`;
                  setWorkCompletedList([
                    ...workCompletedList,
                    {
                      id: newId,
                      activityId: 'ELE-06-004',
                      wbs: '4.1.2',
                      title: 'Pull Cable Tray TR-04 Main Feeder',
                      discipline: 'Electrical',
                      area: 'Substation to Rack 2',
                      narrative:
                        'Pulling of 350 meters HT cable completed along designated cable ladder TR-04. Megger insulation test performed and approved.',
                      hoursWorked: 5.0,
                      crewCount: 4,
                    },
                  ]);
                  addToast({
                    type: 'success',
                    title: 'Work Item Added',
                    description: 'Added work completed log for ELE-06-004.',
                  });
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#176B87] bg-[#EDF5F8] border border-[#B3CBE0] hover:bg-[#D6EBF0] rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Activity Narrative</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {workCompletedList.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border border-[#D9DEE5] bg-[#FAFAFA] space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DEE5] pb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-[#176B87] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                        {item.activityId}
                      </span>
                      <span className="font-mono text-[10px] text-[#7B8798]">WBS {item.wbs}</span>
                      <span className="font-bold text-[#172033]">{item.title}</span>
                      <span className="text-[10px] font-semibold text-[#596579] bg-[#F1F3F5] px-2 py-0.5 rounded">
                        {item.discipline}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#596579]">
                        {item.hoursWorked} hrs • {item.crewCount} crew
                      </span>
                      {workCompletedList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setWorkCompletedList(workCompletedList.filter((w) => w.id !== item.id))}
                          className="text-[#7B8798] hover:text-[#B5473C] p-1 transition-colors"
                          title="Remove narrative"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-[#596579] block">
                      Execution Narrative & Technical Observations
                    </label>
                    <textarea
                      rows={2}
                      value={item.narrative}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWorkCompletedList((prev) =>
                          prev.map((w) => (w.id === item.id ? { ...w, narrative: val } : w))
                        );
                      }}
                      className="w-full p-3 bg-white border border-[#D9DEE5] rounded-lg text-xs text-[#172033] leading-relaxed outline-hidden focus:border-[#176B87]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* =========================================================================
              SECTION 7: QUANTITY
              ========================================================================= */}
          <section id="sec-quantity" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Quantity Progress & Output Certification
                </h2>
              </div>
              <span className="text-xs text-[#596579]">
                Certified physical measures against baseline schedule
              </span>
            </div>

            {/* Quantity Table with horizontal scroll min-width */}
            <div className="border border-[#D9DEE5] rounded-lg overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-[#F7F8FA]">
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579] h-11">
                    <th className="py-3 px-4">Activity ID</th>
                    <th className="py-3 px-4">Work Item Description</th>
                    <th className="py-3 px-4">Discipline</th>
                    <th className="py-3 px-4 text-center">Baseline Plan</th>
                    <th className="py-3 px-4 text-center">Actual Today</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4 text-center">Cumul / Total</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]/60">
                  {quantityItems.map((q) => (
                    <tr key={q.id} className="h-11 sm:h-12 hover:bg-[#F7F8FA]/60 transition-colors">
                      <td className="p-3">
                        <div className="font-mono font-bold text-[#176B87]">{q.activityId}</div>
                        {q.isCriticalPath && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA] inline-block mt-0.5">
                            Critical Path
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-[#172033] max-w-[200px] truncate">
                          {q.description}
                        </div>
                      </td>
                      <td className="p-3 text-[#596579]">
                        <span className="px-2 py-0.5 rounded bg-[#F1F3F5] text-[11px] font-medium">
                          {q.discipline}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-[#596579]">
                        {q.plannedToday}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          step="any"
                          value={q.actualToday}
                          onChange={(e) => handleUpdateQuantity(q.id, 'actualToday', e.target.value)}
                          className="w-20 p-2 bg-white border border-[#D9DEE5] rounded font-mono font-bold text-xs text-[#172033] text-center focus:border-[#176B87]"
                        />
                      </td>
                      <td className="p-3 text-[#596579] font-medium">
                        <input
                          type="text"
                          value={q.unit}
                          onChange={(e) => handleUpdateQuantity(q.id, 'unit', e.target.value)}
                          className="w-20 p-2 bg-transparent border-b border-dashed border-[#D9DEE5] text-xs font-medium text-[#172033]"
                        />
                      </td>
                      <td className="p-3 text-center font-mono text-[11px] text-[#596579]">
                        {q.cumulativeQty} / {q.targetTotal}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === 'Completed'
                              ? 'bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]'
                              : q.status === 'Blocked'
                              ? 'bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]'
                              : 'bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]'
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedQuantityForDrawer(q)}
                          className="text-[#176B87] hover:underline font-semibold text-[11px] cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* =========================================================================
              SECTION 8: ISSUES / BLOCKERS
              ========================================================================= */}
          <section id="sec-issues" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  7
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Issues, Delays & Site Blockers
                </h2>
              </div>
              <span className="text-xs text-[#B5473C] font-semibold">
                {issuesList.length} Stoppages Recorded
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {issuesList.map((iss) => (
                <div
                  key={iss.id}
                  className={`p-4 rounded-lg border space-y-2 ${
                    iss.severity === 'High'
                      ? 'bg-[#FBEFEE]/50 border-[#E4B0AA]'
                      : 'bg-[#FDF6ED]/50 border-[#F0D4A6]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/10 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#172033]">{iss.id}</span>
                      <span className="font-mono font-bold text-[#176B87] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                        {iss.activityId}
                      </span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-white border border-[#D9DEE5] text-[#172033]">
                        {iss.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#B5473C]">
                        {iss.durationHours} hrs Stoppage
                      </span>
                      {iss.requiresManagerReview && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FBEFEE] text-[#B5473C] border border-[#E4B0AA]">
                          Requires Manager Routing
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[#172033] font-medium leading-relaxed">
                    <strong>Cause:</strong> {iss.description}
                  </p>
                  <p className="text-[#596579]">
                    <strong>Action Taken / Plan:</strong> {iss.actionTaken}
                  </p>
                </div>
              ))}
            </div>

            {/* HSE / Safety Box */}
            <div className="p-4 bg-[#EDF7F2] border border-[#B8DCC9] rounded-lg text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-[#2E7D5B]">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Health, Safety & Environment (HSE) Shift Record
                </span>
                <span>Zero LTI Logged</span>
              </div>
              <p className="text-[#596579] text-[11px]">
                Toolbox Talk Topic: <strong>{safetyRecord.toolboxTopic}</strong> ({safetyRecord.toolboxAttendees} participants).
                Zero First Aid, Zero Medical Treatment Cases, Zero Near Misses reported during this shift.
              </p>
            </div>
          </section>

          {/* =========================================================================
              SECTION 9: EVIDENCE
              ========================================================================= */}
          <section id="sec-evidence" className="bg-white border border-[#D9DEE5] rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-4">
            <div className="border-b border-[#D9DEE5] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#EDF5F8] text-[#176B87] font-bold text-xs flex items-center justify-center">
                  8
                </span>
                <h2 className="text-base font-bold text-[#172033]">
                  Physical Evidence & Inspection Documents
                </h2>
              </div>
              <span className="text-xs text-[#596579]">
                {evidenceList.length} Verifiable Files Attached
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg space-y-2 hover:bg-white transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-[#176B87] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                      {ev.activityId}
                    </span>
                    <span className="text-[10px] text-[#7B8798]">{ev.timestamp}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-1">
                    {ev.type === 'PHOTO' ? (
                      <Camera className="w-4 h-4 text-[#176B87] shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#596579] shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#172033] truncate text-[11px]">
                        {ev.name}
                      </p>
                      <p className="text-[10px] text-[#7B8798]">{ev.fileSize} • {ev.locationArea}</p>
                    </div>
                  </div>
                  {ev.geotag && (
                    <div className="text-[10px] text-[#596579] font-mono flex items-center gap-1 pt-1 border-t border-[#D9DEE5]">
                      <MapPin className="w-3 h-3 text-[#176B87]" />
                      <span>{ev.geotag}</span>
                    </div>
                  )}
                  {ev.signoffBy && (
                    <div className="text-[10px] text-[#2E7D5B] font-semibold pt-1 border-t border-[#D9DEE5]">
                      Signoff: {ev.signoffBy}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Attach Evidence Action Bar */}
            <div className="p-4 border-2 border-dashed border-[#D9DEE5] rounded-lg text-center bg-[#F7F8FA]">
              <p className="text-xs font-semibold text-[#172033]">
                Attach Geotagged Photos, Inspection Sheets, or Delivery Slips
              </p>
              <p className="text-[11px] text-[#7B8798] mt-0.5">
                Supported: JPG, PNG, PDF, DWG (Max 25MB per file)
              </p>
              <button
                type="button"
                onClick={() => {
                  const newEv: DPREvidenceItem = {
                    id: `EVD-${Date.now()}`,
                    name: `IMG_${reportingDate.replace(/-/g, '')}_FIELD_CHECK.jpg`,
                    type: 'PHOTO',
                    timestamp: '16:30',
                    activityId: 'PIP-24-001',
                    locationArea: selectedArea,
                    fileSize: '2.1 MB',
                    geotag: '27.3513° N, 95.3130° E',
                  };
                  setEvidenceList([...evidenceList, newEv]);
                  addToast({
                    type: 'success',
                    title: 'Evidence Attached',
                    description: `Attached ${newEv.name}`,
                  });
                }}
                className="mt-2 px-3 py-1.5 text-xs font-bold text-[#176B87] bg-white border border-[#B3CBE0] hover:bg-[#EDF5F8] rounded-lg inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Upload New File</span>
              </button>
            </div>
          </section>

          {/* =========================================================================
              SECTION 10: GENERATED SUMMARY (Structured Generated-Summary Panel)
              ========================================================================= */}
          <section id="sec-summary" className="bg-white border-2 border-[#176B87]/30 rounded-lg p-4 sm:p-6 md:p-6 shadow-xs space-y-6">
            <div className="border-b border-[#D9DEE5] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-[#176B87] text-white font-bold text-xs flex items-center justify-center">
                  9
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#172033]">
                    Generated Summary Panel
                  </h2>
                  <p className="text-xs text-[#596579]">
                    Audited shift compilation and Schedule Twin synchronization preview
                  </p>
                </div>
              </div>

              <span className="font-mono text-xs text-[#176B87] font-bold bg-[#EDF5F8] px-3 py-1 rounded border border-[#B3CBE0]">
                Pre-Submission Audit Dossier
              </span>
            </div>

            {/* Structured Table: Audited Shift Deliverables */}
            <div className="border border-[#D9DEE5] rounded-lg overflow-hidden text-sm">
              <table className="w-full border-collapse">
                <tbody className="divide-y divide-[#D9DEE5]/60">
                  <tr className="bg-[#FAFAFA] h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579] w-1/3">Document Reference</td>
                    <td className="py-3 px-4 font-mono font-bold text-[#172033]">
                      {dprDocumentNo} • {dprRevision}
                    </td>
                  </tr>
                  <tr className="h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579]">Reporting Window</td>
                    <td className="py-3 px-4 text-[#172033]">
                      {reportingDate} ({reportingShift}) • <strong>{summaryMetrics.totalManHours} Productive Man-Hours</strong> ({totalHeadcount} pax)
                    </td>
                  </tr>
                  <tr className="bg-[#FAFAFA] h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579]">Activities Progressed</td>
                    <td className="py-3 px-4 text-[#172033]">
                      <span className="font-bold text-[#2E7D5B]">{summaryMetrics.completedTasks} Completed</span>,{' '}
                      <span className="font-bold text-[#176B87]">{summaryMetrics.inProgressTasks} In Progress</span>,{' '}
                      <span className="font-bold text-[#B5473C]">{summaryMetrics.blockedTasks} Blocked</span> (Total: {summaryMetrics.plannedTasks} activities worked)
                    </td>
                  </tr>
                  <tr className="h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579]">Schedule Twin Impact</td>
                    <td className="py-3 px-4 text-[#172033]">
                      Advances project cumulative progress by <strong>+{summaryMetrics.scheduleDeltaPercent}%</strong>.
                      Line 24-XX critical path remains on baseline (0 days float deviation).
                    </td>
                  </tr>
                  <tr className="bg-[#FAFAFA] h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579]">Physical Evidence Audit</td>
                    <td className="py-3 px-4 text-[#172033]">
                      <span className="font-bold text-[#2E7D5B]">{summaryMetrics.verifiedProofsCount} Verified Attachments</span> (Photographs with GPS coordinates, Crane lift tickets, Weld QC inspection sheets).
                    </td>
                  </tr>
                  <tr className="h-11 sm:h-12">
                    <td className="py-3 px-4 font-semibold text-[#596579]">Variance / Stoppage Governance</td>
                    <td className="py-3 px-4 text-[#172033]">
                      Activity <strong>PIP-24-003 Hydrostatic Testing</strong> variance flagged due to monsoon squall & flange requisition hold.
                      Routed to Manager Review Queue (/matching).
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Engineer Formal Attestation & Governance Checkbox */}
            <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-2 text-xs">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={engineerSignoffConfirmed}
                  onChange={(e) => setEngineerSignoffConfirmed(e.target.checked)}
                  className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5] mt-0.5 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-[#172033] block">
                    Certified by Lead Site Execution Engineer: {siteEngineer} ({siteRole})
                  </span>
                  <span className="text-[#596579] leading-relaxed">
                    I certify that the stated quantities, man-hours, and physical evidence accurately reflect site execution at {projectName} on {reportingDate}.
                  </span>
                </div>
              </label>
            </div>

            {/* Final Action Buttons Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-[#D9DEE5]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="px-4 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
                >
                  <Save className="w-4 h-4 text-[#596579]" />
                  <span>Save Draft</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSubmitDPR}
                  disabled={submissionState === 'Processing'}
                  className="min-h-[48px] px-6 py-2 text-xs sm:text-sm font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:bg-[#135A72] disabled:opacity-50 rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submissionState === 'Processing'
                      ? 'Submitting DPR...'
                      : isOffline
                      ? 'Save DPR Locally to Offline Queue'
                      : 'Submit DPR'}
                  </span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* DETAIL INSPECTION DRAWER */}
        <Drawer
          isOpen={!!selectedQuantityForDrawer}
          onClose={() => setSelectedQuantityForDrawer(null)}
          title={`Activity Detail: ${selectedQuantityForDrawer?.activityId || ''}`}
          subtitle={selectedQuantityForDrawer?.description || ''}
          width="md"
        >
          {selectedQuantityForDrawer && (
            <div className="space-y-4 text-xs text-[#172033]">
              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#596579] block">Discipline & Status</span>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{selectedQuantityForDrawer.discipline}</span>
                  <span className="font-bold text-[#176B87]">{selectedQuantityForDrawer.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-[#596579] block">Planned Target</span>
                  <span className="font-mono font-bold text-sm">
                    {selectedQuantityForDrawer.plannedToday} {selectedQuantityForDrawer.unit}
                  </span>
                </div>
                <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg">
                  <span className="text-[10px] uppercase font-semibold text-[#596579] block">Actual Executed</span>
                  <span className="font-mono font-bold text-sm text-[#2E7D5B]">
                    {selectedQuantityForDrawer.actualToday} {selectedQuantityForDrawer.unit}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1">
                <span className="text-[10px] uppercase font-semibold text-[#596579] block">Schedule Cumulative Progress</span>
                <div className="flex items-center justify-between text-xs">
                  <span>To Date: <strong>{selectedQuantityForDrawer.cumulativeQty} {selectedQuantityForDrawer.unit}</strong></span>
                  <span>Scope Total: <strong>{selectedQuantityForDrawer.targetTotal} {selectedQuantityForDrawer.unit}</strong></span>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </AppShell>
  );
}
