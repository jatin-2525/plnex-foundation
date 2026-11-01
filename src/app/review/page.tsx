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
import { ConfidenceBadge } from '../../components/shared/ConfidenceBadge';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { WhyButton } from '../../components/shared/WhyButton';
import { CoreFlowBanner } from '../../components/shared/CoreFlowBanner';
import { HorizontalBarChart, StatusDonutChart } from '../../components/shared/charts';
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
  status: 'High Confidence' | 'Manager Review' | 'Unmatched' | 'Conflicts' | 'Duplicates' | 'Stale' | 'Verified History';
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
    area: 'Unit 02 - Flare Area',
    line: 'Flare KO Drum Raft',
    discipline: 'Civil',
    workType: 'Concrete Pour',
    shiftTime: '08:00 - 14:00',
    candidateActivityId: 'CIV-02-005',
    candidateActivityName: 'Unit 02 Flare Knock-Out Drum Foundation Raft',
    candidateWbs: '2.2.1',
    confidence: 96,
    matchReason: 'Unit 02 Flare KO Drum foundation confirmed · Correctly disambiguated from Unit A CIV-11-001 (already completed on 14 Sep)',
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
      { name: 'Asset Identifier', score: 35, maxScore: 35, reason: 'Unit 02 Flare KO drum foundation matched' },
      { name: 'Semantic Action Verb', score: 20, maxScore: 20, reason: 'Concrete pour matched' },
      { name: 'Area Disambiguation', score: 16, maxScore: 20, reason: 'Area matches Unit 02 Flare; isolated from completed Unit A compressor' },
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

// Historical Verified Milestone Events (12 Verified Events on Master Schedule Ledger PRJ-OIL-2026-01)
const HISTORICAL_RAW_EVENTS: Omit<ReviewEvent, 'alternativeCandidates' | 'signals' | 'rulesEvaluated'>[] = [
  {
    id: 'HIST-EVT-01',
    source: 'DPR_PDF',
    rawFieldStatement: 'Site mobilization and initial boundary earthworks completed across 12,000 m².',
    extractedQuantity: 12000,
    unit: 'm²',
    area: 'Plant Perimeter',
    line: 'Boundary Zone',
    discipline: 'Civil',
    workType: 'Earthworks',
    shiftTime: '08:00 - 17:00',
    candidateActivityId: 'CIV-01-001',
    candidateActivityName: 'Site Clearing & Grading',
    candidateWbs: '1.1.1.1.0',
    confidence: 100,
    matchReason: 'Milestone sign-off verified by OIL site representative',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H01', title: 'MOBILIZATION_ACCEPTANCE.pdf', type: 'DOCUMENT', timestamp: '17:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-05-31 17:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-02',
    source: 'DPR_PDF',
    rawFieldStatement: 'Access road preparation and security perimeter fencing completed (1,400 m).',
    extractedQuantity: 1400,
    unit: 'meters',
    area: 'Plant Perimeter',
    line: 'Security Zone',
    discipline: 'Civil',
    workType: 'Fencing',
    shiftTime: '08:00 - 17:00',
    candidateActivityId: 'CIV-01-002',
    candidateActivityName: 'Access Road & Perimeter Fencing',
    candidateWbs: '1.1.1.1.2',
    confidence: 100,
    matchReason: 'Milestone handover accepted',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H02', title: 'FENCING_SURVEY_INSPECTION.pdf', type: 'DOCUMENT', timestamp: '16:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-06-15 16:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-03',
    source: 'DPR_PDF',
    rawFieldStatement: 'Substation raft foundation concrete pour completed (185 m³ poured).',
    extractedQuantity: 185,
    unit: 'm³ concrete',
    area: 'Unit A - Substation',
    line: 'Substation Raft',
    discipline: 'Civil',
    workType: 'Concrete Pour',
    shiftTime: '07:00 - 19:00',
    candidateActivityId: 'CIV-02-005',
    candidateActivityName: 'Substation Raft Foundation',
    candidateWbs: '1.1.2.1.1',
    confidence: 100,
    matchReason: '7-day and 28-day cylinder tests passed',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H03', title: 'SUBSTATION_RAFT_POUR_TICKETS.pdf', type: 'DOCUMENT', timestamp: '19:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-06-30 19:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-04',
    source: 'DPR_PDF',
    rawFieldStatement: 'Unit A piperack pedestals (52 pedestals) poured and cured.',
    extractedQuantity: 52,
    unit: 'pedestals',
    area: 'Unit A - Piperack',
    line: 'Piperack Grid',
    discipline: 'Civil',
    workType: 'Concrete Pour',
    shiftTime: '08:00 - 16:30',
    candidateActivityId: 'CIV-02-008',
    candidateActivityName: 'Unit A Piperack Pedestals',
    candidateWbs: '1.1.2.1.4',
    confidence: 100,
    matchReason: 'Elevation and coordinate survey passed',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H04', title: 'PIPERACK_PEDESTAL_SURVEY.pdf', type: 'DOCUMENT', timestamp: '16:30' }],
    submittedBy: 'Debajit Borah',
    date: '2026-07-12 16:30',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-05',
    source: 'DPR_PDF',
    rawFieldStatement: 'Compressor foundation block A concrete pour 100% completed (45 m³ poured).',
    extractedQuantity: 45,
    unit: 'm³ concrete',
    area: 'Unit A - Compressor House',
    line: 'Foundation Block A',
    discipline: 'Civil',
    workType: 'Concrete Pour',
    shiftTime: '08:00 - 15:00',
    candidateActivityId: 'CIV-11-001',
    candidateActivityName: 'Foundation Block A - Compressor Pedestal',
    candidateWbs: '1.1.1.1.1',
    confidence: 100,
    matchReason: 'Milestone pour verified; cube compressive strength cleared',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H05', title: 'BLOCK_A_POUR_CERTIFICATE.pdf', type: 'DOCUMENT', timestamp: '15:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-07-31 15:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-06',
    source: 'DPR_PDF',
    rawFieldStatement: 'Soleplate leveling and anchor bolt preset completed for gas compressor skid A (32 sets).',
    extractedQuantity: 32,
    unit: 'sets',
    area: 'Unit A - Compressor House',
    line: 'Skid Bay 1',
    discipline: 'Mechanical',
    workType: 'Leveling & Shimming',
    shiftTime: '09:00 - 17:00',
    candidateActivityId: 'MEC-01-004',
    candidateActivityName: 'Soleplate Leveling & Anchor Bolt Preset',
    candidateWbs: '1.1.3.1.1',
    confidence: 100,
    matchReason: 'OEM tolerance inspection signed off (±0.05 mm)',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H06', title: 'OEM_SOLEPLATE_SIGN_OFF.pdf', type: 'DOCUMENT', timestamp: '17:00' }],
    submittedBy: 'V. Verma',
    date: '2026-08-05 17:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-07',
    source: 'DPR_PDF',
    rawFieldStatement: 'Column and beam erection tier 1 completed (89 MT structural steel).',
    extractedQuantity: 89,
    unit: 'MT steel',
    area: 'Unit A - Piperack Tier 1',
    line: 'Piperack Frame',
    discipline: 'Civil',
    workType: 'Steel Erection',
    shiftTime: '08:00 - 18:00',
    candidateActivityId: 'STR-02-004',
    candidateActivityName: 'Column & Beam Erection Tier 1',
    candidateWbs: '1.1.2.2.1',
    confidence: 100,
    matchReason: 'Torque check & bolt alignment verified',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H07', title: 'TORQUE_TIGHTENING_LOG.pdf', type: 'DOCUMENT', timestamp: '18:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-08-25 18:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-08',
    source: 'DPR_PDF',
    rawFieldStatement: 'Spool stringing and pre-rigging for Main Piperack Tier 1 completed (56 spools).',
    extractedQuantity: 56,
    unit: 'spools',
    area: 'Unit A - Piperack',
    line: 'Tier 1 Rack',
    discipline: 'Piping',
    workType: 'Spool Stringing',
    shiftTime: '08:30 - 16:30',
    candidateActivityId: 'PIP-20-001',
    candidateActivityName: 'Spool Stringing & Pre-rigging',
    candidateWbs: '1.1.3.1.4',
    confidence: 100,
    matchReason: 'Pre-rigging inspection cleared',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H08', title: 'SPOOL_STRINGING_RECEIPT.pdf', type: 'DOCUMENT', timestamp: '16:30' }],
    submittedBy: 'Debajit Borah',
    date: '2026-08-31 16:30',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-09',
    source: 'DPR_PDF',
    rawFieldStatement: 'Erect Line 24-XX HP gas header (48 spools erected and flange faces preserved).',
    extractedQuantity: 48,
    unit: 'spools',
    area: 'Unit A - Gas Processing',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Erection',
    shiftTime: '09:00 - 17:30',
    candidateActivityId: 'PIP-24-001',
    candidateActivityName: 'Erect Line 24-XX High Pressure Gas Header',
    candidateWbs: '1.1.3.2.1',
    confidence: 100,
    matchReason: 'Erection complete; verified and committed on 17 Sep (+2d historical variance)',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H09', title: 'LINE24_ERECTION_COMPLETION.pdf', type: 'DOCUMENT', timestamp: '17:30' }],
    submittedBy: 'Debajit Borah',
    date: '2026-09-17 17:30',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-10',
    source: 'DPR_PDF',
    rawFieldStatement: 'Substation feeder cable termination pothead stress cones prepared and insulation tested.',
    extractedQuantity: 1,
    unit: 'circuit',
    area: 'Unit A - Substation',
    line: '11kV Feeder',
    discipline: 'Electrical',
    workType: 'Termination',
    shiftTime: '08:00 - 16:00',
    candidateActivityId: 'ELE-11-032',
    candidateActivityName: 'Cable Tray Installation - Substation to Bay',
    candidateWbs: '1.1.4.1.2',
    confidence: 100,
    matchReason: 'Megger insulation test report approved',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H10', title: 'INSULATION_RESISTANCE_PASS.pdf', type: 'DOCUMENT', timestamp: '16:00' }],
    submittedBy: 'Sunil Gogoi',
    date: '2026-09-15 16:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-11',
    source: 'DPR_PDF',
    rawFieldStatement: 'Centrifugal gas compressor skid A laser alignment completed within ±0.02mm tolerance.',
    extractedQuantity: 1,
    unit: 'skid',
    area: 'Unit A - Compressor House',
    line: 'Skid A',
    discipline: 'Mechanical',
    workType: 'Alignment',
    shiftTime: '09:00 - 18:00',
    candidateActivityId: 'MEC-08-003',
    candidateActivityName: 'Align Centrifugal Gas Compressor Skid A',
    candidateWbs: '1.1.3.1.2',
    confidence: 100,
    matchReason: 'OEM specialist co-signed alignment certificate',
    evidenceCount: 2,
    evidenceItems: [{ id: 'EVD-H11', title: 'LASER_ALIGNMENT_TICKET.pdf', type: 'DOCUMENT', timestamp: '18:00' }],
    submittedBy: 'V. Verma',
    date: '2026-09-16 18:00',
    status: 'Verified History',
    isApproved: true,
  },
  {
    id: 'HIST-EVT-12',
    source: 'DPR_PDF',
    rawFieldStatement: 'Line 24 hydrostatic test section manifold rigging and blind flange pre-installation check.',
    extractedQuantity: 1,
    unit: 'manifold',
    area: 'Unit A - Test Manifold',
    line: 'Line 24-XX',
    discipline: 'Piping',
    workType: 'Pre-check',
    shiftTime: '09:00 - 13:00',
    candidateActivityId: 'PIP-24-003',
    candidateActivityName: 'Hydrostatic Test Section Line 24-XX (150 bar)',
    candidateWbs: '1.1.3.2.3',
    confidence: 100,
    matchReason: 'Pre-commissioning test manifold approved for filling',
    evidenceCount: 1,
    evidenceItems: [{ id: 'EVD-H12', title: 'HYDROTEST_MANIFOLD_CHECKLIST.pdf', type: 'DOCUMENT', timestamp: '13:00' }],
    submittedBy: 'Debajit Borah',
    date: '2026-09-17 13:00',
    status: 'Verified History' as const,
    isApproved: true,
  },
];

const HISTORICAL_VERIFIED_MILESTONE_EVENTS: ReviewEvent[] = HISTORICAL_RAW_EVENTS.map((item) => ({
  ...item,
  alternativeCandidates: [],
  signals: [],
  rulesEvaluated: [{ name: 'Historical Milestone Certification', status: 'PASSED' as const, details: 'Verified on P6 master ledger' }],
}));

// Helper: Determine whether an event can be accepted into the schedule twin
export function getEventAcceptanceStatus(evt: ReviewEvent): { canAccept: boolean; reason: string } {
  if (!evt.candidateActivityId) {
    return { canAccept: false, reason: 'Cannot accept without assigned schedule activity candidate.' };
  }
  if (evt.status === 'Duplicates') {
    return { canAccept: false, reason: 'Cannot accept: Event suppressed as duplicate of EVT-2026-001 by deduplication rules. Reject or ignore to prevent double counting.' };
  }
  if (evt.status === 'Conflicts') {
    return { canAccept: false, reason: 'Cannot accept: Blocked by open predecessor dependencies or material stoppages. Resolve conflicts or re-assign first.' };
  }
  if (evt.status === 'Unmatched' || evt.confidence < 70) {
    return { canAccept: false, reason: 'Cannot accept: Match confidence is below the minimum verification threshold (70%). Reassign match before committing.' };
  }
  return { canAccept: true, reason: 'Verify match and commit to Schedule Twin' };
}

const ALL_INITIAL_EVENTS: ReviewEvent[] = [
  ...INITIAL_REVIEW_EVENTS,
  ...HISTORICAL_VERIFIED_MILESTONE_EVENTS,
];

export default function ReviewQueuePage() {
  const { activeProject, openActivityDrawer, openWhyExplanation } = useApp();
  const { addToast } = useToast();

  const [events, setEvents] = useState<ReviewEvent[]>(ALL_INITIAL_EVENTS);
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

  // High-Throughput Batch Operations State
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // In-place Evidence Preview Modal State
  const [previewEvidence, setPreviewEvidence] = useState<{
    item: { id: string; title: string; type: 'PHOTO' | 'DOCUMENT' | 'INSPECTION_NOTE'; timestamp: string };
    event: ReviewEvent;
  } | null>(null);

  // View Mode: 'hybrid' (Compact Review-Card/Table Hybrid) | 'cards' (Expanded MatchCards)
  const [viewMode, setViewMode] = useState<'hybrid' | 'cards'>('hybrid');

  // Strict Rule: Active Review Queue ONLY contains unverified items requiring human action!
  const pendingActionEvents = useMemo(() => {
    return events.filter((e) => !e.isApproved && !e.isRejected);
  }, [events]);

  const verifiedHistoryEvents = useMemo(() => {
    return events.filter((e) => e.isApproved || e.isRejected);
  }, [events]);

  // Dynamic status donut chart slices connecting active review backlog to verified history
  const reviewDonutSlices = useMemo(() => [
    {
      id: 'verified',
      label: 'Verified Milestone Ledger',
      count: verifiedHistoryEvents.length,
      color: '#176B53',
      glyph: '✓',
      description: 'Signed off and committed to Schedule Twin master ledger',
    },
    {
      id: 'high-conf',
      label: 'High Confidence (Ready)',
      count: pendingActionEvents.filter((e) => e.status === 'High Confidence').length,
      color: '#0F6B68',
      glyph: '●',
      description: 'Direct candidate match (≥90%); ready for 1-click verification',
    },
    {
      id: 'manager-rev',
      label: 'Manager Review Required',
      count: pendingActionEvents.filter((e) => e.status === 'Manager Review').length,
      color: '#3D73B5',
      glyph: '◐',
      description: 'Intermediate confidence band (70–89%); requires planner check',
    },
    {
      id: 'blocked',
      label: 'Blocked / Conflicts',
      count: pendingActionEvents.filter((e) => e.status === 'Conflicts').length,
      color: '#A24335',
      glyph: '▲',
      description: 'Dependency constraint failure or weather stoppage impediment',
    },
    {
      id: 'duplicates',
      label: 'Duplicates (Suppressed)',
      count: pendingActionEvents.filter((e) => e.status === 'Duplicates').length,
      color: '#845006',
      glyph: '✕',
      description: 'Suppressed duplicate signatures to prevent double counting',
    },
    {
      id: 'unmatched',
      label: 'Unmatched / Stale Scope',
      count: pendingActionEvents.filter((e) => e.status === 'Unmatched' || e.status === 'Stale').length,
      color: '#526779',
      glyph: '?',
      description: 'Ambiguous field statement or expired 72-hour reporting SLA',
    },
  ], [pendingActionEvents, verifiedHistoryEvents]);

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
  const handleSwitchActivity = (actId: string, targetEvent?: ReviewEvent) => {
    const current = targetEvent || selectedEvent;
    if (!current) return;
    const target = MOCK_ACTIVITIES.find((a) => a.id === actId);
    if (!target) return;

    const updated: ReviewEvent = {
      ...current,
      candidateActivityId: target.id,
      candidateActivityName: target.name,
      candidateWbs: target.wbs,
      confidence: 90,
      matchReason: `Manually re-assigned to ${target.id} by Reviewer`,
      status: 'Manager Review',
    };

    setEvents((prev) => prev.map((e) => (e.id === current.id ? updated : e)));
    if (selectedEvent && selectedEvent.id === current.id) {
      setSelectedEvent(updated);
    }
    setIsActivityPickerOpen(false);

    addToast({
      type: 'info',
      title: 'Activity Re-Assigned',
      description: `Assigned candidate ${target.id}: ${target.name}`,
    });
  };

  // 3B. HIGH-THROUGHPUT OPERATIONAL ACTIONS (Accept Single & Batch)
  const handleAcceptSingle = (evt: ReviewEvent) => {
    const acceptance = getEventAcceptanceStatus(evt);
    if (!acceptance.canAccept) {
      addToast({
        type: 'warning',
        title: 'Action Blocked',
        description: acceptance.reason,
      });
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === evt.id
          ? { ...e, isApproved: true }
          : e
      )
    );
    setSelectedItemIds((prev) => prev.filter((id) => id !== evt.id));

    addToast({
      type: 'success',
      title: 'Match Accepted & Committed to Twin',
      description: `Verified ${evt.id} linked to ${evt.candidateActivityId}. Removed from active Review Queue.`,
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedItemIds.length === filteredEvents.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(filteredEvents.map((e) => e.id));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBatchAccept = (idsToAccept?: string[]) => {
    const rawIds = idsToAccept || selectedItemIds;
    if (rawIds.length === 0) return;

    // Filter strictly to acceptable events
    const acceptableEvents = events.filter(
      (e) => rawIds.includes(e.id) && getEventAcceptanceStatus(e).canAccept
    );
    const targetIds = acceptableEvents.map((e) => e.id);

    if (targetIds.length === 0) {
      addToast({
        type: 'warning',
        title: 'Batch Accept Blocked',
        description: 'Selected items are blocked, duplicates, or unmatched and cannot be automatically committed.',
      });
      return;
    }

    if (targetIds.length < rawIds.length) {
      addToast({
        type: 'info',
        title: 'Partial Batch Commitment',
        description: `Committed ${targetIds.length} eligible items. ${rawIds.length - targetIds.length} blocked/duplicate item(s) were excluded.`,
      });
    }

    setEvents((prev) =>
      prev.map((e) =>
        targetIds.includes(e.id) ? { ...e, isApproved: true } : e
      )
    );

    setSelectedItemIds((prev) => prev.filter((id) => !targetIds.includes(id)));

    addToast({
      type: 'success',
      title: `Batch Verified: ${targetIds.length} Events Committed`,
      description: `Committed ${targetIds.length} verified events to Schedule Twin. Removed from active Review Queue.`,
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
    <StateWrapper
      loadingMessage="Loading review queue..."
      emptyTitle="No review items found in this view"
      emptyDescription="Candidate execution events pending engineer verification or manual rematch will appear here. Submit daily field reports or adjust filters to review unlinked records."
    >
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbs} />

        {/* HEADER */}
        <div className="bg-white border border-[#D8E2EA] border-l-4 border-l-[#0F6B68] rounded-lg p-4 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#D8E2EA]/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-2 px-3 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-[#0F6B68]/10 text-[#0F6B68]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Human-in-the-Loop Verification
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#EAF0F5] text-[#526779] border border-[#D8E2EA]">
                  Action Queue Only · Zero Silent Conversions
                </span>
              </div>
              <h1 className="text-[28px] sm:text-3xl font-bold text-[#142C3F] tracking-tight">Review Queue</h1>
              <p className="text-sm text-[#526779] mt-1">
                <strong>{pendingActionEvents.length} Active Action Items</strong> requiring planner sign-off (3 urgent site actions) · <strong>4 Ingested NLP Candidates</strong> · <strong>{verifiedHistoryEvents.length} Verified Events</strong> in Master Schedule History.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded bg-[#F3F6FA] border border-[#D8E2EA] text-[#526779] font-mono">
                {activeProject?.code || 'OIL-DUL-01'} · Rev 3.2 (P6 XML)
              </span>
              <Link
                href="/matching"
                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#0F6B68] hover:text-[#135A72] hover:bg-[#EAF0F5] border border-transparent rounded-lg transition-colors"
              >
                <span>Matching Engine</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* GOVERNANCE POLICY BANNER */}
          <div className="pt-4">
            <div className="p-4 bg-[#EAF0F5] border border-[#D8E2EA] border-l-4 border-l-[#0F6B68] rounded-lg flex items-start gap-3 text-xs">
              <ShieldCheck className="w-5 h-5 text-[#0F6B68] shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="font-bold text-[#142C3F]">
                  Schedule Integrity Policy: Human Verification Required
                </h4>
                <p className="text-[#526779] leading-relaxed">
                  A high confidence suggestion (e.g. 94%) is <strong>never treated as verified</strong>. Suggested candidate matches are assistive only and require conscious human verification. Once approved, events are committed to Schedule Twin and cleared from this queue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CORE FLOW PIPELINE: Field Input -> Extraction -> Execution Event -> Candidate Match -> Confidence -> Human Verification -> Verified Update */}
        <CoreFlowBanner currentStage="HUMAN_VERIFICATION" />

        {/* Operational Review Backlog & Verification Status Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HorizontalBarChart variant="review-backlog" />
          <StatusDonutChart
            title="Review Queue Verification Breakdown"
            subtitle="Current disposition of field execution items across verified ledger and active review states"
            projectQuestion="Where are unverified execution items accumulating across review categories?"
            slices={reviewDonutSlices}
          />
        </div>

        {/* SUMMARY TABS */}
        <div className="bg-white border border-[#D8E2EA] rounded-lg overflow-hidden shadow-xs">
          <div className="flex border-b border-[#D8E2EA] bg-[#F3F6FA] overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              const isHistory = tab === 'Verified History';

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors min-h-[48px] ${
                    isActive
                      ? 'border-[#0F6B68] text-[#0F6B68] bg-white'
                      : 'border-transparent text-[#526779] hover:text-[#142C3F] hover:bg-[#EAF0F5]'
                  }`}
                >
                  {isHistory && <Archive className="w-3.5 h-3.5 text-[#7B8798]" />}
                  <span>{tab}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-[#EAF0F5] text-[#0F6B68]'
                        : isHistory
                        ? 'bg-[#EAF0F5] text-[#7B8798]'
                        : count > 0
                        ? 'bg-[#D8E2EA] text-[#142C3F]'
                        : 'bg-[#EAF0F5] text-[#7B8798]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SEARCH & ACTIVE QUEUE NOTICE */}
          <div className="p-4 border-b border-[#D8E2EA]/60 flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#7B8798] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by event ID, statement, candidate, or submitter..."
                className="w-full pl-9 pr-3 py-2 bg-[#FAFAFA] focus:bg-white border border-[#D8E2EA] focus:border-[#0F6B68] rounded-lg text-xs outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7B8798] hover:text-[#142C3F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-[11px] text-[#526779]">
              {activeTab === 'Verified History' ? (
                <span>Showing <strong>{filteredEvents.length}</strong> previously verified & committed events (Archived)</span>
              ) : (
                <span>Showing <strong>{filteredEvents.length}</strong> items requiring human decision</span>
              )}
            </div>
          </div>

          {/* OPERATIONAL BATCH & TRIAGE TOOLBAR */}
          <div className="p-3 bg-[#F3F6FA] border-b border-[#D8E2EA] flex items-center justify-between gap-3 text-xs flex-wrap">
            <div className="flex items-center gap-3">
              {activeTab !== 'Verified History' && filteredEvents.length > 0 && (
                <label className="flex items-center gap-2 font-semibold text-[#142C3F] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedItemIds.length > 0 && selectedItemIds.length === filteredEvents.length}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-[#D8E2EA] text-[#0F6B68] focus:ring-[#0F6B68] cursor-pointer"
                  />
                  <span>Select All Visible ({filteredEvents.length})</span>
                </label>
              )}

              {selectedItemIds.length > 0 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBatchAccept()}
                    className="min-h-[40px] px-3.5 py-2 bg-[#0F6B68] hover:bg-[#135A72] border border-[#0F6B68] text-white font-bold rounded shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Accept Selected ({selectedItemIds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedItemIds([])}
                    className="min-h-[40px] px-3.5 py-2 bg-white text-[#142C3F] hover:bg-[#F3F6FA] border border-[#D8E2EA] rounded font-medium transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              ) : (
                activeTab !== 'Verified History' && tabCounts['High Confidence'] > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const highConfIds = pendingActionEvents
                        .filter((e) => e.status === 'High Confidence')
                        .map((e) => e.id);
                      handleBatchAccept(highConfIds);
                    }}
                    className="min-h-[40px] px-3.5 py-2 bg-white hover:bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA] font-bold rounded inline-flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
                    title="Fast-track all 90%+ confidence items to Schedule Twin"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept All High Confidence ({tabCounts['High Confidence']})</span>
                  </button>
                )
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#526779] font-mono">
                Queue View:
              </span>
              <div className="inline-flex rounded-md border border-[#D8E2EA] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('hybrid')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    viewMode === 'hybrid'
                      ? 'bg-[#0F6B68] text-white shadow-xs'
                      : 'text-[#526779] hover:text-[#142C3F]'
                  }`}
                >
                  Hybrid Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-[#0F6B68] text-white shadow-xs'
                      : 'text-[#526779] hover:text-[#142C3F]'
                  }`}
                >
                  Expanded Cards
                </button>
              </div>
            </div>
          </div>

          {/* MAIN REVIEW QUEUE EVENT ITEMS */}
          <div className="p-4 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="p-12 text-center text-[#526779] bg-[#FAFAFA] rounded-lg border border-dashed border-[#D8E2EA]">
                <CheckCircle2 className="w-10 h-10 text-[#2E7D5B] mx-auto mb-3" />
                <h3 className="font-bold text-lg text-[#142C3F]">
                  {activeTab === 'Verified History'
                    ? 'No verified events in history archive yet'
                    : 'No pending review items'}
                </h3>
                <p className="text-sm text-[#526779] mt-1 max-w-md mx-auto">
                  {activeTab === 'Verified History'
                    ? 'Approve candidate matches in the queue to commit them to the Schedule Twin and archive them here.'
                    : 'All incoming execution events have been matched and verified, or none match your active search query.'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  {activeTab === 'Verified History' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('All Action Items')}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0F6B68] hover:bg-[#135A72] rounded-md transition-colors cursor-pointer"
                    >
                      View Active Review Queue
                    </button>
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="px-4 py-2 text-xs font-semibold text-[#0F6B68] bg-white border border-[#D8E2EA] hover:border-[#0F6B68] rounded-md transition-colors cursor-pointer"
                    >
                      Clear Search Query
                    </button>
                  ) : (
                    <Link
                      href="/execution"
                      className="px-4 py-2 text-xs font-semibold text-[#0F6B68] bg-white border border-[#D8E2EA] hover:border-[#0F6B68] rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Open Execution Intel Feed</span>
                    </Link>
                  )}
                </div>
              </div>
            ) : viewMode === 'cards' ? (
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white border border-[#D8E2EA] rounded-lg overflow-hidden shadow-xs hover:border-[#D8E2EA] transition-colors"
                >
                  {/* Event Top Meta Bar */}
                  <div className="px-4 py-2 bg-[#F3F6FA] border-b border-[#D8E2EA] flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[#0F6B68]">{evt.id}</span>
                      <span className="text-[#7B8798]">•</span>
                      <span className="font-semibold text-[#142C3F]">{evt.submittedBy}</span>
                      <span className="text-[#7B8798]">•</span>
                      <span className="text-[#526779] font-mono text-[11px]">{evt.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-[#D8E2EA] text-[#526779]">
                        {evt.source}
                      </span>
                      {evt.evidenceCount > 0 && (
                        <button
                          type="button"
                          onClick={() => evt.evidenceItems[0] && setPreviewEvidence({ item: evt.evidenceItems[0], event: evt })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9] hover:bg-[#DDF0E5] transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                          <span>{evt.evidenceCount} Proofs</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenReview(evt)}
                        className="text-xs font-bold text-[#0F6B68] hover:underline inline-flex items-center gap-1 ml-2"
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
                      evt.status === 'High Confidence' || evt.confidence >= 90
                        ? 'High Confidence'
                        : evt.confidence >= 70
                        ? 'Review Required'
                        : 'Unmatched'
                    }
                    verificationStatus={evt.isApproved ? 'Verified' : evt.isRejected ? 'Blocked' : 'Pending Review'}
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
                      handleSwitchActivity(altId, evt);
                    }}
                  />
                </div>
              ))
            ) : (
              /* OPERATIONAL REVIEW-CARD / TABLE HYBRID */
              filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  className={`bg-white border rounded-lg overflow-hidden transition-all shadow-xs ${
                    selectedItemIds.includes(evt.id)
                      ? 'border-[#0F6B68] ring-1 ring-[#0F6B68]/30'
                      : 'border-[#D8E2EA] hover:border-[#D8E2EA]'
                  }`}
                >
                  {/* Event Top Meta Bar */}
                  <div className="px-4 py-2 bg-[#F3F6FA] border-b border-[#D8E2EA] flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeTab !== 'Verified History' && (
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(evt.id)}
                          onChange={() => handleToggleSelectItem(evt.id)}
                          className="w-4 h-4 rounded border-[#D8E2EA] text-[#0F6B68] focus:ring-[#0F6B68] cursor-pointer"
                          title={`Select ${evt.id}`}
                        />
                      )}
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]">
                        {evt.id}
                      </span>
                      <span className="font-semibold text-[#142C3F]">{evt.submittedBy}</span>
                      <span className="text-[#7B8798]">•</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white border border-[#D8E2EA] text-[#526779]">
                        {evt.source}
                      </span>
                      <span className="text-[#7B8798]">•</span>
                      <span className="text-[#526779] font-mono text-[11px]">{evt.date}</span>
                      <span className="text-[#7B8798] hidden sm:inline">•</span>
                      <span className="text-[#526779] font-mono text-[11px] hidden sm:inline">Shift: {evt.shiftTime}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Standardized Confidence Badge (Rule: Never show percentage alone) */}
                      <ConfidenceBadge score={evt.confidence} size="sm" />

                      {/* Status Badge */}
                      <StatusBadge
                        status={
                          evt.isApproved
                            ? 'Verified'
                            : evt.isRejected
                            ? 'Blocked'
                            : evt.status === 'Conflicts' || evt.status === 'Duplicates'
                            ? 'Blocked'
                            : evt.status === 'Stale'
                            ? 'At Risk'
                            : evt.status === 'Unmatched'
                            ? 'Unmatched'
                            : 'Pending Review'
                        }
                        size="xs"
                      />

                      {/* Full Inspection Drawer trigger */}
                      <button
                        type="button"
                        onClick={() => handleOpenReview(evt)}
                        className="text-xs font-bold text-[#0F6B68] hover:underline inline-flex items-center gap-1 ml-1 cursor-pointer"
                        title="Open full 3-column inspection drawer"
                      >
                        <span>Drawer</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* 4-Column Hybrid Table/Card Body answering the 6 questions */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#D8E2EA] text-xs">
                    {/* COL 1: 1. WHAT HAPPENED? & WHAT EVIDENCE EXISTS? (5 cols) */}
                    <div className="lg:col-span-5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#526779] flex items-center gap-1">
                          <Info className="w-3 h-3 text-[#0F6B68]" />
                          <span>1. What Happened?</span>
                        </span>
                        <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-[#EAF0F5] text-[#0F6B68] border border-[#D8E2EA]">
                          {evt.extractedQuantity} {evt.unit}
                        </span>
                      </div>

                      {/* Raw Field Observation Statement */}
                      <blockquote className="text-xs text-[#142C3F] bg-[#F3F6FA] p-3 rounded border border-[#E5E9EF] leading-relaxed italic">
                        "{evt.rawFieldStatement}"
                      </blockquote>

                      {/* Extracted Scope Attributes */}
                      <div className="flex flex-wrap gap-2 items-center text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#0F6B68] font-semibold">
                          {evt.discipline}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#526779]">
                          {evt.area}
                        </span>
                        {evt.line && (
                          <span className="px-2 py-0.5 rounded bg-[#EAF0F5] text-[#526779] font-mono">
                            {evt.line}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-white border border-[#D8E2EA] text-[#526779] font-medium">
                          Type: {evt.workType}
                        </span>
                      </div>

                      {/* What Evidence Exists? */}
                      <div className="pt-2 border-t border-[#D8E2EA]/60 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#526779]">
                          <span>What Evidence Exists?</span>
                          <span>{evt.evidenceItems.length} File{evt.evidenceItems.length === 1 ? '' : 's'}</span>
                        </div>

                        {evt.evidenceItems.length === 0 ? (
                          <div className="p-2 bg-[#FFF1D3] border border-[#F0D4A6] rounded text-[#A66D24] text-[11px] flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>No physical evidence attached to this field log</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {evt.evidenceItems.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setPreviewEvidence({ item, event: evt })}
                                className="inline-flex items-center gap-2 px-2 py-1 bg-white hover:bg-[#EAF0F5] border border-[#D8E2EA] hover:border-[#0F6B68] rounded text-[11px] font-medium text-[#142C3F] transition-colors group cursor-pointer"
                                title={`Click to view ${item.title} in-place preview`}
                              >
                                {item.type === 'PHOTO' ? (
                                  <Camera className="w-3.5 h-3.5 text-[#0284C7]" />
                                ) : (
                                  <FileText className="w-3.5 h-3.5 text-[#0F6B68]" />
                                )}
                                <span className="font-mono text-[10px] truncate max-w-[140px] group-hover:text-[#0F6B68]">
                                  {item.title}
                                </span>
                                <span className="text-[9px] text-[#7B8798] font-mono">({item.timestamp})</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COL 2: 2. SUGGESTED ACTIVITY & ALTERNATIVE MATCHES (3 cols) */}
                    <div className="lg:col-span-3 p-4 space-y-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#526779]">
                        2. Suggested Activity
                      </div>

                      {evt.candidateActivityId ? (
                        <div className="p-3 bg-white border border-[#D8E2EA] rounded space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-xs text-[#0F6B68]">
                              {evt.candidateActivityId}
                            </span>
                            {evt.candidateWbs && (
                              <span className="text-[10px] font-mono text-[#7B8798] bg-[#EAF0F5] px-1.5 py-0.5 rounded">
                                WBS {evt.candidateWbs}
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-xs text-[#142C3F] leading-snug">
                            {evt.candidateActivityName}
                          </div>
                          <div className="text-[10px] text-[#526779]">
                            Discipline: <span className="font-medium">{evt.discipline}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-[#FCE8E4] border border-[#E4B0AA] rounded text-[#A24335] text-xs font-semibold">
                          No schedule activity matched (Unmatched)
                        </div>
                      )}

                      {/* Alternative Matches */}
                      <div className="pt-2 border-t border-[#D8E2EA]/60 space-y-2">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#526779]">
                          Alternative Matches ({evt.alternativeCandidates.length})
                        </div>

                        {evt.alternativeCandidates.length === 0 ? (
                          <div className="p-2 bg-[#F3F6FA] border border-[#D8E2EA] rounded text-[11px] text-[#526779]">
                            <span className="font-semibold text-[#142C3F] block">No alternative candidates</span>
                            <span className="text-[10px] text-[#526779]">No other activities in the baseline matched this event.</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {evt.alternativeCandidates.map((alt) => (
                              <div
                                key={alt.activityId}
                                className="p-2 bg-[#F3F6FA] border border-[#D8E2EA] rounded text-[11px] flex items-center justify-between gap-2 hover:bg-[#EAF0F5] transition-colors"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-[#142C3F]">{alt.activityId}</span>
                                    <span className="text-[10px] font-mono font-bold text-[#845006]">{alt.confidence}%</span>
                                  </div>
                                  <div className="text-[10px] text-[#526779] truncate">
                                    {alt.reasons[0] || alt.activityName}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSwitchActivity(alt.activityId, evt);
                                  }}
                                  className="px-2 py-1 text-[10px] font-bold text-[#0F6B68] hover:text-white hover:bg-[#0F6B68] border border-[#D8E2EA] rounded whitespace-nowrap transition-colors cursor-pointer"
                                  title={`Switch match to ${alt.activityId}`}
                                >
                                  Switch
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COL 3: 3. HOW CONFIDENT IS THE MATCH? & WHY WAS IT SUGGESTED? (2 cols) */}
                    <div className="lg:col-span-2 p-4 space-y-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#526779]">
                        3. Confidence & Why?
                      </div>

                      <div className="p-2 bg-[#F3F6FA] border border-[#D8E2EA] rounded space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-[#526779]">Confidence:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#142C3F]">{evt.confidence}%</span>
                            <WhyButton
                              onClick={() => openWhyExplanation(`confidence:${evt.id}`)}
                              title={`Why is match confidence ${evt.confidence}%?`}
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold text-[#142C3F]">
                          {evt.confidence >= 90
                            ? 'High Confidence'
                            : evt.confidence >= 70
                            ? 'Review Required'
                            : 'Unmatched'}
                        </div>
                      </div>

                      {/* Deterministic Signals Checklist */}
                      <div className="space-y-1 text-[11px] pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#526779]">
                            Why was it suggested?
                          </span>
                          <WhyButton
                            onClick={() => openWhyExplanation(`confidence:${evt.id}`)}
                            title="Open detailed factors"
                            variant="subtle"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-[#2E7D5B] font-medium">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Activity match</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#2E7D5B] font-medium">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Area match</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#2E7D5B] font-medium">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Discipline match</span>
                        </div>
                        <div className={`flex items-center gap-2 font-medium ${evt.confidence >= 70 ? 'text-[#2E7D5B]' : 'text-[#845006]'}`}>
                          {evt.confidence >= 70 ? (
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          )}
                          <span>Context match</span>
                        </div>
                      </div>

                      {/* Match Reason Text */}
                      <div className="text-[10px] text-[#526779] bg-white p-2 rounded border border-[#E5E9EF] leading-relaxed">
                        <strong className="text-[#142C3F] block mb-0.5">Match Reason:</strong>
                        {evt.matchReason}
                      </div>
                    </div>

                    {/* COL 4: 4. WHAT SHOULD I DO? (PRIMARY ACTIONS) (2 cols) */}
                    <div className="lg:col-span-2 p-4 flex flex-col justify-between bg-[#FAFAFB] space-y-3">
                      <div>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#526779] mb-2">
                          4. What Should I Do?
                        </div>

                        {activeTab === 'Verified History' ? (
                          <div className="p-3 bg-[#E4F4EC] border border-[#B8DCC9] rounded text-center text-xs">
                            <CheckCircle2 className="w-5 h-5 text-[#2E7D5B] mx-auto mb-1" />
                            <div className="font-bold text-[#2E7D5B]">Decision Committed</div>
                            <div className="text-[10px] text-[#526779] mt-0.5">
                              {evt.isApproved ? 'Approved & Linked to Twin' : 'Rejected by Reviewer'}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Primary Action 1: Accept */}
                            {(() => {
                              const acceptance = getEventAcceptanceStatus(evt);
                              return (
                                <button
                                  type="button"
                                  onClick={() => handleAcceptSingle(evt)}
                                  disabled={!acceptance.canAccept}
                                  title={acceptance.reason}
                                  className="w-full min-h-[44px] py-2.5 px-4 bg-[#2E7D5B] hover:bg-[#25684C] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-xs rounded shadow-xs inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                  <Check className="w-4 h-4 stroke-[2.5]" />
                                  <span>
                                    {acceptance.canAccept
                                      ? 'Accept'
                                      : evt.status === 'Duplicates'
                                      ? 'Duplicate (Blocked)'
                                      : evt.status === 'Conflicts'
                                      ? 'Blocked by Rule'
                                      : evt.status === 'Unmatched'
                                      ? 'Unmatched (Blocked)'
                                      : 'Low Confidence'}
                                  </span>
                                </button>
                              );
                            })()}

                            {/* Primary Action 2: Change Match */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setSelectedAlternativeId(evt.candidateActivityId || '');
                                setIsActivityPickerOpen(true);
                              }}
                              className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-[#EAF0F5] text-[#0F6B68] hover:text-[#135A72] border border-[#D8E2EA] font-semibold text-xs rounded inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Change Match</span>
                            </button>

                            {/* Primary Action 3: Reject */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvent(evt);
                                setIsRejectModalOpen(true);
                              }}
                              className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-[#FCE8E4] text-[#A24335] hover:text-[#9E3B31] border border-[#E4B0AA] font-semibold text-xs rounded inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 stroke-[2]" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Deep Inspection Drawer trigger */}
                      <div className="pt-2 border-t border-[#D8E2EA]/60 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(evt)}
                          className="min-h-[40px] px-3 py-2 text-xs font-semibold text-[#0F6B68] hover:underline inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>Full Inspection Drawer</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
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
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleMarkUnmatched(selectedEvent)}
                    className="min-h-[44px] px-3.5 py-2 font-semibold text-[#526779] hover:text-[#142C3F] bg-white border border-[#D8E2EA] rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                  >
                    Mark Unmatched
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClarificationQueryText('');
                      setIsClarificationModalOpen(true);
                    }}
                    className="min-h-[44px] px-3.5 py-2 font-semibold text-[#8C5311] hover:bg-[#FFF1D3] bg-white border border-[#F0D4A6] rounded-lg transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
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
                    className="min-h-[44px] px-3.5 py-2 font-semibold text-[#A24335] hover:bg-[#FCE8E4] bg-white border border-[#E4B0AA] rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                  >
                    Reject Match
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="min-h-[44px] px-4 py-2 font-semibold text-[#526779] hover:text-[#142C3F] bg-white border border-[#D8E2EA] rounded-lg cursor-pointer inline-flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  {(() => {
                    const acceptance = getEventAcceptanceStatus(selectedEvent);
                    return (
                      <button
                        type="button"
                        onClick={() => handleInitiateApprove(selectedEvent)}
                        disabled={!acceptance.canAccept}
                        title={acceptance.reason}
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] border border-[#0F6B68] disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:opacity-75 disabled:cursor-not-allowed rounded-lg shadow-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{acceptance.canAccept ? 'Approve Match & Commit' : 'Approval Blocked'}</span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            )
          }
        >
          {selectedEvent && (
            <div className="space-y-6 text-xs text-[#142C3F]">
              {/* MatchCard inside drawer */}
              <MatchCard
                activityId={selectedEvent.candidateActivityId}
                activityName={selectedEvent.candidateActivityName}
                confidence={selectedEvent.confidence}
                statusText={
                  selectedEvent.status === 'High Confidence' || selectedEvent.confidence >= 90
                    ? 'High Confidence'
                    : selectedEvent.confidence >= 70
                    ? 'Review Required'
                    : 'Unmatched'
                }
                verificationStatus={selectedEvent.isApproved ? 'Verified' : selectedEvent.isRejected ? 'Blocked' : 'Pending Review'}
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
                <div className="p-4 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#526779]">
                      Extracted Parameters (Editable)
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingCenter(!isEditingCenter)}
                      className="text-xs font-semibold text-[#0F6B68] hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingCenter ? 'Discard Edits' : 'Edit Fields'}</span>
                    </button>
                  </div>

                  {isEditingCenter ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-bold text-[#526779] block mb-1">Work Type</label>
                        <input
                          type="text"
                          value={editWorkType}
                          onChange={(e) => setEditWorkType(e.target.value)}
                          className="w-full p-2 bg-white border border-[#D8E2EA] rounded text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-[#526779] block mb-1">Quantity</label>
                          <input
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(Number(e.target.value))}
                            className="w-full p-2 bg-white border border-[#D8E2EA] rounded text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-[#526779] block mb-1">Unit</label>
                          <input
                            type="text"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            className="w-full p-2 bg-white border border-[#D8E2EA] rounded text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-[#526779] block mb-1">Area / Location</label>
                        <input
                          type="text"
                          value={editArea}
                          onChange={(e) => setEditArea(e.target.value)}
                          className="w-full p-2 bg-white border border-[#D8E2EA] rounded text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSaveCenterEdits}
                        className="w-full py-2 bg-[#0F6B68] hover:bg-[#135A72] text-white font-bold rounded shadow-xs"
                      >
                        Save Parameter Corrections
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex justify-between py-1 border-b border-[#D8E2EA]/60">
                        <span className="text-[#7B8798]">Work Type:</span>
                        <strong className="text-[#142C3F]">{selectedEvent.workType}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#D8E2EA]/60">
                        <span className="text-[#7B8798]">Quantity / Unit:</span>
                        <strong className="text-[#142C3F] font-mono">{selectedEvent.extractedQuantity} {selectedEvent.unit}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#D8E2EA]/60">
                        <span className="text-[#7B8798]">Area:</span>
                        <strong className="text-[#142C3F]">{selectedEvent.area}</strong>
                      </div>
                      {selectedEvent.line && (
                        <div className="flex justify-between py-1 border-b border-[#D8E2EA]/60">
                          <span className="text-[#7B8798]">Line Code:</span>
                          <strong className="text-[#142C3F] font-mono">{selectedEvent.line}</strong>
                        </div>
                      )}
                      <div className="flex justify-between py-1">
                        <span className="text-[#7B8798]">Shift Time:</span>
                        <strong className="text-[#142C3F] font-mono">{selectedEvent.shiftTime}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column 2: Physical Evidence & Rules Checked */}
                <div className="p-4 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg space-y-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-[#526779] block">
                    Physical Evidence & QC Proofs ({selectedEvent.evidenceItems.length})
                  </span>

                  {selectedEvent.evidenceItems.length === 0 ? (
                    <div className="p-3 bg-white border border-[#D8E2EA] rounded-lg text-center space-y-0.5">
                      <p className="font-semibold text-xs text-[#142C3F]">No physical evidence attached</p>
                      <p className="text-[11px] text-[#526779]">No photographic or document proofs were submitted with this field log.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedEvent.evidenceItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-white border border-[#D8E2EA] rounded-lg flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            {item.type === 'PHOTO' ? (
                              <Camera className="w-4 h-4 text-[#0284C7]" />
                            ) : (
                              <FileText className="w-4 h-4 text-[#0F6B68]" />
                            )}
                            <div>
                              <span className="font-semibold text-[#142C3F] block truncate max-w-[200px]">
                                {item.title}
                              </span>
                              <span className="text-[10px] text-[#7B8798] font-mono">
                                Time: {item.timestamp}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#E4F4EC] text-[#2E7D5B] border border-[#B8DCC9]">
                            Attached
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#D8E2EA]/60 space-y-2">
                    <span className="text-[10px] uppercase font-semibold text-[#526779] block">
                      Deterministic Rules Verified:
                    </span>
                    {selectedEvent.rulesEvaluated.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="mt-0.5">
                          {rule.status === 'PASSED' ? (
                            <Check className="w-3.5 h-3.5 text-[#2E7D5B]" />
                          ) : rule.status === 'WARNING' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#845006]" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-[#A24335]" />
                          )}
                        </span>
                        <span className="text-[#526779]">
                          <strong className="text-[#142C3F]">{rule.name}:</strong> {rule.details}
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
                className="px-4 py-2 font-semibold text-[#526779] hover:text-[#142C3F] rounded border border-[#D8E2EA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 font-bold text-white bg-[#A24335] hover:bg-[#9E3B31] rounded shadow-xs"
              >
                Confirm Rejection
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="font-bold text-[#142C3F] block">Rejection Justification</label>
            <textarea
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="State reason (e.g., spool scope corresponds to contractor punchlist rather than main header)..."
              rows={3}
              className="w-full p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg outline-none focus:border-[#0F6B68]"
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
                className="px-4 py-2 font-semibold text-[#526779] hover:text-[#142C3F] rounded border border-[#D8E2EA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSwitchActivity(selectedAlternativeId)}
                disabled={!selectedAlternativeId}
                className="px-4 py-2 font-bold text-white bg-[#0F6B68] hover:bg-[#135A72] rounded shadow-xs disabled:opacity-50"
              >
                Assign Selected Activity
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-[#142C3F] block mb-1">Target Schedule Activity (WBS)</label>
              <select
                value={selectedAlternativeId}
                onChange={(e) => setSelectedAlternativeId(e.target.value)}
                className="w-full p-3 bg-white border border-[#D8E2EA] rounded-lg outline-none focus:border-[#0F6B68]"
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
                className="px-4 py-2 font-semibold text-[#526779] hover:text-[#142C3F] rounded border border-[#D8E2EA]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendClarification}
                className="px-4 py-2 font-bold text-white bg-[#845006] hover:bg-[#C27A28] rounded shadow-xs inline-flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Clarification</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <label className="font-bold text-[#142C3F] block">Inquiry Query for Site Engineer</label>
            <textarea
              value={clarificationQueryText}
              onChange={(e) => setClarificationQueryText(e.target.value)}
              placeholder="e.g. Please clarify if the 12 spools completed include isometric sheet 24-B tie-ins..."
              rows={3}
              className="w-full p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg outline-none focus:border-[#0F6B68]"
            />
          </div>
        </Modal>

        {/* 5. IN-PLACE EVIDENCE PREVIEW MODAL */}
        <Modal
          isOpen={!!previewEvidence}
          onClose={() => setPreviewEvidence(null)}
          title={`Evidence Verification: ${previewEvidence?.item.title || ''}`}
          subtitle={`Attached to ${previewEvidence?.event.id || ''} · ${previewEvidence?.event.discipline} Discipline`}
          footer={
            <div className="flex items-center justify-between w-full text-xs">
              <div className="flex items-center gap-2 text-[11px] text-[#526779]">
                <span>Verified Evidence · Timestamped &amp; Geotagged (OIL Duliajan)</span>
                <details className="inline-block">
                  <summary className="text-[10px] text-[#0F6B68] cursor-pointer hover:underline font-semibold">Technical Details</summary>
                  <span className="font-mono text-[10px] text-[#7B8798] ml-1">Ref: 7f8a3c...e901</span>
                </details>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEvidence(null)}
                className="px-4 py-2 font-semibold text-[#142C3F] bg-white border border-[#D8E2EA] hover:bg-[#F3F6FA] rounded shadow-xs cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>
          }
        >
          {previewEvidence && (
            <div className="space-y-4 text-xs">
              {/* Evidence Meta Card */}
              <div className="p-3 bg-[#F3F6FA] border border-[#D8E2EA] rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                <div>
                  <span className="text-[#7B8798] block">File Type</span>
                  <strong className="text-[#142C3F] font-mono">{previewEvidence.item.type}</strong>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Capture Timestamp</span>
                  <strong className="text-[#142C3F] font-mono">{previewEvidence.item.timestamp} IST</strong>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Submitter</span>
                  <strong className="text-[#142C3F] truncate block">{previewEvidence.event.submittedBy}</strong>
                </div>
                <div>
                  <span className="text-[#7B8798] block">Integrity Status</span>
                  <span className="text-[#2E7D5B] font-bold">✓ Tamper-proof Hash</span>
                </div>
              </div>

              {/* Simulated Visual Preview Box */}
              <div className="border border-[#D8E2EA] rounded-lg overflow-hidden bg-slate-900 text-slate-100 min-h-[220px] flex flex-col justify-between p-4">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{previewEvidence.item.title}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-teal-300 border border-slate-700">
                    Field Capture Device #04
                  </span>
                </div>

                {previewEvidence.item.type === 'PHOTO' ? (
                  <div className="my-6 text-center space-y-2">
                    <Camera className="w-12 h-12 text-teal-400 mx-auto opacity-80" />
                    <div className="font-mono text-sm text-slate-200">
                      Photographic Proof: {previewEvidence.event.area}
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Visual verification of {previewEvidence.event.extractedQuantity} {previewEvidence.event.unit} ({previewEvidence.event.workType}) at {previewEvidence.event.line || previewEvidence.event.area}.
                    </p>
                  </div>
                ) : (
                  <div className="my-6 text-center space-y-2">
                    <FileText className="w-12 h-12 text-sky-400 mx-auto opacity-80" />
                    <div className="font-mono text-sm text-slate-200">
                      Engineering Quality Record: {previewEvidence.item.title}
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Official inspection sheet logged by {previewEvidence.event.submittedBy}. Conforms to ISO 9001 quality audit requirements.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>GPS: 27°29'20.8"N 95°20'31.6"E (Duliajan Oilfield)</span>
                  <span>Verified Non-Staged</span>
                </div>
              </div>

              {/* Linked Event Statement */}
              <div className="p-3 bg-[#EAF0F5] border border-[#D8E2EA] rounded-lg">
                <div className="text-[10px] uppercase font-bold text-[#0F6B68] mb-1">
                  Referenced Field Report:
                </div>
                <p className="text-xs text-[#142C3F] italic">
                  "{previewEvidence.event.rawFieldStatement}"
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </StateWrapper>
  );
}
