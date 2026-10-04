'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { AppShell } from '../../components/shell/AppShell';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Drawer } from '../../components/shared/Drawer';
import { Modal } from '../../components/shared/Modal';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { MatchExplanation } from '../../components/shared/MatchExplanation';
import { ProgressBar } from '../../components/shared/ProgressBar';
import { DisciplineType } from '../../types';
import { MOCK_ACTIVITIES } from '../../lib/api/mockData';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Clock,
  Copy,
  History,
  FileText,
  Camera,
  Layers,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Search,
  Filter,
  Check,
  X,
  Edit3,
  MessageSquare,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  Info,
  Calendar,
  User,
  Plus,
  Minus,
  Save,
  Send,
  GitCompare,
} from 'lucide-react';

// Summary Tabs required by specification
export type ReviewTab =
  | 'High Confidence'
  | 'Manager Review'
  | 'Unmatched'
  | 'Conflicts'
  | 'Duplicates'
  | 'Stale';

export interface ReviewCandidate {
  activityId: string;
  activityName: string;
  wbs: string;
  discipline: DisciplineType;
  confidence: number;
  reasons: string[];
}

export interface ReviewEvent {
  id: string;
  source: 'DPR_PDF' | 'VOICE_AGENT' | 'FIELD_QUICK_FORM' | 'SITE_DIARY' | 'EXCEL_SHEET';
  rawFieldStatement: string;
  extractedQuantity: number;
  unit: string;
  area: string;
  line?: string;
  discipline: DisciplineType;
  workType: string;
  shiftTime: string;
  candidateActivityId: string | null;
  candidateActivityName: string | null;
  candidateWbs: string | null;
  confidence: number; // 0-100
  matchReason: string;
  evidenceCount: number;
  evidenceItems: Array<{
    id: string;
    title: string;
    type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE';
    timestamp: string;
  }>;
  submittedBy: string;
  date: string;
  status: ReviewTab;
  isApproved?: boolean;
  isRejected?: boolean;
  alternativeCandidates: ReviewCandidate[];
  signals: Array<{ name: string; score: number; maxScore: number; reason: string }>;
  rulesEvaluated: Array<{ name: string; status: 'PASSED' | 'WARNING' | 'FAILED'; details: string }>;
}

// Initial realistic Review Queue events
const INITIAL_REVIEW_EVENTS: ReviewEvent[] = [
  {
    id: 'EVT-2026-001',
    source: 'DPR_PDF',
    rawFieldStatement:
      'Spool erection completed on Line 24. 12 spools erected today with crane support. Work started at 09:00 and finished at 16:30.',
    extractedQuantity: 12,
    unit: 'spools',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Erection',
    shiftTime: '09:00 - 16:30',
    candidateActivityId: 'PIP-24-001',
    candidateActivityName: 'Erect Line 24-XX High Pressure Gas Header',
    candidateWbs: '3.2.1',
    confidence: 94,
    matchReason: 'Line 24-XX identifier confirmed in report · Piping erection mapped to L5 schedule',
    evidenceCount: 2,
    evidenceItems: [
      { id: 'EVD-001', title: 'IMG_20260914_Line24_Erect.jpg', type: 'PHOTO', timestamp: '16:30' },
      { id: 'EVD-002', title: 'DPR_OIL_DUL_20260914.pdf', type: 'DOCUMENT', timestamp: '18:00' },
    ],
    submittedBy: 'Debajit Borah (Lead Site Engineer)',
    date: '2026-09-14 17:15',
    status: 'High Confidence',
    alternativeCandidates: [
      {
        activityId: 'PIP-24-002',
        activityName: 'Weld Line 24-XX Field Joints',
        wbs: '3.2.2',
        discipline: 'Piping',
        confidence: 71,
        reasons: ['Same line section', 'Successor welding activity'],
      },
      {
        activityId: 'PIP-25-003',
        activityName: 'Erect Line 25-YY Fuel Gas Header',
        wbs: '3.3.1',
        discipline: 'Piping',
        confidence: 42,
        reasons: ['Different line number'],
      },
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping strictly matches baseline discipline' },
      { name: 'Line / Asset Identifier', score: 35, maxScore: 35, reason: 'Exact match for Line 24-XX gas header' },
      { name: 'Semantic Action Verb', score: 20, maxScore: 20, reason: 'Spool erection mapped to Erect Line 24-XX' },
      { name: 'Temporal Scheduled Window', score: 14, maxScore: 15, reason: 'Execution date is within scheduled window' },
    ],
    rulesEvaluated: [
      { name: 'Quantity Ceiling Enforcement', status: 'PASSED', details: '12 spools <= 12 planned unexecuted spools' },
      { name: 'Mandatory Physical Evidence', status: 'PASSED', details: '2 physical proofs attached (photo & DPR PDF)' },
      { name: 'Discipline Boundary Check', status: 'PASSED', details: 'Piping discipline conforms to WBS 3.2' },
      { name: 'Predecessor Dependency Check', status: 'PASSED', details: 'Foundation pedestal confirmed completed' },
    ],
  },
  {
    id: 'EVT-2026-002',
    source: 'EXCEL_SHEET',
    rawFieldStatement:
      'Line 24 spool welding completed 8 joints today. 4 joints pending radiographic clearance.',
    extractedQuantity: 8,
    unit: 'welds',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Welding',
    shiftTime: '10:00 - 16:00',
    candidateActivityId: 'PIP-24-002',
    candidateActivityName: 'Weld Line 24-XX Field Joints & NDT Inspection',
    candidateWbs: '3.2.2',
    confidence: 86,
    matchReason: 'Line 24 identified · Partial quantity reporting requires planner review',
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-003', title: 'WELD_LOG_SHEET_SHIFT_A.pdf', type: 'INSPECTION_NOTE', timestamp: '16:15' },
    ],
    submittedBy: 'Debajit Borah (Lead Site Engineer)',
    date: '2026-09-16 18:20',
    status: 'Manager Review',
    alternativeCandidates: [
      {
        activityId: 'PIP-24-001',
        activityName: 'Erect Line 24-XX High Pressure Gas Header',
        wbs: '3.2.1',
        discipline: 'Piping',
        confidence: 68,
        reasons: ['Erection already completed'],
      },
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping discipline matches' },
      { name: 'Line / Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 identified' },
      { name: 'Semantic Action Verb', score: 18, maxScore: 20, reason: 'Welding corresponds to planned joint weld' },
      { name: 'Temporal Window', score: 8, maxScore: 15, reason: 'Pushed back due to predecessor slip' },
    ],
    rulesEvaluated: [
      { name: 'Quantity Ceiling Enforcement', status: 'PASSED', details: '8 welds <= 24 planned joints' },
      { name: 'NDT Radiographic Hold', status: 'WARNING', details: '4 joints pending evening RT clearance' },
      { name: 'Discipline Boundary Check', status: 'PASSED', details: 'Piping conforms to WBS 3.2.2' },
    ],
  },
  {
    id: 'EVT-2026-003',
    source: 'VOICE_AGENT',
    rawFieldStatement:
      'Cable ladder tray installation done from sub to comp bay about 45 meters along overhead gallery.',
    extractedQuantity: 45,
    unit: 'meters',
    area: 'Unit A Overhead Gallery',
    line: 'Overhead Gallery',
    discipline: 'Electrical',
    workType: 'Installation',
    shiftTime: '08:30 - 15:00',
    candidateActivityId: 'ELE-11-032',
    candidateActivityName: 'Cable Tray Installation - Substation to Compressor Bay',
    candidateWbs: '5.1.1',
    confidence: 78,
    matchReason: 'Substation to compressor bay identified · Lacks physical photo attachment',
    evidenceCount: 0,
    evidenceItems: [],
    submittedBy: 'Supervisor Voice Agent (Transcribed)',
    date: '2026-09-17 16:00',
    status: 'Manager Review',
    alternativeCandidates: [],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Electrical discipline confirmed' },
      { name: 'Asset Identifier', score: 25, maxScore: 35, reason: 'Substation to compressor bay identified' },
      { name: 'Semantic Action Verb', score: 16, maxScore: 20, reason: 'Cable ladder tray corresponds to ELE-11-032' },
      { name: 'Temporal Window', score: 12, maxScore: 15, reason: 'Within planned installation window' },
    ],
    rulesEvaluated: [
      { name: 'Quantity Ceiling Enforcement', status: 'PASSED', details: '45 meters <= 320 planned meters' },
      { name: 'Mandatory Physical Evidence', status: 'WARNING', details: 'No photographic evidence attached' },
      { name: 'Discipline Boundary Check', status: 'PASSED', details: 'Electrical conforms to WBS 5.1' },
    ],
  },
  {
    id: 'EVT-2026-004',
    source: 'SITE_DIARY',
    rawFieldStatement:
      'Pipe installation completed near Unit B drain line. Grouting applied on support blocks.',
    extractedQuantity: 1,
    unit: 'job',
    area: 'Unit B - Offsites',
    line: 'Drain Line',
    discipline: 'Piping',
    workType: 'Installation',
    shiftTime: 'General Shift',
    candidateActivityId: null,
    candidateActivityName: null,
    candidateWbs: null,
    confidence: 47,
    matchReason: 'No baseline activity exists for Unit B drain in master schedule',
    evidenceCount: 0,
    evidenceItems: [],
    submittedBy: 'Debajit Borah (Lead Site Engineer)',
    date: '2026-09-17 17:30',
    status: 'Unmatched',
    alternativeCandidates: [],
    signals: [
      { name: 'Discipline Alignment', score: 20, maxScore: 25, reason: 'Piping' },
      { name: 'Asset Identifier', score: 10, maxScore: 35, reason: 'No schedule activity found for Unit B Drain' },
      { name: 'Semantic Action Verb', score: 12, maxScore: 20, reason: 'Generic installation' },
      { name: 'Temporal Window', score: 5, maxScore: 15, reason: 'Uncorrelated' },
    ],
    rulesEvaluated: [
      { name: 'WBS Baseline Existence', status: 'FAILED', details: 'No activity matches Unit B offsite drainage' },
    ],
  },
  {
    id: 'EVT-2026-005',
    source: 'FIELD_QUICK_FORM',
    rawFieldStatement:
      'Hydrostatic testing preparation for Line 24 section. Work paused at 11:30 due to sudden monsoon squall and missing 150 bar blind flanges from warehouse.',
    extractedQuantity: 0,
    unit: 'sections',
    area: 'Unit A - Test Manifold',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Hydrostatic Testing',
    shiftTime: '11:30 - 13:00',
    candidateActivityId: 'PIP-24-003',
    candidateActivityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    candidateWbs: '3.2.3',
    confidence: 62,
    matchReason: 'Predecessor PIP-24-002 incomplete · Weather & missing material stoppage flag',
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-004', title: 'DELAY_NOTICE_WEATHER_STATION.pdf', type: 'DOCUMENT', timestamp: '13:05' },
    ],
    submittedBy: 'Debajit Borah (Lead Site Engineer)',
    date: '2026-09-18 13:15',
    status: 'Conflicts',
    alternativeCandidates: [],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping hydrotest matched' },
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 test manifold' },
      { name: 'Dependency Validation', score: 0, maxScore: 20, reason: 'Predecessor PIP-24-002 incomplete (-20 penalty)' },
      { name: 'Impediment Stoppage', score: 2, maxScore: 20, reason: 'Stoppage logged: 0 output recorded' },
    ],
    rulesEvaluated: [
      { name: 'Predecessor Dependency Constraint', status: 'FAILED', details: 'PIP-24-002 has 8 open joints pending RT' },
      { name: 'Variance Notification Gate', status: 'WARNING', details: 'Generates potential 2-day critical path slip' },
    ],
  },
  {
    id: 'EVT-2026-006',
    source: 'DPR_PDF',
    rawFieldStatement:
      'Foundation raft concrete pour completed at Unit 02 flare knock-out drum. 45 m3 poured from 08:00 to 14:00.',
    extractedQuantity: 45,
    unit: 'm³ concrete',
    area: 'Unit A - Compressor Station',
    line: 'Foundation Block A',
    discipline: 'Civil',
    workType: 'Concrete Pour',
    shiftTime: '08:00 - 14:00',
    candidateActivityId: 'CIV-11-001',
    candidateActivityName: 'Foundation Block A - Compressor Pedestal',
    candidateWbs: '2.1.1',
    confidence: 98,
    matchReason: 'Exact 45 m³ milestone target · Delivery batch tickets & slump test verified',
    evidenceCount: 2,
    evidenceItems: [
      { id: 'EVD-005', title: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf', type: 'DOCUMENT', timestamp: '14:10' },
      { id: 'EVD-006', title: 'IMG_20260918_RAFT_POUR.jpg', type: 'PHOTO', timestamp: '14:20' },
    ],
    submittedBy: 'Debajit Borah (Lead Site Engineer)',
    date: '2026-09-18 14:30',
    status: 'High Confidence',
    alternativeCandidates: [],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Civil discipline strictly matches' },
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Foundation Block A matched' },
      { name: 'Semantic Action Verb', score: 20, maxScore: 20, reason: 'Concrete pour matched' },
      { name: 'Temporal Window', score: 18, maxScore: 20, reason: 'Completed on scheduled target date' },
    ],
    rulesEvaluated: [
      { name: 'Quantity Ceiling Enforcement', status: 'PASSED', details: '45 m3 matches 100% planned milestone' },
      { name: 'Quality Lab Sign-Off', status: 'PASSED', details: '28-day cube test samples logged' },
    ],
  },
  {
    id: 'EVT-2026-007',
    source: 'FIELD_QUICK_FORM',
    rawFieldStatement:
      'Line 24 spool erection completed. 12 spools mounted on rack B with mobile crane.',
    extractedQuantity: 12,
    unit: 'spools',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Erection',
    shiftTime: '09:00 - 16:30',
    candidateActivityId: 'PIP-24-001',
    candidateActivityName: 'Erect Line 24-XX High Pressure Gas Header',
    candidateWbs: '3.2.1',
    confidence: 94,
    matchReason: 'Duplicate event signature matching EVT-2026-001 · Suppressed to prevent double counting',
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-007', title: 'IMG_20260914_LINE24_DUPE.jpg', type: 'PHOTO', timestamp: '17:00' },
    ],
    submittedBy: 'Assistant Site Supervisor (Mobile)',
    date: '2026-09-14 17:45',
    status: 'Duplicates',
    alternativeCandidates: [],
    signals: [
      { name: 'Deduplication Hash', score: 0, maxScore: 25, reason: 'Duplicate hash matches EVT-2026-001' },
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 matches' },
      { name: 'Quantity Overlap', score: 0, maxScore: 15, reason: 'Quantity would exceed 100% capacity' },
    ],
    rulesEvaluated: [
      { name: 'Deduplication Integrity Rule', status: 'FAILED', details: 'Event already accounted for in Schedule Twin' },
    ],
  },
  {
    id: 'EVT-2026-008',
    source: 'SITE_DIARY',
    rawFieldStatement:
      'Flare knock-out drum vessel positioning completed on foundation pads. Anchor bolts aligned.',
    extractedQuantity: 1,
    unit: 'vessel',
    area: 'Unit 02 - Flare Area',
    line: 'KO Drum Pad',
    discipline: 'Mechanical',
    workType: 'Erection',
    shiftTime: 'Day Shift',
    candidateActivityId: 'MEC-02-008',
    candidateActivityName: 'Erect & Align Flare K.O. Drum Vessel',
    candidateWbs: '5.2.4',
    confidence: 52,
    matchReason: 'Captured over 72 hours ago without verification · Exceeds daily SLA cutoff',
    evidenceCount: 0,
    evidenceItems: [],
    submittedBy: 'Site Log Entry (Physical Diary)',
    date: '2026-09-11 16:00',
    status: 'Stale',
    alternativeCandidates: [],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Mechanical' },
      { name: 'Asset Identifier', score: 15, maxScore: 35, reason: 'Vessel pad code ambiguous' },
      { name: 'SLA Recency Penalty', score: -30, maxScore: 0, reason: 'Elapsed > 7 days prior; SLA expired' },
    ],
    rulesEvaluated: [
      { name: '72-Hour Reporting SLA', status: 'FAILED', details: 'SLA expired. Requires field walkdown re-check' },
    ],
  },
];

export default function ReviewQueuePage() {
  const { activeProject, openActivityDrawer } = useApp();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ReviewEvent[]>(INITIAL_REVIEW_EVENTS);
  const [activeTab, setActiveTab] = useState<ReviewTab>('Manager Review');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected event for Review Drawer
  const [selectedEvent, setSelectedEvent] = useState<ReviewEvent | null>(null);

  // Editable center column form state for the drawer
  const [editWorkType, setEditWorkType] = useState('');
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editUnit, setEditUnit] = useState('');
  const [editArea, setEditArea] = useState('');
  const [isEditingCenter, setIsEditingCenter] = useState(false);

  // MODAL STATES
  // 1. Approval Confirmation Dialog (Strict requirement: Approval must require confirmation)
  const [isApproveConfirmOpen, setIsApproveConfirmOpen] = useState(false);
  const [attestationChecked, setAttestationChecked] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // 2. Reject Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // 3. Choose Another Activity Modal
  const [isActivityPickerOpen, setIsActivityPickerOpen] = useState(false);
  const [selectedAlternativeId, setSelectedAlternativeId] = useState('');

  // 4. Request Clarification Modal
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [clarificationQueryText, setClarificationQueryText] = useState('');

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      'High Confidence': events.filter((e) => e.status === 'High Confidence').length,
      'Manager Review': events.filter((e) => e.status === 'Manager Review').length,
      'Unmatched': events.filter((e) => e.status === 'Unmatched').length,
      'Conflicts': events.filter((e) => e.status === 'Conflicts').length,
      'Duplicates': events.filter((e) => e.status === 'Duplicates').length,
      'Stale': events.filter((e) => e.status === 'Stale').length,
    };
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Tab filter
      if (e.status !== activeTab) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = e.id.toLowerCase().includes(q);
        const matchesStatement = e.rawFieldStatement.toLowerCase().includes(q);
        const matchesActivity = (e.candidateActivityName || '').toLowerCase().includes(q) ||
          (e.candidateActivityId || '').toLowerCase().includes(q);
        const matchesSubmitter = e.submittedBy.toLowerCase().includes(q);
        return matchesId || matchesStatement || matchesActivity || matchesSubmitter;
      }

      return true;
    });
  }, [events, activeTab, searchQuery]);

  // Open Drawer and initialize editable center values
  const handleOpenReview = (evt: ReviewEvent) => {
    setSelectedEvent(evt);
    setEditWorkType(evt.workType);
    setEditQuantity(evt.extractedQuantity);
    setEditUnit(evt.unit);
    setEditArea(evt.area);
    setIsEditingCenter(false);
  };

  // 1. APPROVE ACTION (Requires Confirmation Dialog)
  const handleInitiateApprove = () => {
    setAttestationChecked(false);
    setIsApproveConfirmOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedEvent) return;
    setIsSubmittingApproval(true);

    setTimeout(() => {
      setIsSubmittingApproval(false);
      setIsApproveConfirmOpen(false);

      // Mark as approved and update events
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id
            ? { ...e, isApproved: true, status: 'High Confidence' }
            : e
        )
      );

      addToast({
        type: 'success',
        title: 'Match Approved & Committed to Twin',
        description: `Verified ${selectedEvent.id} linked to ${selectedEvent.candidateActivityId}. Schedule Twin progress updated.`,
      });

      setSelectedEvent(null);
    }, 450);
  };

  // 2. REJECT ACTION
  const handleConfirmReject = () => {
    if (!selectedEvent) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, isRejected: true, status: 'Unmatched', matchReason: `Rejected: ${rejectReasonText || 'Scope mismatch'}` }
          : e
      )
    );

    setIsRejectModalOpen(false);
    setRejectReasonText('');
    addToast({
      type: 'critical',
      title: 'Match Rejected',
      description: `Event ${selectedEvent.id} unlinked and moved to Unmatched ledger.`,
    });
    setSelectedEvent(null);
  };

  // 3. CHOOSE ANOTHER ACTIVITY
  const handleSwitchActivity = (actId: string) => {
    if (!selectedEvent) return;
    const target = MOCK_ACTIVITIES.find((a) => a.id === actId);
    if (!target) return;

    const updated: ReviewEvent = {
      ...selectedEvent,
      candidateActivityId: target.id,
      candidateActivityName: target.name,
      candidateWbs: target.wbs,
      confidence: 90,
      matchReason: `Manually re-assigned to ${target.id} by Reviewer`,
      status: 'Manager Review',
    };

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
    setSelectedEvent(updated);
    setIsActivityPickerOpen(false);

    addToast({
      type: 'info',
      title: 'Activity Re-Assigned',
      description: `Assigned candidate ${target.id}: ${target.name}`,
    });
  };

  // 4. EDIT EXTRACTED DATA (Center Column Save)
  const handleSaveCenterEdits = () => {
    if (!selectedEvent) return;

    const updated: ReviewEvent = {
      ...selectedEvent,
      workType: editWorkType,
      extractedQuantity: editQuantity,
      unit: editUnit,
      area: editArea,
      matchReason: 'Parameters adjusted and verified by Reviewer',
    };

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
    setSelectedEvent(updated);
    setIsEditingCenter(false);

    addToast({
      type: 'success',
      title: 'Extracted Values Updated',
      description: 'Modified quantity and line attributes in review ledger.',
    });
  };

  // 5. MARK UNMATCHED
  const handleMarkUnmatched = () => {
    if (!selectedEvent) return;

    const updated: ReviewEvent = {
      ...selectedEvent,
      candidateActivityId: null,
      candidateActivityName: null,
      candidateWbs: null,
      confidence: 40,
      status: 'Unmatched',
      matchReason: 'Marked as unassociated out-of-scope work by Reviewer',
    };

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
    addToast({
      type: 'info',
      title: 'Marked as Unmatched',
      description: `Event ${selectedEvent.id} moved to Unmatched scope ledger.`,
    });
    setSelectedEvent(null);
  };

  // 6. REQUEST CLARIFICATION
  const handleSendClarification = () => {
    if (!selectedEvent) return;

    setIsClarificationModalOpen(false);
    setClarificationQueryText('');

    addToast({
      type: 'warning',
      title: 'Clarification Ticket Dispatched',
      description: `Sent clarification request to ${selectedEvent.submittedBy}. Event held in Manager Review.`,
    });
    setSelectedEvent(null);
  };

  // Helper for confidence bracket badge
  const renderConfidenceBracket = (score: number) => {
    if (score >= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
          <CheckCircle2 className="w-3 h-3" />
          <span>{score}% High</span>
        </span>
      );
    }
    if (score >= 70) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FDF6ED] text-[#D98B32] border border-[#F0D4A6]">
          <Clock className="w-3 h-3" />
          <span>{score}% Review Req.</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
        <HelpCircle className="w-3 h-3" />
        <span>{score}% Unmatched</span>
      </span>
    );
  };

  const breadcrumbs = [
    { label: 'Schedule Linking', href: '/matching' },
    { label: 'Review Queue', current: true },
  ];

  const tabs: ReviewTab[] = [
    'High Confidence',
    'Manager Review',
    'Unmatched',
    'Conflicts',
    'Duplicates',
    'Stale',
  ];

  return (
    <AppShell>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* HEADER */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Human-in-the-Loop Verification
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                  Algorithm: Deterministic Semantic Parser v2.4
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Review Queue</h1>
              <p className="text-xs text-[#596579] mt-0.5">
                Critical governance workflow: audit, calibrate, and formally authorize AI candidate matches before Schedule Twin baseline commit.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#596579] font-mono">
                {activeProject?.code || 'OIL-DUL-01'} · Rev 3.2
              </span>
              <Link
                href="/matching"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#176B87] hover:text-[#135A72] hover:bg-[#EDF5F8] border border-transparent rounded-lg transition-colors"
              >
                <span>Pipeline Stage 3</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* GOVERNANCE POLICY BANNER: Do not silently convert AI suggestions */}
          <div className="pt-4">
            <div className="p-3.5 bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#172033]">
                  Schedule Integrity Protocol: Zero Silent AI Conversions
                </h4>
                <p className="text-[#596579] leading-relaxed">
                  PLnEX deterministic suggestions are assistive and <strong>never silently committed into verified baseline records</strong>. Every schedule variance and progress update requires conscious confirmation by the Project Controls Manager or assigned Site Engineer.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY TABS:
            - High Confidence
            - Manager Review
            - Unmatched
            - Conflicts
            - Duplicates
            - Stale */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
          <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors min-h-[48px] ${
                    isActive
                      ? 'border-[#176B87] text-[#176B87] bg-white'
                      : 'border-transparent text-[#596579] hover:text-[#172033] hover:bg-[#F0F2F5]'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#EDF5F8] text-[#176B87]'
                        : 'bg-[#E8EBF0] text-[#596579]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH & QUICK FILTERS */}
          <div className="p-4 border-b border-[#D9DEE5]/60 flex items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8A94A6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event ID, statement, candidate, or submitter..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] focus:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A94A6] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#8A94A6] hidden sm:block">
              Showing <strong>{filteredEvents.length}</strong> items in <strong>{activeTab}</strong>
            </div>
          </div>

          {/* MAIN TABLE:
              - Event ID
              - Field Statement
              - Candidate Activity
              - Confidence
              - Match Reason
              - Evidence
              - Submitted By
              - Date
              - Status
              - Action */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                  <th className="p-3.5 whitespace-nowrap">Event ID</th>
                  <th className="p-3.5 min-w-[220px]">Field Statement</th>
                  <th className="p-3.5 min-w-[190px]">Candidate Activity</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Confidence</th>
                  <th className="p-3.5 min-w-[200px]">Match Reason</th>
                  <th className="p-3.5 whitespace-nowrap text-center">Evidence</th>
                  <th className="p-3.5 whitespace-nowrap">Submitted By</th>
                  <th className="p-3.5 whitespace-nowrap">Date</th>
                  <th className="p-3.5 whitespace-nowrap">Status</th>
                  <th className="p-3.5 whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9DEE5]">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#596579]">
                      <CheckCircle2 className="w-8 h-8 text-[#2E7D5B] mx-auto mb-2" />
                      <p className="font-semibold text-sm text-[#172033]">
                        No items pending in "{activeTab}" tab
                      </p>
                      <p className="text-xs text-[#8A94A6] mt-0.5">
                        Select another tab above to inspect queued execution events.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => (
                    <tr
                      key={evt.id}
                      className="hover:bg-[#EDF5F8]/40 transition-colors group"
                    >
                      {/* 1. Event ID */}
                      <td className="p-3.5 whitespace-nowrap font-mono font-bold text-[#176B87]">
                        {evt.id}
                      </td>

                      {/* 2. Field Statement */}
                      <td className="p-3.5 text-[#172033] max-w-[240px]">
                        <p className="truncate font-medium" title={evt.rawFieldStatement}>
                          {evt.rawFieldStatement}
                        </p>
                        <span className="text-[10px] text-[#8A94A6] font-mono block">
                          Qty: {evt.extractedQuantity} {evt.unit} · {evt.area}
                        </span>
                      </td>

                      {/* 3. Candidate Activity */}
                      <td className="p-3.5 max-w-[200px]">
                        {evt.candidateActivityId ? (
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openActivityDrawer(evt.candidateActivityId!);
                                }}
                                className="font-mono font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 text-left"
                                title="Open in Activity Detail Drawer"
                              >
                                <span>{evt.candidateActivityId}</span>
                                <ArrowUpRight className="w-3 h-3 text-[#176B87]" />
                              </button>
                              {evt.candidateWbs && (
                                <span className="text-[10px] font-mono text-[#8A94A6]">
                                  WBS {evt.candidateWbs}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#596579] truncate" title={evt.candidateActivityName || ''}>
                              {evt.candidateActivityName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-[#8A94A6] italic">
                            Unassigned (No match)
                          </span>
                        )}
                      </td>

                      {/* 4. Confidence (90-100 High, 70-89 Review Required, <70 Unmatched) */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        {renderConfidenceBracket(evt.confidence)}
                      </td>

                      {/* 5. Match Reason */}
                      <td className="p-3.5 text-[#596579] max-w-[220px]">
                        <p className="text-[11px] leading-relaxed truncate" title={evt.matchReason}>
                          {evt.matchReason}
                        </p>
                      </td>

                      {/* 6. Evidence */}
                      <td className="p-3.5 whitespace-nowrap text-center">
                        {evt.evidenceCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                            <Camera className="w-3 h-3" />
                            <span>{evt.evidenceCount}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#8A94A6]">—</span>
                        )}
                      </td>

                      {/* 7. Submitted By */}
                      <td className="p-3.5 whitespace-nowrap text-[#172033]">
                        <span className="font-semibold block truncate max-w-[140px]" title={evt.submittedBy}>
                          {evt.submittedBy}
                        </span>
                        <span className="text-[10px] text-[#8A94A6] font-mono">{evt.source}</span>
                      </td>

                      {/* 8. Date */}
                      <td className="p-3.5 whitespace-nowrap text-[#8A94A6] font-mono text-[11px]">
                        {evt.date}
                      </td>

                      {/* 9. Status */}
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#F0F2F5] text-[#596579] border border-[#D9DEE5]">
                          {evt.status}
                        </span>
                      </td>

                      {/* 10. Action */}
                      <td className="p-3.5 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(evt)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] active:scale-95 rounded-lg shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* =========================================================================
            3-COLUMN REVIEW DRAWER:
            LEFT: Original field submission
            CENTER: Extracted structured information
            RIGHT: Suggested activity
            Show: Why matched, Alternative activities, Confidence, Evidence, Rules, Algorithm version
            Actions: Approve Match, Reject Match, Choose Another Activity, Edit Extracted Data,
                     Mark Unmatched, Request Clarification
            ========================================================================= */}
        <Drawer
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Review Match: ${selectedEvent?.id || ''}`}
          subtitle={`Human-in-the-Loop Attestation · Stage 3 Review`}
          width="xl"
          footer={
            selectedEvent && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full text-xs">
                {/* Secondary Actions Left */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleMarkUnmatched}
                    className="px-3 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg transition-colors"
                  >
                    Mark Unmatched
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClarificationQueryText('');
                      setIsClarificationModalOpen(true);
                    }}
                    className="px-3 py-2 font-semibold text-[#D98B32] hover:bg-[#FDF6ED] bg-white border border-[#F0D4A6] rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Request Clarification</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectReasonText('');
                      setIsRejectModalOpen(true);
                    }}
                    className="px-3 py-2 font-semibold text-[#B5473C] hover:bg-[#FBEFEE] bg-white border border-[#E4B0AA] rounded-lg transition-colors"
                  >
                    Reject Match
                  </button>
                </div>

                {/* Primary Actions Right */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                  >
                    Cancel
                  </button>
                  {/* APPROVE ACTION: Requires confirmation */}
                  <button
                    type="button"
                    onClick={handleInitiateApprove}
                    disabled={!selectedEvent.candidateActivityId}
                    className="px-5 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] disabled:opacity-50 active:scale-95 rounded-lg shadow-sm inline-flex items-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve Match</span>
                  </button>
                </div>
              </div>
            )
          }
        >
          {selectedEvent && (
            <div className="space-y-6 text-xs text-[#172033]">
              {/* ALGORITHM VERSION & CONFIDENCE HEADER STRIP */}
              <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#596579] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                    Engine: Deterministic Semantic Parser v2.4
                  </span>
                  <span className="text-[11px] text-[#8A94A6]">Build 2026.09 · Schedule Twin Engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#8A94A6]">Overall Confidence:</span>
                  {renderConfidenceBracket(selectedEvent.confidence)}
                </div>
              </div>

              {/* 3-COLUMN DESKTOP GRID: LEFT, CENTER, RIGHT */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* =========================================================
                    COLUMN 1 (LEFT): ORIGINAL FIELD SUBMISSION
                    ========================================================= */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        Original Field Submission
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F0F2F5] text-[#596579]">
                        {selectedEvent.source}
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Submitted By</span>
                      <span className="font-bold text-[#172033] block">{selectedEvent.submittedBy}</span>
                      <span className="text-[#596579] font-mono block">{selectedEvent.date}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">Raw Statement</span>
                      <p className="p-3 bg-[#F7F8FA] border border-[#D9DEE5]/80 rounded-lg text-xs font-medium leading-relaxed italic text-[#172033]">
                        "{selectedEvent.rawFieldStatement}"
                      </p>
                    </div>

                    {/* Evidence Previews */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[#8A94A6] uppercase font-bold text-[9px] block">
                        Attached Physical Proofs ({selectedEvent.evidenceCount})
                      </span>
                      {selectedEvent.evidenceItems.length === 0 ? (
                        <p className="text-[11px] text-[#8A94A6] italic">No physical files attached.</p>
                      ) : (
                        <div className="space-y-1">
                          {selectedEvent.evidenceItems.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between text-[11px]"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {ev.type === 'PHOTO' ? (
                                  <Camera className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-[#596579] shrink-0" />
                                )}
                                <span className="font-mono truncate">{ev.title}</span>
                              </div>
                              <span className="text-[#8A94A6] text-[10px] shrink-0">{ev.timestamp}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#D9DEE5]/60 text-[10px] text-[#8A94A6]">
                    GPS Verified · Unit A Gas Processing
                  </div>
                </div>

                {/* =========================================================
                    COLUMN 2 (CENTER): EXTRACTED STRUCTURED INFORMATION
                    ========================================================= */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        Extracted Structured Information
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingCenter(!isEditingCenter)}
                        className="text-[11px] font-bold text-[#176B87] hover:underline inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{isEditingCenter ? 'Cancel Edit' : 'Edit Data'}</span>
                      </button>
                    </div>

                    {isEditingCenter ? (
                      /* EDITING FORM */
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-0.5">
                            Work Type
                          </label>
                          <input
                            type="text"
                            value={editWorkType}
                            onChange={(e) => setEditWorkType(e.target.value)}
                            className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg font-bold text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-0.5">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={editQuantity}
                              onChange={(e) => setEditQuantity(parseFloat(e.target.value) || 0)}
                              className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg font-bold text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-0.5">
                              Unit
                            </label>
                            <input
                              type="text"
                              value={editUnit}
                              onChange={(e) => setEditUnit(e.target.value)}
                              className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg font-bold text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-[#8A94A6] block mb-0.5">
                            Area / Line
                          </label>
                          <input
                            type="text"
                            value={editArea}
                            onChange={(e) => setEditArea(e.target.value)}
                            className="w-full p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg font-bold text-xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveCenterEdits}
                          className="w-full mt-2 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg inline-flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Extracted Values</span>
                        </button>
                      </div>
                    ) : (
                      /* READ-ONLY DISPLAY */
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center">
                          <span className="text-[#8A94A6]">Work Type:</span>
                          <strong className="text-[#172033]">{selectedEvent.workType}</strong>
                        </div>
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center">
                          <span className="text-[#8A94A6]">Quantity & Unit:</span>
                          <strong className="text-[#172033] font-mono">
                            {selectedEvent.extractedQuantity} {selectedEvent.unit}
                          </strong>
                        </div>
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center">
                          <span className="text-[#8A94A6]">Area / Line:</span>
                          <strong className="text-[#172033] truncate max-w-[150px]">
                            {selectedEvent.area}
                          </strong>
                        </div>
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center">
                          <span className="text-[#8A94A6]">Discipline:</span>
                          <strong className="text-[#172033]">{selectedEvent.discipline}</strong>
                        </div>
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg flex justify-between items-center">
                          <span className="text-[#8A94A6]">Shift Window:</span>
                          <strong className="text-[#172033]">{selectedEvent.shiftTime}</strong>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#D9DEE5]/60 text-[10px] text-[#2E7D5B] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Entities Normalized</span>
                  </div>
                </div>

                {/* =========================================================
                    COLUMN 3 (RIGHT): SUGGESTED SCHEDULE ACTIVITY
                    ========================================================= */}
                <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#D9DEE5]/60 pb-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#176B87] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        Suggested Schedule Activity
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAlternativeId('');
                          setIsActivityPickerOpen(true);
                        }}
                        className="text-[11px] font-bold text-[#176B87] hover:underline"
                      >
                        Choose Another
                      </button>
                    </div>

                    {selectedEvent.candidateActivityId ? (
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-[#EDF5F8] border border-[#B3CBE0] rounded-lg space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-sm text-[#176B87]">
                              {selectedEvent.candidateActivityId}
                            </span>
                            <span className="text-[10px] font-mono text-[#596579] bg-white px-1.5 py-0.5 rounded border border-[#D9DEE5]">
                              WBS {selectedEvent.candidateWbs}
                            </span>
                          </div>
                          <p className="font-bold text-xs text-[#172033]">
                            {selectedEvent.candidateActivityName}
                          </p>
                          <button
                            type="button"
                            onClick={() => openActivityDrawer(selectedEvent.candidateActivityId!)}
                            className="mt-1 text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open in Activity Detail Drawer</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Progress Twin Preview */}
                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg space-y-1 text-[11px]">
                          <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                            Schedule Twin Progress Delta
                          </span>
                          <div className="flex items-center justify-between">
                            <span>Current Actual: <strong>30%</strong></span>
                            <ArrowRight className="w-3 h-3 text-[#176B87]" />
                            <span>
                              After Commit: <strong className="text-[#2E7D5B]">42% (+{selectedEvent.extractedQuantity} {selectedEvent.unit})</strong>
                            </span>
                          </div>
                        </div>

                        <div className="p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg text-[11px] flex justify-between">
                          <span className="text-[#8A94A6]">Target Finish:</span>
                          <span className="font-bold text-[#172033]">15 Sep 2026 (Critical Path)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#FBEFEE] border border-[#E4B0AA] rounded-lg text-xs text-[#B5473C] space-y-2">
                        <strong>No Activity Associated:</strong>
                        <p className="text-[11px]">This observation has no baseline target in WBS Rev 3.2.</p>
                        <button
                          type="button"
                          onClick={() => setIsActivityPickerOpen(true)}
                          className="px-3 py-1.5 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg text-xs inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Assign Schedule Activity</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#D9DEE5]/60 text-[10px] text-[#8A94A6]">
                    Schedule Twin Commit Ready
                  </div>
                </div>
              </div>

              {/* =========================================================
                  EXTENDED DETAILS: WHY MATCHED, ALTERNATIVES, SIGNALS, RULES
                  ========================================================= */}
              {/* Full Deterministic Match Explanation */}
              <div className="pt-2">
                <MatchExplanation
                  eventId={selectedEvent.id}
                  showHeading={true}
                  onSelectAlternative={handleSwitchActivity}
                  onOpenActivity={(actId) => openActivityDrawer(actId)}
                />
              </div>

              {/* 3. RULES EVALUATION MATRIX */}
              <div className="p-4 bg-white border border-[#D9DEE5] rounded-xl space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#596579] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#176B87]" />
                  Project Controls Rules Evaluation
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedEvent.rulesEvaluated.map((r, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-lg border flex items-start gap-2 ${
                        r.status === 'PASSED'
                          ? 'bg-[#EDF7F2] border-[#B8DCC9] text-[#2E7D5B]'
                          : r.status === 'WARNING'
                          ? 'bg-[#FDF6ED] border-[#F0D4A6] text-[#D98B32]'
                          : 'bg-[#FBEFEE] border-[#E4B0AA] text-[#B5473C]'
                      }`}
                    >
                      {r.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <span className="font-bold block text-[#172033]">{r.name}</span>
                        <span className="text-[11px] text-[#596579]">{r.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* =========================================================================
            MODAL 1: FORMAL APPROVAL CONFIRMATION DIALOG
            Rule: "Approval must require confirmation."
            Rule: "Do not silently convert AI suggestions into verified records."
            ========================================================================= */}
        <Modal
          isOpen={isApproveConfirmOpen}
          onClose={() => setIsApproveConfirmOpen(false)}
          title="Formal Schedule Link Attestation"
          subtitle="Project Controls Governance & Baseline Commitment"
        >
          {selectedEvent && (
            <div className="space-y-4 text-xs text-[#172033]">
              <div className="p-3.5 bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#176B87]">
                    Event {selectedEvent.id} → {selectedEvent.candidateActivityId}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#2E7D5B]">
                    {selectedEvent.confidence}% Confidence
                  </span>
                </div>
                <p className="text-[#596579] leading-relaxed">
                  Approving this match will commit <strong>{selectedEvent.extractedQuantity} {selectedEvent.unit}</strong> to Schedule Activity <strong>{selectedEvent.candidateActivityName}</strong>. This updates actual completion in the Schedule Twin and is written into the immutable audit ledger.
                </p>
              </div>

              {/* Digital Attestation Checkbox */}
              <div className="p-3.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attestationChecked}
                    onChange={(e) => setAttestationChecked(e.target.checked)}
                    className="w-4 h-4 text-[#176B87] rounded border-[#D9DEE5] mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-[#172033] block">
                      Human-in-the-Loop Verification Attestation
                    </span>
                    <span className="text-[#596579] text-[11px] leading-relaxed">
                      I confirm that I have reviewed the original field submission, checked physical evidence, and authorize committing this output to the project schedule baseline.
                    </span>
                  </div>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9DEE5]">
                <button
                  type="button"
                  onClick={() => setIsApproveConfirmOpen(false)}
                  className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!attestationChecked || isSubmittingApproval}
                  onClick={handleConfirmApproval}
                  className="px-5 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] disabled:opacity-50 active:scale-95 rounded-lg shadow-sm inline-flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSubmittingApproval ? 'Committing to Twin...' : 'Confirm & Commit to Schedule Twin'}</span>
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* =========================================================================
            MODAL 2: REJECT MATCH MODAL
            ========================================================================= */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Candidate Match"
          subtitle="Event will be unlinked and categorized as Unmatched"
        >
          <div className="space-y-4 text-xs text-[#172033]">
            <p className="text-[#596579]">
              Please document the technical reason for rejecting this match for the audit trail:
            </p>
            <textarea
              rows={3}
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="e.g. Activity belongs to secondary subcontractor package, incorrect line number..."
              className="w-full p-3 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 font-semibold text-[#596579] bg-white border border-[#D9DEE5] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 font-bold text-white bg-[#B5473C] hover:bg-[#973930] rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>

        {/* =========================================================================
            MODAL 3: CHOOSE ANOTHER ACTIVITY PICKER
            ========================================================================= */}
        <Modal
          isOpen={isActivityPickerOpen}
          onClose={() => setIsActivityPickerOpen(false)}
          title="Choose Another Baseline Activity"
          subtitle="Select from active project WBS activities"
        >
          <div className="space-y-3 text-xs text-[#172033] max-h-[60vh] overflow-y-auto">
            {MOCK_ACTIVITIES.map((act) => (
              <div
                key={act.id}
                onClick={() => handleSwitchActivity(act.id)}
                className="p-3 border border-[#D9DEE5] hover:border-[#176B87] hover:bg-[#EDF5F8]/40 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#176B87]">{act.id}</span>
                    <span className="text-[10px] font-mono text-[#8A94A6]">WBS {act.wbs}</span>
                    <span className="text-[10px] font-semibold text-[#596579] bg-[#F0F2F5] px-1.5 py-0.2 rounded">
                      {act.discipline}
                    </span>
                  </div>
                  <p className="font-bold text-[#172033] mt-0.5">{act.name}</p>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-bold text-[#176B87] hover:bg-white border border-[#B3CBE0] rounded-lg"
                >
                  Link
                </button>
              </div>
            ))}
          </div>
        </Modal>

        {/* =========================================================================
            MODAL 4: REQUEST CLARIFICATION MODAL
            ========================================================================= */}
        <Modal
          isOpen={isClarificationModalOpen}
          onClose={() => setIsClarificationModalOpen(false)}
          title="Request Field Clarification"
          subtitle={`Send inquiry to site engineer (${selectedEvent?.submittedBy || ''})`}
        >
          <div className="space-y-4 text-xs text-[#172033]">
            <p className="text-[#596579]">
              Specify the query or discrepancy that the field supervisor must clarify:
            </p>
            <textarea
              rows={3}
              value={clarificationQueryText}
              onChange={(e) => setClarificationQueryText(e.target.value)}
              placeholder="e.g. Please confirm whether the 12 spools were mounted on Rack B or Rack C, and attach joint sign-off."
              className="w-full p-3 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs"
            />
            <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setIsClarificationModalOpen(false)}
                className="px-4 py-2 font-semibold text-[#596579] bg-white border border-[#D9DEE5] rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendClarification}
                className="px-4 py-2 font-bold text-white bg-[#D98B32] hover:bg-[#C27A28] rounded-lg inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Inquiry</span>
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
