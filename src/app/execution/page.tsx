'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { StateWrapper } from '../../components/shared/StateWrapper';
import { Breadcrumbs } from '../../components/shell/Breadcrumbs';
import { Drawer } from '../../components/shared/Drawer';
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { MatchExplanation } from '../../components/shared/MatchExplanation';
import { WhyButton } from '../../components/shared/WhyButton';
import { DisciplineType } from '../../types';
import {
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  History,
  Calendar,
  Clock,
  ArrowRight,
  ArrowUpRight,
  Search,
  Filter,
  FileText,
  Camera,
  ExternalLink,
  ShieldCheck,
  Check,
  Eye,
  Activity,
  Database,
  Cpu,
  ChevronDown,
  ChevronUp,
  X,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

// Explicit 6 Statuses required by specification
export type ExecutionIntelligenceStatus =
  | 'Matched'
  | 'Needs Review'
  | 'Unmatched'
  | 'Conflict'
  | 'Duplicate'
  | 'Stale';

export interface ExecutionIntelligenceEvent {
  id: string;
  source: 'FIELD_QUICK_FORM' | 'DPR_PDF' | 'VOICE_AGENT' | 'SITE_DIARY' | 'EXCEL_SHEET';
  rawFieldStatement: string;
  extractedQuantity: number;
  unit: string;
  area: string;
  line?: string;
  discipline: DisciplineType;
  candidateActivityId: string | null;
  candidateActivityName: string | null;
  candidateWbs: string | null;
  confidence: number;
  evidenceCount: number;
  evidenceItems: Array<{
    id: string;
    title: string;
    type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE';
    timestamp: string;
  }>;
  status: ExecutionIntelligenceStatus;
  createdAt: string;
  workType: string;
  shiftTime: string;
  reasons: string[];
  signals: Array<{ name: string; score: number; maxScore: number; reason: string }>;
  processingHistory: Array<{
    step: string;
    timestamp: string;
    actor: string;
    details: string;
    status: 'success' | 'warning' | 'critical' | 'info';
  }>;
  verificationStatus: {
    state: 'Verified' | 'Pending Review' | 'Flagged' | 'Rejected';
    reviewer?: string;
    verifiedAt?: string;
    notes?: string;
  };
}

// Realistic sample events demonstrating all 6 statuses and the 3 distinct concepts
const MOCK_INTELLIGENCE_EVENTS: ExecutionIntelligenceEvent[] = [
  {
    id: 'EVT-2026-001',
    source: 'DPR_PDF',
    rawFieldStatement:
      'Spool erection completed on Line 24. 12 spools erected today with crane support. Work started at 09:00 and finished at 16:30.',
    extractedQuantity: 12,
    unit: 'spools',
    area: 'Unit A - Gas Processing Area / Piperack Section B',
    line: 'Line 24-XX',
    discipline: 'Piping',
    candidateActivityId: 'PIP-24-001',
    candidateActivityName: 'Erect Line 24-XX High Pressure Gas Header',
    candidateWbs: '3.2.1',
    confidence: 94,
    evidenceCount: 2,
    evidenceItems: [
      { id: 'EVD-001', title: 'IMG_20260914_Line24_Erect.jpg', type: 'PHOTO', timestamp: '16:30' },
      { id: 'EVD-002', title: 'CRANE_LIFT_SIGN_OFF_SHEET.pdf', type: 'DOCUMENT', timestamp: '18:00' },
    ],
    status: 'Matched',
    createdAt: '2026-09-14 17:15',
    workType: 'Spool Erection',
    shiftTime: '09:00 - 16:30',
    reasons: [
      'Line 24-XX identifier confirmed in statement and isometric drawing ISO-PIP-24-01-A',
      'Piping erection activity semantically aligned with Level 5 schedule work package',
      'Execution shift dates (14 Sep) align with planned baseline window (10–15 Sep)',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Field report discipline (Piping) matched baseline' },
      { name: 'Line / Asset Identifier', score: 35, maxScore: 35, reason: 'Exact match for Line 24-XX gas header' },
      { name: 'Semantic Action Verb', score: 20, maxScore: 20, reason: 'Spool erection mapped to Erect Line 24-XX' },
      { name: 'Temporal Scheduled Window', score: 14, maxScore: 15, reason: 'Execution date is within scheduled window' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '17:15:00', actor: 'Debajit Borah (Site Engineer)', details: 'Received via Shift A DPR upload', status: 'info' },
      { step: 'Entity Extraction', timestamp: '17:15:02', actor: 'Deterministic NLP Extractor', details: 'Extracted: 12 spools, Line 24-XX, Erection, 09:00-16:30', status: 'success' },
      { step: 'Schedule Candidate Search', timestamp: '17:15:03', actor: 'Deterministic Linking Engine', details: 'Candidate match: PIP-24-001 (WBS 3.2.1)', status: 'success' },
      { step: 'Verification Governance', timestamp: '17:15:04', actor: 'Verification Rules Engine', details: 'Confidence 94% >= 90% threshold. Scheduled twin update verified.', status: 'success' },
    ],
    verificationStatus: {
      state: 'Verified',
      reviewer: 'Debajit Borah',
      verifiedAt: '2026-09-14 18:00',
      notes: 'Physical crane lifting tickets and spool alignment checked against baseline.',
    },
  },
  {
    id: 'EVT-2026-002',
    source: 'EXCEL_SHEET',
    rawFieldStatement:
      'Line 24 spool welding completed 8 joints today. 4 joints pending radiographic clearance.',
    extractedQuantity: 8,
    unit: 'welds',
    area: 'Unit A - Gas Processing / Piperack Section B',
    line: 'Line 24-XX',
    discipline: 'Piping',
    candidateActivityId: 'PIP-24-002',
    candidateActivityName: 'Weld Line 24-XX Field Joints & NDT Inspection',
    candidateWbs: '3.2.2',
    confidence: 86,
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-003', title: 'WELD_LOG_SHEET_SHIFT_A.pdf', type: 'INSPECTION_NOTE', timestamp: '16:15' },
    ],
    status: 'Needs Review',
    createdAt: '2026-09-16 18:20',
    workType: 'Welding',
    shiftTime: '10:00 - 16:00',
    reasons: [
      'Line 24 identified with butt welding activity',
      'Requires manager check due to partial quantity reporting (8/24 planned joints)',
      'Radiographic inspection (RT) clearance pending night shift sign-off',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping discipline matches' },
      { name: 'Line / Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 identified' },
      { name: 'Semantic Action Verb', score: 18, maxScore: 20, reason: 'Welding corresponds to planned joint weld' },
      { name: 'Temporal Window', score: 8, maxScore: 15, reason: 'Pushed back due to predecessor slip' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '18:20:00', actor: 'Debajit Borah (Site Engineer)', details: 'Batch ingested from Welder Shift Roster', status: 'info' },
      { step: 'Entity Extraction', timestamp: '18:20:01', actor: 'Deterministic NLP Extractor', details: 'Extracted: 8 welds, Line 24-XX, Welding', status: 'success' },
      { step: 'Schedule Candidate Search', timestamp: '18:20:02', actor: 'Deterministic Linking Engine', details: 'Matched PIP-24-002 at 86% confidence', status: 'warning' },
      { step: 'Verification Routing', timestamp: '18:20:03', actor: 'Verification Rules Engine', details: 'Score in 70-89% review band. Routed to Manager Review Queue.', status: 'warning' },
    ],
    verificationStatus: {
      state: 'Pending Review',
      reviewer: 'Rajesh Sharma (Chief Controls Manager)',
      notes: 'Held in Manager Review Queue pending RT inspection sign-off.',
    },
  },
  {
    id: 'EVT-2026-003',
    source: 'VOICE_AGENT',
    rawFieldStatement:
      'Cable ladder tray installation done from sub to comp bay about 45 meters along overhead gallery.',
    extractedQuantity: 45,
    unit: 'meters',
    area: 'Unit A Overhead / Substation to Compressor Bay',
    line: 'Overhead Gallery',
    discipline: 'Electrical',
    candidateActivityId: 'ELE-11-032',
    candidateActivityName: 'Cable Tray Installation - Substation to Compressor Bay',
    candidateWbs: '5.1.1',
    confidence: 78,
    evidenceCount: 0,
    evidenceItems: [],
    status: 'Needs Review',
    createdAt: '2026-09-17 16:00',
    workType: 'Installation',
    shiftTime: '08:30 - 15:00',
    reasons: [
      'Matches electrical cable tray installation path from Substation to Bay 1',
      'Voice input transcribed and normalized into structured metrics',
      'Lacks physical inspection photo attachment; verification required before twin update',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Electrical discipline confirmed' },
      { name: 'Asset Identifier', score: 25, maxScore: 35, reason: 'Substation to compressor bay identified' },
      { name: 'Semantic Action Verb', score: 16, maxScore: 20, reason: 'Cable ladder tray corresponds to ELE-11-032' },
      { name: 'Temporal Window', score: 12, maxScore: 15, reason: 'Within planned installation window' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '16:00:00', actor: 'Voice Note Audio Intake', details: 'Audio transcribed to structured field log', status: 'info' },
      { step: 'Entity Extraction', timestamp: '16:00:02', actor: 'Deterministic NLP Extractor', details: 'Extracted: 45 meters, Unit A Overhead, Electrical', status: 'success' },
      { step: 'Verification Routing', timestamp: '16:00:03', actor: 'Verification Rules Engine', details: 'Score 78%. Flagged for physical photo attachment.', status: 'warning' },
    ],
    verificationStatus: {
      state: 'Pending Review',
      reviewer: 'Debajit Borah',
      notes: 'Awaiting site inspection photo attachment from field crew.',
    },
  },
  {
    id: 'EVT-2026-004',
    source: 'SITE_DIARY',
    rawFieldStatement:
      'Pipe installation completed near Unit B drain line. Grouting applied on support blocks.',
    extractedQuantity: 1,
    unit: 'job',
    area: 'Unit B - Offsites Area',
    line: 'Drain Line',
    discipline: 'Piping',
    candidateActivityId: null,
    candidateActivityName: null,
    candidateWbs: null,
    confidence: 47,
    evidenceCount: 0,
    evidenceItems: [],
    status: 'Unmatched',
    createdAt: '2026-09-17 17:30',
    workType: 'Installation',
    shiftTime: 'General Shift',
    reasons: [
      'No baseline schedule activity exists for Unit B drain in Master Schedule Rev 3.2',
      'Offsite drainage work does not match current contracted civil/piping packages',
      'Routed to unmatched repository for scope reconciliation or change order issuance',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 20, maxScore: 25, reason: 'Piping discipline recognized' },
      { name: 'Asset Identifier', score: 10, maxScore: 35, reason: 'No schedule activity found for Unit B Drain' },
      { name: 'Semantic Action Verb', score: 12, maxScore: 20, reason: 'Generic installation verb' },
      { name: 'Temporal Window', score: 5, maxScore: 15, reason: 'Uncorrelated with schedule timeline' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '17:30:00', actor: 'Debajit Borah (Site Engineer)', details: 'Digitized from site diary entry', status: 'info' },
      { step: 'Schedule Candidate Search', timestamp: '17:30:02', actor: 'Deterministic Linking Engine', details: '0 matching WBS nodes found in Unit B schedule', status: 'critical' },
      { step: 'Unmatched Classification', timestamp: '17:30:03', actor: 'Verification Rules Engine', details: 'Assigned UNMATCHED status. Planner review required.', status: 'critical' },
    ],
    verificationStatus: {
      state: 'Flagged',
      notes: 'Out-of-scope candidate. Check if formal change order is pending.',
    },
  },
  {
    id: 'EVT-2026-005',
    source: 'FIELD_QUICK_FORM',
    rawFieldStatement:
      'Hydrostatic testing preparation for Line 24 section. Work paused at 11:30 due to sudden monsoon squall and missing 150 bar blind flanges from warehouse.',
    extractedQuantity: 0,
    unit: 'sections',
    area: 'Unit A - Test Manifold Bay 2',
    line: 'Line 24-XX',
    discipline: 'Piping',
    candidateActivityId: 'PIP-24-003',
    candidateActivityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    candidateWbs: '3.2.3',
    confidence: 62,
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-004', title: 'DELAY_NOTICE_WEATHER_STATION.pdf', type: 'DOCUMENT', timestamp: '13:05' },
    ],
    status: 'Conflict',
    createdAt: '2026-09-18 13:15',
    workType: 'Hydrostatic Testing',
    shiftTime: '11:30 - 13:00',
    reasons: [
      'Work stoppage reported: Rain squall hold + missing warehouse flange delivery',
      'Predecessor PIP-24-002 welding has unverified joints pending RT clearance',
      'Testing cannot proceed prior to weld completion; critical dependency conflict',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping hydrotest matched' },
      { name: 'Line / Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 test manifold' },
      { name: 'Dependency Validation', score: 0, maxScore: 20, reason: 'Predecessor PIP-24-002 incomplete (-20 penalty)' },
      { name: 'Impediment Flag', score: 2, maxScore: 20, reason: 'Stoppage logged: 0 output recorded' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '13:15:00', actor: 'Debajit Borah (Site Engineer)', details: 'Submitted via Quick Field Capture form', status: 'info' },
      { step: 'Predecessor Dependency Check', timestamp: '13:15:02', actor: 'Schedule Twin Engine', details: 'Conflict: Predecessor PIP-24-002 incomplete', status: 'critical' },
      { step: 'Conflict Alert Generated', timestamp: '13:15:03', actor: 'Verification Rules Engine', details: 'Flagged: 2-day potential delay to commissioning', status: 'critical' },
    ],
    verificationStatus: {
      state: 'Flagged',
      reviewer: 'Rajesh Sharma',
      notes: 'Held for Manager Review. Delay variance ticket generated.',
    },
  },
  {
    id: 'EVT-2026-006',
    source: 'DPR_PDF',
    rawFieldStatement:
      'Foundation raft concrete pour completed at Unit 02 flare knock-out drum. 45 m3 poured from 08:00 to 14:00.',
    extractedQuantity: 45,
    unit: 'm³ concrete',
    area: 'Unit A - Compressor Station Bay 1',
    line: 'Foundation Block A',
    discipline: 'Civil',
    candidateActivityId: 'CIV-11-001',
    candidateActivityName: 'Foundation Block A - Compressor Pedestal',
    candidateWbs: '2.1.1',
    confidence: 98,
    evidenceCount: 2,
    evidenceItems: [
      { id: 'EVD-005', title: 'CONCRETE_BATCH_TICKET_RMC_45M3.pdf', type: 'DOCUMENT', timestamp: '14:10' },
      { id: 'EVD-006', title: 'IMG_20260918_RAFT_POUR.jpg', type: 'PHOTO', timestamp: '14:20' },
    ],
    status: 'Matched',
    createdAt: '2026-09-18 14:30',
    workType: 'Concrete Pour',
    shiftTime: '08:00 - 14:00',
    reasons: [
      'Exact quantity 45 m³ matches scheduled milestone pour quantity',
      'Civil foundation package aligned with WBS 2.1.1 compressor pedestal',
      'RMC batch delivery ticket and QC slump test cubes attached',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Civil discipline matches' },
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Foundation Block A matched' },
      { name: 'Semantic Action Verb', score: 20, maxScore: 20, reason: 'Concrete pour matched' },
      { name: 'Temporal Window', score: 18, maxScore: 20, reason: 'Completed on scheduled target date' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '14:30:00', actor: 'Debajit Borah', details: 'Ingested from DPR Shift A', status: 'info' },
      { step: 'Entity Extraction', timestamp: '14:30:01', actor: 'Deterministic NLP Extractor', details: 'Extracted: 45 m3, Civil, Foundation Block A', status: 'success' },
      { step: 'Verification Governance', timestamp: '14:30:02', actor: 'Schedule Twin Engine', details: '100% Milestone completion verified. Twin updated.', status: 'success' },
    ],
    verificationStatus: {
      state: 'Verified',
      reviewer: 'Debajit Borah',
      verifiedAt: '2026-09-18 14:45',
      notes: 'Cube test specimens logged in site QC laboratory.',
    },
  },
  {
    id: 'EVT-2026-007',
    source: 'FIELD_QUICK_FORM',
    rawFieldStatement:
      'Line 24 spool erection completed. 12 spools mounted on rack B with mobile crane.',
    extractedQuantity: 12,
    unit: 'spools',
    area: 'Unit A - Gas Processing Area',
    line: 'Line 24-XX',
    discipline: 'Piping',
    candidateActivityId: 'PIP-24-001',
    candidateActivityName: 'Erect Line 24-XX High Pressure Gas Header',
    candidateWbs: '3.2.1',
    confidence: 94,
    evidenceCount: 1,
    evidenceItems: [
      { id: 'EVD-007', title: 'IMG_20260914_LINE24_DUPE.jpg', type: 'PHOTO', timestamp: '17:00' },
    ],
    status: 'Duplicate',
    createdAt: '2026-09-14 17:45',
    workType: 'Erection',
    shiftTime: '09:00 - 16:30',
    reasons: [
      'Identical 12 spools on Line 24 already logged and verified in EVT-2026-001',
      'Logged by assistant engineer 30 minutes after primary DPR submission',
      'Suppressed by de-duplication heuristic to prevent double-counting progress in Schedule Twin',
    ],
    signals: [
      { name: 'Deduplication Hash', score: 0, maxScore: 25, reason: 'Duplicate event signature matching EVT-2026-001' },
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Piping matches' },
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Line 24 matches' },
      { name: 'Quantity Overlap', score: 0, maxScore: 15, reason: 'Same 12 spools would exceed 100% capacity' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '17:45:00', actor: 'Assistant Site Supervisor', details: 'Submitted via Mobile Quick Form', status: 'info' },
      { step: 'Deduplication Engine', timestamp: '17:45:02', actor: 'Event Deduplicator', details: 'Duplicate detected against EVT-2026-001', status: 'warning' },
      { step: 'Duplicate Suppression', timestamp: '17:45:03', actor: 'Verification Rules Engine', details: 'Flagged as DUPLICATE. Suppressed from schedule math.', status: 'warning' },
    ],
    verificationStatus: {
      state: 'Rejected',
      reviewer: 'System De-duplicator',
      notes: 'Superfluous duplicate submission suppressed.',
    },
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
    candidateActivityId: 'MEC-02-008',
    candidateActivityName: 'Erect & Align Flare K.O. Drum Vessel',
    candidateWbs: '5.2.4',
    confidence: 52,
    evidenceCount: 0,
    evidenceItems: [],
    status: 'Stale',
    createdAt: '2026-09-11 16:00',
    workType: 'Erection',
    shiftTime: 'Day Shift',
    reasons: [
      'Event captured over 72 hours ago without verification or evidence submission',
      'Exceeds project controls daily synchronization SLA (48-hour cutoff)',
      'Requires baseline re-calibration and physical field walkdown verification before linking',
    ],
    signals: [
      { name: 'Discipline Alignment', score: 25, maxScore: 25, reason: 'Mechanical' },
      { name: 'Asset Identifier', score: 15, maxScore: 35, reason: 'Vessel identified but pad code ambiguous' },
      { name: 'SLA Recency Penalty', score: -30, maxScore: 0, reason: 'Captured 7 days prior; SLA expired' },
      { name: 'Temporal Alignment', score: 12, maxScore: 15, reason: 'Historical shift window' },
    ],
    processingHistory: [
      { step: 'Field Ingestion', timestamp: '2026-09-11 16:00', actor: 'Site Log Entry', details: 'Logged in physical diary', status: 'info' },
      { step: 'SLA Expiration Watchdog', timestamp: '2026-09-13 16:00', actor: 'Event SLA Daemon', details: '48h SLA elapsed without verification', status: 'critical' },
      { step: 'Stale State Transition', timestamp: '2026-09-14 00:00', actor: 'Integrity Controller', details: 'Marked STALE. Excluded from active daily rollup.', status: 'critical' },
    ],
    verificationStatus: {
      state: 'Flagged',
      notes: 'Stale event. Requires supervisor re-confirmation.',
    },
  },
];

export default function ExecutionIntelligencePage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ExecutionIntelligenceEvent[]>(MOCK_INTELLIGENCE_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string>('ALL');
  const [selectedDisciplineFilter, setSelectedDisciplineFilter] = useState<string>('ALL');

  // View Mode: 'cards' (First-Class Visual Objects) or 'table' (Canonical Table)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Progressive disclosure expanded states per event ID
  const [expandedWhyIds, setExpandedWhyIds] = useState<Record<string, boolean>>({});
  const [expandedTechIds, setExpandedTechIds] = useState<Record<string, boolean>>({});

  const toggleWhy = (id: string) => {
    setExpandedWhyIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTechnical = (id: string) => {
    setExpandedTechIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Selected event for Detail Drawer
  const [selectedEventForDrawer, setSelectedEventForDrawer] = useState<ExecutionIntelligenceEvent | null>(
    null
  );

  // Top summary metrics calculation
  const metrics = useMemo(() => {
    const total = events.length;
    const matched = events.filter((e) => e.status === 'Matched').length;
    const review = events.filter((e) => e.status === 'Needs Review').length;
    const unmatched = events.filter((e) => e.status === 'Unmatched').length;
    const conflicts = events.filter((e) => e.status === 'Conflict').length;
    const duplicates = events.filter((e) => e.status === 'Duplicate').length;
    const stale = events.filter((e) => e.status === 'Stale').length;

    return { total, matched, review, unmatched, conflicts, duplicates, stale };
  }, [events]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedStatusFilter !== 'ALL' && e.status !== selectedStatusFilter) {
        return false;
      }
      if (selectedSourceFilter !== 'ALL' && e.source !== selectedSourceFilter) {
        return false;
      }
      if (selectedDisciplineFilter !== 'ALL' && e.discipline !== selectedDisciplineFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesId = e.id.toLowerCase().includes(query);
        const matchesStatement = e.rawFieldStatement.toLowerCase().includes(query);
        const matchesActivity =
          (e.candidateActivityName || '').toLowerCase().includes(query) ||
          (e.candidateActivityId || '').toLowerCase().includes(query);
        const matchesArea = e.area.toLowerCase().includes(query);
        const matchesDiscipline = e.discipline.toLowerCase().includes(query);

        return matchesId || matchesStatement || matchesActivity || matchesArea || matchesDiscipline;
      }
      return true;
    });
  }, [events, selectedStatusFilter, selectedSourceFilter, selectedDisciplineFilter, searchQuery]);

  // Status badge styling helper
  const getStatusBadge = (status: ExecutionIntelligenceStatus) => {
    switch (status) {
      case 'Matched':
        return {
          bg: 'bg-[#EDF7F2]',
          border: 'border-[#B8DCC9]',
          text: 'text-[#2E7D5B]',
          icon: CheckCircle2,
        };
      case 'Needs Review':
        return {
          bg: 'bg-[#FDF6ED]',
          border: 'border-[#F0D4A6]',
          text: 'text-[#D98B32]',
          icon: Clock,
        };
      case 'Unmatched':
        return {
          bg: 'bg-[#F1F3F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#596579]',
          icon: HelpCircle,
        };
      case 'Conflict':
        return {
          bg: 'bg-[#FBEFEE]',
          border: 'border-[#E4B0AA]',
          text: 'text-[#B5473C]',
          icon: AlertCircle,
        };
      case 'Duplicate':
        return {
          bg: 'bg-[#FDF6ED]',
          border: 'border-[#F0D4A6]',
          text: 'text-[#D98B32]',
          icon: Copy,
        };
      case 'Stale':
      default:
        return {
          bg: 'bg-[#F1F3F5]',
          border: 'border-[#D9DEE5]',
          text: 'text-[#7B8798]',
          icon: History,
        };
    }
  };

  const breadcrumbs = [
    { label: 'Field Execution', href: '/engineer' },
    { label: 'Execution Intelligence', current: true },
  ];

  return (
    <StateWrapper>
      <div className="space-y-6 pb-24 md:pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* PAGE HEADER */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-5 md:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D9DEE5]/60">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#176B87]/10 text-[#176B87]">
                  <Cpu className="w-3.5 h-3.5" />
                  Project Controls Intelligence
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D5B]" />
                  Deterministic WBS Linking
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#172033] tracking-tight">
                Execution Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-[#596579] mt-0.5">
                First-class execution events linking site observations to schedule activities through distinct extraction, matching, and verification stages.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href="/field/capture"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#172033] bg-white border border-[#D9DEE5] hover:bg-[#F1F3F5] rounded-lg transition-colors shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5 text-[#176B87]" />
                <span>Field Capture</span>
              </Link>
              <Link
                href="/review"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Review Queue</span>
              </Link>
            </div>
          </div>

          {/* VISUAL SEPARATION OF CONCEPTS (Pipeline Definition Strip) */}
          <div className="pt-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] mb-2 flex items-center justify-between">
              <span>Three Separated Project-Control Stages (No Generic AI Black-Box)</span>
              <span className="font-mono text-[#176B87]">Canonical Flow: Extraction → Matching → Verification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* STAGE 1: Extraction */}
              <div className="p-3.5 rounded-lg border border-[#B3CBE0] bg-[#EDF5F8]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#176B87] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#176B87] text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                    Extraction
                  </span>
                  <span className="text-[10px] font-bold text-[#176B87] bg-white px-1.5 py-0.5 rounded border border-[#B3CBE0]">
                    Field Reality
                  </span>
                </div>
                <p className="text-[11px] text-[#596579] leading-relaxed">
                  Parses quantities, units, work areas, disciplines, and shift observations directly from DPRs, voice logs, and site diaries.
                </p>
              </div>

              {/* STAGE 2: Matching */}
              <div className="p-3.5 rounded-lg border border-[#D9DEE5] bg-[#F7F8FA] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#172033] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#172033] text-white text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                    Matching
                  </span>
                  <span className="text-[10px] font-bold text-[#596579] bg-white px-1.5 py-0.5 rounded border border-[#D9DEE5]">
                    Schedule Link
                  </span>
                </div>
                <p className="text-[11px] text-[#596579] leading-relaxed">
                  Binds extracted events to Primavera P6 Level 5 baseline activities using deterministic asset IDs and temporal windows.
                </p>
              </div>

              {/* STAGE 3: Verification */}
              <div className="p-3.5 rounded-lg border border-[#B8DCC9] bg-[#EDF7F2]/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2E7D5B] flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#2E7D5B] text-white text-[10px] font-bold flex items-center justify-center">
                      3
                    </span>
                    Verification
                  </span>
                  <span className="text-[10px] font-bold text-[#2E7D5B] bg-white px-1.5 py-0.5 rounded border border-[#B8DCC9]">
                    QC Governance
                  </span>
                </div>
                <p className="text-[11px] text-[#596579] leading-relaxed">
                  Enforces human engineer sign-offs, evidence ticket validation, and conflict gates before committing progress to the Schedule Twin.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* TOP SUMMARY METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => setSelectedStatusFilter('ALL')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              selectedStatusFilter === 'ALL'
                ? 'bg-[#EDF5F8] border-[#176B87] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Total Execution Events
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#172033] font-mono">
                {metrics.total}
              </span>
              <span className="text-[11px] text-[#596579]">captured</span>
            </div>
            <span className="text-[11px] text-[#176B87] mt-1 block">
              All Sources
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Matched')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              selectedStatusFilter === 'Matched'
                ? 'bg-[#EDF7F2] border-[#2E7D5B] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Matched & Verified
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#2E7D5B] font-mono">
                {metrics.matched}
              </span>
              <span className="text-[11px] text-[#596579]">linked</span>
            </div>
            <span className="text-[11px] text-[#2E7D5B] mt-1 block">
              Confidence &ge; 90%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Needs Review')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              selectedStatusFilter === 'Needs Review'
                ? 'bg-[#FDF6ED] border-[#D98B32] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Needs Review
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#D98B32] font-mono">
                {metrics.review}
              </span>
              <span className="text-[11px] text-[#596579]">pending</span>
            </div>
            <span className="text-[11px] text-[#D98B32] mt-1 block">
              Confidence 70–89%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Unmatched')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              selectedStatusFilter === 'Unmatched'
                ? 'bg-[#F1F3F5] border-[#596579] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Unmatched Events
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#596579] font-mono">
                {metrics.unmatched}
              </span>
              <span className="text-[11px] text-[#596579]">orphans</span>
            </div>
            <span className="text-[11px] text-[#596579] mt-1 block">
              Confidence &lt; 70%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatusFilter('Conflict')}
            className={`p-3.5 rounded-lg border text-left transition-all col-span-2 sm:col-span-1 ${
              selectedStatusFilter === 'Conflict'
                ? 'bg-[#FBEFEE] border-[#B5473C] shadow-2xs'
                : 'bg-white border-[#D9DEE5] hover:bg-[#F7F8FA]'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B8798] block">
              Conflicts & Holds
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#B5473C] font-mono">
                {metrics.conflicts}
              </span>
              <span className="text-[11px] text-[#596579]">stoppages</span>
            </div>
            <span className="text-[11px] text-[#B5473C] mt-1 block font-medium">
              Dependency Holds
            </span>
          </button>
        </div>

        {/* CONTROLS & FILTER BAR */}
        <div className="bg-white border border-[#D9DEE5] rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event ID, statement, activity, or work area..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] focus:bg-white border border-[#D9DEE5] focus:border-[#176B87] rounded-lg text-xs outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#172033]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-[#F1F3F5] p-0.5 rounded-lg border border-[#D9DEE5]">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-[#172033] shadow-2xs font-bold'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                Event Objects (Cards)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-[#172033] shadow-2xs font-bold'
                    : 'text-[#596579] hover:text-[#172033]'
                }`}
              >
                Canonical Table
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#7B8798] font-medium text-[11px]">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
              >
                <option value="ALL">All ({metrics.total})</option>
                <option value="Matched">Matched ({metrics.matched})</option>
                <option value="Needs Review">Needs Review ({metrics.review})</option>
                <option value="Unmatched">Unmatched ({metrics.unmatched})</option>
                <option value="Conflict">Conflict ({metrics.conflicts})</option>
                <option value="Duplicate">Duplicate ({metrics.duplicates})</option>
                <option value="Stale">Stale ({metrics.stale})</option>
              </select>
            </div>

            {/* Discipline Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#7B8798] font-medium text-[11px]">Discipline:</span>
              <select
                value={selectedDisciplineFilter}
                onChange={(e) => setSelectedDisciplineFilter(e.target.value)}
                className="p-1.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded-lg text-xs font-semibold text-[#172033]"
              >
                <option value="ALL">All Disciplines</option>
                <option value="Piping">Piping</option>
                <option value="Civil">Civil</option>
                <option value="Electrical">Electrical</option>
                <option value="Mechanical">Mechanical</option>
              </select>
            </div>
          </div>
        </div>

        {/* =========================================================================
            FIRST-CLASS VISUAL OBJECT STREAM (Cards View)
            ========================================================================= */}
        {viewMode === 'cards' && (
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="p-10 text-center bg-white border border-[#D9DEE5] rounded-lg">
                <HelpCircle className="w-8 h-8 text-[#7B8798] mx-auto mb-2" />
                <p className="font-semibold text-sm text-[#172033]">No execution events match your filters</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatusFilter('ALL');
                    setSelectedDisciplineFilter('ALL');
                  }}
                  className="mt-2 text-xs font-semibold text-[#176B87] hover:underline"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const statusBadge = getStatusBadge(evt.status);
                const StatusIcon = statusBadge.icon;
                const isWhyExpanded = !!expandedWhyIds[evt.id];
                const isTechExpanded = !!expandedTechIds[evt.id];

                return (
                  <div
                    key={evt.id}
                    className="bg-white border border-[#D9DEE5] rounded-lg shadow-xs overflow-hidden transition-all hover:border-[#B3CBE0]"
                  >
                    {/* EVENT HEADER */}
                    <div className="bg-[#F7F8FA] border-b border-[#D9DEE5] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-[#176B87] bg-white px-2.5 py-1 rounded border border-[#D9DEE5]">
                          {evt.id}
                        </span>
                        <span className="text-[11px] font-mono text-[#596579]">
                          {evt.createdAt}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-[#596579] bg-white px-2 py-0.5 rounded border border-[#D9DEE5]">
                          {evt.source.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-semibold text-[#7B8798]">
                          Shift: {evt.shiftTime}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{evt.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* THREE SEPARATED CONCEPTS: 1. EXTRACTION | 2. MATCHING | 3. VERIFICATION */}
                    <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* -----------------------------------------------------------
                          1. EXTRACTION (Site Observation & Values)
                          ----------------------------------------------------------- */}
                      <div className="lg:col-span-5 space-y-3 border-b lg:border-b-0 lg:border-r border-[#D9DEE5] pb-4 lg:pb-0 lg:pr-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EDF5F8] text-[#176B87] border border-[#B3CBE0]">
                            1. Extraction
                          </span>
                          <span className="text-[11px] text-[#7B8798]">Site Physical Record</span>
                        </div>

                        {/* Event Description (What happened in the field) */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-0.5">
                            Event Description (What Happened)
                          </span>
                          <p className="text-xs font-semibold text-[#172033] leading-relaxed bg-[#FAFAFA] p-2.5 rounded-lg border border-[#D9DEE5]">
                            "{evt.rawFieldStatement}"
                          </p>
                        </div>

                        {/* Extracted Quantity, Unit, Area, Discipline */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#F7F8FA] p-2.5 rounded border border-[#D9DEE5]">
                            <span className="text-[9px] uppercase font-bold text-[#7B8798] block">
                              Extracted Quantity
                            </span>
                            <span className="font-mono font-bold text-sm text-[#172033]">
                              {evt.extractedQuantity} {evt.unit}
                            </span>
                          </div>
                          <div className="bg-[#F7F8FA] p-2.5 rounded border border-[#D9DEE5]">
                            <span className="text-[9px] uppercase font-bold text-[#7B8798] block">
                              Discipline
                            </span>
                            <span className="font-bold text-xs text-[#172033]">{evt.discipline}</span>
                          </div>
                          <div className="col-span-2 bg-[#F7F8FA] p-2.5 rounded border border-[#D9DEE5]">
                            <span className="text-[9px] uppercase font-bold text-[#7B8798] block">
                              Area / Workfront
                            </span>
                            <span className="font-semibold text-xs text-[#172033] truncate block">
                              {evt.area}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* -----------------------------------------------------------
                          2. MATCHING (Schedule Linking)
                          ----------------------------------------------------------- */}
                      <div className="lg:col-span-4 space-y-3 border-b lg:border-b-0 lg:border-r border-[#D9DEE5] pb-4 lg:pb-0 lg:pr-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F1F3F5] text-[#172033] border border-[#D9DEE5]">
                              2. Matching
                            </span>
                            <span className="text-[11px] text-[#7B8798]">Schedule Link</span>
                          </div>
                          <ConfidenceBadge score={evt.confidence} size="sm" />
                        </div>

                        {/* Suggested Activity */}
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-0.5">
                            Suggested Activity
                          </span>
                          {evt.candidateActivityId ? (
                            <div className="bg-white p-2.5 rounded border border-[#D9DEE5] space-y-1">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => openActivityDrawer(evt.candidateActivityId!)}
                                  className="font-mono font-bold text-xs text-[#176B87] hover:underline inline-flex items-center gap-1"
                                >
                                  <span>{evt.candidateActivityId}</span>
                                  <ArrowUpRight className="w-3 h-3 text-[#176B87]" />
                                </button>
                                <span className="font-mono text-[10px] text-[#7B8798]">
                                  WBS {evt.candidateWbs}
                                </span>
                              </div>
                              <p className="font-bold text-xs text-[#172033] line-clamp-2">
                                {evt.candidateActivityName}
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-[#FBEFEE] rounded border border-[#E4B0AA] text-xs text-[#B5473C] font-semibold">
                              No schedule activity matched (Unmatched Candidate)
                            </div>
                          )}
                        </div>

                        {/* Progressive Disclosure Trigger: "Why this match?" */}
                        <div className="pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-[#7B8798]">
                              Match Alignment:
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWhy(evt.id)}
                              className="text-[11px] font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isWhyExpanded ? 'Hide Why' : 'Why this match?'}</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isWhyExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          <p className="text-[11px] text-[#596579] line-clamp-2 mt-1 leading-relaxed">
                            {evt.reasons[0] || 'Matches baseline activity parameters.'}
                          </p>
                        </div>
                      </div>

                      {/* -----------------------------------------------------------
                          3. VERIFICATION (QC Governance & Evidence)
                          ----------------------------------------------------------- */}
                      <div className="lg:col-span-3 space-y-3 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#EDF7F2] text-[#2E7D5B] border border-[#B8DCC9]">
                                3. Verification
                              </span>
                              <span className="text-[11px] text-[#7B8798]">QC & Gate</span>
                            </div>
                          </div>

                          {/* Verification State */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-0.5">
                              Verification State
                            </span>
                            <div className="p-2 bg-[#F7F8FA] border border-[#D9DEE5] rounded flex items-center justify-between text-xs">
                              <span className="font-bold text-[#172033]">
                                {evt.verificationStatus.state}
                              </span>
                              {evt.verificationStatus.reviewer && (
                                <span className="text-[10px] text-[#596579]">
                                  {evt.verificationStatus.reviewer}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Evidence */}
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                              Evidence ({evt.evidenceItems.length} proofs)
                            </span>
                            {evt.evidenceItems.length > 0 ? (
                              <div className="space-y-1">
                                {evt.evidenceItems.map((ev) => (
                                  <div
                                    key={ev.id}
                                    className="p-1.5 bg-white border border-[#D9DEE5] rounded flex items-center justify-between text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      {ev.type === 'PHOTO' ? (
                                        <Camera className="w-3 h-3 text-[#176B87] shrink-0" />
                                      ) : (
                                        <FileText className="w-3 h-3 text-[#596579] shrink-0" />
                                      )}
                                      <span className="font-mono truncate">{ev.title}</span>
                                    </div>
                                    <span className="text-[9px] text-[#7B8798] shrink-0 font-mono">
                                      {ev.timestamp}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#7B8798] italic p-2 bg-[#FAFAFA] rounded border border-[#D9DEE5]">
                                No evidence files attached
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Event Drawer Action */}
                        <div className="pt-2 border-t border-[#D9DEE5] flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setSelectedEventForDrawer(evt)}
                            className="text-xs font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Event Detail</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* =========================================================
                        PROGRESSIVE DISCLOSURE: EXPANDABLE "WHY?"
                        ========================================================= */}
                    {isWhyExpanded && (
                      <div className="bg-[#F7F8FA] border-t border-[#D9DEE5] p-4 text-xs space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="font-bold text-xs text-[#172033] flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-[#176B87]" />
                            Why this match? (Deterministic Alignment Logic)
                          </span>
                          <button
                            type="button"
                            onClick={() => openWhyExplanation(`confidence:${evt.id}`, evt.id)}
                            className="text-[11px] font-bold text-[#176B87] hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Detailed Audit Dialogue</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Plain English Engineering Reasons */}
                        <ul className="space-y-1.5 bg-white p-3 rounded-lg border border-[#D9DEE5] text-xs text-[#172033]">
                          {evt.reasons.map((r, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D5B] shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ul>

                        {/* ADVANCED PROGRESSIVE DISCLOSURE: Technical Details Toggle */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => toggleTechnical(evt.id)}
                            className="text-[11px] font-semibold text-[#596579] hover:text-[#172033] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isTechExpanded ? 'Hide Technical Details' : 'Advanced: Technical Details'}</span>
                            <ChevronDown className={`w-3 h-3 transition-transform ${isTechExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* ADVANCED TECHNICAL DETAILS (Non-prominent) */}
                        {isTechExpanded && (
                          <div className="p-3 bg-white border border-[#D9DEE5] rounded-lg space-y-2 text-[11px]">
                            <span className="font-bold text-[#7B8798] uppercase tracking-wider text-[9px] block">
                              Deterministic Weight Signals & Parsing Trace
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[#596579]">
                              {evt.signals.map((sig, idx) => (
                                <div key={idx} className="p-2 bg-[#FAFAFA] rounded border border-[#D9DEE5]">
                                  <span className="text-[9px] uppercase font-bold text-[#7B8798] block truncate">
                                    {sig.name}
                                  </span>
                                  <strong className="text-[#172033] font-mono text-xs">
                                    {sig.score} / {sig.maxScore} pts
                                  </strong>
                                  <p className="text-[9px] text-[#7B8798] truncate mt-0.5">{sig.reason}</p>
                                </div>
                              ))}
                            </div>
                            <div className="pt-1.5 border-t border-[#D9DEE5]/60 flex items-center justify-between text-[10px] text-[#7B8798]">
                              <span>Transformation: Strict non-probabilistic rulebook constraints</span>
                              <span>Source Payload: {evt.source} ({evt.shiftTime})</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =========================================================================
            CANONICAL TABLE VIEW (Satisfies Priority 3 & Responsive Tests)
            ========================================================================= */}
        {viewMode === 'table' && (
          <div className="bg-white border border-[#D9DEE5] rounded-lg overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F7F8FA] border-b border-[#D9DEE5] text-[11px] font-bold uppercase tracking-wider text-[#596579]">
                    <th className="p-3.5 whitespace-nowrap">Event ID</th>
                    <th className="p-3.5 min-w-[280px]">Field Statement</th>
                    <th className="p-3.5 min-w-[200px]">Activity</th>
                    <th className="p-3.5 whitespace-nowrap">Confidence</th>
                    <th className="p-3.5 whitespace-nowrap">Status</th>
                    <th className="p-3.5 whitespace-nowrap">Date</th>
                    <th className="p-3.5 whitespace-nowrap text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#596579]">
                        <HelpCircle className="w-8 h-8 text-[#7B8798] mx-auto mb-2" />
                        <p className="font-semibold text-sm text-[#172033]">No execution events match your filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt) => {
                      const statusBadge = getStatusBadge(evt.status);
                      const StatusIcon = statusBadge.icon;

                      return (
                        <tr
                          key={evt.id}
                          onClick={() => setSelectedEventForDrawer(evt)}
                          className="hover:bg-[#EDF5F8]/50 transition-colors cursor-pointer group"
                        >
                          {/* 1. Execution Event ID */}
                          <td className="p-3.5 whitespace-nowrap font-mono font-bold text-[#176B87] group-hover:underline">
                            {evt.id}
                          </td>

                          {/* 2. Field Statement */}
                          <td className="p-3.5 text-[#172033] max-w-[320px]">
                            <p className="font-medium line-clamp-2" title={evt.rawFieldStatement}>
                              {evt.rawFieldStatement}
                            </p>
                            <span className="text-[10px] text-[#7B8798] font-mono mt-0.5 inline-block">
                              Extracted: {evt.extractedQuantity} {evt.unit} • {evt.discipline}
                            </span>
                          </td>

                          {/* 3. Activity */}
                          <td className="p-3.5 max-w-[220px]">
                            {evt.candidateActivityId ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openActivityDrawer(evt.candidateActivityId!);
                                  }}
                                  className="font-mono font-bold text-[#176B87] hover:underline inline-flex items-center gap-1 text-left"
                                  title="Open Activity Detail Drawer"
                                >
                                  <span>{evt.candidateActivityId}</span>
                                  <ArrowUpRight className="w-3 h-3 text-[#176B87]" />
                                </button>
                                <p className="text-[11px] text-[#596579] truncate" title={evt.candidateActivityName || ''}>
                                  {evt.candidateActivityName}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-[#7B8798] italic">
                                Unassigned
                              </span>
                            )}
                          </td>

                          {/* 4. Confidence */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <ConfidenceBadge score={evt.confidence} size="sm" />
                              <WhyButton
                                onClick={() =>
                                  openWhyExplanation(`confidence:${evt.id}`, evt.id)
                                }
                                title="Why is this match confidence computed?"
                              />
                            </div>
                          </td>

                          {/* 5. Status */}
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              <span>{evt.status}</span>
                            </span>
                          </td>

                          {/* 6. Date */}
                          <td className="p-3.5 whitespace-nowrap text-[#596579] font-mono text-[11px]">
                            {evt.createdAt}
                          </td>

                          {/* 7. Action */}
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventForDrawer(evt);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold text-[#176B87] hover:bg-[#EDF5F8] border border-[#B3CBE0] rounded transition-colors inline-flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3 text-[#176B87]" />
                                <span>Inspect</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3.5 bg-[#F7F8FA] border-t border-[#D9DEE5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#596579]">
              <span>
                Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> execution events
              </span>
              <span className="text-[11px] text-[#7B8798]">
                Switch to "Event Objects (Cards)" for first-class progressive disclosure view
              </span>
            </div>
          </div>
        )}

        {/* EXECUTION EVENT DETAIL DRAWER */}
        <Drawer
          isOpen={!!selectedEventForDrawer}
          onClose={() => setSelectedEventForDrawer(null)}
          title={`Execution Event: ${selectedEventForDrawer?.id || ''}`}
          subtitle={`${selectedEventForDrawer?.source || ''} · Captured ${selectedEventForDrawer?.createdAt || ''}`}
          width="lg"
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <button
                type="button"
                onClick={() => setSelectedEventForDrawer(null)}
                className="px-4 py-2 font-semibold text-[#596579] hover:text-[#172033] bg-white border border-[#D9DEE5] rounded-lg"
              >
                Close Drawer
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/review"
                  className="px-4 py-2 font-bold text-white bg-[#176B87] hover:bg-[#135A72] rounded-lg shadow-xs inline-flex items-center gap-1.5"
                >
                  <span>Open in Review Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          }
        >
          {selectedEventForDrawer && (
            <div className="space-y-6 text-xs text-[#172033]">
              {/* STATUS & CONFIDENCE BANNER */}
              <div className="p-4 rounded-lg border border-[#D9DEE5] bg-[#F7F8FA] flex items-center justify-between flex-wrap gap-2">
                <div>
                  {(() => {
                    const sb = getStatusBadge(selectedEventForDrawer.status);
                    const SIcon = sb.icon;
                    return (
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${sb.bg} ${sb.border} ${sb.text}`}
                      >
                        <SIcon className="w-3.5 h-3.5" />
                        <span>Status: {selectedEventForDrawer.status}</span>
                      </span>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[#7B8798] uppercase font-bold text-[10px]">Confidence:</span>
                  <ConfidenceBadge score={selectedEventForDrawer.confidence} size="md" />
                </div>
              </div>

              {/* 1. EXTRACTION BREAKDOWN */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#176B87] mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#176B87] text-white text-[9px] font-bold flex items-center justify-center">
                    1
                  </span>
                  Extraction: What Happened
                </h4>
                <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-3">
                  <p className="text-xs font-medium text-[#172033] leading-relaxed bg-[#F7F8FA] p-3 rounded-lg border border-[#D9DEE5]/60">
                    "{selectedEventForDrawer.rawFieldStatement}"
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded">
                      <span className="text-[9px] uppercase font-bold text-[#7B8798] block">Quantity & Unit</span>
                      <span className="font-bold font-mono text-[#172033]">
                        {selectedEventForDrawer.extractedQuantity} {selectedEventForDrawer.unit}
                      </span>
                    </div>
                    <div className="p-2.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded">
                      <span className="text-[9px] uppercase font-bold text-[#7B8798] block">Discipline</span>
                      <span className="font-bold text-[#172033]">{selectedEventForDrawer.discipline}</span>
                    </div>
                    <div className="p-2.5 bg-[#FAFAFA] border border-[#D9DEE5] rounded col-span-2">
                      <span className="text-[9px] uppercase font-bold text-[#7B8798] block">Area</span>
                      <span className="font-bold text-[#172033] truncate block">{selectedEventForDrawer.area}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. MATCHING & WHY */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#172033] mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#172033] text-white text-[9px] font-bold flex items-center justify-center">
                    2
                  </span>
                  Matching: Schedule Activity & Why
                </h4>
                <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-3">
                  {selectedEventForDrawer.candidateActivityId ? (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#176B87] text-sm">
                          {selectedEventForDrawer.candidateActivityId}
                        </span>
                        <span className="text-[11px] font-mono text-[#7B8798]">
                          WBS {selectedEventForDrawer.candidateWbs}
                        </span>
                      </div>
                      <p className="font-bold text-xs text-[#172033] mt-0.5">
                        {selectedEventForDrawer.candidateActivityName}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#FBEFEE] rounded border border-[#E4B0AA] text-xs text-[#B5473C] font-semibold">
                      No matching activity in schedule
                    </div>
                  )}

                  {/* Why this match? */}
                  <div className="pt-2 border-t border-[#D9DEE5]/60 space-y-1.5">
                    <span className="font-bold text-[11px] text-[#172033] block">
                      Why this match?
                    </span>
                    <ul className="space-y-1 text-[11px]">
                      {selectedEventForDrawer.reasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-[#2E7D5B] shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 3. VERIFICATION & EVIDENCE */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#2E7D5B] mb-2 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-[#2E7D5B] text-white text-[9px] font-bold flex items-center justify-center">
                    3
                  </span>
                  Verification & Physical Evidence
                </h4>
                <div className="p-3.5 bg-white border border-[#D9DEE5] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">
                      State: {selectedEventForDrawer.verificationStatus.state}
                    </span>
                    {selectedEventForDrawer.verificationStatus.reviewer && (
                      <span className="text-[11px] text-[#596579]">
                        Reviewer: {selectedEventForDrawer.verificationStatus.reviewer}
                      </span>
                    )}
                  </div>
                  {selectedEventForDrawer.verificationStatus.notes && (
                    <p className="text-[11px] text-[#596579] bg-[#FAFAFA] p-2 rounded border border-[#D9DEE5]">
                      {selectedEventForDrawer.verificationStatus.notes}
                    </p>
                  )}

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7B8798] block mb-1">
                      Attached Physical Evidence ({selectedEventForDrawer.evidenceItems.length})
                    </span>
                    {selectedEventForDrawer.evidenceItems.length > 0 ? (
                      <div className="space-y-1.5">
                        {selectedEventForDrawer.evidenceItems.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2 bg-[#FAFAFA] border border-[#D9DEE5] rounded flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              {ev.type === 'PHOTO' ? (
                                <Camera className="w-3.5 h-3.5 text-[#176B87] shrink-0" />
                              ) : (
                                <FileText className="w-3.5 h-3.5 text-[#596579] shrink-0" />
                              )}
                              <span className="font-mono truncate">{ev.title}</span>
                            </div>
                            <span className="text-[10px] text-[#7B8798] shrink-0">{ev.timestamp}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#7B8798] italic">No evidence attached</p>
                    )}
                  </div>
                </div>
              </div>

              {/* ADVANCED COLLAPSIBLE: PROCESSING TIMELINE */}
              <div className="pt-2 border-t border-[#D9DEE5]">
                <details className="text-xs group">
                  <summary className="font-bold text-[#596579] cursor-pointer hover:text-[#172033] flex items-center justify-between">
                    <span>Advanced: Transformation Timeline & Signal Weights</span>
                    <ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-3 border border-[#D9DEE5] rounded-lg overflow-hidden divide-y divide-[#D9DEE5] bg-white">
                    {selectedEventForDrawer.processingHistory.map((h, idx) => (
                      <div key={idx} className="p-2.5 text-xs flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-[#176B87] mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#172033]">{h.step}</span>
                            <span className="font-mono text-[10px] text-[#7B8798]">{h.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-[#596579]">{h.details}</p>
                          <span className="text-[10px] text-[#7B8798]">By {h.actor}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </div>
          )}
        </Drawer>
      </div>
    </StateWrapper>
  );
}
