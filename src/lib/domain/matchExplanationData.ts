/**
 * PLnEX Match Explanation Data Model & Resolution Engine
 * 
 * Strict deterministic explainability for AI/heuristic matching.
 * RULE: Do not show an unexplained AI percentage. Every score MUST be
 * directly decomposable into the 5 explicit scoring factors:
 *   1. Activity keywords
 *   2. Area / Line
 *   3. Discipline
 *   4. Context / Date
 *   5. Project / WBS
 */

import { DisciplineType, MatchConfidenceCategory } from '../../types';

export type ScoringFactorName =
  | 'Activity keywords'
  | 'Area / Line'
  | 'Discipline'
  | 'Context / Date'
  | 'Project / WBS';

export interface ScoringFactorItem {
  factor: ScoringFactorName;
  contribution: number; // Earned points (e.g. 20)
  maxContribution: number; // Max possible points (e.g. 20, 30, 25, 10, 15 => sum = 100)
  weightPercent: number; // Weight in model (e.g. 20%)
  reason: string; // Plain-English auditable deterministic justification
  status: 'FULL_MATCH' | 'PARTIAL_MATCH' | 'NO_MATCH' | 'PENALTY';
  extractedToken?: string; // What was found in the field submission
  targetBaselineToken?: string; // What was compared against in the master schedule
}

export interface AlternativeCandidateItem {
  activityId: string;
  activityName: string;
  wbs?: string;
  discipline?: DisciplineType | string;
  area?: string;
  confidence: number;
  matchCategory?: MatchConfidenceCategory;
  reasons: string[];
  rejectionOrRankingReason: string;
}

export interface EvidenceSourceInfo {
  id?: string;
  title: string;
  filename?: string;
  type: 'DPR' | 'Photo' | 'Document' | 'Spreadsheet' | 'Field Note' | 'Voice' | string;
  uploadedBy?: string;
  timestamp?: string;
  snippet?: string;
  url?: string;
}

export interface SuggestedActivityInfo {
  id: string;
  name: string;
  wbs: string;
  discipline: DisciplineType | string;
  area?: string;
  line?: string;
  plannedStart?: string;
  plannedFinish?: string;
  status?: string;
  plannedQuantity?: number;
  unit?: string;
}

export interface AlgorithmVersionInfo {
  name: string;
  version: string;
  rulepack: string;
  description: string;
  mode: 'Deterministic Heuristics & Multi-Signal NLP' | string;
}

export interface MatchExplanationModel {
  id: string;
  eventId?: string;
  suggestedActivity: SuggestedActivityInfo | null;
  confidence: number; // 0 - 100
  confidenceBracket: 'High' | 'Review Required' | 'Unmatched';
  matchStatus:
    | 'Auto-linked'
    | 'Manager Review Required'
    | 'Unmatched'
    | 'Planner Approved'
    | 'Rejected'
    | 'Conflict'
    | 'Duplicate'
    | 'Stale';
  scoringFactors: ScoringFactorItem[];
  alternativeCandidates: AlternativeCandidateItem[];
  evidenceSource: EvidenceSourceInfo;
  algorithmVersion: AlgorithmVersionInfo;
  generatedTimestamp: string;
  processingLatencyMs?: number;
  auditHash?: string;
  rawFieldStatement?: string;
}

// Global algorithm metadata definition
export const DEFAULT_ALGORITHM_METADATA: AlgorithmVersionInfo = {
  name: 'PLnEX Deterministic Multi-Signal Matcher',
  version: 'v2.4.2',
  rulepack: 'OIL-ASSAM-2026.09-REV4',
  description:
    'Deterministic heuristic scoring engine utilizing strict lexical entity recognition, ISO plant breakdown mapping, spatial coordinate validation, and Primavera P6 scheduled window checks. Zero hallucinated parameters.',
  mode: 'Deterministic Heuristics & Multi-Signal NLP',
};

// Standard baseline factor weights (Sum = 100)
export const STANDARD_FACTOR_WEIGHTS: Record<ScoringFactorName, number> = {
  'Activity keywords': 20,
  'Area / Line': 30,
  'Discipline': 25,
  'Context / Date': 10,
  'Project / WBS': 15,
};

/**
 * Calculates deterministic confidence score by strictly summing factor contributions.
 * This guarantees the user that 100% of the percentage is explained.
 */
export function calculateConfidenceFromFactors(factors: ScoringFactorItem[]): number {
  const sum = factors.reduce((acc, f) => acc + f.contribution, 0);
  return Math.max(0, Math.min(100, Math.round(sum)));
}

/**
 * Derives the standard confidence bracket from score:
 * 90-100 High
 * 70-89 Review Required
 * <70 Unmatched
 */
export function getConfidenceBracket(score: number): 'High' | 'Review Required' | 'Unmatched' {
  if (score >= 90) return 'High';
  if (score >= 70) return 'Review Required';
  return 'Unmatched';
}

/**
 * Realistic Pre-computed Scenarios for Construction Project Events
 */
export const MOCK_MATCH_EXPLANATIONS: Record<string, MatchExplanationModel> = {
  // Scenario 1: High Confidence Auto-linked (Spool Erection Line 24)
  'EVT-2026-001': {
    id: 'MTC-EVT-001',
    eventId: 'EVT-2026-001',
    rawFieldStatement:
      'Spool erection completed on Line 24. 12 spools erected today with crane support. Work started at 09:00 and finished at 16:30.',
    suggestedActivity: {
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      wbs: '1.1.3.2.1',
      discipline: 'Piping',
      area: 'Unit A - Gas Processing',
      line: 'Line 24-XX',
      plannedStart: '2026-09-10',
      plannedFinish: '2026-09-15',
      status: 'in-progress',
      plannedQuantity: 12,
      unit: 'spools',
    },
    confidence: 94,
    confidenceBracket: 'High',
    matchStatus: 'Auto-linked',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 20,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Action verb "erect" and physical scope noun "spools" directly match scheduled activity verb "Erect Line 24-XX".',
        status: 'FULL_MATCH',
        extractedToken: 'erection, spools, crane support',
        targetBaselineToken: 'Erect Spools / High Pressure Gas Header',
      },
      {
        factor: 'Area / Line',
        contribution: 30,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          'Exact isometric line tag match: "Line 24" in Unit A Gas Processing area conforms to schedule attribute Line 24-XX.',
        status: 'FULL_MATCH',
        extractedToken: 'Line 24, Unit A Gas Processing',
        targetBaselineToken: 'Line 24-XX / Unit A Piperack Bay 3',
      },
      {
        factor: 'Discipline',
        contribution: 25,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Reported discipline Piping strictly matches baseline engineering trade classification with zero boundary overlap.',
        status: 'FULL_MATCH',
        extractedToken: 'Piping',
        targetBaselineToken: 'Piping (Code: PIP)',
      },
      {
        factor: 'Context / Date',
        contribution: 9,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'Submission date 14 Sep 2026 falls directly inside active Primavera P6 baseline execution window (10 Sep – 15 Sep 2026).',
        status: 'FULL_MATCH',
        extractedToken: '2026-09-14 16:30 (Day Shift)',
        targetBaselineToken: 'Planned: 2026-09-10 to 2026-09-15',
      },
      {
        factor: 'Project / WBS',
        contribution: 10,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'WBS node 3.2.1 conforms to parent Work Package "Gas Processing Header Erection". Quantity ceiling check verified (12/12 spools).',
        status: 'PARTIAL_MATCH',
        extractedToken: 'Work Package: Unit A Header',
        targetBaselineToken: 'WBS 3.2.1 Gas Processing Piping',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'PIP-24-002',
        activityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
        wbs: '1.1.3.2.2',
        discipline: 'Piping',
        area: 'Unit A - Gas Processing',
        confidence: 71,
        matchCategory: 'MANAGER_REVIEW',
        reasons: ['Same line section (Line 24-XX)', 'Successor welding activity'],
        rejectionOrRankingReason:
          'Ranked #2: Same line section, but work verb "erect" belongs to predecessor PIP-24-001. Welding cannot precede spool alignment.',
      },
      {
        activityId: 'PIP-25-003',
        activityName: 'Erect Line 25-YY Fuel Gas Header',
        wbs: '3.3.1',
        discipline: 'Piping',
        area: 'Unit A - Fuel Gas Manifold',
        confidence: 42,
        matchCategory: 'UNMATCHED',
        reasons: ['Same discipline and work action verb'],
        rejectionOrRankingReason:
          'Ranked #3: Line identifier mismatch (Line 25-YY vs Line 24). Asset tag is mutually exclusive.',
      },
    ],
    evidenceSource: {
      id: 'EVD-002',
      title: 'Daily Progress Report - Duliajan Plant Unit A',
      filename: 'DPR_OIL_DUL_20260914.pdf',
      type: 'DPR',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-14 17:15',
      snippet: 'Spool erection completed on Line 24. 12 spools erected today with crane support.',
      url: '/evidence?id=EVD-002',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-14 17:15:32 UTC',
    processingLatencyMs: 142,
    auditHash: '0x8f3c7d1e4a9b2c3d5e6f7a8b9c0d1e2f3a4b5c6d',
  },

  // Scenario 2: Manager Review Required (Line 24 Spool Welding Partial)
  'EVT-2026-002': {
    id: 'MTC-EVT-002',
    eventId: 'EVT-2026-002',
    rawFieldStatement:
      'Line 24 spool welding completed 8 joints today. 4 joints pending radiographic clearance.',
    suggestedActivity: {
      id: 'PIP-24-002',
      name: 'Weld Line 24-XX Field Joints & NDT Clearance',
      wbs: '1.1.3.2.2',
      discipline: 'Piping',
      area: 'Unit A - Gas Processing',
      line: 'Line 24-XX',
      plannedStart: '2026-09-16',
      plannedFinish: '2026-09-20',
      status: 'delayed',
      plannedQuantity: 12,
      unit: 'joints',
    },
    confidence: 86,
    confidenceBracket: 'Review Required',
    matchStatus: 'Manager Review Required',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 18,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Work verb "welding" and scope terms "joints, radiographic" match planned activity "Weld Line 24-XX Field Joints". Deducted 2 pts for uncompleted NDT mention.',
        status: 'FULL_MATCH',
        extractedToken: 'welding, joints, radiographic',
        targetBaselineToken: 'Weld Field Joints & NDT Inspection',
      },
      {
        factor: 'Area / Line',
        contribution: 30,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          'Exact asset match on Line 24. Area corresponds to Unit A Gas Processing Piperack.',
        status: 'FULL_MATCH',
        extractedToken: 'Line 24',
        targetBaselineToken: 'Line 24-XX',
      },
      {
        factor: 'Discipline',
        contribution: 25,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Piping discipline confirmed with mechanical welding and NDT inspection sub-trades.',
        status: 'FULL_MATCH',
        extractedToken: 'Piping',
        targetBaselineToken: 'Piping (Code: PIP)',
      },
      {
        factor: 'Context / Date',
        contribution: 5,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'Execution date (16 Sep 2026) is shifted +2 days compared to target early start due to predecessor spool erection delay.',
        status: 'PARTIAL_MATCH',
        extractedToken: '2026-09-16 18:20',
        targetBaselineToken: 'Early Start: 2026-09-14',
      },
      {
        factor: 'Project / WBS',
        contribution: 8,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'Conforms to WBS 3.2.2. Score reduced by 7 pts because 4 joints carry a radiographic testing hold, requiring manager review confirmation.',
        status: 'PARTIAL_MATCH',
        extractedToken: '8 welds completed, 4 pending RT',
        targetBaselineToken: 'WBS 1.1.3.2.2 (Total: 12 joints)',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'PIP-24-001',
        activityName: 'Erect Line 24-XX High Pressure Gas Header',
        wbs: '1.1.3.2.1',
        discipline: 'Piping',
        area: 'Unit A - Gas Processing',
        confidence: 68,
        matchCategory: 'UNMATCHED',
        reasons: ['Same line section'],
        rejectionOrRankingReason:
          'Ranked #2: Predecessor erection activity already 100% physically complete on 14 Sep. Report describes welding, not erection.',
      },
    ],
    evidenceSource: {
      id: 'EVD-003',
      title: 'Shift A Certified Welder Field Log',
      filename: 'WELD_LOG_SHEET_SHIFT_A.pdf',
      type: 'Spreadsheet',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-16 18:20',
      snippet: 'Line 24 spool welding completed 8 joints today. 4 joints pending radiographic clearance.',
      url: '/evidence?id=EVD-003',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-16 18:20:14 UTC',
    processingLatencyMs: 118,
    auditHash: '0x3d7b9a1c5e4f8a2b6d0e1c3f5a7b9d2e4f6a8c0b',
  },

  // Scenario 3: Review Required (Voice Agent Tray Installation)
  'EVT-2026-003': {
    id: 'MTC-EVT-003',
    eventId: 'EVT-2026-003',
    rawFieldStatement:
      'Cable ladder tray installation done from sub to comp bay about 45 meters along overhead gallery.',
    suggestedActivity: {
      id: 'ELE-11-032',
      name: 'Cable Tray Installation - Substation to Compressor Bay',
      wbs: '1.1.4.1.2',
      discipline: 'Electrical',
      area: 'Unit A Overhead Gallery',
      line: 'Overhead Gallery',
      plannedStart: '2026-09-15',
      plannedFinish: '2026-09-22',
      status: 'in-progress',
      plannedQuantity: 320,
      unit: 'meters',
    },
    confidence: 78,
    confidenceBracket: 'Review Required',
    matchStatus: 'Manager Review Required',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 17,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Transcribed phrase "cable ladder tray installation" matches planned activity title. Deducted 3 pts for verbal transcription ambiguity.',
        status: 'FULL_MATCH',
        extractedToken: 'cable ladder tray installation',
        targetBaselineToken: 'Cable Tray Installation',
      },
      {
        factor: 'Area / Line',
        contribution: 20,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          'Corridor matched ("sub to comp bay / overhead gallery"), but exact CAD drawing tray segment tag is unmentioned in voice input.',
        status: 'PARTIAL_MATCH',
        extractedToken: 'sub to comp bay overhead gallery',
        targetBaselineToken: 'Overhead Gallery Bay 1-4 (ELE-TR-01)',
      },
      {
        factor: 'Discipline',
        contribution: 25,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Electrical discipline confirmed with power routing work package.',
        status: 'FULL_MATCH',
        extractedToken: 'Electrical',
        targetBaselineToken: 'Electrical (Code: ELE)',
      },
      {
        factor: 'Context / Date',
        contribution: 8,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'Event date 17 Sep 2026 sits within planned window (15 Sep - 22 Sep 2026).',
        status: 'FULL_MATCH',
        extractedToken: '2026-09-17 15:45',
        targetBaselineToken: 'Planned: 2026-09-15 to 2026-09-22',
      },
      {
        factor: 'Project / WBS',
        contribution: 8,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'WBS 5.1.1 verified. Docked 7 pts by rule engine due to mandatory physical photographic proof requirement not being satisfied.',
        status: 'PARTIAL_MATCH',
        extractedToken: 'Quantity: 45m (No photo proof)',
        targetBaselineToken: 'WBS 5.1.1 Substation Cable Trays',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'ELE-11-035',
        activityName: 'Instrument Cable Tray Installation - Compressor Bay',
        wbs: '5.1.3',
        discipline: 'Electrical',
        area: 'Compressor Bay Interconnect',
        confidence: 62,
        matchCategory: 'UNMATCHED',
        reasons: ['Overlapping geographic corridor'],
        rejectionOrRankingReason:
          'Ranked #2: Activity is for 24V Instrumentation trays, while transcript specifies heavy power ladder tray from substation.',
      },
    ],
    evidenceSource: {
      id: 'EVD-VOICE-001',
      title: 'Supervisor Field Audio Log (Whisper NLP Transcribed)',
      filename: 'VOICE_NOTE_SHIFT_20260917_04.wav',
      type: 'Voice',
      uploadedBy: 'Supervisor Voice Agent (Transcribed)',
      timestamp: '2026-09-17 16:00',
      snippet: 'Cable ladder tray installation done from sub to comp bay about 45 meters along overhead gallery.',
      url: '/evidence?id=EVD-VOICE-001',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-17 16:00:45 UTC',
    processingLatencyMs: 231,
    auditHash: '0x5c9f2e1a8b3d7c4f6a0e1b2d3c4e5f6a7b8c9d0e',
  },

  // Scenario 4: Unmatched (<70% Score - No baseline activity)
  'EVT-2026-004': {
    id: 'MTC-EVT-004',
    eventId: 'EVT-2026-004',
    rawFieldStatement:
      'Pipe installation completed near Unit B drain line. Grouting applied on support blocks.',
    suggestedActivity: null,
    confidence: 47,
    confidenceBracket: 'Unmatched',
    matchStatus: 'Unmatched',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 12,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Field statement contains generic work nouns ("pipe installation", "grouting") with no matching task description in P6 baseline.',
        status: 'PARTIAL_MATCH',
        extractedToken: 'pipe installation, grouting',
        targetBaselineToken: 'No Lexical Correlation in Master WBS',
      },
      {
        factor: 'Area / Line',
        contribution: 10,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          '"Unit B drain line" does not match any registered asset line number or isometric drawing in the engineering register.',
        status: 'NO_MATCH',
        extractedToken: 'Unit B drain line',
        targetBaselineToken: 'Asset Missing in Schedule Line Register',
      },
      {
        factor: 'Discipline',
        contribution: 20,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Discipline is split across Piping (pipe installation) and Civil (support block grouting). Partial credit awarded to Piping.',
        status: 'PARTIAL_MATCH',
        extractedToken: 'Piping / Civil overlap',
        targetBaselineToken: 'Discipline Split Conflict',
      },
      {
        factor: 'Context / Date',
        contribution: 5,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'No scheduled baseline activity exists in Unit B during September 2026 window.',
        status: 'NO_MATCH',
        extractedToken: '2026-09-17 17:30',
        targetBaselineToken: 'No Planned Activity Active in Area',
      },
      {
        factor: 'Project / WBS',
        contribution: 0,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'Zero points: Master schedule WBS V3 · Rev 3.2 contains no offsite drain line work package for Unit B. Possible unapproved scope addition.',
        status: 'NO_MATCH',
        extractedToken: 'Unit B Offsites Drain',
        targetBaselineToken: 'WBS Hierarchy Gap (V3 · Rev 3.2)',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'PIP-24-001',
        activityName: 'Erect Line 24-XX High Pressure Gas Header',
        wbs: '1.1.3.2.1',
        discipline: 'Piping',
        area: 'Unit A - Gas Processing',
        confidence: 34,
        matchCategory: 'UNMATCHED',
        reasons: ['Weak piping keyword similarity'],
        rejectionOrRankingReason:
          'Rejected: Different plant unit (Unit A vs Unit B) and completely different line scope.',
      },
      {
        activityId: 'CIV-11-001',
        activityName: 'Foundation Block A - Compressor Pedestal',
        wbs: '1.1.1.1.1',
        discipline: 'Civil',
        area: 'Unit A - Compressor Bay',
        confidence: 28,
        matchCategory: 'UNMATCHED',
        reasons: ['Weak grouting keyword match'],
        rejectionOrRankingReason:
          'Rejected: Foundation pour already closed; Unit B support blocks are outside scope.',
      },
    ],
    evidenceSource: {
      id: 'EVD-DIARY-1092',
      title: 'Engineer Daily Site Diary Log #1092',
      filename: 'SITE_DIARY_UNIT_B_20260917.txt',
      type: 'Field Note',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-17 17:30',
      snippet: 'Pipe installation completed near Unit B drain line. Grouting applied on support blocks.',
      url: '/evidence?id=EVD-DIARY-1092',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-17 17:30:22 UTC',
    processingLatencyMs: 98,
    auditHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
  },

  // Scenario 5: Conflict / Stoppage (Hydrostatic Test Weather Stoppage)
  'EVT-2026-005': {
    id: 'MTC-EVT-005',
    eventId: 'EVT-2026-005',
    rawFieldStatement:
      'Hydrostatic testing preparation for Line 24 section. Work paused at 11:30 due to sudden monsoon squall and missing 150 bar blind flanges from warehouse.',
    suggestedActivity: {
      id: 'PIP-24-003',
      name: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      wbs: '1.1.3.2.3',
      discipline: 'Piping',
      area: 'Unit A - Test Manifold',
      line: 'Line 24-XX',
      plannedStart: '2026-09-18',
      plannedFinish: '2026-09-20',
      status: 'at-risk',
      plannedQuantity: 1,
      unit: 'sections',
    },
    confidence: 62,
    confidenceBracket: 'Unmatched',
    matchStatus: 'Conflict',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 19,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Exact technical keywords ("hydrostatic testing", "150 bar blind flanges") match scheduled test package PIP-24-003.',
        status: 'FULL_MATCH',
        extractedToken: 'hydrostatic testing, 150 bar blind flanges',
        targetBaselineToken: 'Hydrostatic Test Section Line 24-XX (150 bar)',
      },
      {
        factor: 'Area / Line',
        contribution: 28,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          'Asset match on Line 24 test manifold. Small deduction for unverified pressure boundary boundary marker.',
        status: 'FULL_MATCH',
        extractedToken: 'Line 24 section manifold',
        targetBaselineToken: 'Line 24-XX Test Loop A',
      },
      {
        factor: 'Discipline',
        contribution: 20,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Piping QA/QC pressure testing verified.',
        status: 'FULL_MATCH',
        extractedToken: 'Piping QA/QC',
        targetBaselineToken: 'Piping (Code: PIP)',
      },
      {
        factor: 'Context / Date',
        contribution: 2,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'Major stoppage impediment: monsoon squall and zero progress achieved. Work halted before test pressurization.',
        status: 'PENALTY',
        extractedToken: 'Work paused 11:30 (Squall & Missing flanges)',
        targetBaselineToken: 'Planned: 2026-09-18 to 2026-09-20',
      },
      {
        factor: 'Project / WBS',
        contribution: -7,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'Predecessor dependency violation: Activity PIP-24-002 (Field Joint Welding) still has 8 open joints pending radiographic clearance. Hydrotest cannot proceed.',
        status: 'PENALTY',
        extractedToken: 'Predecessor PIP-24-002 Incomplete',
        targetBaselineToken: 'Strict Finish-to-Start Dependency Violation',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'PIP-24-002',
        activityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
        wbs: '1.1.3.2.2',
        discipline: 'Piping',
        area: 'Unit A - Gas Processing',
        confidence: 45,
        matchCategory: 'UNMATCHED',
        reasons: ['Predecessor activity currently active'],
        rejectionOrRankingReason:
          'Secondary candidate: This is the uncompleted prerequisite activity holding up the hydrostatic test.',
      },
    ],
    evidenceSource: {
      id: 'EVD-004',
      title: 'Inclement Weather & Supply Chain Stoppage Notice',
      filename: 'DELAY_NOTICE_WEATHER_STATION.pdf',
      type: 'Document',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-18 13:15',
      snippet: 'Work paused at 11:30 due to sudden monsoon squall and missing 150 bar blind flanges from warehouse.',
      url: '/evidence?id=EVD-004',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-18 13:15:00 UTC',
    processingLatencyMs: 165,
    auditHash: '0x7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
  },

  // Scenario 6: Verified & Approved Milestone (Compressor Pedestal Concrete Pour)
  'EVT-2026-006': {
    id: 'MTC-EVT-006',
    eventId: 'EVT-2026-006',
    rawFieldStatement:
      'Compressor foundation block A concrete pour 100% completed. 45 m3 poured with batching plant certification. Lab cube test samples taken.',
    suggestedActivity: {
      id: 'CIV-11-001',
      name: 'Foundation Block A - Compressor Pedestal',
      wbs: '1.1.1.1.1',
      discipline: 'Civil',
      area: 'Unit A - Compressor Bay',
      line: 'Bay 1',
      plannedStart: '2026-09-08',
      plannedFinish: '2026-09-14',
      status: 'completed',
      plannedQuantity: 45,
      unit: 'm3',
    },
    confidence: 96,
    confidenceBracket: 'High',
    matchStatus: 'Planner Approved',
    scoringFactors: [
      {
        factor: 'Activity keywords',
        contribution: 20,
        maxContribution: 20,
        weightPercent: 20,
        reason:
          'Exact technical terminology ("foundation block A", "concrete pour", "compressor pedestal") matches scheduled milestone CIV-11-001.',
        status: 'FULL_MATCH',
        extractedToken: 'compressor foundation block A, concrete pour',
        targetBaselineToken: 'Foundation Block A - Compressor Pedestal',
      },
      {
        factor: 'Area / Line',
        contribution: 30,
        maxContribution: 30,
        weightPercent: 30,
        reason:
          'Unit A Compressor Bay grid coordinates and foundation marker Block A strictly align with structural foundation layout.',
        status: 'FULL_MATCH',
        extractedToken: 'Unit A Compressor Bay Block A',
        targetBaselineToken: 'Block A / Compressor Pedestal Grid A1-A4',
      },
      {
        factor: 'Discipline',
        contribution: 25,
        maxContribution: 25,
        weightPercent: 25,
        reason:
          'Civil & structural engineering discipline verified with QA/QC concrete pour ticket.',
        status: 'FULL_MATCH',
        extractedToken: 'Civil / Concrete',
        targetBaselineToken: 'Civil (Code: CIV)',
      },
      {
        factor: 'Context / Date',
        contribution: 10,
        maxContribution: 10,
        weightPercent: 10,
        reason:
          'Pour was finished on scheduled target completion date (14 Sep 2026) within baseline tolerances.',
        status: 'FULL_MATCH',
        extractedToken: '2026-09-14 14:00',
        targetBaselineToken: 'Planned Finish: 2026-09-14',
      },
      {
        factor: 'Project / WBS',
        contribution: 11,
        maxContribution: 15,
        weightPercent: 15,
        reason:
          'WBS 2.1.1 quantity ceiling check 100% satisfied (45/45 m3). Batching plant lab cube test samples attached.',
        status: 'FULL_MATCH',
        extractedToken: 'Quantity: 45 m3 (100% planned)',
        targetBaselineToken: 'WBS 2.1.1 Concrete Foundations',
      },
    ],
    alternativeCandidates: [
      {
        activityId: 'CIV-11-002',
        activityName: 'Grout Compressor Bedplates & Cure',
        wbs: '2.1.2',
        discipline: 'Civil',
        area: 'Unit A - Compressor Bay',
        confidence: 54,
        matchCategory: 'UNMATCHED',
        reasons: ['Successor civil task on same pedestal'],
        rejectionOrRankingReason:
          'Ranked #2: Grouting bedplates requires 28-day concrete compressive strength curing before installation.',
      },
    ],
    evidenceSource: {
      id: 'EVD-001',
      title: 'Compressor Pedestal Foundation Pour Certificate & Batch Sheet',
      filename: 'CIV-PED-QC-20260914.pdf',
      type: 'Document',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-14 14:00',
      snippet: 'Cube test 28-day target passed 35 N/mm². 45 m3 poured with batching plant certification.',
      url: '/evidence?id=EVD-001',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: '2026-09-14 14:05:00 UTC',
    processingLatencyMs: 89,
    auditHash: '0x4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a',
  },
};

/**
 * Helper to fetch a comprehensive Match Explanation for an event ID or create a realistic model.
 */
export function getMatchExplanationForEvent(
  eventId: string,
  overrides?: Partial<MatchExplanationModel>
): MatchExplanationModel {
  const existing = MOCK_MATCH_EXPLANATIONS[eventId];
  if (existing) {
    if (overrides) {
      const merged = { ...existing, ...overrides };
      if (overrides.scoringFactors) {
        merged.confidence = calculateConfidenceFromFactors(overrides.scoringFactors);
        merged.confidenceBracket = getConfidenceBracket(merged.confidence);
      }
      return merged;
    }
    return existing;
  }

  // Fallback realistic synthesis if an arbitrary event ID is requested
  const defaultFactors: ScoringFactorItem[] = [
    {
      factor: 'Activity keywords',
      contribution: 18,
      maxContribution: 20,
      weightPercent: 20,
      reason: 'Key task actions mapped directly to schedule activity terminology.',
      status: 'FULL_MATCH',
    },
    {
      factor: 'Area / Line',
      contribution: 27,
      maxContribution: 30,
      weightPercent: 30,
      reason: 'Physical unit and pipeline corridor location match schedule bounds.',
      status: 'FULL_MATCH',
    },
    {
      factor: 'Discipline',
      contribution: 25,
      maxContribution: 25,
      weightPercent: 25,
      reason: 'Discipline strictly aligns with master schedule discipline coding.',
      status: 'FULL_MATCH',
    },
    {
      factor: 'Context / Date',
      contribution: 8,
      maxContribution: 10,
      weightPercent: 10,
      reason: 'Field event timestamp falls within planned baseline window.',
      status: 'FULL_MATCH',
    },
    {
      factor: 'Project / WBS',
      contribution: 10,
      maxContribution: 15,
      weightPercent: 15,
      reason: 'WBS node parentage verified. Quantity reported is within expected ceiling.',
      status: 'PARTIAL_MATCH',
    },
  ];

  const calculatedScore = calculateConfidenceFromFactors(defaultFactors);

  return {
    id: `MTC-${eventId}`,
    eventId,
    suggestedActivity: {
      id: 'PIP-24-001',
      name: 'Erect Line 24-XX High Pressure Gas Header',
      wbs: '1.1.3.2.1',
      discipline: 'Piping',
      area: 'Unit A - Gas Processing',
      line: 'Line 24-XX',
      plannedStart: '2026-09-10',
      plannedFinish: '2026-09-15',
      status: 'in-progress',
      plannedQuantity: 12,
      unit: 'spools',
    },
    confidence: calculatedScore,
    confidenceBracket: getConfidenceBracket(calculatedScore),
    matchStatus: calculatedScore >= 90 ? 'Auto-linked' : calculatedScore >= 70 ? 'Manager Review Required' : 'Unmatched',
    scoringFactors: defaultFactors,
    alternativeCandidates: [
      {
        activityId: 'PIP-24-002',
        activityName: 'Weld Line 24-XX Field Joints & NDT Clearance',
        wbs: '1.1.3.2.2',
        discipline: 'Piping',
        confidence: 71,
        matchCategory: 'MANAGER_REVIEW',
        reasons: ['Same line section'],
        rejectionOrRankingReason: 'Ranked #2: Predecessor erection task is active.',
      },
    ],
    evidenceSource: {
      id: 'EVD-002',
      title: 'Daily Progress Report - Duliajan Plant Unit A',
      filename: 'DPR_OIL_DUL_20260914.pdf',
      type: 'DPR',
      uploadedBy: 'Debajit Borah (Lead Site Engineer)',
      timestamp: '2026-09-14 17:15',
    },
    algorithmVersion: DEFAULT_ALGORITHM_METADATA,
    generatedTimestamp: new Date().toISOString(),
    auditHash: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    ...(overrides || {}),
  };
}
