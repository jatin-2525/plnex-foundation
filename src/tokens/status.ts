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
  | 'delayed'
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
        color: '#176F7A',
        bgColor: '#E2F2F4',
        borderColor: '#BCE1E5',
      };
    case 'at-risk':
      return {
        label: 'At Risk',
        color: '#845006',
        bgColor: '#FFF1D3',
        borderColor: '#F8DDA2',
      };
    case 'delayed':
      return {
        label: 'Delayed',
        color: '#A24335',
        bgColor: '#FCE8E4',
        borderColor: '#F6C7BE',
      };
    case 'completed':
      return {
        label: 'Completed',
        color: '#176B53',
        bgColor: '#E4F4EC',
        borderColor: '#BDE4D0',
      };
    case 'blocked':
      return {
        label: 'Blocked',
        color: '#8D3143',
        bgColor: '#F8E6EA',
        borderColor: '#EEC4CE',
      };
    case 'pending':
    case 'not-started':
    default:
      return {
        label: 'Pending Review',
        color: '#3B55A3',
        bgColor: '#E9EEFF',
        borderColor: '#C5D2FC',
      };
  }
}

export function getEventStatusConfig(status: EventStatus): StatusBadgeConfig {
  switch (status) {
    case 'auto-linked':
    case 'approved':
      return {
        label: 'Verified',
        color: '#176B53',
        bgColor: '#E4F4EC',
        borderColor: '#BDE4D0',
      };
    case 'pending-review':
    case 'pending-verification':
      return {
        label: 'Pending Review',
        color: '#3B55A3',
        bgColor: '#E9EEFF',
        borderColor: '#C5D2FC',
      };
    case 'rematched':
      return {
        label: 'Unmatched',
        color: '#66528F',
        bgColor: '#F0EBF8',
        borderColor: '#DACFF0',
      };
    case 'rejected':
      return {
        label: 'Blocked',
        color: '#8D3143',
        bgColor: '#F8E6EA',
        borderColor: '#EEC4CE',
      };
  }
}

export function getMatchConfidenceConfig(confidence: MatchConfidence): StatusBadgeConfig {
  switch (confidence) {
    case 'high':
      return {
        label: 'High Confidence',
        color: colors.status.success,
        bgColor: colors.status.successBg,
        borderColor: colors.status.successBorder,
      };
    case 'medium':
      return {
        label: 'Review Required',
        color: colors.status.warningText,
        bgColor: colors.status.warningBg,
        borderColor: colors.status.warningBorder,
      };
    case 'low':
    case 'unmatched':
    default:
      return {
        label: 'Unmatched',
        color: colors.status.critical,
        bgColor: colors.status.criticalBg,
        borderColor: colors.status.criticalBorder,
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
        color: colors.status.success,
        bgColor: colors.status.successBg,
        borderColor: colors.status.successBorder,
      };
    case 'neutral':
      return {
        label: 'On Schedule',
        color: colors.status.info,
        bgColor: colors.status.infoBg,
        borderColor: colors.status.infoBorder,
      };
    case 'minor':
      return {
        label: 'Minor Delay',
        color: colors.status.warningText,
        bgColor: colors.status.warningBg,
        borderColor: colors.status.warningBorder,
      };
    case 'moderate':
      return {
        label: 'Moderate Delay',
        color: colors.status.warningText,
        bgColor: colors.status.warningBg,
        borderColor: colors.status.warningBorder,
      };
    case 'severe':
      return {
        label: 'Critical Delay',
        color: colors.status.critical,
        bgColor: colors.status.criticalBg,
        borderColor: colors.status.criticalBorder,
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
