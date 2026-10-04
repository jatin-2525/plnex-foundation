export type UserRole = 'manager' | 'engineer' | 'admin' | 'viewer';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  organization: string; // e.g. "Oil India Limited"
  avatar: string;
}

export type WBSLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

import { ActivityStatus } from '../tokens/status';
export * from '../tokens/status';

export type DisciplineType =
  | 'Civil'
  | 'Piping'
  | 'Mechanical'
  | 'Electrical'
  | 'Instrumentation';

export interface ScheduleActivity {
  id: string; // e.g., "PIP-24-001"
  activityId?: string; // canonical alias
  projectId: string;
  name: string; // "Erect Line 24-XX"
  activityName?: string; // canonical alias
  wbs: string; // "1.1.3.2.1"
  wbsLevel: WBSLevel;
  activityCode?: string;
  p6ActivityId?: string;
  discipline: DisciplineType;
  area: string; // "Unit A - Gas Processing"
  line?: string; // "Line 24-XX"
  scheduleVersion?: string;
  plannedStart: string;
  plannedFinish: string;
  actualStart?: string;
  actualFinish?: string;
  plannedProgress: number; // 0-100%
  actualProgress: number; // 0-100%
  verifiedActualProgress?: number; // authoritative canonical progress
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  variance: number; // actualProgress - plannedProgress
  status: ActivityStatus;
  delayDays: number;
  predecessors: string[];
  successors: string[];
  isCritical: boolean;
  assignedEngineer: string;
  evidenceIds: string[];
  executionEventIds: string[];
  description?: string;
  progressHistory?: any[];
}

export type MatchConfidenceCategory = 'AUTO_LINK' | 'MANAGER_REVIEW' | 'UNMATCHED';

export interface ConfidenceSignal {
  name: string;
  score: number;
  maxScore: number;
  reason: string;
}

export interface ExtractedFields {
  quantity: number;
  unit: string;
  line: string;
  area: string;
  discipline: DisciplineType;
  workType: string;
  eventDate: string;
  eventTime?: string;
  confidenceSignals: ConfidenceSignal[];
}

export interface CandidateMatch {
  activityId: string;
  activityName: string;
  discipline: DisciplineType;
  confidence: number;
  category: MatchConfidenceCategory;
  reasons: string[];
  signals: ConfidenceSignal[];
}

export interface ExecutionEvent {
  id: string;
  projectId: string;
  source: 'DPR_PDF' | 'EXCEL_SHEET' | 'SITE_DIARY' | 'FIELD_QUICK_FORM' | 'VOICE_AGENT';
  rawText: string;
  eventDate: string;
  eventTime?: string;
  quantity: number;
  unit: string;
  discipline: DisciplineType;
  area: string;
  line: string;
  workDescription: string;
  extractedFields: ExtractedFields;
  confidence: number; // 0-100
  matchCategory: MatchConfidenceCategory;
  matchedActivityId: string | null;
  matchedActivityName: string | null;
  matchedReasons: string[];
  alternativeCandidates: CandidateMatch[];
  status: 'pending-verification' | 'auto-linked' | 'pending-review' | 'approved' | 'rejected' | 'rematched';
  createdBy: string;
  createdAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  managerNotes?: string;
  evidenceIds: string[];
  offlinePendingSync?: boolean;
}

export type EvidenceType =
  | 'DPR'
  | 'Photo'
  | 'Document'
  | 'Spreadsheet'
  | 'Field Note'
  | 'Other'
  | 'PHOTO'
  | 'DPR_PDF'
  | 'SITE_DIARY'
  | 'INSPECTION_NOTE'
  | 'GPS_LOG';

export interface EvidenceItem {
  id: string;
  projectId?: string;
  projectName?: string;
  title: string;
  type: EvidenceType;
  source?: string;
  filename: string;
  fileSize: string;
  timestamp: string;
  uploader: string;
  uploaderRole?: string;
  executionEventId?: string;
  activityId?: string;
  activityName?: string;
  gpsCoords?: string;
  thumbnailUrl?: string;
  verifiedStatus: boolean;
  verificationBy?: string;
  verificationTimestamp?: string;
  status?: 'Verified' | 'Pending QC' | 'Conflict' | 'Under Investigation' | 'Rejected';
  notes?: string;
  sha256Hash?: string;
  extractedData?: {
    workType?: string;
    quantity?: number;
    unit?: string;
    line?: string;
    area?: string;
    discipline?: string;
    confidence?: number;
    rawSnippet?: string;
  };
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole | 'SYSTEM';
  action: string;
  actionCategory?:
    | 'Schedule Import'
    | 'DPR Upload'
    | 'AI Match'
    | 'Approval'
    | 'Rejection'
    | 'Progress Modification'
    | 'Evidence Upload'
    | 'Permission Changes';
  objectType: string;
  objectId: string;
  objectTitle: string;
  whatChanged?: string;
  previousValue?: string;
  newValue?: string;
  before?: string;
  after?: string;
  details: string;
}

export type ProjectScheduleHealth = 'healthy' | 'critical-slip' | 'near-critical' | 'moderate-float-loss';

export interface PortfolioProject {
  id: string;
  code: string;
  name: string;
  location: string;
  organization: string;
  contractor: string;
  projectManager: string;
  siteEngineer: string;
  startDate: string;
  targetCompletionDate: string;
  budget: string;
  overallProgress: number;
  plannedProgress: number;
  variance: number;
  delayedCount: number;
  atRiskCount: number;
  completedCount: number;
  status: 'on-track' | 'at-risk' | 'delayed' | 'completed';
  scheduleVersion?: string;
  openReviews?: number;
  openRisks?: number;
  lastUpdated?: string;
  scheduleHealth?: ProjectScheduleHealth;
}

export interface ScheduleHealthScore {
  overall: number; // e.g. 82
  schedulePerformance: number; // 90
  milestonePerformance: number; // 84
  progressVariance: number; // 76
  openRisks: number; // 78
  dataQuality: number; // 91
  trend: string;
  breakdownNotes: string[];
}

export interface DataQualityScore {
  overall: number; // e.g. 90%
  completeness: number; // 94%
  timeliness: number; // 82%
  evidenceCoverage: number; // 91%
  scheduleLinking: number; // 88%
  consistency: number; // 96%
  explanation: string[];
}

export interface ProjectMemoryCase {
  id: string;
  projectName: string;
  projectCode: string;
  discipline: string;
  plannedDurationDays: number;
  actualDurationDays: number;
  varianceDays: number;
  keyDelayCauses: string[];
  recommendedMitigation: string;
  relevanceTag: string;
}

export * from './api';
export * from './navigation';
export * from './permissions';
export * from './table';
export * from '../lib/domain/canonicalModels';
export * from '../lib/domain/dateUtils';
