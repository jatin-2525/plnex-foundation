'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Drawer } from '../../components/shared/Drawer';
import { Modal } from '../../components/shared/Modal';
import { ConfirmationDialog } from '../../components/shared/ConfirmationDialog';
import { MatchCard, MatchFactorItem, MatchAlternativeItem } from '../../components/shared/MatchCard';
import { CoreFlowBanner } from '../../components/shared/CoreFlowBanner';
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
  Archive,
} from 'lucide-react';

// Summary Tabs required by specification + Verified History Archive
export type ReviewTab =
  | 'All Action Items'
  | 'High Confidence'
  | 'Manager Review'
  | 'Unmatched'
  | 'Conflicts'
  | 'Duplicates'
  | 'Stale'
  | 'Verified History';

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
  status: 'High Confidence' | 'Manager Review' | 'Unmatched' | 'Conflicts' | 'Duplicates' | 'Stale';
  isApproved?: boolean;
  isRejected?: boolean;
  alternativeCandidates: ReviewCandidate[];
  signals: Array<{ name: string; score: number; maxScore: number; reason: string }>;
  rulesEvaluated: Array<{ name: string; status: 'PASSED' | 'WARNING' | 'FAILED'; details: string }>;
}

// Initial realistic Review Queue events requiring human action
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
    candidateWbs: '1.1.3.2.1',
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
        wbs: '1.1.3.2.2',
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
      { name: 'Discipline Boundary Check', status: 'PASSED', details: 'Piping discipline conforms to WBS 1.1.3.2' },
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
    candidateWbs: '1.1.3.2.2',
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
        wbs: '1.1.3.2.1',
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
      { name: 'Discipline Boundary Check', status: 'PASSED', details: 'Piping conforms to WBS 1.1.3.2.2' },
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
    candidateWbs: '1.1.3.2.3',
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
    candidateWbs: '1.1.3.2.1',
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
  const [activeTab, setActiveTab] = useState<ReviewTab>('All Action Items');
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
  // 1. Approval Confirmation Dialog
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

  // Strict Rule: Active Review Queue ONLY contains unverified items requiring human action!
  const pendingActionEvents = useMemo(() => {
    return events.filter((e) => !e.isApproved && !e.isRejected);
  }, [events]);

  const verifiedHistoryEvents = useMemo(() => {
    return events.filter((e) => e.isApproved || e.isRejected);
  }, [events]);

  // Tab counts based strictly on items requiring action
  const tabCounts = useMemo(() => {
    return {
      'All Action Items': pendingActionEvents.length,
      'High Confidence': pendingActionEvents.filter((e) => e.status === 'High Confidence').length,
      'Manager Review': pendingActionEvents.filter((e) => e.status === 'Manager Review').length,
      'Unmatched': pendingActionEvents.filter((e) => e.status === 'Unmatched').length,
      'Conflicts': pendingActionEvents.filter((e) => e.status === 'Conflicts').length,
      'Duplicates': pendingActionEvents.filter((e) => e.status === 'Duplicates').length,
      'Stale': pendingActionEvents.filter((e) => e.status === 'Stale').length,
      'Verified History': verifiedHistoryEvents.length,
    };
  }, [pendingActionEvents, verifiedHistoryEvents]);

  // Filtered events based on tab and search
  const filteredEvents = useMemo(() => {
    let baseList: ReviewEvent[];

    if (activeTab === 'Verified History') {
      baseList = verifiedHistoryEvents;
    } else if (activeTab === 'All Action Items') {
      baseList = pendingActionEvents;
    } else {
      baseList = pendingActionEvents.filter((e) => e.status === activeTab);
    }

    if (!searchQuery.trim()) return baseList;

    const q = searchQuery.toLowerCase();
    return baseList.filter((e) => {
      const matchesId = e.id.toLowerCase().includes(q);
      const matchesStatement = e.rawFieldStatement.toLowerCase().includes(q);
      const matchesActivity =
        (e.candidateActivityName || '').toLowerCase().includes(q) ||
        (e.candidateActivityId || '').toLowerCase().includes(q);
      const matchesSubmitter = e.submittedBy.toLowerCase().includes(q);
      return matchesId || matchesStatement || matchesActivity || matchesSubmitter;
    });
  }, [activeTab, pendingActionEvents, verifiedHistoryEvents, searchQuery]);

  // Open Drawer and initialize editable center values
  const handleOpenReview = (evt: ReviewEvent) => {
    setSelectedEvent(evt);
    setEditWorkType(evt.workType);
    setEditQuantity(evt.extractedQuantity);
    setEditUnit(evt.unit);
    setEditArea(evt.area);
    setIsEditingCenter(false);
  };

  // 1. APPROVE ACTION: Commits to Schedule Twin and moves OUT of the active action queue
  const handleInitiateApprove = (evt?: ReviewEvent) => {
    if (evt) {
      setSelectedEvent(evt);
    }
    setAttestationChecked(false);
    setIsApproveConfirmOpen(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedEvent) return;
    setIsSubmittingApproval(true);

    setTimeout(() => {
      setIsSubmittingApproval(false);
      setIsApproveConfirmOpen(false);

      // Mark as approved and commit to Twin
      setEvents((prev) =>
        prev.map((e) =>
          e.id === selectedEvent.id
            ? { ...e, isApproved: true }
            : e
        )
      );

      addToast({
        type: 'success',
        title: 'Match Approved & Committed to Twin',
        description: `Verified ${selectedEvent.id} linked to ${selectedEvent.candidateActivityId}. Removed from active Review Queue.`,
      });

      setSelectedEvent(null);
    }, 350);
  };

  // 2. REJECT ACTION
  const handleConfirmReject = () => {
    if (!selectedEvent) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, isRejected: true, matchReason: `Rejected: ${rejectReasonText || 'Scope mismatch'}` }
          : e
      )
    );

    setIsRejectModalOpen(false);
    setRejectReasonText('');
    addToast({
      type: 'critical',
      title: 'Match Rejected',
      description: `Event ${selectedEvent.id} unlinked and removed from active Review Queue.`,
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

  // 4. EDIT EXTRACTED DATA
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
  const handleMarkUnmatched = (evt?: ReviewEvent) => {
    const target = evt || selectedEvent;
    if (!target) return;

    const updated: ReviewEvent = {
      ...target,
      candidateActivityId: null,
      candidateActivityName: null,
      candidateWbs: null,
      confidence: 40,
      status: 'Unmatched',
      matchReason: 'Marked as unassociated out-of-scope work by Reviewer',
    };

    setEvents((prev) => prev.map((e) => (e.id === target.id ? updated : e)));
    addToast({
      type: 'info',
      title: 'Marked as Unmatched',
      description: `Event ${target.id} moved to Unmatched scope ledger.`,
    });
    if (selectedEvent) setSelectedEvent(null);
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

  // Factors mapping for MatchCard
  const getFactorsForEvent = (evt: ReviewEvent): MatchFactorItem[] => {
    const isHigh = evt.confidence >= 90;
    const isMed = evt.confidence >= 70;

    return [
      {
        name: 'Activity keywords',
        status: isHigh ? 'matched' : isMed ? 'partial' : 'mismatch',
        reason:
          evt.signals.find((s) => s.name.toLowerCase().includes('verb') || s.name.toLowerCase().includes('semantic'))
            ?.reason || 'Work verbs and component descriptors aligned with WBS activity baseline',
      },
      {
        name: 'Area / Line',
        status: evt.line ? 'matched' : evt.area ? 'partial' : 'mismatch',
        reason: evt.line
          ? `Exact line identifier confirmed: ${evt.line}`
          : evt.area
          ? `Area level alignment: ${evt.area}`
          : 'Plant area tag absent from field submission',
      },
      {
        name: 'Discipline',
        status: 'matched',
        reason: `${evt.discipline} discipline conforms strictly to baseline engineering package`,
      },
      {
        name: 'Date / Context',
        status: isHigh ? 'matched' : isMed ? 'partial' : 'mismatch',
        reason: `Submission date ${evt.date.split(' ')[0]} checked against scheduled window`,
      },
      {
        name: 'Project / WBS',
        status: evt.candidateWbs ? 'matched' : 'mismatch',
        reason: evt.candidateWbs
          ? `WBS node ${evt.candidateWbs} verified against current master schedule`
          : 'No baseline activity corresponds to reported scope',
      },
    ];
  };

  // Alternatives mapping for MatchCard
  const getAlternativesForEvent = (evt: ReviewEvent): MatchAlternativeItem[] => {
    if (evt.alternativeCandidates && evt.alternativeCandidates.length > 0) {
      return evt.alternativeCandidates.map((c) => ({
        activityId: c.activityId,
        activityName: c.activityName,
        confidence: c.confidence,
        wbs: c.wbs,
        discipline: c.discipline,
        reasons: c.reasons,
      }));
    }
    return [];
  };

  const breadcrumbs = [
    { label: 'Schedule Linking', href: '/matching' },
    { label: 'Review Queue', current: true },
  ];

  const tabs: ReviewTab[] = [
    'All Action Items',
    'High Confidence',
    'Manager Review',
    'Unmatched',
    'Conflicts',
    'Duplicates',
    'Stale',
    'Verified History',
  ];

  return (
    <StateWrapper>
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
                  Action Queue Only · Zero Silent Conversions
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">Review Queue</h1>
              <p className="text-sm text-[#596579] mt-1">
                Contains only field events requiring human decision. Verified events are committed to Schedule Twin and removed from active queue.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded bg-[#F7F8FA] border border-[#D9DEE5] text-[#596579] font-mono">
                {activeProject?.code || 'OIL-DUL-01'} · V3 · Rev 3.2
              </span>
              <Link
                href="/matching"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#176B87] hover:text-[#135A72] hover:bg-[#EDF5F8] border border-transparent rounded-lg transition-colors"
              >
                <span>Matching Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* GOVERNANCE POLICY BANNER */}
          <div className="pt-4">
            <div className="p-3.5 bg-[#EDF5F8] border border-[#B3CBE0] rounded-xl flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#176B87] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#172033]">
                  Schedule Integrity Protocol: AI is Not the Final Authority
                </h4>
                <p className="text-[#596579] leading-relaxed">
                  A high confidence suggestion (e.g. 94%) is <strong>never treated as verified</strong>. AI candidate matches are assistive only and require conscious human verification. Once approved, events are committed to Schedule Twin and cleared from this queue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CORE FLOW PIPELINE: Field Input -> Extraction -> Execution Event -> Candidate Match -> Confidence -> Human Verification -> Verified Update */}
        <CoreFlowBanner currentStage="HUMAN_VERIFICATION" />

        {/* SUMMARY TABS */}
        <div className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs">
          <div className="flex border-b border-[#D9DEE5] bg-[#F7F8FA] overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              const isHistory = tab === 'Verified History';

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
                  {isHistory && <Archive className="w-3.5 h-3.5 text-[#8A94A6]" />}
                  <span>{tab}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#EDF5F8] text-[#176B87]'
                        : isHistory
                        ? 'bg-[#F0F2F5] text-[#8A94A6]'
                        : count > 0
                        ? 'bg-[#E8EBF0] text-[#172033]'
                        : 'bg-[#F0F2F5] text-[#8A94A6]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH & ACTIVE QUEUE NOTICE */}
          <div className="p-4 border-b border-[#D9DEE5]/60 flex items-center justify-between gap-3 text-xs flex-wrap">
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

            <div className="text-[11px] text-[#596579]">
              {activeTab === 'Verified History' ? (
                <span>Showing <strong>{filteredEvents.length}</strong> previously verified & committed events (Archived)</span>
              ) : (
                <span>Showing <strong>{filteredEvents.length}</strong> items requiring human decision</span>
              )}
            </div>
          </div>

          {/* MAIN REVIEW QUEUE EVENT CARDS */}
          <div className="p-4 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-[#596579] bg-[#FAFAFA] rounded-xl border border-dashed border-[#D9DEE5]">
                <CheckCircle2 className="w-10 h-10 text-[#2E7D5B] mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#172033]">
                  {activeTab === 'Verified History'
                    ? 'No verified events in history archive yet'
                    : 'No review items'}
                </h3>
                <p className="text-sm text-[#596579] mt-1 max-w-md mx-auto">
                  {activeTab === 'Verified History'
                    ? 'Approve candidate matches in the queue above to commit them to the Schedule Twin.'
                    : 'Nothing requires your attention right now. All events have been processed and verified.'}
                </p>
              </div>
            ) : (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white border border-[#D9DEE5] rounded-xl overflow-hidden shadow-xs hover:border-[#B3CBE0] transition-colors"
                >
                  {/* Event Top Meta Bar */}
                  <div className="px-4 py-2.5 bg-[#F7F8FA] border-b border-[#D9DEE5] flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#176B87]">{evt.id}</span>
                      <span className="text-[#8A94A6]">•</span>
                      <span className="font-semibold text-[#172033]">{evt.submittedBy}</span>
                      <span className="text-[#8A94A6]">•</span>
                      <span className="text-[#596579] font-mono text-[11px]">{evt.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-[#D9DEE5] text-[#596579]">
                        {evt.source}
                      </span>
                      {evt.evidenceCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                          <Camera className="w-3 h-3" />
                          <span>{evt.evidenceCount} Proofs</span>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenReview(evt)}
                        className="text-xs font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 ml-2"
                      >
                        <span>Full Inspection Drawer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded MatchCard Component */}
                  <MatchCard
                    activityId={evt.candidateActivityId}
                    activityName={evt.candidateActivityName}
                    confidence={evt.confidence}
                    statusText={
                      evt.status === 'High Confidence'
                        ? 'High-confidence suggestion'
                        : evt.status === 'Manager Review'
                        ? 'Needs manager verification'
                        : evt.status === 'Unmatched'
                        ? 'Unmatched scope'
                        : `${evt.status} flag`
                    }
                    verificationStatus={evt.isApproved ? 'Verified' : evt.isRejected ? 'Rejected' : 'Pending'}
                    wbs={evt.candidateWbs}
                    discipline={evt.discipline}
                    area={evt.area}
                    line={evt.line}
                    fieldStatement={evt.rawFieldStatement}
                    factors={getFactorsForEvent(evt)}
                    alternatives={getAlternativesForEvent(evt)}
                    onApprove={() => handleInitiateApprove(evt)}
                    onChooseAnother={() => {
                      setSelectedEvent(evt);
                      setSelectedAlternativeId(evt.candidateActivityId || '');
                      setIsActivityPickerOpen(true);
                    }}
                    onReject={() => {
                      setSelectedEvent(evt);
                      setIsRejectModalOpen(true);
                    }}
                    onMarkUnmatched={() => handleMarkUnmatched(evt)}
                    onSelectAlternative={(altId) => {
                      setSelectedEvent(evt);
                      handleSwitchActivity(altId);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3-COLUMN REVIEW DRAWER FOR DEEP EVIDENCE INSPECTION */}
        <Drawer
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Detailed Review: ${selectedEvent?.id || ''}`}
          subtitle={`Human Decision Verification · Schedule Twin Linking`}
          width="xl"
          footer={
            selectedEvent && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleMarkUnmatched(selectedEvent)}
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

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInitiateApprove(selectedEvent)}
                    disabled={!selectedEvent.candidateActivityId}
                    className="px-5 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] disabled:opacity-50 active:scale-95 rounded-lg shadow-sm inline-flex items-center gap-2 transition-all"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve Match & Commit</span>
                  </button>
                </div>
              </div>
            )
          }
        >
          {selectedEvent && (
            <div className="space-y-6 text-xs text-[#172033]">
              {/* MatchCard inside drawer */}
              <MatchCard
                activityId={selectedEvent.candidateActivityId}
                activityName={selectedEvent.candidateActivityName}
                confidence={selectedEvent.confidence}
                statusText={
                  selectedEvent.status === 'High Confidence'
                    ? 'High-confidence suggestion'
                    : selectedEvent.status === 'Manager Review'
                    ? 'Needs manager verification'
                    : selectedEvent.status === 'Unmatched'
                    ? 'Unmatched scope'
                    : `${selectedEvent.status} flag`
                }
                verificationStatus={selectedEvent.isApproved ? 'Verified' : selectedEvent.isRejected ? 'Rejected' : 'Pending'}
                wbs={selectedEvent.candidateWbs}
                discipline={selectedEvent.discipline}
                area={selectedEvent.area}
                line={selectedEvent.line}
                fieldStatement={selectedEvent.rawFieldStatement}
                factors={getFactorsForEvent(selectedEvent)}
                alternatives={getAlternativesForEvent(selectedEvent)}
                onApprove={() => handleInitiateApprove(selectedEvent)}
                onChooseAnother={() => {
                  setSelectedAlternativeId(selectedEvent.candidateActivityId || '');
                  setIsActivityPickerOpen(true);
                }}
                onReject={() => setIsRejectModalOpen(true)}
                onMarkUnmatched={() => handleMarkUnmatched(selectedEvent)}
                onSelectAlternative={(altId) => handleSwitchActivity(altId)}
              />

              {/* 3-Column Inspection: Raw Field Observation, Editable Parameters, Physical Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1: Editable Extraction Fields */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#596579]">
                      Extracted Parameters (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingCenter(!isEditingCenter)}
                      className="text-xs font-semibold text-[#176B87] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingCenter ? 'Discard Edits' : 'Edit Fields'}</span>
                    </button>
                  </div>

                  {isEditingCenter ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-[#596579] block mb-1">Work Type</label>
                        <input
                          type="text"
                          value={editWorkType}
                          onChange={(e) => setEditWorkType(e.target.value)}
                          className="w-full p-2 bg-white border border-[#D9DEE5] rounded text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-[#596579] block mb-1">Quantity</label>
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-[#D9DEE5] rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#596579] block mb-1">Unit</label>
                          <input
                            type="text"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="w-full p-2 bg-white border border-[#D9DEE5] rounded text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#596579] block mb-1">Area / Location</label>
                        <input
                          type="text"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="w-full p-2 bg-white border border-[#D9DEE5] rounded text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveCenterEdits}
                        className="w-full py-2 bg-[#176B87] hover:bg-[#135A72] text-white font-bold rounded shadow-xs"
                      >
                        Save Parameter Corrections
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                        <span className="text-[#8A94A6]">Work Type:</span>
                        <strong className="text-[#172033]">{selectedEvent.workType}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                        <span className="text-[#8A94A6]">Quantity / Unit:</span>
                        <strong className="text-[#172033] font-mono">{selectedEvent.extractedQuantity} {selectedEvent.unit}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                        <span className="text-[#8A94A6]">Area:</span>
                        <strong className="text-[#172033]">{selectedEvent.area}</strong>
                      </div>
                      {selectedEvent.line && (
                        <div className="flex justify-between py-1 border-b border-[#D9DEE5]/60">
                          <span className="text-[#8A94A6]">Line Code:</span>
                          <strong className="text-[#172033] font-mono">{selectedEvent.line}</strong>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-[#8A94A6]">Shift Time:</span>
                        <strong className="text-[#172033] font-mono">{selectedEvent.shiftTime}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Physical Evidence & Rules Checked */}
                <div className="p-4 bg-[#F7F8FA] border border-[#D9DEE5] rounded-xl space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#596579] block">
                    Physical Evidence & QC Proofs ({selectedEvent.evidenceItems.length})
                  </span>

                  {selectedEvent.evidenceItems.length === 0 ? (
                    <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg text-[#8A94A6] italic text-center">
                      No photographic or document proofs attached to this field log.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvent.evidenceItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 bg-white border border-[#D9DEE5] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {item.type === 'PHOTO' ? (
                              <Camera className="w-4 h-4 text-[#0284C7]" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#176B87]" />
                            )}
                            <div>
                              <span className="font-semibold text-[#172033] block truncate max-w-[200px]">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-[#8A94A6] font-mono">
                                Time: {item.timestamp}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                            Attached
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#D9DEE5]/60 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#8A94A6] block">
                      Deterministic Rules Verified:
                    </span>
                    {selectedEvent.rulesEvaluated.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px]">
                        <span className="mt-0.5">
                          {rule.status === 'PASSED' ? (
                            <Check className="w-3.5 h-3.5 text-[#2E7D5B]" />
                          ) : rule.status === 'WARNING' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#D98B32]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[#B5473C]" />
                          )}
                        </span>
                        <span className="text-[#596579]">
                          <strong className="text-[#172033]">{rule.name}:</strong> {rule.details}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* 1. APPROVAL CONFIRMATION MODAL */}
        <ConfirmationDialog
          isOpen={isApproveConfirmOpen}
          onClose={() => setIsApproveConfirmOpen(false)}
          onConfirm={handleConfirmApproval}
          title="Authorize Schedule Twin Commitment"
          message={
            selectedEvent
              ? `You are confirming the match of event ${selectedEvent.id} to scheduled activity ${selectedEvent.candidateActivityId}. This will officially update actual progress in the Schedule Twin and remove this item from the active Review Queue.`
              : 'Authorize schedule link?'
          }
          confirmLabel={isSubmittingApproval ? 'Committing...' : 'Confirm & Commit to Twin'}
          variant="primary"
        />

        {/* 2. REJECT MODAL */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Candidate Match"
          subtitle="Document the discrepancy or reason for rejection for the immutable audit trail."
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-3.5 py-2 font-semibold text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 font-bold text-white bg-[#B5473C] hover:bg-[#9E3B31] rounded shadow-xs"
              >
                Confirm Rejection
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="font-bold text-[#172033] block">Rejection Justification</label>
            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="State reason (e.g., spool scope corresponds to contractor punchlist rather than main header)..."
              rows={3}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87]"
            />
          </div>
        </Modal>

        {/* 3. CHOOSE ANOTHER ACTIVITY MODAL */}
        <Modal
          isOpen={isActivityPickerOpen}
          onClose={() => setIsActivityPickerOpen(false)}
          title="Choose Another Schedule Activity"
          subtitle="Select a baseline activity from the master schedule WBS."
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsActivityPickerOpen(false)}
                className="px-3.5 py-2 font-semibold text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSwitchActivity(selectedAlternativeId)}
                disabled={!selectedAlternativeId}
                className="px-4 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded shadow-xs disabled:opacity-50"
              >
                Assign Selected Activity
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#172033] block mb-1">Target Schedule Activity (WBS)</label>
              <select
                value={selectedAlternativeId}
                onChange={(e) => setSelectedAlternativeId(e.target.value)}
                className="w-full p-2.5 bg-white border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87]"
              >
                <option value="">-- Choose activity from WBS --</option>
                {MOCK_ACTIVITIES.map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.id} — {act.name} ({act.discipline}) [WBS: {act.wbs}]
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        {/* 4. REQUEST CLARIFICATION MODAL */}
        <Modal
          isOpen={isClarificationModalOpen}
          onClose={() => setIsClarificationModalOpen(false)}
          title="Request Field Clarification"
          subtitle={`Send clarification inquiry to site team for ${selectedEvent?.id || ''}.`}
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsClarificationModalOpen(false)}
                className="px-3.5 py-2 font-semibold text-[#596579] hover:text-[#172033] rounded border border-[#D9DEE5]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendClarification}
                className="px-4 py-2 font-bold text-white bg-[#D98B32] hover:bg-[#C27A28] rounded shadow-xs inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Clarification</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="font-bold text-[#172033] block">Inquiry Query for Site Engineer</label>
            <textarea
              value={clarificationQueryText}
              onChange={(e) => setClarificationQueryText(e.target.value)}
              placeholder="e.g. Please clarify if the 12 spools completed include isometric sheet 24-B tie-ins..."
              rows={3}
              className="w-full p-2.5 bg-[#F7F8FA] border border-[#D9DEE5] rounded-lg outline-none focus:border-[#176B87]"
            />
          </div>
        </Modal>
      </div>
    </StateWrapper>
  );
}
