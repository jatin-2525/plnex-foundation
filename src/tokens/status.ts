import { colors } from './colors';

export type PipelineStage =
  | 'PLAN'
  | 'FIELD'
  | 'EXTRACT'
  | 'MATCH'
  | 'VERIFY'
  | 'UPDATE'
  | 'VARIANCE'
  | 'IMPACT'
  | 'ACTION';

export type ActivityStatus =
  | 'on-track'
  | 'at-risk'
  | 'forecast-late'
  | 'delayed'
  | 'completed-late'
  | 'completed'
  | 'pending'
  | 'not-started'
  | 'in-progress'
  | 'blocked';

export type EventStatus =
  | 'pending-verification'
  | 'auto-linked'
  | 'pending-review'
  | 'approved'
  | 'rejected'
  | 'rematched';

export type MatchConfidence = 'high' | 'medium' | 'low' | 'unmatched';

export type VarianceSeverity = 'positive' | 'neutral' | 'minor' | 'moderate' | 'severe';

export interface PipelineStageConfig {
  key: PipelineStage;
  label: string;
  stepNumber: number;
  description: string;
}

export const PIPELINE_STAGES: PipelineStageConfig[] = [
  { key: 'PLAN', label: 'PLAN', stepNumber: 1, description: 'Primavera/MS Project baseline schedule and L1-L6 WBS hierarchy' },
  { key: 'FIELD', label: 'FIELD', stepNumber: 2, description: 'Unstructured daily reports, site diaries, and supervisor field updates' },
  { key: 'EXTRACT', label: 'EXTRACT', stepNumber: 3, description: 'Structured execution event extraction (Activity, Quantity, Location, Date)' },
  { key: 'MATCH', label: 'MATCH', stepNumber: 4, description: 'Intelligent L5/L6 semantic and domain-rule activity matching' },
  { key: 'VERIFY', label: 'VERIFY', stepNumber: 5, description: 'Confidence scoring & human-in-the-loop review queue' },
  { key: 'UPDATE', label: 'UPDATE', stepNumber: 6, description: 'Evidence-linked actual progress & Schedule Twin synchronization' },
  { key: 'VARIANCE', label: 'VARIANCE', stepNumber: 7, description: 'Planned vs Actual deviation, start/finish variance calculation' },
  { key: 'IMPACT', label: 'IMPACT', stepNumber: 8, description: 'Downstream dependency impact and critical path delay chain analysis' },
  { key: 'ACTION', label: 'ACTION', stepNumber: 9, description: 'Actionable recovery insights and institutional project memory' },
];

export interface StatusBadgeConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export function getActivityStatusConfig(status: ActivityStatus): StatusBadgeConfig {
  switch (status) {
    case 'on-track':
    case 'in-progress':
      return {
        label: 'On Track',
        color: '#1F6B4E',
        bgColor: '#E4F1E9',
        borderColor: '#B7DAC3',
      };
    case 'at-risk':
      return {
        label: 'At Risk',
        color: '#825700',
        bgColor: '#F8EFDA',
        borderColor: '#E5C185',
      };
    case 'forecast-late':
      return {
        label: 'Forecast Late',
        color: '#825700',
        bgColor: '#F8EFDA',
        borderColor: '#E5C185',
      };
    case 'delayed':
      return {
        label: 'Delayed',
        color: '#A43B36',
        bgColor: '#F6E4E1',
        borderColor: '#DCABA7',
      };
    case 'completed-late':
      return {
        label: 'Completed Late',
        color: '#52665D',
        bgColor: '#EAF0E9',
        borderColor: '#D9E2DA',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: '#1F6B4E',
        bgColor: '#E4F1E9',
        borderColor: '#B7DAC3',
      };
    case 'blocked':
      return {
        label: 'Blocked',
        color: '#A43B36',
        bgColor: '#F6E4E1',
        borderColor: '#DCABA7',
      };
    case 'pending':
    case 'not-started':
    default:
      return {
        label: 'Pending Review',
        color: '#2C6475',
        bgColor: '#E3EEF1',
        borderColor: '#AECFD6',
      };
  }
}

export function getEventStatusConfig(status: EventStatus): StatusBadgeConfig {
  switch (status) {
    case 'auto-linked':
    case 'approved':
      return {
        label: 'Verified',
        color: '#1F6B4E',
        bgColor: '#E4F1E9',
        borderColor: '#B7DAC3',
      };
    case 'pending-review':
    case 'pending-verification':
      return {
        label: 'Pending Review',
        color: '#2C6475',
        bgColor: '#E3EEF1',
        borderColor: '#AECFD6',
      };
    case 'rematched':
      return {
        label: 'Unmatched',
        color: '#52665D',
        bgColor: '#EAF0E9',
        borderColor: '#D9E2DA',
      };
    case 'rejected':
      return {
        label: 'Blocked',
        color: '#A43B36',
        bgColor: '#F6E4E1',
        borderColor: '#DCABA7',
      };
  }
}

export function getMatchConfidenceConfig(confidence: MatchConfidence): StatusBadgeConfig {
  switch (confidence) {
    case 'high':
      return {
        label: 'High Confidence',
        color: '#1F6B4E',
        bgColor: '#E4F1E9',
        borderColor: '#B7DAC3',
      };
    case 'medium':
      return {
        label: 'Review Required',
        color: '#825700',
        bgColor: '#F8EFDA',
        borderColor: '#E5C185',
      };
    case 'low':
    case 'unmatched':
    default:
      return {
        label: 'Unmatched',
        color: '#52665D',
        bgColor: '#EAF0E9',
        borderColor: '#D9E2DA',
      };
  }
}

export function getConfidenceLevel(score: number): MatchConfidence {
  if (score >= 90) return 'high';
  if (score >= 70) return 'medium';
  return 'unmatched';
}

export function getVarianceSeverityConfig(severity: VarianceSeverity): StatusBadgeConfig {
  switch (severity) {
    case 'positive':
      return {
        label: 'Ahead of Schedule',
        color: '#1F6B4E',
        bgColor: '#E4F1E9',
        borderColor: '#B7DAC3',
      };
    case 'neutral':
      return {
        label: 'On Schedule',
        color: '#2C6475',
        bgColor: '#E3EEF1',
        borderColor: '#AECFD6',
      };
    case 'minor':
      return {
        label: 'Minor Delay',
        color: '#825700',
        bgColor: '#F8EFDA',
        borderColor: '#E5C185',
      };
    case 'moderate':
      return {
        label: 'Moderate Delay',
        color: '#825700',
        bgColor: '#F8EFDA',
        borderColor: '#E5C185',
      };
    case 'severe':
      return {
        label: 'Critical Delay',
        color: '#A43B36',
        bgColor: '#F6E4E1',
        borderColor: '#DCABA7',
      };
  }
}

export function getVarianceSeverity(daysDelay: number): VarianceSeverity {
  if (daysDelay < 0) return 'positive';
  if (daysDelay === 0) return 'neutral';
  if (daysDelay <= 2) return 'minor';
  if (daysDelay <= 5) return 'moderate';
  return 'severe';
}
